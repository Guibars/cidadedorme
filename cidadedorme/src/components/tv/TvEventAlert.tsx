import { useEffect } from 'react';
import { GameEvent } from '../../types';
import { Zap, AlertTriangle, Radio, Eye, FileText, Activity } from 'lucide-react';
import { sound } from '../../utils/audio';

interface TvEventAlertProps {
  event: GameEvent;
}

export function TvEventAlert({ event }: TvEventAlertProps) {
  useEffect(() => {
    sound.playBoom();
  }, []);

  const getEventIcon = () => {
    switch (event.type) {
      case 'blackout':
        return <Zap className="w-12 h-12 text-amber-400 animate-pulse" />;
      case 'anonymous_tip':
        return <Radio className="w-12 h-12 text-cyan-400 animate-bounce" />;
      case 'clue':
        return <Eye className="w-12 h-12 text-rose-500" />;
      case 'interrogation':
        return <FileText className="w-12 h-12 text-purple-400" />;
      case 'polygraph':
        return <Activity className="w-12 h-12 text-emerald-400" />;
      default:
        return <AlertTriangle className="w-12 h-12 text-amber-500" />;
    }
  };

  const isBlackout = event.type === 'blackout';

  return (
    <div
      className={`flex-1 w-full flex items-center justify-center p-6 relative transition-colors duration-700 ${
        isBlackout ? 'bg-black/95 text-neutral-400' : 'bg-neutral-950 text-neutral-100'
      }`}
    >
      {/* Blackout Flicker Effect */}
      {isBlackout && (
        <div className="absolute inset-0 bg-neutral-900/40 pointer-events-none animate-pulse" />
      )}

      <div className="max-w-3xl w-full text-center z-10 p-8 rounded-3xl bg-neutral-900/70 border border-neutral-800 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-500">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-widest mb-6">
          <AlertTriangle className="w-4 h-4" />
          ACONTECIMENTO INESPERADO
        </div>

        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-neutral-950 border border-neutral-800 flex items-center justify-center shadow-xl">
          {getEventIcon()}
        </div>

        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-wider font-['Cinzel'] text-neutral-100 mb-4">
          {event.title}
        </h2>

        <p className="text-lg md:text-xl text-amber-200/90 font-serif italic mb-6">
          "{event.flavorText}"
        </p>

        <div className="p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 text-neutral-300 text-base font-medium">
          {event.description}
        </div>
      </div>
    </div>
  );
}
