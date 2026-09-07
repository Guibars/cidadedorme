import { PublicGameState } from '../../types';
import { Vote, ArrowRight } from 'lucide-react';

interface TvVotingPhaseProps {
  state: PublicGameState;
  onAdvance: () => void;
}

export function TvVotingPhase({ state, onAdvance }: TvVotingPhaseProps) {
  const votedCount = state.activeVotesCount;
  const allVoted = votedCount >= 1; // Only 1 vote now (the detective)
  const detectivePlayer = state.players.find(p => p.role === 'DETETIVE');
  const detectiveAlive = detectivePlayer?.isAlive;

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 flex flex-col justify-between items-center text-center">
      {/* Top Banner */}
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-4">
          <Vote className="w-3.5 h-3.5" />
          VOTO OFICIAL DO DETETIVE
        </div>
        <h2 className="text-4xl md:text-6xl font-black uppercase tracking-wider font-['Cinzel'] text-neutral-100">
          QUEM SERÁ PRESO?
        </h2>
        <p className="mt-3 text-base md:text-lg text-neutral-400 max-w-xl mx-auto">
          {detectiveAlive 
            ? 'O Detetive está tomando a decisão final no celular.' 
            : 'O Detetive está morto! O tribunal decidirá através de um sorteio caótico.'}
        </p>
      </div>

      {/* Live Vote Counter Box */}
      <div className="my-auto p-10 md:p-14 rounded-3xl bg-neutral-900/70 border border-neutral-800/90 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden">
        <div className="text-xs uppercase tracking-widest text-neutral-400 font-semibold mb-2">
          STATUS DA DECISÃO
        </div>
        <div className="text-5xl md:text-7xl font-black font-mono tracking-tight text-neutral-100 py-4">
          {allVoted ? (
             <span className="text-cyan-400">VOTO REGISTRADO</span>
          ) : (
             <span className="text-neutral-600 animate-pulse">AGUARDANDO...</span>
          )}
        </div>
        <p className="text-sm text-neutral-400 mt-3 font-medium">
          {allVoted
            ? 'A decisão foi tomada. Preparando revelação...'
            : 'O Detetive está avaliando as pistas...'}
        </p>
      </div>

      {/* Bottom control */}
      <div className="w-full flex items-center justify-between pt-6 border-t border-neutral-800/60">
        <span className="text-xs text-neutral-500">
          A identidade do acusado será revelada a seguir
        </span>

        <button
          onClick={onAdvance}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all ${
            allVoted
              ? 'bg-cyan-600 hover:bg-cyan-500 text-white cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)]'
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
