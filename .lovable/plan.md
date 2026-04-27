## Diagnóstico

Você recebe **a mesma mensagem repetida com tipos diferentes** (ex.: o usuário escolheu "Sugestão", mas chegam emails como "Reclamação" ou "Bug" com o mesmo texto). Isso acontece por causa de **duas causas combinadas** no `FeedbackModal.tsx`:

### Causa 1 — Threading do Gmail por assunto

A linha 72 monta o assunto assim:
```ts
formData.append('_subject', `Feedback ZPL Easy - ${feedbackData.type}`);
```

Como o assunto **muda conforme o tipo**, o Gmail cria threads separadas por categoria. Mas o FormSubmit.co, na **primeira vez** que cada novo assunto é usado, envia um email de **ativação/confirmação** repetindo o conteúdo — gerando a impressão de "mesma mensagem com motivos diferentes". Também é comum ele reencaminhar com variações de assunto, o que confunde a leitura.

### Causa 2 — Sem proteção contra duplo envio

Não há uma guarda imediata em `handleSubmit`. O estado `isSubmitting` é setado **dentro** do `try`, mas o `Button type="submit"` permite múltiplos cliques rápidos antes do React rerender. Se o usuário clica 2x rápido (ou pressiona Enter + clica), o form é enviado **2 vezes** com o mesmo conteúdo. Se nesse meio tempo o `feedbackType` foi atualizado (ou o reset parcial ocorreu), o segundo envio pode sair com tipo diferente.

Mais importante: o `Select` do shadcn/Radix dispara `onValueChange` em cada interação. Se o usuário "passar" pelas opções antes de confirmar (em alguns devices touch), múltiplos envios podem ser disparados se o submit acontecer entre transições.

## Solução proposta

Aplicar **duas correções** em `src/components/FeedbackModal.tsx`:

### 1. Assunto fixo (corpo carrega o tipo)

```ts
// linha 72
formData.append('_subject', 'Feedback ZPL Easy');
```

O tipo já vai no campo `tipo` do corpo (linha 75), então a informação não se perde — só sai do título. Resultado: 1 thread única no Gmail, sem ativações repetidas do FormSubmit, sem variações de assunto.

### 2. Guarda anti-duplo-envio (idempotência local)

No início do `handleSubmit`, antes de qualquer validação:
```ts
if (isSubmitting) return;
setIsSubmitting(true);
```

E garantir que o `setIsSubmitting(false)` no `finally` continue funcionando. Isso elimina qualquer chance de o mesmo formulário ser enviado 2x com o mesmo (ou diferente) tipo.

## Arquivos alterados

- `src/components/FeedbackModal.tsx` — linhas ~50-72 (guarda no início do handler + assunto fixo).

## Resultado esperado

- **1 envio = 1 email**, com o tipo correto escolhido pelo usuário.
- Sem mensagens repetidas com motivos diferentes.
- Sem emails de ativação extras do FormSubmit.

Posso aplicar?