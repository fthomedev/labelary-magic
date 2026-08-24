# Log de falhas no processamento de etiquetas

Objetivo: sempre que uma conversão falhar (total ou parcialmente), gravar um registro estruturado no banco para você analisar padrões e corrigir. Consulta feita direto no Supabase (SQL), sem tela nova no app. Somente metadados — nenhum conteúdo de ZPL é armazenado.

## O que será registrado

A tabela `processing_errors` já existe e será reaproveitada, com alguns campos novos de contexto:

- Tipo de erro (categoria) e mensagem
- Tipo de processamento: padrão, A4, HD
- Quantidade de etiquetas tentadas e quantas falharam
- Formato detectado do ZPL (Shopee/ML, TikTok/`^PQ`, desconhecido)
- Tamanho de etiqueta selecionado e se o modo 2 colunas estava ligado
- Se o ZPL contém imagens (`^GFA`/`^GFB`) e o tamanho do lote usado
- Status HTTP retornado pela Labelary (quando houver)
- Tempo até a falha, navegador/plataforma e versão do app

## Categorias de erro capturadas

1. `labelary_batch_failed` — um lote esgotou as tentativas na Labelary (inclui o status HTTP, ex.: 400 do caso TikTok)
2. `labelary_partial_failure` — a conversão terminou mas com lotes faltando no PDF final
3. `pdf_merge_failed` — erro ao juntar os PDFs
4. `storage_upload_failed` — erro ao enviar o arquivo para o bucket
5. `hd_upscale_failed` — falha na edge function de upscale
6. `two_column_pairing_failed` — falha ao parear etiquetas 40×25
7. `zpl_parse_empty` — arquivo aceito no upload mas sem blocos válidos após o parse
8. `unknown_fatal` — qualquer exceção não prevista no fluxo de conversão

## Como será implementado (técnico)

**Banco (migração):** adicionar a `public.processing_errors` as colunas `zpl_format text`, `label_size text`, `two_column boolean`, `has_images boolean`, `batch_size int`, `http_status int`, `failed_count int`, `app_version text`, `user_agent text` — todas anuláveis. Índices em `(created_at desc)` e `(error_type)`. RLS atual (usuário insere/lê só os próprios) é mantida; a leitura para análise é feita pelo painel do Supabase com privilégios elevados.

**Frontend:** novo hook `src/hooks/monitoring/useErrorLogger.ts` com `logProcessingError(payload)` — insere na tabela via cliente Supabase, com `user_id` da sessão, sempre em try/catch silencioso (nunca quebra ou atrasa a conversão; roda em fire-and-forget).

Pontos de instrumentação:
- `useZplApiConversion.ts` — no ponto "Batch permanently failed" e no aviso de lotes faltantes; capturar o status HTTP da última resposta da Labelary
- `useZplConversion.ts` — catch do upload e catch geral
- `useHdConversion.ts` — catches de upload e geral
- `usePdfOperations.ts` / `useUploadPdf.ts` — falha de merge e de storage
- `pdfTwoColumn.ts` (via chamador) — falha de pareamento

**Consulta:** ao final, entrego um conjunto de queries SQL prontas (top erros por tipo nos últimos 7 dias, taxa de falha por tipo de processamento, erros por formato de ZPL) para você colar no SQL Editor do Supabase.

## Fora do escopo

- Tela de admin no app
- Alertas por email
- Armazenamento de conteúdo ZPL
