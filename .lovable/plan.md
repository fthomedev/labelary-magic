## Objetivo
Permitir que o usuário, na grid do histórico, selecione todos os registros da página atual ou todos os registros do histórico inteiro, e apague tudo de uma vez (registros do banco + arquivos no Storage).

## UX

1. **Checkbox no header** (já existe) → seleciona/deseleciona todos os registros da página atual.
2. **Banner contextual estilo Gmail** logo abaixo do cabeçalho da tabela, aparece somente quando *todos da página* estão selecionados e há mais registros no histórico:
   - "Os N registros desta página estão selecionados. **Selecionar todos os X registros do histórico**"
   - Ao clicar, ativa o modo "selecionar tudo" (flag global `isAllHistorySelected`).
   - Aparece um link "Limpar seleção" para desfazer.
3. **BulkActionBar** (rodapé flutuante já existente) ganha:
   - Contador inteligente: "X selecionados" ou "Todos os X registros do histórico selecionados".
   - Botão "Excluir selecionados" abre um **novo diálogo de confirmação em massa** (`BulkDeleteConfirmDialog`) que mostra o total exato e avisa que arquivos serão removidos permanentemente.

## Backend (migration)

Nova função RPC `delete_processing_history_bulk(record_ids uuid[], delete_all boolean DEFAULT false)`:
- `SECURITY DEFINER`, `SET search_path = public, pg_temp`.
- Valida `auth.uid()`.
- Se `delete_all = true`: ignora `record_ids` e apaga **todos** os registros do usuário atual.
- Se `delete_all = false`: apaga apenas os IDs informados que pertencem a `auth.uid()`.
- Apaga os objetos correspondentes em `storage.objects` (bucket `pdfs`) cujo `name` esteja em `pdf_path`.
- Retorna `json` com `{ success, deleted_count, deleted_paths[] }`.
- `REVOKE EXECUTE ... FROM PUBLIC` e `GRANT EXECUTE ... TO authenticated`.

Para o storage do bucket `pngs` (que também guarda páginas), nada muda: o cleanup de PDFs/PNGs continua via `pdf_path`. Se houver `pdf_path` de PNG/ZIP, é removido normalmente.

## Frontend

- `useHistorySelection`: adicionar estado `isAllHistorySelected` (boolean), ações `selectAllHistory()` e ajustar `clearSelection()` para resetar a flag. `selectedCount` passa a refletir `totalRecords` quando `isAllHistorySelected`.
- `HistoryTable`: nova prop opcional para renderizar o banner "selecionar todos os X" quando `allPageSelected && totalRecords > pageSize && !isAllHistorySelected`.
- `BulkActionBar`: nova prop `isAllHistorySelected`, label muda de acordo; chama `onBulkDelete` sempre, parent decide rota.
- `ProcessingHistory`:
  - Substitui o `handleBulkDelete` atual (que abria o diálogo de delete único em loop) por:
    1. Abre `BulkDeleteConfirmDialog`.
    2. No confirm, chama `supabase.rpc('delete_processing_history_bulk', { record_ids, delete_all })`.
    3. Tenta também `supabase.storage.from('pdfs').remove(deleted_paths)` como fallback caso o lado SQL não tenha permissão direta no storage.
    4. `refreshData()` e `clearSelection()`; toast de sucesso/erro.
- Novo componente `src/components/history/BulkDeleteConfirmDialog.tsx` (baseado no `DeleteConfirmDialog`) com mensagem clara: "Esta ação apagará permanentemente N registros e todos os arquivos associados. Não pode ser desfeita."

## i18n

Adicionar em `pt-BR.ts` e `en.ts`:
- `bulkActions.selectAllHistory` ("Selecionar todos os {{count}} registros do histórico")
- `bulkActions.allHistorySelected` ("Todos os {{count}} registros estão selecionados")
- `bulkActions.clearSelection` ("Limpar seleção")
- `bulkActions.confirmBulkDeleteTitle` / `confirmBulkDeleteMessage`
- `bulkActions.bulkDeleteSuccess` / `bulkDeleteError`

## Arquivos afetados

- `supabase/migrations/<new>.sql` (nova função + grants)
- `src/hooks/history/useHistorySelection.ts`
- `src/hooks/history/useHistoryDelete.ts` (nova função `bulkDelete`)
- `src/hooks/useProcessingHistory.ts` (exportar nova handler)
- `src/components/history/HistoryTable.tsx` (banner)
- `src/components/history/BulkActionBar.tsx`
- `src/components/history/BulkDeleteConfirmDialog.tsx` (novo)
- `src/components/ProcessingHistory.tsx` (orquestração)
- `src/i18n/locales/pt-BR.ts` e `en.ts`

## Segurança

A RPC roda em `SECURITY DEFINER` mas filtra estritamente por `auth.uid()`, então o usuário só consegue apagar seus próprios registros, mesmo se manipular o array de IDs. A remoção do storage também é feita pelo path retornado do banco (já filtrado por user), evitando exclusão arbitrária.
