

## Implementação: Feedback e Cooldown no Envio de Link de Recuperação

### Situacao Atual

O código já possui o modal de confirmação (`showResetPasswordModal`) que aparece após enviar o link de recuperação, mas:

1. O botao "Enviar Link de Recuperacao" pode ser clicado multiplas vezes sem restricao
2. O modal de confirmacao nao oferece opcao de reenviar com cooldown (diferente do modal de confirmacao de cadastro)

### Alteracoes Necessarias

**Arquivo:** `src/components/AuthForm.tsx`

#### 1. Adicionar estado de cooldown para reset de senha

Adicionar um novo estado para controlar o cooldown especifico do reset de senha:

```typescript
const [resetPasswordCooldown, setResetPasswordCooldown] = useState(0);
```

#### 2. Atualizar o useEffect do timer

Modificar o useEffect existente para tambem controlar o cooldown do reset de senha:

```typescript
useEffect(() => {
  if (resendCooldown > 0) {
    const timer = setTimeout(() => {
      setResendCooldown(resendCooldown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [resendCooldown]);

useEffect(() => {
  if (resetPasswordCooldown > 0) {
    const timer = setTimeout(() => {
      setResetPasswordCooldown(resetPasswordCooldown - 1);
    }, 1000);
    return () => clearTimeout(timer);
  }
}, [resetPasswordCooldown]);
```

#### 3. Iniciar cooldown apos envio bem-sucedido

No handleAuth, apos enviar o link de recuperacao com sucesso:

```typescript
if (isResetPassword) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
    captchaToken: captchaToken || undefined,
  });
  if (error) throw error;
  
  setLastEmailSent(email);
  setShowResetPasswordModal(true);
  setResetPasswordCooldown(60); // Iniciar cooldown de 60 segundos
}
```

#### 4. Desabilitar botao durante cooldown

No formulario de reset (linhas 307-309), atualizar o botao:

```typescript
<Button 
  type="submit" 
  className="w-full" 
  disabled={isLoading || !captchaToken || !!emailError || resetPasswordCooldown > 0}
>
  {isLoading ? t("sending") : resetPasswordCooldown > 0 ? t("resendIn", { seconds: resetPasswordCooldown }) : t("sendResetLink")}
</Button>
```

#### 5. Adicionar botao de reenvio no modal de confirmacao

No modal `showResetPasswordModal` (linhas 427-448), adicionar botao de reenvio similar ao modal de confirmacao de email:

```typescript
<div className="flex flex-col gap-2 mt-2">
  <Button onClick={handleCloseResetPasswordModal} className="w-full">
    {t("goToLogin")}
  </Button>
  <Button 
    variant="outline" 
    onClick={handleResendResetPassword}
    disabled={isResending || resetPasswordCooldown > 0}
    className="w-full"
  >
    {isResending ? (
      <>
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
        {t("sending")}
      </>
    ) : resetPasswordCooldown > 0 ? (
      <>
        <RefreshCw className="h-4 w-4 mr-2" />
        {t("resendIn", { seconds: resetPasswordCooldown })}
      </>
    ) : (
      <>
        <RefreshCw className="h-4 w-4 mr-2" />
        {t("resendEmail")}
      </>
    )}
  </Button>
</div>
```

#### 6. Criar funcao de reenvio de email de reset

Adicionar nova funcao para reenviar o email de recuperacao:

```typescript
const handleResendResetPassword = async () => {
  if (isResending || resetPasswordCooldown > 0 || !lastEmailSent) return;
  
  setIsResending(true);
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(lastEmailSent, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    
    if (error) throw error;
    
    toast({
      title: t("resendEmailSuccess"),
      description: t("checkYourEmail"),
    });
    
    setResetPasswordCooldown(60);
  } catch (error: any) {
    toast({
      variant: "destructive",
      title: t("error"),
      description: error.message,
    });
  } finally {
    setIsResending(false);
  }
};
```

#### 7. Resetar cooldown ao fechar modal

Atualizar `handleCloseResetPasswordModal`:

```typescript
const handleCloseResetPasswordModal = () => {
  setShowResetPasswordModal(false);
  setEmail("");
  setEmailTouched(false);
  setLastEmailSent("");
  setIsResetPassword(false);
  setResetPasswordCooldown(0); // Resetar cooldown
  captchaRef.current?.reset();
  setCaptchaToken(null);
};
```

### Resumo das Alteracoes

| Item | Descricao |
|------|-----------|
| Arquivo | `src/components/AuthForm.tsx` |
| Novo estado | `resetPasswordCooldown` |
| Timer | Cooldown de 60 segundos entre envios |
| UI do botao | Mostra contador regressivo durante cooldown |
| Modal | Adiciona botao de reenvio com cooldown |
| Traducoes | Reutiliza traducoes existentes (`resendIn`, `resendEmail`, etc.) |

