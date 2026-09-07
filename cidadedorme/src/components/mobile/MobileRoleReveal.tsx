import { useState, useRef, useEffect } from 'react';
import { Player, Role, MansionRoomId } from '../../types';
import { Fingerprint, EyeOff, Skull, Search, Shield, CheckCircle2, MapPin } from 'lucide-react';
import { sound } from '../../utils/audio';
import { MANSION_ROOMS } from '../../data/mansion';

interface MobileRoleRevealProps {
  player: Player;
  onRevealComplete: () => void;
  onSelectRoom?: (roomId: string) => void;
  readyCount?: number;
  totalPlayers?: number;
}

export function MobileRoleReveal({
  player,
  onRevealComplete,
  onSelectRoom,
  readyCount = 0,
  totalPlayers = 1,
}: MobileRoleRevealProps) {
  const [holdingProgress, setHoldingProgress] = useState(0);
  const [isRevealed, setIsRevealed] = useState(player.hasRevealedRole);
  const [hasConfirmedReady, setHasConfirmedReady] = useState(player.hasRevealedRole);
  const [selectedRoom, setSelectedRoom] = useState<MansionRoomId>(player.currentRoomId || 'bedroom');
  const [isTemporarilyHidden, setIsTemporarilyHidden] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const HOLD_DURATION = 2000; // 2 seconds

  const startHold = () => {
    if (isRevealed) return;
    startTimeRef.current = Date.now();
    sound.playClick();
    sound.triggerVibrate(30);

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / HOLD_DURATION) * 100);
      setHoldingProgress(pct);

      if (elapsed >= HOLD_DURATION) {
        if (timerRef.current) clearInterval(timerRef.current);
        setIsRevealed(true);
        sound.playSecretReveal();
        sound.triggerRoleRevealVibrate(player.role);
        // Do NOT call onRevealComplete here automatically!
        // The user must review their role and click the OK/READY button.
      }
    }, 30);
  };

  const endHold = () => {
    if (isRevealed) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setHoldingProgress(0);
  };

  const handleConfirmReady = () => {
    if (hasConfirmedReady) return;
    sound.playClick();
    sound.triggerVibrate(50);
    setHasConfirmedReady(true);
    onRevealComplete();
  };

  const handleRoomPick = (roomId: MansionRoomId) => {
    sound.playClick();
    setSelectedRoom(roomId);
    if (onSelectRoom) {
      onSelectRoom(roomId);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const role: Role = player.role || 'INOCENTE';

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-5 max-w-md mx-auto bg-neutral-950 text-neutral-100 text-center select-none overflow-y-auto">
      {/* Top Warning */}
      <div className="pt-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-rose-400/90 bg-rose-950/40 px-3 py-1 rounded-full border border-rose-600/30">
          DOCUMENTO CONFIDENCIAL
        </span>
      </div>

      {/* Main Hold or Revealed Card */}
      <div className="my-auto py-3">
        {!isRevealed ? (
          <div className="flex flex-col items-center">
            <h2 className="text-2xl font-black uppercase font-['Cinzel'] tracking-wide text-neutral-100 mb-2">
              TOQUE PARA REVELAR SUA IDENTIDADE
            </h2>
            <p className="text-xs text-neutral-400 max-w-xs mb-8">
              Pressione e segure o leitor de digital por 2 segundos. Certifique-se de que ninguém ao lado está olhando para o seu aparelho.
            </p>

            {/* Interactive Fingerprint Scanner */}
            <div
              id="fingerprint-hold-area"
              onPointerDown={startHold}
              onPointerUp={endHold}
              onPointerLeave={endHold}
              onContextMenu={(e) => e.preventDefault()}
              className="relative w-44 h-44 rounded-full flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
            >
              {/* Circular SVG Progress Ring */}
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="88"
                  cy="88"
                  r="80"
                  className="stroke-neutral-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="88"
                  cy="88"
                  r="80"
                  className="stroke-rose-500 transition-all"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={502}
                  strokeDashoffset={502 - (502 * holdingProgress) / 100}
                  strokeLinecap="round"
                />
              </svg>

              {/* Inner Button */}
              <div className="w-36 h-36 rounded-full bg-neutral-900 border-2 border-neutral-700 flex flex-col items-center justify-center shadow-inner relative overflow-hidden">
                <Fingerprint
                  className={`w-16 h-16 transition-colors duration-200 ${
                    holdingProgress > 0 ? 'text-rose-500 animate-pulse' : 'text-neutral-400'
                  }`}
                />
                <span className="text-[10px] font-bold tracking-wider text-neutral-400 mt-1 uppercase">
                  {holdingProgress > 0 ? `${Math.round(holdingProgress)}%` : 'SEGURE'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Role Revealed Card */
          <div className="animate-in zoom-in-95 duration-500">
            {isTemporarilyHidden ? (
              <div className="p-8 rounded-3xl bg-neutral-900 border border-neutral-800 text-center">
                <EyeOff className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-neutral-400">IDENTIDADE OCULTA</h3>
                <p className="text-xs text-neutral-500 mt-1 mb-4">
                  Toque no botão abaixo para rever seu papel.
                </p>
                <button
                  onClick={() => setIsTemporarilyHidden(false)}
                  className="px-6 py-2.5 rounded-xl bg-neutral-800 text-neutral-200 text-xs font-bold uppercase tracking-wider hover:bg-neutral-700 cursor-pointer"
                >
                  Revelar Novamente
                </button>
              </div>
            ) : (
              <div>
                {role === 'ASSASSINO' && (
                  <div className="p-6 rounded-3xl bg-gradient-to-b from-rose-950/90 via-neutral-950 to-neutral-950 border-2 border-rose-600/80 shadow-[0_0_50px_rgba(225,29,72,0.45)] text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-rose-600/30 border border-rose-500 flex items-center justify-center text-rose-500 shadow-lg">
                      <Skull className="w-9 h-9" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-rose-400">
                      PAPEL SECRETO
                    </span>
                    <h2 className="text-3xl font-black uppercase font-['Cinzel'] tracking-wider text-rose-500 mt-1">
                      VOCÊ É O ASSASSINO
                    </h2>

                    <div className="my-4 p-4 rounded-xl bg-neutral-950/80 border border-rose-900/60 text-left space-y-2 text-xs">
                      <p className="font-bold text-rose-300 uppercase tracking-wide">
                        Sua missão na mansão:
                      </p>
                      <p className="text-neutral-300 leading-relaxed">
                        • À noite, você empunhará sua faca e escolherá uma vítima em um cômodo da casa.
                      </p>
                      <p className="text-neutral-300 leading-relaxed">
                        • De dia, finja ser inocente e desvie a atenção do grupo.
                      </p>
                      <p className="text-neutral-300 leading-relaxed">
                        • Use sua <strong>Faca</strong> e sabotagens secretas para vencer.
                      </p>
                    </div>
                  </div>
                )}

                {role === 'INOCENTE' && (
                  <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 via-neutral-950 to-neutral-950 border-2 border-emerald-500/70 shadow-[0_0_50px_rgba(16,185,129,0.3)] text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-emerald-600/30 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg">
                      <Shield className="w-9 h-9" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                      PAPEL SECRETO
                    </span>
                    <h2 className="text-3xl font-black uppercase font-['Cinzel'] tracking-wider text-emerald-400 mt-1">
                      VOCÊ É INOCENTE
                    </h2>

                    <div className="my-4 p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 text-left space-y-2 text-xs">
                      <p className="font-bold text-emerald-300 uppercase tracking-wide">
                        Sua missão na mansão:
                      </p>
                      <p className="text-neutral-300 leading-relaxed">
                        • À noite, caminhe e explore a mansão com sua lanterna, ou fique abrigado em um cômodo.
                      </p>
                      <p className="text-neutral-300 leading-relaxed">
                        • Ao amanhecer, debata com todos onde cada um estava e vote para eliminar o assassino!
                      </p>
                    </div>
                  </div>
                )}

                {/* Mansion Room Starting Choice (Among Us style) */}
                <div className="mt-4 p-3 rounded-2xl bg-neutral-900 border border-neutral-800 text-left">
                  <div className="flex items-center gap-1.5 mb-2 text-neutral-300">
                    <MapPin className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">
                      Escolha seu cômodo inicial na mansão:
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5">
                    {MANSION_ROOMS.map((room) => {
                      const isChosen = selectedRoom === room.id;
                      return (
                        <button
                          key={room.id}
                          type="button"
                          onClick={() => handleRoomPick(room.id)}
                          className={`p-2 rounded-xl border flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                            isChosen
                              ? 'bg-amber-950/60 border-amber-400 text-amber-200 shadow-sm'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          <span className="text-lg">{room.icon}</span>
                          <span className="text-[10px] font-bold tracking-tight line-clamp-1 mt-0.5">
                            {room.name.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Confirmation Button requested by user */}
                {!hasConfirmedReady ? (
                  <button
                    id="btn-confirm-role-ready"
                    onClick={handleConfirmReady}
                    className="mt-4 w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.4)] flex items-center justify-center gap-2 active:scale-98 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>OK, ENTENDI MEU PAPEL (ESTOU PRONTO)</span>
                  </button>
                ) : (
                  <div className="mt-4 p-3.5 rounded-2xl bg-emerald-950/70 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>
                      Você deu OK! Aguardando os demais jogadores ({readyCount}/{totalPlayers})...
                    </span>
                  </div>
                )}

                {/* Hide Role Button for privacy */}
                <button
                  onClick={() => setIsTemporarilyHidden(true)}
                  className="mt-3 px-4 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] font-medium text-neutral-400 hover:text-neutral-200 flex items-center justify-center gap-1.5 mx-auto cursor-pointer"
                >
                  <EyeOff className="w-3 h-3" />
                  <span>Ocultar tela (evitar espiadas)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div className="pb-1 text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <span>Todos devem dar OK para a noite começar</span>
      </div>
    </div>
  );
}
