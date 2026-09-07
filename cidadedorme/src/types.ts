export type Role = 'ASSASSINO' | 'INOCENTE';

export type GamePhase =
  | 'LOBBY'
  | 'INTRO'
  | 'ROLE_REVEAL'
  | 'NIGHT_KILLER'
  | 'NIGHT_FALL'
  | 'DAY_BREAK'
  | 'CRIME_SCENE'
  | 'ROUND_EVENT'
  | 'ROUND_QUESTION'
  | 'ROUND_REVEAL'
  | 'DISCUSSION'
  | 'VOTING'
  | 'VOTE_REVEAL'
  | 'VERDICT'
  | 'GAME_OVER';

export type MansionRoomId = 'bedroom' | 'kitchen' | 'living' | 'garden' | 'library' | 'basement';

export interface MansionRoom {
  id: MansionRoomId;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export interface PlayerAvatar {
  id: string;
  name: string;
  emoji: string;
  color: string;
  bgGradient: string;
}

export interface Player {
  id: string;
  name: string;
  avatar: PlayerAvatar;
  isHost?: boolean;
  isBot?: boolean;
  role?: Role;
  isAlive: boolean;
  hasRevealedRole: boolean;
  connected: boolean;
  currentRoomId?: MansionRoomId;
  x?: number;
  y?: number;
  isMoving?: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
  currentAnswer?: string;
  answerTimestamp?: number;
  votedTargetId?: string;
  hasConfirmedVote: boolean;
  // Abilities
  hasUsedAbility: boolean;
  privateNotes: string[];
  stats: {
    votesReceived: number;
    votesCastAgainstKiller: number;
    correctAccusations: number;
    survivedRounds: number;
  };
}

export interface QuestionScenario {
  id: string;
  category: 'alibi' | 'social' | 'memory' | 'dilemma' | 'accusation';
  categoryLabel: string;
  context: string;
  question: string;
  options: string[];
  killerHint?: string; // Private tip for the killer
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  flavorText: string;
  type: 'blackout' | 'clue' | 'interrogation' | 'anonymous_tip' | 'sabotage_alert' | 'polygraph' | 'wiretap';
  targetPlayerId?: string;
  revealedData?: any;
}

export interface Clue {
  id: string;
  round: number;
  text: string;
  type: 'timing' | 'location' | 'behavior' | 'system' | 'forensic';
  details?: string;
  evidenceCategory?: 'footprint' | 'blood' | 'object' | 'alibi' | 'thermal';
}

export interface ForensicEvidence {
  crimeRoomId: MansionRoomId;
  crimeRoomName: string;
  victimName: string;
  killerEscapeRoomId?: MansionRoomId;
  killerEscapeRoomName?: string;
  weaponTrace: string;
  physicalEvidence: string;
  escapeRouteClue: string;
  acousticReport: string;
  sensorAlert?: string;
  trailPoints?: { x: number; y: number }[];
}

export interface SabotageAction {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface PublicPlayer {
  id: string;
  name: string;
  avatar: PlayerAvatar;
  isBot?: boolean;
  isAlive: boolean;
  hasRevealedRole: boolean;
  connected: boolean;
  hasAnswered: boolean;
  hasVoted: boolean;
  eliminatedRole?: Role; // Only set when eliminated
  currentRoomId?: MansionRoomId;
  x?: number;
  y?: number;
  isMoving?: boolean;
  direction?: 'left' | 'right' | 'up' | 'down';
}

export interface PublicGameState {
  roomCode: string;
  phase: GamePhase;
  round: number;
  maxRounds: number;
  timerSeconds: number;
  timerMax: number;
  players: PublicPlayer[];
  lastStabLocation?: {
    x: number;
    y: number;
    victimId: string;
    victimName: string;
    roomId?: MansionRoomId;
    timestamp: number;
  };
  currentQuestion?: {
    id: string;
    categoryLabel: string;
    context: string;
    question: string;
    options: string[];
  };
  answers?: {
    playerId: string;
    playerName: string;
    avatar: PlayerAvatar;
    answer: string;
  }[];
  currentEvent?: GameEvent;
  clues: Clue[];
  activeVotesCount: number;
  voteRevealStep: number; // For step-by-step reveal animation
  revealedVotes: {
    voterName: string;
    targetId: string;
    targetName: string;
  }[];
  eliminatedPlayerId?: string;
  eliminatedPlayer?: {
    id: string;
    name: string;
    avatar: PlayerAvatar;
    role: Role;
  };
  nightVictim?: {
    id: string;
    name: string;
    avatar: PlayerAvatar;
  };
  nightCrimeRoomId?: MansionRoomId;
  nightCrimeRoomName?: string;
  nightClue?: string;
  forensicEvidence?: ForensicEvidence;
  winner?: 'INVESTIGADORES' | 'ASSASSINO';
  killerPlayer?: {
    id: string;
    name: string;
    avatar: PlayerAvatar;
  };
  endGameStats?: {
    bestDetective?: { name: string; score: number };
    mostVoted?: { name: string; count: number };
    bestLiar?: { name: string; title: string };
    mostSuspicious?: { name: string; reasons: string };
  };
}

export interface PrivatePlayerData {
  player: Player;
  roomCode: string;
  phase: GamePhase;
  killerHint?: string;
  isNightVictim?: boolean;
  nightActionSubmitted?: boolean;
  nightTargetId?: string;
  detectiveInvestigationResult?: {
    targetName: string;
    resultText: string;
    isKiller: boolean;
  };
  hasUsedAbility: boolean;
  canUseAbility: boolean;
  availableSabotages?: SabotageAction[];
  receivedAnonymousMessage?: string;
}

// WebSocket message protocols
export type ClientMessage =
  | { type: 'HOST_CREATE_ROOM' }
  | { type: 'PLAYER_JOIN_ROOM'; roomCode: string; name: string; avatarId: string; playerId?: string }
  | { type: 'HOST_START_GAME' }
  | { type: 'PLAYER_ROLE_REVEALED' }
  | { type: 'PLAYER_SELECT_ROOM'; roomId: MansionRoomId }
  | { type: 'PLAYER_MOVE'; x: number; y: number; roomId?: MansionRoomId }
  | { type: 'PLAYER_NIGHT_KILL'; targetPlayerId: string; crimeRoomId?: MansionRoomId; x?: number; y?: number }
  | { type: 'PLAYER_NIGHT_INVESTIGATE'; targetPlayerId: string }
  | { type: 'PLAYER_SUBMIT_ANSWER'; answer: string }
  | { type: 'PLAYER_SUBMIT_VOTE'; targetPlayerId: string }
  | { type: 'PLAYER_CONFIRM_VOTE' }
  | { type: 'PLAYER_USE_DETECTIVE'; targetPlayerId: string }
  | { type: 'PLAYER_USE_SABOTAGE'; sabotageId: string }
  | { type: 'HOST_ADVANCE_PHASE' }
  | { type: 'HOST_RESTART_GAME' }
  | { type: 'HOST_ADD_BOT' }
  | { type: 'HOST_REMOVE_PLAYER'; playerId: string }
  | { type: 'RECONNECT_SESSION'; roomCode: string; playerId: string };

export type ServerMessage =
  | { type: 'ROOM_CREATED'; roomCode: string; hostId: string }
  | { type: 'ROOM_JOINED'; playerId: string; roomCode: string; player: Player }
  | { type: 'JOIN_ERROR'; message: string }
  | { type: 'STATE_UPDATE'; state: PublicGameState }
  | { type: 'PRIVATE_UPDATE'; data: PrivatePlayerData }
  | { type: 'AUDIO_TRIGGER'; sound: string }
  | { type: 'ANNOUNCEMENT'; text: string };
