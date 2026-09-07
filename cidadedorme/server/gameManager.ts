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
} from '../src/types';
import { AVATARS, QUESTIONS_DATABASE, RANDOM_EVENTS_POOL, SABOTAGE_OPTIONS } from '../src/data/content';
import { MANSION_ROOMS, getMansionRoom } from '../src/data/mansion';

const BOT_NAMES = ['Eduardo', 'Marianne', 'Lucas', 'Pedro', 'Beatriz', 'Rafael'];

export class Room {
  public code: string;
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
  public pendingSabotage: string | null = null;
  public nightVictimId: string | null = null;
  public nightVictim: { id: string; name: string; avatar: any } | null = null;
  public nightCrimeRoomId: MansionRoomId | null = null;
  public nightCrimeRoomName: string | null = null;
  public nightClue: string = '';

  constructor(code: string) {
    this.code = code;
  }

  public addPlayer(id: string, name: string, avatarId: string, socket?: WebSocket, isBot: boolean = false): Player {
    const avatar = AVATARS.find((a) => a.id === avatarId) || AVATARS[this.players.size % AVATARS.length];
    const defaultRoom = MANSION_ROOMS[this.players.size % MANSION_ROOMS.length].id;
    const player: Player = {
      id,
      name,
      avatar,
      isBot,
      isAlive: true,
      hasRevealedRole: false,
      connected: true,
      currentRoomId: defaultRoom,
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
    if (!player || !player.isAlive) return;
    player.currentRoomId = roomId;
    this.broadcastState();
    this.sendPrivateUpdate(playerId);
  }

  public removePlayer(playerId: string) {
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
    if (playerList.length < 3) return false;

    // Reset game state
    this.round = 1;
    this.clues = [];
    this.winner = null;
    this.eliminatedPlayer = null;
    this.nightVictimId = null;
    this.nightVictim = null;
    this.nightCrimeRoomId = null;
    this.nightCrimeRoomName = null;

    // Assign roles randomly
    // 5 players: 1 Killer, 1 Detective, 3 Innocents
    // 4 players: 1 Killer, 1 Detective, 2 Innocents
    // 3 players: 1 Killer, 1 Detective, 1 Innocent
    const shuffled = [...playerList].sort(() => Math.random() - 0.5);
    const killer = shuffled[0];
    const detective = shuffled[1];

    killer.role = 'ASSASSINO';
    this.killerPlayerId = killer.id;

    detective.role = 'DETETIVE';

    for (let i = 2; i < shuffled.length; i++) {
      shuffled[i].role = 'INOCENTE';
    }

    // Distribute players across the mansion rooms (Among Us style layout)
    playerList.forEach((p, idx) => {
      p.isAlive = true;
      p.hasRevealedRole = false;
      p.hasUsedAbility = false;
      p.hasConfirmedVote = false;
      p.currentAnswer = undefined;
      p.votedTargetId = undefined;
      p.privateNotes = [];
      p.currentRoomId = MANSION_ROOMS[idx % MANSION_ROOMS.length].id;
    });

    this.phase = 'INTRO';
    this.broadcastState();
    this.broadcastPrivateUpdates();

    // Cinematic Intro sequence: automatically transitions to ROLE_REVEAL after 5 seconds
    setTimeout(() => {
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
            setTimeout(() => {
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

      setTimeout(() => {
        if (this.phase === 'ROLE_REVEAL') {
          this.startRoundFlow();
        }
      }, 2500);
    }
  }

  public startRoundFlow() {
    this.startNightKillerPhase();
  }

  // Turn 1: Assassin wakes up (with knife & room selection)
  // Detective and Innocents SLEEP (eyes closed)
  public startNightKillerPhase() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.phase = 'NIGHT_KILLER';
    // Generous 30 seconds for the killer to plan and strike
    this.timerSeconds = 30;
    this.timerMax = 30;
    this.nightVictimId = null;
    this.nightVictim = null;
    this.nightCrimeRoomId = null;
    this.nightCrimeRoomName = null;

    // Reset night choices and votes
    this.players.forEach((p) => {
      p.votedTargetId = undefined;
      p.hasConfirmedVote = false;
    });

    this.broadcastState();
    this.broadcastPrivateUpdates();
    this.broadcastAudio('playNightFall');

    // If killer is a bot, pick a random victim after 7-12 seconds
    const killer = this.players.get(this.killerPlayerId || '');
    if (killer && killer.isBot && killer.isAlive) {
      setTimeout(() => {
        if (this.phase === 'NIGHT_KILLER') {
          const aliveTargets = this.getAlivePlayers().filter((p) => p.id !== killer.id);
          if (aliveTargets.length > 0) {
            const chosen = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
            const chosenRoom = chosen.currentRoomId || MANSION_ROOMS[Math.floor(Math.random() * MANSION_ROOMS.length)].id;
            this.setNightKill(killer.id, chosen.id, chosenRoom);
          }
        }
      }, 7000 + Math.random() * 5000);
    }

    // 30-second timer for killer turn -> then detective wakes up
    this.startTimer(30, () => {
      this.startNightDetectivePhase();
    });
  }

  // Legacy fallback if needed
  public startNightFall() {
    this.startNightKillerPhase();
  }

  public setNightKill(killerId: string, targetPlayerId: string, crimeRoomId?: MansionRoomId) {
    if (this.phase !== 'NIGHT_KILLER' && this.phase !== 'NIGHT_FALL') return;
    if (killerId !== this.killerPlayerId) return;

    const target = this.players.get(targetPlayerId);
    if (!target || !target.isAlive || target.id === killerId) return;

    this.nightVictimId = target.id;
    this.nightCrimeRoomId = crimeRoomId || target.currentRoomId || 'kitchen';
    this.nightCrimeRoomName = getMansionRoom(this.nightCrimeRoomId).name;

    // Play knife slash sound and trigger private update
    this.broadcastAudio('playKnifeSlash');
    this.broadcastPrivateUpdates();

    // 3.5s delay to let the killer savor the stealth moment and return to bed
    setTimeout(() => {
      if (this.phase === 'NIGHT_KILLER' || this.phase === 'NIGHT_FALL') {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.startNightDetectivePhase();
      }
    }, 3500);
  }

  // Turn 2: Detective wakes up to investigate
  // Assassin and Innocents SLEEP (eyes closed)
  public startNightDetectivePhase() {
    if (this.timerInterval) clearInterval(this.timerInterval);

    const detective = Array.from(this.players.values()).find(
      (p) => p.role === 'DETETIVE' && p.isAlive
    );

    // If detective is alive, start detective investigation turn!
    if (detective) {
      this.phase = 'NIGHT_DETECTIVE';
      this.timerSeconds = 25;
      this.timerMax = 25;

      this.broadcastState();
      this.broadcastPrivateUpdates();

      // If detective is a bot, pick a random suspect after 5-8s
      if (detective.isBot) {
        setTimeout(() => {
          if (this.phase === 'NIGHT_DETECTIVE') {
            const suspects = this.getAlivePlayers().filter((p) => p.id !== detective.id);
            if (suspects.length > 0) {
              const target = suspects[Math.floor(Math.random() * suspects.length)];
              this.useDetectiveAbility(detective.id, target.id);
            }
          }
        }, 5000 + Math.random() * 3000);
      }

      this.startTimer(25, () => {
        this.startDayBreak();
      });
    } else {
      // Detective is already eliminated or not playing, advance straight to day break
      this.startDayBreak();
    }
  }

  public startDayBreak() {
    if (this.timerInterval) clearInterval(this.timerInterval);
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

        const roomName = this.nightCrimeRoomName || 'Cozinha da Mansão';
        const crimeRoom = getMansionRoom(this.nightCrimeRoomId || 'kitchen');

        // Generate contextual night clue linking to the mansion room
        const clueOptions = [
          `Cena do Crime no(a) ${roomName}: O corpo de ${victim.name} foi encontrado com ferimentos de faca.`,
          `Pista na cena (${roomName}): Uma faca suja e uma pegada apressada foram deixadas no chão.`,
          killer
            ? `Pista na cena: Testemunhas ouviram passos rápidos saindo do(a) ${roomName} rumo ao quarto de alguém com a inicial "${killer.name.charAt(0).toUpperCase()}".`
            : `Pista na cena: Uma sombra misteriosa fugiu em silêncio pela porta lateral.`,
          `Pista de álibi: Apenas quem estava em cômodos próximos ao(à) ${roomName} ouviu o barulho.`,
        ];

        this.nightClue = clueOptions[Math.floor(Math.random() * clueOptions.length)];
        this.clues.push({
          id: `night-clue-${Date.now()}`,
          round: this.round,
          type: 'location',
          text: this.nightClue,
        });
      }
    } else {
      this.nightVictim = null;
      this.nightClue = 'Ninguém foi morto nesta noite... A cidade dormiu em paz!';
    }

    this.broadcastState();
    this.broadcastPrivateUpdates();
    this.broadcastAudio('playKillStab');

    // Check if Killer already won (e.g. only 1 innocent left)
    const alivePlayers = this.getAlivePlayers();
    const aliveKiller = alivePlayers.find((p) => p.role === 'ASSASSINO');
    const aliveInnocents = alivePlayers.filter((p) => p.role !== 'ASSASSINO');

    if (!aliveKiller) {
      this.winner = 'INVESTIGADORES';
      this.phase = 'GAME_OVER';
      this.broadcastState();
      return;
    }

    if (aliveInnocents.length <= 1) {
      this.winner = 'ASSASSINO';
      this.phase = 'GAME_OVER';
      this.broadcastState();
      return;
    }

    // After 12s of crime scene and mansion map reveal, transition to Discussion
    this.startTimer(12, () => {
      this.startDiscussionPhase();
    });
  }

  public startQuestionPhase() {
    // Select question
    const qIndex = (this.round - 1 + Math.floor(Math.random() * 4)) % QUESTIONS_DATABASE.length;
    this.currentQuestion = QUESTIONS_DATABASE[qIndex];

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
        setTimeout(() => {
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

    player.currentAnswer = answer;
    player.answerTimestamp = Date.now();

    this.broadcastState();

    // Check if all alive players answered
    const alivePlayers = this.getAlivePlayers();
    const allAnswered = alivePlayers.every((p) => p.currentAnswer !== undefined);
    if (allAnswered) {
      if (this.timerInterval) clearInterval(this.timerInterval);
      setTimeout(() => {
        this.revealAnswers();
      }, 1000);
    }
  }

  public revealAnswers() {
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
    setTimeout(() => {
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
    this.generateRoundClue();

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

    // Clue 3: Avatar trait
    clueTemplates.push({
      id: `clue-${Date.now()}-3`,
      round: this.round,
      type: 'system',
      text: `O codinome do assassino contém a letra "${killer.name.charAt(0).toUpperCase()}".`,
    });

    const chosenClue = clueTemplates[Math.floor(Math.random() * clueTemplates.length)];
    if (chosenClue && !this.clues.some((c) => c.text === chosenClue.text)) {
      this.clues.push(chosenClue);
    }
  }

  public startVotingPhase() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.phase = 'VOTING';
    // 55 seconds so players have ample time to discuss and confirm their votes
    this.timerSeconds = 55;
    this.timerMax = 55;
    this.activeVotesCount = 0;

    this.players.forEach((p) => {
      p.votedTargetId = undefined;
      p.hasConfirmedVote = false;
    });

    this.broadcastState();
    this.broadcastPrivateUpdates();

    this.startTimer(55, () => {
      this.tallyVotesAndReveal();
    });

    // Simulate bot votes
    this.players.forEach((p) => {
      if (p.isBot && p.isAlive) {
        const delay = 4000 + Math.random() * 12000;
        setTimeout(() => {
          if (this.phase === 'VOTING' && !p.hasConfirmedVote) {
            const aliveTargets = this.getAlivePlayers().filter((target) => target.id !== p.id);
            if (aliveTargets.length > 0) {
              const chosen = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
              this.submitVote(p.id, chosen.id, true);
            }
          }
        }, delay);
      }
    });
  }

  public submitVote(voterId: string, targetId: string, confirmImmediately: boolean = false) {
    const voter = this.players.get(voterId);
    if (!voter || !voter.isAlive || this.phase !== 'VOTING') return;

    voter.votedTargetId = targetId;
    if (confirmImmediately) {
      voter.hasConfirmedVote = true;
    }

    const confirmedCount = this.getAlivePlayers().filter((p) => p.hasConfirmedVote).length;
    this.activeVotesCount = confirmedCount;

    this.broadcastState();
    this.sendPrivateUpdate(voterId);

    // Check if everyone voted
    const alivePlayers = this.getAlivePlayers();
    if (alivePlayers.every((p) => p.hasConfirmedVote)) {
      if (this.timerInterval) clearInterval(this.timerInterval);
      setTimeout(() => {
        this.tallyVotesAndReveal();
      }, 1000);
    }
  }

  public confirmVote(voterId: string) {
    const voter = this.players.get(voterId);
    if (!voter || !voter.isAlive || this.phase !== 'VOTING') return;

    voter.hasConfirmedVote = true;
    this.activeVotesCount = this.getAlivePlayers().filter((p) => p.hasConfirmedVote).length;
    this.broadcastState();
    this.sendPrivateUpdate(voterId);

    const alivePlayers = this.getAlivePlayers();
    if (alivePlayers.every((p) => p.hasConfirmedVote)) {
      if (this.timerInterval) clearInterval(this.timerInterval);
      setTimeout(() => {
        this.tallyVotesAndReveal();
      }, 1000);
    }
  }

  public tallyVotesAndReveal() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.phase = 'VOTE_REVEAL';

    const votesList: { voterName: string; targetId: string; targetName: string }[] = [];
    const tally: Record<string, number> = {};

    this.getAlivePlayers().forEach((p) => {
      const targetId = p.votedTargetId;
      if (targetId) {
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
    const interval = setInterval(() => {
      this.voteRevealStep++;
      this.broadcastState();
      this.sendAudioTrigger('VOTE_REVEAL');

      if (this.voteRevealStep >= votesList.length) {
        clearInterval(interval);
        // After votes revealed, determine most voted player
        setTimeout(() => {
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
    setTimeout(() => {
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
    if (this.round >= this.maxRounds || aliveInnocents.length <= 1) {
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
    this.phase = 'GAME_OVER';
    this.winner = winner;

    this.broadcastState();
    this.broadcastPrivateUpdates();
  }

  // Abilities
  public useDetectiveAbility(detectiveId: string, targetId: string) {
    const detective = this.players.get(detectiveId);
    const target = this.players.get(targetId);
    if (!detective || detective.role !== 'DETETIVE' || detective.hasUsedAbility || !target) return;

    detective.hasUsedAbility = true;
    const isKiller = target.role === 'ASSASSINO';

    let resultText = '';
    if (isKiller) {
      resultText = `Há fortes indícios e rastros suspeitos conectando ${target.name} ao crime!`;
    } else {
      resultText = `Investigação concluída: ${target.name} NÃO é o assassino.`;
    }

    detective.privateNotes.push(resultText);
    this.sendPrivateUpdate(detectiveId, {
      detectiveInvestigationResult: {
        targetName: target.name,
        resultText,
        isKiller,
      },
    });

    // If used during NIGHT_DETECTIVE, give detective 4s to read report, then transition to DAY_BREAK!
    if (this.phase === 'NIGHT_DETECTIVE') {
      setTimeout(() => {
        if (this.phase === 'NIGHT_DETECTIVE') {
          if (this.timerInterval) clearInterval(this.timerInterval);
          this.startDayBreak();
        }
      }, 4000);
    }
  }

  public useKillerSabotage(killerId: string, sabotageId: string) {
    const killer = this.players.get(killerId);
    if (!killer || killer.role !== 'ASSASSINO' || killer.hasUsedAbility) return;

    killer.hasUsedAbility = true;
    this.pendingSabotage = sabotageId;

    if (sabotageId === 'FALSE_CLUE') {
      const innocents = this.getAlivePlayers().filter((p) => p.role !== 'ASSASSINO');
      if (innocents.length > 0) {
        const rand = innocents[Math.floor(Math.random() * innocents.length)];
        this.clues.push({
          id: `sabotage-${Date.now()}`,
          round: this.round,
          type: 'behavior',
          text: `[ALERTA ANÔNIMO]: Há rumores de que ${rand.name} estava manipulando as evidências.`,
        });
        this.broadcastState();
      }
    } else if (sabotageId === 'BLACKOUT') {
      this.currentEvent = {
        id: 'sabotage_blackout',
        title: 'SABOTAGEM NO CIRCUITO',
        flavorText: 'O assassino provocou um curto circuito manual!',
        description: 'Luzes piscando e tensão no ar.',
        type: 'blackout',
      };
      this.broadcastState();
    }

    this.sendPrivateUpdate(killerId);
  }

  private startTimer(duration: number, onComplete: () => void) {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerSeconds = duration;
    this.timerMax = duration;

    this.timerInterval = setInterval(() => {
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

  public getPublicState(): PublicGameState {
    const playerList = Array.from(this.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isBot: p.isBot,
      isAlive: p.isAlive,
      hasRevealedRole: p.hasRevealedRole,
      connected: p.connected,
      currentRoomId: p.currentRoomId,
      hasAnswered: p.currentAnswer !== undefined,
      hasVoted: p.hasConfirmedVote,
      eliminatedRole: !p.isAlive ? p.role : undefined,
    }));

    const killer = this.players.get(this.killerPlayerId || '');

    // Best Detective
    let bestDetective: { name: string; score: number } | undefined;
    let maxDetectiveScore = -1;
    this.players.forEach((p) => {
      if (p.role === 'DETETIVE' || p.stats.votesCastAgainstKiller > 0) {
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
      clues: this.clues,
      activeVotesCount: this.activeVotesCount,
      voteRevealStep: this.voteRevealStep,
      revealedVotes: this.revealedVotes,
      eliminatedPlayerId: this.eliminatedPlayer?.id,
      eliminatedPlayer: this.eliminatedPlayer || undefined,
      nightVictim: this.nightVictim || undefined,
      nightCrimeRoomId: this.nightCrimeRoomId || undefined,
      nightCrimeRoomName: this.nightCrimeRoomName || undefined,
      nightClue: this.nightClue || undefined,
      winner: this.winner || undefined,
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
    this.playerSockets.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
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
      isNightVictim: !player.isAlive && this.nightVictim?.id === player.id,
      nightActionSubmitted: !!this.nightVictimId && player.role === 'ASSASSINO',
      nightTargetId: player.role === 'ASSASSINO' ? (this.nightVictimId || undefined) : undefined,
      hasUsedAbility: player.hasUsedAbility,
      canUseAbility:
        !player.hasUsedAbility &&
        player.isAlive &&
        (player.role === 'DETETIVE' || player.role === 'ASSASSINO') &&
        (this.phase === 'DISCUSSION' || this.phase === 'NIGHT_KILLER' || this.phase === 'NIGHT_DETECTIVE' || this.phase === 'NIGHT_FALL'),
      availableSabotages: player.role === 'ASSASSINO' ? SABOTAGE_OPTIONS : undefined,
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
    if (this.players.size >= 5) return null;
    const existingNames = Array.from(this.players.values()).map((p) => p.name);
    const availableName = BOT_NAMES.find((n) => !existingNames.includes(n)) || `Agente ${this.players.size + 1}`;
    const botId = `bot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const avatar = AVATARS[this.players.size % AVATARS.length];
    return this.addPlayer(botId, availableName, avatar.id, undefined, true);
  }

  public advancePhase() {
    if (this.phase === 'ROLE_REVEAL') {
      this.startRoundFlow();
    } else if (this.phase === 'NIGHT_KILLER') {
      this.startNightDetectivePhase();
    } else if (this.phase === 'NIGHT_DETECTIVE') {
      this.startDayBreak();
    } else if (this.phase === 'ROUND_QUESTION') {
      this.revealAnswers();
    } else if (this.phase === 'DISCUSSION') {
      this.startVotingPhase();
    } else if (this.phase === 'VOTING') {
      this.tallyVotesAndReveal();
    }
  }

  public restartGame() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    this.phase = 'LOBBY';
    this.round = 0;
    this.clues = [];
    this.winner = null;
    this.eliminatedPlayer = null;
    this.players.forEach((p) => {
      p.isAlive = true;
      p.hasRevealedRole = false;
      p.role = undefined;
      p.hasUsedAbility = false;
      p.hasConfirmedVote = false;
      p.currentAnswer = undefined;
      p.votedTargetId = undefined;
    });
    this.broadcastState();
    this.broadcastPrivateUpdates();
  }

  public cleanup() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }
}

export class GameManager {
  private rooms: Map<string, Room> = new Map();

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
    return this.rooms.get(code.toUpperCase());
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
