import { useState, useEffect, useRef, useCallback } from 'react';
import type { PublicGameState, PrivatePlayerData, Player } from '../types';
import { sound } from '../utils/audio';

type Session = { roomCode: string; playerId: string; token: string; isHost: boolean };
const emptySession: Session = { roomCode: '', playerId: '', token: '', isHost: false };
// Separate host/controller sessions, including when testing both in the same browser.
const storageKey = () => `infiltrado-v2-${new URLSearchParams(location.search).get('role') === 'player' ? 'player' : 'host'}`;
export function useGameSocket() {
  const key = useRef(storageKey());
  const [session, setSession] = useState<Session>(() => {
    try { return JSON.parse(sessionStorage.getItem(key.current) || 'null') || emptySession; } catch { return emptySession; }
  });
  const sessionRef = useRef(session);
  const [isConnected, setIsConnected] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [isJoiningRoom, setIsJoiningRoom] = useState(false);
  const [publicState, setPublicState] = useState<PublicGameState | null>(null);
  const [privateData, setPrivateData] = useState<PrivatePlayerData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const socket = useRef<WebSocket | null>(null);
  const ready = useRef(false);
  const busy = useRef(false);
  const actionQueue = useRef<Promise<unknown>>(Promise.resolve());
  const apply = useCallback((data: { state?: PublicGameState; privateData?: PrivatePlayerData | null }) => {
    if (data.state) setPublicState(data.state);
    if (data.privateData) setPrivateData(data.privateData);
  }, []);
  const save = useCallback((next: Session) => {
    sessionRef.current = next; setSession(next);
    sessionStorage.setItem(key.current, JSON.stringify(next));
  }, []);
  const attach = useCallback(() => {
    ready.current = false;
    if (socket.current?.readyState === WebSocket.OPEN && sessionRef.current.roomCode) {
      socket.current.send(JSON.stringify({ type: 'ATTACH_SESSION', ...sessionRef.current }));
    }
  }, []);
  useEffect(() => {
    let disposed = false;
    let retry: ReturnType<typeof setTimeout>;
    const connect = () => {
      if (disposed) return;
      const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`);
      socket.current = ws;
      ws.onopen = () => { if (disposed) return ws.close(); setIsConnected(true); attach(); };
      ws.onmessage = event => {
        if (disposed) return;
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'SESSION_READY': ready.current = true; setErrorMessage(null); break;
          case 'STATE_UPDATE':
            if (!sessionRef.current.isHost && sessionRef.current.playerId && !msg.state.players.some((p: { id: string }) => p.id === sessionRef.current.playerId)) {
              ready.current = false; save(emptySession); setPrivateData(null); setPublicState(null); setErrorMessage('Você saiu da lista de convidados. Entre novamente.');
            } else setPublicState(msg.state);
            break;
          case 'PRIVATE_UPDATE': setPrivateData(msg.data); break;
          case 'SESSION_EXPIRED':
            ready.current = false; save(emptySession); setPublicState(null); setPrivateData(null); setErrorMessage(msg.message); break;
          case 'JOIN_ERROR': setErrorMessage(msg.message); break;
          case 'ANNOUNCEMENT': setErrorMessage(msg.text); break;
          case 'AUDIO_TRIGGER':
            // Personal cues must never identify a role through another phone's speaker.
            if (sessionRef.current.isHost && msg.sound === 'VOTE_REVEAL') sound.playVoteReveal();
            break;
        }
      };
      ws.onclose = () => {
        if (disposed) return;
        ready.current = false; setIsConnected(false); retry = setTimeout(connect, 1500);
      };
      ws.onerror = () => ws.close();
    };
    connect();
    return () => { disposed = true; clearTimeout(retry); ready.current = false; socket.current?.close(); };
  }, [attach, save]);
  useEffect(() => {
    if (!session.roomCode) return;
    let cancelled = false;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        if (!ready.current) {
          const headers = { Authorization: `Bearer ${session.token}` };
          const res = await fetch(`/api/rooms/${session.roomCode}/state?playerId=${session.playerId}`, { headers, signal: controller.signal });
          if (res.status === 404) {
            save(emptySession); setPublicState(null); setPrivateData(null); setErrorMessage('A sala foi encerrada. Entre novamente.'); return;
          }
          if (res.ok && !cancelled && !ready.current) apply(await res.json());
          if (session.playerId) {
            const p = await fetch(`/api/rooms/${session.roomCode}/private?playerId=${session.playerId}`, { headers, signal: controller.signal });
            if (p.ok && !cancelled && !ready.current) setPrivateData((await p.json()).data);
          }
        }
      } catch { /* Keep the last state while reconnecting. */ }
      if (!cancelled) timer = setTimeout(poll, 1000);
    };
    poll();
    return () => { cancelled = true; controller.abort(); clearTimeout(timer); };
  }, [session, apply, save]);
  const dispatch = useCallback((action: string, payload: Record<string, unknown> = {}) => {
    const s = sessionRef.current;
    if (!s.roomCode) return;
    setErrorMessage(null);
    if (ready.current && socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ type: 'ACTION', action, payload }));
      return;
    }
    // Preserve order in HTTP fallback (select vote before confirm, movement before attack).
    actionQueue.current = actionQueue.current.then(async () => {
      if (sessionRef.current !== s) return;
      try {
        const res = await fetch(`/api/rooms/${s.roomCode}/action`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.token}` },
          body: JSON.stringify({ action, playerId: s.playerId, ...payload }), signal: AbortSignal.timeout(5000),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        if (sessionRef.current === s && !ready.current) apply(data);
      } catch (e) { setErrorMessage((e as Error).message || 'Sem conexão. Tente novamente.'); }
    });
  }, [apply]);
  const createRoom = async () => {
    if (busy.current) return;
    busy.current = true; setIsCreatingRoom(true); setErrorMessage(null);
    try {
      const res = await fetch('/api/rooms', { method: 'POST', signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error('Não foi possível criar a sala.');
      const data = await res.json();
      save({ roomCode: data.roomCode, token: data.hostToken, playerId: '', isHost: true });
      setPrivateData(null); apply(data); attach();
    } catch { setErrorMessage('Não foi possível criar a sala. Confira a conexão e tente novamente.'); }
    finally { busy.current = false; setIsCreatingRoom(false); }
  };
  const joinRoom = async (code: string, name: string, avatarId: string) => {
    if (busy.current) return;
    busy.current = true; setIsJoiningRoom(true); setErrorMessage(null);
    try {
      const res = await fetch(`/api/rooms/${encodeURIComponent(code.trim().toUpperCase())}/join`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, avatarId }), signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      save({ roomCode: data.roomCode, playerId: data.playerId, token: data.playerToken, isHost: false });
      apply(data); attach();
    } catch (e) { setErrorMessage((e as Error).message || 'Não foi possível entrar.'); }
    finally { busy.current = false; setIsJoiningRoom(false); }
  };
  const movePending = useRef(false);
  const movePlayer = useCallback((x: number, y: number, roomId?: string) => {
    if (ready.current) { dispatch('MOVE_PLAYER', { x, y, roomId }); return; }
    // A slow network must not build an unbounded queue of old positions.
    if (movePending.current) return;
    movePending.current = true; dispatch('MOVE_PLAYER', { x, y, roomId });
    actionQueue.current.finally(() => { movePending.current = false; });
  }, [dispatch]);
  const leaveRoom = () => {
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify({ type: 'LEAVE_SESSION' }));
    ready.current = false; save(emptySession); setPublicState(null); setPrivateData(null); setErrorMessage(null);
  };
  const mine = publicState?.players.find(p => p.id === session.playerId);
  const myPlayer: Player | undefined = privateData?.player ? { ...privateData.player, ...(mine || {}) } : undefined;
  return {
    isConnected, isCreatingRoom, isJoiningRoom, publicState, privateData, ...session, myPlayer, errorMessage,
    createRoom, joinRoom, leaveRoom, movePlayer,
    startGame: () => dispatch('START_GAME'), advancePhase: () => dispatch('ADVANCE_PHASE'), restartGame: () => dispatch('RESTART_GAME'),
    addBot: () => dispatch('ADD_BOT'), removePlayer: (targetPlayerId: string) => dispatch('REMOVE_PLAYER', { targetPlayerId }),
    revealRole: () => dispatch('ROLE_REVEALED'), selectRoom: (roomId: string) => dispatch('SELECT_ROOM', { roomId }),
    nightKill: (targetPlayerId: string, crimeRoomId?: string, x?: number, y?: number) => dispatch('NIGHT_KILL', { targetPlayerId, crimeRoomId, x, y }),
    nightInvestigate: (targetPlayerId: string) => dispatch('NIGHT_INVESTIGATE', { targetPlayerId }),
    submitAnswer: (answer: string) => dispatch('SUBMIT_ANSWER', { answer }), submitVote: (targetPlayerId: string) => dispatch('SUBMIT_VOTE', { targetPlayerId }),
    confirmVote: () => dispatch('CONFIRM_VOTE'), useDetective: (targetPlayerId: string) => dispatch('USE_DETECTIVE', { targetPlayerId }),
    useSabotage: (sabotageId: string) => dispatch('USE_SABOTAGE', { sabotageId }),
  };
}
