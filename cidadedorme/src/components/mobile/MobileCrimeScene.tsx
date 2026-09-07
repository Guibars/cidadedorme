import { useEffect } from 'react';
import { Player, PublicGameState } from '../../types';
import { Skull, ShieldCheck, MapPin } from 'lucide-react';
import { sound } from '../../utils/audio';
import { MansionMap } from '../common/MansionMap';

interface MobileCrimeSceneProps {
  player: Player;
  state: PublicGameState;
}

export function MobileCrimeScene({ player, state }: MobileCrimeSceneProps) {
  const isVictim = state.nightVictim?.id === player.id || !player.isAlive;

  useEffect(() => {
    if (isVictim) {
      sound.triggerVictimDeathVibrate();
      sound.playKillStab();
    } else {
      sound.triggerVibrate(60);
    }
  }, [isVictim]);

  return (
    <div className="flex-1 p-5 flex flex-col justify-between items-center text-center bg-neutral-950 text-white select-none overflow-y-auto">
      <div className="w-full flex flex-col items-center">
        {isVictim ? (
          <div className="flex flex-col items-center animate-in zoom-in-95 duration-300 mb-3">
            <div className="w-16 h-16 rounded-2xl bg-rose-900/30 border-2 border-rose-600 flex items-center justify-center text-rose-500 mb-3 shadow-[0_0_40px_rgba(225,29,72,0.5)] animate-pulse">
              <Skull className="w-9 h-9" />
            </div>

            <span className="px-3 py-0.5 rounded-full bg-rose-950/80 border border-rose-700 text-rose-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
              FATALIDADE NOTURNA
            </span>

            <h2 className="text-3xl font-black uppercase font-['Cinzel',serif] text-rose-500 tracking-wider">
              VOCÊ FOI MORTO!
            </h2>

            <p className="text-xs text-neutral-300 mt-1 max-w-xs leading-relaxed">
              O Assassino desferiu um golpe de faca contra você. Você agora é um espectador fantasma!
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center mb-3">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 mb-3 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <span className="px-3 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1.5">
              STATUS: VIVO
            </span>

            <h2 className="text-3xl font-black uppercase font-['Cinzel',serif] text-neutral-100 tracking-wider">
              VOCÊ SOBREVIVEU!
            </h2>

            <p className="text-xs text-neutral-300 mt-1 max-w-xs leading-relaxed">
              O dia amanheceu na mansão! Veja abaixo onde o crime aconteceu:
            </p>
          </div>
        )}

        {state.nightCrimeRoomName && (
          <div className="mb-2 px-3 py-1 rounded-full bg-rose-950/70 border border-rose-600/50 text-rose-300 text-xs font-bold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-rose-400" />
            <span>Local do Crime: {state.nightCrimeRoomName}</span>
          </div>
        )}

        {/* Mansion Map Preview */}
        <div className="w-full max-w-md bg-neutral-900/90 p-3 rounded-2xl border border-neutral-800 shadow-xl my-1">
          <MansionMap
            players={state.players}
            highlightRoomId={state.nightCrimeRoomId}
            victimPlayerId={state.nightVictim?.id}
            currentPlayerId={player.id}
            compact={true}
          />
        </div>
      </div>

      <div className="mt-3 text-[11px] text-neutral-400 font-mono">
        Olhem para o telão! A discussão aberta começará em {state.timerSeconds}s
      </div>
    </div>
  );
}
