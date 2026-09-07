# Como Hospedar "O Infiltrado" Grátis (Railway / Render / Fly.io)

Este jogo foi desenvolvido em **Node.js + Express + WebSockets + Vite/React**. Ele já vem totalmente preparado para produção (`npm run build` compila tanto o frontend quanto o servidor em `dist/server.cjs`).

---

## Opção 1: Render.com (100% Gratuito) - Recomendado

1. **Exportar o Código:**
   - No Google AI Studio, clique no menu superior e selecione **Export to GitHub** (ou baixe como ZIP e suba em um repositório seu no GitHub).

2. **Criar o Serviço no Render:**
   - Acesse [https://render.com](https://render.com) e faça login gratuito com sua conta GitHub.
   - Clique em **New +** e selecione **Web Service**.
   - Escolha o repositório do jogo.

3. **Configurar os Comandos:**
   - **Name:** `o-infiltrado` (ou o que preferir)
   - **Language:** `Node`
   - **Branch:** `main`
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** `Free`

4. **Deploy:**
   - Clique em **Create Web Service**.
   - Em 1 a 2 minutos, o Render fornecerá sua URL pública (exemplo: `https://o-infiltrado.onrender.com`).
   - Abra essa URL na sua TV ou notebook. O QR Code gerado funcionará instantaneamente em qualquer iPhone e Android conectado à internet, sem pedir login ou senha!

---

## Opção 2: Railway.app (Rápido e Automático)

1. Acesse [https://railway.app](https://railway.app) e conecte com o GitHub.
2. Clique em **+ New Project** -> **Deploy from GitHub repo**.
3. Selecione o repositório do jogo.
4. O Railway detectará o Node.js e executará `npm run build` e `npm start` automaticamente.
5. Nas configurações do serviço (**Settings**), vá na seção **Networking** e clique em **Generate Domain**.
6. Pronto! Sua URL pública no Railway estará online 24 horas por dia.

---

## Opção 3: Usar no Próprio Google AI Studio (Sem instalar nada)

Se você quiser jogar agora mesmo diretamente pelo AI Studio:
- **Por que deu "Page Not Found" no iPhone?**
  A URL pública com prefixo `ais-pre-*` só fica ativa após você clicar no botão **"Share" (Compartilhar)** ou **"Deploy"** no canto superior direito do Google AI Studio.
- Assim que você clica em **Compartilhar**, o Google provisiona o link público para todos os convidados poderem jogar via Safari/Chrome sem solicitar login.
