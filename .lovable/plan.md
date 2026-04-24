
# Remoção do fluxo A4

Vou remover todo o caminho de conversão A4 (formato A4 com 2 etiquetas por página via Labelary direto + montagem A4 via jsPDF), mantendo intactos os dois formatos que você usa: **Standard** e **HD (Nitidez+)**.

## O que será removido

### Arquivos deletados
- `src/hooks/conversion/useA4DirectConversion.ts` — conversão direta via Labelary com layout A4 2x1 (não usado no HD).
- `src/utils/a4Utils.ts` — funções `organizeImagesInA4PDF` (montagem A4) e helpers relacionados. **Atenção:** a função `organizeImagesInSeparatePDF` é usada pelo HD, então ela será **movida** para um novo arquivo `src/utils/pdfPageUtils.ts` (ou consolidada em `pdfUtils.ts`) antes do `a4Utils.ts` ser apagado.
- `src/config/processingConfig.ts` → remover a constante `A4_CONFIG` (manter `DEFAULT_CONFIG` e `FAST_CONFIG`). HD passará a usar `DEFAULT_CONFIG`.

### Arquivo refatorado e renomeado
- `src/hooks/conversion/useA4ZplConversion.ts` → renomeado para `src/hooks/conversion/useHdConversion.ts`.
  - Remove a função `convertToA4PDFDirect` e o roteador `convertToA4PDF`.
  - Mantém apenas `convertToHdPDF` (renomeado de forma limpa) exportando `convertToHdPDF` direto.
  - Remove imports de `useA4DirectConversion`, `A4ConversionError`, `organizeImagesInA4PDF`, `A4_CONFIG`.

### Arquivos atualizados
- `src/pages/Index.tsx`:
  - Trocar `useA4ZplConversion` por `useHdConversion`.
  - Trocar `convertToA4PDF: convertToHdPDF` por `convertToHdPDF` direto.
  - Chamada `convertToHdPDF(zplContent, true)` vira `convertToHdPDF(zplContent)`.
- `src/hooks/conversion/useA4Conversion.ts`:
  - Renomeado para `src/hooks/conversion/useHdImageConversion.ts` (é o que gera os PNGs do HD).
  - Substituir referências a `A4_CONFIG` por `DEFAULT_CONFIG`.
  - Remover o parâmetro `enhanceLabels` (HD sempre usa upscaling) — simplifica a função.
- `src/hooks/useZplConversion.ts`:
  - No tipo `ProcessingRecord`, remover `'a4'` de `processingType` (fica `'standard' | 'hd'`).
- `src/hooks/history/useHistoryFilters.ts`:
  - Remover o fallback `recordType === 'a4'` no filtro de tipo HD (registros antigos de A4 ainda existem no histórico — ver pergunta abaixo).
- `src/components/history/HistoryTableRow.tsx` e `src/components/history/HistoryCard.tsx`:
  - Remover o check `|| record.processingType === 'a4'`.

### Não será tocado
- `useZplConversion` (Standard) — intacto.
- `useServerUpscaler`, `useZplApiConversion`, `useZplValidator`, `usePdfOperations`, `useConversionState`, `useConversionMetrics`, `useProgressCalculator` — intactos.
- `FormatSelector.tsx` — continua oferecendo apenas Standard e HD (já é o caso hoje).

## Tratamento dos registros antigos no histórico

Existem possivelmente registros gravados com `processingType = 'a4'`. Eles **não serão apagados do banco**. Após a refatoração, eles aparecerão no filtro como tipo desconhecido. Tenho duas opções — me diga qual prefere:

1. **Tratar registros 'a4' antigos como 'hd' na UI** (badge HD, filtro HD inclui eles). Mantém o histórico legível.
2. **Tratar como 'standard'** (já que A4 rápido não usava upscaling).
3. **Migration SQL** que atualiza `processing_type = 'hd'` (ou `'standard'`) onde for `'a4'`.

Recomendo a **opção 1 + migration** para limpar os dados.

## Próximo passo após esta remoção

Depois desta limpeza, retomamos o plano do **seletor de tamanho de etiqueta em cm** que ficou pendente, agora muito mais simples porque só precisamos parametrizar dois caminhos (Standard e HD) em vez de quatro.
