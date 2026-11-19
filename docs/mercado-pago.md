# Manual de implementação do Mercado Pago

O Sparky usa o Checkout Pro hospedado para vender os planos vitalícios Starter e Pro em BRL. Para implementar e medir o fluxo por pedido, use o Checkout Pro via **Orders API**. Há também um fluxo via Preferences, que cria uma preferência e confirma o pagamento pela Payments API. Os IDs e as operações dos dois fluxos são diferentes. [Checkout Pro via Orders](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/overview?scope=prod) · [Checkout Pro via Preferences](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-preferences/overview?scope=prod)

## Preparar a aplicação do vendedor

1. Em **Suas integrações**, crie ou selecione a aplicação de Checkout Pro da conta que receberá os pagamentos. Use o Access Token da seção **Credenciais de teste** no sandbox e o de **Credenciais de produção** para vendas reais. Mantenha `MP_ACCESS_TOKEN` como segredo do servidor e use a seção do painel para identificar o ambiente. [Criar aplicação](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/create-application?scope=prod) · [Credenciais](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/resources/credentials?scope=prod)
2. Instale as dependências com `npm ci`. O servidor usa o SDK oficial `mercadopago` 3.6.2 com `MercadoPagoConfig` e `Order`. Defina `MP_CHECKOUT_API=orders` no ambiente do servidor para selecionar este fluxo. O padrão do projeto é `preferences`. `Order.create` envia a chave de idempotência por `requestOptions.idempotencyKey`. [SDK oficial para Node.js](https://github.com/mercadopago/sdk-nodejs) · [Opções das requisições](https://github.com/mercadopago/sdk-nodejs/blob/master/docs/request-options.md)
3. Aplique [supabase-mercado-pago-orders.sql](../supabase-mercado-pago-orders.sql) ao banco do ambiente. Ele cria `mercado_pago_orders` com acesso reservado à `service_role`. Configure `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no servidor e `APP_URL` com a origem HTTPS pública do app. Veja o [exemplo de ambiente](../env-exemplo.txt).
4. Em **Configuração de Webhooks**, cadastre `<APP_URL>/api/payment-webhook` no ambiente correspondente, selecione **Order (Mercado Pago)** e salve. Use **Simular notificação** para verificar a entrega e realize depois uma compra de teste para conferir a atualização real do pedido. [Webhooks do Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/notifications?scope=prod)
5. Para o Worker local, use as credenciais de teste e execute `npm run dev:payments`. Use uma URL HTTPS que encaminhe as notificações ao Worker de teste e mantenha uma conta Sparky de teste para verificar a liberação do plano. A publicação usa a configuração do Worker descrita no [README](../README.md).

## Criar e conciliar uma tentativa de pagamento

`POST /api/create-checkout` calcula preço e descrição do plano no servidor. No fluxo Orders ele reserva no Supabase uma referência UUID opaca para o par perfil e tentativa. Esse UUID é enviado em `external_reference` e em `X-Idempotency-Key`, respeitando o limite de 64 caracteres da referência. O vínculo com perfil e plano fica na tabela interna. Em caso de timeout, reutilize o mesmo `checkoutAttemptId` para obter a mesma referência e, se já gravados, o mesmo ID e URL do Mercado Pago. Uma nova tentativa deliberada recebe outro UUID. [Criação de pedido](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/create-order?scope=prod) · [Referência da API](https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro/create-order/post)

O pedido usa `type: online` e `processing_mode: manual`. A resposta traz um `id` `ORD…` ou `ORDTST…` e um `checkout_url`. O backend devolve a URL ao navegador em `initPoint`, que abre o checkout hospedado. Use o **Order ID** para consulta e administração e a **referência externa** para conciliação interna. [Criação de pedido](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/create-order?scope=prod)

Ao preencher o pedido, use os seguintes campos com os dados reais do catálogo e do comprador. [Referência de criação](https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro/create-order/post) · [Dados de indústria](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/payment-management/improve-payment-approval/industry-data?scope=prod)

| Campo | Origem do dado |
| --- | --- |
| `items[].external_code` e `items[].category_id` | Código estável do plano (`STARTER` ou `PRO`) e categoria do catálogo. Envie também o título, a descrição, a quantidade e o preço unitário. |
| `payer.first_name`, `payer.last_name` e `payer.identification` | Nome, sobrenome e documento informados pelo comprador. Envie o tipo `CPF` e o número como texto. |
| `payer.phone` | Telefone informado no checkout, em `area_code` e `number`, ambos como texto. |
| `additional_info["payer.is_first_purchase_online"]` | Booleano derivado do histórico da loja. Uma primeira compra exige que o histórico disponível confirme a ausência de compras anteriores. |
| `additional_info["payer.authentication_type"]` | Tipo da autenticação realizada na plataforma. Use `WEB` ou `MOBILE` de acordo com o fluxo de autenticação observado. |
| `additional_info["payer.last_purchase"]` e `additional_info["payer.registration_date"]` | Data e hora da última compra anterior e do cadastro na plataforma, respectivamente, em ISO 8601. Omita datas indisponíveis. |

As chaves `payer.*` da tabela são literais dentro do objeto `additional_info`. Os campos de histórico e autenticação dependem de uma fonte confiável de dados do comprador no servidor. Se o histórico anterior à integração estiver incompleto, mantenha o campo de primeira compra omitido até ter informação confiável. Consulte nos pedidos de teste o que o painel de qualidade reconheceu após enviar os dados. [Dados de indústria](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/payment-management/improve-payment-approval/industry-data?scope=prod)

### Confirmação e mensagens do comprador

As URLs `config.online.success_url`, `failure_url` e `pending_url` retornam o comprador ao app. O retorno pode incluir `order_id`. A query da URL ajuda a orientar a interface. A confirmação consulta a Orders API no servidor. [URLs de retorno](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/web-integration/configure-back-urls?scope=prod)

- O webhook recebe o ID do pedido e dispara `GET /v1/orders/{id}`. A concessão usa os dados dessa consulta autenticada. A validação da assinatura do webhook recomendada pelo Mercado Pago é uma etapa de produção pendente no Sparky. Confirme no sandbox que uma entrega repetida produz o mesmo resultado. [Webhooks](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/notifications?scope=prod)
- Como contingência quando o webhook atrasa ou falha, o app chama `POST /api/payment-confirm` com `orderId` e `userId`. O backend consulta o mesmo GET e verifica a associação com o perfil, moeda, plano e valor. A confirmação retorna `200` quando o pagamento está aprovado e pode retornar `409` com `pending`, `rejected` ou `cancelled` para outros estados conhecidos. O navegador guarda temporariamente o `orderId` da criação para consultar o pedido se o retorno vier sem o identificador. [Obter pedido por ID](https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro/get-order/get)
- A confirmação libera o acesso quando a order está `processed` com `status_detail: accredited` e o valor pago corresponde ao plano. `created`, `processing` e `action_required` mantêm a compra pendente. `failed` e `canceled` indicam falha e cancelamento, respectivamente. A tela deve apresentar **pagamento confirmado**, **pagamento em análise ou aguardando pagamento**, **pagamento recusado** ou **pagamento cancelado** conforme a confirmação do servidor. Para meios offline disponíveis, informe o próximo passo que aparece no checkout hospedado. [Estados dos pedidos](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/payment-management/status/order-status?scope=prod)

### Meios de pagamento e marca

O painel do checklist indicou cartão de crédito, cartão de débito, boleto, dinheiro em conta e Mercado Crédito como alcançados. A oferta no checkout depende da conta, do comprador e dos filtros do pedido. O Sparky atualmente exclui `ticket` nos dois fluxos. A ação de pagamento exibe a marca oficial, com proporção preservada e texto alternativo “Mercado Pago”. [Meios de pagamento do Checkout Pro](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/overview?scope=prod) · [Guia de marca](https://www.mercadopago.com.br/mp/logo-oficial) · [SVG oficial](https://raw.githubusercontent.com/mercadopago/cart-woocommerce/main/assets/images/mp-logo.svg)

### 3D Secure

O checkout envia `config.online.transaction_security.validation: on_fraud_risk` para solicitar a validação conforme o risco. O SDK também define `always` e `never`. O Mercado Pago lista suporte a 3DS 2.0 para Checkout Pro via Orders. O exemplo oficial detalhado com `liability_shift: required` e o fluxo para forçar um desafio são do Checkout Transparente via Orders. Valide a aceitação da configuração e o comportamento da autenticação no Checkout Pro com a aplicação do vendedor. Um retorno `201` ao criar o pedido confirma a criação e o desafio depende do risco, do emissor e da elegibilidade do pagamento. [Checkout Pro via Orders](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/overview?scope=prod) · [Tipos do SDK](https://github.com/mercadopago/sdk-nodejs/blob/master/src/clients/order/commonTypes.ts#L570) · [Guia 3DS do Checkout Transparente](https://www.mercadopago.com.br/developers/pt/docs/checkout-api-orders/payment-management/integrate-3ds?scope=prod)

## Validar no sandbox

Use o Access Token de **teste** da aplicação e abra o `checkout_url` em janela anônima, sem sessão do Mercado Pago. Informe um e-mail válido. Para usar o Mastercard de teste, preencha `5480 8328 0103 3311`, validade `11/30` e código `123`. Para aprovação ou recusa geral, use `APRO` ou `OTHE` no campo de nome do titular e o CPF de teste `12345678909`. Cada cenário começa com uma nova tentativa e deve ser acompanhado pelo GET do respectivo Order ID. [Compra de teste com cartão](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/integration-test/test-purchase-with-card?scope=prod)

| Cenário | O que verificar |
| --- | --- |
| Aprovado (`APRO`) | A order chega a `processed/accredited`, o app mostra a confirmação e o perfil de teste recebe o plano uma vez. |
| Recusado (`OTHE`) | A consulta confirma a falha, o app mostra a recusa e oferece voltar ao checkout. O plano do perfil permanece como estava. |
| Pendente (`CONT`) | Verifique a mensagem de espera e ausência de liberação enquanto o GET indicar estado intermediário. |
| Intermediário seguido de aprovação | Em um teste controlado, simule respostas GET sucessivas com `processing` ou `action_required` e depois `processed/accredited`. Verifique a liberação após a segunda leitura, inclusive com webhook indisponível. |
| Intermediário seguido de falha ou cancelamento | Em um teste controlado, simule `failed` e `canceled` após um estado intermediário. Confira cada mensagem e mantenha o plano inalterado. |
| Cancelamento solicitado pelo vendedor | Crie uma order de teste, consulte `created` sem valor pago, solicite o cancelamento e confirme `canceled` com GET. |
| Reembolsos | Para orders de teste elegíveis, verifique devolução parcial e total em pedidos separados. Confira o valor e o estado dos reembolsos no GET. |
| Reenvio de uma tentativa | Repita o mesmo `checkoutAttemptId` após uma perda simulada da resposta. Confira que a referência, a order e o link continuam os mesmos. |

Para exercitar o fluxo assíncrono com cartões, o guia descreve `capture_mode: automatic_async`. `automatic` aplica o modo binário. Os testes controlados cobrem a lógica do Sparky para mudanças de estado, inclusive quando o sandbox mantém um pagamento em aberto ou o meio offline escolhido está indisponível. [Modos de captura](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/create-order?scope=prod) · [Estados dos pedidos](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/payment-management/status/order-status?scope=prod)

Para medir a integração em **Suas integrações › Qualidade da integração**, use o `ORDTST…` de um pagamento processado com credenciais de teste da mesma aplicação nos últimos sete dias. Copie o `id` do pedido retornado por `GET /v1/orders/{id}`. [Medição da qualidade](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/integration-quality?scope=prod)

## Cancelar e reembolsar pedidos

Use `POST /api/admin-payment-action` com um token administrativo no header `Authorization: Bearer ...`, origem autorizada e `X-Idempotency-Key` UUID v4 exclusivo para cada ação. Preserve a chave ao tentar novamente a mesma operação. O servidor consulta a order e valida a referência e o valor antes de operar. A rota retorna `200` para cancelamento, `201` para reembolso e `409` para estado inválido, saldo insuficiente ou conflito com o estado do provedor. Depois de timeout ou conflito, consulte o pedido para determinar se o provedor já aplicou a ação. [Referência de cancelamento](https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-orders/cancel-order/post) · [Referência de reembolso](https://www.mercadopago.com.br/developers/pt/reference/online-payments/checkout-pro-orders/refund-order/post)

| Ação | Dados do endpoint do Sparky | Verificação |
| --- | --- | --- |
| Cancelar | `action: "cancel"` e `orderId` | A order precisa estar `created`, sem valor pago. Consulte se passou a `canceled`. |
| Reembolsar totalmente | `action: "refund"` e `orderId` | Use uma order capturada. O SDK solicita reembolso total com corpo vazio ao Mercado Pago. |
| Reembolsar parcialmente | `action: "refund"`, `orderId`, `amount` como texto decimal em BRL, e `transactionId` quando houver mais de um pagamento elegível | Use o ID `PAY…` da transação interna. A soma das devoluções deve caber no saldo reembolsável. Consulte `transactions.refunds` para confirmar o resultado. |

O prazo e o saldo disponível para o reembolso são controlados pelo Mercado Pago. O pedido pode apresentar um reembolso ainda em processamento. Para conciliar o resultado, consulte sua situação pelo ID da order e registre a operação no atendimento financeiro do vendedor. Revise o acesso do perfil separadamente conforme a política do vendedor, incluindo outras compras que concedam o mesmo plano. [Reembolsos e cancelamentos](https://www.mercadopago.com.br/developers/pt/docs/checkout-pro-orders/refunds-cancellations?scope=prod)

## Operar e acompanhar

- Registre no servidor a operação e seu resultado, o status HTTP e, quando disponível, o identificador de requisição do provedor ou a referência opaca. Investigue falhas de criação, consulta e webhook pelo horário e pelo ambiente. Mantenha tokens, assinaturas, CPF, telefone, e-mail e corpos de requisição fora dos logs.
- Vá a **Relatórios e faturamento › Relatórios de vendas e extratos de conta › Liberações** e gere o relatório do período. Use os valores liberados, ajustes e saques para conciliar o saldo disponível. [Gerar Liberações](https://www.mercadopago.com.br/developers/pt/docs/reports/released-money/panel)
- Abra **Dinheiro em conta** no mesmo menu para gerar o relatório chamado **Todas as transações** na API. Use os movimentos que afetaram o saldo, como pagamentos aprovados, devoluções, contestações e taxas. Cruze o identificador do pagamento quando disponível com o pedido e a referência externa armazenada no Sparky. Em contas de teste, o relatório pode ser gerado com dados vazios. [Gerar Dinheiro em conta](https://www.mercadopago.com.br/developers/pt/docs/reports/account-money/panel) · [API de relatórios](https://www.mercadopago.com.br/developers/pt/reference/reports/overview)

### OAuth para marketplace

O Sparky usa o Access Token direto da aplicação da própria conta vendedora. Os requisitos de `state` e de renovação automática de OAuth se aplicam se a plataforma passar a atuar em nome de outros vendedores, com autorização individual. Nesse caso, gere um `state` aleatório de uso único sem dados pessoais, vincule-o à tentativa de vinculação e compare-o no callback antes de trocar o código. Quando o vendedor conceder `offline_access`, programe a renovação antes da expiração indicada por `expires_in` e grave em segurança o novo Access Token e o novo `refresh_token` retornados juntos. [Obter Access Token OAuth](https://www.mercadopago.com.br/developers/pt/docs/security/oauth/creation) · [Renovar Access Token OAuth](https://www.mercadopago.com.br/developers/pt/docs/security/oauth/renewal)
