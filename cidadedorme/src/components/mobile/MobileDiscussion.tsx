import { useState } from 'react';
import { Player, PublicGameState, PrivatePlayerData } from '../../types';
import { Clock, Zap, ChevronRight, X } from 'lucide-react';
import { sound } from '../../utils/audio';

interface MobileDiscussionProps {
  player: Player;
  state: PublicGameState;
  privateData?: PrivatePlayerData | null;
  onUseDetective?: (targetId: string) => void;
  onUseSabotage: (sabotageId: string) => void;
}

export function MobileDiscussion({
  player,
  state,
  privateData,
  onUseSabotage,
}: MobileDiscussionProps) {
  const [showSabotageModal, setShowSabotageModal] = useState(false);

  const isKiller = player.role === 'ASSASSINO';
  const canUseAbility = privateData?.canUseAbility && !player.hasUsedAbility;

  const handleSabotageSubmit = (sabotageId: string) => {
    sound.playClick();
    sound.triggerVibrate([60, 120]);
    onUseSabotage(sabotageId);
    setShowSabotageModal(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-5 max-w-md mx-auto bg-neutral-950 text-neutral-100 select-none">
      {/* Top Header with Discussion Timer */}
      <div className="pt-2">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{player.avatar.emoji}</span>
            <div>
              <h4 className="text-xs font-bold text-neutral-200">{player.name}</h4>
              <span className="text-[10px] text-amber-400 font-bold uppercase">{player.role}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-amber-400 font-mono font-bold text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span>{state.timerSeconds}s</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="my-auto py-4 space-y-4">
        {/* Banner */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-center">
          <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-200 mb-1">
            FASE DE DEBATE E ACUSAÇÃO
          </h3>
          <p className="text-xs text-neutral-400">
            Confronte todos onde cada um estava na mansão durante a noite!
          </p>
        </div>

        {/* Killer Action Card */}
        {isKiller && (
          <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-left">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wide">
                <Zap className="w-4 h-4" />
                <span>Sabotagem do Assassino</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-semibold">
                1X POR PARTIDA
              </span>
            </div>

            {canUseAbility ? (
              <div>
                <p className="text-xs text-neutral-300 mb-3">
                  Provoque um apagão ou plante falsas pistas para confundir as suspeitas do grupo.
                </p>
                <button
                  onClick={() => setShowSabotageModal(true)}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all"
                >
                  <Zap className="w-4 h-4" />
                  <span>ATIVAR SABOTAGEM SECRETA</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic">
                Sabotagem já utilizada nesta partida.
              </p>
            )}
          </div>
        )}

        {/* Innocent tips */}
        {!isKiller && (
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-left space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Dicas para a Reunião
            </span>
            <p className="text-xs text-neutral-300 leading-relaxed">
              • Preste atenção em quem demorou para responder ou mudou de cômodo.
            </p>
            <p className="text-xs text-neutral-300 leading-relaxed">
              • Todos podem votar para mandar um suspeito para a eliminação.
            </p>
          </div>
        )}
      </div>

      {/* Killer Sabotage Modal */}
      {showSabotageModal && privateData?.availableSabotages && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-700 p-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span>Escolha uma Sabotagem</span>
              </h3>
              <button
                onClick={() => setShowSabotageModal(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-4">
              A TV anunciará que uma sabotagem ocorreu sem nunca revelar sua identidade.
            </p>

            <div className="space-y-2.5">
              {privateData.availableSabotages.map((sab) => (
                <button
                  key={sab.id}
                  onClick={() => handleSabotageSubmit(sab.id)}
                  className="w-full p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-rose-500 text-left transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-200 group-hover:text-rose-400">
                      {sab.title}
                    </span>
                    <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-rose-400" />
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    {sab.description}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pb-2 text-center text-xs text-neutral-500">
        Fique atento: a votação coletiva começará em instantes!
      </div>
    </div>
  );
}
