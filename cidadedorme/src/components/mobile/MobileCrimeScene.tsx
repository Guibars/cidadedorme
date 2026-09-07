import { useEffect } from 'react';
import { Player, PublicGameState } from '../../types';
import { Skull, ShieldCheck, Eye, Search } from 'lucide-react';
import { sound } from '../../utils/audio';

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
    <div className="flex-1 p-6 flex flex-col justify-center items-center text-center bg-[#141414] text-white select-none">
      {isVictim ? (
        <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
          <div className="w-24 h-24 rounded-full bg-red-900/30 border-2 border-red-600 flex items-center justify-center text-red-500 mb-6 shadow-[0_0_50px_rgba(229,9,20,0.5)] animate-pulse">
            <Skull className="w-12 h-12" />
          </div>

          <span className="px-3 py-1 rounded-full bg-red-950/80 border border-red-700 text-red-400 text-xs font-black uppercase tracking-widest mb-3">
            FATALIDADE NOTURNA
          </span>

          <h2 className="text-4xl font-black uppercase font-['Bebas_Neue',sans-serif] text-red-500 tracking-wider">
            VOCÊ FOI MORTO!
          </h2>

          <p className="text-sm text-neutral-300 mt-2 max-w-xs leading-relaxed">
            O Assassino atacou você nesta noite.
            <br />
            Você agora é um espectador. Não revele quem é o assassino para quem ainda está vivo!
          </p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 rounded-full bg-emerald-500/15 border-2 border-emerald-500/50 flex items-center justify-center text-emerald-400 mb-6 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="w-12 h-12" />
          </div>

          <span className="px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-400 text-xs font-black uppercase tracking-widest mb-3">
            STATUS: VIVO
          </span>

          <h2 className="text-4xl font-black uppercase font-['Bebas_Neue',sans-serif] text-white tracking-wider">
            VOCÊ SOBREVIVEU!
          </h2>

          <p className="text-sm text-neutral-300 mt-2 max-w-xs leading-relaxed">
            A perícia policial está no telão. Olhe para a TV para ver quem foi a vítima e a pista deixada pelo Assassino!
          </p>
        </div>
      )}
    </div>
  );
}
