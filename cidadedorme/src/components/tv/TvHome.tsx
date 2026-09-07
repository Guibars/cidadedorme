import { useState } from 'react';
import { Smartphone, Tv, Users, Play, ShieldAlert, Wifi, Sparkles, Loader2 } from 'lucide-react';
import { sound } from '../../utils/audio';

interface TvHomeProps {
  onCreateRoom: () => void;
  onSwitchToPlayer: () => void;
  isCreatingRoom?: boolean;
}

export function TvHome({ onCreateRoom, onSwitchToPlayer, isCreatingRoom = false }: TvHomeProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="flex-1 w-full flex flex-col justify-between items-center p-6 md:p-12 relative overflow-hidden text-neutral-100 select-none bg-[#141414]">
      {/* Netflix Cinematic Backdrop Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(229,9,20,0.18),rgba(20,20,20,0.95)_70%,#141414)] pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-[#141414] to-transparent pointer-events-none" />

      {/* Top Netflix Brand Ribbon */}
      <div className="z-10 text-center animate-in fade-in duration-700">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded bg-[#E50914]/15 border border-[#E50914]/40 text-[#E50914] text-xs font-black uppercase tracking-[0.25em]">
          <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
          <span>SÉRIE ORIGINAL • DEDUÇÃO SOCIAL</span>
        </div>
      </div>

      {/* Center Netflix Billboard Hero */}
      <div className="z-10 text-center my-auto py-4 max-w-4xl">
        {/* Netflix Red "N" Monogram */}
        <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center shadow-[0_0_35px_rgba(229,9,20,0.35)] group">
          <span className="text-4xl font-black text-[#E50914] tracking-tighter select-none transform transition-transform duration-300 group-hover:scale-110">
            N
          </span>
        </div>

        {/* Cinematic Title */}
        <h1 className="text-6xl sm:text-7xl md:text-9xl font-black uppercase tracking-wider font-['Bebas_Neue',sans-serif] text-white drop-shadow-[0_4px_30px_rgba(0,0,0,0.9)] leading-none">
          O INFILTRADO
        </h1>

        {/* Netflix Badges Row */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5 text-xs font-bold text-neutral-300">
          <span className="px-2 py-0.5 rounded bg-[#E50914] text-white text-[11px] font-black uppercase tracking-wider">
            TOP 1
          </span>
          <span className="text-neutral-500">•</span>
          <span className="text-emerald-400 font-extrabold tracking-wide">98% Relevante</span>
          <span className="text-neutral-500">•</span>
          <span className="px-1.5 py-0.5 rounded border border-neutral-700 text-[11px] text-neutral-300 font-mono">
            14+
          </span>
          <span className="text-neutral-500">•</span>
          <span className="text-neutral-400">Temporada 1</span>
          <span className="text-neutral-500">•</span>
          <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
            Ultra Leve (3MB)
          </span>
        </div>

        {/* Synopsis */}
        <p className="mt-4 text-base md:text-lg text-neutral-300 font-normal max-w-2xl mx-auto leading-relaxed drop-shadow">
          Um crime misterioso foi cometido na mansão. Um dos presentes é o assassino. Use seus celulares sem login para conspirar, investigar e desmascarar o culpado no telão.
        </p>

        {/* Action Buttons (Netflix Styled) */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          {/* Play / Create Button */}
          <button
            id="btn-create-room"
            disabled={isCreatingRoom}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => {
              sound.playTaDum();
              onCreateRoom();
            }}
            className="w-full sm:w-auto px-9 py-4 rounded-md bg-white hover:bg-neutral-200 text-black font-black tracking-wide text-base flex items-center justify-center gap-3 transition-all duration-200 shadow-[0_4px_25px_rgba(255,255,255,0.2)] cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isCreatingRoom ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#E50914]" />
                <span className="text-neutral-900">GERANDO SALA & QR CODE...</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-black text-black" />
                <span>CRIAR PARTIDA NA TV</span>
              </>
            )}
          </button>

          {/* Join Mobile Button */}
          <button
            id="btn-switch-player-mode"
            onClick={() => {
              sound.playClick();
              onSwitchToPlayer();
            }}
            className="w-full sm:w-auto px-7 py-4 rounded-md bg-white/20 hover:bg-white/30 text-white font-bold text-sm tracking-wide flex items-center justify-center gap-2.5 transition-all duration-200 backdrop-blur-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Smartphone className="w-4 h-4 text-neutral-300" />
            <span>Entrar pelo Celular (Anônimo)</span>
          </button>
        </div>

        {/* Low-spec & Wi-Fi 3MB Badges */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-black/40 border border-white/5">
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span>Otimizado para Wi-Fi de 3 Mbps</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-black/40 border border-white/5">
            <Users className="w-3.5 h-3.5 text-[#E50914]" />
            <span>100% Anônimo • Sem Cadastro</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-black/40 border border-white/5">
            <Tv className="w-3.5 h-3.5 text-amber-400" />
            <span>1 TV / PC + 3 a 5 Celulares</span>
          </div>
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="z-10 text-center text-xs text-neutral-500 max-w-md">
        Abra esta tela na sua Smart TV ou Notebook. Os amigos conectam apontando a câmera do celular no QR Code gerado.
      </div>
    </div>
  );
}
