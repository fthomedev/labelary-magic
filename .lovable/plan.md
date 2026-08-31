# Separar erros reais x erros causados pelo incidente de ambiente

Consultei `processing_errors` das últimas 96h e classifiquei cada registro.

## A) Consequência do incidente de infraestrutura (não são bugs do app)

Todos concentrados na janela em que o banco estava saturado pela limpeza automática (30/08 23h até 31/08 07h UTC):

| Quando (UTC) | Mensagem | Qtd |
|---|---|---|
| 31/08 03h–07h | `544 DatabaseTimeout` no upload para o Storage | 13 |
| 31/08 03h | `hd_upscale_failed` — "Unauthorized" (edge function sem resposta) | 1 |
| 30/08 23h | `storage_upload_failed` — "Failed to fetch" | 1 |

Total: **15 registros**. Depois das 07h UTC nenhum `DatabaseTimeout` reapareceu — confirma que sumiram junto com o ajuste do cron.

Ação: apagar esses registros da tabela (ou marcá-los) para não poluírem a análise de qualidade. Nenhuma mudança de código é necessária.

## B) Erros reais do produto (persistem depois do incidente)

| Causa | Qtd | Diagnóstico |
|---|---|---|
| `PDF too large for storage` (HD) | 19 | Lotes HD geram PDFs de 48–106 MB contra o limite de 45 MB. O guard aborta e o usuário fica sem arquivo. |
| `409 Duplicate / resource already exists` | 1 | Colisão de nome no path do upload. |
| `User not authenticated` | 2 | Sessão expirou durante conversões longas. |
| `storage_delete_failed` — "Failed to fetch" | 1 | Falha de rede na exclusão em massa; a varredura de órfãos cobre. |

## Correções propostas para o grupo B (escolha quais fazer)

1. **Split automático do PDF HD** — quando passar de 45 MB, dividir em partes (ex.: ~40 MB cada) e salvar múltiplos registros no histórico, em vez de abortar. Maior impacto: elimina 19 dos 23 erros reais.
2. **Path único no upload** — acrescentar sufixo aleatório ao nome do arquivo, eliminando o 409.
4. **Nada a fazer** no `storage_delete_failed` — já há aviso ao usuário e limpeza automática.

## Impacto do split no download (resposta à sua dúvida)

Sim, muda a experiência: hoje um registro do histórico = um `pdf_path` = um botão de download/impressão. Com o split, um lote vira N arquivos. Para não confundir o usuário:

- Registrar as partes como itens do histórico rotulados "Parte 1/3", "Parte 2/3"… mantendo download e impressão individuais (cada um abre no visualizador normalmente).
- Na tela de conversão, ao terminar, mostrar aviso claro: "Seu lote foi dividido em 3 arquivos por causa do tamanho" com os botões de cada parte.
- O navegador pode bloquear downloads múltiplos automáticos, então nada é baixado sozinho — o usuário clica em cada parte (isso já está alinhado com a regra de nunca disparar download automático).
- A impressão passa a ser feita por parte; não há como imprimir os 3 num clique só sem juntar o arquivo de novo (o que recriaria o problema de tamanho).

Alternativa sem split, caso prefira arquivo único: comprimir mais o HD (JPEG de qualidade menor nas páginas) e só dividir se ainda assim passar de 45 MB. Isso reduz o número de casos divididos, com leve perda de nitidez nos lotes gigantes.


## Detalhes técnicos

- Limpeza do grupo A: `DELETE` em `processing_errors` filtrando `error_message LIKE '%DatabaseTimeout%'` mais os dois registros isolados da janela do incidente.
- Item 1: `src/hooks/pdf/useUploadPdf.ts` (`MAX_PDF_UPLOAD_BYTES`, `PdfTooLargeError`), `src/utils/pdfPageUtils.ts` (geração por partes) e `src/hooks/conversion/useHdConversion.ts` (histórico com N arquivos).
- Item 2: montagem do path em `src/hooks/pdf/useUploadPdf.ts`.
- Item 3: `src/integrations/supabase/client.ts` já usa autoRefresh; a checagem entraria antes do upload nos hooks de conversão.

Diga quais itens quer implementar e se posso limpar os 15 registros do grupo A.
