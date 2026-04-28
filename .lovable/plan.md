## Problema identificado

A usuária reportou: *"modifiquei uma única vez as medidas, depois nunca mais apareceu a opção para voltar à anterior, tudo se converte errado agora."*

### Causa raiz

1. O componente `LabelSizeSelector` foi **ocultado via `{false && ...}`** em `src/components/ZPLPreview.tsx` (linhas 57–66), com comentário: *"Seletor de tamanho oculto temporariamente — Labelary não escala conteúdo do ZPL."*
2. **Porém**, o hook `useLabelSize` (`src/hooks/useLabelSize.ts`) continua:
   - Lendo o valor salvo no `localStorage` (chave `zpl-label-size`) na inicialização.
   - Passando esse valor para `convertToPDF` / `convertToHdPDF` em `src/pages/Index.tsx` (linhas 120 e 122).
3. **Resultado**: usuárias que mexeram no seletor antes dele ser ocultado ficaram com um tamanho personalizado salvo no `localStorage`. Como a UI sumiu, elas **não têm como voltar para `10×15 cm` (default)** — todas as conversões saem com o tamanho errado para sempre.

## Correção

Como o seletor está intencionalmente oculto até a escala via pdf-lib/jsPDF estar pronta, a conversão **nunca deveria** estar usando um valor persistido. A correção mais segura é forçar o uso do tamanho padrão enquanto a UI estiver oculta, e limpar resíduos do `localStorage`.

### Mudanças

**`src/hooks/useLabelSize.ts`**
- Sempre retornar `DEFAULT_LABEL_SIZE` (10×15 cm) — ignorar o `localStorage`.
- Na inicialização, **remover** a chave `zpl-label-size` do `localStorage` para limpar o estado corrompido das usuárias afetadas.
- `setLabelSize` vira um no-op (mantém a assinatura para não quebrar chamadores) ou apenas atualiza estado em memória sem persistir.

**`src/components/ZPLPreview.tsx`**
- Sem mudanças necessárias (o seletor já está oculto e continuará oculto).

### Quando reativar o seletor

Quando a escala via pdf-lib/jsPDF estiver implementada, basta:
1. Trocar `{false && ...}` por `{true && ...}` em `ZPLPreview.tsx`.
2. Restaurar a leitura/escrita do `localStorage` em `useLabelSize.ts`.

## Resultado esperado

- Todas as usuárias (incluindo a que reportou) voltam a ter conversões em **10×15 cm** automaticamente, sem precisar fazer nada.
- O resíduo no `localStorage` é limpo no próximo carregamento da página.