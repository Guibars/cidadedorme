import { useEffect } from 'react';
import { PublicGameState } from '../../types';
import { EyeOff, FastForward, Skull } from 'lucide-react';
import { sound } from '../../utils/audio';
import { Mansion3DGridMap } from '../common/Mansion3DGridMap';

interface TvNightFallProps {
  state: PublicGameState;
  onAdvance?: () => void;
}

export function TvNightFall({ state, onAdvance }: TvNightFallProps) {
  useEffect(() => {
    sound.playNightFall();
  }, []);

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-4 flex flex-col justify-between items-center text-center bg-[#0d0d0d] relative overflow-hidden select-none">
      {/* Sinister Dark Red Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] animate-pulse bg-red-950/25" />
      </div>

      {/* Header Badge */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-red-800/50 bg-red-950/50 text-red-400 text-xs font-black uppercase tracking-[0.25em] mb-2">
          <Skull className="w-4 h-4 text-rose-500 animate-pulse" />
          <span>A MANSÃO EM SILÊNCIO • O ASSASSINO À SOLTA</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black uppercase font-['Cinzel',serif] tracking-widest text-white drop-shadow-[0_8px_35px_rgba(229,9,20,0.5)]">
          MADRUGADA SANGRENTA
        </h1>

        <p className="text-sm md:text-base text-neutral-300 font-medium max-w-2xl mx-auto mt-1">
          Todos os jogadores fecham os olhos e abaixam a cabeça.
          <br />
          <span className="text-rose-400 font-bold">O Assassino caminha pela mansão em 3D</span> com a lanterna e deve se aproximar fisicamente de sua vítima para atacar!
        </p>
      </div>

      {/* Center 3D Walkable Mansion Map */}
      <div className="relative z-10 my-2 w-full flex-1 min-h-0 flex flex-col items-center justify-center">
        {/* Timer Pill */}
        <div className="flex items-center gap-2 px-4 py-1 rounded-full bg-neutral-900/90 border border-neutral-800 mb-2 shadow-md">
          <span className="text-xs text-neutral-400 font-bold uppercase tracking-wider">
            Tempo Restante:
          </span>
          <span className="text-xl font-mono font-black text-rose-500">
            {state.timerSeconds}s
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping ml-1" />
        </div>

        {/* Live 3D Room Grid */}
        <div className="w-full max-w-4xl bg-black/70 p-3 rounded-3xl border border-neutral-800/80 shadow-2xl backdrop-blur-sm">
          <Mansion3DGridMap
            players={state.players}
            isKiller={false}
            isNight={true}
            canMove={false}
            lastStabLocation={state.lastStabLocation}
            showControls={false}
          />
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="relative z-10 flex items-center justify-between w-full max-w-4xl text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-rose-500 animate-pulse" />
          <span>Mantenham as cabeças baixas e os olhos fechados até o amanhecer!</span>
        </div>

        {onAdvance && (
          <button
            onClick={onAdvance}
            className="px-3 py-1.5 rounded-xl bg-neutral-800/90 hover:bg-neutral-700 text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5 text-amber-400" />
            <span>Pular Turno Noturno</span>
          </button>
        )}
      </div>
    </div>
  );
}
