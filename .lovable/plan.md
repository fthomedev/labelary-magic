## Objetivo

Quando o usuário escolher **"Erro"** como assunto no Fale Conosco, exibir um campo opcional de **anexar arquivo ZPL/ZIP** que ele estava tentando processar. UX precisa ser persuasiva sem ser invasiva — incentivando o envio sem bloquear quem prefere não anexar.

## UX proposta

### 1. Campo só aparece se "Erro" for selecionado

Mantém o modal limpo para sugestão/reclamação/outro. O campo "expande" suavemente quando o usuário troca o assunto para Erro.

### 2. Visual e copy persuasivos

Bloco destacado (border tracejada, fundo sutil em `bg-muted/30`, ícone `Paperclip`) com:

- **Título**: "Anexar arquivo do erro (opcional)"
- **Texto curto persuasivo**: "📎 Quer aumentar muito as chances de resolvermos rápido? Anexe o arquivo ZPL/ZIP que você estava tentando processar. Sem ele, normalmente não conseguimos reproduzir o problema."
- **Microcopy de privacidade** (small/muted): "Usado apenas para análise técnica. Não compartilhamos seu arquivo."
- Após selecionar: mostra nome + tamanho + botão de remover (X).

### 3. Validações

- Aceitar `.zpl, .txt, .zip` (mesmos formatos do uploader principal).
- Limite **9MB** (margem segura abaixo do teto de 10MB do FormSubmit).
- Se exceder: toast de erro com instrução para reduzir/zipar.
- Botão "Enviar Mensagem" continua habilitado mesmo sem anexo (campo é opcional).

### 4. Reforço pós-seleção

Quando o anexo é adicionado, exibir abaixo dele um pequeno texto verde: "✓ Ótimo! Isso vai acelerar muito o diagnóstico." (positivo, recompensa o comportamento).

## Mudança técnica

### Backend de envio (importante)

O endpoint AJAX atual (`/ajax/<email>` + JSON) **não aceita anexos**. O FormSubmit só suporta arquivos via `multipart/form-data` no endpoint clássico (`/<email>`). Esse endpoint clássico, porém, faz **redirect** após submit (não é CORS-friendly).

**Solução**: usar abordagem dupla no `handleSubmit`:

- **Sem anexo** → continua usando endpoint AJAX/JSON (funciona como hoje).
- **Com anexo** → usa `fetch` com `FormData` no endpoint clássico (`https://formsubmit.co/fernandothome@gmail.com`) **com `mode: 'no-cors'`**. A request é enviada com sucesso (FormSubmit recebe), mas a resposta fica opaca — então tratamos como sucesso otimista após o `await fetch` retornar sem throw.

Trade-off aceito: com anexo não conseguimos confirmar 200 OK, mas o envio funciona. Mostramos o toast de sucesso normalmente.

### Arquivos alterados

**`src/components/FeedbackModal.tsx`** — principais mudanças:
1. Novo estado: `attachment: File | null`.
2. Novo input `<input type="file" accept=".zpl,.txt,.zip">` (oculto, acionado por botão estilizado).
3. Bloco condicional renderizado apenas quando `feedbackType === 'bug'`.
4. Validação de tamanho (9MB) com toast de erro.
5. Em `handleSubmit`: branch para envio com FormData + `no-cors` quando há anexo; senão mantém JSON atual.
6. Reset do `attachment` junto com os outros campos após sucesso.

**`src/i18n/locales/pt-BR.ts`** e **`src/i18n/locales/en.ts`** — novas chaves:
- `attachFile`, `attachFileDescription`, `attachFilePrivacy`, `attachFileSelect`, `attachFileBenefit`, `attachFileTooLarge`, `attachFileSuccess`.

## Resultado esperado

- Modal continua simples para a maioria dos casos.
- Quando usuário relata erro, vê um convite claro e amigável para anexar o arquivo.
- Copy explica o "porquê" (resolução rápida) e a privacidade (uso técnico apenas).
- Reforço positivo após anexar aumenta a sensação de progresso.
- Tecnicamente compatível com o limite de 10MB do FormSubmit.

Posso aplicar?