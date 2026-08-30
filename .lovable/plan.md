# Avaliação em estrelas após a conversão

Coletar uma nota de 1 a 5 estrelas ao final da conversão, guardar no banco junto com o contexto do processamento e, quando a nota for alta, mostrar o QR Code do PIX pedindo apoio.

## Como fica para o usuário

1. Conversão termina com sucesso. Em algumas ocasiões (não sempre), abaixo do botão de download aparece um bloco discreto: "Como foi essa conversão?" com 5 estrelas.
2. Frequência: no máximo 1 pedido por dia e nunca antes de 3 conversões desde o último pedido. Se o usuário avaliar ou fechar, não aparece de novo naquele dia.
3. Nota 4 ou 5: o bloco vira agradecimento + QR Code do PIX ("Que bom que ajudou! Se puder, apoie o projeto") com o botão de doação já existente (PIX e cartão).
4. Nota 1 a 3: aparece um campo de comentário opcional ("O que podemos melhorar?") com botão Enviar. Sem QR Code.
5. Tudo em PT/EN.

## Dados guardados

Nova tabela `conversion_ratings`:

- `user_id`, `rating` (1-5), `comment` (opcional)
- `processing_history_id` (link com o registro da conversão, quando existir)
- contexto: `processing_type` (padrão / nitidez+ / a4), `label_count`, `processing_time_ms`, `two_column`, `label_size`
- `created_at`

Acesso: cada usuário só enxerga e cria as próprias avaliações; nada é público. Sem edição nem exclusão pelo cliente.

## Detalhes técnicos

- Migração: `CREATE TABLE public.conversion_ratings` + GRANTs (`authenticated` para select/insert, `service_role` para tudo) + RLS com políticas `auth.uid() = user_id` para SELECT e INSERT. FK opcional para `public.processing_history(id)` com `ON DELETE SET NULL`.
- `src/components/rating/ConversionRating.tsx`: componente com as estrelas (hover/keyboard acessível), estado `idle → rated → thanks`, campo de comentário condicional e o `DonationButton` reaproveitado com o QR PIX do `DonationSuccess`/`DonationButton`.
- `src/hooks/useRatingPrompt.ts`: regra de exibição via `localStorage` (`zpl-rating-last-shown`, `zpl-rating-conversions-since`), incrementada a cada conversão concluída.
- `src/hooks/useConversionRating.ts`: insert no Supabase; falha de gravação não bloqueia a UI (apenas log).
- `useZplConversion.ts` / `useHdConversion.ts` já expõem o resultado; será exposto também o `id` do registro criado em `useHistoryRecords.addToProcessingHistory` (usar `.select('id').single()`) para vincular a avaliação.
- `ConversionProgress.tsx` renderiza `ConversionRating` quando `isProcessingComplete` e o hook de frequência liberar; o bloco atual "Gostou? Considere apoiar o projeto!" passa a ser exibido só quando o pedido de avaliação não está ativo, evitando dois pedidos de doação na mesma tela.
- i18n: novas chaves em `src/i18n/locales/pt-BR.ts` e `en.ts` (pergunta, rótulos das estrelas, agradecimento, placeholder do comentário, botão enviar).

## Consulta para análise

Depois no SQL: média de nota por `processing_type`, por faixa de `label_count` e lista de comentários das notas baixas.
