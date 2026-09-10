import { canWalkSegment, findMansionPath } from '../src/data/navigation';
import { randomUUID } from 'node:crypto';
import { WebSocket } from 'ws';
import {
  Role,
  GamePhase,
  Player,
  PublicGameState,
  PrivatePlayerData,
  QuestionScenario,
  GameEvent,
  Clue,
  ClientMessage,
  ServerMessage,
  MansionRoomId,
  ForensicEvidence,
} from '../src/types';
import { AVATARS, QUESTIONS_DATABASE, RANDOM_EVENTS_POOL, SABOTAGE_OPTIONS } from '../src/data/content';
import {
  MANSION_ROOMS,
  MANSION_ROOM_BOUNDS,
  getMansionRoom,
  getRoomCenter,
  getRoomAtPosition,
  clampMansionPosition,
} from '../src/data/mansion';

const BOT_NAMES = ['Eduardo', 'Marianne', 'Lucas', 'Pedro', 'Beatriz', 'Rafael'];

export class Room {
  public code: string;
  public lastActiveAt = Date.now();
  public readonly hostToken = randomUUID();
  public playerTokens = new Map<string, string>();
  private investigationResults = new Map<string, NonNullable<PrivatePlayerData['detectiveInvestigationResult']>>();
  private movementFlush: ReturnType<typeof setTimeout> | null = null;
  private lastMovement = new Map<string, number>();
  private gameTimers = new Set<ReturnType<typeof setTimeout>>();
  private gameIntervals = new Set<ReturnType<typeof setInterval>>();
  private later(callback: () => void, ms: number) {
    const timer = setTimeout(() => { this.gameTimers.delete(timer); callback(); }, ms);
    this.gameTimers.add(timer); return timer;
  }
  private repeat(callback: () => void, ms: number) {
    const timer = setInterval(callback, ms); this.gameIntervals.add(timer); return timer;
  }
  private clearGameTimers() {
    this.gameTimers.forEach(clearTimeout); this.gameTimers.clear();
    this.gameIntervals.forEach(clearInterval); this.gameIntervals.clear();
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
  public hostSocket: WebSocket | null = null;
  public players: Map<string, Player> = new Map();
  public playerSockets: Map<string, WebSocket> = new Map();
  public phase: GamePhase = 'LOBBY';
  public round: number = 0;
  public maxRounds: number = 3;
  public timerSeconds: number = 0;
  public timerMax: number = 60;
  private timerInterval: NodeJS.Timeout | null = null;

  public currentQuestion: QuestionScenario | null = null;
  public currentEvent: GameEvent | null = null;
  public clues: Clue[] = [];
  public activeVotesCount: number = 0;
  public voteRevealStep: number = 0;
  public revealedVotes: { voterName: string; targetId: string; targetName: string }[] = [];
  public eliminatedPlayer: { id: string; name: string; avatar: any; role: Role } | null = null;
  public winner: 'INVESTIGADORES' | 'ASSASSINO' | null = null;
  public killerPlayerId: string | null = null;
  public detectivePlayerId: string | null = null;
  public gameOverReason: 'DETECTIVE_KILLED_KILLER' | 'KILLER_ELIMINATED' | 'KILLER_DOMINATION' | 'VOTE_EXECUTION' | null = null;
  public gameOverMessage: string | null = null;
  public detectiveAccusation: {
    detectiveName: string;
    accusedPlayerId: string;
    accusedPlayerName: string;
    isCorrect: boolean;
    timestamp: number;
  } | null = null;
  public nightKillHappened: boolean = false;
  public pendingSabotage: string | null = null;
  public nightVictimId: string | null = null;
  public nightVictim: { id: string; name: string; avatar: any } | null = null;
  public nightCrimeRoomId: MansionRoomId | null = null;
  public nightCrimeRoomName: string | null = null;
  public nightClue: string = '';
  public forensicEvidence: ForensicEvidence | null = null;
  public lastStabLocation: {
    x: number;
    y: number;
    victimId: string;
    victimName: string;
    roomId?: MansionRoomId;
    timestamp: number;
  } | null = null;

  private aiChatInterval: NodeJS.Timeout | null = null;

  constructor(code: string) {
    this.code = code;
    this.startAIChatLoop();
  }

  private startAIChatLoop() {
    this.aiChatInterval = setInterval(() => {
      this.players.forEach((p) => {
        if (p.isBot && p.isAlive && Math.random() < 0.15) { // 15% chance every 4 seconds
          this.generateSmartAIChat(p);
        }
      });
    }, 4000);
  }

  private generateSmartAIChat(bot: Player) {
    let messages: string[] = [];

    switch (this.phase) {
      case 'LOBBY':
        messages = [
          'Estou sentindo um clima estranho hoje...',
          'Quantos de vocês sabem manter um segredo?',
          'Pronto para o jogo.',
          'Espero que o Detetive seja bom...',
          'Já podemos começar?',
          'O relógio está correndo...'
        ];
        break;
      case 'DISCUSSION':
        messages = [
          'Eu tenho quase certeza de que vi algo estranho.',
          'Não olhem para mim, eu estava longe de confusão.',
          'Alguém está mentindo...',
          'Eu não confio nas respostas dessa última rodada.',
          'Vocês estão acusando a pessoa errada.',
          'Silêncio. Eu consigo ouvir alguém respirando alto...',
          'Eu vi alguém saindo da cena do crime.',
          'Cuidado com quem votam.',
          'Não se deixem enganar tão fácil.'
        ];
        break;
      case 'VOTING':
        messages = [
          'Já decidi meu voto.',
          'Espero que eu não esteja cometendo um erro.',
          'Adeus para quem for...',
          'Meu voto já foi.'
        ];
        break;
      default:
        // No talking in other phases (like night or reading questions)
        return;
    }

    if (messages.length > 0) {
      const msg = messages[Math.floor(Math.random() * messages.length)];
      bot.chatMessage = msg;
      bot.chatTimestamp = Date.now();
      this.broadcastState();

      // Clear the message after a few seconds
      this.later(() => {
        if (bot.chatMessage === msg) {
          bot.chatMessage = undefined;
          this.broadcastState();
        }
      }, 5000 + Math.random() * 3000); // 5-8 seconds
    }
  }

  public addMysteriousAI() {
    // Add a specialized, always-present mysterious AI player
    const aiId = `ai_phantom_${Date.now()}`;
    const avatar = AVATARS.find((a) => a.id === 'avatar-wolf') || AVATARS[AVATARS.length - 1];
    this.addPlayer(aiId, 'Fantasma (IA)', avatar.id, undefined, true);
  }

  public addPlayer(id: string, name: string, avatarId: string, socket?: WebSocket, isBot: boolean = false): Player {
    const avatar = AVATARS.find((a) => a.id === avatarId) || AVATARS[this.players.size % AVATARS.length];
    const defaultRoom = MANSION_ROOMS[this.players.size % MANSION_ROOMS.length].id;
    const center = getRoomCenter(defaultRoom);
    const player: Player = {
      id,
      name,
      avatar,
      isBot,
      isAlive: true,
      hasRevealedRole: false,
      connected: true,
      currentRoomId: defaultRoom,
      x: center.x + Math.round(Math.random() * 24 - 12),
      y: center.y + Math.round(Math.random() * 24 - 12),
      hasUsedAbility: false,
      hasConfirmedVote: false,
      privateNotes: [],
      stats: {
        votesReceived: 0,
        votesCastAgainstKiller: 0,
        correctAccusations: 0,
        survivedRounds: 0,
      },
    };

    this.players.set(id, player);
    if (socket) {
      this.playerSockets.set(id, socket);
    }
    this.broadcastState();
    return player;
  }

  public setPlayerRoom(playerId: string, roomId: MansionRoomId) {
    const player = this.players.get(playerId);
    if (!player || !player.isAlive || this.phase !== 'ROLE_REVEAL' || !MANSION_ROOM_BOUNDS[roomId]) return;
    Object.assign(player, getRoomCenter(roomId));
    player.currentRoomId = roomId;
    this.broadcastState();
    this.sendPrivateUpdate(playerId);
  }

  public removePlayer(playerId: string) {
    if (this.phase !== 'LOBBY') return;
    const ws = this.playerSockets.get(playerId);
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'SESSION_EXPIRED', message: 'O anfitrião removeu você da sala.' }));
    this.playerTokens.delete(playerId);
    this.players.delete(playerId);
    this.playerSockets.delete(playerId);
    this.broadcastState();
  }

  public getPlayerCount(): number {
    return this.players.size;
  }

  public getAlivePlayers(): Player[] {
    return Array.from(this.players.values()).filter((p) => p.isAlive);
  }

  public startGame() {
    const playerList = Array.from(this.players.values());
    if (this.phase !== 'LOBBY' || playerList.length < 3 || playerList.length > 5) return false;
    this.clearGameTimers();
    this.investigationResults.clear();

    // Reset game state
    this.round = 1;
    this.clues = [];
    this.winner = null;
    this.eliminatedPlayer = null;
    this.nightVictimId = null;
    this.nightVictim = null;
    this.nightCrimeRoomId = null;
    this.nightCrimeRoomName = null;
    this.gameOverReason = null;
    this.gameOverMessage = null;
    this.detectiveAccusation = null;
    this.nightKillHappened = false;

    // Assign roles: 1 ASSASSINO, 1 DETETIVE, others INOCENTE
    // Rules:
    // 1. Bot is NEVER Detective ("Ele não pode um detetive")
    // 2. Any player (human or bot) can be Killer with equal fair probability!
    // 3. Detective is chosen from eligible humans.
    const shuffle = <T>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const [killer, detective] = shuffle(playerList);

    killer.role = 'ASSASSINO';
    this.killerPlayerId = killer.id;

    detective.role = 'DETETIVE';
    this.detectivePlayerId = detective.id;

    // Assign Innocent to everyone else
    playerList.forEach((p) => {
      if (p.id !== killer.id && p.id !== detective.id) {
        p.role = 'INOCENTE';
      }
    });

    // Distribute players across the mansion rooms with coordinates
    playerList.forEach((p, idx) => {
      const room = MANSION_ROOMS[idx % MANSION_ROOMS.length];
      const center = getRoomCenter(room.id);
      p.isAlive = true;
      p.hasRevealedRole = false;
      p.hasUsedAbility = false;
      p.hasConfirmedVote = false;
      p.currentAnswer = undefined;
      p.votedTargetId = undefined;
      p.privateNotes = [];
      p.currentRoomId = room.id;
      p.x = center.x + Math.round(Math.random() * 20 - 10);
      p.y = center.y + Math.round(Math.random() * 20 - 10);
    });

    this.phase = 'INTRO';
    this.broadcastState();
    this.broadcastPrivateUpdates();

    // Cinematic Intro sequence: automatically transitions to ROLE_REVEAL after 5 seconds
    this.later(() => {
      if (this.phase === 'INTRO') {
        this.phase = 'ROLE_REVEAL';
        // Give 60 seconds so players can read comfortably without getting rushed
        this.timerSeconds = 60;
        this.timerMax = 60;
        this.broadcastState();
        this.broadcastPrivateUpdates();

        // Simulate bots taking a few seconds to "read" their roles and click ready
        this.players.forEach((p) => {
          if (p.isBot) {
            this.later(() => {
              if (this.phase === 'ROLE_REVEAL') {
                p.hasRevealedRole = true;
                this.broadcastState();
                this.checkAllRolesRevealed();
              }
            }, 3500 + Math.random() * 8000);
          }
        });

        // Safe fallback timer: 60s
        this.startTimer(60, () => {
          this.startRoundFlow();
        });
      }
    }, 5000);

    return true;
  }

  public checkAllRolesRevealed() {
    const alivePlayers = this.getAlivePlayers();
    const allRevealed = alivePlayers.length > 0 && alivePlayers.every((p) => p.hasRevealedRole);

    if (allRevealed && this.phase === 'ROLE_REVEAL') {
      if (this.timerInterval) clearInterval(this.timerInterval);
      // Give a 2.5s graceful countdown so everyone can put their phones down before night falls
      this.timerSeconds = 3;
      this.timerMax = 3;
      this.broadcastState();

      this.later(() => {
        if (this.phase === 'ROLE_REVEAL') {
          this.startRoundFlow();
        }
      }, 2500);
    }
  }

  public startRoundFlow() {
    this.startNightKillerPhase();
  }

  // Movement handler for live 2D map
  public movePlayer(playerId: string, x: number, y: number, _roomId?: MansionRoomId) {
    const player = this.players.get(playerId);
    if (!player || !player.isAlive || player.id === this.nightVictimId || this.phase !== 'NIGHT_KILLER') return;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return;
    const now = Date.now();
    const elapsed = Math.min(0.5, (now - (this.lastMovement.get(playerId) ?? now - 100)) / 1000);
    const old = { x: player.x ?? 400, y: player.y ?? 250 };
    const target = clampMansionPosition(x, y);
    const distance = Math.hypot(target.x - old.x, target.y - old.y);
    if (!player.isBot && distance > 280 * elapsed + 24) return;
    if (!canWalkSegment(old, target)) {
      // Between network samples a player may have legitimately rounded a corner.
      const route = findMansionPath(old, target);
      let length = 0, previous = old;
      for (const point of route) { length += Math.hypot(point.x - previous.x, point.y - previous.y); previous = point; }
      if (!route.length || Math.hypot(previous.x - target.x, previous.y - target.y) > 1 || length > 280 * elapsed + 24) return;
    }
    this.lastMovement.set(playerId, now);
    Object.assign(player, target);
    player.currentRoomId = getRoomAtPosition(target.x, target.y);
    player.isMoving = distance > 0;
    if (!this.movementFlush) this.movementFlush = this.later(() => {
      this.movementFlush = null; this.broadcastState();
    }, 75);
  }

  // Night Phase: Darkness falls, Assassin hunts on the map, everyone moves around
  public startNightKillerPhase() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.phase = 'NIGHT_KILLER';
    // 35 seconds for the killer to walk close and strike with the knife
    this.timerSeconds = 20;
    this.timerMax = 20;
    this.nightVictimId = null;
    this.nightVictim = null;
    this.nightCrimeRoomId = null;
    this.nightCrimeRoomName = null;
    this.forensicEvidence = null;
    this.lastStabLocation = null;
    this.nightKillHappened = false;
    this.lastMovement.clear();
    this.investigationResults.clear();
    this.currentEvent = null;
    this.nightClue = '';
    this.players.forEach(p => { p.hasUsedAbility = false; p.isMoving = false; });

    // Reset night choices and votes
    this.players.forEach((p) => {
      p.votedTargetId = undefined;
      p.hasConfirmedVote = false;
    });

    this.broadcastState();
    this.broadcastPrivateUpdates();
    this.broadcastAudio('playNightFall');

    // Simulate bots walking around during the night (Among Us feel)
    const botMoveInterval = this.repeat(() => {
      if (this.phase !== 'NIGHT_KILLER' && this.phase !== 'NIGHT_FALL') {
        clearInterval(botMoveInterval);
        return;
      }

      this.players.forEach((p) => {
        if (!p.isBot || !p.isAlive) return;

        // If bot is Killer, move towards nearest living player or run away
        if (p.role === 'ASSASSINO') {
          if (this.nightKillHappened) {
            // Run away rapidly to establish alibi
            if (Math.random() < 0.8) {
              const dx = (Math.random() - 0.5) * 150;
              const dy = (Math.random() - 0.5) * 150;
              this.movePlayer(p.id, (p.x || 400) + dx, (p.y || 250) + dy);
            }
          } else {
            // Filter targets to try and avoid the Detective if possible, unless no one else is left
            let targets = this.getAlivePlayers().filter((t) => t.id !== p.id);
            if (targets.length === 0) {
              targets = this.getAlivePlayers().filter((t) => t.id !== p.id);
            }

            if (targets.length > 0) {
              // Pick closest target
              const px = p.x || 400;
              const py = p.y || 250;
              targets.sort((a, b) => {
                const distA = Math.hypot((a.x || 400) - px, (a.y || 250) - py);
                const distB = Math.hypot((b.x || 400) - px, (b.y || 250) - py);
                return distA - distB;
              });

              const target = targets[0];
              const tx = target.x || 400;
              const ty = target.y || 250;

              const dist = Math.hypot(tx - px, ty - py);
              if (dist <= 70) {
                // Close enough to strike!
                this.setNightKill(p.id, target.id, target.currentRoomId, tx, ty);
              } else {
            // Step towards victim
            const angle = Math.atan2(ty - py, tx - px);
            const speed = 40;
            const nextX = px + Math.cos(angle) * speed;
            const nextY = py + Math.sin(angle) * speed;
            const route = findMansionPath({ x: px, y: py }, { x: tx, y: ty });
            const step = route.find(point => Math.hypot(point.x - px, point.y - py) > 1);
            if (step) this.movePlayer(p.id, step.x, step.y);
              }
            }
          }
        } else {
          // Innocent / Detective bot: wander gently around mansion
          if (Math.random() < 0.6) {
            const dx = (Math.random() - 0.5) * 60;
            const dy = (Math.random() - 0.5) * 60;
            this.movePlayer(p.id, (p.x || 400) + dx, (p.y || 250) + dy);
          }
        }
      });
    }, 180);

    // 20-second timer for killer turn -> then transitions directly to daybreak
    this.startTimer(40, () => {
      clearInterval(botMoveInterval);
      this.startDayBreak();
    });
  }

  // Legacy fallback if needed
  public startNightFall() {
    this.startNightKillerPhase();
  }

  public setNightKill(
    killerId: string,
    targetPlayerId: string,
    crimeRoomId?: MansionRoomId,
    x?: number,
    y?: number
  ) {
    if (this.phase !== 'NIGHT_KILLER' && this.phase !== 'NIGHT_FALL') return;
    if (killerId !== this.killerPlayerId) return;
    if (this.nightKillHappened) return false;

    const target = this.players.get(targetPlayerId);
    const killer = this.players.get(killerId);
    if (!target || !target.isAlive || !killer?.isAlive || target.id === killerId) return false;
    if (Math.hypot((target.x ?? 0) - (killer.x ?? 0), (target.y ?? 0) - (killer.y ?? 0)) > 85) return false;
    if (!canWalkSegment({ x: killer.x!, y: killer.y! }, { x: target.x!, y: target.y! })) return false;

    // Ataque bem-sucedido em um inocente
    this.nightKillHappened = true;
    this.nightVictimId = target.id;
    this.nightCrimeRoomId = getRoomAtPosition(target.x ?? 400, target.y ?? 250);
    this.nightCrimeRoomName = getMansionRoom(this.nightCrimeRoomId).name;

    const stabX = target.x ?? 400;
    const stabY = target.y ?? 250;

    this.lastStabLocation = {
      x: stabX,
      y: stabY,
      victimId: target.id,
      victimName: target.name,
      roomId: this.nightCrimeRoomId,
      timestamp: Date.now(),
    };

    // Toca som de facada
    this.sendPrivateUpdate(target.id, { isNightVictim: true });

    // TEMPO DE FUGA DO ASSASSINO:
    // Garante pelo menos 6 segundos para fugir e forjar álibi
    if (this.timerSeconds < 6) {
      this.timerSeconds = 6;
    }

    this.broadcastState();
    this.broadcastPrivateUpdates();
    return true;
  }

  // Detective role is removed as requested by user - straight to Day Break
  public startNightDetectivePhase() {
    this.startDayBreak();
  }

  public startDayBreak() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.players.forEach(p => { p.isMoving = false; });
    this.phase = 'DAY_BREAK';
    this.timerSeconds = 6;
    this.timerMax = 6;

    this.broadcastState();
    this.broadcastPrivateUpdates();
    this.broadcastAudio('playDayBreak');

    this.startTimer(6, () => {
      this.revealCrimeScene();
    });
  }

  public revealCrimeScene() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.phase = 'CRIME_SCENE';
    this.timerSeconds = 12;
    this.timerMax = 12;

    const killer = this.players.get(this.killerPlayerId || '');

    if (this.nightVictimId) {
      const victim = this.players.get(this.nightVictimId);
      if (victim && victim.isAlive) {
        victim.isAlive = false;
        this.nightVictim = {
          id: victim.id,
          name: victim.name,
          avatar: victim.avatar,
        };

        const crimeRoomId = this.nightCrimeRoomId || 'kitchen';
        const crimeRoomName = this.nightCrimeRoomName || getMansionRoom(crimeRoomId).name;
        const killerEscapeRoomId = killer?.currentRoomId || (crimeRoomId === 'kitchen' ? 'basement' : 'kitchen');
        const killerEscapeRoomName = getMansionRoom(killerEscapeRoomId).name;

        // Remove obvious clues as requested by user
        const physicalEvidence = 'Apenas uma leve desordem no ambiente, sem rastros claros.';
        const weaponTrace = 'A arma do crime foi levada, não há impressões digitais.';
        const escapeRouteClue = 'Não há rastros de pegadas. O local do crime foi limpo.';
        const acousticReport = 'O silêncio reinou na mansão. Nada foi ouvido.';

        // Calculate blood trail points from crime location to escape room center (Empty to remove obvious blood)
        const trailPoints: { x: number; y: number }[] = [];

        this.forensicEvidence = {
          crimeRoomId,
          crimeRoomName,
          victimName: victim.name,

          weaponTrace,
          physicalEvidence,
          escapeRouteClue,
          acousticReport,
          trailPoints,
        };

        this.nightClue = `🔍 PERÍCIA: O corpo de ${victim.name} foi encontrado na(o) ${crimeRoomName}. O assassino agiu rápido e de forma furtiva.`;

        this.clues.push({
          id: `night-clue-${Date.now()}`,
          round: this.round,
          type: 'forensic',
          text: this.nightClue,
          details: `${physicalEvidence} • ${escapeRouteClue}`,
          evidenceCategory: 'blood',
        });
      }
    } else {
      this.nightVictim = null;
      this.forensicEvidence = null;
      this.nightClue = 'Nenhum ataque foi consumado nesta noite... Todos os cômodos amanheceram seguros!';
    }

    this.broadcastState();
    this.broadcastPrivateUpdates();
    this.broadcastAudio('playKillStab');

    // Check if Killer already won (e.g. only 1 innocent left)
    const alivePlayers = this.getAlivePlayers();
    const aliveKiller = alivePlayers.find((p) => p.role === 'ASSASSINO');
    const aliveInnocents = alivePlayers.filter((p) => p.role !== 'ASSASSINO');

    if (!aliveKiller) {
      this.endGame('INVESTIGADORES');
      return;
    }

    if (aliveInnocents.length === 0) {
      this.endGame('ASSASSINO');
      return;
    }

    // Record everyone’s alibi before the discussion.
    this.startTimer(12, () => {
      this.startQuestionPhase();
    });
  }

  public startQuestionPhase() {
    // Select question
    this.currentQuestion = {
      id: `alibi-${this.round}`, category: 'alibi', categoryLabel: 'DEPOIMENTO SOB SUSPEITA',
      context: this.nightVictim ? `${this.nightVictim.name} não sobreviveu à noite. Sua versão ficará registrada.` : 'Todos sobreviveram. Mas alguém esconde o que tentou fazer.',
      question: 'Onde você estava? Qual é o seu álibi?',
      options: MANSION_ROOMS.map(r => `Eu estava na ${r.name}.`),
      killerHint: 'Seu álibi pode ser uma mentira. Escolha uma versão e sustente-a durante o debate.',
    };

    // Reset player answers
    this.players.forEach((p) => {
      p.currentAnswer = undefined;
      p.answerTimestamp = undefined;
      p.hasConfirmedVote = false;
      p.votedTargetId = undefined;
    });

    this.phase = 'ROUND_QUESTION';
    this.timerSeconds = 40;
    this.timerMax = 40;
    this.broadcastState();
    this.broadcastPrivateUpdates();

    // Start timer
    this.startTimer(40, () => {
      // Time up: reveal answers
      this.revealAnswers();
    });

    // Simulate bot answers
    this.players.forEach((p) => {
      if (p.isBot && p.isAlive) {
        const delay = 3000 + Math.random() * 8000;
        this.later(() => {
          if (this.phase === 'ROUND_QUESTION' && !p.currentAnswer && this.currentQuestion) {
            const opts = this.currentQuestion.options;
            const chosen = opts[Math.floor(Math.random() * opts.length)];
            this.submitAnswer(p.id, chosen);
          }
        }, delay);
      }
    });
  }

  public submitAnswer(playerId: string, answer: string) {
    const player = this.players.get(playerId);
    if (!player || !player.isAlive || this.phase !== 'ROUND_QUESTION') return;

    if (typeof answer !== 'string' || !answer.trim() || player.currentAnswer !== undefined) return;
    player.currentAnswer = answer.trim().slice(0, 180);
    player.answerTimestamp = Date.now();

    this.broadcastState();
    this.sendPrivateUpdate(playerId);

    // Check if all alive players answered
    const alivePlayers = this.getAlivePlayers();
    const allAnswered = alivePlayers.every((p) => p.currentAnswer !== undefined);
    if (allAnswered) {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.later(() => {
        this.revealAnswers();
      }, 1000);
    }
  }

  public revealAnswers() {
    if (this.phase !== 'ROUND_QUESTION') return;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.phase = 'ROUND_REVEAL';

    // Apply sabotage if killer requested scramble
    if (this.pendingSabotage === 'SCRAMBLE_ANSWERS') {
      const alive = this.getAlivePlayers().filter((p) => p.currentAnswer);
      if (alive.length >= 2) {
        const temp = alive[0].currentAnswer;
        alive[0].currentAnswer = alive[1].currentAnswer;
        alive[1].currentAnswer = temp;
      }
      this.pendingSabotage = null;
    }

    this.broadcastState();

    // After 6 seconds of looking at answers, transition to Discussion
    this.later(() => {
      this.startDiscussionPhase();
    }, 6500);
  }

  public startDiscussionPhase() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.phase = 'DISCUSSION';
    // Extended discussion time: 75 seconds for deep investigation and alibis
    this.timerSeconds = 75;
    this.timerMax = 75;

    // Generate dynamic clue for this round
    // Alibis and the private investigation provide evidence; no fabricated factual clues.

    this.broadcastState();
    this.broadcastPrivateUpdates();

    this.startTimer(75, () => {
      this.startVotingPhase();
    });
  }

  private generateRoundClue() {
    const killer = this.players.get(this.killerPlayerId || '');
    if (!killer) return;

    // Clue types based on real data
    const clueTemplates: Clue[] = [];

    // Clue 1: Response time
    if (killer.answerTimestamp) {
      const wasFast = Math.random() < 0.5;
      if (wasFast) {
        clueTemplates.push({
          id: `clue-${Date.now()}-1`,
          round: this.round,
          type: 'timing',
          text: `O assassino respondeu a última pergunta nos primeiros 15 segundos.`,
        });
      } else {
        clueTemplates.push({
          id: `clue-${Date.now()}-1`,
          round: this.round,
          type: 'timing',
          text: `O assassino hesitou antes de confirmar seu álibi.`,
        });
      }
    }

    // Clue 2: Option hint (shows 2 options, one is the killer's)
    if (killer.currentAnswer && this.currentQuestion) {
      const otherOptions = this.currentQuestion.options.filter((o) => o !== killer.currentAnswer);
      const randomOther = otherOptions[Math.floor(Math.random() * otherOptions.length)] || 'outro local';
      clueTemplates.push({
        id: `clue-${Date.now()}-2`,
        round: this.round,
        type: 'location',
        text: `O assassino escolheu uma destas opções: "${killer.currentAnswer}" ou "${randomOther}".`,
      });
    }

    // Clue 3: Behavioral trait
    clueTemplates.push({
      id: `clue-${Date.now()}-3`,
      round: this.round,
      type: 'behavior',
      text: `O assassino tem agido de forma excessivamente cuidadosa para despistar suspeitas.`,
    });

    const chosenClue = clueTemplates[Math.floor(Math.random() * clueTemplates.length)];
    if (chosenClue && !this.clues.some((c) => c.text === chosenClue.text)) {
      this.clues.push(chosenClue);
    }
  }

  public startVotingPhase() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.phase = 'VOTING';
    // Only 35 seconds for the detective to make the final choice
    this.timerSeconds = 35;
    this.timerMax = 35;
    this.activeVotesCount = 0;

    this.players.forEach((p) => {
      p.votedTargetId = undefined;
      p.hasConfirmedVote = false;
    });

    this.broadcastState();
    this.broadcastPrivateUpdates();

    this.startTimer(35, () => {
      this.tallyVotesAndReveal();
    });

    this.getAlivePlayers().filter(p => p.isBot).forEach(bot => {
      this.later(() => {
        if (this.phase !== 'VOTING') return;
        const targets = this.getAlivePlayers().filter(p => p.id !== bot.id);
        if (targets.length) this.submitVote(bot.id, targets[Math.floor(Math.random() * targets.length)].id, true);
      }, 3000 + Math.random() * 6000);
    });
  }

  public submitVote(voterId: string, targetId: string, confirmImmediately = false) {
    const voter = this.players.get(voterId);
    const target = this.players.get(targetId);
    if (this.phase !== 'VOTING' || !voter?.isAlive || voter.hasConfirmedVote || !target?.isAlive || targetId === voterId) return;
    voter.votedTargetId = targetId;
    if (confirmImmediately) this.confirmVote(voterId);
    else this.sendPrivateUpdate(voterId);
  }

  public confirmVote(voterId: string) {
    const voter = this.players.get(voterId);
    if (this.phase !== 'VOTING' || !voter?.isAlive || voter.hasConfirmedVote || !voter.votedTargetId) return;
    if (!this.players.get(voter.votedTargetId)?.isAlive) return;
    voter.hasConfirmedVote = true;
    this.activeVotesCount = this.getAlivePlayers().filter(p => p.hasConfirmedVote).length;
    this.broadcastState(); this.sendPrivateUpdate(voterId);
    if (this.activeVotesCount === this.getAlivePlayers().length) {
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.later(() => { if (this.phase === 'VOTING') this.tallyVotesAndReveal(); }, 1000);
    }
  }

  public tallyVotesAndReveal() {
    if (this.phase !== 'VOTING') return;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.phase = 'VOTE_REVEAL';

    const votesList: { voterName: string; targetId: string; targetName: string }[] = [];
    const tally: Record<string, number> = {};

    this.getAlivePlayers().forEach((p) => {
      const targetId = p.votedTargetId;
      if (targetId && p.hasConfirmedVote) {
        const target = this.players.get(targetId);
        if (target) {
          target.stats.votesReceived++;
          if (target.role === 'ASSASSINO') {
            p.stats.votesCastAgainstKiller++;
          }
          tally[targetId] = (tally[targetId] || 0) + 1;
          votesList.push({
            voterName: p.name,
            targetId: target.id,
            targetName: target.name,
          });
        }
      }
    });

    this.revealedVotes = votesList;
    this.voteRevealStep = 0;
    this.broadcastState();

    // Cinematic step-by-step reveal: advance step every 2.5 seconds
    const interval = this.repeat(() => {
      this.voteRevealStep++;
      this.broadcastState();
      this.sendAudioTrigger('VOTE_REVEAL');

      if (this.voteRevealStep >= votesList.length) {
        clearInterval(interval);
        // After votes revealed, determine most voted player
        this.later(() => {
          this.executeVerdict(tally);
        }, 3000);
      }
    }, 2500);
  }

  private executeVerdict(tally: Record<string, number>) {
    this.phase = 'VERDICT';

    // Find highest vote count
    let maxVotes = 0;
    let eliminatedId: string | null = null;
    let tie = false;

    Object.entries(tally).forEach(([targetId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedId = targetId;
        tie = false;
      } else if (count === maxVotes && maxVotes > 0) {
        tie = true;
      }
    });

    if (eliminatedId && !tie) {
      const player = this.players.get(eliminatedId);
      if (player) {
        player.isAlive = false;
        this.eliminatedPlayer = {
          id: player.id,
          name: player.name,
          avatar: player.avatar,
          role: player.role || 'INOCENTE',
        };
      }
    } else {
      this.eliminatedPlayer = null; // Tie: no one eliminated
    }

    this.broadcastState();

    // Check Win/Loss conditions
    this.later(() => {
      this.checkEndConditions();
    }, 6000);
  }

  public checkEndConditions() {
    const killer = this.players.get(this.killerPlayerId || '');
    const alivePlayers = this.getAlivePlayers();
    const aliveInnocents = alivePlayers.filter((p) => p.role !== 'ASSASSINO');

    // Condition 1: Killer is eliminated -> Investigators Win!
    if (killer && !killer.isAlive) {
      this.endGame('INVESTIGADORES');
      return;
    }

    // Condition 2: Killer reaches round 3 or innocents equal 1 -> Killer Wins!
    if (this.round >= this.maxRounds || aliveInnocents.length === 0) {
      this.endGame('ASSASSINO');
      return;
    }

    // Otherwise, advance to next round!
    this.round++;
    this.players.forEach((p) => {
      p.hasUsedAbility = false;
      p.hasConfirmedVote = false;
      p.votedTargetId = undefined;
      p.currentAnswer = undefined;
    });
    this.startRoundFlow();
  }

  public endGame(winner: 'INVESTIGADORES' | 'ASSASSINO') {
    this.clearGameTimers();
    this.phase = 'GAME_OVER';
    this.winner = winner;

    this.broadcastState();
    this.broadcastPrivateUpdates();
  }

  // Detective Investigation / Accusation Ability
  public useDetectiveAbility(detectiveId: string, targetId: string) {
    const detective = this.players.get(detectiveId);
    const target = this.players.get(targetId);
    if (this.phase !== 'NIGHT_KILLER' || !detective?.isAlive || detective.id === this.nightVictimId || detective.role !== 'DETETIVE' || detective.hasUsedAbility || !target?.isAlive || target.id === detectiveId) return;
    detective.hasUsedAbility = true;
    const isKiller = target.role === 'ASSASSINO';
    this.investigationResults.set(detectiveId, {
      targetName: target.name, isKiller,
      resultText: isKiller ? `${target.name} é o infiltrado. Convença o grupo sem mostrar sua tela.` : `${target.name} não é o infiltrado. Use essa informação no debate.`,
    });
    this.sendPrivateUpdate(detectiveId);
  }

  public useKillerSabotage(killerId: string, sabotageId: string) {
    const killer = this.players.get(killerId);
    if (!killer?.isAlive || killer.role !== 'ASSASSINO' || killer.hasUsedAbility || this.phase !== 'DISCUSSION' || sabotageId !== 'FALSE_CLUE') return;
    const targets = this.getAlivePlayers().filter(p => p.id !== killerId);
    if (!targets.length) return;
    killer.hasUsedAbility = true;
    const target = targets[Math.floor(Math.random() * targets.length)];
    this.currentEvent = { id: 'sabotage_rumor', title: 'BOATO ANÔNIMO', type: 'anonymous_tip', flavorText: 'Uma mensagem apareceu na mansão.', description: `Alguém diz que ${target.name} foi visto perto da cena do crime.` };
    this.broadcastState(); this.sendPrivateUpdate(killerId);
  }

  private startTimer(duration: number, onComplete: () => void) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerSeconds = duration;
    this.timerMax = duration;

    this.timerInterval = this.repeat(() => {
      this.timerSeconds--;
      if (this.timerSeconds <= 0) {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.broadcastState();
        onComplete();
      } else {
        // Broadcast every second so mobile and TV clocks remain in tight lockstep
        this.broadcastState();
      }
    }, 1000);
  }

  public getPublicState(viewerId?: string): PublicGameState {
    const night = this.phase === 'NIGHT_KILLER' || this.phase === 'NIGHT_FALL';
    const viewer = viewerId ? this.players.get(viewerId) : undefined;
    const playerList = Array.from(this.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isBot: p.isBot,
      isAlive: p.isAlive,
      hasRevealedRole: p.hasRevealedRole,
      connected: p.connected,
      currentRoomId: night && p.id !== viewerId ? undefined : p.currentRoomId,
      x: night && (!viewer || (p.id !== viewerId && Math.hypot((p.x ?? 0) - (viewer.x ?? 0), (p.y ?? 0) - (viewer.y ?? 0)) > 170)) ? undefined : p.x,
      y: night && (!viewer || (p.id !== viewerId && Math.hypot((p.x ?? 0) - (viewer.x ?? 0), (p.y ?? 0) - (viewer.y ?? 0)) > 170)) ? undefined : p.y,
      isMoving: !night || p.id === viewerId ? p.isMoving : undefined,
      direction: !night || p.id === viewerId ? p.direction : undefined,
      hasAnswered: p.currentAnswer !== undefined,
      hasVoted: p.hasConfirmedVote,
      eliminatedRole: !p.isAlive ? p.role : undefined,
      chatMessage: p.chatMessage,
      chatTimestamp: p.chatTimestamp,
    }));

    const killer = this.players.get(this.killerPlayerId || '');

    // Best Detective / Investigator (player who voted against killer most)
    let bestDetective: { name: string; score: number } | undefined;
    let maxDetectiveScore = -1;
    this.players.forEach((p) => {
      if (p.stats.votesCastAgainstKiller > 0) {
        const score = p.stats.votesCastAgainstKiller * 2 + (p.isAlive ? 1 : 0);
        if (score > maxDetectiveScore) {
          maxDetectiveScore = score;
          bestDetective = { name: p.name, score };
        }
      }
    });

    // Most Voted
    let mostVoted: { name: string; count: number } | undefined;
    let maxVotedCount = -1;
    this.players.forEach((p) => {
      if (p.stats.votesReceived > maxVotedCount) {
        maxVotedCount = p.stats.votesReceived;
        mostVoted = { name: p.name, count: p.stats.votesReceived };
      }
    });

    const answers =
      this.phase === 'ROUND_REVEAL' || this.phase === 'DISCUSSION' || this.phase === 'VOTING'
        ? Array.from(this.players.values())
            .filter((p) => p.currentAnswer)
            .map((p) => ({
              playerId: p.id,
              playerName: p.name,
              avatar: p.avatar,
              answer: p.currentAnswer || '',
            }))
        : undefined;

    return {
      roomCode: this.code,
      phase: this.phase,
      round: this.round,
      maxRounds: this.maxRounds,
      timerSeconds: this.timerSeconds,
      timerMax: this.timerMax,
      players: playerList,
      lastStabLocation: night ? undefined : this.lastStabLocation || undefined,
      currentQuestion: this.currentQuestion
        ? {
            id: this.currentQuestion.id,
            categoryLabel: this.currentQuestion.categoryLabel,
            context: this.currentQuestion.context,
            question: this.currentQuestion.question,
            options: this.currentQuestion.options,
          }
        : undefined,
      answers,
      currentEvent: this.currentEvent || undefined,
      clues: [], // Clues are now private to the Detective
      activeVotesCount: this.activeVotesCount,
      voteRevealStep: this.voteRevealStep,
      revealedVotes: this.revealedVotes.slice(0, this.voteRevealStep),
      eliminatedPlayerId: this.eliminatedPlayer?.id,
      eliminatedPlayer: this.eliminatedPlayer || undefined,
      nightVictim: night ? undefined : this.nightVictim || undefined,
      nightCrimeRoomId: night ? undefined : this.nightCrimeRoomId || undefined,
      nightCrimeRoomName: night ? undefined : this.nightCrimeRoomName || undefined,
      nightClue: this.nightClue || undefined,
      forensicEvidence: this.forensicEvidence || undefined,
      winner: this.winner || undefined,
      gameOverReason: this.gameOverReason || undefined,
      gameOverMessage: this.gameOverMessage || undefined,
      detectiveAccusation: undefined,
      nightKillHappened: night ? undefined : this.nightKillHappened,
      killerEscapedToRoomId: undefined,
      killerPlayer:
        this.phase === 'GAME_OVER' && killer
          ? {
              id: killer.id,
              name: killer.name,
              avatar: killer.avatar,
            }
          : undefined,
      endGameStats:
        this.phase === 'GAME_OVER'
          ? {
              bestDetective,
              mostVoted,
              bestLiar: killer
                ? {
                    name: killer.name,
                    title: killer.isAlive ? 'Enganou todos com maestria' : 'Resistiu bravamente',
                  }
                : undefined,
              mostSuspicious: mostVoted ? { name: mostVoted.name, reasons: 'Atraiu votos em múltiplos turnos' } : undefined,
            }
          : undefined,
    };
  }

  public broadcastState() {
    const state = this.getPublicState();
    const msg: ServerMessage = { type: 'STATE_UPDATE', state };
    const payload = JSON.stringify(msg);

    // Send to Host
    if (this.hostSocket && this.hostSocket.readyState === WebSocket.OPEN) {
      this.hostSocket.send(payload);
    }

    // Send to all player sockets
    this.playerSockets.forEach((ws, id) => {
      if (ws.readyState === WebSocket.OPEN && ws.bufferedAmount < 128 * 1024) {
        ws.send(JSON.stringify({ type: 'STATE_UPDATE', state: this.getPublicState(id) }));
      }
    });
  }

  public getPrivateData(playerId: string, overrides: Partial<PrivatePlayerData> = {}): PrivatePlayerData | null {
    const player = this.players.get(playerId);
    if (!player) return null;

    return {
      player,
      roomCode: this.code,
      phase: this.phase,
      killerHint: player.role === 'ASSASSINO' ? (this.currentQuestion?.killerHint || 'Aja em silêncio. A noite é sua aliada.') : undefined,
      isNightVictim: this.nightVictimId === player.id,
      detectiveInvestigationResult: this.investigationResults.get(player.id),
      nightActionSubmitted: !!this.nightVictimId && player.role === 'ASSASSINO',
      nightTargetId: player.role === 'ASSASSINO' ? (this.nightVictimId || undefined) : undefined,
      hasUsedAbility: player.hasUsedAbility,
      canUseAbility:
        !player.hasUsedAbility &&
        player.isAlive &&
        (player.role === 'ASSASSINO' || player.role === 'DETETIVE') &&
        (this.phase === 'DISCUSSION' || this.phase === 'NIGHT_KILLER' || this.phase === 'NIGHT_FALL'),
      availableSabotages: player.role === 'ASSASSINO' ? SABOTAGE_OPTIONS.filter(s => s.id === 'FALSE_CLUE') : undefined,
      detectiveClues: player.role === 'DETETIVE' ? this.clues : undefined,
      ...overrides,
    };
  }

  public sendPrivateUpdate(playerId: string, overrides: Partial<PrivatePlayerData> = {}) {
    const player = this.players.get(playerId);
    const ws = this.playerSockets.get(playerId);
    const privateData = this.getPrivateData(playerId, overrides);
    if (!privateData) return;
    if (ws && ws.readyState === WebSocket.OPEN) {
      const msg: ServerMessage = { type: 'PRIVATE_UPDATE', data: privateData };
      ws.send(JSON.stringify(msg));
    }
  }

  public broadcastPrivateUpdates() {
    this.players.forEach((p) => {
      if (!p.isBot) {
        this.sendPrivateUpdate(p.id);
      }
    });
  }

  public broadcastAudio(soundName: string) {
    const msg: ServerMessage = { type: 'AUDIO_TRIGGER', sound: soundName };
    const payload = JSON.stringify(msg);
    if (this.hostSocket && this.hostSocket.readyState === WebSocket.OPEN) {
      this.hostSocket.send(payload);
    }
    this.playerSockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
      }
    });
  }

  public sendAudioTrigger(soundName: string) {
    this.broadcastAudio(soundName);
  }

  public addBotPlayer(): Player | null {
    if (this.phase !== 'LOBBY' || this.players.size >= 5) return null;
    const existingNames = Array.from(this.players.values()).map((p) => p.name);
    const availableName = BOT_NAMES.find((n) => !existingNames.includes(n)) || `Agente ${this.players.size + 1}`;
    const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const avatar = AVATARS[this.players.size % AVATARS.length];
    return this.addPlayer(botId, availableName, avatar.id, undefined, true);
  }

  public advancePhase() {
    if (this.phase === 'ROLE_REVEAL') {
      this.startRoundFlow();
    } else if (this.phase === 'NIGHT_KILLER' || this.phase === 'NIGHT_FALL') {
      this.startDayBreak();
    } else if (this.phase === 'CRIME_SCENE') {
      this.startQuestionPhase();
    } else if (this.phase === 'ROUND_REVEAL') {
      this.clearGameTimers(); this.startDiscussionPhase();
    } else if (this.phase === 'ROUND_QUESTION') {
      this.revealAnswers();
    } else if (this.phase === 'DISCUSSION') {
      this.startVotingPhase();
    } else if (this.phase === 'VOTING') {
      this.tallyVotesAndReveal();
    }
  }

  public restartGame() {
    this.clearGameTimers(); this.movementFlush = null;
    this.investigationResults.clear(); this.lastMovement.clear();
    this.nightVictimId = null; this.nightVictim = null; this.nightCrimeRoomId = null; this.nightCrimeRoomName = null;
    this.killerPlayerId = null; this.detectivePlayerId = null;
    this.currentQuestion = null; this.currentEvent = null; this.pendingSabotage = null;
    this.activeVotesCount = 0; this.revealedVotes = []; this.voteRevealStep = 0;
    this.timerSeconds = 0;
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.phase = 'LOBBY';
    this.round = 0;
    this.clues = [];
    this.winner = null;
    this.gameOverReason = null;
    this.gameOverMessage = null;
    this.eliminatedPlayer = null;
    this.nightClue = '';
    this.forensicEvidence = null;
    this.lastStabLocation = null;
    this.nightKillHappened = false;
    this.detectiveAccusation = null;

    this.players.forEach((p) => {
      p.isAlive = true;
      p.hasRevealedRole = false;
      p.role = undefined;
      p.hasUsedAbility = false;
      p.hasConfirmedVote = false;
      p.currentAnswer = undefined;
      p.votedTargetId = undefined;
      p.currentRoomId = 'living';
      Object.assign(p, getRoomCenter('living'));
      p.stats = { votesReceived: 0, votesCastAgainstKiller: 0, correctAccusations: 0, survivedRounds: 0 };
      p.privateNotes = [];
    });
    this.broadcastState();
    this.broadcastPrivateUpdates();
  }

  public cleanup() {
    this.clearGameTimers();
    if (this.aiChatInterval) clearInterval(this.aiChatInterval);
  }
}

export class GameManager {
  private rooms: Map<string, Room> = new Map();

  constructor() {
    setInterval(() => {
      this.rooms.forEach(room => {
        const connected = room.hostSocket?.readyState === WebSocket.OPEN || [...room.playerSockets.values()].some(ws => ws.readyState === WebSocket.OPEN);
        if (!connected && Date.now() - room.lastActiveAt > 60 * 60 * 1000) this.removeRoom(room.code);
      });
    }, 5 * 60 * 1000).unref();
  }

  public createRoom(): Room {
    let code = '';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No ambiguous 0/O, 1/I
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const room = new Room(code);
    this.rooms.set(code, room);
    return room;
  }

  public getRoom(code: string): Room | undefined {
    const room = this.rooms.get(code.toUpperCase());
    if (room) room.lastActiveAt = Date.now();
    return room;
  }

  public removeRoom(code: string) {
    const room = this.rooms.get(code);
    if (room) {
      room.cleanup();
      this.rooms.delete(code);
    }
  }
}

export const gameManager = new GameManager();
