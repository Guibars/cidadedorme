import express from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import { gameManager } from './server/gameManager';
import { ClientMessage, ServerMessage } from './src/types';

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const pathname = request.url ? new URL(request.url, `http://${request.headers.host}`).pathname : '';
    // Allow /ws and root path for WebSocket
    if (pathname === '/ws' || pathname === '/') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Create Room via HTTP REST (instant, 100% reliable on 3 Mbps Wi-Fi)
  app.post('/api/rooms', (req, res) => {
    const room = gameManager.createRoom();
    res.json({
      roomCode: room.code,
      state: room.getPublicState(),
    });
  });

  // Room verification
  app.get('/api/rooms/:code', (req, res) => {
    const code = req.params.code.toUpperCase();
    const room = gameManager.getRoom(code);
    if (!room) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }
    return res.json({
      code: room.code,
      playerCount: room.getPlayerCount(),
      phase: room.phase,
      canJoin: room.phase === 'LOBBY' && room.getPlayerCount() < 5,
    });
  });

  // Get Room Public State
  app.get('/api/rooms/:code/state', (req, res) => {
    const code = req.params.code.toUpperCase();
    const room = gameManager.getRoom(code);
    if (!room) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }
    return res.json({ state: room.getPublicState() });
  });

  // Anonymous Join via HTTP REST (no login, no password, instant)
  app.post('/api/rooms/:code/join', (req, res) => {
    const code = req.params.code.toUpperCase().trim();
    const room = gameManager.getRoom(code);
    if (!room) {
      return res.status(404).json({ error: 'Sala não encontrada.' });
    }
    if (room.phase !== 'LOBBY') {
      return res.status(400).json({ error: 'A partida já começou.' });
    }
    if (room.getPlayerCount() >= 5) {
      return res.status(400).json({ error: 'A sala está cheia (máximo 5 jogadores).' });
    }

    const name = (req.body.name || '').trim();
    if (!name) {
      return res.status(400).json({ error: 'Por favor, informe seu apelido.' });
    }
    const avatarId = req.body.avatarId || 'fox';
    const playerId = req.body.playerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const player = room.addPlayer(playerId, name, avatarId);
    room.broadcastState();

    const privateData = room.getPrivateData(playerId);
    return res.json({
      playerId,
      roomCode: room.code,
      player,
      state: room.getPublicState(),
      privateData,
    });
  });

  // Player Private Data (secret role, clues, hints)
  app.get('/api/rooms/:code/private', (req, res) => {
    const code = req.params.code.toUpperCase().trim();
    const playerId = String(req.query.playerId || '');
    const room = gameManager.getRoom(code);
    if (!room) {
      return res.status(404).json({ error: 'Sala não encontrada.' });
    }
    const privateData = room.getPrivateData(playerId);
    if (!privateData) {
      return res.status(404).json({ error: 'Jogador não encontrado.' });
    }
    return res.json({ data: privateData });
  });

  // Dispatches Actions (works even when WebSocket is blocked)
  app.post('/api/rooms/:code/action', (req, res) => {
    const code = req.params.code.toUpperCase().trim();
    const room = gameManager.getRoom(code);
    if (!room) {
      return res.status(404).json({ error: 'Sala não encontrada.' });
    }

    const { action, playerId, ...payload } = req.body;

    switch (action) {
      case 'START_GAME':
        room.startGame();
        break;
      case 'ADVANCE_PHASE':
        room.advancePhase();
        break;
      case 'RESTART_GAME':
        room.restartGame();
        break;
      case 'ADD_BOT':
        room.addBotPlayer();
        break;
      case 'REMOVE_PLAYER':
        if (payload.targetPlayerId) {
          room.removePlayer(payload.targetPlayerId);
        }
        break;
      case 'ROLE_REVEALED':
        if (playerId) {
          const player = room.players.get(playerId);
          if (player) {
            player.hasRevealedRole = true;
            room.broadcastState();
            room.checkAllRolesRevealed();
          }
        }
        break;
      case 'SUBMIT_ANSWER':
        if (playerId && payload.answer) {
          room.submitAnswer(playerId, payload.answer);
        }
        break;
      case 'SUBMIT_VOTE':
        if (playerId && payload.targetPlayerId) {
          room.submitVote(playerId, payload.targetPlayerId, false);
        }
        break;
      case 'CONFIRM_VOTE':
        if (playerId) {
          room.confirmVote(playerId);
        }
        break;
      case 'USE_DETECTIVE':
        if (playerId && payload.targetPlayerId) {
          room.useDetectiveAbility(playerId, payload.targetPlayerId);
        }
        break;
      case 'USE_SABOTAGE':
        if (playerId && payload.sabotageId) {
          room.useKillerSabotage(playerId, payload.sabotageId);
        }
        break;
      case 'NIGHT_KILL':
        if (playerId && payload.targetPlayerId) {
          room.setNightKill(playerId, payload.targetPlayerId);
        }
        break;
      case 'NIGHT_INVESTIGATE':
        if (playerId && payload.targetPlayerId) {
          room.useDetectiveAbility(playerId, payload.targetPlayerId);
        }
        break;
      default:
        return res.status(400).json({ error: 'Ação desconhecida.' });
    }

    const state = room.getPublicState();
    const privateData = playerId ? room.getPrivateData(playerId) : null;
    return res.json({ success: true, state, privateData });
  });

  // WebSocket Connection Handling
  wss.on('connection', (ws: WebSocket) => {
    let clientRoomCode: string | null = null;
    let clientPlayerId: string | null = null;
    let isHost = false;

    ws.on('message', (data: string) => {
      try {
        const msg: ClientMessage = JSON.parse(data.toString());

        switch (msg.type) {
          case 'HOST_CREATE_ROOM': {
            const room = gameManager.createRoom();
            room.hostSocket = ws;
            clientRoomCode = room.code;
            isHost = true;

            const response: ServerMessage = {
              type: 'ROOM_CREATED',
              roomCode: room.code,
              hostId: 'host',
            };
            ws.send(JSON.stringify(response));
            room.broadcastState();
            break;
          }

          case 'PLAYER_JOIN_ROOM': {
            const code = msg.roomCode.toUpperCase().trim();
            const room = gameManager.getRoom(code);

            if (!room) {
              const err: ServerMessage = { type: 'JOIN_ERROR', message: 'Sala não encontrada.' };
              ws.send(JSON.stringify(err));
              return;
            }

            if (room.phase !== 'LOBBY') {
              const err: ServerMessage = { type: 'JOIN_ERROR', message: 'A partida já começou.' };
              ws.send(JSON.stringify(err));
              return;
            }

            if (room.getPlayerCount() >= 5) {
              const err: ServerMessage = { type: 'JOIN_ERROR', message: 'A sala está cheia (máximo 5 jogadores).' };
              ws.send(JSON.stringify(err));
              return;
            }

            const playerId = msg.playerId || `p_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
            const player = room.addPlayer(playerId, msg.name.trim(), msg.avatarId, ws);

            clientRoomCode = room.code;
            clientPlayerId = playerId;

            const joinMsg: ServerMessage = {
              type: 'ROOM_JOINED',
              playerId,
              roomCode: room.code,
              player,
            };
            ws.send(JSON.stringify(joinMsg));

            room.broadcastState();
            room.sendPrivateUpdate(playerId);
            break;
          }

          case 'RECONNECT_SESSION': {
            const code = msg.roomCode.toUpperCase().trim();
            const room = gameManager.getRoom(code);

            if (room && msg.playerId) {
              const player = room.players.get(msg.playerId);
              if (player) {
                player.connected = true;
                room.playerSockets.set(msg.playerId, ws);
                clientRoomCode = room.code;
                clientPlayerId = msg.playerId;

                const joinMsg: ServerMessage = {
                  type: 'ROOM_JOINED',
                  playerId: msg.playerId,
                  roomCode: room.code,
                  player,
                };
                ws.send(JSON.stringify(joinMsg));
                room.broadcastState();
                room.sendPrivateUpdate(msg.playerId);
              }
            }
            break;
          }

          case 'HOST_START_GAME': {
            if (clientRoomCode) {
              const room = gameManager.getRoom(clientRoomCode);
              if (room) {
                const started = room.startGame();
                if (!started) {
                  const err: ServerMessage = {
                    type: 'ANNOUNCEMENT',
                    text: 'Mínimo de 3 jogadores necessários para iniciar a partida.',
                  };
                  ws.send(JSON.stringify(err));
                }
              }
            }
            break;
          }

          case 'PLAYER_ROLE_REVEALED': {
            if (clientRoomCode && clientPlayerId) {
              const room = gameManager.getRoom(clientRoomCode);
              if (room) {
                const player = room.players.get(clientPlayerId);
                if (player) {
                  player.hasRevealedRole = true;
                  room.broadcastState();
                  room.checkAllRolesRevealed();
                }
              }
            }
            break;
          }

          case 'PLAYER_SUBMIT_ANSWER': {
            if (clientRoomCode && clientPlayerId) {
              const room = gameManager.getRoom(clientRoomCode);
              if (room) {
                room.submitAnswer(clientPlayerId, msg.answer);
              }
            }
            break;
          }

          case 'PLAYER_SUBMIT_VOTE': {
            if (clientRoomCode && clientPlayerId) {
              const room = gameManager.getRoom(clientRoomCode);
              if (room) {
                room.submitVote(clientPlayerId, msg.targetPlayerId, false);
              }
            }
            break;
          }

          case 'PLAYER_CONFIRM_VOTE': {
            if (clientRoomCode && clientPlayerId) {
              const room = gameManager.getRoom(clientRoomCode);
              if (room) {
                room.confirmVote(clientPlayerId);
              }
            }
            break;
          }

          case 'PLAYER_USE_DETECTIVE': {
            if (clientRoomCode && clientPlayerId) {
              const room = gameManager.getRoom(clientRoomCode);
              if (room) {
                room.useDetectiveAbility(clientPlayerId, msg.targetPlayerId);
              }
            }
            break;
          }

          case 'PLAYER_USE_SABOTAGE': {
            if (clientRoomCode && clientPlayerId) {
              const room = gameManager.getRoom(clientRoomCode);
              if (room) {
                room.useKillerSabotage(clientPlayerId, msg.sabotageId);
              }
            }
            break;
          }

          case 'PLAYER_NIGHT_KILL': {
            if (clientRoomCode && clientPlayerId && msg.targetPlayerId) {
              const room = gameManager.getRoom(clientRoomCode);
              if (room) {
                room.setNightKill(clientPlayerId, msg.targetPlayerId);
              }
            }
            break;
          }

          case 'PLAYER_NIGHT_INVESTIGATE': {
            if (clientRoomCode && clientPlayerId && msg.targetPlayerId) {
              const room = gameManager.getRoom(clientRoomCode);
              if (room) {
                room.useDetectiveAbility(clientPlayerId, msg.targetPlayerId);
              }
            }
            break;
          }

          case 'HOST_ADD_BOT': {
            if (clientRoomCode) {
              const room = gameManager.getRoom(clientRoomCode);
              if (room) {
                room.addBotPlayer();
              }
            }
            break;
          }

          case 'HOST_REMOVE_PLAYER': {
            if (clientRoomCode && msg.playerId) {
              const room = gameManager.getRoom(clientRoomCode);
              if (room) {
                room.removePlayer(msg.playerId);
              }
            }
            break;
          }

          case 'HOST_ADVANCE_PHASE': {
            if (clientRoomCode) {
              const room = gameManager.getRoom(clientRoomCode);
              if (room) {
                if (room.phase === 'ROLE_REVEAL') {
                  room.startRoundFlow();
                } else if (room.phase === 'ROUND_QUESTION') {
                  room.revealAnswers();
                } else if (room.phase === 'DISCUSSION') {
                  room.startVotingPhase();
                } else if (room.phase === 'VOTING') {
                  room.tallyVotesAndReveal();
                }
              }
            }
            break;
          }

          case 'HOST_RESTART_GAME': {
            if (clientRoomCode) {
              const room = gameManager.getRoom(clientRoomCode);
              if (room) {
                room.phase = 'LOBBY';
                room.round = 0;
                room.clues = [];
                room.winner = null;
                room.eliminatedPlayer = null;
                room.players.forEach((p) => {
                  p.isAlive = true;
                  p.hasRevealedRole = false;
                  p.role = undefined;
                  p.hasUsedAbility = false;
                  p.hasConfirmedVote = false;
                  p.currentAnswer = undefined;
                  p.votedTargetId = undefined;
                });
                room.broadcastState();
                room.broadcastPrivateUpdates();
              }
            }
            break;
          }
        }
      } catch (err) {
        console.error('Error processing websocket message:', err);
      }
    });

    ws.on('close', () => {
      if (clientRoomCode) {
        const room = gameManager.getRoom(clientRoomCode);
        if (room) {
          if (isHost) {
            // Host disconnected
          } else if (clientPlayerId) {
            const player = room.players.get(clientPlayerId);
            if (player) {
              player.connected = false;
              room.broadcastState();
            }
          }
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`O Infiltrado Server running on http://localhost:${PORT}`);
  });
}

startServer();
