# Core Technical Specification (CTS) — Portal da Comunidade

## 1. Stack Tecnológica (Tech Stack)

### 1.1. Frontend
- **Framework**: Next.js 16.2.1 (App Router, Turbopack)
- **Componentes**: React 19 (Client & Server Components)
- **Estilização**: Tailwind CSS 4.2.2 (via `@tailwindcss/postcss`)
- **Tipografia**: Geist Sans & Mono (Google Fonts / Vercel Fonts)
- **Ícones**: SVG inline (Heroicons patterns)

### 1.2. Backend & Infraestrutura
- **Runtime**: Node.js 20+
- **Autenticação**: Firebase Auth (Client & Admin SDK)
- **Banco de Dados**: cloud.firestore (NoSQL)
- **Hospedagem**: Firebase Hosting
- **Pagamentos**: Stripe Node.js SDK (Subscriptions, Checkout, Webhooks)

## 2. Estrutura do Projeto (Project Architecture)

### 2.1. Diretórios Principais
- `src/app/`: Rotas Next.js (Admin, Protected, Auth)
- `src/lib/`: Configurações de serviços (Firebase, Firestore, Stripe)
- `src/contexts/`: Contextos globais (AuthContext)
- `src/components/`: Componentes UI reutilizáveis
- `functions/`: (Futuro/Expansão) Firebase Cloud Functions

### 2.2. Fluxo de Autenticação
1. Login via `Firebase SDK` (Client).
2. Chamada para `/api/auth/session` gerando cookie HTTP-only `__session`.
3. Sincronização de perfil no Firestore via `/api/auth/sync-user`.

## 3. Esquema de Dados (Data Models - Firestore Collections)

### 3.1. `users`
- `uid` (doc id)
- `email`, `name`, `avatarUrl`, `bio`
- `role` (MEMBER | ADMIN)
- `createdAt`, `updatedAt`

### 3.2. `subscriptions`
- `userId` (doc id, local link)
- `stripeCustomerId`, `stripeSubscriptionId`, `stripePriceId`
- `status` (ACTIVE | INACTIVE | CANCELLED | PAST_DUE)
- `currentPeriodEnd`

### 3.3. `videos` & `materials`
- `title`, `description`, `url`, `thumbnail`
- `categoryId`, `tags`
- `isPremium` (boolean)
- `publishedAt`, `createdAt`, `updatedAt`

## 4. Integração Financeira (Stripe)
- **Workflow**: Checkout Session -> Webhook -> Firestore Update.
- **Webhooks tratados**: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`.

---
**Data de Criação**: 2026-03-28  
**Versão**: 1.0 (BMad Initiation)
