import { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { PublicGameState } from '../../types';
import { Trophy, Skull, RotateCcw, Award, CheckCircle2, UserCheck, Flame } from 'lucide-react';
import { sound } from '../../utils/audio';

interface TvGameOverProps {
  state: PublicGameState;
  onRestart: () => void;
}

export function TvGameOver({ state, onRestart }: TvGameOverProps) {
  const [showKillerDramatic, setShowKillerDramatic] = useState<boolean>(false);
  const isInvestigatorsWin = state.winner === 'INVESTIGADORES';
  const killer = state.killerPlayer;

  useEffect(() => {
    if (isInvestigatorsWin) {
      sound.playVictory();
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } else {
      sound.playKillerWins();
    }

    // Dramatic pause for killer name reveal
    const timer = setTimeout(() => {
      setShowKillerDramatic(true);
      sound.playBoom();
    }, 2500);

    return () => clearTimeout(timer);
  }, [isInvestigatorsWin]);

  const stats = state.endGameStats;

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-6 py-8 flex flex-col justify-between items-center text-center">
      {/* Top Banner Victory/Defeat */}
      <div className="animate-in fade-in zoom-in-95 duration-700">
        {isInvestigatorsWin ? (
          <div>
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-widest mb-3 shadow-[0_0_25px_rgba(16,185,129,0.2)]">
              <Trophy className="w-4 h-4 text-amber-400" />
              MISSÃO CONCLUÍDA
            </div>
            <h1 className="text-4xl md:text-7xl font-black uppercase tracking-wide font-['Cinzel'] text-neutral-100">
              OS INVESTIGADORES VENCERAM!
            </h1>
            {state.gameOverReason === 'DETECTIVE_KILLED_KILLER' ? (
              <div className="mt-3 inline-block px-5 py-2 rounded-2xl bg-amber-500/20 border-2 border-amber-500 text-amber-300 font-black text-sm md:text-base animate-pulse shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                🛡️ FLAGRANTE PERICIAL: O Assassino tentou atacar o Detetive, foi desarmado e perdeu imediatamente!
              </div>
            ) : (
              <p className="text-sm md:text-base text-neutral-400 mt-2">
                A conspiração foi desfeita e o culpado foi desmascarado antes que pudesse escapar.
              </p>
            )}
          </div>
        ) : (
          <div>
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-black uppercase tracking-widest mb-3 shadow-[0_0_25px_rgba(244,63,94,0.2)]">
              <Skull className="w-4 h-4 text-rose-400" />
              CONSPIRAÇÃO BEM-SUCEDIDA
            </div>
            <h1 className="text-4xl md:text-7xl font-black uppercase tracking-wide font-['Cinzel'] text-rose-500 drop-shadow-[0_0_35px_rgba(225,29,72,0.6)]">
              O ASSASSINO ESCAPOU.
            </h1>
            <p className="text-sm md:text-base text-neutral-400 mt-2">
              O Infiltrado sobreviveu a todas as suspeitas e manipulou os inocentes até o fim.
            </p>
          </div>
        )}
      </div>

      {/* Dramatic Killer Identity Reveal Card */}
      <div className="my-6 w-full max-w-xl">
        <div className="p-6 md:p-8 rounded-3xl bg-neutral-900/80 border-2 border-neutral-800 shadow-2xl relative overflow-hidden">
          <span className="text-xs uppercase tracking-widest text-neutral-400 font-semibold block mb-2 font-mono">
            IDENTIDADE DO INFILTRADO
          </span>

          {!showKillerDramatic ? (
            <div className="py-6 text-2xl font-serif italic text-neutral-400 animate-pulse">
              O assassino era…
            </div>
          ) : killer ? (
            <div className="flex items-center justify-center gap-5 animate-in zoom-in-95 duration-500">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-gradient-to-br ${killer.avatar.bgGradient} border border-white/20 shadow-xl`}
              >
                {killer.avatar.emoji}
              </div>
              <div className="text-left">
                <div className="text-3xl md:text-4xl font-black text-rose-400 uppercase font-['Cinzel'] tracking-wider">
                  {killer.name}
                </div>
                <div className="text-xs text-neutral-400">
                  {killer.avatar.name} • Papel: ASSASSINO
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      {/* End Game Stats & Accolades */}
      {stats && (
        <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-left">
          {/* Best Detective */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-md">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider mb-2">
              <UserCheck className="w-4 h-4" />
              <span>Melhor Investigador</span>
            </div>
            <div className="text-lg font-bold text-neutral-100 truncate">
              {stats.bestDetective?.name || 'Nenhum'}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              Acusou com maior precisão
            </div>
          </div>

          {/* Most Voted */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-md">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
              <Award className="w-4 h-4" />
              <span>Mais Votado</span>
            </div>
            <div className="text-lg font-bold text-neutral-100 truncate">
              {stats.mostVoted?.name || 'Ninguém'}
            </div>
            <div className="text-xs text-neutral-500 mt-1">
              {stats.mostVoted?.count || 0} acusações recebidas
            </div>
          </div>

          {/* Best Liar */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-md">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider mb-2">
              <Flame className="w-4 h-4" />
              <span>Melhor Mentiroso</span>
            </div>
            <div className="text-lg font-bold text-neutral-100 truncate">
              {stats.bestLiar?.name || killer?.name || 'Ninguém'}
            </div>
            <div className="text-xs text-neutral-500 mt-1 truncate">
              {stats.bestLiar?.title || 'Disfarce sob pressão'}
            </div>
          </div>

          {/* Most Suspicious */}
          <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 shadow-md">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Mais Suspeito</span>
            </div>
            <div className="text-lg font-bold text-neutral-100 truncate">
              {stats.mostSuspicious?.name || 'Nenhum'}
            </div>
            <div className="text-xs text-neutral-500 mt-1 truncate">
              Gerou as maiores discussões
            </div>
          </div>
        </div>
      )}

      {/* Play Again Button */}
      <div className="pt-4 border-t border-neutral-800/80 w-full flex items-center justify-center">
        <button
          id="btn-play-again"
          onClick={() => {
            sound.playClick();
            onRestart();
          }}
          className="px-10 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 font-black tracking-wider uppercase text-base flex items-center gap-3 transition-all duration-300 shadow-[0_0_30px_rgba(245,158,11,0.4)] cursor-pointer hover:scale-[1.03]"
        >
          <RotateCcw className="w-5 h-5" />
          <span>JOGAR NOVAMENTE</span>
        </button>
      </div>
    </div>
  );
}
