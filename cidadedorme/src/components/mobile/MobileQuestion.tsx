import { useState } from 'react';
import { Player, QuestionScenario } from '../../types';
import { Check, HelpCircle, Flame, ShieldAlert } from 'lucide-react';
import { sound } from '../../utils/audio';

interface MobileQuestionProps {
  player: Player;
  question: QuestionScenario;
  killerHint?: string;
  onSubmitAnswer: (answer: string) => void;
}

export function MobileQuestion({
  player,
  question,
  killerHint,
  onSubmitAnswer,
}: MobileQuestionProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(player.currentAnswer || null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(Boolean(player.currentAnswer));

  const handleSelect = (option: string) => {
    if (isSubmitted) return;
    setSelectedOption(option);
    sound.playClick();
    sound.triggerVibrate(30);
  };

  const handleConfirm = () => {
    if (!selectedOption || isSubmitted) return;
    setIsSubmitted(true);
    sound.playClick();
    sound.triggerVibrate([40, 80]);
    onSubmitAnswer(selectedOption);
  };

  const isKiller = player.role === 'ASSASSINO';

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-5 max-w-md mx-auto bg-neutral-950 text-neutral-100">
      {/* Top Bar */}
      <div className="pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">{player.avatar.emoji}</span>
            <span className="text-xs font-bold text-neutral-300">{player.name}</span>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-400">
            {question.categoryLabel}
          </span>
        </div>
      </div>

      {/* Question Card */}
      <div className="my-auto py-4">
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 mb-4 text-left">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-wider mb-1.5">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>SITUAÇÃO DO CRIME</span>
          </div>
          <p className="text-xs text-neutral-400 italic mb-3 leading-relaxed">
            "{question.context}"
          </p>
          <h3 className="text-base md:text-lg font-bold text-neutral-100 font-['Cinzel'] tracking-wide">
            {question.question}
          </h3>
        </div>

        {/* Killer Secret Hint */}
        {isKiller && killerHint && (
          <div className="p-3 mb-4 rounded-xl bg-rose-950/40 border border-rose-600/50 text-left animate-in fade-in">
            <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 uppercase tracking-wider mb-1">
              <Flame className="w-3.5 h-3.5" />
              <span>DICA EXCLUSIVA DO ASSASSINO</span>
            </div>
            <p className="text-xs text-rose-200/90 leading-relaxed font-medium">
              {killerHint}
            </p>
          </div>
        )}

        {/* Options List */}
        <div className="space-y-2.5">
          {question.options.map((option, idx) => {
            const isSelected = selectedOption === option;

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelect(option)}
                disabled={isSubmitted}
                className={`w-full p-4 rounded-xl text-left font-medium text-sm transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-rose-600/20 border-2 border-rose-500 text-neutral-100 shadow-[0_0_15px_rgba(225,29,72,0.2)]'
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:border-neutral-700 active:bg-neutral-800'
                } ${isSubmitted && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span>{option}</span>
                {isSelected && (
                  <div className="w-6 h-6 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0 ml-2">
                    <Check className="w-3.5 h-3.5" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Confirm Button */}
        {!isSubmitted ? (
          <button
            onClick={handleConfirm}
            disabled={!selectedOption}
            className={`w-full py-4 mt-5 rounded-xl font-bold tracking-wider uppercase text-sm flex items-center justify-center gap-2 transition-all ${
              selectedOption
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-neutral-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] cursor-pointer'
                : 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
            }`}
          >
            <span>CONFIRMAR RESPOSTA</span>
          </button>
        ) : (
          <div className="mt-5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center animate-in fade-in">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
              ✓ Resposta confirmada em segredo
            </span>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Aguarde a revelação no telão da TV.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pb-2 text-center text-xs text-neutral-600">
        Sua resposta será exibida junto com a dos outros no telão
      </div>
    </div>
  );
}
