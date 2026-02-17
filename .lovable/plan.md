

## Correcao do Upload Error no Modo HD

### Problema

O Supabase Storage tem limite padrao de **50MB por arquivo**. No modo HD (600 DPI), PDFs com muitas etiquetas ultrapassam esse limite facilmente:
- 86 etiquetas HD -> ~70-100MB
- 136 etiquetas HD -> ~100-150MB

### Solucao: Comprimir imagens PNG para JPEG antes de embutir no PDF

O formato PNG sem compressao e desnecessario para etiquetas ja renderizadas. Converter para JPEG com qualidade 85-90% reduz drasticamente o tamanho (tipicamente 5-10x menor) sem perda perceptivel de qualidade para etiquetas de envio.

### Alteracoes

#### 1. `src/utils/a4Utils.ts` - Comprimir imagens antes de adicionar ao PDF

- Criar funcao auxiliar `compressImageBlob` que converte PNG para JPEG via Canvas
- Aplicar compressao nas funcoes `organizeImagesInSeparatePDF` (HD) e `organizeImagesInA4PDF` (A4)
- Usar formato JPEG com qualidade 0.85 no `addImage` do jsPDF
- Estimativa de reducao: PDF de 100MB -> ~15-20MB

```text
Fluxo atual:
  PNG blob (600 DPI) -> dataURL (base64) -> jsPDF addImage('PNG')

Fluxo novo:
  PNG blob (600 DPI) -> Canvas -> JPEG dataURL (quality 0.85) -> jsPDF addImage('JPEG')
```

#### 2. `src/hooks/pdf/useUploadPdf.ts` - Adicionar log do tamanho do arquivo

- Logar o tamanho do PDF antes do upload para facilitar diagnostico futuro
- Adicionar tratamento especifico para o erro "exceeded maximum allowed size" com mensagem clara ao usuario

#### 3. `src/hooks/conversion/useA4ZplConversion.ts` - Mensagem de erro especifica

- Detectar o erro "exceeded the maximum allowed size" no catch de upload
- Mostrar toast informativo: "O PDF gerado e muito grande. Tente com menos etiquetas."

### Impacto

- PDFs HD com 136 etiquetas passam de ~100MB para ~15-20MB (bem abaixo do limite de 50MB)
- Qualidade visual permanece excelente para etiquetas de envio (JPEG 85%)
- Sem impacto no modo Standard/A4 que ja gera arquivos menores

### Nota sobre erros 413

Os 4 erros `conversion_error` com HTTP 413 sao do codigo de **producao** (zpleasy.com) que ainda nao tem a correcao do `^PQ`. Serao resolvidos ao publicar as alteracoes anteriores.
