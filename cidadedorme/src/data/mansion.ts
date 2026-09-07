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

export function getMansionRoom(id?: MansionRoomId): MansionRoom {
  const found = MANSION_ROOMS.find((r) => r.id === id);
  return found || MANSION_ROOMS[0];
}
