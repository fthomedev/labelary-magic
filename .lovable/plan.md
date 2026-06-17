## Render HD diretamente a 24 dpmm no Labelary (eliminar upscale server-side)

### O que muda

**`src/hooks/conversion/useHdImageConversion.ts`**
- Trocar `const dpmm = '8dpmm'` por `'24dpmm'`.
- Remover importação e chamada de `useServerUpscaler` — o PNG já volta nítido do Labelary.
- Remover o estágio `upscaling` do progresso: o estágio `converting` passa a ocupar 5–70%, depois vai direto para `organizing`.
- Atualizar logs (`"24dpmm native HD render"` em vez de `"8dpmm + 2x upscale"`).

**`src/hooks/conversion/useProgressCalculator.ts`**
- Ajustar `PROGRESS_RANGES.hd`: `converting` 5→70 (igual ao standard); manter `upscaling` apenas como entrada legada (`70→70`, no-op) para não quebrar outros chamadores.
- Atualizar comentário descrevendo o novo fluxo HD.

### O que NÃO muda

- A edge function `upscale-image` permanece deployada como legado (não removida nesta etapa). Pode ser descontinuada depois.
- `useServerUpscaler` continua existindo (não usado pelo fluxo HD principal).
- Comportamento de retries, semáforo de concorrência, validação de etiquetas, geração de PDF e split por páginas individuais permanecem idênticos.
- Memória `Nitidez+` continua válida: o formato segue gerando PNGs individuais em alta resolução — apenas a fonte da resolução muda (Labelary nativo em vez de NN 2x).

### Por que 24 dpmm

Labelary aceita `6/8/12/24 dpmm`. O fluxo atual (8 dpmm + NN 2x) produz a mesma quantidade de pixels de uma render a 16 dpmm — mas com pixels duplicados (Nearest Neighbor não cria informação). 24 dpmm é a próxima opção nativa e renderiza vetor→raster direto, então:

- Bordas mais limpas em códigos de barras e textos pequenos (qualidade real, não duplicação).
- Elimina 1 request por etiqueta para a edge function.
- Elimina decode/encode PNG em JS puro na edge.
- Elimina o overhead base64↔JSON em ambos os sentidos.

### Trade-offs conhecidos

- PNGs do Labelary ficam maiores em bytes (~2–4×) por terem mais pixels reais. Isso pode aumentar o tamanho final do PDF; o impacto cabe dentro dos limites atuais de split (45 MB), mas vamos monitorar.
- Caso o Labelary responda mais devagar a 24 dpmm, a percepção de tempo total ainda deve ser melhor por eliminar 1 round-trip + 1 estágio de CPU.

### Validação após mudança

1. Conferir build.
2. Rodar uma conversão HD real no preview e verificar nos logs do console: `24dpmm`, ausência de logs `SERVER UPSCALING`, e tempo total reduzido.
3. Abrir o PDF gerado e confirmar nitidez (códigos de barras e textos pequenos).
