
## Retry Automatico no Upload de PDF ao Supabase Storage

### Problema
Erros temporarios do Supabase Storage (ex: respostas HTML em vez de JSON) causam falha no upload sem tentativa de recuperacao. Isso resulta em perda do trabalho de conversao do usuario.

### Solucao
Implementar retry com backoff exponencial no `useUploadPdf.ts`, com ate 3 tentativas para erros transientes.

### Detalhes Tecnicos

**Arquivo:** `src/hooks/pdf/useUploadPdf.ts`

1. Criar funcao auxiliar `uploadWithRetry` que encapsula a chamada `supabase.storage.upload`
2. Configuracao:
   - Maximo de 3 tentativas
   - Backoff exponencial: 1s, 2s, 4s entre tentativas
   - Renovar sessao auth antes de cada retry (previne token expirado)
3. Erros que disparam retry (transientes):
   - Respostas HTML (indicam indisponibilidade temporaria)
   - Erros de rede / fetch failed
   - HTTP 500, 502, 503, 504
4. Erros que NAO disparam retry (permanentes):
   - "exceeded maximum allowed size" (arquivo grande demais)
   - HTTP 401/403 (autenticacao)
   - Qualquer erro de tamanho
5. Logging de cada tentativa para diagnostico futuro

```text
Fluxo:
  Tentativa 1 -> falha transiente -> aguarda 1s
  Tentativa 2 -> falha transiente -> aguarda 2s  
  Tentativa 3 -> falha transiente -> lanca erro final
```

Nenhuma outra alteracao necessaria -- o retry e transparente para os consumers (`usePdfOperations`, `useA4ZplConversion`).
