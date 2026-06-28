# Gemini.md - Constituição do Projeto
Protocolo V.L.A.E.G.

## 📋 JSON Data Schema
```json
{
  "churches": {
    "id": "uuid (Primary Key)",
    "name": "string",
    "is_headquarters": "boolean",
    "created_at": "timestamp"
  },
  "users": {
    "id": "uuid (Primary Key - Gerenciado de forma segura pelo provedor de Auth, ex: Supabase)",
    "church_id": "uuid (Foreign Key -> churches.id)",
    "email": "string",
    "role": "string (admin, tesouraria, lider_louvor, obreiro)",
    "created_at": "timestamp"
    // NOTA DE SEGURANÇA: Senhas NUNCA são salvas aqui. Elas ficam num cofre blindado do servidor (Supabase Auth).
  },
  "members": {
    "id": "uuid (Primary Key)",
    "church_id": "uuid (Foreign Key -> churches.id)",
    "name": "string",
    "phone": "string",
    "email": "string",
    "address": "string",
    "photo_url": "string",
    "function": "string (ex: Baterista, Fotógrafo, Porta 1)",
    "department": "string"
  },
  "visitors": {
    "id": "uuid (Primary Key)",
    "church_id": "uuid (Foreign Key -> churches.id)",
    "name": "string",
    "phone": "string",
    "region": "string",
    "how_knew_church": "string",
    "wants_visit": "boolean",
    "address": "string (salvo apenas se wants_visit for true)",
    "conversion_status": "string (ex: visitante, em_conversao, membro)"
  },
  "events_and_scales": {
    "id": "uuid (Primary Key)",
    "church_id": "uuid (Foreign Key -> churches.id)",
    "type": "string (ex: culto_domingo, retiro, reuniao)",
    "date": "timestamp",
    "is_global": "boolean (se true, aparece em todas as filiais)"
  },
  "kids_checkin": {
    "id": "uuid (Primary Key)",
    "church_id": "uuid (Foreign Key -> churches.id)",
    "child_name": "string",
    "parent_name": "string",
    "age": "integer",
    "qr_code_hash": "string (Criptografado para que ninguém falsifique a etiqueta)",
    "status": "string (check-in, check-out)"
  }
}
```

## 🛡️ Regras Comportamentais
- Priorizar confiabilidade sobre velocidade.
- Nunca adivinhar a lógica de negócios.
- Seguir estritamente a arquitetura de 3 camadas.

## 🏗️ Invariantes Arquiteturais
- Camada 1 (Architecture): POPs em Markdown.
- Camada 2 (Navigation): Decisão do Agente.
- Camada 3 (Tools): Scripts Python determinísticos.

## 📝 Log de Manutenção
- 2026-05-13: Projeto inicializado.
- 2026-06-27: Mocks erradicados e validação rigorosa de tipagem TypeScript estabelecida como requisito obrigatório para builds na Vercel.

## 🚫 Regra de Ouro (Erros de Compilação / Vercel)
Se a Vercel travar no build e mostrar uma versão antiga do site, o problema **NÃO** é cache de banco de dados nem falha do Supabase. O problema é que modificações recentes introduziram **erros de tipagem do TypeScript** (ex: `Implicit Any`, `Cannot find name`). O agente DEVE rodar `npx tsc --noEmit` localmente para garantir que não haja erros de tipo ANTES de empurrar grandes refatorações para o repositório principal. Mocks NUNCA devem ser reintegrados sem tipagem.
