<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sparky

Aplicação React com APIs serverless para administração, checkout e geração de conteúdo.

## Configuração local

1. Instale as dependências com `npm install`.
2. Use [env-exemplo.txt](env-exemplo.txt) como guia para preencher `.env.local`. As chaves `ADMIN_PASSWORD`, `ADMIN_TOKEN_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `MP_ACCESS_TOKEN` e `GEMINI_API_KEY` são somente do servidor; não use prefixo `VITE_` nelas.
3. Gere o segredo do token administrativo com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` e defina uma senha administrativa longa e única.
4. No SQL Editor do projeto Supabase, execute [supabase-rls.sql](supabase-rls.sql) sobre a tabela `profiles` existente. A migração vincula novos cadastros ao Supabase Auth e libera a leitura do perfil apenas para sua conta.
5. Rode `npm run dev` para usar o app com login e cadastro. Para executar também as demais funções, rode `npx vercel dev`.

Os exploradores entram com nome e senha. Perfis antigos ainda sem um usuário no Supabase Auth são vinculados no primeiro login com a senha já cadastrada. Cada explorador usa um endereço interno no Auth, então o mesmo e-mail de contato pode ser usado por vários perfis. O cadastro libera a entrada imediata e mantém o e-mail do responsável no perfil.

O token do painel fica apenas na memória da página. O plano pago é alterado no servidor depois que o pagamento é consultado na API do Mercado Pago. Configure `APP_URL` para a URL pública da aplicação e cadastre `/api/payment-webhook` como endpoint de notificação.

Para verificar o checkout pelo Cloudflare Workers local, use credenciais de teste do Mercado Pago no `.env.local` e rode `npm run dev:payments`. Configure `APP_URL` com o endereço HTTPS público que encaminha para o Worker local para receber o retorno do checkout e as notificações.

Para testar o Checkout Pro via Orders API, aplique a migração [supabase-mercado-pago-orders.sql](supabase-mercado-pago-orders.sql) no banco do ambiente e defina `MP_CHECKOUT_API=orders` no servidor. Configure o evento **Order (Mercado Pago)** para `<APP_URL>/api/payment-webhook`. A opção padrão é `preferences`. Consulte o [manual de implementação e testes](docs/mercado-pago.md).

## Publicação no Cloudflare Workers

O Worker serve o conteúdo de `dist`, encaminha rotas como `/auth` para a SPA e executa as funções de `api/` no mesmo endereço. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no ambiente de build ou no `.env.local` ao compilar pela máquina local. Essas duas variáveis são incorporadas ao JavaScript do navegador. Para habilitar login e cadastro no Worker publicado, aplique o SQL ao projeto e configure `SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` como variáveis do Worker e `SUPABASE_SERVICE_ROLE_KEY` como secret. Use o mesmo projeto Supabase no build e no Worker.

Autentique o Wrangler com `npx --yes wrangler@4.147.0 login` usando a conta Cloudflare correta e publique com `npm run deploy:cloudflare`. O Wrangler informa o endereço `workers.dev` ao concluir. As rotas de pagamento ficam desativadas na configuração padrão do Worker. Para habilitá-las no Worker publicado, cadastre `MP_ACCESS_TOKEN` de produção e `SUPABASE_SERVICE_ROLE_KEY` como segredos. Defina `APP_URL` com o endereço HTTPS da publicação, `SUPABASE_URL` com a URL do projeto e `ENABLE_PRODUCTION_PAYMENTS` com o valor `true` nas variáveis do Worker.

Antes de publicar, substitua e revogue as credenciais antigas do Mercado Pago, Gemini e Supabase que já foram expostas no código ou no histórico do repositório.
