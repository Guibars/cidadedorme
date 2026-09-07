import { useEffect, useRef, useState, useCallback, type MouseEvent, type PointerEvent } from 'react';
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
  Footprints,
  Sparkles,
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
    victimId?: string;
    victimName?: string;
    roomId?: MansionRoomId;
  } | null;
  forensicEvidence?: ForensicEvidence | null;
  highlightRoomId?: MansionRoomId | null;
  victimPlayerId?: string | null;
  onMove?: (x: number, y: number, roomId: MansionRoomId) => void;
  onKillTarget?: (targetPlayerId: string, x: number, y: number) => void;
  showControls?: boolean;
  compact?: boolean;
}

const ATTACK_RANGE = 85;

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
  const isPointerDownRef = useRef<boolean>(false);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Local animated player position state
  const myPlayer = players.find((p) => p.id === currentPlayerId);
  const [targetPos, setTargetPos] = useState<{ x: number; y: number } | null>(null);
  const [currentPos, setCurrentPos] = useState<{ x: number; y: number }>({
    x: myPlayer?.x || 400,
    y: myPlayer?.y || 250,
  });

  const [nearbyVictim, setNearbyVictim] = useState<PublicPlayer | null>(null);

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
      sound.triggerVibrate(20);
    },
    [canMove]
  );

  // D-Pad movement step
  const handleStep = useCallback(
    (dx: number, dy: number) => {
      if (!canMove) return;
      setTargetPos((prevTarget) => {
        const base = prevTarget || currentPos;
        const clamped = clampMansionPosition(base.x + dx, base.y + dy);
        sound.playFootsteps();
        sound.triggerVibrate(15);
        return clamped;
      });
    },
    [canMove, currentPos]
  );

  // Continuous D-Pad Hold support
  const startContinuousStep = (dx: number, dy: number) => {
    handleStep(dx, dy);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdIntervalRef.current = setInterval(() => {
      handleStep(dx, dy);
    }, 70);
  };

  const stopContinuousStep = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    };
  }, []);

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

  // Smooth movement animation loop + High-DPI 3D rendering
  useEffect(() => {
    let animId: number;

    const animate = () => {
      // Step position towards target with high speed (12px per frame = smooth & responsive)
      if (targetPos) {
        const dx = targetPos.x - currentPos.x;
        const dy = targetPos.y - currentPos.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 6) {
          setCurrentPos(targetPos);
          setTargetPos(null);
          const room = getRoomAtPosition(targetPos.x, targetPos.y);
          if (onMove) onMove(targetPos.x, targetPos.y, room);
        } else {
          const speed = 12; // Fast, fluid speed
          const nextPos = {
            x: currentPos.x + (dx / dist) * speed,
            y: currentPos.y + (dy / dist) * speed,
          };
          setCurrentPos(nextPos);
          const room = getRoomAtPosition(nextPos.x, nextPos.y);
          if (onMove && Math.random() < 0.25) {
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
            800,
            500,
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
    currentPos,
    targetPos,
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

  // Fluid Touch / Drag / Click to walk
  const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!canMove) return;
    isPointerDownRef.current = true;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 500 / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;
    handleMoveTo(clickX, clickY);
  };

  const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current || !canMove) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 500 / rect.height;
    const moveX = (e.clientX - rect.left) * scaleX;
    const moveY = (e.clientY - rect.top) * scaleY;
    handleMoveTo(moveX, moveY);
  };

  const handlePointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
    isPointerDownRef.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
  };

  return (
    <div ref={containerRef} className="w-full h-full flex flex-col items-center justify-center select-none min-h-0">
      {/* 3D Isometric Viewport Container */}
      <div className="relative w-full flex-1 min-h-0 max-h-[70vh] rounded-[2rem] overflow-hidden border-2 border-neutral-800 bg-[#09090d] shadow-[0_25px_65px_rgba(0,0,0,0.95)] flex items-center justify-center">
        {/* Canvas Render with High-DPI Resolution */}
        <canvas
          ref={canvasRef}
          width={1600}
          height={1000}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: 'none' }}
          className="max-w-full max-h-full w-auto h-auto object-contain cursor-crosshair block drop-shadow-2xl"
        />

        {/* Night Ambient Darkness Overlay & Vignette */}
        {isNight && (
          <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-black/35 to-black/85" />
        )}

        {/* Current Room Badge in 3D */}
        <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-2 px-4 py-2 rounded-2xl bg-black/90 border border-neutral-700/80 backdrop-blur-md shadow-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider text-neutral-100">
            {MANSION_ROOMS.find((r) => r.id === getRoomAtPosition(currentPos.x, currentPos.y))?.name ||
              'Corredor Central'}
          </span>
        </div>

        {/* Evidence Inspector Indicator */}
        {forensicEvidence && (
          <div className="absolute top-3 right-3 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/60 backdrop-blur-md text-amber-300 text-xs font-black shadow-lg animate-pulse">
            <Footprints className="w-4 h-4" />
            <span>ROTA DE FUGA DETECTADA</span>
          </div>
        )}

        {/* Killer Strike Floating Action Button */}
        {isKiller && canMove && nearbyVictim && onKillTarget && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 animate-in zoom-in-95 duration-150">
            <button
              onClick={() => {
                sound.playKillStab();
                sound.triggerVictimDeathVibrate();
                onKillTarget(nearbyVictim.id, currentPos.x, currentPos.y);
              }}
              className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-sm uppercase tracking-widest flex items-center gap-2.5 shadow-[0_0_35px_rgba(225,29,72,0.9)] border-2 border-rose-300 cursor-pointer animate-pulse transition-all"
            >
              <Flame className="w-5 h-5 text-amber-300" />
              <span>🔪 ATACAR COM A FACA: {nearbyVictim.name}</span>
            </button>
          </div>
        )}
      </div>

      {/* Interactive Quick-Navigation & Fluid D-Pad */}
      {showControls && canMove && (
        <div className="w-full mt-3 flex flex-col md:flex-row items-center justify-between gap-3 px-1">
          {/* Quick Room Jump Buttons */}
          <div className="flex-1 w-full grid grid-cols-3 sm:grid-cols-6 gap-2">
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
                  className={`px-2 py-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center active:scale-95 ${
                    isCrime
                      ? 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-[0_0_15px_rgba(225,29,72,0.5)]'
                      : isHere
                      ? 'bg-neutral-800 border-amber-400 text-amber-300 shadow-lg scale-105'
                      : 'bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700'
                  }`}
                >
                  <span className="text-lg leading-none mb-1">{room.icon}</span>
                  <span className="text-[11px] font-bold uppercase truncate max-w-full">
                    {room.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Fluid Touch D-Pad with continuous press/hold */}
          <div className="shrink-0 flex items-center justify-center p-2 rounded-2xl bg-neutral-900/95 border border-neutral-800 shadow-2xl">
            <div className="grid grid-cols-3 gap-1.5 w-32 h-32">
              <div />
              <button
                onPointerDown={() => startContinuousStep(0, -45)}
                onPointerUp={stopContinuousStep}
                onPointerLeave={stopContinuousStep}
                onPointerCancel={stopContinuousStep}
                className="rounded-2xl bg-neutral-800 hover:bg-neutral-700 active:bg-rose-600 active:text-white flex items-center justify-center text-neutral-200 transition-colors shadow-md select-none"
                aria-label="Cima"
              >
                <ChevronUp className="w-6 h-6" />
              </button>
              <div />

              <button
                onPointerDown={() => startContinuousStep(-45, 0)}
                onPointerUp={stopContinuousStep}
                onPointerLeave={stopContinuousStep}
                onPointerCancel={stopContinuousStep}
                className="rounded-2xl bg-neutral-800 hover:bg-neutral-700 active:bg-rose-600 active:text-white flex items-center justify-center text-neutral-200 transition-colors shadow-md select-none"
                aria-label="Esquerda"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <div className="rounded-2xl bg-neutral-950 flex items-center justify-center text-neutral-500 shadow-inner">
                <Crosshair className="w-5 h-5 opacity-60 text-amber-400" />
              </div>

              <button
                onPointerDown={() => startContinuousStep(45, 0)}
                onPointerUp={stopContinuousStep}
                onPointerLeave={stopContinuousStep}
                onPointerCancel={stopContinuousStep}
                className="rounded-2xl bg-neutral-800 hover:bg-neutral-700 active:bg-rose-600 active:text-white flex items-center justify-center text-neutral-200 transition-colors shadow-md select-none"
                aria-label="Direita"
              >
                <ChevronRight className="w-6 h-6" />
              </button>

              <div />
              <button
                onPointerDown={() => startContinuousStep(0, 45)}
                onPointerUp={stopContinuousStep}
                onPointerLeave={stopContinuousStep}
                onPointerCancel={stopContinuousStep}
                className="rounded-2xl bg-neutral-800 hover:bg-neutral-700 active:bg-rose-600 active:text-white flex items-center justify-center text-neutral-200 transition-colors shadow-md select-none"
                aria-label="Baixo"
              >
                <ChevronDown className="w-6 h-6" />
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
// 3D Canvas Rendering Engine for Mansion & Avatars (Sharp Retina 2X Resolution)
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
  ctx.save();
  // Clear full 2x canvas (1600x1000)
  ctx.clearRect(0, 0, 1600, 1000);
  // Scale by 2 for crisp 4K / Retina rendering
  ctx.scale(2, 2);

  // Deep Mansion Background
  ctx.fillStyle = '#08080c';
  ctx.fillRect(0, 0, w, h);

  // Corridors & Flagstone Foundations
  ctx.fillStyle = '#101015';
  ctx.fillRect(16, 16, w - 32, h - 32);

  // Subtle Isometric Corridor Floor Tiles
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  ctx.lineWidth = 1;
  const gridSize = 28;
  for (let x = 16; x < w - 16; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 16);
    ctx.lineTo(x, h - 16);
    ctx.stroke();
  }
  for (let y = 16; y < h - 16; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(16, y);
    ctx.lineTo(w - 16, y);
    ctx.stroke();
  }

  // Draw Wall Sconces (warm amber light along the corridors)
  const sconcePoints = [
    { x: 265, y: 120 },
    { x: 535, y: 120 },
    { x: 265, y: 380 },
    { x: 535, y: 380 },
    { x: 400, y: 120 },
    { x: 400, y: 340 },
  ];
  sconcePoints.forEach((s) => {
    const glow = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, 24);
    glow.addColorStop(0, 'rgba(245, 158, 11, 0.55)');
    glow.addColorStop(0.5, 'rgba(245, 158, 11, 0.15)');
    glow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 24, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(s.x, s.y, 3, 0, Math.PI * 2);
    ctx.fill();
  });

  // Draw Each 3D Room with distinctive architectural textures
  Object.values(MANSION_ROOM_BOUNDS).forEach((b) => {
    const isRoomHighlighted = highlightRoom === b.id || forensic?.crimeRoomId === b.id;
    const isEscapeRoom = forensic?.killerEscapeRoomId === b.id;

    ctx.save();

    // 3D Drop Shadow underneath room floor
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.beginPath();
    roundRect(ctx, b.x + 5, b.y + 7, b.w, b.h, 18);
    ctx.fill();

    // Room Floor Base
    drawRoomFloor(ctx, b);

    // 3D Back Walls (isometric elevation wall)
    ctx.fillStyle = isRoomHighlighted
      ? 'rgba(225, 29, 72, 0.3)'
      : 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    roundRect(ctx, b.x + 4, b.y + 4, b.w - 8, 30, 10);
    ctx.fill();

    // Wall upper rim highlight
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(b.x + 10, b.y + 34);
    ctx.lineTo(b.x + b.w - 10, b.y + 34);
    ctx.stroke();

    // Room Outer Border
    ctx.strokeStyle = isRoomHighlighted
      ? '#e11d48'
      : isEscapeRoom
      ? '#f59e0b'
      : 'rgba(255, 255, 255, 0.14)';
    ctx.lineWidth = isRoomHighlighted || isEscapeRoom ? 3.5 : 1.5;
    ctx.stroke();

    // Doorway Archway
    if (b.doorX && b.doorY) {
      ctx.fillStyle = '#08080c';
      ctx.beginPath();
      ctx.arc(b.doorX, b.doorY, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // 3D Room Furniture Landmark
    drawRoom3DFurniture(ctx, b);

    // Room Header 3D Plaque (Bold, High Contrast, visible on TV)
    const roomData = MANSION_ROOMS.find((r) => r.id === b.id);
    if (roomData) {
      ctx.fillStyle = 'rgba(10, 10, 15, 0.88)';
      ctx.beginPath();
      roundRect(ctx, b.x + 12, b.y + 8, 140, 24, 12);
      ctx.fill();
      ctx.strokeStyle = isRoomHighlighted
        ? 'rgba(225, 29, 72, 0.8)'
        : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.fillStyle = isRoomHighlighted ? '#fda4af' : '#f5f5f5';
      ctx.textAlign = 'left';
      ctx.fillText(`${roomData.icon} ${roomData.name.split(' ')[0]}`, b.x + 22, b.y + 24);
    }

    // Crime Scene Tape if this was the crime room
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
      ctx.fillStyle = `rgba(225, 29, 72, ${0.9 - index * 0.12})`;
      ctx.beginPath();
      ctx.ellipse(pt.x, pt.y, 6, 3.5, 0.35, 0, Math.PI * 2);
      ctx.fill();

      // Splatter drops
      ctx.fillStyle = 'rgba(190, 18, 60, 0.95)';
      ctx.beginPath();
      ctx.arc(pt.x + 5, pt.y - 3, 2, 0, Math.PI * 2);
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
    // Ambient darkness with flashlight cutouts
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = w;
    maskCanvas.height = h;
    const mCtx = maskCanvas.getContext('2d');
    if (mCtx) {
      mCtx.fillStyle = 'rgba(0, 0, 0, 0.86)';
      mCtx.fillRect(0, 0, w, h);

      // Current player flashlight
      const lightRadius = 125;
      const lightGrad = mCtx.createRadialGradient(
        myPos.x,
        myPos.y,
        15,
        myPos.x,
        myPos.y,
        lightRadius
      );
      lightGrad.addColorStop(0, 'rgba(0, 0, 0, 1)');
      lightGrad.addColorStop(0.7, 'rgba(0, 0, 0, 0.6)');
      lightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      mCtx.globalCompositeOperation = 'destination-out';
      mCtx.fillStyle = lightGrad;
      mCtx.beginPath();
      mCtx.arc(myPos.x, myPos.y, lightRadius, 0, Math.PI * 2);
      mCtx.fill();
    }
    ctx.drawImage(maskCanvas, 0, 0);
    ctx.restore();
  }

  // Draw Killer Proximity Danger Aura
  if (isKiller && isNight) {
    ctx.save();
    ctx.strokeStyle = 'rgba(225, 29, 72, 0.45)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
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

  ctx.restore();
}

// Draw Distinctive Architectural Floor Textures
function drawRoomFloor(
  ctx: CanvasRenderingContext2D,
  b: { id: MansionRoomId; x: number; y: number; w: number; h: number }
) {
  ctx.beginPath();
  roundRect(ctx, b.x, b.y, b.w, b.h, 16);

  if (b.id === 'kitchen') {
    // Checkered Black and White Ceramic Floor
    ctx.fillStyle = '#1c1917';
    ctx.fill();
    const tileSize = 24;
    ctx.save();
    ctx.clip();
    for (let tx = b.x; tx < b.x + b.w; tx += tileSize) {
      for (let ty = b.y; ty < b.y + b.h; ty += tileSize) {
        if ((Math.floor((tx - b.x) / tileSize) + Math.floor((ty - b.y) / tileSize)) % 2 === 0) {
          ctx.fillStyle = '#292524';
          ctx.fillRect(tx, ty, tileSize, tileSize);
        }
      }
    }
    ctx.restore();
  } else if (b.id === 'living') {
    // Rich Walnut Wood + Central Crimson Persian Rug
    ctx.fillStyle = '#231812';
    ctx.fill();
    // Central rug
    ctx.fillStyle = '#581c25';
    ctx.beginPath();
    roundRect(ctx, b.x + 35, b.y + 40, b.w - 70, b.h - 75, 12);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  } else if (b.id === 'library') {
    // Polished Mahogany Herringbone Wood
    ctx.fillStyle = '#1b120c';
    ctx.fill();
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.12)';
    ctx.lineWidth = 1;
    for (let lx = b.x; lx < b.x + b.w; lx += 18) {
      ctx.beginPath();
      ctx.moveTo(lx, b.y);
      ctx.lineTo(lx, b.y + b.h);
      ctx.stroke();
    }
  } else if (b.id === 'bedroom') {
    // Royal Violet Velvet Carpet
    ctx.fillStyle = '#1e142c';
    ctx.fill();
    ctx.fillStyle = '#2d1b46';
    ctx.beginPath();
    roundRect(ctx, b.x + 25, b.y + 35, b.w - 50, b.h - 60, 10);
    ctx.fill();
  } else if (b.id === 'basement') {
    // Industrial Slate & Metallic Grate
    ctx.fillStyle = '#0e1726';
    ctx.fill();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.lineWidth = 1;
    for (let by = b.y; by < b.y + b.h; by += 16) {
      ctx.beginPath();
      ctx.moveTo(b.x, by);
      ctx.lineTo(b.x + b.w, by);
      ctx.stroke();
    }
  } else if (b.id === 'garden') {
    // Lush Emerald Lawn with Flagstone Stepping Stones
    ctx.fillStyle = '#062312';
    ctx.fill();
    // Flagstones
    ctx.fillStyle = '#27272a';
    ctx.beginPath();
    ctx.ellipse(b.x + 60, b.y + 70, 14, 9, 0.2, 0, Math.PI * 2);
    ctx.ellipse(b.x + 110, b.y + 110, 16, 10, -0.3, 0, Math.PI * 2);
    ctx.ellipse(b.x + 160, b.y + 75, 14, 9, 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw 3D Room Furniture Landmark
function drawRoom3DFurniture(
  ctx: CanvasRenderingContext2D,
  b: { id: MansionRoomId; x: number; y: number; w: number; h: number }
) {
  ctx.save();
  const cx = b.x + b.w / 2;
  const cy = b.y + b.h / 2 + 10;

  if (b.id === 'kitchen') {
    // 3D Kitchen Marble Island
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(cx - 38, cy - 12, 76, 30);
    ctx.fillStyle = '#3f3f46';
    ctx.fillRect(cx - 40, cy - 16, 80, 26);
    // Stainless steel top
    ctx.fillStyle = '#e4e4e7';
    ctx.fillRect(cx - 38, cy - 20, 76, 8);
    // Knife block
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx + 14, cy - 26, 12, 10);
  } else if (b.id === 'living') {
    // 3D Fireplace with animated embers
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(cx - 32, b.y + 16, 64, 20);
    ctx.fillStyle = '#44403c';
    ctx.fillRect(cx - 30, b.y + 12, 60, 18);
    // Glowing hearth
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(cx - 18, b.y + 16, 36, 10);
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(cx - 10, b.y + 18, 20, 6);
  } else if (b.id === 'bedroom') {
    // 3D Velvet Bed
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(cx - 32, cy - 20, 64, 46);
    ctx.fillStyle = '#4338ca';
    ctx.fillRect(cx - 30, cy - 22, 60, 42);
    // White Pillows
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(cx - 24, cy - 18, 20, 9);
    ctx.fillRect(cx + 4, cy - 18, 20, 9);
  } else if (b.id === 'library') {
    // 3D Wooden Bookcases
    ctx.fillStyle = '#78350f';
    ctx.fillRect(cx - 42, b.y + 14, 84, 14);
    ctx.fillStyle = '#b45309';
    ctx.fillRect(cx - 40, b.y + 16, 80, 6);
  } else if (b.id === 'basement') {
    // 3D Electrical Generator & Fusebox
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - 28, cy - 14, 56, 30);
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(cx - 22, cy - 8, 14, 12);
    // Glowing status LED
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(cx + 12, cy - 2, 3, 0, Math.PI * 2);
    ctx.fill();
  } else if (b.id === 'garden') {
    // 3D Garden Stone Fountain
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(cx, cy, 28, 18, 0, 0, Math.PI * 2);
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
  ctx.fillStyle = 'rgba(159, 18, 57, 0.75)';
  ctx.beginPath();
  ctx.arc(x + 5, y + 4, 18, 0, Math.PI * 2);
  ctx.fill();

  // White Chalk Silhouette
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
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
function drawCautionTape(
  ctx: CanvasRenderingContext2D,
  b: { x: number; y: number; w: number; h: number }
) {
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
  ctx.arc(x, y, 24, 0, Math.PI * 2);
  ctx.stroke();

  // Reticle notches
  ctx.beginPath();
  ctx.moveTo(x - 30, y);
  ctx.lineTo(x - 20, y);
  ctx.moveTo(x + 20, y);
  ctx.lineTo(x + 30, y);
  ctx.moveTo(x, y - 30);
  ctx.lineTo(x, y - 20);
  ctx.moveTo(x, y + 20);
  ctx.lineTo(x, y + 30);
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
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.beginPath();
  ctx.ellipse(x, y + 7, 16, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // 2. 3D Cylindrical Capsule Body
  const color = player.avatar?.color || '#E50914';
  const bodyY = y - 10;

  // Body Gradient
  const bodyGrad = ctx.createLinearGradient(x - 12, bodyY, x + 12, bodyY);
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
  ctx.arc(x, bodyY, 12, 0, Math.PI * 2);
  ctx.fill();

  // 3. 3D Specular Highlight on Head
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.beginPath();
  ctx.arc(x - 3, bodyY - 3, 4, 0, Math.PI * 2);
  ctx.fill();

  // 4. Floating 3D Emoji Badge
  ctx.font = '15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isDead ? '💀' : player.avatar?.emoji || '🎩', x, bodyY);

  // 5. Player Name Floating Label Pill
  ctx.font = 'bold 11px system-ui, sans-serif';
  const textWidth = ctx.measureText(player.name).width;

  ctx.fillStyle = isMe ? 'rgba(225, 29, 72, 0.95)' : 'rgba(0, 0, 0, 0.85)';
  ctx.beginPath();
  roundRect(ctx, x - textWidth / 2 - 7, y - 32, textWidth + 14, 18, 9);
  ctx.fill();

  if (isMe) {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText(player.name, x, y - 19);

  // 6. Speech Bubble
  if (player.chatMessage && player.isAlive) {
    ctx.font = 'bold 11px system-ui, sans-serif';
    const padding = 8;
    const maxWidth = 120;
    
    // Simple wrap text
    const words = player.chatMessage.split(' ');
    let lines = [];
    let currentLine = words[0];
    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);

    const bubbleWidth = Math.max(...lines.map(l => ctx.measureText(l).width)) + padding * 2;
    const bubbleHeight = lines.length * 14 + padding * 2;
    const bubbleX = x + 15;
    const bubbleY = y - 45 - bubbleHeight;

    // Draw speech bubble tail
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.beginPath();
    ctx.moveTo(x + 10, y - 30);
    ctx.lineTo(x + 25, y - 40);
    ctx.lineTo(x + 15, y - 45);
    ctx.fill();

    // Draw speech bubble body
    ctx.beginPath();
    roundRect(ctx, bubbleX, bubbleY, bubbleWidth, bubbleHeight, 8);
    ctx.fill();
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fill();
    ctx.shadowColor = 'transparent';

    ctx.fillStyle = '#111';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    lines.forEach((line, i) => {
      ctx.fillText(line, bubbleX + padding, bubbleY + padding + i * 14);
    });
  }

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
