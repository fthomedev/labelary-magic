# Causa do erro

O arquivo do TikTok contém **20 etiquetas com imagens grandes embutidas** (`^GFA` com ~36 KB cada). O pipeline padrão envia todas de uma vez para a Labelary API, que retorna **HTTP 400** com a mensagem:

> "Total size of all embedded fonts and images exceeds the maximum allowed (2 MB); please reduce the size of any embedded images or fonts, or eliminate their use completely, or submit fewer labels per request"

Reproduzido em teste direto contra a Labelary:
- 15 etiquetas TikTok → OK
- 20 etiquetas TikTok → 400 (limite 2 MB excedido)

A lógica de "dynamic batch sizing" já existe para o fluxo A4 (memória `a4-dynamic-batch-sizing`), mas **não foi aplicada ao fluxo Padrão** (`useZplApiConversion.ts`), que é o que o TikTok usa.

# O que vou fazer

1. Detectar ZPLs com imagens pesadas (`^GFA` ou `^GFB`) em `useZplApiConversion.ts`.
2. Quando detectado, reduzir automaticamente o `labelsPerBatch` para um tamanho seguro (10 etiquetas), seguindo o mesmo padrão do A4.
3. Adicionar log claro no console quando o auto-ajuste acontecer, para facilitar diagnóstico.
4. Manter o comportamento atual (batches de 25–30) para ZPLs sem imagens — sem regressão de performance.

# Detalhes técnicos

**Arquivo:** `src/hooks/conversion/useZplApiConversion.ts`

- Antes de criar os batches, escanear `labels` procurando ocorrências de `^GFA` ou `^GFB`.
- Se a proporção de etiquetas com imagem for ≥ 30%, aplicar `effectiveBatchSize = Math.max(1, Math.floor(config.labelsPerBatch / 3))` com teto de 10.
- Usar `effectiveBatchSize` no loop de criação de batches (linhas 27–29).
- Logar: `🖼️ Imagens pesadas detectadas — reduzindo batch de X para Y etiquetas`.

Não mexer em `processingConfig.ts` nem no fluxo HD/A4 (que já tratam isso).

# O que NÃO vou fazer

- Não vou tentar "limpar" as vírgulas estranhas do ZPL do TikTok — testei e a Labelary aceita o formato. Não é o problema.
- Não vou aumentar retries: o erro 400 não é transitório, retry não resolve.
