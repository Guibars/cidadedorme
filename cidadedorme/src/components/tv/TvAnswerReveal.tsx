import { useEffect } from 'react';
import { PublicGameState } from '../../types';
import { MessageSquareQuote, ArrowRight } from 'lucide-react';
import { sound } from '../../utils/audio';

interface TvAnswerRevealProps {
  state: PublicGameState;
  onAdvance: () => void;
}

export function TvAnswerReveal({ state, onAdvance }: TvAnswerRevealProps) {
  useEffect(() => {
    sound.playVoteReveal();
  }, []);

  const answers = state.answers || [];

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 flex flex-col justify-between items-center text-center">
      {/* Heading */}
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-3">
          <MessageSquareQuote className="w-3.5 h-3.5" />
          ÁLIBIS & RESPOSTAS DECLARADAS
        </div>
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-wide font-['Cinzel'] text-neutral-100">
          O QUE CADA UM DISSE?
        </h2>
        <p className="mt-2 text-sm md:text-base text-neutral-400">
          Analise as contradições. Alguém mentiu para proteger seus passos.
        </p>
      </div>

      {/* Answers Grid */}
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4 my-8">
        {answers.map((item, index) => (
          <div
            key={item.playerId}
            style={{ animationDelay: `${index * 150}ms` }}
            className="p-5 rounded-2xl bg-neutral-900/80 border border-neutral-800 shadow-xl flex items-center justify-between gap-4 text-left animate-in fade-in slide-in-from-bottom-3 duration-500 hover:border-neutral-700 transition-colors"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-12 h-12 rounded-xl shrink-0 flex items-center justify-center text-2xl bg-gradient-to-br ${item.avatar.bgGradient} shadow-inner`}
              >
                {item.avatar.emoji}
              </div>
              <div className="min-w-0">
                <h4 className="text-base font-bold text-neutral-200 truncate">{item.playerName}</h4>
                <span className="text-xs text-neutral-500">{item.avatar.name}</span>
              </div>
            </div>

            <div className="px-4 py-2 rounded-xl bg-neutral-950 border border-neutral-800/80 text-amber-300 font-semibold text-sm max-w-[220px] text-right shadow-inner">
              {item.answer}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom control */}
      <div className="w-full flex items-center justify-between pt-6 border-t border-neutral-800/60">
        <span className="text-xs text-neutral-500">
          Preparando fase de discussão presencial...
        </span>

        <button
          onClick={onAdvance}
          className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)]"
        >
          <span>Iniciar Discussão</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
