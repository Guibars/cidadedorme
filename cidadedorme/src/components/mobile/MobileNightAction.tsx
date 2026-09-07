import { useState, useEffect } from 'react';
import { PrivatePlayerData, PublicGameState, MansionRoomId, PublicPlayer } from '../../types';
import { Skull, EyeOff, Flame, Shield, Footprints } from 'lucide-react';
import { sound } from '../../utils/audio';
import { Mansion3DGridMap } from '../common/Mansion3DGridMap';

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

  const [hasConfirmedKill, setHasConfirmedKill] = useState(
    privateData.nightActionSubmitted || false
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

  const handleExecuteKill = (targetId: string, x: number, y: number) => {
    if (hasConfirmedKill || !isKiller) return;
    sound.playKnifeSlash();
    sound.playKillStab();
    sound.triggerVictimDeathVibrate();
    setHasConfirmedKill(true);

    const targetObj = publicState.players.find((p) => p.id === targetId);
    onKill(targetId, targetObj?.currentRoomId, x, y);
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
  // CASE 2: KILLER TURN (Live 3D Map Hunting & Knife Strike)
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

          <p className="text-xs text-neutral-300 px-1 mb-2">
            Caminhe pelo mapa 3D com a lanterna até se aproximar de uma vítima e usar a faca:
          </p>

          {/* 3D Walkable Room Grid */}
          <div className="w-full">
            <Mansion3DGridMap
              players={publicState.players}
              currentPlayerId={player.id}
              isKiller={true}
              isNight={true}
              canMove={!hasConfirmedKill}
              lastStabLocation={publicState.lastStabLocation}
              onMove={(x, y, roomId) => onMove && onMove(x, y, roomId)}
              onKillTarget={(targetId, x, y) => handleExecuteKill(targetId, x, y)}
              showControls={true}
              compact={true}
            />
          </div>
        </div>

        {/* Attack Status Notification */}
        {hasConfirmedKill && (
          <div className="mt-3 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/70 text-center animate-pulse">
            <span className="text-sm text-emerald-300 font-black block mb-0.5">
              🔪 Ataque executado com sucesso!
            </span>
            <p className="text-xs text-neutral-300">
              Aguarde em silêncio. A mansão amanhecerá em instantes.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // CASE 3: INNOCENT SURVIVOR (Live 3D Map Exploration)
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
