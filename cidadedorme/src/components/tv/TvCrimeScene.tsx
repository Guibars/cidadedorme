import { useEffect } from 'react';
import { PublicGameState } from '../../types';
import { Skull, AlertTriangle, Search, ShieldCheck } from 'lucide-react';
import { sound } from '../../utils/audio';

interface TvCrimeSceneProps {
  state: PublicGameState;
  onAdvance?: () => void;
}

export function TvCrimeScene({ state, onAdvance }: TvCrimeSceneProps) {
  const victim = state.nightVictim;

  useEffect(() => {
    if (victim) {
      sound.playKillStab();
    }
  }, [victim]);

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-6 flex flex-col justify-between items-center text-center bg-[#141414] relative overflow-hidden">
      {/* Red Crime Lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-red-950/30 rounded-full blur-[130px] animate-pulse" />
      </div>

      {/* Police Crime Tape Banner */}
      <div className="w-full max-w-4xl py-2 px-4 bg-amber-500 text-black font-black uppercase tracking-[0.3em] text-xs md:text-sm font-mono flex items-center justify-between rounded shadow-lg">
        <span>⚠ CENA DO CRIME</span>
        <span className="hidden sm:inline">NÃO ULTRAPASSE</span>
        <span>INVESTIGAÇÃO CRIMINAL ⚠</span>
      </div>

      <div className="relative z-10 my-auto py-6">
        {victim ? (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-900/40 border border-red-600/50 text-red-400 text-xs font-black uppercase tracking-[0.25em] mb-4">
              <Skull className="w-4 h-4 text-red-500 animate-bounce" />
              <span>VÍTIMA DA NOITE</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-black uppercase font-['Bebas_Neue',sans-serif] tracking-wider text-white drop-shadow-[0_4px_30px_rgba(229,9,20,0.8)]">
              {victim.name} FOI ELIMINADO!
            </h1>

            {/* Victim Profile Card */}
            <div className="my-6 p-6 rounded-2xl bg-black/80 border-2 border-red-600/80 flex flex-col items-center shadow-[0_0_50px_rgba(229,9,20,0.4)] max-w-md w-full">
              <div
                className={`relative w-28 h-28 rounded-2xl flex items-center justify-center text-6xl shadow-2xl bg-gradient-to-br ${victim.avatar.bgGradient} grayscale contrast-125`}
              >
                {victim.avatar.emoji}
                <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-red-600 border-2 border-white flex items-center justify-center text-white shadow-lg">
                  <Skull className="w-6 h-6" />
                </div>
              </div>

              <span className="text-2xl font-black text-white mt-4 tracking-wide font-['Bebas_Neue',sans-serif]">
                {victim.name}
              </span>
              <span className="text-xs font-mono uppercase tracking-widest text-red-400 font-bold mt-1">
                Morto durante a noite
              </span>
            </div>

            {/* Clue Left Behind */}
            {state.nightClue && (
              <div className="max-w-2xl w-full p-4 rounded-xl bg-neutral-900/90 border border-amber-500/40 flex items-center gap-3 text-left shadow-lg">
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-widest font-mono text-amber-400 font-bold block">
                    EVIDÊNCIA COLETADA PELA PERÍCIA
                  </span>
                  <p className="text-sm md:text-base text-neutral-200 font-medium">
                    {state.nightClue}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <h1 className="text-5xl md:text-7xl font-black uppercase font-['Bebas_Neue',sans-serif] tracking-wider text-white">
              NINGUÉM FOI MORTO!
            </h1>
            <p className="text-lg text-neutral-300 max-w-xl mx-auto mt-2">
              A noite foi calma e todos os cidadãos sobreviveram para contar a história.
            </p>
          </div>
        )}
      </div>

      {/* Auto-proceed timer banner */}
      <div className="relative z-10 text-xs font-mono text-neutral-400 uppercase tracking-widest">
        A discussão aberta começará em {state.timerSeconds}s...
      </div>
    </div>
  );
}
