# Corrigir o upscale "Nitidez+" (HD)

## O que os logs mostram

Todos os 13 erros registrados hoje são do mesmo tipo: `hd_upscale_failed` com a mensagem
"Compressed PNG data not supported in this implementation". Em todos os registros o número
de falhas é igual ao número de etiquetas tentadas (1, 4, 5, 6, 8, 9, 12, 20, 80...), ou seja:
o upscale HD está falhando em 100% das imagens.

Hoje isso passa despercebido porque o app tem um fallback silencioso: quando o upscale falha,
ele usa a imagem original. Resultado: quem escolhe "Nitidez+" paga o tempo extra de
processamento e recebe a mesma qualidade do modo padrão.

## Causa raiz (confirmada no código)

A função `upscale-image` usa um descompactador PNG escrito à mão. Ele só sabe ler blocos
"stored" (não comprimidos) e lança o erro assim que encontra dados realmente comprimidos —
que é o caso de todo PNG gerado pela Labelary. O compactador de saída tem o problema espelhado:
grava tudo sem compressão, gerando arquivos muito maiores que o necessário.

## O que será feito

1. Trocar a descompressão/compressão manual pelas APIs nativas do runtime
   (`DecompressionStream` / `CompressionStream` com `deflate`), que lidam com PNG comprimido
   de verdade e ainda reduzem o tamanho do arquivo de saída.
2. Ampliar o leitor de PNG para os formatos que a Labelary pode devolver: tons de cinza,
   RGB, RGBA, paleta indexada e profundidades de 1/2/4/8 bits (etiquetas costumam vir em
   1 bit preto e branco). PNG entrelaçado, se aparecer, retorna um erro claro em vez de
   gerar imagem corrompida.
3. Validar com uma etiqueta real: gerar o PNG pela Labelary, chamar a função publicada e
   conferir que a saída volta com o dobro da resolução e sem erro.
4. Melhorar o diagnóstico: quando o upscale falhar, registrar também a dimensão da imagem,
   o tipo de cor e a profundidade de bits, para que erros futuros sejam identificáveis
   direto na tabela.
5. Avisar o usuário quando o HD cair no modo original: hoje o fallback é 100% silencioso.
   Se todas as imagens falharem, mostrar um aviso de que a conversão saiu sem o ganho de
   nitidez, em vez de entregar como se tivesse funcionado.

## Detalhes técnicos

- Arquivo principal: `supabase/functions/upscale-image/index.ts`
  - `inflateSync` / `deflateSync` substituídos por helpers assíncronos usando
    `new DecompressionStream('deflate')` e `new CompressionStream('deflate')`;
    `decodePNG` e `encodePNG` passam a ser `async`.
  - `decodePNG`: suporte a `colorType` 0/2/3/4/6, leitura do chunk `PLTE` (e `tRNS` quando
    presente), desempacotamento de bit depths 1/2/4 e erro explícito para `interlace !== 0`
    e para bit depth 16.
  - Reconstrução de filtros passa a usar `bytesPerPixel` arredondado para cima (mínimo 1),
    como exige a especificação PNG para bit depth < 8.
- `src/hooks/conversion/useServerUpscaler.ts`: incluir `width`/`height`/`colorType` nos
  metadados do log e expor a contagem de falhas para o chamador.
- `src/hooks/conversion/useHdConversion.ts`: exibir o aviso de "sem ganho de nitidez"
  quando todas as imagens caírem no fallback.
- Validação: `supabase--curl_edge_functions` com um PNG real da Labelary antes de encerrar.
