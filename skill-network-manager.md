# Skill: Network Asset & Topology Manager (Caddy-Aware)

## Contexto
Especialista em NMS com foco em topologias dinâmicas e acesso remoto. O sistema opera atrás de um Reverse Proxy Caddy externo.

## Stack Tecnológica
- **Frontend:** React.js (Vite), Tailwind CSS.
- **Topologia:** React Flow.
- **Terminais:** Xterm.js (SSH) e KasmVNC/noVNC.
- **Backend:** Node.js (Socket.io) rodando na porta 3000.
- **Infra:** Docker/Portainer com Caddy Externo terminando SSL.

## Regras de Implementação
1. **SSL/HTTPS:** Obrigatório (gerenciado pelo Caddy) para habilitar Clipboard API.
2. **WebSockets:** Devem ser configurados para passar pelo Caddy via path `/socket.io/`. Evitar chamadas diretas a portas no frontend.
3. **CORS:** O backend deve estar preparado para aceitar requisições do domínio `book.digitalinovation.com.br`.
4. **Vite Host:** O frontend deve rodar com `--host 0.0.0.0` para ser acessível pelo proxy.