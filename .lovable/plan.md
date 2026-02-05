

## Correcao: Redirecionamento do Link de Reset de Senha para Ambiente Correto

### Problema Identificado

O link de recuperacao de senha no email esta usando `window.location.origin` para definir o `redirectTo`, o que faz com que:

- Se o usuario solicita o reset no ambiente de preview (`id-preview--*.lovable.app`), o link direciona para o preview
- Se o usuario solicita no ambiente de producao (`zpleasy.com`), o link direciona corretamente

O problema ocorre porque o ambiente de preview Lovable e diferente do ambiente de producao publicado.

### Locais Afetados no Codigo

**Arquivo:** `src/components/AuthForm.tsx`

1. **Linha 160** - `handleAuth` (solicitacao inicial):
```typescript
redirectTo: `${window.location.origin}/auth/reset-password`,
```

2. **Linha 398** - `handleResendResetPassword` (reenvio):
```typescript
redirectTo: `${window.location.origin}/auth/reset-password`,
```

### Solucao Proposta

Criar uma funcao utilitaria que determina a URL correta baseada no ambiente atual. A logica sera:

1. Se estiver no dominio de producao (`zpleasy.com`) -> usar `https://zpleasy.com`
2. Se estiver no dominio Lovable publicado (`labelary-magic.lovable.app`) -> usar `https://zpleasy.com` (redireciona para producao)
3. Se estiver em ambiente de desenvolvimento/preview -> usar `window.location.origin` (para testes locais)

### Alteracoes no Codigo

**Arquivo:** `src/components/AuthForm.tsx`

#### 1. Adicionar funcao utilitaria para obter a URL de redirecionamento

```typescript
// Helper function to get the correct redirect URL based on environment
const getAuthRedirectUrl = (path: string): string => {
  const origin = window.location.origin;
  const hostname = window.location.hostname;
  
  // Production domains
  const productionDomains = ['zpleasy.com', 'www.zpleasy.com'];
  const lovablePublishedDomain = 'labelary-magic.lovable.app';
  const productionUrl = 'https://zpleasy.com';
  
  // If on production domain, use production URL
  if (productionDomains.includes(hostname)) {
    return `${productionUrl}${path}`;
  }
  
  // If on Lovable published domain, redirect to production
  if (hostname === lovablePublishedDomain) {
    return `${productionUrl}${path}`;
  }
  
  // For development/preview environments, use current origin
  // This allows testing in preview and local environments
  return `${origin}${path}`;
};
```

#### 2. Atualizar as chamadas de resetPasswordForEmail

**Na funcao handleAuth (linha 159-162):**
```typescript
if (isResetPassword) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: getAuthRedirectUrl('/auth/reset-password'),
    captchaToken: captchaToken || undefined,
  });
  // ...
}
```

**Na funcao handleResendResetPassword (linha 397-399):**
```typescript
const { error } = await supabase.auth.resetPasswordForEmail(lastEmailSent, {
  redirectTo: getAuthRedirectUrl('/auth/reset-password'),
});
```

### Comportamento Esperado

| Ambiente | URL de Origem | URL no Email |
|----------|---------------|--------------|
| Producao | `https://zpleasy.com` | `https://zpleasy.com/auth/reset-password` |
| Lovable Published | `https://labelary-magic.lovable.app` | `https://zpleasy.com/auth/reset-password` |
| Lovable Preview | `https://id-preview--*.lovable.app` | `https://id-preview--*.lovable.app/auth/reset-password` |
| Local | `http://localhost:8080` | `http://localhost:8080/auth/reset-password` |

### Consideracoes Importantes

1. **Dominio no Supabase**: Certifique-se de que `https://zpleasy.com` esta configurado como URL permitida nas configuracoes de autenticacao do Supabase (Site URL e Redirect URLs)

2. **PKCE e Navegadores**: Mesmo com essa correcao, o usuario ainda precisa abrir o link no mesmo navegador onde solicitou o reset (limitacao do PKCE). Isso ja foi tratado anteriormente.

3. **Testes**: O ambiente de preview continuara funcionando independentemente para testes.

### Resumo

| Item | Detalhes |
|------|----------|
| Arquivo | `src/components/AuthForm.tsx` |
| Funcao nova | `getAuthRedirectUrl()` |
| Linhas afetadas | 160, 398 |
| Dominios de producao | `zpleasy.com`, `labelary-magic.lovable.app` |
| Comportamento em dev | Mantem URL de origem para testes |

