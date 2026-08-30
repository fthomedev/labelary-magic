# Limpar registros de erro já resolvidos

A tabela de erros hoje só contém falhas do problema de "Nitidez+" que já foi corrigido. Removê-las deixa a tabela refletindo apenas falhas atuais.

## O que será feito

Apagar os 16 registros de falha do tipo `hd_upscale_failed` com a mensagem "Compressed PNG data not supported in this implementation", ocorridos em 30/08 entre 12:44 e 14:18 UTC — todos anteriores à correção do upscaler, que já está no ar e funcionando.

Nada mais é apagado: qualquer erro de outro tipo ou posterior a esse horário permanece.

## Detalhes técnicos

- Operação de dados (não é mudança de estrutura):

```sql
DELETE FROM public.processing_errors
WHERE error_type = 'hd_upscale_failed'
  AND error_message = 'Compressed PNG data not supported in this implementation';
```

- Depois da limpeza, conferir com uma contagem por `error_type` que a tabela ficou vazia (ou só com eventuais erros novos).

## Depois

Voltar a consultar a tabela em alguns dias para confirmar que o `hd_upscale_failed` não reaparece e que nenhum tipo novo surgiu.
