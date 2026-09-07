import { PublicGameState } from '../../types';
import { Eye, Award } from 'lucide-react';

interface TvVoteRevealProps {
  state: PublicGameState;
}

const STEP_LABELS = [
  'PRIMEIRO VOTO…',
  'SEGUNDO VOTO…',
  'TERCEIRO VOTO…',
  'QUARTO VOTO…',
  'QUINTO VOTO…',
];

export function TvVoteReveal({ state }: TvVoteRevealProps) {
  const revealedVotes = state.revealedVotes || [];
  const currentStep = state.voteRevealStep;
  const currentVote = revealedVotes[currentStep - 1];

  // Calculate vote totals for the votes revealed so far
  const tallies: Record<string, number> = {};
  revealedVotes.slice(0, currentStep).forEach((v) => {
    tallies[v.targetName] = (tallies[v.targetName] || 0) + 1;
  });

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 flex flex-col justify-between items-center text-center">
      {/* Top Banner */}
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider mb-4">
          <Eye className="w-3.5 h-3.5" />
          APURAÇÃO DOS VOTOS
        </div>
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-wide font-['Cinzel'] text-neutral-100">
          QUEM FOI APONTADO?
        </h2>
      </div>

      {/* Main Cinematic Reveal Card */}
      <div className="my-auto w-full max-w-xl">
        {currentVote ? (
          <div
            key={currentStep}
            className="p-10 md:p-14 rounded-3xl bg-neutral-900/80 border-2 border-rose-500/50 backdrop-blur-2xl shadow-[0_0_60px_rgba(225,29,72,0.3)] animate-in zoom-in-95 duration-500 relative overflow-hidden"
          >
            <div className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-2 font-mono">
              {STEP_LABELS[currentStep - 1] || `VOTO NÚMERO ${currentStep}…`}
            </div>

            <div className="text-4xl md:text-6xl font-black text-rose-400 uppercase tracking-wider font-['Cinzel'] my-4 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]">
              {currentVote.targetName}
            </div>

            <div className="text-xs text-neutral-400 font-medium">
              Votado por: <span className="text-neutral-200 font-semibold">{currentVote.voterName}</span>
            </div>
          </div>
        ) : (
          <div className="p-10 rounded-3xl bg-neutral-900/40 border border-neutral-800 text-neutral-400 animate-pulse">
            Abrindo a urna dos votos...
          </div>
        )}

        {/* Live Running Tally */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {Object.entries(tallies).map(([name, count]) => (
            <div
              key={name}
              className="px-4 py-2 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-center gap-2 text-sm font-bold text-neutral-200 shadow-md"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>{name}:</span>
              <span className="text-rose-400 font-mono text-base font-black">{count} {count === 1 ? 'voto' : 'votos'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-neutral-500 font-medium">
        Revelando voto a voto... Aguarde o veredito final
      </div>
    </div>
  );
}
