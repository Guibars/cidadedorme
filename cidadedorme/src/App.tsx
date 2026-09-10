import { useState, useEffect } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { TvHeader } from './components/tv/TvHeader';
import { TvHome } from './components/tv/TvHome';
import { TvLobby } from './components/tv/TvLobby';
import { TvCinematicIntro } from './components/tv/TvCinematicIntro';
import { TvRoleRevealWait } from './components/tv/TvRoleRevealWait';
import { TvNightFall } from './components/tv/TvNightFall';
import { TvDayBreak } from './components/tv/TvDayBreak';
import { TvCrimeScene } from './components/tv/TvCrimeScene';
import { TvEventAlert } from './components/tv/TvEventAlert';
import { TvQuestionPhase } from './components/tv/TvQuestionPhase';
import { TvAnswerReveal } from './components/tv/TvAnswerReveal';
import { TvDiscussionPhase } from './components/tv/TvDiscussionPhase';
import { TvVotingPhase } from './components/tv/TvVotingPhase';
import { TvVoteReveal } from './components/tv/TvVoteReveal';
import { TvVerdict } from './components/tv/TvVerdict';
import { TvGameOver } from './components/tv/TvGameOver';

import { MobileJoin } from './components/mobile/MobileJoin';
import { MobileWaiting } from './components/mobile/MobileWaiting';
import { MobileRoleReveal } from './components/mobile/MobileRoleReveal';
import { MobileNightAction } from './components/mobile/MobileNightAction';
import { MobileDayBreak } from './components/mobile/MobileDayBreak';
import { MobileCrimeScene } from './components/mobile/MobileCrimeScene';
import { MobileQuestion } from './components/mobile/MobileQuestion';
import { MobileDiscussion } from './components/mobile/MobileDiscussion';
import { MobileVoting } from './components/mobile/MobileVoting';
import { MobileSpectator } from './components/mobile/MobileSpectator';

import { Smartphone, Tv, ExternalLink, Sun, Eye } from 'lucide-react';
import { sound } from './utils/audio';

export default function App() {
  // Determine initial mode from URL
  const queryParams = new URLSearchParams(window.location.search);
  const initialRole = queryParams.get('role');
  const initialRoom = queryParams.get('room') || '';

  const [mode, setMode] = useState<'tv' | 'player'>(initialRole === 'player' ? 'player' : 'tv');

  const {
    isConnected,
    isCreatingRoom,
    isJoiningRoom,
    publicState,
    privateData,
    playerId,
    myPlayer,
    errorMessage,
    createRoom,
    joinRoom,
    startGame,
    advancePhase,
    restartGame,
    addBot,
    removePlayer,
    revealRole,
    nightKill,
    movePlayer,
    selectRoom,
    nightInvestigate,
    submitAnswer,
    submitVote,
    confirmVote,
    useDetective,
    useSabotage,
    leaveRoom,
  } = useGameSocket();

  // Switch between TV and Player mode
  const handleSwitchMode = (newMode: 'tv' | 'player') => {
    if (newMode === mode) return;
    const url = new URL(window.location.href);
    url.searchParams.set('role', newMode === 'player' ? 'player' : 'tv');
    if (publicState?.roomCode) url.searchParams.set('room', publicState.roomCode);
    window.location.assign(url);
  };

  const handleOpenMobileTab = () => {
    sound.playClick();
    const code = publicState?.roomCode || '';
    const mobileUrl = `${window.location.origin}${window.location.pathname}?role=player${code ? `&room=${code}` : ''}`;
    window.open(mobileUrl, '_blank', 'noopener');
  };

  // ----------------------------------------------------
  // PLAYER (MOBILE CONTROLLER) VIEW
  // ----------------------------------------------------
  if (mode === 'player') {
    if (!myPlayer || !publicState) {
      return (
        <div className="mobile-shell">
          <nav className="game-nav"><span className="brand"><Eye size={22}/> O INFILTRADO</span><button className="button-quiet" onClick={() => handleSwitchMode('tv')}><Tv size={14}/>Tela principal</button></nav>
          <MobileJoin
            isJoining={isJoiningRoom}
            initialRoomCode={initialRoom}
            onJoin={joinRoom}
            errorMessage={errorMessage}
          />
        </div>
      );
    }

    // Inside a room as player
    return (
      <div className="mobile-shell">
        {!isConnected && <div className="connection-banner" role="status">Reconectando… mantenha esta tela aberta.</div>}
        {errorMessage && <div className="error-banner" role="alert">{errorMessage}</div>}
        {!myPlayer.isAlive && publicState.phase !== 'LOBBY' ? <MobileSpectator player={myPlayer} state={publicState} onLeaveRoom={leaveRoom}/> : <>

        {publicState.phase === 'LOBBY' && (
          <MobileWaiting player={myPlayer} roomCode={publicState.roomCode} />
        )}

        {publicState.phase === 'INTRO' && (
          <div className="flex-1 min-h-screen p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-xl font-black uppercase text-amber-400 font-['Cinzel'] animate-pulse mb-2">
              DISTRIBUINDO IDENTIDADES...
            </h3>
            <p className="text-xs text-neutral-400">
              Prepare-se para receber seu papel secreto.
            </p>
          </div>
        )}

        {publicState.phase === 'ROLE_REVEAL' && (
          <MobileRoleReveal
            player={myPlayer}
            onRevealComplete={revealRole}
            onSelectRoom={selectRoom}
            readyCount={publicState.players.filter((p) => p.hasRevealedRole).length}
            totalPlayers={publicState.players.length}
          />
        )}

        {(publicState.phase === 'NIGHT_FALL' ||
          publicState.phase === 'NIGHT_KILLER') && privateData && (
          <MobileNightAction
            privateData={privateData}
            publicState={publicState}
            onKill={nightKill}
            onMove={movePlayer}
            onInvestigate={nightInvestigate}
          />
        )}

        {publicState.phase === 'DAY_BREAK' && <MobileDayBreak />}

        {publicState.phase === 'CRIME_SCENE' && (
          <MobileCrimeScene player={myPlayer} state={publicState} />
        )}

        {publicState.phase === 'ROUND_EVENT' && (
          <div className="min-h-screen p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-xl font-black uppercase text-rose-500 font-['Cinzel'] animate-pulse mb-2">
              ALERTA NO TELÃO
            </h3>
            <p className="text-xs text-neutral-400">
              Um acontecimento inesperado foi anunciado na TV! Olhem para o telão.
            </p>
          </div>
        )}

        {publicState.phase === 'ROUND_QUESTION' && publicState.currentQuestion && (
          <MobileQuestion
            player={myPlayer}
            question={publicState.currentQuestion}
            killerHint={privateData?.killerHint}
            onSubmitAnswer={submitAnswer}
          />
        )}

        {publicState.phase === 'ROUND_REVEAL' && (
          <MobileSpectator
            player={myPlayer}
            state={publicState}
            onLeaveRoom={leaveRoom}
          />
        )}

        {publicState.phase === 'DISCUSSION' && (
          <MobileDiscussion
            player={myPlayer}
            state={publicState}
            privateData={privateData}
            onUseDetective={useDetective}
            onUseSabotage={useSabotage}
          />
        )}

        {publicState.phase === 'VOTING' && (
          <MobileVoting
            player={myPlayer}
            state={publicState}
            onSubmitVote={submitVote}
            onConfirmVote={confirmVote}
          />
        )}

        {(publicState.phase === 'VOTE_REVEAL' ||
          publicState.phase === 'VERDICT' ||
          publicState.phase === 'GAME_OVER') && (
          <MobileSpectator
            player={myPlayer}
            state={publicState}
            onLeaveRoom={leaveRoom}
          />
        )}
        </>}
      </div>
    );
  }

  // ----------------------------------------------------
  // TV / NOTEBOOK (HOST) VIEW
  // ----------------------------------------------------
  return (
    <div className="game-app">
      <nav className="game-nav">
        <span className="brand"><Eye size={25}/>O INFILTRADO<small>UM JOGO DE DEDUÇÃO SOCIAL</small></span>
        <div className="nav-actions"><span className={`connection-status ${isConnected ? '' : 'offline'}`}><span className="status-dot"/>{isConnected ? 'CONECTADO' : 'RECONECTANDO'}</span>
          {publicState && <button className="button-quiet open-controller" onClick={handleOpenMobileTab}><ExternalLink size={14}/>Abrir controle</button>}
          <button className="button-quiet" onClick={() => handleSwitchMode('player')}><Smartphone size={15}/>Entrar na partida</button>
        </div>
      </nav>
      {errorMessage && <div className="error-banner" role="alert">{errorMessage}</div>}
      <main className="app-main">
        {!publicState ? (
          <TvHome
            onCreateRoom={createRoom}
            isCreatingRoom={isCreatingRoom}
            onSwitchToPlayer={() => handleSwitchMode('player')}
          />
        ) : (
          <div className="game-flow">
            <TvHeader state={publicState} onRestart={restartGame} />

            {publicState.phase === 'LOBBY' && (
              <TvLobby
                state={publicState}
                onStartGame={startGame}
                onAddBot={addBot}
                onRemovePlayer={removePlayer}
              />
            )}

            {publicState.phase === 'INTRO' && <TvCinematicIntro />}

            {publicState.phase === 'ROLE_REVEAL' && (
              <TvRoleRevealWait state={publicState} onAdvance={advancePhase} />
            )}

            {(publicState.phase === 'NIGHT_FALL' ||
              publicState.phase === 'NIGHT_KILLER') && (
              <TvNightFall state={publicState} onAdvance={advancePhase} />
            )}

            {publicState.phase === 'DAY_BREAK' && (
              <TvDayBreak state={publicState} />
            )}

            {publicState.phase === 'CRIME_SCENE' && (
              <TvCrimeScene state={publicState} onAdvance={advancePhase} />
            )}

            {publicState.phase === 'ROUND_EVENT' && publicState.currentEvent && (
              <TvEventAlert event={publicState.currentEvent} />
            )}

            {publicState.phase === 'ROUND_QUESTION' && (
              <TvQuestionPhase state={publicState} onAdvance={advancePhase} />
            )}

            {publicState.phase === 'ROUND_REVEAL' && (
              <TvAnswerReveal state={publicState} onAdvance={advancePhase} />
            )}

            {publicState.phase === 'DISCUSSION' && (
              <TvDiscussionPhase state={publicState} onAdvance={advancePhase} />
            )}

            {publicState.phase === 'VOTING' && (
              <TvVotingPhase state={publicState} onAdvance={advancePhase} />
            )}

            {publicState.phase === 'VOTE_REVEAL' && (
              <TvVoteReveal state={publicState} />
            )}

            {publicState.phase === 'VERDICT' && <TvVerdict state={publicState} />}

            {publicState.phase === 'GAME_OVER' && (
              <TvGameOver state={publicState} onRestart={restartGame} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
