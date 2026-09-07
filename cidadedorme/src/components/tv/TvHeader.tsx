import { Volume2, VolumeX } from 'lucide-react';
import { sound } from '../../utils/audio';
import { useState } from 'react';
import { PublicGameState } from '../../types';

interface TvHeaderProps {
  state?: PublicGameState;
  roomCode?: string;
  round?: number;
  maxRounds?: number;
  phaseLabel?: string;
}

export function TvHeader({ state, roomCode, round, maxRounds, phaseLabel }: TvHeaderProps) {
  const [audioEnabled, setAudioEnabled] = useState(sound.enabled);

  const activeRoomCode = state?.roomCode ?? roomCode ?? '';
  const activeRound = state?.round ?? round ?? 0;
  const activeMaxRounds = state?.maxRounds ?? maxRounds ?? 3;

  const getPhaseLabel = () => {
    if (phaseLabel) return phaseLabel;
    if (!state) return 'SALA';
    switch (state.phase) {
      case 'LOBBY':
        return 'SALA DE ESPERA';
      case 'INTRO':
        return 'INICIANDO';
      case 'ROLE_REVEAL':
        return 'PAPÉIS SECRETOS';
      case 'ROUND_EVENT':
        return 'ACONTECIMENTO';
      case 'ROUND_QUESTION':
        return 'INTERROGATÓRIO';
      case 'ROUND_REVEAL':
        return 'ÁLIBIS NA TV';
      case 'DISCUSSION':
        return 'DEBATE AO VIVO';
      case 'VOTING':
        return 'VOTAÇÃO SECRETA';
      case 'VOTE_REVEAL':
        return 'APURAÇÃO';
      case 'VERDICT':
        return 'VEREDITO';
      case 'GAME_OVER':
        return 'FIM DE TEMPORADA';
      default:
        return 'EM ANDAMENTO';
    }
  };

  const activePhaseLabel = getPhaseLabel();

  const handleToggleSound = () => {
    const next = sound.toggleSound();
    setAudioEnabled(next);
  };

  return (
    <header className="w-full px-6 py-3.5 flex items-center justify-between border-b border-neutral-800 bg-[#141414]/90 backdrop-blur-md z-30">
      <div className="flex items-center gap-3">
        {/* Netflix Red "N" Logo */}
        <div className="w-8 h-8 rounded bg-black border border-white/10 flex items-center justify-center shadow-[0_0_15px_rgba(229,9,20,0.3)]">
          <span className="text-xl font-black text-[#E50914] font-['Bebas_Neue',sans-serif]">N</span>
        </div>
        <div>
          <h1 className="text-xl font-black tracking-wider uppercase text-white font-['Bebas_Neue',sans-serif] leading-none">
            O INFILTRADO
          </h1>
          <p className="text-[10px] text-neutral-400 uppercase tracking-widest font-bold">
            SÉRIE DE DEDUÇÃO
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {activeRound > 0 && (
          <div className="px-3 py-1 rounded bg-[#222222] border border-neutral-700 text-xs font-bold text-neutral-200 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
            <span>RODADA {activeRound} / {activeMaxRounds}</span>
          </div>
        )}

        <div className="px-3 py-1 rounded bg-[#E50914]/20 border border-[#E50914]/50 text-red-300 text-xs font-extrabold tracking-wider uppercase">
          {activePhaseLabel}
        </div>

        {activeRoomCode && (
          <div className="px-3 py-1 rounded bg-[#1f1f1f] border border-neutral-700 text-neutral-200 text-xs font-mono font-bold tracking-widest">
            SALA: <span className="text-amber-400 font-black">{activeRoomCode}</span>
          </div>
        )}

        <button
          id="btn-tv-audio-toggle"
          onClick={handleToggleSound}
          className="p-1.5 rounded bg-[#1f1f1f] border border-neutral-700 hover:border-neutral-500 text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title={audioEnabled ? 'Mutar Áudio' : 'Ativar Áudio'}
        >
          {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
        </button>
      </div>
    </header>
  );
}
