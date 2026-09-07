import { useState, useEffect, useRef, useCallback } from 'react';
import {
  PublicGameState,
  PrivatePlayerData,
  ClientMessage,
  ServerMessage,
  Player,
} from '../types';
import { sound } from '../utils/audio';

export function useGameSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);
  const [publicState, setPublicState] = useState<PublicGameState | null>(null);
  const [privateData, setPrivateData] = useState<PrivatePlayerData | null>(null);
  const [roomCode, setRoomCode] = useState<string>(() => localStorage.getItem('oinfiltrado_roomCode') || '');
  const [playerId, setPlayerId] = useState<string>(() => localStorage.getItem('oinfiltrado_playerId') || '');
  const [isHost, setIsHost] = useState<boolean>(() => localStorage.getItem('oinfiltrado_isHost') === 'true');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activeRoomCodeRef = useRef<string>(roomCode);
  const activePlayerIdRef = useRef<string>(playerId);
  const isHostRef = useRef<boolean>(isHost);

  useEffect(() => {
    activeRoomCodeRef.current = roomCode;
  }, [roomCode]);

  useEffect(() => {
    activePlayerIdRef.current = playerId;
  }, [playerId]);

  useEffect(() => {
    isHostRef.current = isHost;
  }, [isHost]);

  // Connect WebSocket
  const connect = useCallback(() => {
    if (
      socketRef.current &&
      (socketRef.current.readyState === WebSocket.OPEN || socketRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setIsConnected(true);
        setErrorMessage(null);

        // Register session if active
        const curCode = activeRoomCodeRef.current;
        const curPlayer = activePlayerIdRef.current;
        const curHost = isHostRef.current;

        if (curCode) {
          ws.send(
            JSON.stringify({
              type: curHost ? 'HOST_CREATE_ROOM' : 'RECONNECT_SESSION',
              roomCode: curCode,
              playerId: curPlayer,
            })
          );
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg: ServerMessage = JSON.parse(event.data);

          switch (msg.type) {
            case 'ROOM_CREATED':
              setRoomCode(msg.roomCode);
              setIsHost(true);
              localStorage.setItem('oinfiltrado_roomCode', msg.roomCode);
              localStorage.setItem('oinfiltrado_isHost', 'true');
              break;

            case 'ROOM_JOINED':
              setPlayerId(msg.playerId);
              setRoomCode(msg.roomCode);
              setIsHost(false);
              localStorage.setItem('oinfiltrado_roomCode', msg.roomCode);
              localStorage.setItem('oinfiltrado_playerId', msg.playerId);
              localStorage.setItem('oinfiltrado_isHost', 'false');
              break;

            case 'JOIN_ERROR':
              setErrorMessage(msg.message);
              break;

            case 'STATE_UPDATE':
              setPublicState(msg.state);
              setRoomCode(msg.state.roomCode);
              break;

            case 'PRIVATE_UPDATE':
              setPrivateData(msg.data);
              if (msg.data.isNightVictim) {
                sound.triggerVictimDeathVibrate();
              }
              break;

            case 'AUDIO_TRIGGER':
              if (msg.sound === 'VOTE_REVEAL') {
                sound.playVoteReveal();
              } else if (msg.sound === 'playNightFall') {
                sound.playNightFall();
              } else if (msg.sound === 'playDayBreak') {
                sound.playDayBreak();
                sound.triggerMorningVibrate();
              } else if (msg.sound === 'playKillStab') {
                sound.playKillStab();
              } else if (msg.sound === 'playKnifeSlash') {
                sound.playKnifeSlash();
                sound.triggerVictimDeathVibrate();
              }
              break;

            case 'ANNOUNCEMENT':
              setErrorMessage(msg.text);
              setTimeout(() => setErrorMessage(null), 4000);
              break;
          }
        } catch (err) {
          console.error('Socket message parse error:', err);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        // Auto-reconnect after 2 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 2000);
      };

      ws.onerror = () => {
        // Silently close and let auto-reconnect or HTTP polling handle state
        try {
          ws.close();
        } catch {
          // ignore
        }
      };

      socketRef.current = ws;
    } catch (e) {
      console.warn('WebSocket init error:', e);
    }
  }, []);

  useEffect(() => {
    connect();

    // Check if initial room from localStorage is still active on server
    const savedCode = localStorage.getItem('oinfiltrado_roomCode');
    if (savedCode) {
      fetch(`/api/rooms/${savedCode}/state`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Room expired');
        })
        .then((data) => {
          if (data.state) {
            setPublicState(data.state);
            setRoomCode(savedCode);
          }
        })
        .catch(() => {
          // Clear dead room so user can create fresh one
          localStorage.removeItem('oinfiltrado_roomCode');
          localStorage.removeItem('oinfiltrado_playerId');
          localStorage.removeItem('oinfiltrado_isHost');
          setRoomCode('');
          setPlayerId('');
          setIsHost(false);
          setPublicState(null);
        });
    }

    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (socketRef.current) socketRef.current.close();
    };
  }, [connect]);

  // Send over WebSocket if available
  const sendWs = (msg: any) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(msg));
    }
  };

  // HTTP Action Dispatcher (dual-write with WS for 100% resilience on slow 3 Mbps Wi-Fi)
  const dispatchAction = async (action: string, payload: any = {}) => {
    const code = activeRoomCodeRef.current;
    const curPlayerId = activePlayerIdRef.current;

    // Send via WebSocket first
    const wsMap: Record<string, string> = {
      START_GAME: 'HOST_START_GAME',
      ADVANCE_PHASE: 'HOST_ADVANCE_PHASE',
      RESTART_GAME: 'HOST_RESTART_GAME',
      ADD_BOT: 'HOST_ADD_BOT',
      REMOVE_PLAYER: 'HOST_REMOVE_PLAYER',
      ROLE_REVEALED: 'PLAYER_ROLE_REVEALED',
      SUBMIT_ANSWER: 'PLAYER_SUBMIT_ANSWER',
      SUBMIT_VOTE: 'PLAYER_SUBMIT_VOTE',
      CONFIRM_VOTE: 'PLAYER_CONFIRM_VOTE',
      USE_DETECTIVE: 'PLAYER_USE_DETECTIVE',
      USE_SABOTAGE: 'PLAYER_USE_SABOTAGE',
      NIGHT_KILL: 'PLAYER_NIGHT_KILL',
      NIGHT_INVESTIGATE: 'PLAYER_NIGHT_INVESTIGATE',
    };

    const wsType = wsMap[action];
    if (wsType) {
      sendWs({
        type: wsType,
        roomCode: code,
        playerId: curPlayerId,
        ...payload,
      });
    }

    // Also send via REST API for instant fallback
    if (code) {
      try {
        const res = await fetch(`/api/rooms/${code}/action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action,
            playerId: curPlayerId,
            ...payload,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.state) {
            setPublicState(data.state);
          }
          if (data.privateData) {
            setPrivateData(data.privateData);
          }
        }
      } catch (err) {
        console.warn('Action HTTP dispatch error:', err);
      }
    }
  };

  // CREATE ROOM: Instantly via HTTP REST + WebSocket
  const createRoom = async () => {
    setIsCreatingRoom(true);
    setErrorMessage(null);
    sound.playTaDum();

    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        const data = await res.json();
        setRoomCode(data.roomCode);
        setPublicState(data.state);
        setIsHost(true);
        activeRoomCodeRef.current = data.roomCode;
        isHostRef.current = true;

        localStorage.setItem('oinfiltrado_roomCode', data.roomCode);
        localStorage.setItem('oinfiltrado_isHost', 'true');
        localStorage.removeItem('oinfiltrado_playerId');

        // Notify socket
        sendWs({
          type: 'HOST_CREATE_ROOM',
          roomCode: data.roomCode,
        });
      } else {
        setErrorMessage('Erro ao criar sala. Tente novamente.');
      }
    } catch (err) {
      console.error('Error creating room via HTTP:', err);
      // Fallback: try via WebSocket
      sendWs({ type: 'HOST_CREATE_ROOM' });
    } finally {
      setIsCreatingRoom(false);
    }
  };

  // JOIN ROOM: Instantly via HTTP REST + WebSocket (100% anonymous, no login needed)
  const joinRoom = async (code: string, name: string, avatarId: string) => {
    setErrorMessage(null);
    const cleanCode = code.toUpperCase().trim();
    const cleanName = name.trim();

    if (!cleanCode || !cleanName) return;

    try {
      const res = await fetch(`/api/rooms/${cleanCode}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          avatarId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || 'Não foi possível entrar na sala.');
        return;
      }

      setRoomCode(data.roomCode);
      setPlayerId(data.playerId);
      setPublicState(data.state);
      setPrivateData(data.privateData);
      setIsHost(false);

      activeRoomCodeRef.current = data.roomCode;
      activePlayerIdRef.current = data.playerId;
      isHostRef.current = false;

      localStorage.setItem('oinfiltrado_roomCode', data.roomCode);
      localStorage.setItem('oinfiltrado_playerId', data.playerId);
      localStorage.setItem('oinfiltrado_isHost', 'false');

      // Sync socket
      sendWs({
        type: 'PLAYER_JOIN_ROOM',
        roomCode: cleanCode,
        name: cleanName,
        avatarId,
        playerId: data.playerId,
      });
    } catch (err) {
      console.error('Error joining room via HTTP:', err);
      // Fallback: try socket
      sendWs({
        type: 'PLAYER_JOIN_ROOM',
        roomCode: cleanCode,
        name: cleanName,
        avatarId,
      });
    }
  };

  // Adaptive background polling (heartbeat / slow Wi-Fi resilience)
  useEffect(() => {
    if (!roomCode) return;

    const pollState = async () => {
      try {
        const res = await fetch(`/api/rooms/${roomCode}/state`);
        if (res.ok) {
          const data = await res.json();
          if (data.state) {
            setPublicState((prev) => {
              // Update if changed or missing
              if (!prev || JSON.stringify(prev) !== JSON.stringify(data.state)) {
                return data.state;
              }
              return prev;
            });
          }
        }

        // Also fetch private data if player
        if (playerId) {
          const pRes = await fetch(`/api/rooms/${roomCode}/private?playerId=${playerId}`);
          if (pRes.ok) {
            const pData = await pRes.json();
            if (pData.data) {
              setPrivateData(pData.data);
            }
          }
        }
      } catch {
        // Network temporary hiccup - ignore and keep local state
      }
    };

    // Poll every 1000ms if socket closed, or every 2500ms as heartbeat
    const intervalMs = isConnected ? 2500 : 1000;
    const interval = setInterval(pollState, intervalMs);

    return () => clearInterval(interval);
  }, [roomCode, playerId, isConnected]);

  const startGame = () => dispatchAction('START_GAME');
  const revealRole = () => dispatchAction('ROLE_REVEALED');
  const submitAnswer = (answer: string) => dispatchAction('SUBMIT_ANSWER', { answer });
  const submitVote = (targetPlayerId: string) => dispatchAction('SUBMIT_VOTE', { targetPlayerId });
  const confirmVote = () => dispatchAction('CONFIRM_VOTE');
  const useDetective = (targetPlayerId: string) => dispatchAction('USE_DETECTIVE', { targetPlayerId });
  const useSabotage = (sabotageId: string) => dispatchAction('USE_SABOTAGE', { sabotageId });
  const nightKill = (targetPlayerId: string, crimeRoomId?: string) =>
    dispatchAction('NIGHT_KILL', { targetPlayerId, crimeRoomId });
  const selectRoom = (roomId: string) => dispatchAction('SELECT_ROOM', { roomId });
  const nightInvestigate = (targetPlayerId: string) => dispatchAction('NIGHT_INVESTIGATE', { targetPlayerId });
  const addBot = () => dispatchAction('ADD_BOT');
  const removePlayer = (targetId: string) => dispatchAction('REMOVE_PLAYER', { targetPlayerId: targetId });
  const advancePhase = () => dispatchAction('ADVANCE_PHASE');
  const restartGame = () => dispatchAction('RESTART_GAME');

  const leaveRoom = () => {
    localStorage.removeItem('oinfiltrado_roomCode');
    localStorage.removeItem('oinfiltrado_playerId');
    localStorage.removeItem('oinfiltrado_isHost');
    setRoomCode('');
    setPlayerId('');
    setIsHost(false);
    setPublicState(null);
    setPrivateData(null);
    activeRoomCodeRef.current = '';
    activePlayerIdRef.current = '';
    isHostRef.current = false;
  };

  const myPlayer: Player | undefined =
    privateData?.player ||
    (publicState?.players.find((p) => p.id === playerId) as any);

  return {
    isConnected,
    isCreatingRoom,
    publicState,
    privateData,
    roomCode,
    playerId,
    isHost,
    myPlayer,
    errorMessage,
    createRoom,
    joinRoom,
    startGame,
    revealRole,
    submitAnswer,
    submitVote,
    confirmVote,
    useDetective,
    useSabotage,
    nightKill,
    selectRoom,
    nightInvestigate,
    addBot,
    removePlayer,
    advancePhase,
    restartGame,
    leaveRoom,
  };
}
