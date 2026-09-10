import type { MansionRoomId } from '../types';
export const NIGHT_TASKS: { roomId: MansionRoomId; title: string; instruction: string }[] = [
  { roomId: 'bedroom', title: 'Sintonizar o rádio', instruction: 'Repita a sequência para captar a transmissão.' },
  { roomId: 'kitchen', title: 'Fechar as válvulas', instruction: 'Feche os registros na ordem indicada.' },
  { roomId: 'living', title: 'Acertar o relógio', instruction: 'Ajuste as engrenagens na sequência.' },
  { roomId: 'library', title: 'Organizar os arquivos', instruction: 'Separe os documentos na ordem indicada.' },
  { roomId: 'garden', title: 'Acender as lanternas', instruction: 'Ligue as lanternas na ordem indicada.' },
  { roomId: 'basement', title: 'Revisar os fusíveis', instruction: 'Conecte os fusíveis na sequência correta.' },
];
