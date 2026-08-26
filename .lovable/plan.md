# Análise da tabela de erros e correções candidatas

## O que os dados mostram

Consultei `processing_errors` (com privilégio de leitura total):

- Existem **apenas 4 registros**, todos de **março/2026**, com as categorias antigas (`upload_error`, `conversion_error`).
- **Nenhum registro** desde o novo sistema de log (24/ago), mesmo com ~5.000 conversões/dia em `processing_history` nos últimos 20 dias.
- `processing_logs` está vazia (0 linhas).

Registros existentes:

| Data | Tipo | Contexto |
|---|---|---|
| 10/03, 11/03, 12/03 | `upload_error` — "The object exceeded the maximum allowed size" | HD, 74 / 92 / 74 etiquetas, 62s–119s de processamento |
| 16/03 | `conversion_error` — todos os lotes falharam | 1 etiqueta, HTTP 429 (rate limit), falhou em 16,8s |

## Correções candidatas (escolha quais fazer)

### 1. Validar por que o log não está gravando (prioridade alta)
Com 15 mil conversões nos últimos 3 dias e zero erros registrados, o mais provável é que a versão publicada em zpleasy.com ainda não contenha o novo logger (falta publicar), ou o insert esteja sendo silenciosamente rejeitado. Ação: publicar/verificar a versão em produção e adicionar um teste de fumaça (um insert forçado atrás de um parâmetro de URL, ex.: `?logtest=1`) para confirmar ponta a ponta.

### 2. PDF grande demais no upload (`storage_upload_failed`)
Causa confirmada nos 3 registros de março: o PDF final excede o limite de tamanho do bucket. Hoje não há verificação de tamanho antes do upload. Ação: medir o blob antes de enviar e, se passar do limite, dividir o PDF em partes (ex.: 40 MB por arquivo) e/ou recomprimir as imagens JPEG com qualidade menor; se ainda assim exceder, mostrar mensagem clara ("arquivo muito grande, divida o lote") em vez de erro genérico.

### 3. Backoff correto no rate limit da Labelary (HTTP 429)
Hoje o 429 espera `fallbackDelay × tentativa` (2,5s / 5s / 7,5s), ignora o cabeçalho `Retry-After` e consome as mesmas 3 tentativas do erro comum — por isso um arquivo de 1 etiqueta desistiu em 16 segundos. Ação: ler `Retry-After`, usar backoff exponencial com jitter, contar tentativas de 429 separadamente (limite maior) e pausar globalmente os lotes paralelos enquanto a API estiver limitando.

### 4. Reduzir a concorrência automaticamente ao detectar 429
Hoje sempre são 2 lotes em paralelo, independentemente do comportamento da API. Ação: ao receber o primeiro 429, cair para 1 lote por vez e aumentar o intervalo entre grupos pelo resto da execução.

### 5. Não salvar como sucesso uma conversão incompleta
Quando lotes falham, o PDF é gerado sem essas etiquetas, salvo no histórico com a contagem cheia e o usuário vê apenas um toast por lote. Ação: mostrar um aviso persistente com a quantidade real de etiquetas no PDF e gravar no histórico a contagem real (ou marcar o registro como parcial).

### 6. Abortar quando o parse não encontra etiquetas
`zpl_parse_empty` é registrado, mas o fluxo segue e gera um PDF vazio. Ação: interromper com mensagem explicando que o arquivo não tem blocos `^XA…^XZ` válidos.

### 7. Enriquecer o diagnóstico dos erros
Os registros de março não têm `zpl_format`, `label_size`, `batch_size` nem `http_status` porque vieram do código antigo. Além disso, o `upload_error` não guarda o tamanho do PDF. Ação: garantir que todo log inclua tamanho do arquivo em bytes, número de páginas geradas e tempo por etapa.

### 8. Retenção e visibilidade
Definir limpeza automática de `processing_errors` (ex.: 90 dias) e, opcionalmente, uma view agregada para consulta rápida no SQL Editor.

## Detalhes técnicos

- Itens 3 e 4: `src/hooks/conversion/useZplApiConversion.ts` (`processBatch`, `PARALLEL_BATCHES`, `config.fallbackDelay`).
- Item 2: `src/hooks/pdf/useUploadPdf.ts` + `src/hooks/conversion/usePdfOperations.ts` (checagem de tamanho antes do `storage.upload`) e `src/utils/pdfPageUtils.ts` (qualidade JPEG).
- Itens 5 e 6: `src/hooks/useZplConversion.ts` e `src/hooks/conversion/useHdConversion.ts`.
- Item 7: `src/lib/errorLogging.ts` (campos já existem na tabela; falta preencher em alguns pontos).
- Item 8: migração com job de purge, no mesmo padrão de `purge_old_processing_history`.

Diga quais números você quer implementar e eu preparo o plano de execução.
