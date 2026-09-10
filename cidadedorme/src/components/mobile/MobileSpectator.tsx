import { Player, PublicGameState } from '../../types';
import { Tv, Skull, ShieldAlert, Award, RotateCcw } from 'lucide-react';

interface MobileSpectatorProps {
  player: Player;
  state: PublicGameState;
  onLeaveRoom: () => void;
}

export function MobileSpectator({ player, state, onLeaveRoom }: MobileSpectatorProps) {
  const isEliminated = !player.isAlive;
  const isGameOver = state.phase === 'GAME_OVER';

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-6 max-w-md mx-auto bg-neutral-950 text-neutral-100 text-center">
      {/* Top Header */}
      <div className="pt-2 flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">{player.avatar.emoji}</span>
          <span className="text-xs font-bold text-neutral-200">{player.name}</span>
        </div>
        <span className="text-xs font-mono font-bold text-amber-400">
          SALA: {state.roomCode}
        </span>
      </div>

      {/* Main Focus Card */}
      <div className="my-auto py-6">
        <div className="w-20 h-20 mx-auto mb-5 rounded-3xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-amber-400 shadow-2xl animate-pulse">
          <Tv className="w-10 h-10" />
        </div>

        <h2 className="text-3xl font-black uppercase font-['Cinzel'] tracking-wide text-neutral-100 mb-2">
          OLHE PARA A TV!
        </h2>

        {state.phase === 'VOTE_REVEAL' && (
          <p className="text-xs text-neutral-400 max-w-xs mx-auto">
            A acusação do detetive está sendo revelada no telão!
          </p>
        )}

        {state.phase === 'VERDICT' && (
          <p className="text-xs text-rose-400 font-semibold max-w-xs mx-auto">
            Veredito iminente: será que o culpado foi desmascarado?
          </p>
        )}

        {isGameOver && (
          <div className="mt-4 p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase">
              <Award className="w-4 h-4" />
              <span>Fim da Partida</span>
            </div>
            <p className="text-xs text-neutral-300">
              Vencedores: <strong className="text-white uppercase">{state.winner}</strong>
            </p>
            <p className="text-xs text-neutral-400">
              Aguarde o anfitrião reiniciar a partida na TV para jogar novamente com novos papéis!
            </p>
          </div>
        )}

        {isEliminated && (
          <div className="mt-6 p-4 rounded-2xl bg-rose-950/40 border border-rose-600/50 text-left">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase mb-1">
              <Skull className="w-4 h-4" />
              <span>Você foi eliminado</span>
            </div>
            <p className="text-xs text-rose-200/80">
              Você pode continuar assistindo presencialmente em silêncio. Não estrague os segredos dos outros!
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pb-2">
        <button
          onClick={onLeaveRoom}
          className="text-xs text-neutral-500 hover:text-neutral-300 underline cursor-pointer"
        >
          Sair da sala
        </button>
      </div>
    </div>
  );
}
