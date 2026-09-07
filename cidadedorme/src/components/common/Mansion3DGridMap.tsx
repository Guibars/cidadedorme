import { useEffect, useRef, useState, useCallback, type MouseEvent } from 'react';
import { PublicPlayer, MansionRoomId, ForensicEvidence } from '../../types';
import {
  MANSION_ROOMS,
  MANSION_ROOM_BOUNDS,
  getRoomAtPosition,
  getRoomCenter,
  clampMansionPosition,
} from '../../data/mansion';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Flame,
  Search,
  Crosshair,
  Shield,
  Footprints,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface Mansion3DGridMapProps {
  players: PublicPlayer[];
  currentPlayerId?: string;
  isKiller?: boolean;
  isNight?: boolean;
  canMove?: boolean;
  lastStabLocation?: {
    x: number;
    y: number;
    victimId: string;
    victimName: string;
    roomId?: MansionRoomId;
    timestamp: number;
  } | null;
  forensicEvidence?: ForensicEvidence | null;
  highlightRoomId?: MansionRoomId | null;
  victimPlayerId?: string | null;
  onMove?: (x: number, y: number, roomId: MansionRoomId) => void;
  onKillTarget?: (targetId: string, x: number, y: number) => void;
  showControls?: boolean;
  compact?: boolean;
}

const ATTACK_RANGE = 75; // Proximity in pixels to strike

export function Mansion3DGridMap({
  players,
  currentPlayerId,
  isKiller = false,
  isNight = false,
  canMove = true,
  lastStabLocation,
  forensicEvidence,
  highlightRoomId,
  victimPlayerId,
  onMove,
  onKillTarget,
  showControls = true,
  compact = false,
}: Mansion3DGridMapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Local animated player position state
  const myPlayer = players.find((p) => p.id === currentPlayerId);
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number }>({
    x: myPlayer?.x || 400,
    y: myPlayer?.y || 250,
  });

  const [nearbyVictim, setNearbyVictim] = useState<PublicPlayer | null>(null);
  const [selectedEvidenceRoom, setSelectedEvidenceRoom] = useState<MansionRoomId | null>(null);

  // Sync initial position
  useEffect(() => {
    if (myPlayer?.x !== undefined && myPlayer?.y !== undefined) {
      if (!targetPos) {
        setCurrentPos({ x: myPlayer.x, y: myPlayer.y });
      }
    }
  }, [myPlayer?.x, myPlayer?.y, targetPos]);

  // Handle local target move
  const handleMoveTo = useCallback(
    (targetX: number, targetY: number) => {
      if (!canMove) return;
      const clamped = clampMansionPosition(targetX, targetY);
      setTargetPos(clamped);
      sound.playFootsteps();
      sound.triggerVibrate(25);
    },
    [canMove]
  );

  // D-Pad movement step
  const handleStep = useCallback(
    (dx: number, dy: number) => {
      if (!canMove) return;
      const nx = (targetPos ? targetPos.x : currentPos.x) + dx;
      const ny = (targetPos ? targetPos.y : currentPos.y) + dy;
      handleMoveTo(nx, ny);
    },
    [canMove, currentPos, targetPos, handleMoveTo]
  );

  // Check proximity to potential victims for the killer
  useEffect(() => {
    if (!isKiller || !myPlayer) {
      setNearbyVictim(null);
      return;
    }

    const aliveVictims = players.filter(
      (p) => p.id !== currentPlayerId && p.isAlive && p.x !== undefined && p.y !== undefined
    );

    let closest: PublicPlayer | null = null;
    let minDist = ATTACK_RANGE;

    aliveVictims.forEach((victim) => {
      const dist = Math.hypot((victim.x || 0) - currentPos.x, (victim.y || 0) - currentPos.y);
      if (dist < minDist) {
        minDist = dist;
        closest = victim;
      }
    });

    setNearbyVictim(closest);
  }, [isKiller, currentPlayerId, myPlayer, players, currentPos]);

  // Smooth movement animation loop + 3D rendering
  useEffect(() => {
    let animId: number;

    const animate = () => {
      // Step position towards target
      if (targetPos) {
        const dx = targetPos.x - currentPos.x;
        const dy = targetPos.y - currentPos.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 4) {
          setCurrentPos(targetPos);
          setTargetPos(null);
          const room = getRoomAtPosition(targetPos.x, targetPos.y);
          if (onMove) onMove(targetPos.x, targetPos.y, room);
        } else {
          const speed = 7;
          const nextPos = {
            x: currentPos.x + (dx / dist) * speed,
            y: currentPos.y + (dy / dist) * speed,
          };
          setCurrentPos(nextPos);
          const room = getRoomAtPosition(nextPos.x, nextPos.y);
          if (onMove && Math.random() < 0.2) {
            onMove(Math.round(nextPos.x), Math.round(nextPos.y), room);
          }
        }
      }

      // Draw 3D Mansion Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawMansion3D(
            ctx,
            canvas.width,
            canvas.height,
            players,
            currentPos,
            currentPlayerId,
            isNight,
            isKiller,
            lastStabLocation,
            forensicEvidence,
            highlightRoomId,
            victimPlayerId,
            nearbyVictim
          );
        }
      }

      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [
    targetPos,
    currentPos,
    players,
    currentPlayerId,
    isNight,
    isKiller,
    lastStabLocation,
    forensicEvidence,
    highlightRoomId,
    victimPlayerId,
    nearbyVictim,
    onMove,
  ]);

  // Click on Canvas to Walk
  const handleCanvasClick = (e: MouseEvent<HTMLCanvasElement>) => {
    if (!canMove) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    handleMoveTo(clickX, clickY);
  };

  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col items-center select-none ${
        compact ? 'max-w-md' : 'max-w-4xl'
      } mx-auto`}
    >
      {/* 3D Canvas Viewport */}
      <div className="w-full relative rounded-3xl overflow-hidden border-2 border-neutral-800/90 shadow-2xl bg-[#09090b]">
        {/* Canvas Render */}
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onClick={handleCanvasClick}
          className="w-full h-auto aspect-[16/10] cursor-pointer block"
        />

        {/* Night Ambient Darkness Overlay & Vignette */}
        {isNight && (
          <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-black/40 to-black/80" />
        )}

        {/* Current Room Badge in 3D */}
        <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/85 border border-neutral-700/80 backdrop-blur-md shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-neutral-200">
            {MANSION_ROOMS.find((r) => r.id === getRoomAtPosition(currentPos.x, currentPos.y))?.name || 'Corredor Central'}
          </span>
        </div>

        {/* Evidence Inspector Indicator */}
        {forensicEvidence && (
          <div className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/50 backdrop-blur-md text-amber-300 text-xs font-bold shadow-lg animate-pulse">
            <Footprints className="w-3.5 h-3.5" />
            <span>ROTA DE FUGA LOCALIZADA</span>
          </div>
        )}

        {/* Killer Strike Floating Action Button */}
        {isKiller && canMove && nearbyVictim && onKillTarget && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                sound.playKillStab();
                sound.triggerVictimDeathVibrate();
                onKillTarget(nearbyVictim.id, currentPos.x, currentPos.y);
              }}
              className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-sm uppercase tracking-widest flex items-center gap-2.5 shadow-[0_0_30px_rgba(225,29,72,0.8)] border-2 border-rose-400 cursor-pointer animate-pulse transition-all"
            >
              <Flame className="w-5 h-5 text-amber-300" />
              <span>🔪 ATACAR COM A FACA: {nearbyVictim.name}</span>
            </button>
          </div>
        )}
      </div>

      {/* Interactive Quick-Navigation & Virtual 3D D-Pad */}
      {showControls && canMove && (
        <div className="w-full mt-3 flex flex-col md:flex-row items-center justify-between gap-3 px-1">
          {/* Quick Room Jump Buttons */}
          <div className="flex-1 w-full grid grid-cols-3 sm:grid-cols-6 gap-1.5">
            {MANSION_ROOMS.map((room) => {
              const isHere = getRoomAtPosition(currentPos.x, currentPos.y) === room.id;
              const isCrime = forensicEvidence?.crimeRoomId === room.id;
              return (
                <button
                  key={room.id}
                  onClick={() => {
                    const center = getRoomCenter(room.id);
                    handleMoveTo(center.x, center.y);
                  }}
                  className={`px-2 py-2 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                    isCrime
                      ? 'bg-rose-950/80 border-rose-500 text-rose-300 shadow-[0_0_12px_rgba(225,29,72,0.4)]'
                      : isHere
                      ? 'bg-neutral-800 border-amber-400/80 text-amber-400 shadow-md scale-105'
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-400 hover:text-neutral-200 hover:border-neutral-700'
                  }`}
                >
                  <span className="text-base leading-none mb-0.5">{room.icon}</span>
                  <span className="text-[10px] font-bold uppercase truncate max-w-full">
                    {room.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Touch Virtual D-Pad */}
          <div className="shrink-0 flex items-center justify-center p-2 rounded-2xl bg-neutral-900/90 border border-neutral-800 shadow-xl">
            <div className="grid grid-cols-3 gap-1 w-28 h-28">
              <div />
              <button
                onClick={() => handleStep(0, -35)}
                className="rounded-xl bg-neutral-800 active:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer transition-colors"
                aria-label="Cima"
              >
                <ChevronUp className="w-5 h-5" />
              </button>
              <div />

              <button
                onClick={() => handleStep(-35, 0)}
                className="rounded-xl bg-neutral-800 active:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer transition-colors"
                aria-label="Esquerda"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="rounded-xl bg-neutral-950 flex items-center justify-center text-neutral-500">
                <Crosshair className="w-4 h-4 opacity-50" />
              </div>

              <button
                onClick={() => handleStep(35, 0)}
                className="rounded-xl bg-neutral-800 active:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer transition-colors"
                aria-label="Direita"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div />
              <button
                onClick={() => handleStep(0, 35)}
                className="rounded-xl bg-neutral-800 active:bg-neutral-700 flex items-center justify-center text-neutral-300 hover:text-white cursor-pointer transition-colors"
                aria-label="Baixo"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
              <div />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------------
// 3D Canvas Rendering Engine for Mansion & Avatars
// ----------------------------------------------------------------------------------
function drawMansion3D(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  players: PublicPlayer[],
  myPos: { x: number; y: number },
  myId?: string,
  isNight: boolean = false,
  isKiller: boolean = false,
  lastStab?: { x: number; y: number; roomId?: MansionRoomId } | null,
  forensic?: ForensicEvidence | null,
  highlightRoom?: MansionRoomId | null,
  victimId?: string | null,
  targetVictim?: PublicPlayer | null
) {
  // Clear canvas
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, 0, w, h);

  // Draw Corridors & Stone Foundations
  ctx.fillStyle = '#111115';
  ctx.fillRect(20, 20, w - 40, h - 40);

  // Subtle 3D Grid Floor Texture
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = 32;
  for (let x = 20; x < w - 20; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 20);
    ctx.lineTo(x, h - 20);
    ctx.stroke();
  }
  for (let y = 20; y < h - 20; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(w - 20, y);
    ctx.stroke();
  }

  // Draw Each 3D Room
  Object.values(MANSION_ROOM_BOUNDS).forEach((b) => {
    const isRoomHighlighted = highlightRoom === b.id || forensic?.crimeRoomId === b.id;
    const isEscapeRoom = forensic?.killerEscapeRoomId === b.id;

    // 3D Floor Base with Depth
    ctx.save();

    // 3D Shadow underneath room floor
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    roundRect(ctx, b.x + 4, b.y + 6, b.w, b.h, 16);
    ctx.fill();

    // Room Floor Texture & Background
    if (b.id === 'garden') {
      ctx.fillStyle = '#062817'; // Dark Emerald Grass
    } else if (b.id === 'kitchen') {
      ctx.fillStyle = '#221815'; // Dark terracotta tiles
    } else if (b.id === 'basement') {
      ctx.fillStyle = '#101720'; // Electric slate
    } else if (b.id === 'library') {
      ctx.fillStyle = '#1e1424'; // Vintage mahogany
    } else {
      ctx.fillStyle = '#17171d'; // Polished parquet
    }

    ctx.beginPath();
    roundRect(ctx, b.x, b.y, b.w, b.h, 16);
    ctx.fill();

    // 3D Back Walls (isometric elevation)
    ctx.fillStyle = isRoomHighlighted ? 'rgba(225, 29, 72, 0.25)' : 'rgba(255, 255, 255, 0.04)';
    ctx.beginPath();
    roundRect(ctx, b.x + 4, b.y + 4, b.w - 8, 28, 8);
    ctx.fill();

    // Room Border
    ctx.strokeStyle = isRoomHighlighted
      ? '#e11d48'
      : isEscapeRoom
      ? '#f59e0b'
      : 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = isRoomHighlighted || isEscapeRoom ? 3 : 1.5;
    ctx.stroke();

    // Doorway cutouts
    ctx.fillStyle = '#0a0a0c';
    if (b.doorX && b.doorY) {
      ctx.beginPath();
      ctx.arc(b.doorX, b.doorY, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.stroke();
    }

    // Room 3D Isometric Furniture Landmark
    drawRoom3DFurniture(ctx, b);

    // Room 3D Header Badge
    const roomData = MANSION_ROOMS.find((r) => r.id === b.id);
    if (roomData) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.beginPath();
      roundRect(ctx, b.x + 12, b.y + 8, 120, 22, 11);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.fillStyle = isRoomHighlighted ? '#fb7185' : '#e5e5e5';
      ctx.textAlign = 'left';
      ctx.fillText(`${roomData.icon} ${roomData.name.split(' ')[0]}`, b.x + 20, b.y + 23);
    }

    // Crime Scene Caution Tape around Crime Room
    if (forensic?.crimeRoomId === b.id) {
      drawCautionTape(ctx, b);
    }

    ctx.restore();
  });

  // Draw 3D Forensic Blood Trails / Footprints (if evidence available)
  if (forensic && forensic.trailPoints && forensic.trailPoints.length > 0) {
    ctx.save();
    forensic.trailPoints.forEach((pt, index) => {
      // 3D Red Blood Footprint
      ctx.fillStyle = `rgba(225, 29, 72, ${0.85 - index * 0.12})`;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, 5, 3, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Splatter drop
      ctx.fillStyle = 'rgba(190, 18, 60, 0.9)';
      ctx.beginPath();
      ctx.arc(pt.x + 4, pt.y - 3, 1.8, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // Draw Crime Scene Chalk Outline if there was a stab
  if (lastStab) {
    drawChalkOutline(ctx, lastStab.x, lastStab.y);
  }

  // Draw 3D Night Darkness & Flashlight Cone for current player
  if (isNight) {
    ctx.save();
    // Create dark shroud everywhere except around players
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;
    const mCtx = maskCanvas.getContext('2d');
    if (mCtx) {
      mCtx.fillStyle = 'rgba(0, 0, 0, 0.88)';
      mCtx.fillRect(0, 0, w, h);

      // Current player flashlight
      const lightGrad = mCtx.createRadialGradient(myPos.x, myPos.y, 10, myPos.x, myPos.y, 110);
      lightGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      lightGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.5)');
      lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      mCtx.globalCompositeOperation = 'destination-out';
      mCtx.fillStyle = lightGrad;
      mCtx.beginPath();
      mCtx.arc(myPos.x, myPos.y, 110, 0, Math.PI * 2);
      mCtx.fill();
    }
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.restore();
  }

  // Draw Killer Proximity Danger Aura
  if (isKiller && isNight) {
    ctx.save();
    ctx.strokeStyle = 'rgba(225, 29, 72, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(myPos.x, myPos.y, ATTACK_RANGE, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  // Draw 3D Target Reticle if a victim is in range
  if (targetVictim && targetVictim.x !== undefined && targetVictim.y !== undefined) {
    drawTargetReticle(ctx, targetVictim.x, targetVictim.y);
  }

  // Sort and draw players in 3D (Y-sorted for proper 3D isometric layering)
  const sortedPlayers = [...players].sort((a, b) => {
    const ay = a.id === myId ? myPos.y : a.y || 0;
    const by = b.id === myId ? myPos.y : b.y || 0;
    return ay - by;
  });

  sortedPlayers.forEach((p) => {
    const isMe = p.id === myId;
    const px = isMe ? myPos.x : p.x || 400;
    const py = isMe ? myPos.y : p.y || 250;
    const isVictimDead = victimId === p.id || !p.isAlive;

    drawAvatar3D(ctx, px, py, p, isMe, isVictimDead);
  });
}

// Draw 3D Room Furniture Landmark
function drawRoom3DFurniture(ctx: CanvasRenderingContext2D, b: { id: MansionRoomId; x: number; y: number; w: number; h: number }) {
  ctx.save();
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2 + 10;

  if (b.id === 'kitchen') {
    // 3D Kitchen Island
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(cx - 38, cy - 14, 76, 32);
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(cx - 40, cy - 18, 80, 28);
    // Stainless top
    ctx.fillStyle = '#e4e4e7';
    ctx.fillRect(cx - 38, cy - 22, 76, 8);
    // Knife block
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx + 12, cy - 28, 12, 10);
  } else if (b.id === 'living') {
    // 3D Fireplace with animated embers
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(cx - 32, b.y + 14, 64, 20);
    ctx.fillStyle = '#44403c';
    ctx.fillRect(cx - 30, b.y + 10, 60, 18);
    // Glowing hearth
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(cx - 18, b.y + 14, 36, 10);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(cx - 10, b.y + 16, 20, 6);
  } else if (b.id === 'bedroom') {
    // 3D Velvet Bed
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.fillRect(cx - 32, cy - 22, 64, 48);
    ctx.fillStyle = '#4338ca';
    ctx.fillRect(cx - 30, cy - 24, 60, 44);
    // Pillows
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 24, cy - 20, 20, 10);
    ctx.fillRect(cx + 4, cy - 20, 20, 10);
  } else if (b.id === 'library') {
    // 3D Bookcases
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - 40, b.y + 12, 80, 14);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(cx - 38, b.y + 14, 76, 6);
  } else if (b.id === 'basement') {
    // 3D Electrical Generator
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - 26, cy - 16, 52, 32);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(cx - 20, cy - 10, 12, 12);
  } else if (b.id === 'garden') {
    // 3D Garden Fountain
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 26, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0284c7';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// Draw 3D Chalk Outline of Murder Victim
function drawChalkOutline(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  // Blood Splatter
  ctx.fillStyle = 'rgba(159, 18, 57, 0.7)';
  ctx.beginPath();
  ctx.arc(x + 6, y + 4, 16, 0, Math.PI * 2);
  ctx.fill();

  // White Chalk Silhouette
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.lineWidth = 2;
  ctx.setLineDash([3, 2]);

  // Head
  ctx.beginPath();
  ctx.arc(x, y - 12, 7, 0, Math.PI * 2);
  ctx.stroke();

  // Body & Torso
  ctx.beginPath();
  ctx.moveTo(x, y - 5);
  ctx.lineTo(x - 6, y + 14);
  ctx.moveTo(x, y - 5);
  ctx.lineTo(x + 8, y + 12);
  // Arms
  ctx.moveTo(x - 14, y);
  ctx.lineTo(x + 14, y - 2);
  ctx.stroke();

  ctx.restore();
}

// Caution Tape on Room
function drawCautionTape(ctx: CanvasRenderingContext2D, b: { x: number; y: number; w: number; h: number }) {
  ctx.save();
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 4;
  ctx.setLineDash([12, 12]);
  ctx.strokeRect(b.x + 4, b.y + 4, b.w - 8, b.h - 8);
  ctx.restore();
}

// 3D Lock-on Reticle
function drawTargetReticle(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.arc(x, y, 22, 0, Math.PI * 2);
  ctx.stroke();

  // Reticle notches
  ctx.beginPath();
  ctx.moveTo(x - 28, y);
  ctx.lineTo(x - 18, y);
  ctx.moveTo(x + 18, y);
  ctx.lineTo(x + 28, y);
  ctx.moveTo(x, y - 28);
  ctx.lineTo(x, y - 18);
  ctx.moveTo(x, y + 18);
  ctx.lineTo(x, y + 28);
  ctx.stroke();

  ctx.restore();
}

// Draw 3D Isometric Stylized Avatar
function drawAvatar3D(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  player: PublicPlayer,
  isMe: boolean,
  isDead: boolean
) {
  ctx.save();

  // 1. 3D Cast Shadow on Floor
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(x, y + 6, 15, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. 3D Cylindrical Capsule Body
  const color = player.avatar?.color || '#E50914';
  const bodyY = y - 10;

  // Body Gradient
  const bodyGrad = ctx.createLinearGradient(x - 10, bodyY, x + 10, bodyY);
  if (isDead) {
    bodyGrad.addColorStop(0, '#3f3f46');
    bodyGrad.addColorStop(1, '#18181b');
  } else {
    bodyGrad.addColorStop(0, '#ffffff');
    bodyGrad.addColorStop(0.3, color);
    bodyGrad.addColorStop(1, '#09090b');
  }

  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(x, bodyY, 11, 0, Math.PI * 2);
  ctx.fill();

  // 3. 3D Specular Highlight on Head
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.beginPath();
  ctx.arc(x - 3, bodyY - 3, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // 4. Floating 3D Emoji Badge
  ctx.font = '14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isDead ? '💀' : player.avatar?.emoji || '🎩', x, bodyY);

  // 5. Player Name Floating Label Pill
  ctx.font = 'bold 10px system-ui, sans-serif';
  const textWidth = ctx.measureText(player.name).width;

  ctx.fillStyle = isMe ? 'rgba(225, 29, 72, 0.9)' : 'rgba(0, 0, 0, 0.85)';
  ctx.beginPath();
  roundRect(ctx, x - textWidth / 2 - 6, y - 30, textWidth + 12, 16, 8);
  ctx.fill();

  if (isMe) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(player.name, x, y - 18);

  ctx.restore();
}

// Utility: Round Rectangle
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
