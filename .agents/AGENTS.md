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
