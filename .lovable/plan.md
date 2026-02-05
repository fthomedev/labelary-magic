

## Sistema de Log de Erros Fatais de Processamento

### Objetivo

Implementar um sistema para registrar apenas erros fatais - processamentos que falharam completamente e nao geraram um arquivo PDF com sucesso. Erros parciais que foram recuperados nao sao considerados.

### Abordagem Escolhida

Criar uma nova tabela `processing_errors` dedicada para erros fatais, separada do historico de sucesso. Isso permite:
- Consultas rapidas apenas de erros
- Nao poluir a tabela de historico de sucesso
- Estrutura otimizada para analise de erros

### Alteracoes no Banco de Dados

#### Nova Tabela: `processing_errors`

```sql
CREATE TABLE public.processing_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Contexto do processamento
  processing_type TEXT NOT NULL DEFAULT 'standard', -- standard, a4, hd
  label_count_attempted INTEGER, -- Quantas etiquetas tentou processar
  
  -- Detalhes do erro
  error_type TEXT NOT NULL, -- api_error, upload_error, conversion_error, etc
  error_message TEXT NOT NULL, -- Mensagem de erro legivel
  error_stack TEXT, -- Stack trace tecnico (opcional)
  
  -- Contexto tecnico
  processing_time_ms INTEGER, -- Tempo ate a falha
  metadata JSONB -- Dados adicionais (config usada, etc)
);
```

#### Politicas RLS

```sql
-- Usuarios podem ver apenas seus proprios erros
ALTER TABLE public.processing_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own errors"
  ON public.processing_errors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own errors"
  ON public.processing_errors FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

### Alteracoes no Codigo

#### 1. Novo Hook: `src/hooks/history/useErrorRecords.ts`

Cria um hook dedicado para registrar erros fatais:

```typescript
import { supabase } from '@/integrations/supabase/client';

export type ErrorType = 
  | 'api_error'      // Falha na API do Labelary
  | 'upload_error'   // Falha no upload do PDF
  | 'conversion_error' // Erro generico de conversao
  | 'validation_error'; // ZPL invalido

interface ErrorDetails {
  errorType: ErrorType;
  errorMessage: string;
  errorStack?: string;
  processingType: 'standard' | 'a4' | 'hd';
  labelCountAttempted?: number;
  processingTimeMs?: number;
  metadata?: Record<string, unknown>;
}

export const useErrorRecords = () => {
  const logFatalError = async (details: ErrorDetails) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.warn('Cannot log error: no authenticated user');
        return;
      }

      const { error } = await supabase.from('processing_errors').insert({
        user_id: user.id,
        error_type: details.errorType,
        error_message: details.errorMessage,
        error_stack: details.errorStack,
        processing_type: details.processingType,
        label_count_attempted: details.labelCountAttempted,
        processing_time_ms: details.processingTimeMs,
        metadata: details.metadata,
      });

      if (error) {
        console.error('Failed to log error to database:', error);
      } else {
        console.log('Fatal error logged successfully');
      }
    } catch (err) {
      console.error('Exception logging error:', err);
    }
  };

  return { logFatalError };
};
```

#### 2. Modificar: `src/hooks/useZplConversion.ts`

Adicionar registro de erro fatal quando a conversao falha completamente:

```typescript
// Adicionar import
import { useErrorRecords } from '@/hooks/history/useErrorRecords';

// Dentro do hook
const { logFatalError } = useErrorRecords();

// No catch do erro principal (linha ~136)
} catch (error) {
  const processingTime = Date.now() - conversionStartTime;
  
  // Registrar erro fatal no banco
  await logFatalError({
    errorType: 'conversion_error',
    errorMessage: error instanceof Error ? error.message : 'Unknown error',
    errorStack: error instanceof Error ? error.stack : undefined,
    processingType: 'standard',
    labelCountAttempted: finalLabelCount,
    processingTimeMs: processingTime,
    metadata: { config, useOptimizedTiming }
  });
  
  console.error('Conversion error:', error);
  toast({ variant: "destructive", ... });
}
```

#### 3. Modificar: `src/hooks/conversion/useA4ZplConversion.ts`

Aplicar a mesma logica para conversoes A4 e HD:

```typescript
// No catch do erro de conversao A4 (linha ~146)
} catch (error) {
  const processingTime = Date.now() - conversionStartTime;
  
  await logFatalError({
    errorType: error instanceof A4ConversionError ? 'api_error' : 'conversion_error',
    errorMessage: error instanceof Error ? error.message : 'Unknown error',
    processingType: 'a4',
    labelCountAttempted: labels.length,
    processingTimeMs: processingTime,
  });
  
  // ... toast existente
}

// Similar para HD (linha ~273)
```

### Tipos de Erro Capturados

| Tipo | Descricao | Quando Ocorre |
|------|-----------|---------------|
| `api_error` | Falha na API Labelary | API retorna erro ou timeout |
| `upload_error` | Falha no upload | Storage do Supabase falha |
| `conversion_error` | Erro generico | Excecao nao categorizada |
| `validation_error` | ZPL invalido | Conteudo ZPL corrompido |

### Dados Nao Capturados (Erros Parciais)

Os seguintes casos NAO sao registrados como erro fatal:
- Batches individuais que falharam mas foram recuperados no retry
- Rate limiting (429) que foi resolvido com backoff
- Etiquetas individuais com warnings que ainda geraram PDF

### Consulta para Analise de Erros

Exemplo de query para analisar erros:

```sql
-- Erros por tipo nos ultimos 7 dias
SELECT 
  error_type,
  processing_type,
  COUNT(*) as total,
  AVG(processing_time_ms) as avg_time_to_fail
FROM processing_errors
WHERE created_at > now() - interval '7 days'
GROUP BY error_type, processing_type
ORDER BY total DESC;
```

### Resumo das Alteracoes

| Componente | Alteracao |
|------------|-----------|
| Banco de Dados | Nova tabela `processing_errors` com RLS |
| `useErrorRecords.ts` | Novo hook para registrar erros |
| `useZplConversion.ts` | Integrar registro de erro fatal |
| `useA4ZplConversion.ts` | Integrar registro de erro fatal |
| `types.ts` | Atualizar tipos Supabase (automatico) |

