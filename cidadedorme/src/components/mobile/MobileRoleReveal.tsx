import { useState, useRef, useEffect } from 'react';
import { Player, Role } from '../../types';
import { Fingerprint, Eye, EyeOff, Skull, Search, Shield, CheckCircle2 } from 'lucide-react';
import { sound } from '../../utils/audio';

interface MobileRoleRevealProps {
  player: Player;
  onRevealComplete: () => void;
}

export function MobileRoleReveal({ player, onRevealComplete }: MobileRoleRevealProps) {
  const [holdingProgress, setHoldingProgress] = useState(0);
  const [isRevealed, setIsRevealed] = useState(player.hasRevealedRole);
  const [isTemporarilyHidden, setIsTemporarilyHidden] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const HOLD_DURATION = 2000; // 2 seconds as specified

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
        onRevealComplete();
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

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const role: Role = player.role || 'INOCENTE';

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-6 max-w-md mx-auto bg-neutral-950 text-neutral-100 text-center select-none">
      {/* Top Warning */}
      <div className="pt-2">
        <span className="text-[11px] font-bold uppercase tracking-widest text-rose-400/90 bg-rose-950/40 px-3 py-1 rounded-full border border-rose-600/30">
          DOCUMENTO CONFIDENCIAL
        </span>
      </div>

      {/* Main Hold or Revealed Card */}
      <div className="my-auto py-4">
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
                  <div className="p-6 rounded-3xl bg-gradient-to-b from-rose-950/80 to-neutral-950 border-2 border-rose-600/70 shadow-[0_0_50px_rgba(225,29,72,0.4)] text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-rose-600/30 border border-rose-500 flex items-center justify-center text-rose-500 shadow-lg">
                      <Skull className="w-9 h-9" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-rose-400">
                      PAPEL SECRETO
                    </span>
                    <h2 className="text-3xl font-black uppercase font-['Cinzel'] tracking-wider text-rose-500 mt-1">
                      VOCÊ É O ASSASSINO
                    </h2>

                    <div className="my-5 p-4 rounded-xl bg-neutral-950/80 border border-rose-900/60 text-left space-y-2 text-xs">
                      <p className="font-bold text-rose-300 uppercase tracking-wide">
                        Sua missão:
                      </p>
                      <p className="text-neutral-300 leading-relaxed">
                        • Engane os outros jogadores e sobreviva às votações.
                      </p>
                      <p className="text-neutral-300 leading-relaxed">
                        • Não deixe ninguém descobrir quem você é.
                      </p>
                      <p className="text-neutral-300 leading-relaxed">
                        • Você terá uma habilidade secreta de <strong>Sabotagem</strong> para usar durante a partida.
                      </p>
                    </div>
                  </div>
                )}

                {role === 'DETETIVE' && (
                  <div className="p-6 rounded-3xl bg-gradient-to-b from-cyan-950/80 to-neutral-950 border-2 border-cyan-500/70 shadow-[0_0_50px_rgba(6,182,212,0.3)] text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-cyan-600/30 border border-cyan-400 flex items-center justify-center text-cyan-400 shadow-lg">
                      <Search className="w-9 h-9" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
                      PAPEL SECRETO
                    </span>
                    <h2 className="text-3xl font-black uppercase font-['Cinzel'] tracking-wider text-cyan-400 mt-1">
                      VOCÊ É O DETETIVE
                    </h2>

                    <div className="my-5 p-4 rounded-xl bg-neutral-950/80 border border-cyan-950/80 text-left space-y-2 text-xs">
                      <p className="font-bold text-cyan-300 uppercase tracking-wide">
                        Sua missão:
                      </p>
                      <p className="text-neutral-300 leading-relaxed">
                        • Observe os jogadores e tente descobrir quem é o assassino.
                      </p>
                      <p className="text-neutral-300 leading-relaxed">
                        • Durante a partida você poderá usar sua habilidade de <strong>Investigar</strong> um jogador secretamente.
                      </p>
                      <p className="text-neutral-300 leading-relaxed">
                        • Use as pistas com sabedoria sem se expor desnecessariamente.
                      </p>
                    </div>
                  </div>
                )}

                {role === 'INOCENTE' && (
                  <div className="p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-neutral-950 border-2 border-emerald-500/60 shadow-[0_0_50px_rgba(16,185,129,0.25)] text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-emerald-600/30 border border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg">
                      <Shield className="w-9 h-9" />
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
                      PAPEL SECRETO
                    </span>
                    <h2 className="text-3xl font-black uppercase font-['Cinzel'] tracking-wider text-emerald-400 mt-1">
                      VOCÊ É INOCENTE
                    </h2>

                    <div className="my-5 p-4 rounded-xl bg-neutral-950/80 border border-neutral-800 text-left space-y-2 text-xs">
                      <p className="font-bold text-emerald-300 uppercase tracking-wide">
                        Sua missão:
                      </p>
                      <p className="text-neutral-300 leading-relaxed">
                        • Descubra quem está mentindo e ajude o grupo a encontrar o assassino.
                      </p>
                      <p className="text-neutral-300 leading-relaxed">
                        • Fique atento aos álibis declarados no telão e vote com precisão.
                      </p>
                    </div>
                  </div>
                )}

                {/* Hide Role Button for privacy */}
                <button
                  onClick={() => setIsTemporarilyHidden(true)}
                  className="mt-4 px-4 py-2 rounded-xl bg-neutral-900 border border-neutral-800 text-xs font-medium text-neutral-400 hover:text-neutral-200 flex items-center justify-center gap-2 mx-auto cursor-pointer"
                >
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Ocultar tela (evitar espiadas)</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom info */}
      <div className="pb-2 text-xs text-neutral-500 flex items-center justify-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
        <span>A TV continuará quando todos confirmarem seus papéis</span>
      </div>
    </div>
  );
}
