

## Correções para Erros de Processamento

### Problema 1: Limite de 2MB da Labelary no modo Standard

Etiquetas com imagens embutidas (como logos em base64) excedem o limite de 2MB da API Labelary. O modo A4 Direct ja trata isso com batch splitting automatico, mas o modo Standard nao.

**Correcao em `src/hooks/conversion/useZplApiConversion.ts`:**
- Detectar erro HTTP 400 com mensagem "exceeds the maximum allowed (2 MB)" 
- Quando detectado, reduzir o batch automaticamente pela metade e re-tentar
- Se batch ja for 1 label, propagar erro com mensagem clara ao usuario

### Problema 2: Sessao expirando durante processamento Standard

O upload no modo Standard nao renova a sessao auth antes de fazer o upload. Processamentos longos (30s+) podem ter o token expirado.

**Correcao em `src/hooks/conversion/usePdfOperations.ts`:**
- Adicionar `supabase.auth.getSession()` antes do upload (mesmo padrao ja usado no retry de `useUploadPdf.ts`)

### Problema 3: PDF HD muito grande (363 etiquetas = 57MB)

A compressao JPEG 0.85 nao e suficiente para volumes altos em HD. Duas abordagens complementares:

**Correcao em `src/utils/a4Utils.ts`:**
- Reduzir qualidade JPEG para 0.75 no modo `organizeImagesInSeparatePDF` (HD) - reduz ~30% adicional no tamanho
- Manter 0.85 no A4 que ja gera arquivos menores

**Correcao em `src/hooks/conversion/useA4ZplConversion.ts`:**
- Antes do upload, verificar o tamanho do blob
- Se exceder 45MB, dividir em multiplos PDFs menores e fazer upload separado de cada parte
- Salvar no historico como um unico registro apontando para o primeiro PDF

### Problema 4: Mensagem de erro contextual para 2MB

Quando uma etiqueta individual excede 2MB (impossivel dividir mais), o usuario precisa de orientacao clara.

**Correcao em `src/hooks/useZplConversion.ts`:**
- Adicionar tratamento para `failureType: 'http_error'` com mensagem especifica quando o erro menciona "2 MB"
- Toast: "Uma ou mais etiquetas contêm imagens muito grandes. Reduza o tamanho das imagens embutidas no ZPL."

### Detalhes Tecnicos

**Arquivo: `src/hooks/conversion/useZplApiConversion.ts`**
- Na funcao `processBatch`, adicionar tratamento para HTTP 400 com "exceeds the maximum"
- Retornar um novo tipo de erro `image_size_limit` para que o caller possa re-dividir o batch
- Se o batch ja tiver apenas 1 label, retornar `null` com contexto de erro especifico

**Arquivo: `src/hooks/conversion/usePdfOperations.ts`**  
- Importar `supabase` client
- Chamar `await supabase.auth.getSession()` antes de `uploadPDFToStorage()`

**Arquivo: `src/utils/a4Utils.ts`**
- Na funcao `organizeImagesInSeparatePDF`: alterar qualidade JPEG de 0.85 para 0.75
- Manter `organizeImagesInA4PDF` com 0.85 (A4 gera arquivos menores)

**Arquivo: `src/hooks/useZplConversion.ts`**
- No bloco catch de `conversion_error`, adicionar condicao para `http_error` com mensagem sobre imagens

### Impacto Esperado

- Erro de 2MB: etiquetas com imagens serao processadas com batch menor (1 por vez se necessario)
- Erro de auth: sessao renovada antes do upload, eliminando "User not authenticated"
- PDF HD grande: qualidade 0.75 reduz ~57MB para ~40MB; split automatico para volumes extremos
- Mensagens de erro claras e acionaveis para o usuario

