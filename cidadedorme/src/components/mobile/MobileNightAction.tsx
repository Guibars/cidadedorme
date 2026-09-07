import { useState, useEffect } from 'react';
import { PrivatePlayerData, PublicGameState, MansionRoomId, PublicPlayer } from '../../types';
import { Skull, EyeOff, MapPin, Compass, Shield, Flame } from 'lucide-react';
import { sound } from '../../utils/audio';
import { InteractiveMansionMap } from '../common/InteractiveMansionMap';
import { VirtualDpad } from '../common/VirtualDpad';

interface MobileNightActionProps {
  privateData: PrivatePlayerData;
  publicState: PublicGameState;
  onKill: (targetPlayerId: string, crimeRoomId?: string, x?: number, y?: number) => void;
  onMove?: (x: number, y: number, roomId?: string) => void;
}

export function MobileNightAction({
  privateData,
  publicState,
  onKill,
  onMove,
}: MobileNightActionProps) {
  const player = privateData.player;
  const isKiller = player.role === 'ASSASSINO';
  const isVictim = privateData.isNightVictim || !player.isAlive;

  const [nearbyTarget, setNearbyTarget] = useState<PublicPlayer | null>(null);
  const [hasConfirmedKill, setHasConfirmedKill] = useState(
    privateData.nightActionSubmitted || false
  );
  const [isStrikingKnife, setIsStrikingKnife] = useState(false);

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

  const handleExecuteKill = (target: PublicPlayer) => {
    if (hasConfirmedKill || !isKiller) return;
    setIsStrikingKnife(true);
    sound.playKnifeSlash();
    sound.playKillStab();
    sound.triggerVictimDeathVibrate();

    setTimeout(() => {
      setHasConfirmedKill(true);
      setIsStrikingKnife(false);
      onKill(target.id, target.currentRoomId, target.x, target.y);
    }, 450);
  };

  const handleDpadMove = (dx: number, dy: number) => {
    if (!onMove || hasConfirmedKill) return;
    const curX = player.x || 400;
    const curY = player.y || 250;
    onMove(curX + dx, curY + dy);
  };

  // ----------------------------------------------------
  // CASE 1: PLAYER IS DEAD / VICTIM
  // ----------------------------------------------------
  if (isVictim) {
    return (
      <div className="flex-1 p-6 flex flex-col justify-center items-center text-center bg-black text-white relative select-none">
        <div className="w-24 h-24 rounded-full bg-red-900/30 border-2 border-red-600 flex items-center justify-center text-red-500 mb-6 animate-pulse shadow-[0_0_40px_rgba(225,29,72,0.5)]">
          <Skull className="w-12 h-12" />
        </div>

        <h1 className="text-3xl font-black uppercase tracking-wider text-red-500 font-['Cinzel',sans-serif]">
          VOCÊ FOI ELIMINADO!
        </h1>

        <p className="text-base text-neutral-300 mt-3 max-w-xs leading-relaxed">
          A lâmina do assassino atingiu você no escuro da mansão.
          <br />
          <strong className="text-red-400">Permaneça com os olhos fechados</strong> até o amanhecer para não estragar a surpresa!
        </p>

        <div className="mt-8 flex items-center gap-2 px-4 py-2 rounded-full bg-neutral-900/80 border border-red-900/50 text-xs font-mono text-red-300">
          <EyeOff className="w-4 h-4 text-red-400" />
          <span>Fique em silêncio absoluto...</span>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // CASE 2: KILLER TURN (Live Map Hunting & Knife Strike)
  // ----------------------------------------------------
  if (isKiller) {
    return (
      <div className="flex-1 p-3 flex flex-col justify-between bg-neutral-950 text-white select-none overflow-y-auto">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-1.5 px-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950/80 border border-rose-600/50 text-rose-400 text-[11px] font-black uppercase tracking-wider">
              <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
              <span>VOCÊ É O ASSASSINO • TURNO DA NOITE</span>
            </div>
            <span className="text-xs font-mono font-bold text-rose-400">
              ⏱️ {publicState.timerSeconds}s
            </span>
          </div>

          <p className="text-xs text-neutral-300 px-1 mb-2">
            Caminhe pelo mapa até chegar perto de uma vítima para atacá-la com a faca:
          </p>

          {/* Live Interactive Map */}
          <div className="w-full mb-3">
            <InteractiveMansionMap
              players={publicState.players}
              currentPlayerId={player.id}
              isKiller={true}
              isNight={true}
              canMove={!hasConfirmedKill}
              lastStabLocation={publicState.lastStabLocation}
              onMove={(x, y, roomId) => onMove && onMove(x, y, roomId)}
              onTargetInRangeChange={(target) => setNearbyTarget(target)}
              onKillTarget={(targetId, crimeRoomId, x, y) => {
                const targetObj = publicState.players.find((p) => p.id === targetId);
                if (targetObj) handleExecuteKill(targetObj);
              }}
            />
          </div>
        </div>

        {/* Controls & Strike Button */}
        <div className="space-y-3 pt-1">
          {/* Proximity Strike Prompt or Virtual D-Pad */}
          {!hasConfirmedKill ? (
            <div>
              {nearbyTarget ? (
                <button
                  id="btn-knife-strike"
                  type="button"
                  onClick={() => handleExecuteKill(nearbyTarget)}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 active:scale-95 text-white font-black text-base uppercase tracking-wider shadow-[0_0_35px_rgba(239,68,68,0.7)] flex items-center justify-center gap-2 border-2 border-white/40 animate-pulse cursor-pointer transition-all"
                >
                  <span className="text-2xl">🔪</span>
                  <span>ESFAQUEAR {nearbyTarget.name.toUpperCase()}!</span>
                </button>
              ) : (
                <div className="flex items-center justify-between gap-4 px-2 py-1 bg-neutral-900/60 rounded-2xl border border-neutral-800">
                  <div className="flex-1">
                    <span className="text-xs font-bold text-amber-400 block mb-0.5">
                      ⚔️ Aproxime-se de alguém
                    </span>
                    <p className="text-[11px] text-neutral-400 leading-tight">
                      Use os botões ou toque no mapa para andar e encurralar sua presa.
                    </p>
                  </div>
                  <VirtualDpad onMoveDir={handleDpadMove} />
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/60 text-center animate-pulse">
              <span className="text-sm text-emerald-300 font-bold block mb-1">
                🔪 Ataque executado com sucesso!
              </span>
              <p className="text-xs text-neutral-400">
                Aguarde em silêncio. A mansão amanhecerá em instantes.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // CASE 3: INNOCENT SURVIVOR (Live Map Exploration / Lantern)
  // ----------------------------------------------------
  return (
    <div className="flex-1 p-3 flex flex-col justify-between bg-neutral-950 text-white select-none overflow-y-auto">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-1.5 px-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-700 text-neutral-300 text-[11px] font-black uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>VOCÊ É INOCENTE • MANSÃO À NOITE</span>
          </div>
          <span className="text-xs font-mono font-bold text-neutral-400">
            ⏱️ {publicState.timerSeconds}s
          </span>
        </div>

        <p className="text-xs text-neutral-300 px-1 mb-2">
          Caminhe pela mansão com sua lanterna ou fique seguro em um cômodo:
        </p>

        {/* Live Interactive Map for Innocent */}
        <div className="w-full mb-3">
          <InteractiveMansionMap
            players={publicState.players}
            currentPlayerId={player.id}
            isKiller={false}
            isNight={true}
            canMove={true}
            lastStabLocation={publicState.lastStabLocation}
            onMove={(x, y, roomId) => onMove && onMove(x, y, roomId)}
          />
        </div>
      </div>

      {/* Movement D-pad for easy mobile walking */}
      <div className="flex items-center justify-between gap-4 px-3 py-2 bg-neutral-900/60 rounded-2xl border border-neutral-800">
        <div>
          <span className="text-xs font-bold text-neutral-200 block mb-0.5">
            🔦 Controle de Caminhada
          </span>
          <p className="text-[11px] text-neutral-400 leading-tight">
            Use os botões de direção ou toque no mapa para se mover.
          </p>
        </div>
        <VirtualDpad onMoveDir={handleDpadMove} />
      </div>
    </div>
  );
}
