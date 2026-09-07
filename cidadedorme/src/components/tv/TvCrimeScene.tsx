import { useEffect } from 'react';
import { PublicGameState } from '../../types';
import { Skull, Search, ShieldCheck, MapPin } from 'lucide-react';
import { sound } from '../../utils/audio';
import { InteractiveMansionMap } from '../common/InteractiveMansionMap';

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
    <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-4 flex flex-col justify-between items-center text-center bg-[#141414] relative overflow-hidden select-none">
      {/* Red Crime Lighting */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[450px] bg-red-950/30 rounded-full blur-[130px] animate-pulse" />
      </div>

      {/* Police Crime Tape Banner */}
      <div className="w-full max-w-4xl py-2 px-4 bg-amber-500 text-black font-black uppercase tracking-[0.3em] text-xs md:text-sm font-mono flex items-center justify-between rounded shadow-lg">
        <span>⚠ CENA DO CRIME</span>
        <span className="hidden sm:inline">NÃO ULTRAPASSE A FITA</span>
        <span>INVESTIGAÇÃO CRIMINAL ⚠</span>
      </div>

      <div className="relative z-10 my-auto py-2 w-full flex flex-col items-center">
        {victim ? (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-500 w-full">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-rose-950/60 border border-rose-600/50 text-rose-400 text-xs font-black uppercase tracking-[0.25em] mb-1">
              <Skull className="w-4 h-4 text-rose-500 animate-bounce" />
              <span>VÍTIMA DA NOITE • ATAQUE COM FACA</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black uppercase font-['Cinzel',serif] tracking-wider text-white drop-shadow-[0_4px_30px_rgba(229,9,20,0.8)]">
              {victim.name} FOI ASSASSINADO!
            </h1>

            {state.nightCrimeRoomName && (
              <div className="mt-1 px-3 py-1 rounded-full bg-rose-900/40 border border-rose-600/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>O corpo foi encontrado na(o) {state.nightCrimeRoomName}</span>
              </div>
            )}

            {/* Interactive 2D Map with Crime Highlight */}
            <div className="w-full max-w-4xl bg-black/70 p-3 rounded-3xl border border-rose-900/50 shadow-2xl my-2">
              <InteractiveMansionMap
                players={state.players}
                isKiller={false}
                isNight={false}
                canMove={false}
                lastStabLocation={state.lastStabLocation}
              />
            </div>

            {/* Clue Left Behind */}
            {state.nightClue && (
              <div className="max-w-2xl w-full p-2.5 rounded-2xl bg-neutral-900/90 border border-amber-500/40 flex items-center gap-3 text-left shadow-lg">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
                  <Search className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-widest font-mono text-amber-400 font-bold block">
                    PISTA ENCONTRADA PELA PERÍCIA NO LOCAL
                  </span>
                  <p className="text-xs text-neutral-200 font-medium">
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
            <h1 className="text-5xl md:text-7xl font-black uppercase font-['Cinzel',serif] tracking-wider text-white">
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
