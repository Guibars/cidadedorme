import { useEffect } from 'react';
import { PublicGameState } from '../../types';
import { Moon, EyeOff, ShieldAlert, FastForward } from 'lucide-react';
import { sound } from '../../utils/audio';

interface TvNightFallProps {
  state: PublicGameState;
  onAdvance?: () => void;
}

export function TvNightFall({ state, onAdvance }: TvNightFallProps) {
  useEffect(() => {
    sound.playNightFall();
  }, []);

  const alivePlayers = state.players.filter((p) => p.isAlive);

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-6 flex flex-col justify-between items-center text-center bg-[#0d0d0d] relative overflow-hidden">
      {/* Sinister Red/Dark Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-950/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute top-10 left-1/4 w-80 h-80 bg-blue-950/15 rounded-full blur-[100px]" />
      </div>

      {/* Header Badge */}
      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-950/40 border border-red-800/40 text-red-400 text-xs font-black uppercase tracking-[0.25em] mb-4">
          <Moon className="w-4 h-4 text-indigo-400 animate-pulse" />
          <span>FASE DA NOITE • RODADA {state.round}</span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black uppercase font-['Bebas_Neue',sans-serif] tracking-widest text-white drop-shadow-[0_8px_35px_rgba(229,9,20,0.5)]">
          A CIDADE DORME
        </h1>

        <p className="text-lg md:text-2xl text-neutral-300 font-medium max-w-3xl mx-auto mt-3">
          Todos fecham os olhos e abaixam a cabeça.
          <br />
          <span className="text-red-400 font-bold">O Assassino acorda em silêncio</span> e escolhe sua vítima na tela do celular.
        </p>
      </div>

      {/* Center Countdown Sphere */}
      <div className="relative z-10 my-8 flex flex-col items-center">
        <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full border-4 border-neutral-800 flex items-center justify-center bg-black/70 shadow-[0_0_50px_rgba(229,9,20,0.3)]">
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full border-2 border-red-600/50 animate-ping pointer-events-none opacity-40" />
          
          <div className="flex flex-col items-center">
            <span className="text-6xl md:text-7xl font-black font-mono text-red-500 tracking-wider">
              {state.timerSeconds}
            </span>
            <span className="text-[11px] uppercase tracking-widest text-neutral-400 font-bold mt-1">
              Segundos
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 text-neutral-400 text-sm">
          <EyeOff className="w-4 h-4 text-red-400" />
          <span>Olhos fechados! O jogo avançará automaticamente.</span>
        </div>
      </div>

      {/* Sleeping Players Row */}
      <div className="relative z-10 w-full max-w-4xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {alivePlayers.map((player) => (
            <div
              key={player.id}
              className="p-3.5 rounded-xl bg-neutral-900/80 border border-neutral-800 flex flex-col items-center text-center shadow-lg"
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl mb-2 bg-gradient-to-br ${player.avatar.bgGradient} opacity-60 grayscale-[40%]`}
              >
                {player.avatar.emoji}
              </div>
              <span className="text-sm font-bold text-neutral-200 truncate w-full">
                {player.name}
              </span>
              <span className="text-[10px] text-indigo-300/80 font-mono mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                Dormindo...
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Host Skip Control */}
      {onAdvance && (
        <div className="relative z-10 mt-6">
          <button
            onClick={onAdvance}
            className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <FastForward className="w-3.5 h-3.5" />
            <span>Pular Noite (Avançar)</span>
          </button>
        </div>
      )}
    </div>
  );
}
