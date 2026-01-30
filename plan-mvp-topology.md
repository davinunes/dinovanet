# Plano de Ação: MVP Topology & Remote Access

## Fase 1: Setup & Conectividade (Caddy Bridge)
- [ ] Subir Stack no Portainer (Node + React).
- [ ] Configurar `vite.config.js` para aceitar conexões externas e definir o proxy de dev.
- [ ] Validar acesso via `https://book.digitalinovation.com.br` (Frontend e API).

## Fase 2: Topologia e Ativos
- [ ] Implementar Base da Topologia com React Flow.
- [ ] Criar Mock de Ativos (Switch e Server) com menu de contexto.
- [ ] Criar Modal de Terminal que flutua sobre a topologia.

## Fase 3: Túnel SSH/RDP via WebSocket
- [ ] Implementar Backend Node com `node-pty`.
- [ ] Configurar Socket.io Client no React apontando para o path do Caddy.
- [ ] Testar Sincronização de Clipboard via HTTPS.