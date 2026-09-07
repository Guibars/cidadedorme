import { useState, useEffect } from 'react';
import { PrivatePlayerData, PublicGameState } from '../../types';
import { Moon, EyeOff, Skull, Shield, Search, Check, AlertCircle } from 'lucide-react';
import { sound } from '../../utils/audio';

interface MobileNightActionProps {
  privateData: PrivatePlayerData;
  publicState: PublicGameState;
  onKill: (targetPlayerId: string) => void;
  onInvestigate: (targetPlayerId: string) => void;
}

export function MobileNightAction({
  privateData,
  publicState,
  onKill,
  onInvestigate,
}: MobileNightActionProps) {
  const player = privateData.player;
  const isKiller = player.role === 'ASSASSINO';
  const isDetective = player.role === 'DETETIVE';
  const isVictim = privateData.isNightVictim || !player.isAlive;

  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(
    privateData.nightTargetId || null
  );
  const [hasConfirmedKill, setHasConfirmedKill] = useState(
    privateData.nightActionSubmitted || false
  );

  useEffect(() => {
    // Vibrate and play atmospheric night fall sound on mobile when night starts
    sound.triggerNightFallVibrate();
    sound.playNightFall();
  }, []);

  useEffect(() => {
    if (isVictim) {
      sound.triggerVictimDeathVibrate();
      sound.playKillStab();
    }
  }, [isVictim]);

  const aliveTargets = publicState.players.filter(
    (p) => p.isAlive && p.id !== player.id
  );

  const handleSelectKill = (targetId: string) => {
    if (hasConfirmedKill) return;
    sound.playClick();
    sound.triggerVoteCastVibrate();
    setSelectedTargetId(targetId);
    setHasConfirmedKill(true);
    onKill(targetId);
  };

  const handleInvestigate = (targetId: string) => {
    sound.playClick();
    sound.triggerVibrate(60);
    onInvestigate(targetId);
  };

  // Case 1: Player was killed this night
  if (isVictim) {
    return (
      <div className="flex-1 p-6 flex flex-col justify-center items-center text-center bg-black text-white relative">
        <div className="w-24 h-24 rounded-full bg-red-900/30 border-2 border-red-600 flex items-center justify-center text-red-500 mb-6 animate-pulse">
          <Skull className="w-12 h-12" />
        </div>

        <h1 className="text-3xl font-black uppercase tracking-wider text-red-500 font-['Bebas_Neue',sans-serif]">
          VOCÊ FOI ELIMINADO!
        </h1>

        <p className="text-base text-neutral-300 mt-3 max-w-xs leading-relaxed">
          O Assassino atacou você nesta noite.
          <br />
          <strong className="text-red-400">Permaneça com os olhos fechados</strong> até todos acordarem para não estragar a surpresa!
        </p>
      </div>
    );
  }

  // Case 2: Player is the Assassin
  if (isKiller) {
    return (
      <div className="flex-1 p-5 flex flex-col justify-between bg-[#141414] text-white">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/60 border border-red-600/40 text-red-400 text-xs font-black uppercase tracking-widest mb-3">
            <Skull className="w-3.5 h-3.5" />
            <span>SUA VEZ • ASSASSINO</span>
          </div>

          <h2 className="text-2xl font-black uppercase tracking-wide font-['Bebas_Neue',sans-serif] text-white">
            ESCOLHA SUA VÍTIMA
          </h2>

          <p className="text-xs text-neutral-300 mt-1">
            Mantenha a cabeça serena. Toque em um jogador abaixo para eliminá-lo em silêncio:
          </p>
        </div>

        {/* Targets Selection */}
        <div className="my-4 space-y-2.5 flex-1 overflow-y-auto">
          {aliveTargets.map((target) => {
            const isSelected = selectedTargetId === target.id;

            return (
              <button
                key={target.id}
                onClick={() => handleSelectKill(target.id)}
                disabled={hasConfirmedKill}
                className={`w-full p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-red-900/50 border-red-500 shadow-[0_0_20px_rgba(229,9,20,0.5)]'
                    : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                } ${hasConfirmedKill && !isSelected ? 'opacity-40' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gradient-to-br ${target.avatar.bgGradient}`}
                  >
                    {target.avatar.emoji}
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-bold block text-white">
                      {target.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">
                      {target.avatar.name}
                    </span>
                  </div>
                </div>

                {isSelected ? (
                  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-bold">
                    <Check className="w-5 h-5" />
                  </div>
                ) : (
                  <span className="text-xs text-red-400 font-bold uppercase tracking-wider">
                    Eliminar
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Feedback / Instructions */}
        <div className="p-3 rounded-xl bg-black/60 border border-neutral-800 text-center">
          {hasConfirmedKill ? (
            <div className="text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>Vítima marcada! Finja que está dormindo agora.</span>
            </div>
          ) : (
            <div className="text-neutral-400 text-xs flex items-center justify-center gap-1.5">
              <EyeOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Tempo restante: {publicState.timerSeconds}s</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Case 3: Player is the Detective
  if (isDetective) {
    return (
      <div className="flex-1 p-5 flex flex-col justify-between bg-[#141414] text-white">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-600/40 text-blue-400 text-xs font-black uppercase tracking-widest mb-3">
            <Search className="w-3.5 h-3.5" />
            <span>INVESTIGAÇÃO NOTURNA • DETETIVE</span>
          </div>

          <h2 className="text-2xl font-black uppercase tracking-wide font-['Bebas_Neue',sans-serif] text-white">
            INVESTIGAR SUSPEITO
          </h2>

          <p className="text-xs text-neutral-300 mt-1">
            Você pode investigar secretamente 1 jogador esta noite:
          </p>
        </div>

        {privateData.detectiveInvestigationResult ? (
          <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/50 my-auto text-center">
            <span className="text-xs uppercase tracking-widest text-blue-400 font-mono font-bold block mb-1">
              RELATÓRIO CONFIDENCIAL
            </span>
            <p className="text-sm text-neutral-100 font-medium">
              {privateData.detectiveInvestigationResult.resultText}
            </p>
          </div>
        ) : (
          <div className="my-4 space-y-2.5 flex-1 overflow-y-auto">
            {aliveTargets.map((target) => (
              <button
                key={target.id}
                onClick={() => handleInvestigate(target.id)}
                className="w-full p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-blue-500 flex items-center justify-between transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gradient-to-br ${target.avatar.bgGradient}`}
                  >
                    {target.avatar.emoji}
                  </div>
                  <span className="text-sm font-bold text-white">
                    {target.name}
                  </span>
                </div>
                <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                  Investigar
                </span>
              </button>
            ))}
          </div>
        )}

        <div className="p-3 rounded-xl bg-black/60 border border-neutral-800 text-center text-neutral-400 text-xs">
          Mantenha a cabeça baixa até o amanhecer!
        </div>
      </div>
    );
  }

  // Case 4: Innocent Player (Sleeping)
  return (
    <div className="flex-1 p-6 flex flex-col justify-center items-center text-center bg-[#0d0d0d] text-white relative overflow-hidden">
      {/* Soft Moon Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-950/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-indigo-950/40 border border-indigo-700/40 flex items-center justify-center text-indigo-400 mb-6 shadow-[0_0_40px_rgba(99,102,241,0.2)] animate-pulse">
          <Moon className="w-12 h-12" />
        </div>

        <h1 className="text-4xl font-black uppercase font-['Bebas_Neue',sans-serif] tracking-widest text-white">
          FECHE OS OLHOS!
        </h1>

        <p className="text-base text-neutral-300 mt-3 max-w-xs leading-relaxed font-medium">
          A cidade está dormindo...
          <br />
          Mantenha a cabeça baixa e fique em silêncio absoluto até todos acordarem.
        </p>

        <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full bg-black/70 border border-neutral-800 text-xs font-mono text-neutral-400">
          <EyeOff className="w-4 h-4 text-neutral-500" />
          <span>Aguarde o nascer do sol...</span>
        </div>
      </div>
    </div>
  );
}
