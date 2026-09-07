import { useState, useEffect, type FormEvent } from 'react';
import { AVATARS } from '../../data/content';
import { PlayerAvatar } from '../../types';
import { ArrowRight, User, Check, BookOpen, Sparkles } from 'lucide-react';
import { sound } from '../../utils/audio';
import { Avatar3D } from '../common/Avatar3D';
import { GameRulesModal } from '../common/GameRulesModal';

interface MobileJoinProps {
  initialRoomCode?: string;
  onJoin: (roomCode: string, name: string, avatarId: string) => void;
  errorMessage: string | null;
}

export function MobileJoin({ initialRoomCode = '', onJoin, errorMessage }: MobileJoinProps) {
  const [roomCode, setRoomCode] = useState(initialRoomCode.toUpperCase());
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<PlayerAvatar>(AVATARS[0]);
  const [showRules, setShowRules] = useState(false);

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
    <div className="min-h-screen w-full flex flex-col justify-between p-5 max-w-md mx-auto bg-[#121214] text-neutral-100 select-none">
      {/* Top Header */}
      <div className="text-center pt-2">
        <div className="inline-flex items-center justify-between w-full mb-3 px-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-black border border-white/15 flex items-center justify-center shadow-[0_0_15px_rgba(229,9,20,0.3)]">
              <span className="text-xl font-black text-[#E50914] font-['Bebas_Neue',sans-serif]">N</span>
            </div>
            <span className="text-xs font-black uppercase tracking-widest text-neutral-300 font-mono">
              O INFILTRADO
            </span>
          </div>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              setShowRules(true);
            }}
            className="px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-neutral-300 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Regras</span>
          </button>
        </div>

        <h1 className="text-3xl font-black uppercase tracking-wider font-['Bebas_Neue',sans-serif] text-white">
          ENTRAR NA PARTIDA
        </h1>
        <p className="text-xs text-neutral-400 mt-0.5">
          Escolha seu avatar 3D e digite o código da TV para jogar
        </p>
      </div>

      {/* Selected 3D Avatar Hero Showcase */}
      <div className="flex flex-col items-center my-2 p-3 rounded-3xl bg-neutral-900/60 border border-neutral-800/80 shadow-inner">
        <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">
          SEU AVATAR 3D
        </span>
        <Avatar3D avatar={selectedAvatar} size="lg" animated={true} showGlow={true} />
        <span className="text-xs font-bold text-neutral-200 mt-1">
          {selectedAvatar.name}
        </span>
      </div>

      {/* Join Form */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-[#E50914]/20 border border-[#E50914]/60 text-xs text-red-200 font-semibold text-center animate-in fade-in">
            {errorMessage}
          </div>
        )}

        {/* Room Code */}
        <div>
          <div className="flex items-center justify-between mb-1 px-1">
            <label className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              CÓDIGO DA SALA NA TV
            </label>
            {initialRoomCode && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                <Check className="w-3 h-3" />
                Via QR Code
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
            className="w-full px-4 py-3 rounded-2xl bg-[#1a1a1e] border-2 border-neutral-700/80 focus:border-[#E50914] text-center font-mono text-2xl font-black tracking-widest text-amber-400 outline-none uppercase placeholder:text-neutral-600 placeholder:text-base shadow-inner transition-colors"
            required
          />
        </div>

        {/* Player Name */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1 px-1">
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
              placeholder="Ex: Pedro, Sofia, Lucas..."
              className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#1a1a1e] border border-neutral-700/80 focus:border-[#E50914] text-neutral-100 font-semibold text-base outline-none placeholder:text-neutral-600 shadow-inner transition-colors"
              required
            />
          </div>
        </div>

        {/* 3D Avatars Selection Grid */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2 px-1">
            ESCOLHA SEU AVATAR 3D
          </label>
          <div className="grid grid-cols-4 gap-2">
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
                  className={`p-2 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 cursor-pointer border ${
                    isSelected
                      ? 'bg-neutral-800 border-white ring-2 ring-[#E50914] scale-105 shadow-[0_0_18px_rgba(229,9,20,0.5)]'
                      : 'bg-neutral-900/80 border-neutral-800 opacity-60 hover:opacity-100 hover:scale-100'
                  }`}
                >
                  <Avatar3D
                    avatar={avatar}
                    size="sm"
                    showGlow={isSelected}
                    animated={isSelected}
                  />
                  <span className="text-[10px] font-bold text-neutral-300 mt-1 truncate max-w-full">
                    {avatar.name.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Join Button */}
        <button
          id="btn-mobile-enter-room"
          type="submit"
          className="w-full py-4 rounded-2xl bg-[#E50914] hover:bg-[#b80710] active:scale-[0.98] text-white font-black text-base uppercase tracking-wider shadow-[0_6px_25px_rgba(229,9,20,0.5)] flex items-center justify-center gap-2 border border-white/20 transition-all cursor-pointer mt-2"
        >
          <span>ENTRAR NA MANSÃO</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </form>

      {/* Rules Modal */}
      <GameRulesModal isOpen={showRules} onClose={() => setShowRules(false)} />
    </div>
  );
}
