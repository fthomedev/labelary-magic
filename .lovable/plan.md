# Análise dos erros e correções propostas

## O que a tabela mostra (últimos 3 dias, 19 registros)

| Grupo | Qtd | Bundle | Diagnóstico |
|---|---|---|---|
| `labelary_batch_failed` + `labelary_partial_failure` (Padrão, 02/09 12h–13h) | 10 | novo (`index-DzpVn4bO.js`) | `TypeError: Failed to fetch` nas chamadas diretas à Labelary. Lotes minúsculos (2, 4, 10 etiquetas), sem imagens — não é limite de 2 MB. Um registro trouxe `http_status: 429`; os demais nem chegaram a ler a resposta. Afetou 2 usuários, com tentativas repetidas de 14s a 140s. |
| `zpl_parse_empty` (02/09) | 5 | novo | Categoria enganosa: a mensagem é "Nenhum PDF foi gerado com sucesso (0 lotes válidos)", registrada em `usePdfOperations.ts` — é consequência do item acima, não de ZPL inválido. |
| `storage_upload_failed` — "PDF too large" (HD, 01/09, 59 MB e 105 MB) | 2 | antigo (`index-BmbN2LGx.js`) | Já corrigido pelo split automático; são de aba com bundle velho. |
| `storage_upload_failed` — "User not authenticated" (02/09 16:45) | 1 | antigo | Já corrigido por `ensureFreshSession`; também de bundle velho. |
| `storage_upload_failed` — "NetworkError" (01/09) | 1 | — | Falha de rede pontual do usuário; sem retry hoje. |

Ou seja: **um problema novo real** (falhas de rede/429 contra a Labelary a partir do navegador) e **três resíduos de bundle antigo**.

## Correções propostas

### 1. Tratar `Failed to fetch` como falha de rede/limite, não como erro comum (prioridade alta)
Hoje esse erro consome as 3 tentativas normais com backoff curto e o lote é descartado. Passar a: identificar `TypeError: Failed to fetch` como categoria própria, dar orçamento de tentativas maior (igual ao de 429), aplicar o mesmo backoff exponencial com pausa global e reduzir a concorrência para 1 assim que ocorrer — hoje isso só acontece com 429 explícito.

### 2. Proxy da Labelary via edge function (opcional, recomendado)
Com a chamada saindo do navegador, o IP é o do usuário e a resposta 429 chega sem cabeçalho CORS, virando `Failed to fetch` sem status. Uma edge function `labelary-proxy` encaminha o ZPL, devolve o PDF e expõe o status real (429/400) para o log e para o backoff. Também elimina bloqueios de rede corporativa/extensões no domínio da Labelary.

### 3. Corrigir a categoria de erro
`usePdfOperations.ts` deve registrar `labelary_all_batches_failed` (novo tipo) quando nenhum lote voltou, reservando `zpl_parse_empty` para o caso real de arquivo sem `^XA…^XZ`. Isso limpa a leitura da tabela.

### 4. Aviso claro ao usuário quando a conversão falha por rede
Hoje aparecem vários toasts por lote e ainda assim o fluxo segue. Mostrar uma mensagem única e explícita ("a API de etiquetas recusou as requisições — tente novamente em alguns minutos"), sem gerar PDF vazio.

### 5. Retry no upload em falha de rede
Duas ocorrências de `NetworkError`/`Failed to fetch` no `storage.upload`. Adicionar 2 tentativas com backoff no `uploadPDFToStorage` (o retry atual só cobre colisão de nome).

### 6. Forçar atualização de bundle antigo
Três erros de hoje/ontem vêm de abas rodando código pré-deploy. Adicionar detecção de versão (comparar o hash do build carregado com o publicado, ou registrar a versão no log e mostrar aviso de "recarregue a página") para evitar diagnósticos falsos.

### 7. Limpeza dos registros já cobertos
Apagar as 3 linhas de bundle antigo (`PDF too large` e `User not authenticated`) para a tabela refletir só o código atual.

## Detalhes técnicos

- Itens 1 e 4: `src/hooks/conversion/useZplApiConversion.ts` (`processBatch`, `MAX_RATE_LIMIT_RETRIES`, `parallelBatchesLimit`, `globalPauseUntil`).
- Item 2: nova função em `supabase/functions/labelary-proxy/index.ts` e troca da URL em `useZplApiConversion.ts`.
- Item 3: `src/hooks/conversion/usePdfOperations.ts` (linhas 40-41) + novo tipo em `src/lib/errorLogging.ts`.
- Item 5: `src/hooks/pdf/useUploadPdf.ts`.
- Item 6: `appVersion` já existe em `errorLogging.ts`; falta o aviso na UI.
- Item 7: `DELETE` filtrando `error_stack LIKE '%index-BmbN2LGx%'`.

Diga quais itens quer que eu implemente (sugestão: 1, 3, 4, 5 e 7 agora; o 2 se quiser resolver a raiz do 429).
