# Findings & Descobertas
Protocolo V.L.A.E.G.

## Pesquisas
- (Aguardando definições da Fase 1)

## Restrições e Limitações
- **Vercel Builds vs Next.js TypeScript Check**: O motor do Next.js compila usando `tsc`. Qualquer erro de tipo (como `Implicit Any` provocado pela exclusão de uma interface mock) faz com que a build na Vercel falhe *silenciosamente* na ponta do usuário. A consequência é que a Vercel não atualiza a página para o usuário e mantém a versão antiga no ar. Para projetos com integração CI/CD como este, a integridade da tipagem é absoluta. Nunca empurrar código de refatoração massiva sem testar `npx tsc --noEmit` localmente.
