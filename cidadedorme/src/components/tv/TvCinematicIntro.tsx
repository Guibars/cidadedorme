import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { EyeOff, Fingerprint, Skull } from 'lucide-react';
import { sound } from '../../utils/audio';

export function TvCinematicIntro() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    sound.playBoom();

    const t1 = setTimeout(() => {
      setStep(1);
      sound.playSecretReveal();
    }, 2200);

    const t2 = setTimeout(() => {
      setStep(2);
      sound.playBoom();
    }, 4500);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <div className="flex-1 w-full flex items-center justify-center relative overflow-hidden bg-neutral-950">
      {/* Background radial dramatic light */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-rose-950/40 via-neutral-950 to-black pointer-events-none" />

      {/* Floating particles effect */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="w-full h-full bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="step-0"
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center z-10 px-6"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
              <Fingerprint className="w-10 h-10 text-rose-500 animate-pulse" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-wider text-neutral-100 font-['Cinzel']">
              Preparando a partida…
            </h2>
            <p className="mt-3 text-lg text-neutral-400 font-light tracking-wide">
              Estabelecendo canais criptografados para todos os dispositivos
            </p>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div
            key="step-1"
            initial={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center z-10 px-6"
          >
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-amber-950/30 border border-amber-600/40 flex items-center justify-center text-amber-400 shadow-[0_0_40px_rgba(245,158,11,0.2)]">
              <EyeOff className="w-10 h-10 animate-bounce" />
            </div>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-wider text-amber-200 font-['Cinzel']">
              Distribuindo identidades…
            </h2>
            <p className="mt-3 text-lg text-neutral-400 font-light tracking-wide">
              Os papéis foram entregues secretamente em cada celular
            </p>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, scale: 0.85, filter: 'blur(12px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="text-center z-10 px-6"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-rose-950/50 border border-rose-600/60 flex items-center justify-center text-rose-500 shadow-[0_0_60px_rgba(225,29,72,0.5)]">
              <Skull className="w-12 h-12 animate-pulse" />
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-widest text-rose-500 font-['Cinzel'] drop-shadow-[0_0_35px_rgba(225,29,72,0.8)]">
              Não confie em ninguém.
            </h2>
            <p className="mt-4 text-xl text-neutral-300 font-medium tracking-wide">
              O Infiltrado caminha entre vocês.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
