import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { sound } from '../../utils/audio';

interface VirtualDpadProps {
  onMoveDir: (dx: number, dy: number) => void;
  className?: string;
}

export function VirtualDpad({ onMoveDir, className = '' }: VirtualDpadProps) {
  const step = 28; // pixels per press

  const handleStep = (dx: number, dy: number) => {
    sound.triggerVibrate(15);
    onMoveDir(dx, dy);
  };

  return (
    <div className={`flex flex-col items-center justify-center select-none touch-none ${className}`}>
      {/* Up */}
      <button
        type="button"
        onClick={() => handleStep(0, -step)}
        className="w-12 h-12 rounded-xl bg-neutral-800 active:bg-amber-500 border border-neutral-700 active:border-amber-400 flex items-center justify-center text-neutral-200 active:text-neutral-950 shadow-md active:scale-95 transition-all"
        aria-label="Cima"
      >
        <ArrowUp className="w-6 h-6" />
      </button>

      {/* Middle row: Left, Center, Right */}
      <div className="flex items-center gap-2 my-1">
        <button
          type="button"
          onClick={() => handleStep(-step, 0)}
          className="w-12 h-12 rounded-xl bg-neutral-800 active:bg-amber-500 border border-neutral-700 active:border-amber-400 flex items-center justify-center text-neutral-200 active:text-neutral-950 shadow-md active:scale-95 transition-all"
          aria-label="Esquerda"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[10px] text-neutral-600 font-mono">
          ANDAR
        </div>

        <button
          type="button"
          onClick={() => handleStep(step, 0)}
          className="w-12 h-12 rounded-xl bg-neutral-800 active:bg-amber-500 border border-neutral-700 active:border-amber-400 flex items-center justify-center text-neutral-200 active:text-neutral-950 shadow-md active:scale-95 transition-all"
          aria-label="Direita"
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Down */}
      <button
        type="button"
        onClick={() => handleStep(0, step)}
        className="w-12 h-12 rounded-xl bg-neutral-800 active:bg-amber-500 border border-neutral-700 active:border-amber-400 flex items-center justify-center text-neutral-200 active:text-neutral-950 shadow-md active:scale-95 transition-all"
        aria-label="Baixo"
      >
        <ArrowDown className="w-6 h-6" />
      </button>
    </div>
  );
}
