import { useEffect } from 'react';
import { PublicGameState } from '../../types';
import { MessageCircle, Search, ArrowRight, Flame, MapPin } from 'lucide-react';
import { sound } from '../../utils/audio';
import { MansionMap } from '../common/MansionMap';

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
      className={`flex-1 w-full max-w-6xl mx-auto px-6 py-4 flex flex-col justify-between items-center text-center transition-colors duration-500 select-none ${
        isCritical ? 'bg-red-950/20' : ''
      }`}
    >
      {/* Top Banner */}
      <div>
        <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-1">
          <MessageCircle className="w-3.5 h-3.5" />
          DEBATE NA MANSÃO (AMONG US)
        </div>
        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-wide font-['Cinzel'] text-neutral-100">
          DISCUSSÃO ABERTA DOS JOGADORES
        </h2>
        <p className="text-xs md:text-sm text-neutral-400 mt-0.5">
          Perguntem onde cada um estava na casa e debatam as inconsistências antes da votação!
        </p>
      </div>

      {/* Detective Formal Accusation Banner on TV */}
      {state.detectiveAccusation && (
        <div className="w-full my-2 p-3.5 rounded-2xl bg-amber-500/15 border-2 border-amber-500/80 shadow-[0_0_35px_rgba(245,158,11,0.3)] animate-in zoom-in-95 duration-500 flex items-center justify-between text-left">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-2xl shadow-md shrink-0">
              🔍
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block">
                🚨 ACUSAÇÃO FORMAL DO DETETIVE ({state.detectiveAccusation.detectiveName})
              </span>
              <h4 className="text-xl md:text-2xl font-black text-white font-['Cinzel'] uppercase">
                "{state.detectiveAccusation.accusedPlayerName} É O ASSASSINO!"
              </h4>
              <p className="text-xs text-amber-200/90 mt-0.5">
                O Detetive investigou e aponta com convicção este suspeito para o julgamento!
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-black text-xs uppercase tracking-wider shrink-0 shadow-md">
            MANDADO EXPEDIDO
          </div>
        </div>
      )}

      {/* Main Content Area: Map & Countdown side by side or stacked */}
      <div className="w-full my-2 flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left / Center: Mansion Map */}
        <div className="flex-1 w-full bg-neutral-900/70 p-4 rounded-3xl border border-neutral-800 backdrop-blur-md shadow-xl">
          <MansionMap
            players={state.players}
            highlightRoomId={state.nightCrimeRoomId}
            victimPlayerId={state.nightVictim?.id}
            compact={true}
            title={
              state.nightCrimeRoomName
                ? `Cena: Crime na(o) ${state.nightCrimeRoomName} • Onde cada um estava:`
                : 'Posicionamento dos Suspeitos na Casa'
            }
          />
        </div>

        {/* Right: Giant Timer & Clues */}
        <div className="w-full lg:w-72 flex flex-col items-center gap-3">
          {isUrgent ? (
            <div className="p-6 rounded-3xl bg-rose-950/40 border border-rose-600/50 text-center animate-pulse w-full">
              <span className="text-[10px] uppercase tracking-widest text-rose-300 font-bold block mb-1">
                TEMPO ACABANDO
              </span>
              <div className="text-6xl font-black font-mono tracking-tighter text-rose-500 leading-none">
                {seconds}s
              </div>
              <div className="flex items-center justify-center gap-1.5 mt-2 text-rose-400 font-bold uppercase tracking-wider text-[11px]">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>Preparem os votos!</span>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-3xl bg-neutral-900/90 border border-neutral-800 text-center w-full shadow-lg">
              <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold block mb-1">
                TEMPO RESTANTE
              </span>
              <div className="text-5xl font-black font-mono tracking-wider text-amber-400">
                {formatTimer(seconds)}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Bottom controls */}
      <div className="w-full flex items-center justify-between pt-2 border-t border-neutral-800/60">
        <span className="text-xs text-neutral-500">
          Apenas o Detetive poderá votar ao zerar o tempo ({seconds}s)
        </span>

        <button
          onClick={onAdvance}
          className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold tracking-wider uppercase flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_0_20px_rgba(225,29,72,0.3)]"
        >
          <span>Ir para Votação Agora</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
