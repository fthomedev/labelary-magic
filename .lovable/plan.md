## Objetivo

Suportar etiquetas 40×25mm do Mercado Livre impressas em **2 colunas por página** (página final 85×25mm = 40 + 5mm de gap + 40). Cada etiqueta original (40×25) é renderizada individualmente pela Labelary e depois pareada no PDF via `jsPDF`.

## UX

No `ZPLPreview`, quando o formato selecionado for **Padrão**, exibir um toggle `2 colunas (40×25mm — Mercado Livre)`. Quando ligado:

- O seletor de tamanho fica fixo em 40×25mm (já está oculto hoje, então é só forçar internamente).
- O PDF final sai com páginas 85×25mm e 2 etiquetas lado a lado.
- Se o total for ímpar, a última página fica com 1 etiqueta na coluna esquerda e a direita em branco.

O toggle não aparece nos formatos Nitidez+ nem A4 (escopo desta entrega).

## Fluxo técnico

```text
ZPL → splitZPLIntoBlocks  (já existente, já expande ^PQ)
     → Labelary POST 3.94"×0.98" PDF, 1 etiqueta por request/batch
     → resultado: N PDFs de 40×25mm, 1 página cada
     → NOVO: pairUpPdfs() usando pdf-lib
         • cria página 85×25mm
         • embute par i / i+1 em x=0 e x=45mm
     → PDF final 85×25mm com ceil(N/2) páginas
```

Diferente do fluxo HD (que usa PNGs e `jsPDF.addImage`), aqui as etiquetas vêm da Labelary já como **PDF vetorial**, então usamos `pdf-lib` (`embedPdf` + `drawPage`) para preservar nitidez. `pdf-lib` já está disponível no projeto via dependências de PDF.

## Arquivos

**Novos**
- `src/utils/pdfTwoColumn.ts` — função `pairUpPdfs(pdfBlobs: Blob[]): Promise<Blob>` que monta o PDF 85×25mm com `pdf-lib`.

**Editados**
- `src/components/ZPLPreview.tsx` — adicionar toggle "2 colunas" abaixo do `FormatSelector` quando `selectedFormat === 'standard'`.
- `src/components/format/FormatSelector.tsx` ou novo `TwoColumnToggle.tsx` — UI do switch.
- `src/hooks/useZplConversion.ts` (ou onde o pipeline Padrão monta o PDF final) — quando `twoColumn` está ligado:
  - Forçar `labelSize = { widthCm: 4, heightCm: 2.5 }`.
  - Forçar `labelsPerBatch = 1` no `useZplApiConversion` (cada PDF retornado precisa ter exatamente 1 etiqueta para pareamento determinístico).
  - Após receber os blobs, chamar `pairUpPdfs()` em vez da concatenação normal.
- `src/pages/Index.tsx` — propagar o estado `twoColumn` até o hook de conversão.
- `src/i18n/locales/pt-BR.ts` e `en.ts` — strings `twoColumnToggle`, `twoColumnHint`.

## Detalhes de implementação

**`pairUpPdfs` (pdf-lib):**
```ts
const out = await PDFDocument.create();
const pageW = mm(85), pageH = mm(25), labelW = mm(40), gap = mm(5);
for (let i = 0; i < blobs.length; i += 2) {
  const page = out.addPage([pageW, pageH]);
  const leftSrc = await PDFDocument.load(await blobs[i].arrayBuffer());
  const [left] = await out.embedPdf(leftSrc, [0]);
  page.drawPage(left, { x: 0, y: 0, width: labelW, height: pageH });
  if (blobs[i + 1]) {
    const rightSrc = await PDFDocument.load(await blobs[i + 1].arrayBuffer());
    const [right] = await out.embedPdf(rightSrc, [0]);
    page.drawPage(right, { x: labelW + gap, y: 0, width: labelW, height: pageH });
  }
}
return new Blob([await out.save()], { type: 'application/pdf' });
```

**Batch=1 obrigatório no modo 2 colunas:** se a Labelary retornar várias etiquetas em um PDF (uma por página), o pareamento por índice quebra. Forçar 1 etiqueta por request garante alinhamento determinístico — o custo é mais requests, mas mantemos o controle de paralelismo/retry que já existe em `useZplApiConversion`.

## Validação

- Arquivo 2 etiquetas → PDF 1 página com 2 etiquetas lado a lado.
- Arquivo 1101 etiquetas (com `^PQ`) → 551 páginas; última página com etiqueta só na esquerda.
- Arquivos Shopee/ML 10×15 sem o toggle → comportamento atual inalterado.

## Fora de escopo

- HD (Nitidez+) e A4 com 2 colunas — pode entrar em uma próxima iteração se o usuário pedir.
- Suporte a tamanhos custom em 2 colunas (por enquanto só 40×25 fixo).
