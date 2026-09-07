import { useState, useEffect } from 'react';
import { PrivatePlayerData, PublicGameState, MansionRoomId } from '../../types';
import { Moon, EyeOff, Skull, Search, Check, AlertCircle, Sparkles, MapPin } from 'lucide-react';
import { sound } from '../../utils/audio';
import { MANSION_ROOMS } from '../../data/mansion';

interface MobileNightActionProps {
  privateData: PrivatePlayerData;
  publicState: PublicGameState;
  onKill: (targetPlayerId: string, crimeRoomId?: string) => void;
  onInvestigate: (targetPlayerId: string) => void;
  onSelectRoom?: (roomId: string) => void;
}

export function MobileNightAction({
  privateData,
  publicState,
  onKill,
  onInvestigate,
  onSelectRoom,
}: MobileNightActionProps) {
  const player = privateData.player;
  const isKiller = player.role === 'ASSASSINO';
  const isDetective = player.role === 'DETETIVE';
  const isVictim = privateData.isNightVictim || !player.isAlive;
  const phase = publicState.phase;

  // Assassin local state
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(
    privateData.nightTargetId || null
  );
  const [selectedCrimeRoom, setSelectedCrimeRoom] = useState<MansionRoomId>(
    (player.currentRoomId as MansionRoomId) || 'kitchen'
  );
  const [hasConfirmedKill, setHasConfirmedKill] = useState(
    privateData.nightActionSubmitted || false
  );
  const [isStrikingKnife, setIsStrikingKnife] = useState(false);

  // Detective local state
  const [hasInvestigated, setHasInvestigated] = useState(
    privateData.hasUsedAbility || false
  );

  useEffect(() => {
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

  const handleExecuteKill = () => {
    if (!selectedTargetId || hasConfirmedKill) return;
    setIsStrikingKnife(true);
    sound.playKnifeSlash();
    sound.triggerVictimDeathVibrate();

    setTimeout(() => {
      setHasConfirmedKill(true);
      setIsStrikingKnife(false);
      onKill(selectedTargetId, selectedCrimeRoom);
    }, 400);
  };

  const handleInvestigate = (targetId: string) => {
    if (hasInvestigated) return;
    sound.playClick();
    sound.triggerVibrate(60);
    setHasInvestigated(true);
    onInvestigate(targetId);
  };

  // ----------------------------------------------------
  // CASE 1: PLAYER IS DEAD / VICTIM
  // ----------------------------------------------------
  if (isVictim) {
    return (
      <div className="flex-1 p-6 flex flex-col justify-center items-center text-center bg-black text-white relative">
        <div className="w-24 h-24 rounded-full bg-red-900/30 border-2 border-red-600 flex items-center justify-center text-red-500 mb-6 animate-pulse shadow-[0_0_40px_rgba(225,29,72,0.5)]">
          <Skull className="w-12 h-12" />
        </div>

        <h1 className="text-3xl font-black uppercase tracking-wider text-red-500 font-['Cinzel',sans-serif]">
          VOCÊ FOI ELIMINADO!
        </h1>

        <p className="text-base text-neutral-300 mt-3 max-w-xs leading-relaxed">
          A lâmina do assassino atingiu você no escuro da mansão.
          <br />
          <strong className="text-red-400">Permaneça com os olhos fechados</strong> até o amanhecer para não revelar sua morte antecipadamente!
        </p>

        <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/80 border border-red-900/50 text-xs font-mono text-red-300">
          <EyeOff className="w-4 h-4 text-red-400" />
          <span>Fique em silêncio absoluto...</span>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // CASE 2: KILLER TURN (phase === 'NIGHT_KILLER' or 'NIGHT_FALL')
  // ----------------------------------------------------
  if (isKiller && (phase === 'NIGHT_KILLER' || phase === 'NIGHT_FALL')) {
    return (
      <div className="flex-1 p-5 flex flex-col justify-between bg-neutral-950 text-white select-none overflow-y-auto">
        <div>
          {/* Header Badge */}
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-600/50 text-rose-400 text-xs font-black uppercase tracking-widest">
              <Skull className="w-3.5 h-3.5" />
              <span>SUA VEZ • TURNO DO ASSASSINO</span>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400">
              ⏱️ {publicState.timerSeconds}s
            </span>
          </div>

          <h2 className="text-2xl font-black uppercase tracking-wide font-['Cinzel',sans-serif] text-neutral-100">
            EMBOSCADA NA MANSÃO
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Selecione o cômodo para atacar e escolha sua vítima com a faca:
          </p>

          {/* Interactive Knife Graphic */}
          <div className="my-3 p-3 rounded-2xl bg-gradient-to-r from-rose-950/50 via-neutral-900 to-rose-950/50 border border-rose-900/60 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl bg-rose-900/40 border border-rose-600/60 flex items-center justify-center text-2xl shadow-inner transition-transform ${
                  isStrikingKnife ? 'scale-125 rotate-45 text-red-500' : 'rotate-12'
                }`}
              >
                🔪
              </div>
              <div>
                <h4 className="text-xs font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-1.5">
                  Faca de Aço Afiada
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                </h4>
                <p className="text-[10px] text-neutral-400">
                  {selectedTargetId
                    ? `Alvo travado: ${publicState.players.find((p) => p.id === selectedTargetId)?.name}`
                    : 'Nenhuma vítima selecionada ainda'}
                </p>
              </div>
            </div>
          </div>

          {/* Mansion Room Selector for Crime Location */}
          <div className="mb-3">
            <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1 mb-1.5">
              <MapPin className="w-3 h-3 text-rose-400" />
              <span>Cômodo do Ataque (Among Us):</span>
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {MANSION_ROOMS.map((room) => {
                const isSelected = selectedCrimeRoom === room.id;
                return (
                  <button
                    key={room.id}
                    type="button"
                    disabled={hasConfirmedKill}
                    onClick={() => {
                      sound.playClick();
                      setSelectedCrimeRoom(room.id);
                      if (onSelectRoom) onSelectRoom(room.id);
                    }}
                    className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-950/80 border-rose-500 text-rose-200 shadow-sm'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                    }`}
                  >
                    <span className="text-lg">{room.icon}</span>
                    <span className="text-[10px] font-bold line-clamp-1 mt-0.5">
                      {room.name.split(' ')[0]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Suspect / Victim Selection */}
          <div>
            <label className="text-[11px] font-bold text-neutral-300 uppercase tracking-wider block mb-1.5">
              Escolha quem eliminar:
            </label>
            <div className="space-y-1.5 max-h-44 overflow-y-auto">
              {aliveTargets.map((target) => {
                const isSelected = selectedTargetId === target.id;
                return (
                  <button
                    key={target.id}
                    onClick={() => {
                      if (hasConfirmedKill) return;
                      sound.playClick();
                      setSelectedTargetId(target.id);
                    }}
                    disabled={hasConfirmedKill}
                    className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-950/70 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                        : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                    } ${hasConfirmedKill && !isSelected ? 'opacity-40' : ''}`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-base">
                        {target.avatar?.emoji || '👤'}
                      </div>
                      <div className="text-left">
                        <span className="text-xs font-bold block text-neutral-100">
                          {target.name}
                        </span>
                        <span className="text-[9px] text-neutral-400 font-mono">
                          {target.currentRoomId ? `Na ${target.currentRoomId}` : 'Na Mansão'}
                        </span>
                      </div>
                    </div>

                    {isSelected ? (
                      <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-black uppercase">
                        MARCADO
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-500 uppercase font-bold">
                        Selecionar
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Action Button: Desferir Golpe de Faca */}
        <div className="pt-3">
          {!hasConfirmedKill ? (
            <button
              id="btn-strike-knife"
              disabled={!selectedTargetId}
              onClick={handleExecuteKill}
              className={`w-full py-3.5 rounded-2xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer ${
                selectedTargetId
                  ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white shadow-[0_0_30px_rgba(225,29,72,0.5)] active:scale-98'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <span>🔪</span>
              <span>DESFERIR GOLPE DE FACA</span>
            </button>
          ) : (
            <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-500/60 text-center animate-pulse">
              <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-xs">
                <Check className="w-4 h-4" />
                <span>Golpe desferido com sucesso!</span>
              </div>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Feche os olhos e finja estar dormindo até o dia clarear.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // CASE 3: DETECTIVE TURN (phase === 'NIGHT_DETECTIVE')
  // ----------------------------------------------------
  if (isDetective && phase === 'NIGHT_DETECTIVE') {
    return (
      <div className="flex-1 p-5 flex flex-col justify-between bg-neutral-950 text-white select-none overflow-y-auto">
        <div>
          {/* Badge */}
          <div className="flex items-center justify-between mb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 text-xs font-black uppercase tracking-widest">
              <Search className="w-3.5 h-3.5" />
              <span>SUA VEZ • TURNO DO DETETIVE</span>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">
              ⏱️ {publicState.timerSeconds}s
            </span>
          </div>

          <h2 className="text-2xl font-black uppercase tracking-wide font-['Cinzel',sans-serif] text-neutral-100">
            INVESTIGAÇÃO NOTURNA
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Escolha 1 suspeito para examinar em sigilo nesta noite:
          </p>

          {/* Report or Suspects */}
          {privateData.detectiveInvestigationResult ? (
            <div className="my-6 p-5 rounded-2xl bg-cyan-950/60 border-2 border-cyan-400/80 text-center shadow-[0_0_35px_rgba(6,182,212,0.3)] animate-in zoom-in-95">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-cyan-400 block mb-1">
                DOSSIÊ CONFIDENCIAL OBTIDO
              </span>
              <h3 className="text-base font-black text-white uppercase mb-2">
                {privateData.detectiveInvestigationResult.targetName}
              </h3>
              <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                {privateData.detectiveInvestigationResult.resultText}
              </p>
              <div className="mt-3 text-[10px] text-cyan-300/80 flex items-center justify-center gap-1 font-mono">
                <Check className="w-3.5 h-3.5 text-cyan-400" />
                <span>O dia amanhecerá em instantes com as revelações</span>
              </div>
            </div>
          ) : (
            <div className="my-4 space-y-2">
              {aliveTargets.map((target) => (
                <button
                  key={target.id}
                  onClick={() => handleInvestigate(target.id)}
                  disabled={hasInvestigated}
                  className="w-full p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-cyan-400 flex items-center justify-between transition-all cursor-pointer group active:scale-98"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-neutral-800 flex items-center justify-center text-lg">
                      {target.avatar?.emoji || '👤'}
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-bold text-neutral-100 block">
                        {target.name}
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono">
                        {target.currentRoomId ? `Quarto: ${target.currentRoomId}` : 'Na Mansão'}
                      </span>
                    </div>
                  </div>

                  <span className="text-xs text-cyan-400 font-bold uppercase tracking-wider group-hover:underline">
                    Investigar
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="p-3 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center text-neutral-400 text-xs">
          Mantenha silêncio absoluto para ninguém desconfiar de seu papel!
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // CASE 4: SLEEPING PHASE (Detective during NIGHT_KILLER, Killer during NIGHT_DETECTIVE, or Innocent all night)
  // ----------------------------------------------------
  let sleepTitle = 'CIDADE DORMINDO...';
  let sleepSubtitle = 'Mantenha a cabeça baixa e fique em silêncio absoluto.';

  if (isDetective && phase === 'NIGHT_KILLER') {
    sleepTitle = 'FECHE OS OLHOS, DETETIVE!';
    sleepSubtitle = 'O Assassino está agindo nas sombras. Seu turno de investigação começará em instantes!';
  } else if (isKiller && phase === 'NIGHT_DETECTIVE') {
    sleepTitle = 'FECHE OS OLHOS!';
    sleepSubtitle = 'O Detetive está examinando a mansão. Permaneça em silêncio absoluto.';
  }

  return (
    <div className="flex-1 p-6 flex flex-col justify-center items-center text-center bg-neutral-950 text-white relative overflow-hidden select-none">
      {/* Soft Moon Ambient Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-950/30 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 rounded-full bg-indigo-950/40 border border-indigo-700/40 flex items-center justify-center text-indigo-400 mb-6 shadow-[0_0_40px_rgba(99,102,241,0.25)] animate-pulse">
          <Moon className="w-12 h-12" />
        </div>

        <h1 className="text-3xl font-black uppercase font-['Cinzel',sans-serif] tracking-wider text-neutral-100">
          {sleepTitle}
        </h1>

        <p className="text-sm text-neutral-300 mt-3 max-w-xs leading-relaxed font-medium">
          {sleepSubtitle}
        </p>

        <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full bg-black/80 border border-neutral-800 text-xs font-mono text-neutral-400">
          <EyeOff className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>Aguarde o nascer do sol...</span>
        </div>
      </div>
    </div>
  );
}
