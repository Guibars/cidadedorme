import { useState } from 'react';
import { Player, PublicGameState } from '../../types';
import { Vote, Check, ShieldCheck, X } from 'lucide-react';
import { sound } from '../../utils/audio';

interface MobileVotingProps {
  player: Player;
  state: PublicGameState;
  onSubmitVote: (targetPlayerId: string) => void;
  onConfirmVote: () => void;
}

export function MobileVoting({
  player,
  state,
  onSubmitVote,
  onConfirmVote,
}: MobileVotingProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(player.votedTargetId || null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = useState<boolean>(player.hasConfirmedVote);

  const targets = state.players.filter((p) => p.id !== player.id && p.isAlive);
  const selectedPlayer = state.players.find((p) => p.id === selectedTargetId);

  const handleSelect = (id: string) => {
    if (isConfirmed) return;
    setSelectedTargetId(id);
    sound.playClick();
    sound.triggerVibrate(25);
    onSubmitVote(id);
  };

  const handleOpenConfirm = () => {
    if (!selectedTargetId || isConfirmed) return;
    sound.playClick();
    setShowConfirmModal(true);
  };

  const handleConfirmYes = () => {
    setIsConfirmed(true);
    setShowConfirmModal(false);
    sound.playClick();
    sound.triggerVibrate([50, 100]);
    onConfirmVote();
  };

  const handleConfirmNo = () => {
    setShowConfirmModal(false);
    sound.playClick();
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between p-5 max-w-md mx-auto bg-neutral-950 text-neutral-100">
      {/* Top Banner */}
      <div className="pt-2 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold uppercase tracking-wider mb-2">
          <Vote className="w-3.5 h-3.5" />
          VOTO INDIVIDUAL
        </div>
        <h2 className="text-2xl font-black uppercase font-['Cinzel'] tracking-wide text-neutral-100">
          Quem você acha que é o assassino?
        </h2>
        <p className="text-xs text-neutral-400 mt-1">
          Toque no cartão do seu suspeito principal para votar.
        </p>
      </div>

      {/* Target Cards Grid */}
      <div className="my-auto py-4 space-y-3">
        {targets.map((target) => {
          const isSelected = selectedTargetId === target.id;

          return (
            <button
              key={target.id}
              type="button"
              disabled={isConfirmed}
              onClick={() => handleSelect(target.id)}
              className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all cursor-pointer ${
                isSelected
                  ? 'bg-rose-600/20 border-2 border-rose-500 shadow-[0_0_25px_rgba(225,29,72,0.3)] scale-[1.02]'
                  : 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700'
              } ${isConfirmed && !isSelected ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-gradient-to-br ${target.avatar.bgGradient} border border-white/10`}
                >
                  {target.avatar.emoji}
                </div>
                <div className="text-left">
                  <h3 className="text-base font-bold text-neutral-100 tracking-wide">
                    {target.name}
                  </h3>
                  <span className="text-xs text-neutral-400">
                    {target.avatar.name}
                  </span>
                </div>
              </div>

              {isSelected && (
                <div className="w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0 shadow-lg">
                  <Check className="w-5 h-5" />
                </div>
              )}
            </button>
          );
        })}

        {/* Action Button */}
        {!isConfirmed ? (
          <button
            onClick={handleOpenConfirm}
            disabled={!selectedTargetId}
            className={`w-full py-4 mt-4 rounded-xl font-bold tracking-wider uppercase text-sm flex items-center justify-center gap-2 transition-all ${
              selectedTargetId
                ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)] cursor-pointer'
                : 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
            }`}
          >
            <span>VOTAR EM {selectedPlayer?.name || 'UM SUSPEITO'}</span>
          </button>
        ) : (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 text-center animate-in zoom-in-95">
            <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold text-sm mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>VOTO CONFIRMADO EM SEGREDO</span>
            </div>
            <p className="text-xs text-neutral-400">
              Você votou em <strong className="text-neutral-200">{selectedPlayer?.name}</strong>. Olhe para a TV para acompanhar a apuração!
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-5">
          <div className="w-full max-w-sm rounded-3xl bg-neutral-900 border-2 border-rose-500/60 p-6 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center text-3xl shadow-inner bg-gradient-to-br from-rose-600 to-neutral-900">
              {selectedPlayer.avatar.emoji}
            </div>

            <h3 className="text-xl font-black uppercase font-['Cinzel'] tracking-wider text-neutral-100 mb-2">
              CONFIRMAR VOTO?
            </h3>

            <p className="text-sm text-neutral-300 mb-6">
              Você tem certeza de que deseja acusar <strong className="text-rose-400 font-bold">{selectedPlayer.name}</strong> de ser o Assassino?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleConfirmNo}
                className="py-3.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
              >
                NÃO
              </button>

              <button
                onClick={handleConfirmYes}
                className="py-3.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs uppercase tracking-wider cursor-pointer shadow-[0_0_15px_rgba(225,29,72,0.4)] transition-all"
              >
                SIM, CONFIRMAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pb-2 text-center text-xs text-neutral-600">
        Ninguém na sala saberá em quem você votou até a revelação oficial
      </div>
    </div>
  );
}
