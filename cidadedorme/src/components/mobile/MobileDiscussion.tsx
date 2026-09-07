import { useState } from 'react';
import { Player, PublicGameState, PrivatePlayerData } from '../../types';
import { Clock, Zap, ChevronRight, X, Search, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
  onUseDetective,
  onUseSabotage,
}: MobileDiscussionProps) {
  const [showSabotageModal, setShowSabotageModal] = useState(false);
  const [showDetectiveModal, setShowDetectiveModal] = useState(false);
  const [accusedSuccessPlayerName, setAccusedSuccessPlayerName] = useState<string | null>(null);

  const isKiller = player.role === 'ASSASSINO';
  const isDetective = player.role === 'DETETIVE';
  const canUseSabotage = privateData?.canUseAbility && !player.hasUsedAbility;
  const aliveOthers = state.players.filter((p) => p.id !== player.id && p.isAlive);
  const investigationResult = privateData?.detectiveInvestigationResult;

  const handleSabotageSubmit = (sabotageId: string) => {
    sound.playClick();
    sound.triggerVibrate([60, 120]);
    onUseSabotage(sabotageId);
    setShowSabotageModal(false);
  };

  const handleDetectiveAccuseSubmit = (targetId: string, targetName: string) => {
    sound.playBoom();
    sound.triggerVibrate([80, 150]);
    if (onUseDetective) {
      onUseDetective(targetId);
    }
    setAccusedSuccessPlayerName(targetName);
    setShowDetectiveModal(false);
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
              <span
                className={`text-[10px] font-black uppercase tracking-wider ${
                  isDetective
                    ? 'text-cyan-400'
                    : isKiller
                    ? 'text-rose-400'
                    : 'text-amber-400'
                }`}
              >
                {player.role}
              </span>
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

        {/* DETECTIVE SPECIAL ACCUSATION CARD */}
        {isDetective && (
          <div className="p-4 rounded-2xl bg-cyan-950/40 border-2 border-cyan-500/60 text-left shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-cyan-300 font-black text-xs uppercase tracking-wide">
                <Search className="w-4 h-4 text-cyan-400" />
                <span>PODER DE ACUSAÇÃO DO DETETIVE</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 font-bold">
                OFICIAL
              </span>
            </div>

            <p className="text-xs text-cyan-100/90 mb-3 leading-relaxed">
              Você é o <strong>Detetive Oficial</strong>. Lance uma acusação formal contra um suspeito para ser exibida com destaque na TV!
            </p>

            {/* If investigation result exists */}
            {investigationResult && (
              <div className="p-3 rounded-xl bg-neutral-900 border border-amber-500/70 mb-3 text-xs font-bold text-amber-300">
                {investigationResult.resultText}
              </div>
            )}

            {accusedSuccessPlayerName ? (
              <div className="p-3 rounded-xl bg-cyan-900/60 border border-cyan-400 text-center text-xs font-black text-cyan-200">
                🚨 Você acusou formalmente: {accusedSuccessPlayerName}! O telão da TV está exibindo sua denúncia.
              </div>
            ) : (
              <button
                onClick={() => setShowDetectiveModal(true)}
                className="w-full py-3.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all"
              >
                <Search className="w-4 h-4" />
                <span>⚖️ ACUSAR UM SUSPEITO FORMALMENTE</span>
              </button>
            )}

            <div className="mt-3 p-2.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex items-start gap-2">
              <Shield className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-neutral-300">
                <strong>Lembre-se:</strong> Se o Assassino tentar te matar na noite, o Assassino perde o jogo instantaneamente!
              </p>
            </div>

            {/* Private Detective Clues */}
            {privateData?.detectiveClues && privateData.detectiveClues.length > 0 && (
              <div className="mt-3 p-3 rounded-xl bg-neutral-950 border border-cyan-700/50">
                <div className="text-[10px] font-black uppercase text-cyan-500 mb-2 tracking-wider flex items-center gap-1.5">
                  <Search className="w-3 h-3" />
                  Pistas Confidenciais
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {privateData.detectiveClues.map((clue) => (
                    <div key={clue.id} className="text-[11px] text-cyan-100/90 font-medium leading-relaxed bg-cyan-900/20 p-2 rounded-lg border border-cyan-800/30">
                      • {clue.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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

            {canUseSabotage ? (
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
        {!isKiller && !isDetective && (
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-left space-y-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              Dicas para a Reunião
            </span>
            <p className="text-xs text-neutral-300 leading-relaxed">
              • Preste atenção na denúncia do Detetive e nos relatórios forenses.
            </p>
            <p className="text-xs text-neutral-300 leading-relaxed">
              • Apenas o Detetive tem a autoridade para registrar o voto final, convença-o!
            </p>
          </div>
        )}
      </div>

      {/* Detective Accusation Modal */}
      {showDetectiveModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-neutral-900 border-2 border-cyan-500/80 p-5 animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-cyan-300 flex items-center gap-2">
                <Search className="w-4 h-4 text-cyan-400" />
                <span>Quem você acusa de ser o Assassino?</span>
              </h3>
              <button
                onClick={() => setShowDetectiveModal(false)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-300 mb-4">
              Sua acusação oficial será exibida em destaque no telão da TV para todos os participantes!
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {aliveOthers.map((suspect) => (
                <button
                  key={suspect.id}
                  onClick={() => handleDetectiveAccuseSubmit(suspect.id, suspect.name)}
                  className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-cyan-400 text-left transition-all flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{suspect.avatar?.emoji || '👤'}</span>
                    <span className="text-xs font-black text-neutral-200 group-hover:text-cyan-300">
                      {suspect.name}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-neutral-500 group-hover:text-cyan-400" />
                </button>
              ))}
            </div>
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
