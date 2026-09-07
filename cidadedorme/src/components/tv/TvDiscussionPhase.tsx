import { useEffect } from 'react';
import { PublicGameState } from '../../types';
import { MessageCircle, Search, ArrowRight, Flame } from 'lucide-react';
import { sound } from '../../utils/audio';

interface TvDiscussionPhaseProps {
  state: PublicGameState;
  onAdvance: () => void;
}

export function TvDiscussionPhase({ state, onAdvance }: TvDiscussionPhaseProps) {
  const seconds = state.timerSeconds;
  const isUrgent = seconds <= 10;
  const isCritical = seconds <= 5;

  useEffect(() => {
    sound.startDrone();
    return () => {
      sound.stopDrone();
    };
  }, []);

  useEffect(() => {
    if (seconds > 0) {
      if (isUrgent) {
        sound.playCountdownBeep(seconds);
        sound.playHeartbeat();
      } else {
        sound.playTick();
        if (seconds % 2 === 0) {
          sound.playHeartbeat();
        }
      }
    }
  }, [seconds, isUrgent]);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div
      className={`flex-1 w-full max-w-5xl mx-auto px-6 py-6 flex flex-col justify-between items-center text-center transition-colors duration-500 ${
        isCritical ? 'bg-red-950/20' : ''
      }`}
    >
      {/* Top Banner */}
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
          <MessageCircle className="w-3.5 h-3.5" />
          MOMENTO DE CONFRONTO
        </div>
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-wide font-['Cinzel'] text-neutral-100">
          VOCÊS TÊM {state.timerMax} SEGUNDOS PARA DISCUTIR
        </h2>
        <p className="text-xs md:text-sm text-neutral-400 mt-1">
          Façam perguntas, observem reações e debatam quem tem o álibi mais fraco!
        </p>
      </div>

      {/* Center Giant Countdown */}
      <div className="my-auto py-6">
        {isUrgent ? (
          <div className="animate-pulse">
            <div className="text-8xl md:text-[140px] font-black font-mono tracking-tighter text-rose-500 drop-shadow-[0_0_50px_rgba(244,63,94,0.8)] leading-none">
              {seconds}
            </div>
            <div className="flex items-center justify-center gap-2 mt-2 text-rose-400 font-bold uppercase tracking-widest text-sm animate-bounce">
              <Flame className="w-4 h-4 fill-current" />
              TEMPO ACABANDO! PREPAREM OS VOTOS!
            </div>
          </div>
        ) : (
          <div className="p-8 md:p-12 rounded-3xl bg-neutral-900/60 border border-neutral-800 backdrop-blur-xl shadow-2xl inline-block">
            <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold block mb-1">
              TEMPO RESTANTE
            </span>
            <div className="text-6xl md:text-8xl font-black font-mono tracking-wider text-amber-400 drop-shadow-[0_0_30px_rgba(245,158,11,0.3)]">
              {formatTimer(seconds)}
            </div>
          </div>
        )}
      </div>

      {/* Clues Discovered Bar */}
      <div className="w-full max-w-3xl my-4">
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-left">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
            <Search className="w-3.5 h-3.5" />
            <span>Pistas Identificadas até agora ({state.clues.length})</span>
          </div>

          {state.clues.length > 0 ? (
            <div className="space-y-2">
              {state.clues.slice(-2).map((clue) => (
                <div
                  key={clue.id}
                  className="p-3 rounded-xl bg-neutral-950 border border-neutral-800/80 text-xs md:text-sm text-neutral-200 font-medium flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  <span>{clue.text}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-neutral-500 italic">
              Nenhuma pista adicional descoberta ainda nesta rodada.
            </p>
          )}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="w-full flex items-center justify-between pt-4 border-t border-neutral-800/60">
        <span className="text-xs text-neutral-500">
          A votação nos celulares começará automaticamente ao zerar o tempo
        </span>

        <button
          onClick={onAdvance}
          className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer shadow-[0_0_20px_rgba(225,29,72,0.3)]"
        >
          <span>Ir para Votação Agora</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
