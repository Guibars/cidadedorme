import { useState, useEffect } from 'react';
import { PrivatePlayerData, PublicGameState, PublicPlayer } from '../../types';
import { Skull, EyeOff, Flame, Shield, Search, Footprints, AlertTriangle } from 'lucide-react';
import { sound } from '../../utils/audio';
import { Mansion3DGridMap } from '../common/Mansion3DGridMap';

interface MobileNightActionProps {
  privateData: PrivatePlayerData;
  publicState: PublicGameState;
  onKill: (targetPlayerId: string, crimeRoomId?: string, x?: number, y?: number) => void;
  onMove?: (x: number, y: number, roomId?: string) => void;
  onInvestigate?: (targetPlayerId: string) => void;
}

export function MobileNightAction({
  privateData,
  publicState,
  onKill,
  onMove,
  onInvestigate,
}: MobileNightActionProps) {
  const player = privateData.player;
  const isKiller = player.role === 'ASSASSINO';
  const isDetective = player.role === 'DETETIVE';
  const isVictim = privateData.isNightVictim || !player.isAlive;

  const [hasConfirmedKill, setHasConfirmedKill] = useState(
    privateData.nightActionSubmitted || false
  );
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);

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

  const handleExecuteKill = (targetId: string, x: number, y: number) => {
    if (hasConfirmedKill || !isKiller) return;
    sound.playKnifeSlash();
    sound.playKillStab();
    sound.triggerVictimDeathVibrate();
    setHasConfirmedKill(true);

    const targetObj = publicState.players.find((p) => p.id === targetId);
    onKill(targetId, targetObj?.currentRoomId, x, y);
  };

  const handleDetectiveInvestigate = (targetId: string) => {
    sound.playClick();
    sound.triggerVibrate([40, 60]);
    if (onInvestigate) {
      onInvestigate(targetId);
    }
    setSelectedSuspect(targetId);
  };

  // ----------------------------------------------------
  // CASE 1: PLAYER IS DEAD / VICTIM
  // ----------------------------------------------------
  if (isVictim) {
    return (
      <div className="flex-1 p-6 flex flex-col justify-center items-center text-center bg-black text-white relative select-none">
        <div className="w-24 h-24 rounded-3xl bg-red-900/30 border-2 border-red-600 flex items-center justify-center text-red-500 mb-6 animate-pulse shadow-[0_0_40px_rgba(225,29,72,0.5)]">
          <Skull className="w-12 h-12" />
        </div>

        <span className="px-4 py-1 rounded-full bg-rose-950/80 border border-rose-700 text-rose-400 text-xs font-black uppercase tracking-widest mb-2">
          GOLPE FATAL NA MADRUGADA
        </span>

        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-wider text-rose-500 font-['Cinzel',serif]">
          VOCÊ FOI ELIMINADO!
        </h1>

        <p className="text-sm text-neutral-300 mt-3 max-w-xs leading-relaxed">
          A lâmina do assassino atingiu você no escuro da mansão.
          <br />
          <strong className="text-rose-400">Permaneça com a cabeça baixa</strong> até o amanhecer para não revelar sua identidade aos outros!
        </p>

        <div className="mt-8 flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-neutral-900/90 border border-rose-900/60 text-xs font-mono text-rose-300">
          <EyeOff className="w-4 h-4 text-rose-400 animate-pulse" />
          <span>Mantenha silêncio absoluto...</span>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // CASE 2: DETECTIVE NIGHT PATROL & INVESTIGATION
  // ----------------------------------------------------
  if (isDetective) {
    const aliveOthers = publicState.players.filter((p) => p.id !== player.id && p.isAlive);
    const investigationResult = privateData.detectiveInvestigationResult;

    return (
      <div className="flex-1 p-3 flex flex-col justify-between bg-neutral-950 text-white select-none overflow-y-auto">
        <div className="w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/90 border border-cyan-500/60 text-cyan-300 text-[11px] font-black uppercase tracking-wider">
              <Search className="w-4 h-4 text-cyan-400 animate-pulse" />
              <span>VOCÊ É O DETETIVE • RONDA NOTURNA</span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-cyan-400">
              ⏱️ {publicState.timerSeconds}s
            </div>
          </div>

          {/* Rule Alert Banner */}
          <div className="mb-2 p-2.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 text-left flex items-start gap-2.5">
            <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-cyan-200 leading-tight">
              <strong>ESCUDO DO DETETIVE:</strong> Se o Assassino tentar te atacar nesta noite, o Assassino <strong>perde o jogo imediatamente</strong>!
            </p>
          </div>

          {/* 3D Walkable Room Grid */}
          <div className="w-full mb-3">
            <Mansion3DGridMap
              players={publicState.players}
              currentPlayerId={player.id}
              isKiller={false}
              isNight={true}
              canMove={true}
              lastStabLocation={publicState.lastStabLocation}
              onMove={(x, y, roomId) => onMove && onMove(x, y, roomId)}
              showControls={true}
              compact={true}
            />
          </div>

          {/* Investigation Result Card */}
          {investigationResult && (
            <div className="p-3 rounded-2xl bg-neutral-900 border-2 border-amber-500/70 text-left mb-3 shadow-lg animate-in zoom-in-95">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-400 mb-1">
                <Search className="w-4 h-4" />
                <span>RELATÓRIO PERICIAL DO DETETIVE</span>
              </div>
              <p className="text-xs font-bold text-white leading-relaxed">
                {investigationResult.resultText}
              </p>
            </div>
          )}

          {/* Suspect Investigation Actions */}
          <div className="p-3 rounded-2xl bg-neutral-900/90 border border-neutral-800 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-neutral-300">
                🔍 INVESTIGAR SUSPEITO
              </span>
              <span className="text-[10px] text-cyan-400 font-bold">RONDA OFICIAL</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {aliveOthers.map((suspect) => (
                <button
                  key={suspect.id}
                  onClick={() => handleDetectiveInvestigate(suspect.id)}
                  className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    selectedSuspect === suspect.id
                      ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-md'
                      : 'bg-neutral-800/90 border-neutral-700 text-neutral-200 hover:border-cyan-500/50'
                  }`}
                >
                  <span className="text-base">{suspect.avatar?.emoji || '👤'}</span>
                  <span className="truncate">{suspect.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // CASE 3: KILLER TURN (Live 3D Map Hunting, Strike & Escape Window)
  // ----------------------------------------------------
  if (isKiller) {
    return (
      <div className="flex-1 p-3 flex flex-col justify-between bg-neutral-950 text-white select-none overflow-y-auto">
        <div className="w-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-950/90 border border-rose-600/60 text-rose-400 text-[11px] font-black uppercase tracking-wider">
              <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>VOCÊ É O ASSASSINO • TURNO DA NOITE</span>
            </div>
            <div className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-rose-400">
              ⏱️ {publicState.timerSeconds}s
            </div>
          </div>

          {/* Warning / Escape banner */}
          {hasConfirmedKill ? (
            <div className="mb-2 p-3 rounded-2xl bg-amber-950/80 border-2 border-amber-500/80 text-left animate-pulse">
              <div className="flex items-center gap-2 text-amber-300 font-black text-xs uppercase mb-1">
                <Footprints className="w-4 h-4" />
                <span>🏃 FUGA IMEDIATA! CORRA PARA OUTRO CÔMODO!</span>
              </div>
              <p className="text-[11px] text-neutral-200 leading-tight">
                Você tem <strong>{publicState.timerSeconds}s</strong> para andar e se esconder em outro cômodo para forjar seu álibi antes que todos acordem!
              </p>
            </div>
          ) : (
            <div className="mb-2 p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-left">
              <p className="text-[11px] text-neutral-300 leading-tight">
                ⚠️ <strong>Atenção:</strong> Não ataque o <strong>Detetive</strong>! Se atacar o Detetive, você perde o jogo na mesma hora.
              </p>
            </div>
          )}

          {/* 3D Walkable Room Grid - Killer CAN ALWAYS MOVE, even after attack! */}
          <div className="w-full">
            <Mansion3DGridMap
              players={publicState.players}
              currentPlayerId={player.id}
              isKiller={true}
              isNight={true}
              canMove={true}
              lastStabLocation={publicState.lastStabLocation}
              onMove={(x, y, roomId) => onMove && onMove(x, y, roomId)}
              onKillTarget={!hasConfirmedKill ? (targetId, x, y) => handleExecuteKill(targetId, x, y) : undefined}
              showControls={true}
              compact={true}
            />
          </div>
        </div>

        {/* Attack Status Notification */}
        {hasConfirmedKill && (
          <div className="mt-2 p-3 rounded-2xl bg-rose-950/70 border border-rose-600/70 text-center">
            <span className="text-xs text-rose-300 font-black block mb-0.5">
              🔪 Golpe desferido! Fuga em andamento.
            </span>
            <p className="text-[11px] text-neutral-400">
              Continue se movimentando pelo mapa para sair da cena do crime!
            </p>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // CASE 4: INNOCENT SURVIVOR (Live 3D Map Exploration)
  // ----------------------------------------------------
  return (
    <div className="flex-1 p-3 flex flex-col justify-between bg-neutral-950 text-white select-none overflow-y-auto">
      <div className="w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-2 px-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-200 text-[11px] font-black uppercase tracking-wider">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>VOCÊ É INOCENTE • EXPLORAÇÃO NOTURNA</span>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-xs font-mono font-bold text-neutral-300">
            ⏱️ {publicState.timerSeconds}s
          </div>
        </div>

        <p className="text-xs text-neutral-300 px-1 mb-2">
          Mova-se pelo mapa 3D para explorar ou se abrigar em um cômodo seguro:
        </p>

        {/* 3D Walkable Room Grid for Innocent */}
        <div className="w-full">
          <Mansion3DGridMap
            players={publicState.players}
            currentPlayerId={player.id}
            isKiller={false}
            isNight={true}
            canMove={true}
            lastStabLocation={publicState.lastStabLocation}
            onMove={(x, y, roomId) => onMove && onMove(x, y, roomId)}
            showControls={true}
            compact={true}
          />
        </div>
      </div>
    </div>
  );
}
