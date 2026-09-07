import { PublicGameState } from '../../types';
import { Vote, ArrowRight } from 'lucide-react';

interface TvVotingPhaseProps {
  state: PublicGameState;
  onAdvance: () => void;
}

export function TvVotingPhase({ state, onAdvance }: TvVotingPhaseProps) {
  const votedCount = state.activeVotesCount;
  const totalAlive = state.players.filter((p) => p.isAlive).length;
  const allVoted = votedCount >= totalAlive;

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 flex flex-col justify-between items-center text-center">
      {/* Top Banner */}
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-4">
          <Vote className="w-3.5 h-3.5" />
          VOTAÇÃO SECRETA
        </div>
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-wider font-['Cinzel'] text-neutral-100">
          É HORA DE VOTAR.
        </h2>
        <p className="mt-3 text-base md:text-lg text-neutral-400 max-w-xl mx-auto">
          Cada jogador deve selecionar no próprio celular quem suspeita ser o Assassino.
        </p>
      </div>

      {/* Live Vote Counter Box */}
      <div className="my-auto p-10 md:p-14 rounded-3xl bg-neutral-900/70 border border-neutral-800/90 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
        <div className="text-xs uppercase tracking-widest text-neutral-400 font-semibold mb-2">
          PROGRESSO DA URNA SECRETA
        </div>
        <div className="text-6xl md:text-8xl font-black font-mono tracking-tight text-neutral-100">
          <span className="text-rose-500">{votedCount}</span>
          <span className="text-neutral-600">/{totalAlive}</span>
        </div>
        <p className="text-sm text-neutral-400 mt-3 font-medium">
          {allVoted
            ? 'Todos os votos foram computados! Preparando contagem...'
            : `${votedCount} de ${totalAlive} jogadores confirmaram seu voto`}
        </p>

        {/* Secret dots representation */}
        <div className="flex items-center justify-center gap-3 mt-6">
          {Array.from({ length: totalAlive }).map((_, i) => (
            <span
              key={i}
              className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                i < votedCount
                  ? 'bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.8)] scale-110'
                  : 'bg-neutral-800'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Bottom control */}
      <div className="w-full flex items-center justify-between pt-6 border-t border-neutral-800/60">
        <span className="text-xs text-neutral-500">
          Nenhum voto será revelado até que todos terminem
        </span>

        <button
          onClick={onAdvance}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all ${
            allVoted
              ? 'bg-rose-600 hover:bg-rose-500 text-white cursor-pointer shadow-[0_0_20px_rgba(225,29,72,0.4)]'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 cursor-pointer'
          }`}
        >
          <span>{allVoted ? 'Iniciar Revelação' : 'Encerrar Votação'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
