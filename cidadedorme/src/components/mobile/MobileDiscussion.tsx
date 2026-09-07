import { useState } from 'react';
import { Player, PublicGameState, PrivatePlayerData } from '../../types';
import { Clock, Search, Zap, BookOpen, ShieldAlert, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { sound } from '../../utils/audio';

interface MobileDiscussionProps {
  player: Player;
  state: PublicGameState;
  privateData: PrivatePlayerData | null;
  onUseDetective: (targetPlayerId: string) => void;
  onUseSabotage: (sabotageId: string) => void;
}

export function MobileDiscussion({
  player,
  state,
  privateData,
  onUseDetective,
  onUseSabotage,
}: MobileDiscussionProps) {
  const [showDetectiveModal, setShowDetectiveModal] = useState(false);
  const [showSabotageModal, setShowSabotageModal] = useState(false);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);

  const isDetective = player.role === 'DETETIVE';
  const isKiller = player.role === 'ASSASSINO';
  const canUseAbility = privateData?.canUseAbility && !player.hasUsedAbility;

  const investigationResult = privateData?.detectiveInvestigationResult;
  const otherAlivePlayers = state.players.filter((p) => p.id !== player.id && p.isAlive);

  const handleInvestigateSubmit = () => {
    if (!selectedTargetId) return;
    sound.playClick();
    sound.triggerVibrate([50, 100]);
    onUseDetective(selectedTargetId);
    setShowDetectiveModal(false);
  };

  const handleSabotageSubmit = (sabotageId: string) => {
    sound.playClick();
    sound.triggerVibrate([60, 120]);
    onUseSabotage(sabotageId);
    setShowSabotageModal(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-5 max-w-md mx-auto bg-neutral-950 text-neutral-100">
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
            FASE DE DISCUSSÃO PRESENCIAL
          </h3>
          <p className="text-xs text-neutral-400">
            Confronte seus amigos com base nos álibis revelados na TV!
          </p>
        </div>

        {/* Detective Action Card */}
        {isDetective && (
          <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/40 text-left">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wide">
                <Search className="w-4 h-4" />
                <span>Habilidade do Detetive</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-semibold">
                1X POR PARTIDA
              </span>
            </div>

            {investigationResult ? (
              <div className="p-3 rounded-xl bg-neutral-950/80 border border-cyan-900/60 mt-2">
                <span className="text-[11px] font-bold text-cyan-400 uppercase block mb-1">
                  RELATÓRIO DE INVESTIGAÇÃO:
                </span>
                <p className="text-xs text-neutral-200 leading-relaxed font-medium">
                  {investigationResult.resultText}
                </p>
              </div>
            ) : canUseAbility ? (
              <div>
                <p className="text-xs text-neutral-300 mb-3">
                  Investigue um jogador secretamente para descobrir se há suspeitas ou se ele é inocente.
                </p>
                <button
                  onClick={() => setShowDetectiveModal(true)}
                  className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-neutral-950 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
                >
                  <Search className="w-4 h-4" />
                  <span>ESCOLHER JOGADOR PARA INVESTIGAR</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic">
                Habilidade de investigação já utilizada.
              </p>
            )}
          </div>
        )}

        {/* Killer Sabotage Card */}
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

            {player.hasUsedAbility ? (
              <div className="p-3 rounded-xl bg-neutral-950/80 border border-rose-900/60 mt-2">
                <span className="text-xs text-rose-400 font-bold">
                  ✓ Sabotagem acionada com sucesso!
                </span>
                <p className="text-[11px] text-neutral-400 mt-0.5">
                  A confusão foi plantada entre os inocentes.
                </p>
              </div>
            ) : canUseAbility ? (
              <div>
                <p className="text-xs text-neutral-300 mb-3">
                  Ative uma sabotagem secreta para apagar pistas, causar blecaute ou plantar informações falsas.
                </p>
                <button
                  onClick={() => setShowSabotageModal(true)}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(225,29,72,0.3)] transition-all"
                >
                  <Zap className="w-4 h-4" />
                  <span>SELECIONAR SABOTAGEM</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-neutral-500 italic">
                Sabotagem já executada.
              </p>
            )}
          </div>
        )}

        {/* Clues & Private Notes Notebook */}
        <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800 text-left">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Meu Caderno Secreto</span>
          </div>

          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {state.clues.map((clue) => (
              <div
                key={clue.id}
                className="p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-300"
              >
                <span className="text-amber-400 font-bold mr-1">•</span>
                {clue.text}
              </div>
            ))}

            {player.privateNotes.map((note, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-xs text-cyan-200"
              >
                <span className="text-cyan-400 font-bold mr-1">🔍</span>
                {note}
              </div>
            ))}

            {state.clues.length === 0 && player.privateNotes.length === 0 && (
              <p className="text-xs text-neutral-500 italic py-2">
                Nenhuma nota ou pista registrada ainda.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Detective Investigation Modal */}
      {showDetectiveModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border border-neutral-700 p-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Search className="w-4 h-4" />
                <span>Escolha quem investigar</span>
              </h3>
              <button
                onClick={() => setShowDetectiveModal(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-400 mb-4">
              Você receberá um laudo confidencial revelando informações sobre este jogador.
            </p>

            <div className="space-y-2 mb-5">
              {otherAlivePlayers.map((target) => (
                <button
                  key={target.id}
                  onClick={() => setSelectedTargetId(target.id)}
                  className={`w-full p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    selectedTargetId === target.id
                      ? 'bg-cyan-950/60 border-cyan-400 text-cyan-100'
                      : 'bg-neutral-950 border-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-lg">{target.avatar.emoji}</span>
                    <span className="text-xs font-bold">{target.name}</span>
                  </div>
                  {selectedTargetId === target.id && (
                    <span className="text-xs font-bold text-cyan-400">SELECIONADO</span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleInvestigateSubmit}
              disabled={!selectedTargetId}
              className={`w-full py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all ${
                selectedTargetId
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                  : 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
              }`}
            >
              CONFIRMAR INVESTIGAÇÃO
            </button>
          </div>
        </div>
      )}

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
                className="p-1 rounded text-neutral-400 hover:text-neutral-100"
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
      <div className="pb-2 text-center text-xs text-neutral-600">
        Fique pronto: a votação começará em breve!
      </div>
    </div>
  );
}
