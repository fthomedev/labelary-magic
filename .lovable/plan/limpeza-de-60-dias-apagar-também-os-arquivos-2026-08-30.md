# Limpeza de 60 dias: apagar também os arquivos

Hoje a limpeza automática apaga o registro do histórico mas deixa o PDF no armazenamento. Levantamento atual:

- 388.107 arquivos no bucket `pdfs`
- 161.670 deles **sem** registro correspondente no histórico (órfãos)
- 163.402 com mais de 60 dias
- 1.891 registros de histórico ainda com mais de 60 dias

Causa: existem três rotinas agendadas concorrentes. Uma apaga só as linhas do histórico (sem tocar nos arquivos, executada hoje às 03:00), outra tenta apagar direto a tabela interna de arquivos do Supabase (remove só o cadastro, não o arquivo em si) e uma terceira chama uma função de servidor `purge_pdfs` que não existe neste projeto.

## O que será feito

1. **Uma única rotina de limpeza**, rodando 1x por dia, que para cada registro com mais de 60 dias:
   - apaga o arquivo PDF pela API oficial de armazenamento (em lotes de 100)
   - só então apaga o registro do histórico
   - registra na auditoria quantos registros e quantos arquivos foram removidos
2. **Varredura de órfãos**: no mesmo processo, remove arquivos do bucket `pdfs` com mais de 60 dias que não têm registro no histórico — é o que zera o passivo de 161 mil arquivos, processando em lotes a cada execução até acabar.
3. **Desligar as rotinas antigas** (a que só apaga linhas, a que mexe direto na tabela interna de arquivos e a que chama a função inexistente), deixando apenas a nova.
4. **Execução inicial manual** para começar a drenar o acúmulo, com relatório de quantos arquivos foram removidos.

A exclusão feita pelo próprio usuário (item a item ou em massa) já remove o arquivo corretamente e não muda.

## Detalhes técnicos

- Nova edge function `purge-old-files` (service role, sem `verify_jwt`), protegida por um segredo `PURGE_CRON_SECRET` enviado no header `x-cron-secret`; retorna contagens em JSON.
  - Fase A: `select id, pdf_path from processing_history where date < now() - interval '60 days' limit 500` → `storage.from('pdfs').remove(paths)` em lotes de 100 → `delete from processing_history where id in (...)`.
  - Fase B: lista o bucket `pdfs` por prefixo de usuário (`storage.from('pdfs').list`) e remove objetos com `created_at < now()-60d` cujo `name` não aparece em `processing_history.pdf_path`; teto por execução (ex.: 5.000 arquivos) para não estourar o tempo da função. Guarda o último prefixo/arquivo processado na tabela `cleanup_state` já existente, para retomar de onde parou.
  - Grava o resultado em `processing_history_purge_audit` (`deleted_count`, `retention_days`, `ran_by`).
- Migração: remover os cron jobs 2, 3 e 6; criar um único job diário (`0 2 * * *`) chamando a nova função via `pg_net.http_post` com o header do segredo. Manter as funções SQL antigas apenas se ainda forem chamadas em algum lugar; caso contrário, removê-las para não voltarem a rodar por engano.
- `supabase--storage_*` não é usado aqui: a remoção de arquivo tem de passar pela API de Storage (SQL não pode apagar objetos do bucket), por isso a lógica vive na edge function.
- Após publicar, disparar a função manualmente algumas vezes e conferir a queda no total de objetos do bucket.
