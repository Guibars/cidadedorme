import { MansionRoom, MansionRoomId } from '../types';

export const MANSION_ROOMS: MansionRoom[] = [
  {
    id: 'bedroom',
    name: 'Quarto Principal',
    icon: '🛏️',
    color: '#6366F1',
    description: 'Camas de dossel e espelho coberto por cortinas de veludo escuro.',
  },
  {
    id: 'kitchen',
    name: 'Cozinha da Mansão',
    icon: '🍳',
    color: '#EF4444',
    description: 'Bancada de mármore e suporte de talheres onde facas costumam sumir.',
  },
  {
    id: 'living',
    name: 'Sala de Estar',
    icon: '🛋️',
    color: '#F59E0B',
    description: 'Lareira apagada, tapete persa e relógio de pêndulo antigo.',
  },
  {
    id: 'garden',
    name: 'Quintal & Jardim',
    icon: '🌿',
    color: '#10B981',
    description: 'Caramanchão de ferro fundido sob a luz enluarada da noite.',
  },
  {
    id: 'library',
    name: 'Biblioteca',
    icon: '📚',
    color: '#8B5CF6',
    description: 'Estantes altas com volumes antigos e cantos escuros entre os corredores.',
  },
  {
    id: 'basement',
    name: 'Porão Elétrico',
    icon: '⚡',
    color: '#06B6D4',
    description: 'Quadro geral de disjuntores da mansão e gerador barulhento.',
  },
];

export interface MansionRoomBounds {
  id: MansionRoomId;
  x: number;
  y: number;
  w: number;
  h: number;
  doorX: number;
  doorY: number;
}

export const MANSION_ROOM_BOUNDS: Record<MansionRoomId, MansionRoomBounds> = {
  bedroom: { id: 'bedroom', x: 20, y: 20, w: 215, h: 165, doorX: 235, doorY: 110 },
  kitchen: { id: 'kitchen', x: 565, y: 20, w: 215, h: 165, doorX: 565, doorY: 110 },
  living: { id: 'living', x: 285, y: 90, w: 235, h: 200, doorX: 285, doorY: 205 },
  library: { id: 'library', x: 20, y: 280, w: 215, h: 180, doorX: 235, doorY: 380 },
  garden: { id: 'garden', x: 565, y: 280, w: 215, h: 180, doorX: 565, doorY: 380 },
  basement: { id: 'basement', x: 285, y: 350, w: 235, h: 130, doorX: 400, doorY: 350 },
};

export function getMansionRoom(id?: MansionRoomId): MansionRoom {
  const found = MANSION_ROOMS.find((r) => r.id === id);
  return found || MANSION_ROOMS[0];
}

export function getRoomCenter(id: MansionRoomId): { x: number; y: number } {
  const b = MANSION_ROOM_BOUNDS[id] || MANSION_ROOM_BOUNDS.living;
  return {
    x: Math.round(b.x + b.w / 2),
    y: Math.round(b.y + b.h / 2),
  };
}

export function getRoomAtPosition(x: number, y: number): MansionRoomId {
  for (const [id, b] of Object.entries(MANSION_ROOM_BOUNDS)) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      return id as MansionRoomId;
    }
  }
  // If in corridor, map to closest room
  if (y < 250) {
    if (x < 350) return 'bedroom';
    if (x > 450) return 'kitchen';
    return 'living';
  } else {
    if (x < 350) return 'library';
    if (x > 450) return 'garden';
    return 'basement';
  }
}

export function clampMansionPosition(x: number, y: number): { x: number; y: number } {
  const minX = 40;
  const maxX = 760;
  const minY = 40;
  const maxY = 460;
  return {
    x: Math.max(minX, Math.min(maxX, x)),
    y: Math.max(minY, Math.min(maxY, y)),
  };
}
