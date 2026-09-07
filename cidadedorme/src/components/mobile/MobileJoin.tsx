import { useState, useEffect, type FormEvent } from 'react';
import { AVATARS } from '../../data/content';
import { PlayerAvatar } from '../../types';
import { ArrowRight, User, Check, Wifi, Sparkles } from 'lucide-react';
import { sound } from '../../utils/audio';

interface MobileJoinProps {
  initialRoomCode?: string;
  onJoin: (roomCode: string, name: string, avatarId: string) => void;
  errorMessage: string | null;
}

export function MobileJoin({ initialRoomCode = '', onJoin, errorMessage }: MobileJoinProps) {
  const [roomCode, setRoomCode] = useState(initialRoomCode.toUpperCase());
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<PlayerAvatar>(AVATARS[0]);

  useEffect(() => {
    if (initialRoomCode) {
      setRoomCode(initialRoomCode.toUpperCase());
    }
  }, [initialRoomCode]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !name.trim()) return;
    sound.playClick();
    sound.triggerVibrate(40);
    onJoin(roomCode.trim(), name.trim(), selectedAvatar.id);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-5 max-w-md mx-auto bg-[#141414] text-neutral-100 selection:bg-[#E50914] selection:text-white">
      {/* Netflix Top Header */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center justify-center w-12 h-12 mb-2 rounded-xl bg-black/80 border border-white/10 shadow-[0_0_25px_rgba(229,9,20,0.3)]">
          <span className="text-3xl font-black text-[#E50914] font-['Bebas_Neue',sans-serif]">N</span>
        </div>

        <h1 className="text-3xl font-black uppercase tracking-wider font-['Bebas_Neue',sans-serif] text-white">
          QUEM ESTÁ JOGANDO?
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Entrada 100% Anônima • Sem Login ou Senha
        </p>
      </div>

      {/* Join Form */}
      <form onSubmit={handleSubmit} className="my-auto py-3 space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-lg bg-[#E50914]/20 border border-[#E50914]/60 text-xs text-red-200 font-semibold text-center animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* Room Code */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              CÓDIGO DA SALA NA TV
            </label>
            {initialRoomCode && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <Check className="w-3 h-3" />
                Conectado via QR Code
              </span>
            )}
          </div>
          <input
            id="input-mobile-room-code"
            type="text"
            maxLength={5}
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="EX: X7K29"
            className="w-full px-4 py-3 rounded-lg bg-[#1f1f1f] border-2 border-neutral-700 focus:border-[#E50914] text-center font-mono text-2xl font-black tracking-widest text-amber-400 outline-none uppercase placeholder:text-neutral-600 placeholder:text-base transition-colors"
            required
          />
        </div>

        {/* Player Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
            SEU APELIDO OU NOME
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-500">
              <User className="w-4 h-4" />
            </div>
            <input
              id="input-mobile-name"
              type="text"
              maxLength={15}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Guilherme, Bia, Lucas..."
              className="w-full pl-10 pr-4 py-3 rounded-lg bg-[#1f1f1f] border border-neutral-700 focus:border-[#E50914] text-neutral-100 font-semibold text-base outline-none placeholder:text-neutral-600 transition-colors"
              required
            />
          </div>
        </div>

        {/* Netflix Profiles Grid */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
            ESCOLHA SEU PERFIL NETFLIX
          </label>
          <div className="grid grid-cols-4 gap-2.5">
            {AVATARS.map((avatar) => {
              const isSelected = selectedAvatar.id === avatar.id;
              return (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => {
                    setSelectedAvatar(avatar);
                    sound.playClick();
                    sound.triggerVibrate(20);
                  }}
                  className={`aspect-square rounded-lg flex flex-col items-center justify-center p-1 relative transition-all duration-200 cursor-pointer ${
                    isSelected
                      ? `bg-gradient-to-br ${avatar.bgGradient} ring-3 ring-white scale-105 shadow-[0_0_20px_rgba(255,255,255,0.35)]`
                      : `bg-gradient-to-br ${avatar.bgGradient} opacity-60 hover:opacity-100 hover:scale-100`
                  }`}
                >
                  <span className="text-3xl drop-shadow">{avatar.emoji}</span>
                  <span className="text-[10px] font-bold text-white mt-1 truncate max-w-[90%] drop-shadow">
                    {avatar.name.split(' ')[0]}
                  </span>
                  {isSelected && (
                    <div className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-white shadow" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Join Button */}
        <button
          id="btn-mobile-join"
          type="submit"
          className="w-full py-4 mt-2 rounded-lg bg-[#E50914] hover:bg-[#B81D24] active:scale-[0.98] text-white font-black tracking-wider uppercase text-base flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(229,9,20,0.5)] transition-all cursor-pointer"
        >
          <span>ENTRAR NA PARTIDA</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      {/* Footer Info */}
      <div className="text-center pt-2 pb-1 text-[11px] text-neutral-500 flex items-center justify-center gap-2">
        <Wifi className="w-3.5 h-3.5 text-emerald-400" />
        <span>Otimizado para Wi-Fi de 3 Mbps • 0 MB de download</span>
      </div>
    </div>
  );
}
