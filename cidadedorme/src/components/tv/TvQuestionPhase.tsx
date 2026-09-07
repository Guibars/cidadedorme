import { PublicGameState } from '../../types';
import { HelpCircle, Clock, CheckCircle2, ArrowRight } from 'lucide-react';

interface TvQuestionPhaseProps {
  state: PublicGameState;
  onAdvance: () => void;
}

export function TvQuestionPhase({ state, onAdvance }: TvQuestionPhaseProps) {
  const question = state.currentQuestion;
  const answeredCount = state.players.filter((p) => p.hasAnswered).length;
  const totalAlive = state.players.filter((p) => p.isAlive).length;
  const allAnswered = answeredCount === totalAlive;

  if (!question) return null;

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-8 flex flex-col justify-between items-center text-center">
      {/* Category & Timer Bar */}
      <div className="w-full flex items-center justify-between gap-4 mb-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" />
          {question.categoryLabel}
        </div>

        <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-neutral-900 border border-neutral-800 text-amber-400 text-sm font-mono font-bold">
          <Clock className="w-4 h-4" />
          <span>{state.timerSeconds}s</span>
        </div>
      </div>

      {/* Crime Context & Question Card */}
      <div className="w-full p-8 md:p-12 rounded-3xl bg-neutral-900/70 border border-neutral-800/90 backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] my-auto relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-neutral-800">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-amber-500 transition-all duration-1000 ease-linear"
            style={{ width: `${(state.timerSeconds / state.timerMax) * 100}%` }}
          />
        </div>

        <p className="text-sm md:text-base text-neutral-400 font-serif italic mb-6 max-w-3xl mx-auto leading-relaxed">
          "{question.context}"
        </p>

        <h2 className="text-3xl md:text-5xl font-black text-neutral-100 font-['Cinzel'] tracking-wide leading-tight max-w-4xl mx-auto drop-shadow-md">
          {question.question}
        </h2>

        {/* Live response tally */}
        <div className="mt-10 inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-neutral-950/80 border border-neutral-800 shadow-inner">
          <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
          <span className="text-sm md:text-base font-bold text-neutral-300">
            {answeredCount} de {totalAlive} jogadores responderam pelo celular
          </span>
        </div>
      </div>

      {/* Bottom Status & Host Skip */}
      <div className="w-full flex items-center justify-between pt-6 border-t border-neutral-800/60">
        <div className="flex items-center gap-2 text-xs text-neutral-500">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>As respostas estão ocultas e serão reveladas a todos juntas</span>
        </div>

        <button
          onClick={onAdvance}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all ${
            allAnswered
              ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.3)]'
              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 cursor-pointer'
          }`}
        >
          <span>{allAnswered ? 'Revelar Respostas' : 'Encerrar e Revelar'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
