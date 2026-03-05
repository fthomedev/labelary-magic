

## Analise dos Erros de Conversao - Tabela `processing_errors`

### Resumo Geral

**60 erros** registrados desde 26/02, afetando **26 usuarios**.

| Tipo | Qtd | % |
|------|-----|---|
| `conversion_error` | 43 | 72% |
| `upload_error` | 17 | 28% |

---

### 1. Erros de Conversao (43 ocorrencias)

Os metadados enriquecidos que implementamos estao funcionando e revelam **3 categorias claras**:

#### 1a. **Payload Too Large - HTTP 413** (22 erros, 51%)
- **Causa**: A API Labelary recusa batches com mais de 50 labels (`^XA...^XZ` pairs).
- **Problema no codigo**: O `labelsPerBatch` esta configurado em 25-30 no config, mas o ZPL desse usuario tem labels com `^PQ` (duplicacao), fazendo com que 25 blocks virem 100+ labels na API.
- **Evidencia**: `label_count_attempted: 100-207` mas a mensagem diz "Labels attempted: 1" (1 batch de muitos labels).
- **Solucao**: Limitar o batch para no maximo ~15 labels, ou fazer pre-analise do `^PQ` para estimar labels reais por batch.

#### 1b. **HTTP 400 - Bad Request** (18 erros, 42%)
- **Causa**: ZPL malformado ou incompativel com a API. O metadata agora captura o body do erro, permitindo diagnostico.
- **Solucao**: Adicionar validacao pre-envio do ZPL e mostrar mensagem especifica ao usuario.

#### 1c. **Rate Limit 429** (2 erros) e **Network Error** (1 erro)
- Baixa incidencia, os mecanismos de retry existentes parecem funcionar.

---

### 2. Erros de Upload (17 ocorrencias)

#### 2a. **"User not authenticated"** (7 erros, 41%)
- **Causa**: Token expira durante processamento longo (24-124s).
- **Nota**: Ja implementamos `supabase.auth.getSession()` antes do upload, mas ainda ocorre. O `getSession()` pode falhar silenciosamente ou o token pode expirar entre o refresh e o upload.
- **Solucao**: Verificar se o `getSession()` retorna erro e forcar refresh com `supabase.auth.refreshSession()`.

#### 2b. **"Unexpected token '<'"** (6 erros, 35%)
- **Causa**: Supabase Storage retorna HTML (pagina de erro/manutencao) em vez de JSON. Ocorre em processamentos de 2s a 82s.
- **Solucao**: Detectar resposta HTML antes de tentar parse JSON e implementar retry com backoff.

#### 2c. **"PDF muito grande para upload"** (2 erros)
- 460 e 444 labels gerando PDFs de ~51MB. Limite do Storage e 50MB.
- **Solucao**: Comprimir PDF antes do upload ou segmentar em multiplos arquivos.

#### 2d. **"Failed to fetch"** (1 erro)
- Erro de rede generico durante upload.

---

### Plano de Correcoes

#### Prioridade 1: Payload Too Large (maior incidencia)

**Arquivo**: `src/hooks/conversion/useZplApiConversion.ts`
- Tratar HTTP 413 especificamente no `processBatch`: ao receber 413, subdividir o batch atual em batches menores e retentar automaticamente.
- Reduzir `labelsPerBatch` padrao de 25 para 15 em `processingConfig.ts`.

#### Prioridade 2: Sessao expirada durante upload

**Arquivo**: `src/hooks/pdf/useUploadPdf.ts`
- Substituir `getUser()` por `refreshSession()` + `getUser()` para garantir token valido.
- Adicionar retry (1x) ao upload em caso de falha de autenticacao.

#### Prioridade 3: Resposta HTML do Storage

**Arquivo**: `src/hooks/pdf/useUploadPdf.ts`
- Adicionar deteccao de resposta HTML no erro de upload e retry automatico (ate 2x com delay de 3s).

#### Prioridade 4: PDF grande demais

**Arquivo**: `src/hooks/conversion/usePdfOperations.ts`
- Verificar tamanho do PDF mergeado antes do upload.
- Se > 45MB, mostrar mensagem ao usuario sugerindo processar em lotes menores.

