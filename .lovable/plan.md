# Erros de hoje: nada novo — falta publicar as correções

Consultei `processing_errors` das últimas 12–40h. Todos os registros de hoje (01/09) apontam para o mesmo bundle publicado `index-BmbN2LGx.js` nos stacks — ou seja, foram gerados pela versão **anterior** às correções, que ainda não está no ar.

## O que apareceu hoje

| Causa | Qtd hoje | Já corrigido? |
|---|---|---|
| `PDF too large for storage` (HD): 53 MB, 57 MB, 64 MB, 78 MB, 105 MB, 129 MB | 12 | Sim — split automático em partes de até 40 MB |
| `User not authenticated` (Padrão) | 1 | Sim — `ensureFreshSession` antes do upload |
| `Failed to fetch` (HD, rede durante upload) | 1 | Parcial — falha de rede do usuário, não há bug de código |
| `409 Duplicate` | 0 hoje (último em 31/08) | Sim — path com timestamp + UUID e retry |

Observação: vários pares têm tamanho idêntico com poucos minutos de diferença (ex.: 78.580.629 bytes às 15:34 e 16:00) — é o mesmo usuário repetindo o mesmo lote depois do erro. O número de usuários afetados é menor que o número de linhas.

Nenhuma categoria nova de erro apareceu: nada de falha na conversão, no Labelary, no merge do PDF ou no upscale.

## Conclusão e próximo passo

Os erros de hoje **reforçam** as correções já feitas — em especial o split HD, que cobre até o caso extremo de 129 MB (viraria ~4 partes). A ação pendente é:

1. **Publicar a versão atual** para que split, sessão renovada e path único cheguem aos usuários.
2. Depois de 24h publicado, revisar `processing_errors` de novo: espera-se zero `PDF too large` e zero `User not authenticated`; se algum sobrar, o stack vai apontar para o bundle novo e aí é caso real.
3. Opcional: limpar os registros de hoje que já são cobertos pelas correções, para o painel refletir só erros do código novo.

## Detalhes técnicos

- Evidência da versão: `error_stack` de todos os registros de 01/09 cita `assets/index-BmbN2LGx.js` (domínios `zpleasy.com` e `labelary-magic.lovable.app`), enquanto as correções estão apenas no código de preview.
- O guard atual é `MAX_PDF_UPLOAD_BYTES = 45 MB` em `src/hooks/pdf/useUploadPdf.ts`; o split usa `MAX_PDF_PART_BYTES = 40 MB` em `src/utils/pdfPageUtils.ts`, com margem suficiente para os tamanhos vistos.
- `Failed to fetch` não tem retry hoje; se reaparecer com o bundle novo, dá para adicionar 2 tentativas com backoff no upload.
