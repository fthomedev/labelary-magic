

## Correcao: Link de Reset de Senha Mostrando "Link Expirado" Incorretamente

### Problema Identificado

O fluxo atual de reset de senha usa PKCE (Proof Key for Code Exchange), que requer um `code_verifier` armazenado no localStorage. Quando o usuario clica no link do email, o sistema tenta trocar o codigo por uma sessao usando `exchangeCodeForSession`, mas isso falha se:

1. O `code_verifier` foi limpo do localStorage
2. O navegador foi atualizado entre a solicitacao e o clique no link
3. O codigo ja foi usado anteriormente
4. Houve qualquer interrupcao no armazenamento local

### Solucao Proposta

Implementar uma abordagem hibrida que suporte tanto o fluxo PKCE quanto o fluxo alternativo usando `verifyOtp` com `token_hash`:

1. **Modificar o template de email no Supabase** para incluir o `token_hash` como parametro na URL
2. **Atualizar o codigo** para detectar e usar o `token_hash` quando o `code_verifier` nao estiver disponivel
3. **Aumentar o timeout** de 3 para 30 segundos como solicitado

### Alteracoes Necessarias

**Arquivo:** `src/pages/ResetPassword.tsx`

#### 1. Adicionar suporte para `token_hash` no fluxo de recuperacao

Modificar o `useEffect` para detectar `token_hash` na URL e usar `verifyOtp` como alternativa:

```typescript
useEffect(() => {
  const handleRecoveryFlow = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const tokenHash = urlParams.get('token_hash');
    const type = urlParams.get('type');
    const errorParam = urlParams.get('error');
    const errorDescription = urlParams.get('error_description');

    // Handle error from Supabase redirect
    if (errorParam) {
      console.error('Auth error from redirect:', errorParam, errorDescription);
      setIsValidSession(false);
      return;
    }

    // Method 1: Try token_hash with verifyOtp (more reliable)
    if (tokenHash && type === 'recovery') {
      console.log('Found token_hash, verifying with verifyOtp...');
      try {
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });
        
        if (error) {
          console.error('Error verifying token_hash:', error.message);
          setIsValidSession(false);
          return;
        }
        
        if (data.session) {
          console.log('Session established via verifyOtp');
          setIsValidSession(true);
          window.history.replaceState({}, '', '/auth/reset-password');
          return;
        }
      } catch (error: any) {
        console.error('Exception verifying token_hash:', error.message);
        setIsValidSession(false);
        return;
      }
    }

    // Method 2: Try PKCE code exchange
    if (code) {
      console.log('Found PKCE code, exchanging for session...');
      try {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('Error exchanging code:', error.message);
          // Check if it's a code_verifier issue
          if (error.message.includes('code verifier') || 
              error.message.includes('PKCE') ||
              error.message.includes('non-empty')) {
            console.log('PKCE code_verifier not found in storage');
          }
          setIsValidSession(false);
          return;
        }
        
        if (data.session) {
          console.log('Session established via PKCE');
          setIsValidSession(true);
          window.history.replaceState({}, '', '/auth/reset-password');
          return;
        }
      } catch (error: any) {
        console.error('Exception exchanging code:', error.message);
        setIsValidSession(false);
        return;
      }
    }

    // Fallback: Check for existing session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      console.log('Existing session found');
      setIsValidSession(true);
      return;
    }

    // Check for hash-based tokens (legacy flow)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const refreshToken = hashParams.get('refresh_token');
    
    if (accessToken && refreshToken) {
      // ... existing hash-based logic
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event);
        if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
          setIsValidSession(true);
        }
      }
    );

    // If no auth method found, mark as invalid
    if (!code && !tokenHash && !accessToken) {
      console.log('No auth code or tokens found in URL');
      setIsValidSession(false);
      return () => subscription.unsubscribe();
    }

    // Increased timeout to 30 seconds
    setTimeout(() => {
      setIsValidSession(prev => {
        if (prev === null) {
          console.log('Timeout reached, no valid session found');
          return false;
        }
        return prev;
      });
    }, 30000);

    return () => subscription.unsubscribe();
  };

  handleRecoveryFlow();
}, []);
```

#### 2. Configuracao no Supabase Dashboard

Para usar o `token_hash`, e necessario modificar o template de email de recuperacao de senha no Supabase:

**Dashboard > Authentication > Email Templates > Reset Password**

Alterar o link de:
```html
<a href="{{ .ConfirmationURL }}">Reset Password</a>
```

Para:
```html
<a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery">Reset Password</a>
```

### Comportamento Apos Alteracoes

| Cenario | Antes | Depois |
|---------|-------|--------|
| PKCE code_verifier presente | Funciona | Funciona |
| PKCE code_verifier ausente | Link Expirado | Tenta verifyOtp (funciona) |
| Token hash na URL | Nao suportado | Funciona |
| Timeout de validacao | 3 segundos | 30 segundos |

### Resumo das Alteracoes

| Item | Detalhes |
|------|----------|
| Arquivo | `src/pages/ResetPassword.tsx` |
| Nova funcionalidade | Suporte a `token_hash` via `verifyOtp` |
| Timeout | Aumentado de 3s para 30s |
| Configuracao externa | Template de email no Supabase Dashboard |

### Passos para Implementacao

1. Aplicar as alteracoes no codigo `ResetPassword.tsx`
2. Configurar o template de email no Supabase Dashboard
3. Testar o fluxo completo de reset de senha

