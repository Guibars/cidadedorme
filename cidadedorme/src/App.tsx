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
    sound.playClick();
    setMode(newMode);
  };

  const handleOpenMobileTab = () => {
    sound.playClick();
    const code = publicState?.roomCode || '';
    const mobileUrl = `${window.location.origin}${window.location.pathname}?role=player${code ? `&room=${code}` : ''}`;
    window.open(mobileUrl, '_blank');
  };

  // ----------------------------------------------------
  // PLAYER (MOBILE CONTROLLER) VIEW
  // ----------------------------------------------------
  if (mode === 'player') {
    if (!myPlayer || !publicState) {
      return (
        <div className="min-h-screen bg-[#141414] flex flex-col justify-between">
          <div className="p-3 bg-black/60 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
            <div className="flex items-center gap-1.5">
              <span className="text-[#E50914] font-black text-base font-['Bebas_Neue',sans-serif]">N</span>
              <span className="font-bold text-white uppercase tracking-wider text-xs">O INFILTRADO</span>
            </div>
            <button
              onClick={() => handleSwitchMode('tv')}
              className="px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              <Tv className="w-3.5 h-3.5" />
              <span>Ver Tela TV</span>
            </button>
          </div>

          <MobileJoin
            initialRoomCode={initialRoom}
            onJoin={joinRoom}
            errorMessage={errorMessage}
          />
        </div>
      );
    }

    // Inside a room as player
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col">
        {publicState.phase === 'LOBBY' && (
          <MobileWaiting player={myPlayer} roomCode={publicState.roomCode} />
        )}

        {publicState.phase === 'INTRO' && (
          <div className="min-h-screen p-6 flex flex-col items-center justify-center text-center">
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
          publicState.phase === 'NIGHT_KILLER' ||
          publicState.phase === 'NIGHT_DETECTIVE') && privateData && (
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
      </div>
    );
  }

  // ----------------------------------------------------
  // TV / NOTEBOOK (HOST) VIEW
  // ----------------------------------------------------
  return (
    <div className="min-h-screen w-full bg-[#141414] text-neutral-100 flex flex-col relative overflow-hidden selection:bg-[#E50914] selection:text-white">
      {/* Presentation Bar (Netflix Black) */}
      <div className="w-full px-4 py-2 bg-black/80 border-b border-neutral-800 flex items-center justify-between text-xs z-50">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-base font-black text-[#E50914] font-['Bebas_Neue',sans-serif] leading-none">
            N
          </span>
          <span className="font-bold text-white uppercase tracking-wider text-xs">
            O INFILTRADO
          </span>
          <span className="text-neutral-600 hidden sm:inline">|</span>
          <span className="text-neutral-400 hidden sm:inline text-[11px]">Tela Principal da TV / Smart TV</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenMobileTab}
            className="px-3 py-1 rounded bg-[#222222] hover:bg-[#2e2e2e] text-neutral-200 hover:text-white border border-neutral-700 flex items-center gap-1.5 cursor-pointer transition-colors text-xs font-semibold"
            title="Abre a tela de jogador em nova aba para testar a conexão celular"
          >
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
            <span>Abrir Controle Celular (Nova Aba)</span>
          </button>

          <button
            onClick={() => handleSwitchMode('player')}
            className="px-3 py-1 rounded bg-[#E50914]/20 hover:bg-[#E50914]/30 text-red-300 border border-[#E50914]/50 flex items-center gap-1.5 cursor-pointer transition-colors text-xs font-bold"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Alternar para Celular</span>
          </button>
        </div>
      </div>

      {/* Main TV Screen Content */}
      <main className="flex-1 flex flex-col relative z-10">
        {!publicState ? (
          <TvHome
            onCreateRoom={createRoom}
            isCreatingRoom={isCreatingRoom}
            onSwitchToPlayer={() => handleSwitchMode('player')}
          />
        ) : (
          <div className="flex-1 flex flex-col">
            <TvHeader state={publicState} />

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
              publicState.phase === 'NIGHT_KILLER' ||
              publicState.phase === 'NIGHT_DETECTIVE') && (
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
