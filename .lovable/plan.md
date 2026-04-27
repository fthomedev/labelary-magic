## Diagnóstico

O envio de feedback falha com `TypeError: Failed to fetch` (visível no console em `2026-04-27T21:25:06Z`). A request POST para `https://formsubmit.co/fernandothome@gmail.com` é bloqueada pelo navegador por **falta de headers CORS** na resposta do FormSubmit.

### Causa raiz

O FormSubmit.co tem **dois endpoints**:

1. `https://formsubmit.co/<email>` — espera POST de **formulário HTML clássico** (`<form action="...">`). Não retorna CORS, logo `fetch` falha.
2. `https://formsubmit.co/ajax/<email>` — endpoint **AJAX** que retorna headers CORS e aceita JSON.

O código atual usa o endpoint #1 com `fetch` + `FormData`, daí o `Failed to fetch`.

## Correção

Trocar a chamada em `src/components/FeedbackModal.tsx` para usar o endpoint AJAX com JSON:

```ts
const response = await fetch('https://formsubmit.co/ajax/fernandothome@gmail.com', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  body: JSON.stringify({
    _subject: 'Feedback ZPL Easy',
    _captcha: 'false',
    tipo: feedbackData.type,
    mensagem: feedbackData.message,
    email_usuario: feedbackData.userEmail,
  }),
});
```

Mudanças:
- URL passa a ser `/ajax/<email>` (com CORS).
- Body vira JSON com `Content-Type: application/json`.
- Remover `_next` (só faz sentido em form HTML clássico — não se aplica a chamadas AJAX).
- Manter `_subject` fixo (já corrigido anteriormente) e o `tipo` no corpo.

## Arquivo alterado

- `src/components/FeedbackModal.tsx` — bloco do `fetch` (linhas ~70-83).

## Resultado esperado

- Envio de feedback funciona sem erro de CORS.
- Continua chegando 1 email por envio, com tipo correto no corpo.

Posso aplicar?