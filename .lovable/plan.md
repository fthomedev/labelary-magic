
## Correcao: Fluxo de Reset de Senha e Texto do Botao

### Problemas Identificados

1. **Login automatico apos salvar senha**: Quando o usuario salva a nova senha, ele e redirecionado para `/auth`, mas ainda tem uma sessao ativa. O componente `Auth.tsx` detecta essa sessao e redireciona automaticamente para `/app`, fazendo com que o usuario "logue" sem querer.

2. **Texto do botao confuso**: O botao do formulario usa a traducao `resetPassword` que significa "Recuperar Senha", quando deveria ser algo como "Salvar Nova Senha".

### Fluxo Atual (Incorreto)

```text
+------------------+     +------------------+     +------------------+
| Usuario salva    | --> | Redireciona para | --> | Auth detecta     |
| nova senha       |     | /auth            |     | sessao ativa     |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
                                                 +------------------+
                                                 | Redireciona para |
                                                 | /app (logado)    |
                                                 +------------------+
```

### Fluxo Esperado (Corrigido)

```text
+------------------+     +------------------+     +------------------+
| Usuario salva    | --> | Faz SIGNOUT da   | --> | Redireciona para |
| nova senha       |     | sessao           |     | /auth            |
+------------------+     +------------------+     +------------------+
                                                          |
                                                          v
                                                 +------------------+
                                                 | Usuario precisa  |
                                                 | logar novamente  |
                                                 +------------------+
```

### Alteracoes Necessarias

#### 1. Arquivo: `src/pages/ResetPassword.tsx`

Modificar a funcao `handleResetPassword` para fazer logout apos atualizar a senha:

**Antes (linhas 204-219):**
```typescript
const { error } = await supabase.auth.updateUser({
  password: password,
});

if (error) throw error;

toast({
  title: t("passwordResetSuccess"),
  description: t("passwordResetSuccessDesc"),
});

// Redirect to login after successful password reset
setTimeout(() => {
  navigate("/auth");
}, 2000);
```

**Depois:**
```typescript
const { error } = await supabase.auth.updateUser({
  password: password,
});

if (error) throw error;

// IMPORTANTE: Fazer logout para forcar o usuario a logar novamente
await supabase.auth.signOut();

toast({
  title: t("passwordResetSuccess"),
  description: t("passwordResetSuccessDesc"),
});

// Redirect to login after successful password reset
setTimeout(() => {
  navigate("/auth");
}, 2000);
```

#### 2. Arquivo: `src/i18n/locales/pt-BR.ts`

Adicionar nova traducao para o botao de salvar senha:

**Adicionar na secao de autenticacao:**
```typescript
saveNewPassword: 'Salvar Nova Senha',
```

#### 3. Arquivo: `src/i18n/locales/en.ts`

Adicionar nova traducao em ingles:

**Adicionar na secao de autenticacao:**
```typescript
saveNewPassword: 'Save New Password',
```

#### 4. Arquivo: `src/pages/ResetPassword.tsx`

Atualizar o texto do botao para usar a nova traducao:

**Antes (linha 413):**
```typescript
t("resetPassword")
```

**Depois:**
```typescript
t("saveNewPassword")
```

### Comportamento Apos Alteracoes

| Situacao | Antes | Depois |
|----------|-------|--------|
| Apos salvar senha | Usuario e logado automaticamente no app | Usuario e deslogado e precisa fazer login |
| Texto do botao (PT) | "Recuperar Senha" | "Salvar Nova Senha" |
| Texto do botao (EN) | "Reset Password" | "Save New Password" |
| Sessao de recuperacao | Permanece ativa | Encerrada apos salvar |

### Resumo das Alteracoes

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/ResetPassword.tsx` | Adicionar `signOut()` apos `updateUser()` e mudar traducao do botao |
| `src/i18n/locales/pt-BR.ts` | Adicionar `saveNewPassword: 'Salvar Nova Senha'` |
| `src/i18n/locales/en.ts` | Adicionar `saveNewPassword: 'Save New Password'` |
