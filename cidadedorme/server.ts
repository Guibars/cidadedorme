import express from 'express';
import http from 'node:http';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { networkInterfaces } from 'node:os';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { gameManager, Room } from './server/gameManager';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 });
  app.use(express.json({ limit: '16kb' }));
  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));
  app.get('/api/join-origin', (req, res) => {
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(req.hostname);
    const address = Object.values(networkInterfaces()).flat().find(a => a?.family === 'IPv4' && !a.internal)?.address;
    res.json({ origin: local && address ? `http://${address}:${process.env.PORT || 3000}` : null });
  });
  app.post('/api/rooms', (_req, res) => {
    const room = gameManager.createRoom();
    res.json({ roomCode: room.code, hostToken: room.hostToken, state: room.getPublicState() });
  });
  app.get('/api/rooms/:code', (req, res) => {
    const room = gameManager.getRoom(req.params.code);
    if (!room) return res.status(404).json({ error: 'Sala não encontrada.' });
    res.json({ code: room.code, playerCount: room.getPlayerCount(), phase: room.phase, canJoin: room.phase === 'LOBBY' && room.getPlayerCount() < 5 });
  });
  const tokenOf = (req: express.Request) => req.headers.authorization?.replace(/^Bearer /, '') || '';
  app.get('/api/rooms/:code/state', (req, res) => {
    const room = gameManager.getRoom(req.params.code);
    if (!room) return res.status(404).json({ error: 'Esta sala foi encerrada. Crie ou entre em outra.' });
    const id = String(req.query.playerId || '');
    const authorized = room.playerTokens.get(id) === tokenOf(req);
    res.json({ state: room.getPublicState(authorized ? id : undefined) });
  });
  app.post('/api/rooms/:code/join', (req, res) => {
    const room = gameManager.getRoom(req.params.code);
    if (!room) return res.status(404).json({ error: 'Sala não encontrada.' });
    if (room.phase !== 'LOBBY') return res.status(400).json({ error: 'A partida já começou.' });
    if (room.getPlayerCount() >= 5) return res.status(400).json({ error: 'A sala está cheia (5 jogadores).' });
    const name = typeof req.body.name === 'string' ? req.body.name.trim().slice(0, 15) : '';
    if (!name) return res.status(400).json({ error: 'Informe seu apelido.' });
    const playerId = randomUUID();
    const playerToken = randomUUID();
    room.addPlayer(playerId, name, req.body.avatarId);
    room.playerTokens.set(playerId, playerToken);
    res.json({ playerId, playerToken, roomCode: room.code, state: room.getPublicState(playerId), privateData: room.getPrivateData(playerId) });
  });
  app.get('/api/rooms/:code/private', (req, res) => {
    const room = gameManager.getRoom(req.params.code);
    const id = String(req.query.playerId || '');
    if (!room || !room.playerTokens.has(id) || room.playerTokens.get(id) !== tokenOf(req)) return res.status(403).json({ error: 'Sessão inválida.' });
    res.json({ data: room.getPrivateData(id) });
  });

  function act(room: Room, action: string, playerId: string, host: boolean, p: any) {
    if (['START_GAME','ADVANCE_PHASE','RESTART_GAME','ADD_BOT','REMOVE_PLAYER'].includes(action) && !host) throw new Error('Apenas o anfitrião pode controlar a partida.');
    switch (action) {
      case 'START_GAME': if (!room.startGame()) throw new Error('Reúna de 3 a 5 jogadores para começar.'); break;
      case 'ADVANCE_PHASE': room.advancePhase(); break;
      case 'RESTART_GAME': room.restartGame(); break;
      case 'ADD_BOT': room.addBotPlayer(); break;
      case 'REMOVE_PLAYER': room.removePlayer(p.targetPlayerId); break;
      case 'ROLE_REVEALED': {
        const player = room.players.get(playerId);
        if (player && room.phase === 'ROLE_REVEAL' && !player.hasRevealedRole) {
          player.hasRevealedRole = true; room.broadcastState(); room.sendPrivateUpdate(playerId); room.checkAllRolesRevealed();
        }
        break;
      }
      case 'SELECT_ROOM': room.setPlayerRoom(playerId, p.roomId); break;
      case 'MOVE_PLAYER': room.movePlayer(playerId, p.x, p.y); break;
      case 'NIGHT_KILL': if (!room.setNightKill(playerId, p.targetPlayerId)) throw new Error('Aproxime-se de uma vítima viva para atacar.'); break;
      case 'NIGHT_INVESTIGATE': case 'USE_DETECTIVE': room.useDetectiveAbility(playerId, p.targetPlayerId); break;
      case 'SUBMIT_ANSWER': room.submitAnswer(playerId, p.answer); break;
      case 'SUBMIT_VOTE': room.submitVote(playerId, p.targetPlayerId); break;
      case 'CONFIRM_VOTE': room.confirmVote(playerId); break;
      case 'USE_SABOTAGE': room.useKillerSabotage(playerId, p.sabotageId); break;
      default: throw new Error('Ação desconhecida.');
    }
  }
  app.post('/api/rooms/:code/action', (req, res) => {
    const room = gameManager.getRoom(req.params.code);
    if (!room) return res.status(404).json({ error: 'Sala encerrada.' });
    const { action, playerId = '', ...payload } = req.body;
    const token = tokenOf(req);
    const host = token === room.hostToken;
    if (!host && (!room.playerTokens.has(playerId) || room.playerTokens.get(playerId) !== token)) return res.status(403).json({ error: 'Sessão inválida.' });
    try {
      act(room, action, playerId, host, payload);
      res.json({ state: room.getPublicState(host ? undefined : playerId), privateData: host ? null : room.getPrivateData(playerId) });
    } catch (e) { res.status(400).json({ error: (e as Error).message }); }
  });
  server.on('upgrade', (request, socket, head) => {
    if (request.url?.split('?')[0] === '/ws') wss.handleUpgrade(request, socket, head, ws => wss.emit('connection', ws));
  });
  wss.on('connection', (ws: WebSocket) => {
    let room: Room | undefined;
    let playerId = '';
    let host = false;
    const detach = () => {
      if (room && host && room.hostSocket === ws) room.hostSocket = null;
      if (room && playerId && room.playerSockets.get(playerId) === ws) {
        room.playerSockets.delete(playerId);
        const player = room.players.get(playerId);
        if (player) player.connected = false;
        room.broadcastState();
      }
    };
    ws.on('message', data => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ATTACH_SESSION') {
          detach(); room = undefined; host = false; playerId = '';
          const next = gameManager.getRoom(String(msg.roomCode || ''));
          if (!next) { ws.send(JSON.stringify({ type: 'SESSION_EXPIRED', message: 'Esta sala foi encerrada. Entre novamente.' })); return; }
          host = !!msg.token && msg.token === next.hostToken;
          if (!host && (!next.playerTokens.has(msg.playerId) || next.playerTokens.get(msg.playerId) !== msg.token)) { ws.send(JSON.stringify({ type: 'SESSION_EXPIRED', message: 'Sessão encerrada. Entre novamente.' })); return; }
          room = next;
          if (host) room.hostSocket = ws;
          else {
            playerId = msg.playerId; room.playerSockets.set(playerId, ws);
            const p = room.players.get(playerId); if (p) p.connected = true;
            room.sendPrivateUpdate(playerId);
          }
          ws.send(JSON.stringify({ type: 'SESSION_READY' })); room.broadcastState();
        } else if (msg.type === 'LEAVE_SESSION') { detach(); room = undefined; playerId = ''; host = false; }
        else if (msg.type === 'ACTION' && room) act(room, msg.action, playerId, host, msg.payload || {});
      } catch (e) { ws.send(JSON.stringify({ type: 'JOIN_ERROR', message: (e as Error).message })); }
    });
    ws.on('close', detach);
    ws.on('error', () => ws.close());
  });
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (_req, res) => res.sendFile(path.join(process.cwd(), 'dist/index.html')));
  }
  const PORT = Number(process.env.PORT || 3000);
  server.listen(PORT, '0.0.0.0', () => console.log(`O Infiltrado: http://localhost:${PORT}`));
}
startServer();
