# PRD (Product Requirements Document) - Atualizações Recentes

## Módulo: Configurador Dinâmico de Formulário Público (SaaS/Multitenant)
**Status:** Concluído ✅

### Descrição
Implementação de um painel de configuração que permite que a liderança de cada "Rede" (Ministério) ou "Igreja Sede" personalize quais dados são obrigatórios no formulário de adesão/cadastro público de membros, sem necessidade de alterações no código-fonte.

### Especificações Técnicas
- **Armazenamento:** A configuração de obrigatoriedade é armazenada na propriedade `formConfig` dentro da coluna JSON `config` na tabela `churches`.
- **Herança:** Igrejas filiais sempre herdam a configuração `formConfig` da sua respectiva Igreja Sede (onde `is_headquarters = true`).
- **Campos Controláveis (Toggle On/Off Obrigatório):**
  - Foto de Perfil (`photoRequired`)
  - Telefone / WhatsApp (`phoneRequired`)
  - E-mail (`emailRequired`)
  - Endereço Completo (`addressRequired`)
  - Data de Nascimento (`birthDateRequired`)
  - Estado Civil (`maritalStatusRequired`)
  - Já é Batizado / Data do Batismo (`isBaptizedRequired`)
  - Situação Profissional (`employmentStatusRequired`)
  - Profissão (`professionRequired`)

### Pontos de Alteração no Código
- **`components/admin/ChurchFormModal.tsx`**: Inserida nova sessão ("📝 Formulário Público") na edição do Tenant para salvar os toggles no objeto `config`.
- **`app/formulario-membro/page.tsx`**: Refatorado para carregar `activeChurch.config.formConfig` dinamicamente. Os atributos HTML5 `required` e os labels `*` agora escutam essa configuração ao invés de estarem hard-coded.

---

## Módulo: DatePicker Híbrido (Correção de Fuso Horário)
**Status:** Concluído ✅

### Descrição
Resolução de conflitos em inputs do tipo Date onde, devido ao fuso horário brasileiro (GMT-3), as datas selecionadas (ex: `11/05/2006`) eram convertidas implicitamente para UTC (`10/05/2006 21:00`), resultando no salvamento e exibição do dia anterior.

### Especificações Técnicas
- **Componente:** `MaskedDateInput` criado nativamente utilizando `<input type="tel">` com máscara de formatação textual + `<input type="date">` invisível, focado em mobile Android.
- **Processamento:** Exibição das datas no dashboard modificada para evitar `new Date(ISO_STRING).toLocaleDateString()`, passando a realizar um `String.prototype.split('-')` estático para contornar qualquer interferência de fuso horário local.

---

> Histórico gerado e armazenado nas dependências locais do projeto. (VSCode, Git, PRD).
