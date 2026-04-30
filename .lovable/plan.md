## Problema confirmado

Arquivo TikTok (`Envio-66625575...txt`):
- **28 blocos ZPL** únicos (1× `^XA` cada — não 2× como Shopee/ML)
- Usa `^PQ<n>` para repetir a etiqueta N vezes (ex: `^PQ15`, `^PQ28`)
- Soma real: **171 etiquetas**
- Sem imagens embutidas (`^GFA` = 0)

**Bugs no código atual:**
1. `splitZPLIntoBlocks` retorna 28 blocos brutos.
2. `countZplLabels` faz `Math.ceil(28/2) = 14` → contagem errada.
3. `^PQ` é **completamente ignorado** no código (apesar da memória dizer o contrário — memória está desatualizada).
4. A Labelary recebe 28 blocos e respeita o `^PQ`, mas o backend conta/processa errado, causando inconsistência e o erro que você vê.

---

## Plano de correção

### 1. `src/utils/pdfUtils.ts` — expandir `^PQ` ao dividir blocos
Modificar `splitZPLIntoBlocks` para:
- Após split por `^XZ`, ler o `^PQ<n>,...` de cada bloco
- Substituir `^PQ<n>` por `^PQ1` no bloco
- Replicar o bloco `n` vezes no array final

Resultado: 28 blocos → 171 blocos individuais.

### 2. `src/utils/zplUtils.ts` — detectar formato e contar corretamente
Criar `detectZplFormat(zpl)`:
- **TikTok**: existe pelo menos um `^PQ<n>` com `n > 1`, OU número de `^XA` por etiqueta = 1
- **Shopee/ML**: padrão atual (2× `^XA` por etiqueta)

Ajustar `countZplLabels` / `parseZplWithCount`:
- TikTok → soma de todos os `^PQ` (ou `length` dos blocos já expandidos)
- Shopee → mantém `Math.ceil(blocks.length / 2)` (sem regressão)

### 3. Garantir compatibilidade nos pipelines
- `useZplApiConversion` (Standard), `useHdConversion`, A4 — todos consomem `parseZplBlocks`/`splitZPLIntoBlocks`, então herdam a expansão automaticamente.
- A detecção de imagens pesadas (`^GFA/^GFB`) e o batch dinâmico continuam funcionando.

### 4. Atualizar memória
Atualizar `mem://quality/centralized-label-counting-logic` para refletir a implementação real (antes estava só descrita, agora estará no código).

---

## Arquivos alterados
- `src/utils/pdfUtils.ts` — expansão `^PQ` em `splitZPLIntoBlocks`
- `src/utils/zplUtils.ts` — detecção de formato + contagem TikTok
- `mem://quality/centralized-label-counting-logic` — atualizar descrição

## Resultado esperado
- Arquivo TikTok exibe **171 etiquetas** corretamente no contador
- Conversão Standard/HD/A4 gera PDF com 171 etiquetas individuais
- Arquivos Shopee/ML continuam funcionando como antes (sem regressão)

Posso aplicar?