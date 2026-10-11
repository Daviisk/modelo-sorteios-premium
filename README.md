# RifaFácil — Plataforma de Rifas Online (MVP)

MVP funcional de uma plataforma de rifas: o participante escolhe números
(00–99 na versão inicial), paga via PIX, e o administrador gerencia rifas,
pedidos e sorteios.

> **Aviso legal:** este software não garante, por si só, conformidade legal
> para a realização de rifas/sorteios. O organizador é responsável por
> verificar as regras e autorizações aplicáveis à modalidade da campanha e
> à sua jurisdição antes de utilizá-lo.

## Tecnologias

Next.js 14 (App Router) · React 18 · TypeScript · Tailwind CSS · PostgreSQL · Prisma ORM · JWT (jose) · bcrypt · Zod · Vitest

## Requisitos

- Node.js 18+
- PostgreSQL 14+ (local ou hospedado — Supabase, Neon, Railway, etc.)

## Instalação

```bash
npm install
cp .env.example .env
# edite o .env com sua string de conexão do PostgreSQL e os segredos
```

## Banco de dados

```bash
npm run db:migrate   # cria as tabelas
npm run db:seed       # popula com a rifa de demonstração
```

O seed cria:
- um usuário admin: `admin@rifademo.com.br` / `admin123`
- a rifa "iPhone 17 Pro Max" (100 números, alguns já vendidos/reservados para demonstração)

## Executar

```bash
npm run dev
```

- Página pública: http://localhost:3000/rifa/iphone-17-pro-max
- Admin: http://localhost:3000/admin/login

## Testes

```bash
npm test
```

O teste em `tests/reserve-race-condition.test.ts` valida especificamente que
**dois pedidos concorrentes não conseguem reservar o mesmo número** —
requer um PostgreSQL real conectado via `DATABASE_URL`.

## Liberação de reservas expiradas (cron)

Reservas de números duram `RESERVATION_MINUTES` (padrão: 10 min). Para
liberá-las automaticamente, escolha uma opção:

- **Cron do sistema/servidor:** agende `npm run cron:release` para rodar a cada minuto.
- **Vercel Cron:** configure em `vercel.json` para chamar
  `GET /api/cron/release-expired` com o header
  `Authorization: Bearer $CRON_SECRET`.

## Pagamento PIX

O sistema usa uma camada de abstração (`PaymentProvider`) em
`src/lib/services/paymentService.ts`. Por padrão (`PAYMENT_PROVIDER=mock`),
um QR code de demonstração é gerado e o pagamento pode ser aprovado
manualmente pelo botão "Simular pagamento aprovado" na tela de PIX (rota
interna `/api/dev/simulate-payment`, disponível **apenas** com o provider mock).

### Para usar um gateway real

1. Implemente uma classe em `paymentService.ts` seguindo a interface
   `PaymentProvider` (ex: `MercadoPagoProvider`), usando as credenciais
   reais do gateway (variáveis de ambiente correspondentes já estão em
   `.env.example`).
2. Registre-a em `getPaymentProvider()`.
3. Configure `PAYMENT_PROVIDER` no `.env` para o novo provider.
4. Configure a URL de webhook do gateway apontando para
   `POST /api/webhooks/payment` — o endpoint já é idempotente (não duplica
   processamento se o mesmo evento chegar duas vezes).

Gateways sugeridos com suporte a PIX: Mercado Pago, Asaas, Pagar.me, Efí,
Woovi/OpenPix.

## Deploy

1. Provisione um PostgreSQL (Supabase/Neon/Railway/RDS).
2. Configure as variáveis de ambiente na plataforma de hospedagem (Vercel, etc.).
3. Rode `npx prisma migrate deploy` no processo de build/release.
4. Configure o cron de liberação de reservas (`/api/cron/release-expired`).
5. Troque `PAYMENT_PROVIDER` para o gateway real e configure o webhook nele.

## Funcionalidades implementadas

- Schema completo do banco (User, Raffle, RaffleNumber, Participant, Order,
  OrderItem, Payment, WebhookEvent, Draw, Settings)
- Página pública da rifa: grade 00–99, seleção múltipla, cálculo de total,
  resumo fixo (mobile-first), atualização quase em tempo real via polling
- Reserva de números **sem condição de corrida**, usando transação
  Serializable + `updateMany` condicional no banco (não apenas no frontend)
- Checkout com validação de CPF (dígitos verificadores), WhatsApp e e-mail
  no servidor (nunca só no cliente)
- Fluxo de pagamento PIX com camada de abstração (mock funcional + pontos
  de extensão para gateways reais)
- Webhook de pagamento idempotente (`/api/webhooks/payment`)
- Job de liberação de reservas expiradas (CLI + endpoint HTTP para cron)
- Autenticação de admin (JWT em cookie httpOnly, senha com bcrypt) e
  middleware protegendo `/admin/*` e `/api/admin/*`
- Dashboard administrativo com métricas (arrecadação, vendidos, reservados,
  disponíveis, pedidos, conversão)
- Criação e edição de rifas pelo admin (com trava contra redução
  inconsistente da quantidade de números)
- Grade de números do admin com filtros (todos/disponíveis/reservados/
  vendidos) e detalhe do participante por número
- Lista de pedidos com filtro por status e busca (nome, CPF, WhatsApp,
  e-mail, nº do pedido)
- Lista de participantes com busca, total gasto e quantidade de números
- Módulo de sorteio com animação visual, usando fonte de aleatoriedade
  criptográfica (`crypto.randomInt`), registrando método, semente e
  administrador responsável
- Página pública de resultado do sorteio (`/rifa/[slug]/resultado`)
- Página de configurações da plataforma (nome, logo, contato, cores,
  termos — nunca credenciais de gateway, que ficam só em `.env`)
- Página de consulta pública de pedido (`/pedido/[id]`)
- SEO: metadata por rifa, Open Graph, sitemap.xml e robots.txt dinâmicos
- Seed com dados de demonstração claramente identificados
- Teste automatizado da regra mais crítica do sistema (concorrência na
  reserva de números)
- Função de anonimização de participante para atendimento a solicitações
  LGPD (`anonymizeParticipant`, sem endpoint público ainda — uso manual/CLI)

## O que fica para a próxima leva (não implementado ainda)

- Upload de imagens (atualmente apenas URL de imagem)
- Integração com gateways adicionais além do Mercado Pago
- Notificações automáticas por e-mail/WhatsApp
- Testes adicionais (expiração automática, webhook idempotente, permissões
  administrativas, cálculo de total)
- Endpoint/tela para exclusão ou anonimização de dados sob demanda do
  participante (função de serviço já existe, falta a interface)
- Ativação de tema claro/escuro e personalização visual por rifa (cor
  primária já está no schema, falta aplicar dinamicamente na página pública)

## Integrações que exigem credenciais reais para funcionar em produção

- Gateway de pagamento PIX (Mercado Pago / Asaas / Pagar.me / Efí / Woovi)
- Banco de dados PostgreSQL hospedado
- (Opcional) serviço de envio de WhatsApp/e-mail para notificações

## PIX com Mercado Pago

Configure no servidor:

```env
PAYMENT_PROVIDER=mercadopago
MERCADOPAGO_ACCESS_TOKEN=seu_access_token
MERCADOPAGO_WEBHOOK_SECRET=sua_assinatura_secreta
MERCADOPAGO_NOTIFICATION_URL=https://modelo-sorteios-premium-two.vercel.app/api/webhooks/payment
RESERVATION_MINUTES=32
```

O checkout cria cobranças pela Orders API (`/v1/orders`), com chave de
idempotência por pedido, e exibe QR Code e código copia e cola. Não é necessário
Public Key para esse fluxo no servidor. Crie a aplicação como **Pagamentos online →
Checkout Transparente → API de Orders**. A URL do webhook é configurada no painel,
não no corpo da criação da order. O ID ORD é armazenado como transactionId;
pagamentos antigos com ID numérico ainda são consultados pela API anterior.

No painel da aplicação no Mercado Pago, configure o evento **Order (Mercado Pago)** e
copie a assinatura secreta para `MERCADOPAGO_WEBHOOK_SECRET`. O webhook deve estar
publicamente acessível por HTTPS, sem proteção de login da Vercel. Cada aviso é
validado por HMAC e o servidor consulta a API para conferir ID, referência,
moeda, método e valor antes de confirmar a compra. A página consulta o estado
local a cada cinco segundos e exibe a confirmação automaticamente.

Para testes, utilize credenciais e dados de comprador de teste compatíveis com
a Orders API. Não misture credenciais entre aplicações/ambientes. A ativação
em produção depende das permissões da conta Mercado Pago. Após alterar as
variáveis na Vercel, faça redeploy. Pedidos antigos de demonstração continuam
sendo de demonstração; crie um novo pedido para verificar a integração.

A reserva com Mercado Pago dura no mínimo 32 minutos, em conformidade com o
mínimo de 30 minutos do PIX da Orders API. Se um pagamento for confirmado
quando os números já não pertencerem ao pedido, o sistema bloqueia a venda
inconsistente e retorna erro no webhook para revisão do administrador. Não
redistribui números já reservados/vendidos a outro comprador.

O modo mock não aceita webhooks externos, e o endpoint de simulação só confirma
pagamentos mock. A simulação não é exibida em cobranças Mercado Pago. Nunca
publique credenciais ou arquivos `.env` no GitHub.

Validação automatizada sem credenciais reais:

```bash
npx tsc --noEmit
npx vitest run tests/admin-auth.test.ts tests/mercado-pago.test.ts tests/payment-confirmation.test.ts
```

## Preço temporário de validação

`src/lib/rafflePricing.ts` aplica R$ 0,01 por número na vitrine, checkout e
itens de novos pedidos. Os preços originais das rifas continuam armazenados.
Para restaurá-los, altere `TEMPORARY_NUMBER_PRICE` para `null`. Pedidos e cobranças
já emitidos mantêm seus valores.

Para cobrar em produção, configure `PAYMENT_PROVIDER=mercadopago` e use o
Access Token **produtivo** da aplicação Checkout Transparente / Orders API
na variável `MERCADOPAGO_ACCESS_TOKEN`. Configure o webhook em modo de produção
e atualize `MERCADOPAGO_WEBHOOK_SECRET` com a chave correspondente. O ambiente
do Mercado Pago é determinado pelas credenciais, não pelo domínio da Vercel.

## Privacidade e proteção de dados

As páginas `/privacidade`, `/cookies`, `/termos` e `/privacidade/direitos`
explicam o tratamento e o atendimento. Configure `PRIVACY_CONTROLLER_NAME`
com a identificação jurídica correta e `PRIVACY_CONTACT_EMAIL` com um canal
monitorado (ou use o e-mail/WhatsApp real em Configurações). Não publique
contatos fictícios. A adequação também depende das atividades do controlador,
não apenas de código: registre as bases legais, prazos de retenção, fornecedores,
regiões, contratos e mecanismos de transferência internacional aplicáveis.

Pedidos são consultáveis pelo navegador que os criou durante 30 dias ou pelo
administrador. Pedidos anteriores à atualização precisam de atendimento
administrativo; o ID isolado não permite acesso. Cookies de autorização são
HttpOnly e Secure em produção; não compartilhar cookies. Resultados públicos
mostram o primeiro nome e iniciais. As APIs e páginas administrativas/pedidos
não devem ser armazenadas por caches compartilhados ou indexadas.

O administrador pode exportar dados do titular e remover identificadores
diretos após verificar a identidade e analisar a retenção. Essa remoção não
garante anonimização irreversível: histórico financeiro, pagamentos, backups
e exportações exigem avaliação própria. Não há exclusão automática por prazo
inventado. Bloqueie operações indevidas, trate incidentes conforme regras da
ANPD e mantenha plano de resposta, backups e permissões mínimas de infraestrutura.
O checkout não sobrescreve perfis existentes sem autenticação. A identidade
do participante não é verificada por SMS/e-mail; o organizador deve conferir
a identidade antes de divulgar dados, atender solicitações ou entregar prêmios.

## Tratamento de erros

`not-found.tsx`, `error.tsx` e `global-error.tsx` tratam falhas de navegação e
renderização. `/erro/[tipo]` tem orientações para 400, 401, 403, 404, 409, 410,
422, 429, 500, 502, 503, 504, conexão e pagamento. Essas páginas de orientação
têm status de navegação normal; as APIs preservam seus códigos HTTP reais.
Erros inesperados do checkout e login não exibem mensagens de banco de dados
ou detalhes de configuração ao participante. Falhas de infraestrutura fora da
aplicação (DNS, TLS, indisponibilidade da Vercel) não podem renderizar suas páginas.

Em Configurações, altere a senha de demonstração se ela ainda estiver em uso.
A alteração invalida as sessões anteriores ao comparar a versão da credencial
com o cadastro atual; administradores removidos ou sem perfil ADMIN não mantêm
acesso aos dados. A atualização de segurança exige entrar novamente uma vez.
O painel de Participantes também permite corrigir nome e contatos após a
verificação de identidade.

O seed não redefine a senha de um administrador existente. Em produção,
novos administradores via seed exigem `SEED_ADMIN_EMAIL` e
`SEED_ADMIN_PASSWORD` com pelo menos 12 caracteres; essas variáveis não
substituem o login de uma conta já criada. A proteção de tentativas do login
e checkout é local à instância, mantém chaves de IP com HMAC e janela de um
minuto, e deve ser complementada por controle distribuído/WAF conforme o volume.


## Domínio oficial

Produção: https://modelo-sorteios-premium-two.vercel.app

O domínio público está centralizado em `src/lib/site.ts` e é usado no sitemap,
robots, URLs canônicas e compartilhamento. Links internos e cookies de sessão
continuam relativos ao host acessado, permitindo desenvolvimento local.

Na Vercel, configure `MERCADOPAGO_NOTIFICATION_URL` como
`https://modelo-sorteios-premium-two.vercel.app/api/webhooks/payment` e publique novamente se
alterar essa variável. Na integração Orders do Mercado Pago, atualize também a
URL de notificações no painel da aplicação; a variável sozinha não altera o
cadastro externo. Preserve o segredo de assinatura e as credenciais existentes.

