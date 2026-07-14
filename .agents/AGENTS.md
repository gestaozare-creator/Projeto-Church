# Diretrizes e Regras do Projeto (ChurchFlow)

### 1. Separação Estrita de Membros e Visitantes
* **Regra**: Visitantes (identificados com a função `Visitante` ou `Visitante (Kids)`) não devem ser exibidos na listagem principal de membros ativos, inativos ou na coluna "Aguardando" da página inicial (`app/page.tsx`). Eles pertencem e devem constar exclusivamente no painel de **Gestão de Visitantes** (`app/visitantes/page.tsx`).

### 2. Fluxo de Cadastro Rápido de Crianças e Pais (Kids)
* **Regra**: Ao realizar o check-in rápido de visitantes no Kids, o sistema deve:
  1. Verificar se o responsável já existe no banco através da busca por nome e telefone.
  2. Reutilizar o ID do pai/mãe existente se encontrado, ou criar um novo registro apenas em caso negativo.
  3. Garantir o uso da referência única de ID (`parentId`) para evitar falhas de execução JavaScript (como `ReferenceError` por uso de variáveis condicionais) ao salvar o registro da criança.

### 3. Integração Contas a Pagar ➡️ Patrimônio
* **Regra**: Ao lançar uma nova despesa financeira com a opção *"Gerar Ativo de Patrimônio?"* ativa, o sistema deve:
  1. Salvar a despesa na tabela `transactions`.
  2. Gravar automaticamente o ativo correspondente na tabela `assets` preenchendo as chaves estrangeiras apropriadas (como `expense_id`).
  3. Exibir imediatamente um pop-up de sucesso contendo o **QR Code** único e a funcionalidade para **Imprimir Etiqueta** física.

### 4. Persistência de Escalas de Voluntários
* **Regra**: Toda alteração de escala (adicionar ou remover voluntários de Louvor, Mídia ou Obreiros) deve persistir e ler os dados diretamente da tabela `escalas` do Supabase associando `member_id`, `role`, `department` e `date`, evitando armazenar estados cruciais apenas localmente em memória.

### 5. Tipagem Rigorosa e Banco de Dados (Supabase)
* **Regra**: NUNCA utilize ny ou ny[] nos estados de componentes. O projeto agora conta com uma tipagem estrita centralizada em @/types/database.ts (que reflete o schema real snake_case do Supabase).
* **Regra**: Nas p�ginas do Frontend (componentes React), utilize View Models locais (interfaces camelCase na pr�pria p�gina) ou fa�a o mapeamento expl�cito dos campos de snake_case (banco) para camelCase (frontend) durante o carregamento de dados (ex: churchId: data.church_id). Isso evita quebra de c�digo legado e garante consist�ncia sem conflitos de padr�es.
* **Regra**: O arquivo lib/mock-data.ts foi substitu�do para produ��o. Todo carregamento de dados e tipagem n�o deve mais depender de dados est�ticos; devem-se consultar diretamente as tabelas do Supabase.


### 6. Escalas Públicas e Acesso Externo
* **Regra**: Rotas públicas criadas para acesso sem login (como `/agenda/[churchId]`) devem ser excetuadas tanto no nível mais alto do layout (`app/layout.tsx` em `isPublicRoute`) quanto dentro do provedor de autenticação (`AuthContext.tsx` no `useEffect` de redirecionamento e no `onAuthStateChange`). Caso contrário, o frontend forçará um redirecionamento fantasma para a página `/login` impedindo o acesso do usuário externo.
* **Regra**: Emojis inseridos dinamicamente por código e enviados via WhatsApp (`wa.me/?text=...`) devem ser encodados usando escapes Unicode explícitos (ex: `\uD83C\uDFB5`) em constantes ou arquivos React para evitar falhas silenciosas de Encoding no momento de parse dos componentes pelo Next.js/Browser (que substituem os emojis por ícones quebrados como o símbolo de interrogação `?`).

### 7. Responsividade em Dispositivos Móveis Antigos (Safari/iOS)
* **Regra**: Quando precisar construir layouts em grade complexos em inline-styles React que devem renderizar perfeitamente no Mobile (como um calendário de 7 dias ou tabela horizontal), **EVITE** o uso de `display: "grid"` com a sintaxe `gridTemplateColumns: "repeat(7, 1fr)"`. Em vez disso, prefira **sempre** utilizar Flexbox: `display: "flex", flexWrap: "wrap"` onde cada item possui uma largura exata (`width: "14.28%"` para 7 colunas). Isso garante retrocompatibilidade absoluta em dispositivos móveis, sem risco das colunas serem achatadas num único bloco vertical.

### 8. Separação Estrita de Membros vs Visitantes (Status)
* **Regra**: O sistema usa um modelo unificado na tabela `members`. A diferenciação entre Membro e Visitante/Pessoa no Funil DEVE SEMPRE ser feita pela coluna `status` e não pela coluna `function`.
  * **Membros** são todos aqueles com `status` igual a: `"ativo"`, `"inativo"` ou `"aguardando_aprovacao"`.
  * **Visitantes / Pessoas em Conversão** são todos aqueles com `status` igual a: `"visitante"`, `"em_conversao"` ou `"pendente"`. 
  * Qualquer painel, dashboard ou gráfico que precise totalizar "Membros" deve filtrar estritamente usando essas 3 strings de status válidas para evitar a inclusão de contatos em triagem ou consolidação nas estatísticas da membresia da Igreja.
