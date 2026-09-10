import { useEffect } from 'react';
import { Sun } from 'lucide-react';
import { sound } from '../../utils/audio';

export function MobileDayBreak() {
  useEffect(() => {
    // Wake-up vibration & resonant morning sound
    sound.triggerMorningVibrate();
    sound.playDayBreak();
  }, []);

  return (
    <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-[#080f14] text-white select-none">
      <div className="w-24 h-24 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 mb-5 shadow-[0_0_40px_rgba(245,158,11,0.3)] animate-bounce">
        <Sun className="w-12 h-12" />
      </div>

      <h2 className="text-4xl font-black uppercase font-['Bebas_Neue',sans-serif] tracking-wider text-amber-400">
        A CIDADE ACORDOU!
      </h2>

      <p className="text-base text-neutral-200 mt-3 max-w-xs leading-relaxed font-medium">
        Agora, conversem sobre o que aconteceu.
        <br />
        <span className="text-neutral-400 text-sm mt-2 block">
          Olhem para a TV para ver o relatório da noite...
        </span>
      </p>
    </div>
  );
}
