

## Problema identificado

O arquivo do TikTok (`Envio-66625575-Etiquetas-de-produtos.txt`) tem **uma estrutura diferente da esperada**:

**Estrutura do arquivo:**
- Apenas **28 blocos `^XA...^XZ`** (etiquetas únicas)
- Mas usa o comando **`^PQ<n>`** para indicar que cada etiqueta deve ser **impressa N vezes** (quantidade do pedido)
- Soma total real: **171 etiquetas** (ex: `^PQ15`, `^PQ28`, `^PQ20`, etc)
- **Sem imagens embutidas** (`^GFA/^GFB` = 0)

**Por que dá erro:**
1. O `splitZPLIntoBlocks` retorna **28 blocos**.
2. O contador faz `Math.ceil(28 / 2) = 14` → conta **14 etiquetas erradas** (a divisão por 2 assume que cada etiqueta tem 2 `^XA`, o que vale para Shopee/ML mas **não para TikTok**).
3. Mais grave: ao enviar para a Labelary, o pipeline **ignora os `^PQ`** — o usuário esperava 171 etiquetas e receberia apenas 28 (ou 14 contadas).
4. Dependendo de como a Labelary interpreta os `^PQ` em modo batch, pode retornar erro HTTP ou PDF inconsistente, causando a falha que você está vendo.

**Causa raiz:** o sistema assume que todo arquivo ZPL segue o padrão Shopee/ML (2× `^XA` por etiqueta, sem `^PQ`). Arquivos do TikTok seguem outro padrão (1× `^XA` + `^PQ<n>`).

---

## Plano de correção

### 1. Detectar formato do arquivo automaticamente em `src/utils/zplUtils.ts`
Criar uma função `detectZplFormat(zpl)` que retorna:
- `'tiktok'` quando há `^PQ` com valores > 1 e o número de `^XA` é "ímpar/sem duplicação"
- `'shopee'` (padrão atual) caso contrário

### 2. Expandir blocos `^PQ` em `splitZPLIntoBlocks` (ou nova função `expandZplBlocks`)
Para cada bloco com `^PQ<n>,...`:
- Ler o `n` (quantidade)
- Substituir por `^PQ1` (para não duplicar no servidor)
- Replicar o bloco `n` vezes no array final

Assim, 28 blocos com `^PQ` somando 171 viram **171 blocos individuais** prontos para a Labelary.

### 3. Ajustar contagem em `countZplLabels` / `parseZplWithCount`
- Formato **TikTok** → `labelCount = soma dos ^PQ` (sem dividir por 2)
- Formato **Shopee** → mantém `Math.ceil(blocks.length / 2)` (comportamento atual)

### 4. Atualizar memória `Label Counting Logic`
Documentar o novo suporte ao formato TikTok com `^PQ`.

### 5. Aplicar a mesma lógica de expansão também no fluxo HD/A4
Os hooks `useHdConversion` e similares usam `parseLabelsFromZpl` — usarão automaticamente os blocos expandidos.

---

## Arquivos a alterar
- `src/utils/zplUtils.ts` — detecção de formato + contagem correta
- `src/utils/pdfUtils.ts` — função `splitZPLIntoBlocks` passa a expandir `^PQ`
- `mem://quality/centralized-label-counting-logic` — documentar suporte TikTok

## Resultado esperado
Ao subir o arquivo do TikTok:
- Contador exibirá **171 etiquetas** (correto)
- A conversão gerará um PDF com **171 etiquetas individuais**
- Sem erro HTTP da Labelary

Posso aplicar essa correção?

