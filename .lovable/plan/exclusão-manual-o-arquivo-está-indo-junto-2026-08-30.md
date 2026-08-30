# Exclusão manual: o arquivo está indo junto?

## Resposta curta

Sim, o código tenta apagar o PDF junto — mas hoje **falha em silêncio** em alguns casos, e aí o arquivo vira órfão (só sumindo depois pela rotina automática, que só olha arquivos com mais de 60 dias).

Como está hoje:

- Exclusão de **um registro** (`useHistoryDelete`): apaga a linha via função do banco e depois chama a API de Storage para remover o `pdf_path`. Se o Storage der erro, o código apenas escreve no console e mostra "excluído com sucesso" mesmo assim.
- Exclusão em **massa** (`ProcessingHistory.performBulkDelete`): a função do banco devolve os caminhos apagados e o app manda **todos de uma vez** para `storage.remove(...)`, sem dividir em lotes e dentro de um `try/catch` que só faz `console.warn`. Em "Limpar histórico" com centenas/milhares de registros, essa chamada única tende a falhar (payload grande / timeout) e **nenhum** arquivo é removido, apesar de os registros sumirem.

Ou seja: no caso comum funciona; no caso de limpeza grande ou erro de rede, gera órfãos.

## O que fazer

1. **Remoção em lotes**: dividir os caminhos em blocos de 100 e enviar poucos blocos em paralelo (mesmo padrão já usado na função `purge-old-files`), tanto na exclusão única quanto na em massa.
2. **Parar de engolir erro**: contar quantos arquivos falharam; se houver falha, o toast passa a dizer que os registros foram apagados mas alguns arquivos serão removidos pela limpeza automática (em vez de "sucesso" puro).
3. **Registrar a falha**: gravar em `processing_errors` um evento `storage_delete_failed` com quantidade tentada, quantidade falhada e mensagem — assim dá para acompanhar pelo mesmo painel de erros já existente.
4. **Rede de segurança imediata**: hoje a varredura de órfãos só considera arquivos com mais de 60 dias. Reduzir esse critério para arquivos órfãos com mais de 1 dia (arquivo sem nenhum registro de histórico correspondente), para que qualquer sobra de exclusão manual seja limpa no dia seguinte em vez de ficar 60 dias ocupando espaço.

## Detalhes técnicos

- `src/components/ProcessingHistory.tsx`: extrair a limpeza de Storage para um helper compartilhado com chunk de 100 e concorrência 5; usar o retorno para decidir a mensagem do toast.
- `src/hooks/history/useHistoryDelete.ts`: usar o mesmo helper e propagar o resultado para o toast.
- Novo helper em `src/lib/` (ex.: `storageCleanup.ts`) com `removeStoragePaths(bucket, paths)` retornando `{ removed, failed, errors }`.
- Log via `src/lib/errorLogging.ts` (tipo novo `storage_delete_failed`).
- Migração leve na função `list_purgeable_pdf_objects`: aplicar o corte de idade só para arquivos órfãos (`> 1 dia`), mantendo a fase de histórico vencido em 60 dias. Sem mudança de schema.
- i18n: novas chaves para o aviso de "arquivos serão removidos pela limpeza automática" em `pt-BR.ts` e `en.ts`.
