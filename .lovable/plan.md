# Corrigir fechamento abrupto do painel "Custom" no seletor de tamanho

## Problema

Ao abrir a opção **Custom** no seletor de tamanho da etiqueta, digitar a **largura** e clicar na **altura**, o painel de inputs desaparece (o modo volta para um preset). O usuário perde o foco e não consegue terminar de digitar a altura.

## Causa

No `LabelSizeSelector.tsx`:

1. Cada input chama `commitCustom` no `onBlur`, que dispara `onChange` para o pai com o novo `LabelSize`.
2. Um `useEffect` observa `value` e re-executa `matchPresetId(value)`. Se o novo par largura/altura coincidir com um preset (ex.: usuário em Custom com 10×15, ou digita 10×10 que é preset), `selectedId` muda de `'custom'` para o id do preset.
3. Como o bloco dos inputs está condicionado a `selectedId === 'custom'`, ele **desmonta** no meio da interação — fechando o painel antes do segundo campo receber o foco.

Há também um detalhe relacionado: o erro de runtime `Failed to execute 'removeChild'` é compatível com esse desmonte abrupto durante transição de foco.

## Correção

Tornar o modo "Custom" **sticky**: uma vez que o usuário entrou em Custom, o painel só sai dali se ele clicar explicitamente em outro preset.

### Mudanças em `src/components/format/LabelSizeSelector.tsx`

1. **Não sincronizar `selectedId` automaticamente quando o usuário está em Custom.**
   Substituir o `useEffect` que faz `setSelectedId(matchPresetId(value))` por uma lógica que:
   - Só atualiza `selectedId` a partir de `value` se o `selectedId` atual **não** for `'custom'`.
   - Mantém o usuário em Custom mesmo se a combinação largura/altura coincidir com um preset.

2. **Ao clicar em "Custom", inicializar os inputs com o valor corrente uma única vez** (já existe), mas garantir que cliques subsequentes em "Custom" não resetem os campos enquanto o usuário edita.

3. **Evitar `commitCustom` redundante**: só chamar `onChange` se o valor realmente mudou e for válido, reduzindo re-renders que possam interferir no foco.

4. **(Opcional, defensivo)** Trocar `onBlur` por commit em `onChange` com debounce curto OU manter `onBlur` mas envolver o commit em `requestAnimationFrame` para não competir com a transição de foco entre inputs. Manter `onBlur` é suficiente após a correção #1.

Nenhuma outra parte do app precisa mudar — `useLabelSize`, `Index.tsx` e os hooks de conversão continuam recebendo `LabelSize` normalmente.

## Resultado esperado

- Abrir "Custom", digitar largura, clicar em altura, digitar altura → painel permanece aberto durante toda a edição.
- Valores são commitados ao sair de cada campo, sem fechar o painel.
- O painel só sai do modo Custom quando o usuário clicar em um dos botões de preset.
