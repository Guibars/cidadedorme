import { PublicGameState } from '../../types';
import { Smartphone, ShieldCheck, Clock, ArrowRight } from 'lucide-react';

interface TvRoleRevealWaitProps {
  state: PublicGameState;
  onAdvance: () => void;
}

export function TvRoleRevealWait({ state, onAdvance }: TvRoleRevealWaitProps) {
  const confirmedCount = state.players.filter((p) => p.hasRevealedRole).length;
  const totalCount = state.players.length;
  const allConfirmed = confirmedCount === totalCount;

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-10 flex flex-col justify-between items-center text-center">
      {/* Top message */}
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold uppercase tracking-wider mb-4">
          <Smartphone className="w-3.5 h-3.5 animate-pulse" />
          ATENÇÃO AOS CELULARES
        </div>
        <h2 className="text-4xl md:text-6xl font-black tracking-wide uppercase font-['Cinzel'] text-neutral-100">
          REVELEM SUAS IDENTIDADES
        </h2>
        <p className="mt-3 text-base md:text-lg text-neutral-400 max-w-2xl mx-auto">
          No seu celular, <span className="text-amber-400 font-semibold">segure o botão por 2 segundos</span> para ver sua missão em segredo. Mantenha a tela longe dos olhos dos outros!
        </p>
      </div>

      {/* Progress Cards */}
      <div className="w-full max-w-3xl my-8">
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="text-sm font-semibold uppercase tracking-wider text-neutral-400">
            Confirmação de Papéis
          </span>
          <span className="text-sm font-bold font-mono text-amber-400">
            {confirmedCount} / {totalCount} CONFIRMADOS
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {state.players.map((player) => (
            <div
              key={player.id}
              className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${
                player.hasRevealedRole
                  ? 'bg-emerald-950/30 border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
                  : 'bg-neutral-900/50 border-neutral-800'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gradient-to-br ${player.avatar.bgGradient}`}
                >
                  {player.avatar.emoji}
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold text-neutral-200">{player.name}</h4>
                  <span className="text-xs text-neutral-500">{player.avatar.name}</span>
                </div>
              </div>

              <div>
                {player.hasRevealedRole ? (
                  <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/30">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    VISTO
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-neutral-500 bg-neutral-800/40 px-2 py-1 rounded">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    AGUARDANDO
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advance button */}
      <div>
        <button
          onClick={onAdvance}
          className={`px-8 py-3.5 rounded-xl font-bold tracking-wider text-sm flex items-center gap-3 uppercase transition-all duration-200 ${
            allConfirmed
              ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 shadow-[0_0_30px_rgba(245,158,11,0.4)] cursor-pointer'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 cursor-pointer'
          }`}
        >
          <span>{allConfirmed ? 'INICIAR PRIMEIRA RODADA' : 'Pular Espera e Iniciar'}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
