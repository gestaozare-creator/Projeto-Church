# PRD - Projeto Church (Gestão Zare)

## 📌 Visão Geral do Sistema
Plataforma SaaS multi-tenant unificada para gestão de igrejas, redes ministeriais, secretarias, financeiro, departamentos e eventos.

---

## 🚀 Histórico de Atualizações Recentes & Memória Longa

### 1. Campos Obrigatoriamente Inclusos no Cadastro de Membros
- **Campos Adicionados:** `É Batizado(a) nas Águas?` (`is_baptized`) e `Data do Batismo` (`baptism_date`).
- **Validação de Obrigatoriedade:** 
  - `Data de Nascimento` (*)
  - `Estado Civil` (*)
  - `É Batizado(a) nas Águas?` (*)
  - `Data do Batismo` (*) -> Obrigatório se a resposta para batismo for "Sim".
- **Locais Aplicados:**
  - Formulário público online (`/formulario-membro`).
  - Modal administrativo de cadastro/edição de membros (`/`).
  - Visualização da Ficha do Membro.

### 2. Atualização da Carteirinha Digital do Membro
- **Alteração do Rótulo:** O campo **DATA DA INTEGRAÇÃO** foi substituído por **DATA DO BATISMO**.
- Exibe dinamicamente a data do batismo cadastrada no formulário ou pelo sistema.
- Aplicado na carteirinha interativa e no painel de personalização da carteirinha (`ChurchIdCardTab.tsx`).

### 3. Reformulação dos Gráficos do Dashboard da Secretaria (`/dashboard-secretaria`)
- **Substituição:** O gráfico de *Membros por Ministérios* foi substituído pelo novo gráfico de **Membros Batizados** (Sim / Não / Não Informado).
- **Sequência Oficial dos Gráficos de Rosca:**
  1. `🏢 Membros por Funções/Depart.`
  2. `🌊 Membros Batizados`
  3. `💼 Situação Profissional`
  4. `👷 Profissões`

### 4. Inteligência Financeira e Métrica de Infraestrutura SaaS (`/admin/igrejas`)
- O painel de infraestrutura SaaS detecta automaticamente o uso do Supabase.
- Quando o projeto atinge >10 administradores ou >500MB, a interface expande a projeção para os limites do **Plano Pro (8 GB / Conexões Ilimitadas)**, ajustando dinamicamente as barras de progresso de uso.

### 5. Rolagem Fluida e Contenção de Altura nos Quadros Kanban (`/financeiro/pagar`, `/financeiro/receber`, `/visitantes`)
- **Correção de Rolagem:** Implementada contenção de altura nas colunas (`grid-template-rows: minmax(0, 1fr)`, `min-height: 0` e `height: 100%`), permitindo a visualização de centenas de cartões (ex: +200 contas pagas) sem quebrar o layout da página.
- **Barra de Rolagem Customizada:** Adicionada barra de rolagem independente, sutil e translúcida (`::-webkit-scrollbar`), compatível com rolagem por mouse (scroll wheel) e toque.
- **Cabeçalhos Fixos (Sticky com Backdrop Blur):** Cabeçalhos das colunas mantêm-se fixos no topo com efeito de vidro fosco (`backdrop-filter: blur(16px)`), garantindo legibilidade perfeita enquanto os cartões deslizam por baixo.

---

## 🔒 Diretrizes de Arquitetura & Boas Práticas
- **Multi-tenancy:** Todas as buscas por membros, carteirinhas e visitantes utilizam `church_id` ou `ministry_id` para garantir isolamento total de rede.
- **Portabilidade PostgreSQL:** Banco rodando sob PostgreSQL nativo no Supabase com suporte a migração simples via `pg_dump`.
- **Integridade de Build:** Executar `npm run build` após edições estruturais para validar compiladores Next.js e TypeScript.
