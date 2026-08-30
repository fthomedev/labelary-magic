# Ações em massa do histórico: barra fixa no rodapé → dentro do card

## Problema

A barra "3 selecionado(s) / Baixar / Excluir" hoje é uma pílula fixa no rodapé da janela,
centralizada na tela inteira. Isso cria dois incômodos:

- ela flutua longe do card de histórico (aparece por cima do conteúdo da coluna esquerda),
  parecendo um elemento solto na interface;
- quem quer apagar o histórico inteiro precisa primeiro marcar a caixa do cabeçalho, depois
  achar o link "selecionar todos" e só então descer os olhos até o rodapé da janela.

## O que será feito

1. **Trazer a barra para dentro do card de histórico.** Ela passa a ficar logo abaixo do
   título "Histórico de Processamento", grudada no topo enquanto a lista rola (sticky),
   ocupando a largura do card, com fundo destacado. Sai a pílula flutuante do rodapé.
2. **Ação de apagar tudo sempre visível.** No cabeçalho do card entra um botão discreto
   "Limpar histórico" (ícone de lixeira + texto), disponível mesmo sem nada selecionado.
   Ele abre a mesma confirmação de exclusão total já existente.
3. **Fluxo de seleção mais direto.** Quando o usuário marca a caixa do cabeçalho e existem
   mais registros do que os da página, a própria barra passa a oferecer "Selecionar todos os
   N registros" — em vez da faixa separada acima da tabela, que hoje duplica a informação.
4. **Mobile.** Na visualização em cards a barra também fica no topo da lista, dentro do card,
   com os botões em largura cheia para não espremer o texto.
5. Nada muda na lógica de exclusão: a mesma função de exclusão em massa, a mesma janela de
   confirmação e a mesma limpeza de arquivos continuam sendo usadas.

## Detalhes técnicos

- `src/components/history/BulkActionBar.tsx`: remove `fixed bottom-4 ... z-50` e o
  `AnimatePresence` de deslize vertical vira uma expansão de altura/opacidade in-flow.
  Passa a receber `totalRecords`, `hasMoreRecords` e `onSelectAllHistory` para exibir o
  atalho "selecionar todo o histórico" dentro da própria barra.
- `src/components/ProcessingHistory.tsx`: move `<BulkActionBar />` para logo após o
  `CardHeader` (antes de `HistoryStats`), envolto em um wrapper `sticky top-0 z-20`;
  adiciona o botão "Limpar histórico" no `CardTitle`, que chama `selectAllHistory()` seguido
  de `setBulkDeleteOpen(true)`.
- `src/components/history/HistoryTable.tsx`: remove a faixa `showBanner` (a mensagem migra
  para a barra) e as props `isAllHistorySelected`/`onSelectAllHistory`/`onClearSelection`
  que só serviam a ela.
- i18n (`pt-BR.ts` / `en.ts`): nova chave `bulkActions.clearAllHistory` ("Limpar histórico" /
  "Clear history"); as demais chaves de `bulkActions` continuam válidas.
- Validação: rodar o app no Playwright, selecionar registros e conferir por screenshot que a
  barra aparece dentro do card e que o botão de limpar histórico abre a confirmação.
