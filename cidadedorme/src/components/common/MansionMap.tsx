import React from 'react';
import { MANSION_ROOMS, getMansionRoom } from '../../data/mansion';
import { MansionRoomId, PublicPlayer } from '../../types';
import { Skull, MapPin, Sparkles } from 'lucide-react';

interface MansionMapProps {
  players: PublicPlayer[];
  selectedRoomId?: MansionRoomId;
  highlightRoomId?: MansionRoomId;
  victimPlayerId?: string;
  onSelectRoom?: (roomId: MansionRoomId) => void;
  compact?: boolean;
  interactive?: boolean;
  currentPlayerId?: string;
  title?: string;
}

export function MansionMap({
  players,
  selectedRoomId,
  highlightRoomId,
  victimPlayerId,
  onSelectRoom,
  compact = false,
  interactive = false,
  currentPlayerId,
  title,
}: MansionMapProps) {
  return (
    <div className="w-full flex flex-col items-center">
      {title && (
        <div className="flex items-center gap-2 mb-3 text-neutral-300">
          <MapPin className="w-4 h-4 text-rose-500 animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider font-['Cinzel']">
            {title}
          </span>
        </div>
      )}

      {/* Mansion Floor Grid */}
      <div
        className={`w-full grid gap-2.5 ${
          compact
            ? 'grid-cols-2 sm:grid-cols-3'
            : 'grid-cols-2 lg:grid-cols-3'
        }`}
      >
        {MANSION_ROOMS.map((room) => {
          const isSelected = selectedRoomId === room.id;
          const isHighlighted = highlightRoomId === room.id;

          // Players in this room
          const roomPlayers = players.filter(
            (p) => (p.currentRoomId || 'living') === room.id
          );

          return (
            <div
              key={room.id}
              onClick={() => interactive && onSelectRoom && onSelectRoom(room.id)}
              className={`relative rounded-2xl p-3 flex flex-col justify-between transition-all select-none ${
                interactive ? 'cursor-pointer active:scale-97' : ''
              } ${
                isHighlighted
                  ? 'bg-rose-950/70 border-2 border-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.4)] animate-pulse'
                  : isSelected
                  ? 'bg-amber-950/60 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                  : 'bg-neutral-900/80 hover:bg-neutral-900 border border-neutral-800/80 hover:border-neutral-700'
              } ${compact ? 'min-h-[110px]' : 'min-h-[140px]'}`}
            >
              {/* Room Header */}
              <div className="flex items-start justify-between gap-1 mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl" role="img" aria-label={room.name}>
                    {room.icon}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-100 uppercase tracking-tight">
                      {room.name}
                    </h4>
                    {!compact && (
                      <p className="text-[10px] text-neutral-400 line-clamp-1 leading-none mt-0.5">
                        {room.description}
                      </p>
                    )}
                  </div>
                </div>

                {isHighlighted && (
                  <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-black uppercase tracking-wider animate-bounce">
                    CRIME!
                  </span>
                )}

                {isSelected && !isHighlighted && (
                  <span className="px-1.5 py-0.5 rounded bg-amber-500 text-neutral-950 text-[9px] font-black uppercase tracking-wider">
                    AQUI
                  </span>
                )}
              </div>

              {/* Bonequinhos / Players in Room (Among Us style) */}
              <div className="flex flex-wrap items-center gap-1.5 mt-auto pt-1">
                {roomPlayers.length === 0 ? (
                  <span className="text-[10px] text-neutral-600 italic">
                    Vazio
                  </span>
                ) : (
                  roomPlayers.map((p) => {
                    const isVictim = p.id === victimPlayerId || !p.isAlive;
                    const isCurrent = p.id === currentPlayerId;

                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                          isVictim
                            ? 'bg-rose-950/80 border-rose-600 text-rose-300 line-through'
                            : isCurrent
                            ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-sm'
                            : 'bg-neutral-800/90 border-neutral-700 text-neutral-200'
                        }`}
                        title={`${p.name} ${isVictim ? '(Eliminado)' : ''}`}
                      >
                        {isVictim ? (
                          <Skull className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        ) : (
                          <span
                            className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] shrink-0"
                            style={{
                              background: p.avatar?.bgGradient
                                ? undefined
                                : '#334155',
                            }}
                          >
                            {p.avatar?.emoji || '👤'}
                          </span>
                        )}
                        <span className="truncate max-w-[70px]">
                          {p.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[8px] bg-amber-400 text-neutral-950 px-1 rounded-full font-black">
                            VOCÊ
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Interactive prompt */}
              {interactive && (
                <div className="absolute inset-0 rounded-2xl pointer-events-none hover:bg-white/5 transition-colors" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
