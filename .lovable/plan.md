## Adicionar presets 6×4 cm e 4×4 cm ao seletor de tamanho de etiqueta

Implementar os tamanhos solicitados no feedback como **presets de tamanho individuais** (cada etiqueta em sua própria página, mesmo fluxo dos presets atuais 10×15, 10×10 e 7,5×5).

### Mudanças

**1. `src/types/labelSize.ts`**
Adicionar dois presets ao array `LABEL_SIZE_PRESETS`:
- `{ id: '6x4', label: '6 × 4 cm', widthCm: 6, heightCm: 4 }`
- `{ id: '4x4', label: '4 × 4 cm', widthCm: 4, heightCm: 4 }`

**2. `src/components/format/LabelSizeSelector.tsx`**
Ajustar o grid de presets (hoje `grid-cols-4` com 3 presets + botão "Personalizado" = 4 itens). Com 5 presets + "Personalizado" = 6 itens, mudar para `grid-cols-3` para acomodar duas linhas equilibradas em mobile/desktop.

### Observações técnicas
- Os valores 6×4 e 4×4 cm (≈2,36"×1,57" e 1,57"×1,57") estão dentro do range válido (`LABEL_SIZE_MIN_CM=2.5` a `LABEL_SIZE_MAX_CM=20`), então a validação Labelary/jsPDF existente continua funcionando sem mudanças.
- Nenhuma alteração necessária em `useLabelSize`, `ZPLPreview`, `zplUtils` ou pipeline de conversão — eles consomem `widthCm`/`heightCm` genericamente.
- Sem mudanças no fluxo "2 colunas" (que é fixo em 40×25mm Mercado Livre).