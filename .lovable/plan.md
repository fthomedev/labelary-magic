
# Melhorar progresso visual do modo HD

## Problema identificado

No modo HD existem 3 fases que atualizam a barra de progresso:

1. **Converting** (5% → 45%) — texto: "Convertendo X/N etiquetas..."
2. **Upscaling** (45% → 70%) — texto: "Melhorando X/N etiquetas..."
3. **Organizing/Uploading** (70% → 95%)

O usuário percebe um "reinício" porque:

- O **contador de etiquetas reseta de N/N para 1/N** ao mudar de fase (converting → upscaling), mesmo que a barra geral continue avançando.
- O **ETA salta para cima** (de "Finalizando..." para vários segundos) porque é calculado como `(totalLabels - currentLabel) * tempoPorEtiqueta` e `currentLabel` volta a 1 no upscaling.
- A transição visual cai em 45% (no meio da barra), o que torna o "salto de texto" muito perceptível.

## Solução proposta

Tornar o progresso **contínuo e auto-explicativo**, deixando claro ao usuário que existem **etapas** sem que pareça um reinício.

### 1. ETA contínuo entre fases (correção principal)

Em `ProgressBar.tsx`, calcular o ETA com base no **percentual global da barra** (`progress`), não em `currentLabel/totalLabels`:

- Calibrar tempo total estimado para HD (já temos `TIME_PER_LABEL.hd = 0.93s`).
- ETA = `tempoTotalEstimado * (1 - progress/100)`.
- Isso elimina o salto do ETA na transição converting→upscaling.

### 2. Mensagem de etapa com indicador "Etapa X de Y"

No `ProgressBar.tsx`, quando o modo for HD, prefixar a mensagem com a etapa atual para deixar explícito que há fases:

- "Etapa 1 de 3 · Convertendo 25/50 etiquetas..."
- "Etapa 2 de 3 · Melhorando qualidade 25/50..."
- "Etapa 3 de 3 · Finalizando PDF..."

Para o modo Standard manter o texto atual (sem prefixo), pois só há uma fase relevante para o usuário.

### 3. Contador unificado (não resetar visualmente)

Quando entrar no estágio `upscaling`, manter exibindo `N/N` por um instante antes de passar para o novo contador, OU melhor: trocar o texto da fase de upscaling para **não exibir contador X/N** e sim apenas "Melhorando qualidade..." com a barra avançando suavemente. Isso evita a sensação de reinício de números.

Aplicar em `getStageMessage()`: na fase `upscaling`, usar sempre `progressUpscalingSimple` ("Melhorando qualidade...") em vez do contador.

### 4. Suavizar transição visual da barra

A barra já tem `transition-all duration-300`. Garantir que `updateProgress` na transição converting→upscaling não emita um valor menor que o último visto (clamp monotônico):

- Em `useConversionState.updateProgress`, se `info.percentage` for menor que o `progressInfo.percentage` atual, ignorar o decremento (a barra nunca anda para trás).

## Arquivos afetados

- `src/components/progress/ProgressBar.tsx` — novo cálculo de ETA baseado em `progress`; prefixo "Etapa X de Y" para HD; trocar mensagem de upscaling para versão sem contador.
- `src/hooks/conversion/useConversionState.ts` — clamp monotônico em `updateProgress` para o `percentage`.
- `src/i18n/locales/pt-BR.ts` e `src/i18n/locales/en.ts` — adicionar chaves para "Etapa {{current}} de {{total}}" (`progressStepIndicator`).

## Detalhes técnicos

**ETA contínuo (HD e Standard):**
```ts
const totalEstimatedSeconds = totalLabels * TIME_PER_LABEL[mode] * STAGES_MULTIPLIER;
// HD: multiplicar por ~1.55 para cobrir upscaling+organizing+uploading proporcionalmente
// (já está embutido no TIME_PER_LABEL.hd que foi medido end-to-end)
const remainingSeconds = Math.ceil(totalEstimatedSeconds * (1 - progress / 100));
```

**Mapa de etapas para indicador:**
```ts
const HD_STEPS: Record<ConversionStage, [number, number] | null> = {
  parsing:    [1, 3],
  converting: [1, 3],
  upscaling:  [2, 3],
  organizing: [3, 3],
  uploading:  [3, 3],
  finalizing: [3, 3],
  complete:   null,
  idle:       null,
};
```

**Clamp monotônico:**
```ts
const updateProgress = (info: Partial<ProgressInfo>) => {
  setProgressInfo(prev => {
    const next = { ...prev, ...info };
    if (info.percentage !== undefined && info.percentage < prev.percentage) {
      next.percentage = prev.percentage; // nunca recua
    }
    return next;
  });
  if (info.percentage !== undefined) {
    setProgress(p => Math.max(p, info.percentage!));
  }
};
```

## Fora do escopo

- Não alterar a lógica de conversão/upscaling em si (ranges 5–45% / 45–70% / 70–95% permanecem).
- Não alterar o modo Standard além do clamp monotônico e do novo cálculo de ETA.
