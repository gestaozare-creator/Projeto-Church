# Progress Log

Protocolo V.L.A.E.G.

## Atividades Realizadas

### 2026-05-13

- [x] Inicialização do Protocolo 0
- [x] Criação da estrutura de pastas (`architecture/`, `tools/`, `.tmp/`)
- [x] Criação dos arquivos de memória (`task_plan.md`, `findings.md`, `progress.md`, `gemini.md`)

### 2026-05-27

- [x] Reestruturação do painel de detalhes do Membro (Correção de altura Flexbox limitando Overflow).
- [x] Expansão e Reestruturação da Tela de Louvor (Layout em 3 Colunas com Calendário Lateral e Oficina no centro).
- [x] Novo "Palco Virtual" do Louvor: Disposição realista 3D (Bateria fundo, Instrumentos meio, Vocais frente) com hierarquia de tamanho e transparência.
- [x] Sistema inteligente de compartilhamento (WhatsApp) com Popup de Preview e botões de Envio Direto.
- [x] Criação das estruturas base para Mídia, Obreiros e Infantil.

### 2026-06-24

- [x] Correção do fluxo de check-in rápido de crianças visitantes (Kids) para evitar duplicações e erros de referência de ID.
- [x] Ocultação de pessoas com função de `Visitante` ou `Visitante (Kids)` da lista de membros do dashboard principal, isolando-as no painel de visitantes.
- [x] Integração entre Contas a Pagar e Patrimônio: criação do ativo na tabela `assets` do Supabase ao lançar despesa, e exibição imediata do pop-up para visualização e impressão da etiqueta/QR Code.
- [x] Persistência completa no banco de dados do Supabase (`escalas`) para as escalas dos departamentos de Louvor, Mídia e Obreiros.

### 2026-06-26

- [x] Padronização global dos filtros de data (`startDate`, `endDate`), `cultoFilter` e `horarioFilter` para as páginas: Membros, Visitantes, Financeiro Dashboard, Contas a Receber, Contas a Pagar e Dashboard da Secretaria.
- [x] Integração do filtro de horário dinâmico (baseado no cadastro `MOCK_CHURCHES`) que opera independentemente do filtro de culto estar ou não selecionado.
- [x] Adição do recurso de gráficos dinâmicos no Dashboard Financeiro para alternância de visualização entre Detalhamento de Entradas, Formas de Pagamento e Detalhamento de Saídas.
- [x] Correções de interface gráfica (resolução de sobreposição/encavalamento dos campos "De" e "Até" nas páginas de Receber e Pagar) e resolução de erros de renderização (`Unexpected Token`) no Dashboard da Secretaria e Membros.

### 2026-06-27

- [x] **Transição para Produção (Fim dos Mocks):** Erradicação completa de todos os dados falsos (`MOCK_VISITORS`, `MOCK_CHURCHES`, `MOCK_MEMBERS`, dados hardcoded no `app/mapeamento/page.tsx` e `app/ranking/page.tsx`). O sistema inteiro foi conectado e configurado para ler exclusivamente dados reais provindos do Supabase.
- [x] **Correção Crítica de Deploy (Vercel):** Identificação e resolução de erros do TypeScript que estavam abortando os builds na Vercel silenciosamente. O TypeScript foi perfeitamente tipado com `Church` interface e correções de tipos nulos e "implicit any", permitindo compilações livres de erros e refletindo as mudanças finalmente na interface de produção do usuário final.

### 2026-07-03

- [x] Correção de bugs de acesso a dados (Supabase RLS): Utilização de API segura (pp/api/get-kids-data/route.ts) com a Role Key do backend para buscar escalas de Kids bloqueadas pelo Row Level Security, resolvendo a perda de dados no frontend ao recarregar a página.
- [x] Padronização completa e criação de Rotas Públicas (/agenda/[churchId]/[dept]) para escalas: Louvor, Mídia, Obreiros e Kids (Professores).
- [x] Limpeza e padronização UX nos botões das escalas, substituindo modais confusos por dois botões inteligentes: Salvar Escala e Compartilhar, que já preparam o envio dinâmico via WhatsApp.
- [x] Resolução de barreira de Autenticação (AuthContext.tsx e layout.tsx) onde rotas públicas estavam sendo indevidamente redirecionadas para o Login.
- [x] Compatibilidade Mobile Extrema: Conversão do calendário (CSS Grid) para Flexbox (display: flex; flex-wrap: wrap) com porcentagens matemáticas, erradicando quebras visuais verticais que ocorriam em navegadores de iPhone/Safari antigos.

### 2026-07-15

- [x] **Financeiro (CRUD e Persistência):** Implementação da edição e exclusão de transações (Receitas e Despesas) refletindo em tempo real no Supabase.
- [x] **Financeiro (Categorias e Fornecedores):** Correção crítica na gravação de "Nova Categoria" (agora persistindo corretamente no array `config.receitas` / `config.despesas` da tabela `churches`) e "Novo Fornecedor" (geração obrigatória de `crypto.randomUUID()` na tabela `suppliers` contornando a falta de auto-increment).
- [x] **Financeiro (Anexos):** Restauração do campo de envio de comprovantes (upload de arquivos) no modal de Nova Despesa que havia sumido após atualizações anteriores.
- [x] **Dashboard de Inteligência Financeira:** Desativação do cache do Next.js (`force-dynamic`) para garantir exibição imediata de alterações feitas na tela financeira. Otimização visual com a remoção da linha "Ticket Médio" do gráfico e exibição padrão de Entradas, Saídas e Saldo.
- [x] **Secretaria (Membros):** Validade da carteirinha pré-preenchida automaticamente para 1 ano à frente da data de integração, mantendo edição livre para o usuário.
- [x] **Secretaria (Aniversariantes):** Implementação de botão de disparo de WhatsApp em cada card de aniversariante (do dia e do mês). Inclusão de um modal de pré-visualização/edição da mensagem, que já vem inteligentemente pré-preenchida com saudação dinâmica (Bom dia/Boa tarde/Boa noite), primeiro nome do membro e o nome institucional dinâmico "IPCN [Nome da Igreja]".
- [x] **Financeiro (Receitas e Despesas):** Correção crítica na persistência de IDs de Membros e Fornecedores durante a edição de transações. Garantia de que a mudança de "Anônimo" para um ID válido (or vice-versa) seja salva perfeitamente, forçando valores nulos (`null`) em vez de indefinidos (`undefined`) para garantir a atualização real no Supabase.
- [x] **Comercial & Vendas (Projeto Church):** Criação da Landing Page comercial modular (`/vendas`) apresentando os planos Secretaria, Financeiro, Kids e Combo Completo sob a marca Projeto Church. Adição da aba "💰 Gestão Comercial & Preços" no painel Admin Master (`/rede`) para edição em tempo real de valores dos planos, banner de oferta e WhatsApp de vendas.