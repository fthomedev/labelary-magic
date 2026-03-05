

## Analise de Performance - Modo Standard

### Causa da Lentidao

As mudancas recentes introduziram **3 fatores de degradacao**:

#### 1. `labelsPerBatch` reduzido de 25 para 15 (maior impacto)

Exemplo com 188 labels (conversao de hoje, 39.6s):

| Metrica | Antes (25/batch) | Agora (15/batch) | Diferenca |
|---------|-------------------|-------------------|-----------|
| Batches | 8 | 13 | +62% |
| Requests HTTP | 8 | 13 | +62% |
| Overhead delays | ~2.4s | ~4.8s | +100% |

Cada batch adicional soma ~800ms de delay + tempo de request HTTP. Isso explica a lentidao.

#### 2. `PARALLEL_BATCHES` reduzido de 3 para 2

| Metrica | Antes (3 paralelos) | Agora (2 paralelos) | Diferenca |
|---------|---------------------|---------------------|-----------|
| Grupos sequenciais (188 labels) | 3 | 7 | +133% |
| Delays entre grupos | 2 × 800ms | 6 × 800ms | +3.2s |

#### 3. `refreshSession()` antes de upload (impacto menor)

Adiciona ~200-500ms, mas ocorre apenas 1 vez. Impacto negligivel.

### Solucao Proposta

**Restaurar batch size e paralelismo**, confiando no auto-split de 413 como rede de seguranca (ja implementado). O auto-split so sera acionado quando necessario, evitando penalizar todos os usuarios.

#### Alteracoes em `src/config/processingConfig.ts`:

- `DEFAULT_CONFIG.labelsPerBatch`: 15 → **25** (restaurar)
- `FAST_CONFIG.labelsPerBatch`: 20 → **30** (restaurar)

#### Alteracoes em `src/hooks/conversion/useZplApiConversion.ts`:

- `PARALLEL_BATCHES`: 2 → **3** (restaurar)

#### Resultado esperado (188 labels):

| Metrica | Atual | Corrigido |
|---------|-------|-----------|
| Batches | 13 | 8 |
| Grupos paralelos | 7 | 3 |
| Delay total estimado | ~4.8s | ~1.6s |
| **Economia estimada** | -- | **~3-5s mais rapido** |

A seguranca contra 413 continua garantida pelo auto-split recursivo ja implementado.

