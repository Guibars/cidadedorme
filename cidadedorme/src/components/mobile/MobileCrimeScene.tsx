import { useEffect } from 'react';
import { Player, PublicGameState } from '../../types';
import { Skull, ShieldCheck, MapPin, Footprints, Flame, Search, Volume2 } from 'lucide-react';
import { sound } from '../../utils/audio';
import { Mansion3DGridMap } from '../common/Mansion3DGridMap';

interface MobileCrimeSceneProps {
  player: Player;
  state: PublicGameState;
}

export function MobileCrimeScene({ player, state }: MobileCrimeSceneProps) {
  const isVictim = state.nightVictim?.id === player.id || !player.isAlive;
  const forensic = state.forensicEvidence;

  useEffect(() => {
    if (isVictim) {
      sound.triggerVictimDeathVibrate();

    } else {
      sound.triggerVibrate(60);
    }
  }, [isVictim]);

  return (
    <div className="flex-1 p-3.5 flex flex-col justify-between items-center text-center bg-neutral-950 text-white select-none overflow-y-auto">
      <div className="w-full flex flex-col items-center max-w-lg mx-auto">
        {isVictim ? (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-300 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-rose-900/30 border-2 border-rose-600 flex items-center justify-center text-rose-500 mb-2 shadow-[0_0_35px_rgba(225,29,72,0.5)] animate-pulse">
              <Skull className="w-8 h-8" />
            </div>

            <span className="px-3 py-0.5 rounded-full bg-rose-950/80 border border-rose-700 text-rose-400 text-[10px] font-black uppercase tracking-widest mb-1">
              FATALIDADE NOTURNA
            </span>

            <h2 className="text-2xl font-black uppercase font-['Cinzel',serif] text-rose-500 tracking-wider">
              VOCÊ FOI MORTO!
            </h2>

            <p className="text-xs text-neutral-300 mt-0.5 max-w-xs leading-relaxed">
              O Assassino atacou você no escuro. Você agora é um espectador fantasma!
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 mb-2 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <span className="px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">
              STATUS: SOBREVIVENTE
            </span>

            <h2 className="text-2xl font-black uppercase font-['Cinzel',serif] text-neutral-100 tracking-wider">
              VOCÊ SOBREVIVEU!
            </h2>

            <p className="text-xs text-neutral-300 mt-0.5 max-w-xs leading-relaxed">
              O dia amanheceu na mansão! A perícia forense já mapeou a cena do crime:
            </p>
          </div>
        )}

        {/* 3D Mansion Grid Map with Forensic Blood Trails & Caution Tape */}
        <div className="w-full my-2">
          <Mansion3DGridMap
            players={state.players}
            currentPlayerId={player.id}
            isNight={false}
            canMove={false}
            lastStabLocation={state.lastStabLocation}
            forensicEvidence={state.forensicEvidence}
            highlightRoomId={state.nightCrimeRoomId}
            victimPlayerId={state.nightVictim?.id}
            showControls={false}
            compact={true}
          />
        </div>

        {/* Forensic Clue Details Cards */}
        {forensic && (
          <div className="w-full space-y-2 mt-1 text-left">
            {/* Escape Route & Footprints */}
            <div className="p-3 rounded-2xl bg-rose-950/40 border border-rose-600/40 flex items-start gap-2.5 shadow-md">
              <div className="w-7 h-7 rounded-xl bg-rose-600/20 border border-rose-600/40 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                <Footprints className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 block">
                  ROTA DE FUGA DO ASSASSINO
                </span>
                <p className="text-xs text-neutral-200 font-medium">
                  {forensic.escapeRouteClue}
                </p>
              </div>
            </div>

            {/* Room Material Residue */}
            <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-start gap-2.5 shadow-md">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Search className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">
                  RESÍDUO MATERIAL COLETADO
                </span>
                <p className="text-xs text-neutral-300">
                  {forensic.physicalEvidence}
                </p>
              </div>
            </div>

            {/* Acoustic Alibi */}
            <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 flex items-start gap-2.5 shadow-md">
              <div className="w-7 h-7 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                <Volume2 className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 block">
                  RELATÓRIO ACÚSTICO DOS CÔMODOS
                </span>
                <p className="text-xs text-neutral-300">
                  {forensic.acousticReport}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 text-[11px] text-neutral-400 font-mono">
        Olhem para o telão! A discussão aberta começará em {state.timerSeconds}s
      </div>
    </div>
  );
}
