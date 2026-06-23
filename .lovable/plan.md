## Objetivo
Tornar o checkbox de seleção das linhas do histórico mais perceptível, sem alterar o estilo das linhas.

## Alterações propostas
1. **Aumentar contraste do checkbox não selecionado**
   - Substituir a borda `border-primary` por `border-foreground/50` (ou `border-muted-foreground`) no estado não marcado.
   - Manter `data-[state=checked]:bg-primary` e `data-[state=checked]:text-primary-foreground` para preservar a identidade visual do tema.

2. **Melhorar visibilidade geral do checkbox**
   - Aumentar ligeiramente o tamanho de `h-4 w-4` para `h-5 w-5` na coluna do histórico (header e rows).
   - Garantir que o checkbox do header (`HistoryTable.tsx`) e das linhas (`HistoryTableRow.tsx`) usem a mesma classe customizada para consistência.

3. **Adicionar realce de foco**
   - Reforçar o `focus-visible:ring-ring` para que, ao navegar por teclado, o checkbox fique evidente.

## Arquivos a alterar
- `src/components/ui/checkbox.tsx` — ajuste do estilo base do componente para melhor contraste.
- `src/components/history/HistoryTable.tsx` — aplica tamanho/estilo no checkbox do header.
- `src/components/history/HistoryTableRow.tsx` — aplica tamanho/estilo no checkbox da linha.

## Fora de escopo
- Não serão alterados: cores do tema, layout das linhas, comportamento de seleção/bulk delete, textos de i18n.
