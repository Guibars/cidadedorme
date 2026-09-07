import { useEffect } from 'react';
import { PublicGameState } from '../../types';
import { Skull, Search, ShieldCheck, MapPin, Footprints, Volume2, Shield } from 'lucide-react';
import { sound } from '../../utils/audio';
import { Mansion3DGridMap } from '../common/Mansion3DGridMap';

interface TvCrimeSceneProps {
  state: PublicGameState;
  onAdvance?: () => void;
}

export function TvCrimeScene({ state, onAdvance }: TvCrimeSceneProps) {
  const victim = state.nightVictim;
  const forensic = state.forensicEvidence;

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
      <div className="w-full max-w-4xl py-2 px-4 bg-amber-500 text-black font-black uppercase tracking-[0.3em] text-xs md:text-sm font-mono flex items-center justify-between rounded-xl shadow-lg">
        <span>⚠ CENA DO CRIME • ISOLADA</span>
        <span className="hidden sm:inline">NÃO ULTRAPASSE A FITA DE ISOLAMENTO</span>
        <span>PERÍCIA FORENSE EM ANDAMENTO ⚠</span>
      </div>

      <div className="relative z-10 my-auto py-2 w-full flex-1 min-h-0 flex flex-col items-center justify-center">
        {victim ? (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-500 w-full">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-rose-950/60 border border-rose-600/50 text-rose-400 text-xs font-black uppercase tracking-[0.25em] mb-1">
              <Skull className="w-4 h-4 text-rose-500 animate-bounce" />
              <span>VÍTIMA DA NOITE • GOLPE DE FACA</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-black uppercase font-['Cinzel',serif] tracking-wider text-white drop-shadow-[0_4px_30px_rgba(229,9,20,0.8)]">
              {victim.name} FOI MORTO!
            </h1>

            {state.nightCrimeRoomName && (
              <div className="mt-1 px-4 py-1.5 rounded-full bg-rose-900/40 border border-rose-600/40 text-rose-300 text-xs md:text-sm font-bold flex items-center gap-2 shadow-sm">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>O corpo foi encontrado na(o) {state.nightCrimeRoomName}</span>
              </div>
            )}

            {/* 3D Mansion Room Grid with Crime Scene Markers & Blood Trails */}
            <div className="w-full max-w-4xl bg-black/70 p-3 rounded-3xl border border-rose-900/50 shadow-2xl my-2">
              <Mansion3DGridMap
                players={state.players}
                isNight={false}
                canMove={false}
                lastStabLocation={state.lastStabLocation}
                forensicEvidence={state.forensicEvidence}
                highlightRoomId={state.nightCrimeRoomId}
                victimPlayerId={state.nightVictim?.id}
                showControls={false}
              />
            </div>

            {/* Forensic Crime Evidence Banner */}
            {forensic ? (
              <div className="max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 gap-2.5 text-left">
                <div className="p-3 rounded-2xl bg-rose-950/50 border border-rose-600/50 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-rose-600/20 border border-rose-600/40 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                    <Footprints className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block">
                      ROTA DE FUGA DO SUSPEITO
                    </span>
                    <p className="text-xs text-neutral-200 font-medium">
                      {forensic.escapeRouteClue}
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-2xl bg-neutral-900/90 border border-amber-500/40 flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <Search className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                      EVIDÊNCIA FÍSICA NO CÔMODO
                    </span>
                    <p className="text-xs text-neutral-200 font-medium">
                      {forensic.physicalEvidence}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              state.nightClue && (
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
              )
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
              A noite transcorreu em paz e todos os convidados sobreviveram para contar a história.
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
