# SIMUL — Sistema Integrado de Monitoramento Urbano de Limpeza

Nova interface web do SIMUL, criada a partir dos requisitos acadêmicos do projeto e com uma identidade visual diferente da versão anterior.

## Objetivo

Facilitar a consulta pública da coleta seletiva e, para usuários cadastrados, permitir a configuração de lembretes por e-mail. Para administradores, o painel organiza rotas, áreas atendidas e cronogramas.

## O que esta versão prioriza

- Consulta pública sem login.
- Cidade + bairro como fluxo principal.
- Resultado com rota, dias e horários.
- Área preparada para mapa/OpenStreetMap.
- Cadastro e login.
- Preferências de lembrete.
- Painel administrativo com abas de rotas, áreas e cronogramas.
- Layout responsivo para computador e celular.
- Textos curtos e linguagem mais próxima do usuário.
- Fallback de demonstração quando a API ainda não estiver configurada, facilitando a apresentação do projeto.

## Requisitos considerados

A interface segue o escopo documentado do SIMUL: consulta de coleta, autenticação, configuração de lembretes, localização auxiliar, guia de descarte e manutenção administrativa de rotas, áreas e cronogramas. Rastreamento em tempo real do caminhão, GPS de veículos, alertas por aproximação, aplicativo nativo e Web Push não são tratados como requisitos obrigatórios desta entrega.

## Tecnologias

- React
- Vite
- React Router
- CSS responsivo sem framework visual obrigatório
- API REST configurável por variável de ambiente

## Rodando localmente

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env` e configure:

```env
VITE_API_URL=http://localhost:8080
```

Para uma apresentação sem backend, a interface usa dados demonstrativos em algumas consultas públicas.

## Integração com a API existente

A interface foi preparada para os endpoints principais já utilizados pelo SIMUL, incluindo:

- `GET /api/rotas/areas`
- `GET /api/rotas/consulta?cidade=...&bairro=...`
- `POST /api/auth/login`
- `POST /api/usuarios`
- `GET /api/usuarios/me`
- `PUT /api/notificacoes/preferencias`
- `GET /api/admin/rotas`
- `GET /api/admin/cronogramas`

## Escopo acadêmico

O design foi pensado para ser simples de explicar em apresentação: cada tela tem uma finalidade clara, os fluxos principais aparecem no menu e a consulta pública continua sendo o centro do sistema.
