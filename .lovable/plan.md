

## Analise de Erros e Plano de Mitigacao

### Diagnostico dos Erros Encontrados

Foram encontrados **22 erros fatais** entre 11 e 13 de fevereiro, afetando **11 usuarios distintos**.

#### Distribuicao por Tipo

| Tipo | Quantidade | Descricao |
|------|-----------|-----------|
| `conversion_error` | 21 (95%) | Todas as tentativas de conversao falharam |
| `upload_error` | 1 (5%) | Resposta HTML em vez de JSON do storage |

#### Padrao Critico Identificado

**Todos os 21 erros de conversao sao identicos**: "All X batches failed. No PDFs were generated after ~10-13s"

Isso revela que:

1. **A API Labelary esta retornando erro ou timeout consistentemente** - o tempo de ~10s sugere timeout de rede
2. **Nao ha informacao do erro real da API** - o codigo descarta a resposta HTTP quando falha, impossibilitando diagnostico
3. **Discrepancia nos dados**: `label_count_attempted` e a mensagem de erro mostram numeros diferentes (ex: attempted=7, mensagem="Labels attempted: 13"), indicando um bug no logging
4. **Sem mecanismo de fallback** - quando a API Labelary falha, o usuario fica completamente bloqueado

#### Erro de Upload (1 caso)

A mensagem `Unexpected token '<', "<html><h"... is not valid JSON` indica que o Supabase Storage retornou uma pagina HTML de erro em vez de resposta JSON. Isso ocorre tipicamente quando:
- O token de autenticacao expirou durante um processamento longo (64 segundos)
- O storage esta temporariamente indisponivel

### Plano de Melhorias

#### 1. Capturar detalhes reais do erro da API Labelary

**Arquivo**: `src/hooks/conversion/useZplApiConversion.ts`

Atualmente, quando a API retorna erro (status != 200), o codigo apenas lanca `HTTP error! status: XXX` sem capturar o corpo da resposta. Precisamos:

- Ler o body da resposta mesmo em caso de erro
- Salvar o status HTTP e corpo da resposta no metadata do erro
- Diferenciar timeout de rede vs erro HTTP vs erro de parsing

```typescript
// No catch do processBatch, capturar mais contexto:
if (!response.ok) {
  const errorBody = await response.text().catch(() => 'Could not read body');
  throw new Error(`HTTP ${response.status}: ${errorBody.substring(0, 200)}`);
}
```

#### 2. Adicionar timeout explicito nas chamadas fetch

**Arquivo**: `src/hooks/conversion/useZplApiConversion.ts`

O fetch atual nao tem timeout. Adicionar `AbortController` com timeout de 30 segundos para evitar que chamadas fiquem presas indefinidamente e permitir retry mais rapido:

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000);

const response = await fetch(url, {
  ...options,
  signal: controller.signal,
});
clearTimeout(timeoutId);
```

#### 3. Corrigir discrepancia no label_count_attempted

**Arquivo**: `src/hooks/useZplConversion.ts`

O `labelCountAttempted` esta sendo definido como `finalLabelCount` (que vem de `parseZplWithCount`), mas a mensagem de erro mostra `labels.length`. Precisamos garantir que ambos usem o mesmo valor consistente.

#### 4. Salvar contexto da API no metadata do erro

**Arquivo**: `src/hooks/conversion/useZplApiConversion.ts` e `src/hooks/useZplConversion.ts`

Quando a conversao falha, incluir no metadata:
- Status HTTP da ultima tentativa
- Corpo da resposta (truncado)
- Numero de retries feitos
- Se foi timeout ou erro HTTP

```typescript
metadata: {
  useOptimizedTiming,
  lastHttpStatus: 429,
  lastErrorBody: "Rate limit exceeded",
  retriesAttempted: 3,
  failureType: 'timeout' | 'http_error' | 'network_error'
}
```

#### 5. Renovar token antes de upload longo

**Arquivo**: `src/hooks/conversion/usePdfOperations.ts`

Para evitar o `upload_error` com resposta HTML, adicionar uma chamada `supabase.auth.getSession()` antes do upload para garantir que o token esta valido, especialmente apos processamentos longos (>30s).

#### 6. Adicionar mensagem de erro mais informativa ao usuario

**Arquivo**: `src/hooks/useZplConversion.ts`

Atualmente o toast mostra apenas a mensagem generica `t('errorMessage')`. Melhorar para mostrar orientacoes especificas:
- Se timeout: "A API de conversao esta lenta. Tente novamente em alguns minutos."
- Se rate limit: "Muitas requisicoes. Aguarde 1 minuto e tente novamente."
- Se todas falharam: "Nao foi possivel conectar ao servico. Verifique sua conexao."

### Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `useZplApiConversion.ts` | Timeout explicito, captura do body de erro, metadata detalhado |
| `useZplConversion.ts` | Corrigir label count, mensagens de erro contextuais, metadata enriquecido |
| `usePdfOperations.ts` | Renovar sessao antes de upload |

### Impacto Esperado

- **Diagnostico**: Erros futuros terao informacoes suficientes para identificar a causa raiz (status HTTP, corpo da resposta)
- **Resiliencia**: Timeout explicito evita chamadas presas e permite retry mais rapido
- **Experiencia**: Usuario recebe orientacao especifica sobre o que fazer em caso de erro
- **Dados**: Correcao da discrepancia no label_count garante metricas confiaveis

