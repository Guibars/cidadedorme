import { useEffect } from 'react';
import { PublicGameState } from '../../types';
import { Moon, EyeOff, FastForward, Search, Skull } from 'lucide-react';
import { sound } from '../../utils/audio';
import { MansionMap } from '../common/MansionMap';

interface TvNightFallProps {
  state: PublicGameState;
  onAdvance?: () => void;
}

export function TvNightFall({ state, onAdvance }: TvNightFallProps) {
  useEffect(() => {
    sound.playNightFall();
  }, []);

  const isDetectivePhase = state.phase === 'NIGHT_DETECTIVE';

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-4 flex flex-col justify-between items-center text-center bg-[#0d0d0d] relative overflow-hidden select-none">
      {/* Sinister Red/Dark Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] animate-pulse ${
            isDetectivePhase ? 'bg-cyan-950/25' : 'bg-red-950/25'
          }`}
        />
      </div>

      {/* Header Badge */}
      <div className="relative z-10">
        <div
          className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-[0.25em] mb-2 ${
            isDetectivePhase
              ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-400'
              : 'bg-red-950/50 border-red-800/50 text-red-400'
          }`}
        >
          {isDetectivePhase ? (
            <>
              <Search className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>TURNO DO DETETIVE • INVESTIGAÇÃO</span>
            </>
          ) : (
            <>
              <Skull className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>A CIDADE DORME • FACA DO ASSASSINO</span>
            </>
          )}
        </div>

        <h1 className="text-5xl md:text-7xl font-black uppercase font-['Cinzel',serif] tracking-widest text-white drop-shadow-[0_8px_35px_rgba(229,9,20,0.5)]">
          {isDetectivePhase ? 'O DETETIVE INVESTIGA' : 'A MANSÃO EM SILÊNCIO'}
        </h1>

        <p className="text-base md:text-xl text-neutral-300 font-medium max-w-3xl mx-auto mt-1">
          {isDetectivePhase ? (
            <>
              Todos os jogadores permanecem com os olhos fechados.
              <br />
              <span className="text-cyan-400 font-bold">O Detetive analisa os cômodos da casa</span> e investiga um suspeito no celular.
            </>
          ) : (
            <>
              Todos fecham os olhos e abaixam a cabeça.
              <br />
              <span className="text-rose-400 font-bold">O Assassino empunha sua faca</span> e escolhe um cômodo e uma vítima.
            </>
          )}
        </p>
      </div>

      {/* Center Countdown & Mansion Map */}
      <div className="relative z-10 my-4 w-full flex flex-col items-center">
        {/* Timer Pill */}
        <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-neutral-900/90 border border-neutral-800 mb-3 shadow-md">
          <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
            Tempo Restante:
          </span>
          <span
            className={`text-xl font-mono font-black ${
              isDetectivePhase ? 'text-cyan-400' : 'text-rose-500'
            }`}
          >
            {state.timerSeconds}s
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping ml-1" />
        </div>

        {/* Mansion Floor Plan with Characters (Among Us style) */}
        <div className="w-full max-w-4xl bg-black/50 p-4 rounded-3xl border border-neutral-800/80 shadow-2xl backdrop-blur-sm">
          <MansionMap
            players={state.players}
            compact={true}
            title="Posição dos Jogadores nos Cômodos da Mansão"
          />
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-4xl text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-rose-500 animate-pulse" />
          <span>Mantenham as cabeças baixas e olhos fechados!</span>
        </div>

        {onAdvance && (
          <button
            onClick={onAdvance}
            className="px-3 py-1.5 rounded-lg bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
            <span>Pular Turno Noturno</span>
          </button>
        )}
      </div>
    </div>
  );
}
