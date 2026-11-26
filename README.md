<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sparky

Aplicação React com APIs serverless para administração, checkout e geração de conteúdo.

## Configuração local

1. Instale as dependências com `npm install`.
2. Use [env-exemplo.txt](env-exemplo.txt) como guia para preencher `.env.local`. As chaves `ADMIN_PASSWORD`, `ADMIN_TOKEN_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, `MP_ACCESS_TOKEN` e `GEMINI_API_KEY` são somente do servidor; não use prefixo `VITE_` nelas.
3. Gere o segredo do token administrativo com `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` e defina uma senha administrativa longa e única.
4. No SQL Editor do projeto Supabase, execute [supabase-rls.sql](supabase-rls.sql), [supabase-security.sql](supabase-security.sql) e [supabase-terms.sql](supabase-terms.sql) nessa ordem sobre a tabela `profiles` existente. Execute também [supabase-mercado-pago-orders.sql](supabase-mercado-pago-orders.sql) se usar o checkout, inclusive no modo Preferences.
5. Rode `npm run dev` e abra `http://127.0.0.1:3000`. Para executar também as demais funções, rode `npx vercel dev`.

Os exploradores entram com nome e senha. Perfis antigos ainda sem um usuário no Supabase Auth são vinculados no primeiro login com a senha já cadastrada. Cada explorador usa um endereço interno no Auth, então o mesmo e-mail de contato pode ser usado por vários perfis. O cadastro libera a entrada imediata e mantém o e-mail do responsável no perfil.

Após aplicar as migrações e publicar a versão que aceita verificadores legados, confirme o login e execute `select public.sparky_backfill_legacy_passwords(25);` em lotes. Verifique o trabalho restante com `select count(*) from public.profiles where auth_user_id is null and password is not null;`. Quando a contagem chegar a zero, use somente versões que aceitem os verificadores em eventual rollback.

O plano pago é alterado no servidor depois que o pagamento é consultado na API do Mercado Pago. Configure `APP_URL` para a origem HTTPS pública da aplicação, cadastre `/api/payment-webhook` como endpoint de notificação e salve a assinatura secreta do painel do Mercado Pago como `MP_WEBHOOK_SECRET` no servidor.

Para verificar o checkout pelo Cloudflare Workers local, use credenciais de teste do Mercado Pago no `.env.local` e rode `npm run dev:payments`. Configure `APP_URL` com o endereço HTTPS público que encaminha para o Worker local para receber o retorno do checkout e as notificações.

Para testar o Checkout Pro via Orders API, aplique a migração [supabase-mercado-pago-orders.sql](supabase-mercado-pago-orders.sql) no banco do ambiente e defina `MP_CHECKOUT_API=orders` no servidor. Configure o evento **Order (Mercado Pago)** para `<APP_URL>/api/payment-webhook`. A opção padrão é `preferences`. Consulte o [manual de implementação e testes](docs/mercado-pago.md).

## Painel do dono

Acesse `/#/admin` no endereço do Sparky (localmente, `http://127.0.0.1:3000/#/admin`). Use a senha `ADMIN_PASSWORD` do servidor. Configure `ADMIN_TOKEN_SECRET` com pelo menos 32 caracteres. O token fica na memória da página, expira após uma hora e é revogado ao sair do painel. Após a atualização, entre novamente para criar uma sessão registrada.

Execute [supabase-admin.sql](supabase-admin.sql) no SQL Editor do mesmo projeto Supabase, após `supabase-rls.sql`. A migração registra a data dos novos perfis e recupera datas antigas quando o Supabase Auth confirma a criação da conta. O filtro **Sem data registrada** encontra os demais perfis.

A aba **Financeiro** consulta as cobranças do Sparky criadas nos últimos 30 dias com `MP_ACCESS_TOKEN`. Ela indica quando os resultados são parciais. Para conferir saldo liberado e movimentações da conta, abra o Mercado Pago pelo painel e acesse **Seu dinheiro**.

No Worker publicado, configure `ADMIN_PASSWORD`, `ADMIN_TOKEN_SECRET` e `SUPABASE_SERVICE_ROLE_KEY` como segredos e `SUPABASE_URL` como variável. Para consultar cobranças, configure também `MP_ACCESS_TOKEN` como segredo.

## Publicação no Cloudflare Workers

O leitor de cursos busca o material completo no bucket R2 privado `aventura-do-sparky-premium-content`, configurado pelo binding `PREMIUM_CONTENT`. As duas capas de amostra são públicas. Os PDFs e as demais páginas ficam em `private-course-assets`, fora do build público.

Antes da primeira publicação, crie o bucket na mesma conta do Worker com `npx --yes wrangler@4.147.0 r2 bucket create aventura-do-sparky-premium-content`. Mantenha o acesso público por domínio personalizado e por `r2.dev` desativado. No painel do bucket ou via Wrangler, envie os arquivos preservando os caminhos relativos a `private-course-assets`. Por exemplo, `private-course-assets/pdfs/guia_completo_aulas_tecnologia_2025.pdf` usa a chave `pdfs/guia_completo_aulas_tecnologia_2025.pdf`.

Para enviar todos os arquivos a partir da raiz do projeto no PowerShell, execute os comandos abaixo. Use `--local` no lugar de `--remote` para carregar o R2 emulado antes de rodar o Worker local. O Vite local lê os arquivos diretamente após verificar a sessão e o plano.

```powershell
$premiumAssetRoot = (Resolve-Path -LiteralPath './private-course-assets').Path
Get-ChildItem -LiteralPath $premiumAssetRoot -File -Recurse | ForEach-Object {
    $premiumAssetKey = $_.FullName.Substring($premiumAssetRoot.Length + 1).Replace('\', '/')
    npx --yes wrangler@4.147.0 r2 object put "aventura-do-sparky-premium-content/$premiumAssetKey" --file $_.FullName --remote
    if ($LASTEXITCODE -ne 0) { throw "Falha ao enviar $premiumAssetKey" }
}
```

O Worker serve o conteúdo de `dist`, encaminha rotas como `/auth` para a SPA e executa as funções de `api/` no mesmo endereço. Configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no ambiente de build ou no `.env.local` ao compilar pela máquina local. Essas duas variáveis são incorporadas ao JavaScript do navegador. Para habilitar login e cadastro no Worker publicado, aplique o SQL ao projeto e configure `SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` como variáveis do Worker e `SUPABASE_SERVICE_ROLE_KEY` como secret. Use o mesmo projeto Supabase no build e no Worker.

Autentique o Wrangler com `npx --yes wrangler@4.147.0 login` usando a conta Cloudflare correta e publique com `npm run deploy:cloudflare`. O Wrangler informa o endereço `workers.dev` ao concluir. As rotas de pagamento ficam desativadas na configuração padrão do Worker. Para habilitá-las no Worker publicado, cadastre `MP_ACCESS_TOKEN` de produção e `SUPABASE_SERVICE_ROLE_KEY` como segredos. Defina `APP_URL` com o endereço HTTPS da publicação, `SUPABASE_URL` com a URL do projeto e `ENABLE_PRODUCTION_PAYMENTS` com o valor `true` nas variáveis do Worker.

Antes de publicar, substitua e revogue as credenciais antigas do Mercado Pago, Gemini e Supabase que já foram expostas no código ou no histórico do repositório.
