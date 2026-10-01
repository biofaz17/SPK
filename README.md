<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sparky

Aplicação React com APIs serverless para administração, checkout e geração de conteúdo.

## Configuração local

1. Instale as dependências com `npm install`.
2. Use [env-exemplo.txt](env-exemplo.txt) como guia para preencher `.env.local`. As chaves `ADMIN_PASSWORD`, `ADMIN_TOKEN_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `MP_ACCESS_TOKEN` e `GEMINI_API_KEY` são somente do servidor; não use prefixo `VITE_` nelas.
3. Gere o segredo do token administrativo com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` e defina uma senha administrativa longa e única.
4. Rode as funções e o app localmente com `npx vercel dev`.
5. Aplique [supabase-rls.sql](supabase-rls.sql) no SQL Editor do Supabase depois de conferir a tabela `profiles` e os nomes de coluna.

O token do painel fica apenas na memória da página. O plano pago é alterado no servidor depois que o pagamento é consultado na API do Mercado Pago. Configure `APP_URL` para a URL pública da aplicação e cadastre `/api/payment-webhook` como endpoint de notificação.

Antes de publicar, substitua e revogue as credenciais antigas do Mercado Pago, Gemini e Supabase que já foram expostas no código ou no histórico do repositório.
