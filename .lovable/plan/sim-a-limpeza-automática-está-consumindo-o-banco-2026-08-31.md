# Sim: a limpeza automática está consumindo o banco

## O que os dados mostram

- O cron `purge-old-files` roda **a cada 10 minutos** e, em toda execução, apaga 300 registros de histórico + **1300 arquivos** do bucket (últimas execuções: 15:30, 15:40, 15:50, 16:00, 16:10 — todas no teto).
- O bucket `pdfs` ainda tem **332.277 objetos** e o histórico **220.599 linhas** (`storage.objects` = 538 MB). Ou seja, o acúmulo é muito maior do que o estimado e a rotina vai continuar no teto por dias.
- Cada execução faz uma varredura em `storage.objects` procurando órfãos (`NOT EXISTS` contra `processing_history`) e depois 1300 deleções via API de Storage — que apagam linhas de `storage.objects` e disparam IO de disco. Isso casa com o painel: CPU 85%, Disk IO 77%, Compute 85%.
- Também houve 16 execuções de cron **falhando** entre 10:20 e 12:50 (retentativas), agravando o pico.

Conclusão: a mudança de ontem (purga a cada 10 min + varredura de órfãos reduzida para 1 dia) é a causa do consumo. Não é o app de conversão.

## Plano de correção

1. **Parar o sangramento agora**: desativar o job `purge-old-files` (`cron.alter_job(..., active := false)`) para o banco respirar e a aplicação voltar.
2. **Religar em ritmo seguro**: reagendar para **1x por hora, na janela de baixa demanda (03:00–07:00 UTC)**, em vez de 24h por dia a cada 10 min.
3. **Reduzir o custo de cada execução**:
   - `ORPHAN_BATCH` de 1000 → 300 e `HISTORY_BATCH` de 300 → 150.
   - Baixar a concorrência de deleção do Storage de 5 → 2 chamadas paralelas.
   - Adicionar `statement_timeout` curto na varredura de órfãos para nunca segurar o banco.
4. **Tornar a varredura barata**: hoje `list_purgeable_pdf_objects` percorre `storage.objects` inteira toda vez. Passar a paginar por `created_at` (keyset, do mais antigo para o mais novo) usando o índice existente, em vez de reavaliar 332 mil linhas por execução.
5. **Voltar o corte de órfãos para algo conservador** (7 dias em vez de 1 dia), para não competir com arquivos recém-criados durante uma conversão em andamento.
6. **Remover o job legado** `purge_history_and_storage_older_than_60d_daily` (jobid 2), que hoje só chama uma função no-op.

Com isso o backlog é drenado gradualmente (algumas semanas, em horário ocioso) em vez de derrubar o projeto.

## Detalhes técnicos

- Migração: `cron.unschedule('purge_history_and_storage_older_than_60d_daily')`, `cron.alter_job` do job 9 para `0 3-7 * * *`, e recriação de `list_purgeable_pdf_objects` com paginação por `created_at` + `SET statement_timeout`.
- `supabase/functions/purge-old-files/index.ts`: novos valores de `HISTORY_BATCH`, `ORPHAN_BATCH`, `REMOVE_CONCURRENCY` e do parâmetro de retenção de órfãos.
- Nenhuma mudança no fluxo de conversão ou na exclusão manual (que já apaga arquivo + registro em lotes).
