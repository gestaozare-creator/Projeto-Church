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
