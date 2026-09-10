import { useEffect } from 'react';
import { PublicGameState } from '../../types';
import { Sun, Eye, Bell } from 'lucide-react';
import { sound } from '../../utils/audio';

interface TvDayBreakProps {
  state: PublicGameState;
}

export function TvDayBreak({ state }: TvDayBreakProps) {
  useEffect(() => {
    sound.playDayBreak();
  }, []);

  return (
    <div className="flex-1 w-full max-w-5xl mx-auto px-6 py-12 flex flex-col justify-center items-center text-center bg-[#080f14] relative overflow-hidden">
      {/* Sunrise Ambient Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-amber-600/15 rounded-t-full blur-[140px] animate-pulse" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-orange-500/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10">
        {/* Morning Chime Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-black uppercase tracking-[0.25em] mb-5">
          <Sun className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
          <span>AMANHECER NA CIDADE</span>
        </div>

        {/* Title */}
        <h1 className="text-6xl md:text-8xl font-black uppercase font-['Bebas_Neue',sans-serif] tracking-widest text-white drop-shadow-[0_4px_30px_rgba(245,158,11,0.4)]">
          TODOS ACORDEM!
        </h1>

        <p className="text-xl md:text-3xl text-neutral-200 font-semibold max-w-2xl mx-auto mt-4 leading-relaxed">
          Abram os olhos e olhem ao redor.
          <br />
          <span className="text-amber-400">A noite terminou...</span> Mas nem todos estão sãos e salvos.
        </p>

        {/* Eye Opening Icon Animation */}
        <div className="my-10 flex flex-col items-center justify-center">
          <div className="w-28 h-28 rounded-full bg-amber-500/10 border-2 border-amber-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.25)] animate-bounce">
            <Eye className="w-14 h-14 text-amber-400" />
          </div>
          <span className="text-sm font-mono text-neutral-400 mt-4 tracking-widest uppercase">
            Revelando cena do crime em instantes...
          </span>
        </div>
      </div>
    </div>
  );
}
