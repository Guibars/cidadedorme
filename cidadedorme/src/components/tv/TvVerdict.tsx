import { useEffect, useState } from 'react';
import { PublicGameState } from '../../types';
import { Skull, ShieldX, Sparkles } from 'lucide-react';
import { sound } from '../../utils/audio';

interface TvVerdictProps {
  state: PublicGameState;
}

export function TvVerdict({ state }: TvVerdictProps) {
  const [countdown, setCountdown] = useState<number>(3);
  const [revealed, setRevealed] = useState<boolean>(false);

  const eliminated = state.eliminatedPlayer;
  const isKiller = eliminated?.role === 'ASSASSINO';

  useEffect(() => {
    // 3, 2, 1 countdown
    const t3 = setTimeout(() => {
      setCountdown(2);
      sound.playCountdownBeep(2);
    }, 1200);

    const t2 = setTimeout(() => {
      setCountdown(1);
      sound.playCountdownBeep(1);
    }, 2400);

    const t1 = setTimeout(() => {
      setRevealed(true);
      if (eliminated) {
        if (isKiller) {
          sound.playVictory();
        } else {
          sound.playInnocentEliminated();
        }
      }
    }, 3600);

    return () => {
      clearTimeout(t3);
      clearTimeout(t2);
      clearTimeout(t1);
    };
  }, [eliminated, isKiller]);

  if (!eliminated) {
    return (
      <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-12 flex flex-col justify-center items-center text-center">
        <div className="p-12 rounded-3xl bg-neutral-900/80 border border-neutral-800 shadow-2xl">
          <h2 className="text-4xl md:text-5xl font-black uppercase font-['Cinzel'] text-neutral-200 mb-4">
            SEM ACUSAÇÃO CONFIRMADA
          </h2>
          <p className="text-base text-neutral-400 max-w-md mx-auto">
            O detetive não confirmou uma acusação a tempo. Ninguém foi preso nesta rodada.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-6 py-8 flex flex-col justify-between items-center text-center">
      {/* Top Heading */}
      <div>
        <div className="text-sm font-bold uppercase tracking-widest text-neutral-400 mb-2 font-mono">
          O VEREDITO DO GRUPO
        </div>
        <h2 className="text-4xl md:text-6xl font-black uppercase font-['Cinzel'] text-neutral-100">
          {eliminated.name}
        </h2>
        <p className="text-sm md:text-base text-neutral-400 mt-2">
          Foi a pessoa acusada pelo detetive após ouvir os relatos.
        </p>
      </div>

      {/* Center dramatic reveal */}
      <div className="my-auto w-full max-w-2xl">
        {!revealed ? (
          <div className="p-12 rounded-3xl bg-neutral-900/70 border border-neutral-800 backdrop-blur-xl shadow-2xl">
            <p className="text-lg md:text-xl text-neutral-300 font-serif italic mb-6">
              Será que vocês encontraram o assassino?
            </p>
            <div className="text-8xl md:text-9xl font-black font-mono text-amber-400 animate-pulse">
              {countdown}
            </div>
          </div>
        ) : (
          <div
            className={`p-10 md:p-14 rounded-3xl border-2 backdrop-blur-2xl shadow-2xl animate-in zoom-in-95 duration-700 ${
              isKiller
                ? 'bg-emerald-950/60 border-emerald-500/80 shadow-[0_0_80px_rgba(16,185,129,0.4)]'
                : 'bg-rose-950/60 border-rose-500/80 shadow-[0_0_80px_rgba(225,29,72,0.4)]'
            }`}
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl flex items-center justify-center text-4xl shadow-xl bg-neutral-950/80 border border-white/10">
              {eliminated.avatar.emoji}
            </div>

            {isKiller ? (
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-widest mb-3">
                  <Sparkles className="w-4 h-4" />
                  ALVO LOCALIZADO
                </div>
                <h3 className="text-4xl md:text-6xl font-black uppercase tracking-wide font-['Cinzel'] text-emerald-400 drop-shadow-[0_0_25px_rgba(52,211,153,0.8)]">
                  VOCÊS ENCONTRARAM O ASSASSINO!
                </h3>
                <p className="mt-4 text-base md:text-lg text-emerald-200/90 font-medium">
                  {eliminated.name} era o Infiltrado! Os investigadores venceram a partida!
                </p>
              </div>
            ) : (
              <div>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-black uppercase tracking-widest mb-3">
                  <ShieldX className="w-4 h-4" />
                  ERRO FATAL
                </div>
                <h3 className="text-4xl md:text-6xl font-black uppercase tracking-wide font-['Cinzel'] text-rose-400 drop-shadow-[0_0_25px_rgba(244,63,94,0.8)]">
                  VOCÊS ERRARAM.
                </h3>
                <p className="mt-4 text-base md:text-lg text-rose-200/90 font-medium">
                  {eliminated.name} era <span className="underline font-bold">INOCENTE</span> e foi eliminado injustamente! O Assassino continua solto...
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="text-xs text-neutral-500 font-medium">
        Calculando próximos passos da investigação...
      </div>
    </div>
  );
}
