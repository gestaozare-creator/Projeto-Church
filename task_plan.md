# ChurchFlow - Planejamento de Projeto (SaaS)
Protocolo V.L.A.E.G.

## 🧭 Visão Arquitetural: SaaS Multi-Tenant
*   **Múltiplas Igrejas:** O sistema deve permitir o cadastro de várias igrejas dentro da mesma aplicação.
*   **Isolamento de Dados:** Cada usuário/membro pertencerá a uma igreja específica. Todos os módulos (Secretaria, Financeiro, Departamentos) devem filtrar e exibir dados apenas da igreja correspondente ao usuário logado.
*   **Gestão Global:** Possibilidade futura de um painel administrador geral ("Master") com visão total de todas as congregações cadastradas.

---

## 📦 Módulos do Sistema (MVP)

### 1. Módulo de Secretaria (Gestão e Captação)
*   **Interface de Membros:** Visual moderno e limpo, utilizando "cards" para listagem. Cada card mostrará a foto do membro, nome, função e a qual igreja ele pertence.
*   **Cadastro e Gestão de Membros:** 
    *   **Atributos:** Nome, Telefone, E-mail, Endereço, Função, Ministério e Departamento.
    *   **Feature:** Importação de planilha Excel/CSV para cadastro em massa.
    *   **Carteirinha de Membro:** Botão "Gerar Carteirinha" no perfil do membro. Ao clicar, abre um modal/pop-up com a prévia da carteirinha contendo: Foto, Nome, Função e o nome da Igreja com sua Região.
*   **Captação e Conversão de Visitantes:**
    *   Formulário de coleta: Nome, Telefone, Região (Bairro/Cidade), Como conheceu a igreja.
    *   **Fluxo de Visita:** Se desejar visita -> Coleta Endereço -> Envia para aba de Agendamentos.
    *   **Distribuição:** Link compartilhável e QR Code gerado pelo sistema para uso presencial nos cultos.
    *   **Status de Conversão:** Acompanhamento do status do visitante até a data em que ele virou membro.
*   **Gestão de Eventos (Secretaria):**
    *   **Cadastro de Eventos:** Criação de eventos (ex: Retiros, Conferências), podendo ser atrelados a departamentos específicos ou gerais da igreja.
    *   **Lista de Presença:** Geração de link para check-in ou confirmação de presença online.
    *   **Controle de Custos:** Lançamento e previsão dos tipos de custos envolvidos na realização do evento.
    *   **Dashboard de Eventos:** Painel mostrando a quantidade de eventos no ano, histórico, custos totais e engajamento/presença.
*   **Agenda da Igreja (Calendário):**
    *   **Agenda Local:** Cada congregação/filial terá seu calendário próprio, onde os usuários locais poderão agendar reuniões, cultos e disparar comunicados específicos para aquela igreja.
    *   **Agenda Geral (Master):** Calendário integrado para todas as igrejas da rede. Permite que a liderança matriz publique comunicados e eventos gerais que aparecerão simultaneamente na agenda de todas as filiais.
*   **Dashboards e Rankings (Secretaria):**
    *   **Ranking de Novos Membros** e **Top Conversões** (visitantes que viraram membros).
    *   Gestão Total: Indicadores mostrando quantos visitantes e membros por igreja, além da totalização geral em toda a plataforma SaaS.

### 2. Módulo Financeiro
*   **Controle de Acesso:** Visualização e operação restritas a usuários com permissão financeira.
*   **Lançamentos:** 
    *   Registro de Entradas e Saídas.
    *   **Atributos:** Tipo de lançamento, Forma de Pagamento, Identificação do contribuinte.
*   **Fase MVP:** Utilização de dados estáticos ("mockados") para validar a interface.
*   **Evolução Prevista:** Dashboards financeiros completos.

### 3. Módulo de Departamentos (Gestão Interna)
*   Espaço para organizar áreas específicas de cada igreja.
*   **Ministério de Louvor:**
    *   **Gestão da Equipe:** Integração com o cadastro base de membros. O líder de louvor poderá definir as funções específicas de cada membro já cadastrado e ativo no ministério (ex: Instrumento ou Voz).
    *   **Gestão de Escalas de Culto:** Sistema de agendamento de escalas cobrindo todos os dias da semana e diversos horários de culto.
    *   **Estrutura da Banda (Vagas da Escala):** Cada culto terá um time montado contendo as posições: 1 Baterista, 1 Baixista, 1 Guitarrista, 1 Violão, 1 Tecladista, 1 Percussão, 1 Cantor (Líder), 2 Backing Vocals e 2 Vagas Extras/Flexíveis (Instrumento ou Vocal).
    *   **Dashboard de Engajamento:** Gestão de participação da equipe, exibindo quantas vezes cada integrante (músico ou vocal) tocou no mês e no ano.
*   **Ministério de Mídia (Comunicação/Social):**
    *   **Gestão da Equipe:** Mesma lógica do Louvor (integração com cadastro base). O líder puxa os membros e define funções técnicas específicas.
    *   **Gestão de Escalas de Culto:** Agendamento de equipe técnica para cobrir os cultos.
    *   **Estrutura de Funções (Vagas):** Fotógrafo, Projeção, Iluminação, Transmissão, Operador de Som, etc.
    *   **Dashboard de Engajamento:** Acompanhamento de frequência para saber quantas vezes cada voluntário serviu no mês e no ano.
*   **Ministério de Obreiros (Recepção e Segurança):**
    *   **Gestão da Equipe:** Segue a mesma base do Louvor e Mídia. O líder atribui a função de Obreiro para os membros já cadastrados.
    *   **Gestão de Escalas de Culto (Posições Físicas):** A escala é distribuída mapeando os pontos de apoio da igreja: Estacionamento, Porta 1, Porta 2, Porta 3, Porta 4 e Segurança.
    *   **Dashboard de Engajamento:** Gestão de participação exibindo quantas vezes cada obreiro serviu (mês/ano) e **em quais posições específicas** ele mais atuou.
*   **Ministério Infantil (Kids):**
    *   **Controle de Acesso / Check-in:** Entrada e saída de crianças gerenciada por culto.
    *   **Segurança (QR Code):** No check-in, o pai/responsável recebe uma etiqueta, fita ou pulseira contendo um QR Code. A criança só pode ser retirada mediante a apresentação e escaneamento deste QR Code pelo líder da sala.
    *   **Divisão por Idades:** O sistema mapeará as salas e fará a alocação das crianças com base em suas respectivas idades.
    *   **Dashboard de Frequência:** Estatísticas mostrando a quantidade de crianças presentes por culto, além do somatório consolidado mensal e anual do departamento.

### 4. Módulo de Evangelismo (Controle Externo)
*   **Contagem de Almas:** Espaço dedicado para acompanhar o alcance evangelístico da igreja no ano.
*   **Lançamento Manual:** O usuário poderá realizar os lançamentos de números de almas ganhas.
*   **Dashboard de Metas (Projeção):**
    *   Gráficos e indicadores mostrando o total alcançado e o quanto falta para bater a meta do ano.
    *   Apresentação visual dupla: dados em números absolutos e em porcentagem (%).
---

## 📋 Fases de Execução (V.L.A.E.G.)

### Fase 1: Visão (V) [Concluída]
- [x] Levantar Requisitos de Módulos (Secretaria, Financeiro, Departamentos)
- [x] Definir Arquitetura SaaS Multi-Tenant
- [x] Definir JSON Data Schema em `gemini.md` (Membros, Visitantes, Igrejas)

### Fase 2: Link (L) [Concluída]
- [x] Configuração de repositório e infraestrutura inicial (Next.js)
- [x] Configuração de Variáveis de Ambiente (.env) e Banco de Dados (Configurado com MOCKS para fase visual)

### Fase 3: Arquitetura (A) [ ]
- [ ] Criar POPs em `directives/`
- [ ] Desenvolver scripts em `execution/`

### Fase 4: Estilo (E) [Em Andamento]
- [x] **Tematização (Dark/Light Mode):** Botão interno para o usuário alternar livremente entre tema Claro (White) e Escuro (Black).
- [ ] **Identidade Visual por Módulo:** Definição de cores específicas para destacar e diferenciar cada segmento do sistema.
- [ ] **Design com Imagens Temáticas:** Uso de imagens representativas para cada módulo (ex: banda no louvor, crianças no infantil, equipamentos na mídia). Estas imagens devem ter fundo transparente para compor melhor as telas de cadastro e painéis.
- [x] Implementar UI/UX moderna com Glassmorphism (Cards de membros, Dashboard financeiro com mocks).
- [ ] Validação visual do MVP.

### Fase 5: Gatilho (G) [ ]
- [ ] Deploy na Nuvem (Vercel)
- [ ] Automações e Gatilhos de Banco de Dados
