## Mudança

Trocar a palavra "Feedback" (que é técnica e nem todo usuário entende) pelo termo **"Fale Conosco"** (PT-BR) e **"Contact Us"** (EN), que são universalmente reconhecidos como canal direto de comunicação com o desenvolvedor/proprietário.

## Arquivos alterados

### `src/i18n/locales/pt-BR.ts` (linhas 213-229 + 282)

| Chave | Antes | Depois |
|---|---|---|
| `feedback` | "Feedback" | "Fale Conosco" |
| `sendFeedback` | "Enviar Feedback" | "Fale Conosco" |
| `feedbackType` | "Tipo de feedback" | "Assunto" |
| `selectFeedbackType` | "Selecione o tipo de feedback" | "Selecione o assunto" |
| `feedbackMessagePlaceholder` | "Descreva seu feedback detalhadamente..." | "Escreva sua mensagem detalhadamente..." |
| `feedbackSent` | "Feedback enviado!" | "Mensagem enviada!" |
| `feedbackThankYou` | "Obrigado pelo seu feedback. Entraremos em contato em breve." | "Obrigado pela sua mensagem. Entraremos em contato em breve." |
| `errorSendingFeedback` | "Erro ao enviar feedback" | "Erro ao enviar mensagem" |
| `sendFeedbackButton` | "Enviar Feedback" | "Enviar Mensagem" |
| `betaNotice` | "...use o botão de Feedback." | "...use o botão Fale Conosco." |

(Chaves não alteradas: `feedbackMessage`, `feedbackSuggestion`, `feedbackBug`, `feedbackComplaint`, `feedbackOther` — já estão claras.)

### `src/i18n/locales/en.ts` (linhas 213-229 + 282)

| Chave | Antes | Depois |
|---|---|---|
| `feedback` | "Feedback" | "Contact Us" |
| `sendFeedback` | "Send Feedback" | "Contact Us" |
| `feedbackType` | "Feedback Type" | "Subject" |
| `selectFeedbackType` | "Select feedback type" | "Select subject" |
| `feedbackMessagePlaceholder` | "Describe your feedback in detail..." | "Write your message in detail..." |
| `feedbackSent` | "Feedback Sent!" | "Message Sent!" |
| `feedbackThankYou` | "Thank you for your feedback. We will get back to you soon." | "Thank you for your message. We will get back to you soon." |
| `errorSendingFeedback` | "Error sending feedback" | "Error sending message" |
| `sendFeedbackButton` | "Send Feedback" | "Send Message" |
| `betaNotice` | "...use the Feedback button." | "...use the Contact Us button." |

### `src/components/FeedbackModal.tsx` (apenas string interna do email)

- `_subject`: trocar `'Feedback ZPL Easy'` por `'Contato ZPL Easy'` para padronizar o assunto do email recebido com o novo nome do canal.

## Notas

- Nomes das chaves de tradução (`feedback*`) **não são alterados** — apenas os textos exibidos. Isso evita refatoração em todos os componentes que consomem essas chaves.
- Nome do arquivo `FeedbackModal.tsx` permanece (é interno, sem impacto na UX).

Posso aplicar?