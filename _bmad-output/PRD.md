# Product Requirements Document (PRD) — Portal da Comunidade

## 1. Visão Geral (Vision Statement)
O **Portal da Comunidade** é um espaço exclusivo para contadores compartilharem experiências práticas, experimentos reais e resultados com Inteligência Artificial, sem jargões ou "gurus". É uma plataforma de aprendizado colaborativo focada em aplicações reais de tecnologia no setor contábil.

## 2. Público-Alvo (Target Audience)
- **Contadores de Pequenas e Médias Empresas**: Buscam otimização de processos via IA.
- **Educadores/Palestrantes Contábeis**: Desejam compartilhar conteúdo prático.
- **Membros Administradores**: Curadores do conteúdo e moderadores da comunidade.

## 3. Funcionalidades Principais (Core Features)

### 3.1. Autenticação e Perfil (Auth & Profile) — [STATUS: IMPLEMENTADO (Firebase)]
- Login/Cadastro por Email e Senha.
- Login Social (Google).
- Perfil do usuário com nome, foto e status de assinatura.
- Controle de sessões via cookies (Firebase Admin SDK).

### 3.2. Catálogo de Conteúdo (Content Catalog) — [STATUS: EM DESENVOLVIMENTO]
- **Vídeos**: Listagem por categorias, visualização de vídeos (YouTube/Vimeo embed).
- **Materiais**: Repositório de PDFs, links e recursos práticos para download.
- **Categorias**: Organização temática do conteúdo.

### 3.3. Interação Social (Social Interaction)
- **Comentários**: Espaço para discussões em vídeos e materiais.
- **Likes**: Sistema de curtidas em comentários.
- **Respostas**: Comentários aninhados (replies).

### 3.4. Assinaturas e Monetização (Subscription & Stripe) — [STATUS: INTEGRANDO]
- Integração com Stripe para planos de assinatura (Membro/Premium).
- Liberação de conteúdo exclusivo (Premium) com base no status da assinatura.
- Portal do Cliente (Stripe Billing Portal) para gestão de cobranças.

### 3.5. Painel Administrativo (Admin Dashboard)
- Gestão CRUD de Categorias, Vídeos e Materiais.
- Moderação básica de comentários.

## 4. Requisitos Não Funcionais (Non-Functional Requirements)
- **Tecnologia**: Next.js 16 (App Router), Firebase (Auth/Firestore/Hosting), Tailwind CSS 4.
- **Performance**: Tempo de carregamento rápido e otimização de fontes (Geist).
- **SEO**: Títulos e metadados descritivos para cada página.
- **Segurança**: Regras de segurança robustas no Firestore e Auth.

## 5. Roteiro (Roadmap)
- **Fase 1 (Atual)**: Estabilização do Firebase, migração completa do Prisma e ajuste do Auth.
- **Fase 2**: Implementação final do sistema de comentários e curtidas.
- **Fase 3**: Lançamento do Portal do Admin completo.
- **Fase 4**: Integração final com Stripe e lançamento da área Premium.

---
**Data de Criação**: 2026-03-28  
**Versão**: 1.0 (BMad Initiation)
