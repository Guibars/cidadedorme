import React, { useState, useEffect, useRef } from 'react';
import { PublicPlayer, MansionRoomId } from '../../types';
import {
  MANSION_ROOMS,
  MANSION_ROOM_BOUNDS,
  getRoomAtPosition,
  clampMansionPosition,
} from '../../data/mansion';
import { Skull, MapPin } from 'lucide-react';
import { sound } from '../../utils/audio';

interface InteractiveMansionMapProps {
  players: PublicPlayer[];
  currentPlayerId?: string;
  isKiller?: boolean;
  isNight?: boolean;
  canMove?: boolean;
  highlightRoomId?: MansionRoomId;
  victimPlayerId?: string;
  lastStabLocation?: {
    x: number;
    y: number;
    victimId: string;
    victimName: string;
    roomId?: MansionRoomId;
    timestamp: number;
  };
  onMove?: (x: number, y: number, roomId: MansionRoomId) => void;
  onKillTarget?: (targetId: string, crimeRoomId: MansionRoomId, x: number, y: number) => void;
  onTargetInRangeChange?: (targetPlayer: PublicPlayer | null) => void;
  className?: string;
  compact?: boolean;
}

export function InteractiveMansionMap({
  players,
  currentPlayerId,
  isKiller = false,
  isNight = false,
  canMove = true,
  highlightRoomId,
  victimPlayerId,
  lastStabLocation,
  onMove,
  onKillTarget,
  onTargetInRangeChange,
  className = '',
  compact = false,
}: InteractiveMansionMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Local movement state for smooth feel
  const myPlayer = players.find((p) => p.id === currentPlayerId);
  const [localPos, setLocalPos] = useState<{ x: number; y: number }>({
    x: myPlayer?.x || 400,
    y: myPlayer?.y || 250,
  });

  const [nearbyVictim, setNearbyVictim] = useState<PublicPlayer | null>(null);
  const [knifeSlashFX, setKnifeSlashFX] = useState<{ x: number; y: number } | null>(null);

  // Sync with player position if updated remotely
  useEffect(() => {
    if (myPlayer?.x !== undefined && myPlayer?.y !== undefined) {
      // If position drifted significantly, snap
      const d = Math.hypot((myPlayer.x || 400) - localPos.x, (myPlayer.y || 250) - localPos.y);
      if (d > 80) {
        setLocalPos({ x: myPlayer.x, y: myPlayer.y });
      }
    }
  }, [myPlayer?.x, myPlayer?.y]);

  // Check proximity for killer
  useEffect(() => {
    if (!isKiller || !myPlayer || !myPlayer.isAlive) {
      if (nearbyVictim) {
        setNearbyVictim(null);
        if (onTargetInRangeChange) onTargetInRangeChange(null);
      }
      return;
    }

    const curX = localPos.x;
    const curY = localPos.y;

    let closest: PublicPlayer | null = null;
    let minDistance = 75; // 75px kill range

    for (const p of players) {
      if (p.id === myPlayer.id || !p.isAlive) continue;
      const px = p.x || 400;
      const py = p.y || 250;
      const dist = Math.hypot(px - curX, py - curY);
      if (dist <= minDistance) {
        minDistance = dist;
        closest = p;
      }
    }

    if (closest?.id !== nearbyVictim?.id) {
      setNearbyVictim(closest);
      if (onTargetInRangeChange) onTargetInRangeChange(closest);
    }
  }, [localPos, players, isKiller, myPlayer]);

  // Handle map click/tap to walk
  const handleMapClick = (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
    if (!canMove || !svgRef.current || !myPlayer || !myPlayer.isAlive) return;

    const svg = svgRef.current;
    const pt = svg.createSVGPoint();

    if ('touches' in e) {
      if (e.touches.length === 0) return;
      pt.x = e.touches[0].clientX;
      pt.y = e.touches[0].clientY;
    } else {
      pt.x = e.clientX;
      pt.y = e.clientY;
    }

    const cursorPt = pt.matrixTransform(svg.getScreenCTM()?.inverse());
    const clamped = clampMansionPosition(cursorPt.x, cursorPt.y);

    setLocalPos(clamped);
    const roomId = getRoomAtPosition(clamped.x, clamped.y);

    if (onMove) {
      onMove(clamped.x, clamped.y, roomId);
    }
  };

  const handleExecuteKill = (target: PublicPlayer) => {
    if (!isKiller || !myPlayer?.isAlive) return;
    const tx = target.x || 400;
    const ty = target.y || 250;

    setKnifeSlashFX({ x: tx, y: ty });
    sound.playKnifeSlash();
    sound.playKillStab();
    sound.triggerVictimDeathVibrate();

    setTimeout(() => {
      setKnifeSlashFX(null);
    }, 1200);

    const crimeRoomId = target.currentRoomId || getRoomAtPosition(tx, ty);
    if (onKillTarget) {
      onKillTarget(target.id, crimeRoomId, tx, ty);
    }
  };

  return (
    <div className={`relative w-full overflow-hidden rounded-3xl border border-neutral-800 bg-[#0a0a0f] shadow-2xl select-none ${className}`}>
      {/* SVG Map Container */}
      <svg
        ref={svgRef}
        viewBox="0 0 800 500"
        className="w-full h-auto block cursor-crosshair touch-none"
        onClick={handleMapClick}
      >
        <defs>
          {/* Wall / Floor Patterns */}
          <pattern id="pattern-parquet" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="#14131b" />
            <path d="M0 10 L20 10 M10 0 L10 20" stroke="#1f1d2b" strokeWidth="0.8" />
          </pattern>

          <pattern id="pattern-kitchen-tiles" width="16" height="16" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#18181f" />
            <rect x="8" width="8" height="8" fill="#24232c" />
            <rect y="8" width="8" height="8" fill="#24232c" />
            <rect x="8" y="8" width="8" height="8" fill="#18181f" />
          </pattern>

          <pattern id="pattern-library-carpet" width="24" height="24" patternUnits="userSpaceOnUse">
            <rect width="24" height="24" fill="#1a1426" />
            <circle cx="12" cy="12" r="6" fill="none" stroke="#2c2042" strokeWidth="1" />
          </pattern>

          <pattern id="pattern-garden-grass" width="24" height="24" patternUnits="userSpaceOnUse">
            <rect width="24" height="24" fill="#0f1f18" />
            <circle cx="6" cy="6" r="2" fill="#142c22" />
            <circle cx="18" cy="18" r="2" fill="#142c22" />
          </pattern>

          {/* Radial Lantern Glow Filter */}
          <radialGradient id="lanternGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.4" />
            <stop offset="60%" stopColor="#f59e0b" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>

          {/* Killer Red Glow */}
          <radialGradient id="killerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.5" />
            <stop offset="70%" stopColor="#991b1b" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer Background / Walls */}
        <rect x="0" y="0" width="800" height="500" fill="#0b0a10" />

        {/* Central Hallways Floor */}
        <rect x="30" y="30" width="740" height="440" fill="url(#pattern-parquet)" rx="16" />

        {/* ======================================================== */}
        {/* ROOM 1: QUARTO PRINCIPAL (Top-Left)                      */}
        {/* ======================================================== */}
        <g>
          <rect
            x={MANSION_ROOM_BOUNDS.bedroom.x}
            y={MANSION_ROOM_BOUNDS.bedroom.y}
            width={MANSION_ROOM_BOUNDS.bedroom.w}
            height={MANSION_ROOM_BOUNDS.bedroom.h}
            fill="#151728"
            stroke={highlightRoomId === 'bedroom' ? '#f43f5e' : '#2d325a'}
            strokeWidth={highlightRoomId === 'bedroom' ? 3 : 1.5}
            rx="12"
          />
          {/* Bed & Carpet */}
          <rect x="50" y="50" width="70" height="90" fill="#1e223d" rx="6" stroke="#313866" strokeWidth="1" />
          <rect x="55" y="55" width="60" height="25" fill="#313866" rx="4" />
          <text x="140" y="70" fill="#818cf8" fontSize="14" fontWeight="bold" fontFamily="Cinzel, sans-serif">
            🛏️ Quarto Principal
          </text>
          {/* Door opening */}
          <line x1="250" y1="100" x2="250" y2="140" stroke="#f59e0b" strokeWidth="3" strokeDasharray="4 4" />
        </g>

        {/* ======================================================== */}
        {/* ROOM 2: COZINHA DA MANSÃO (Top-Right)                     */}
        {/* ======================================================== */}
        <g>
          <rect
            x={MANSION_ROOM_BOUNDS.kitchen.x}
            y={MANSION_ROOM_BOUNDS.kitchen.y}
            width={MANSION_ROOM_BOUNDS.kitchen.w}
            height={MANSION_ROOM_BOUNDS.kitchen.h}
            fill="url(#pattern-kitchen-tiles)"
            stroke={highlightRoomId === 'kitchen' ? '#f43f5e' : '#451a1a'}
            strokeWidth={highlightRoomId === 'kitchen' ? 3 : 1.5}
            rx="12"
          />
          {/* Kitchen Counter / Island */}
          <rect x="620" y="70" width="80" height="50" fill="#2d1515" rx="4" stroke="#7f1d1d" strokeWidth="1" />
          <text x="570" y="60" fill="#f87171" fontSize="14" fontWeight="bold" fontFamily="Cinzel, sans-serif">
            🍳 Cozinha
          </text>
          {/* Knife counter hint */}
          <text x="635" y="100" fontSize="18">🔪</text>
          {/* Door opening */}
          <line x1="550" y1="100" x2="550" y2="140" stroke="#f59e0b" strokeWidth="3" strokeDasharray="4 4" />
        </g>

        {/* ======================================================== */}
        {/* ROOM 3: SALA DE ESTAR (Center)                            */}
        {/* ======================================================== */}
        <g>
          <rect
            x={MANSION_ROOM_BOUNDS.living.x}
            y={MANSION_ROOM_BOUNDS.living.y}
            width={MANSION_ROOM_BOUNDS.living.w}
            height={MANSION_ROOM_BOUNDS.living.h}
            fill="#221715"
            stroke={highlightRoomId === 'living' ? '#f43f5e' : '#59321f'}
            strokeWidth={highlightRoomId === 'living' ? 3 : 1.5}
            rx="12"
          />
          {/* Persian Rug in center */}
          <rect x="320" y="180" width="160" height="110" fill="#3b1717" rx="8" stroke="#782323" strokeWidth="1.5" />
          <circle cx="400" cy="235" r="30" fill="#4a1d1d" stroke="#8b2c2c" strokeWidth="1" />
          {/* Fireplace */}
          <rect x="370" y="152" width="60" height="12" fill="#782323" rx="2" />
          <text x="390" y="163" fontSize="12">🔥</text>

          <text x="330" y="175" fill="#fbbf24" fontSize="14" fontWeight="bold" fontFamily="Cinzel, sans-serif">
            🛋️ Sala de Estar
          </text>
        </g>

        {/* ======================================================== */}
        {/* ROOM 4: BIBLIOTECA (Bottom-Left)                         */}
        {/* ======================================================== */}
        <g>
          <rect
            x={MANSION_ROOM_BOUNDS.library.x}
            y={MANSION_ROOM_BOUNDS.library.y}
            width={MANSION_ROOM_BOUNDS.library.w}
            height={MANSION_ROOM_BOUNDS.library.h}
            fill="url(#pattern-library-carpet)"
            stroke={highlightRoomId === 'library' ? '#f43f5e' : '#3c2460'}
            strokeWidth={highlightRoomId === 'library' ? 3 : 1.5}
            rx="12"
          />
          {/* Bookshelves */}
          <rect x="50" y="310" width="180" height="15" fill="#2d1a45" rx="3" stroke="#4c2882" strokeWidth="1" />
          <rect x="50" y="440" width="180" height="15" fill="#2d1a45" rx="3" stroke="#4c2882" strokeWidth="1" />
          <text x="60" y="350" fill="#c084fc" fontSize="14" fontWeight="bold" fontFamily="Cinzel, sans-serif">
            📚 Biblioteca
          </text>
          {/* Door opening */}
          <line x1="250" y1="360" x2="250" y2="400" stroke="#f59e0b" strokeWidth="3" strokeDasharray="4 4" />
        </g>

        {/* ======================================================== */}
        {/* ROOM 5: QUINTAL & JARDIM (Bottom-Right)                   */}
        {/* ======================================================== */}
        <g>
          <rect
            x={MANSION_ROOM_BOUNDS.garden.x}
            y={MANSION_ROOM_BOUNDS.garden.y}
            width={MANSION_ROOM_BOUNDS.garden.w}
            height={MANSION_ROOM_BOUNDS.garden.h}
            fill="url(#pattern-garden-grass)"
            stroke={highlightRoomId === 'garden' ? '#f43f5e' : '#1e4835'}
            strokeWidth={highlightRoomId === 'garden' ? 3 : 1.5}
            rx="12"
          />
          {/* Garden Fountain / Pavilion */}
          <circle cx="660" cy="380" r="35" fill="#143828" stroke="#10b981" strokeWidth="1.5" />
          <circle cx="660" cy="380" r="15" fill="#0e7490" opacity="0.6" />
          <text x="570" y="320" fill="#34d399" fontSize="14" fontWeight="bold" fontFamily="Cinzel, sans-serif">
            🌿 Quintal & Jardim
          </text>
          {/* Door opening */}
          <line x1="550" y1="360" x2="550" y2="400" stroke="#f59e0b" strokeWidth="3" strokeDasharray="4 4" />
        </g>

        {/* ======================================================== */}
        {/* ROOM 6: PORÃO ELÉTRICO (Bottom-Center)                    */}
        {/* ======================================================== */}
        <g>
          <rect
            x={MANSION_ROOM_BOUNDS.basement.x}
            y={MANSION_ROOM_BOUNDS.basement.y}
            width={MANSION_ROOM_BOUNDS.basement.w}
            height={MANSION_ROOM_BOUNDS.basement.h}
            fill="#121820"
            stroke={highlightRoomId === 'basement' ? '#f43f5e' : '#1f384a'}
            strokeWidth={highlightRoomId === 'basement' ? 3 : 1.5}
            rx="12"
          />
          {/* Generator / Fuse Box */}
          <rect x="350" y="410" width="100" height="35" fill="#1a2530" rx="4" stroke="#0ea5e9" strokeWidth="1" />
          <text x="390" y="432" fontSize="16">⚡</text>
          <text x="330" y="380" fill="#38bdf8" fontSize="14" fontWeight="bold" fontFamily="Cinzel, sans-serif">
            ⚡ Porão Elétrico
          </text>
        </g>

        {/* Crime Highlight Border / Strobe if this room had a murder */}
        {highlightRoomId && MANSION_ROOM_BOUNDS[highlightRoomId] && (
          <rect
            x={MANSION_ROOM_BOUNDS[highlightRoomId].x - 4}
            y={MANSION_ROOM_BOUNDS[highlightRoomId].y - 4}
            width={MANSION_ROOM_BOUNDS[highlightRoomId].w + 8}
            height={MANSION_ROOM_BOUNDS[highlightRoomId].h + 8}
            fill="none"
            stroke="#ef4444"
            strokeWidth="3"
            strokeDasharray="8 6"
            className="animate-pulse"
            rx="16"
          />
        )}

        {/* Crime Spot Chalk Marker */}
        {lastStabLocation && (
          <g transform={`translate(${lastStabLocation.x}, ${lastStabLocation.y})`}>
            <circle cx="0" cy="0" r="24" fill="#ef4444" fillOpacity="0.25" className="animate-ping" />
            <circle cx="0" cy="0" r="16" fill="#991b1b" stroke="#f43f5e" strokeWidth="2" />
            <text x="0" y="5" textAnchor="middle" fontSize="14">💀</text>
            <text x="0" y="24" textAnchor="middle" fill="#fca5a5" fontSize="10" fontWeight="bold">
              {lastStabLocation.victimName}
            </text>
          </g>
        )}

        {/* Night Darkness & Lantern Vision (Among Us dark feeling) */}
        {isNight && (
          <rect
            x="0"
            y="0"
            width="800"
            height="500"
            fill="#000000"
            fillOpacity={isKiller ? "0.45" : "0.75"}
            className="pointer-events-none transition-all duration-700"
          />
        )}

        {/* Render Lantern Light Circles around each alive character at night */}
        {isNight &&
          players
            .filter((p) => p.isAlive)
            .map((p) => {
              const px = p.id === currentPlayerId ? localPos.x : p.x || 400;
              const py = p.id === currentPlayerId ? localPos.y : p.y || 250;
              const isMe = p.id === currentPlayerId;

              return (
                <circle
                  key={`glow-${p.id}`}
                  cx={px}
                  cy={py}
                  r={isMe ? (isKiller ? 120 : 100) : 60}
                  fill={isKiller && isMe ? 'url(#killerGlow)' : 'url(#lanternGlow)'}
                  className="pointer-events-none"
                />
              );
            })}

        {/* ======================================================== */}
        {/* PLAYERS RENDERING (Walking Characters on 2D Floorplan)   */}
        {/* ======================================================== */}
        {players.map((p) => {
          const isCurrent = p.id === currentPlayerId;
          const px = isCurrent ? localPos.x : p.x || 400;
          const py = isCurrent ? localPos.y : p.y || 250;
          const isVictim = p.id === victimPlayerId || !p.isAlive;
          const isNearbyTarget = nearbyVictim?.id === p.id && isKiller;

          return (
            <g
              key={p.id}
              transform={`translate(${px}, ${py})`}
              className="transition-transform duration-100 ease-out cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                if (isKiller && isNearbyTarget && p.isAlive) {
                  handleExecuteKill(p);
                }
              }}
            >
              {/* Shadow under character */}
              <ellipse cx="0" cy="14" rx="14" ry="5" fill="#000000" opacity="0.6" />

              {/* Killer Proximity Target Crosshair */}
              {isNearbyTarget && (
                <g className="animate-spin" style={{ animationDuration: '4s' }}>
                  <circle cx="0" cy="0" r="28" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeDasharray="6 4" />
                  <line x1="-32" y1="0" x2="-22" y2="0" stroke="#ef4444" strokeWidth="3" />
                  <line x1="22" y1="0" x2="32" y2="0" stroke="#ef4444" strokeWidth="3" />
                  <line x1="0" y1="-32" x2="0" y2="-22" stroke="#ef4444" strokeWidth="3" />
                  <line x1="0" y1="22" x2="0" y2="32" stroke="#ef4444" strokeWidth="3" />
                </g>
              )}

              {/* Target Prompt for Killer */}
              {isNearbyTarget && (
                <g transform="translate(0, -38)">
                  <rect x="-42" y="-12" width="84" height="20" rx="10" fill="#e11d48" stroke="#ffffff" strokeWidth="1.5" />
                  <text x="0" y="2" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="sans-serif">
                    🔪 ATACAR!
                  </text>
                </g>
              )}

              {/* Character Body Token */}
              {isVictim ? (
                // Dead marker
                <g>
                  <circle cx="0" cy="0" r="16" fill="#450a0a" stroke="#dc2626" strokeWidth="2" />
                  <text x="0" y="5" textAnchor="middle" fontSize="16">
                    💀
                  </text>
                </g>
              ) : (
                // Alive Character Token
                <g>
                  <circle
                    cx="0"
                    cy="0"
                    r={isCurrent ? 18 : 15}
                    fill={p.avatar?.color || '#3b82f6'}
                    stroke={isCurrent ? '#f59e0b' : '#ffffff'}
                    strokeWidth={isCurrent ? 3 : 2}
                  />
                  <text x="0" y={isCurrent ? 6 : 5} textAnchor="middle" fontSize={isCurrent ? 18 : 15}>
                    {p.avatar?.emoji || '👤'}
                  </text>
                </g>
              )}

              {/* Name Tag */}
              <g transform="translate(0, 26)">
                <rect
                  x="-35"
                  y="-8"
                  width="70"
                  height="16"
                  rx="8"
                  fill={isCurrent ? '#f59e0b' : '#171717'}
                  stroke={isCurrent ? '#ffffff' : '#404040'}
                  strokeWidth="1"
                  opacity="0.9"
                />
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill={isCurrent ? '#000000' : '#e5e5e5'}
                  fontSize="9"
                  fontWeight="bold"
                >
                  {isCurrent ? `${p.name} (VOCÊ)` : p.name}
                </text>
              </g>
            </g>
          );
        })}

        {/* Knife Slash Visual FX when a stab is executed */}
        {knifeSlashFX && (
          <g transform={`translate(${knifeSlashFX.x}, ${knifeSlashFX.y})`}>
            <circle cx="0" cy="0" r="40" fill="#ef4444" fillOpacity="0.4" className="animate-ping" />
            <path
              d="M -30 -30 L 30 30 M -10 -35 L 35 10"
              stroke="#ffffff"
              strokeWidth="5"
              strokeLinecap="round"
              className="animate-pulse"
            />
            <text x="0" y="10" textAnchor="middle" fontSize="32">
              🩸
            </text>
          </g>
        )}
      </svg>

      {/* Movement hint bar for mobile / desktop */}
      <div className="p-2.5 bg-neutral-950/90 border-t border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5 text-amber-400" />
          <span className="font-mono text-[11px]">
            Toque/clique no mapa para caminhar até o local
          </span>
        </div>

        {myPlayer && (
          <span className="text-[11px] font-bold text-neutral-300">
            Você está na(o):{' '}
            <strong className="text-amber-400">
              {MANSION_ROOMS.find((r) => r.id === getRoomAtPosition(localPos.x, localPos.y))?.name || 'Corredor'}
            </strong>
          </span>
        )}
      </div>
    </div>
  );
}
