# Arquitetura e Memória de Longo Prazo do ChurchFlow

Este documento serve como memória de longo prazo (PRD/Arquitetura) para agentes de inteligência artificial (e desenvolvedores humanos) que atuam neste projeto.

## 1. Visão Geral
**Nome do Projeto:** ChurchFlow (Projeto Church)
**Stack Tecnológico:**
- **Frontend:** Next.js (App Router), React, TypeScript.
- **Backend/DB:** Supabase (PostgreSQL, Auth).
- **Estilização:** CSS puro (variáveis CSS e estilos inline) / Arquitetura sem Tailwind.

O objetivo do sistema é fornecer uma solução SaaS Multi-igreja para gestão de membros, visitantes, congregações, departamentos (como Kids, Mídia, Louvor), financeiro e controle patrimonial (com QRCode).

## 2. Paradigmas de Código

### 2.1 Tipagem (TypeScript Strict)
- Todo o projeto deve passar 100% no teste de compilação rigorosa (`npx tsc --noEmit`). 
- **O uso de `any` e `any[]` é estritamente proibido** nos estados (`useState`).
- Os tipos refletindo o banco de dados oficial ficam em `@/types/database.ts`.

### 2.2 View Models Locais (camelCase) vs Banco de Dados (snake_case)
Como o banco de dados Supabase utiliza colunas padrão SQL em `snake_case` (ex: `church_id`, `purchase_date`) e os componentes React foram inicialmente construídos esperando `camelCase` (ex: `churchId`, `purchaseDate`), adotamos o padrão **Adapter/View Model**:
1. Toda requisição (SELECT) ao Supabase traz objetos no formato original (`snake_case`).
2. O agente responsável deve mapear imediatamente os resultados em interfaces locais na página, adaptando para `camelCase` e preenchendo opcionais / fallbacks (como `|| ''`). 
3. *Exemplo:*
   ```typescript
   // Interface local (View Model) no topo da página
   interface LocalAsset { id: string; churchId: string; purchaseValue: number; }
   
   // Mapeamento após fetch
   const formatados: LocalAsset[] = data.map(item => ({
     id: item.id,
     churchId: item.church_id || '1',
     purchaseValue: Number(item.purchase_value || 0)
   }));
   setAssets(formatados);
   ```

### 2.3 Dados Estáticos (Mock) vs Banco Real (Production)
- Anteriormente existia um arquivo `lib/mock-data.ts`. A orientação oficial é de **NÃO** importar dados desse arquivo para preenchimento de telas. 
- Todas as operações devem utilizar a instância cliente de `@/lib/supabaseClient` e tratar o estado de Loading.
- A tabela `event_guests` não existe no banco, visitantes de eventos são tratados como array referencial, ou futuramente como uma tabela real sob demanda. 
- A tabela `kids_rooms` possui os registros padrão (Berçário, Maternal, Juniores, Teens) que NÃO SÃO MOCK e não devem ser deletados, pois servem para a lógica de salas (dashboard de Kids).

## 3. Principais Módulos do Sistema

1. **Gestão de Pessoas (Membros e Visitantes)**: As categorias "membro", "visitante", e "em_conversao" são controladas centralmente pelo banco. 
2. **Ministério Kids**: Possui Check-in, Check-out rápido e separação por salas com idade. Os relacionamentos da criança identificam nome/telefone do pai, com dependência de cadastro de Membro para responsáveis ativos, ou criação pontual.
3. **Financeiro (Pagar/Receber) e Patrimônio**: Possuem integração. Ao salvar uma despesa é possível gerar diretamente um registro em `assets` para etiquetagem QR Code.
4. **Mapeamento/Geo-referenciamento**: Funciona por agrupamento visual do estado (UF) baseado nos endereços do cadastro. Exige que os campos de localidade sejam tratados prevendo `undefined`.

## 4. Orientações Gerais para Modificações Futuras
- **Sempre verifique antes de apagar**: Nunca altere a estrutura de banco de dados diretamente pelo frontend antes de conferir o schema real.
- **Componentes Gigantes (God Components)**: Algumas páginas como `app/financeiro/page.tsx` ou `app/departamentos/kids/page.tsx` ainda possuem milhares de linhas. Refatorações parciais (divisão de modais e componentes visuais) são encorajadas, mas devem ser feitas com **máximo rigor nos Tipos e Props**.
- **Nunca interrompa o fluxo sem Fallbacks**: Variáveis de banco de dados (especialmente vindas de left joins ou opcionais como datas e telefones) podem vir `null`. Sempre use fallback string `|| ''` para evitar quebra de UI (`Type 'undefined' cannot be used as an index type`).

## Histórico Recente de Limpeza (Junho/2026)
- Foi feita uma mega-refatoração onde removemos todos os resíduos do `lib/mock-data.ts` que sujavam os painéis de finanças, relatórios e controle.
- Foi implementado 100% de type-safety. O comando `npx tsc --noEmit` tem passagem perfeita. O banco Supabase foi inspecionado, as transações e históricos foram zerados e a aplicação roda unicamente baseada nos fluxos reais e vivos da igreja. 
