import { Player } from '../../types';
import { Smartphone, CheckCircle, ShieldCheck } from 'lucide-react';

interface MobileWaitingProps {
  player: Player;
  roomCode: string;
}

export function MobileWaiting({ player, roomCode }: MobileWaitingProps) {
  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-6 max-w-md mx-auto bg-neutral-950 text-neutral-100 text-center">
      {/* Top Bar */}
      <div className="pt-4 flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="text-xs font-mono font-bold text-amber-400">
          SALA: {roomCode}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>CONECTADO</span>
        </div>
      </div>

      {/* Main Avatar Card */}
      <div className="my-auto py-8">
        <div
          className={`w-28 h-28 mx-auto mb-5 rounded-3xl flex items-center justify-center text-5xl bg-gradient-to-br ${player.avatar.bgGradient} border-2 border-white/20 shadow-[0_0_40px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-500`}
        >
          {player.avatar.emoji}
        </div>

        <h2 className="text-2xl font-black text-neutral-100 tracking-wide">
          {player.name}
        </h2>
        <p className="text-xs text-neutral-400 mt-1 uppercase tracking-wider font-medium">
          {player.avatar.name}
        </p>

        <div className="mt-8 p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-md">
          <div className="flex items-center justify-center gap-2 text-amber-400 mb-2 font-bold text-sm">
            <Smartphone className="w-4 h-4 animate-bounce" />
            <span>OLHE PARA A TV</span>
          </div>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Seu celular é o seu controle privado. Quando o anfitrião iniciar a partida, você receberá sua identidade secreta aqui.
          </p>
        </div>
      </div>

      {/* Bottom info */}
      <div className="pb-4 text-xs text-neutral-600 flex items-center justify-center gap-2">
        <ShieldCheck className="w-4 h-4 text-neutral-500" />
        <span>Nenhum papel é revelado na tela da TV</span>
      </div>
    </div>
  );
}
