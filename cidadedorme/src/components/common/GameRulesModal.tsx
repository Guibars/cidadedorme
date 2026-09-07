import React, { useState } from 'react';
import {
  X,
  BookOpen,
  MapPin,
  Flame,
  Search,
  Users,
  Footprints,
  Shield,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { sound } from '../../utils/audio';

interface GameRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GameRulesModal({ isOpen, onClose }: GameRulesModalProps) {
  const [activeTab, setActiveTab] = useState<'basics' | 'map' | 'clues' | 'voting'>('basics');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl bg-[#141416] border border-neutral-700/80 shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden text-neutral-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-[#18181b]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center text-[#E50914]">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide text-white uppercase font-['Bebas_Neue',sans-serif]">
                COMO JOGAR • MANUAL DO INVESTIGADOR
              </h2>
              <p className="text-xs text-neutral-400">Regras, movimentação 3D e perícia forense</p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-900/60 px-4 py-2 gap-2 overflow-x-auto">
          {[
            { id: 'basics', label: '🎯 O Jogo', icon: Users },
            { id: 'map', label: '🗺️ Mapa 3D', icon: MapPin },
            { id: 'clues', label: '🔍 Perícia Real', icon: Search },
            { id: 'voting', label: '⚖️ Votação', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  sound.playClick();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  active
                    ? 'bg-[#E50914] text-white shadow-lg'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm leading-relaxed">
          {activeTab === 'basics' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
                  <span className="text-xl">🕵️</span> O Enigma da Mansão
                </h3>
                <p className="text-neutral-300 text-xs sm:text-sm">
                  Entre os convidados reunidos na mansão, <strong>um jogador é o Assassino secreto</strong>.
                  Os demais são <strong>Investigadores Inocentes</strong> cujo dever é sobreviver e descobrir o traidor!
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/40">
                  <span className="text-xs font-black uppercase tracking-wider text-cyan-400 block mb-1">
                    🔍 O Detetive
                  </span>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Investiga suspeitos e pode lançar uma acusação formal. <strong>Regra crucial:</strong> Se o Assassino atacar o Detetive, o Assassino perde o jogo na mesma hora!
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-emerald-950/30 border border-emerald-500/30">
                  <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block mb-1">
                    🛡️ Inocentes
                  </span>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Mova-se pelos cômodos, fique perto de aliados confiáveis, analise os rastros de sangue e vote para prender o assassino.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-rose-950/30 border border-rose-500/30">
                  <span className="text-xs font-black uppercase tracking-wider text-rose-400 block mb-1">
                    🔪 Assassino
                  </span>
                  <p className="text-xs text-neutral-300 leading-relaxed">
                    Aproxime-se e desfira o golpe! Após o ataque, use o tempo de fuga para correr para outro cômodo e forjar seu álibi. Cuidado para não atacar o Detetive!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'map' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-amber-400" /> Movimentação Livre em 3D
                </h3>
                <p className="text-neutral-300 text-xs sm:text-sm mb-3">
                  A mansão é composta por 6 cômodos interligados. Você pode andar a qualquer momento:
                </p>
                <ul className="space-y-2 text-xs text-neutral-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Toque na tela:</strong> Clique em qualquer ponto do mapa 3D ou use os botões rápidos de cômodo para andar.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Lanterna Noturna:</strong> Durante o turno da noite, as luzes apagam e cada jogador ilumina seu redor com um cone de luz.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    <span><strong>Golpe à Queima-Roupa:</strong> O Assassino não escolhe por menu — precisa caminhar até a vítima e atacá-la pessoalmente!</span>
                  </li>
                </ul>
              </div>

              <div className="p-3.5 rounded-2xl bg-amber-950/20 border border-amber-500/30 flex items-center gap-3">
                <span className="text-2xl">💡</span>
                <p className="text-xs text-amber-200/90">
                  <strong>Dica tática:</strong> Nunca fique sozinho no Porão ou no Jardim. Andar em duplas dificulta o ataque do assassino!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'clues' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <Footprints className="w-4 h-4 text-rose-400" /> Perícia Forense Real (Sem pegadinhas de letras!)
                </h3>
                <p className="text-neutral-300 text-xs sm:text-sm mb-3">
                  Esqueça pistas arbitrárias como tamanho do nome. Aqui, cada pista vem de evidências físicas da mansão:
                </p>

                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-xl bg-neutral-800/60 border border-neutral-700/60 flex items-start gap-2.5">
                    <span className="text-lg">🩸</span>
                    <div>
                      <h4 className="text-xs font-bold text-rose-300">Rastro de Sangue & Rota de Fuga</h4>
                      <p className="text-[11px] text-neutral-400">
                        Gotas no chão ligam o cômodo onde o corpo foi achado ao cômodo para onde o assassino correu para se esconder.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-800/60 border border-neutral-700/60 flex items-start gap-2.5">
                    <span className="text-lg">🪵</span>
                    <div>
                      <h4 className="text-xs font-bold text-amber-300">Resíduos Materiais</h4>
                      <p className="text-[11px] text-neutral-400">
                        Cinzas de lareira da Sala, lama do Jardim ou oscilações de energia do Porão provam por quais cômodos o suspeito passou.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-neutral-800/60 border border-neutral-700/60 flex items-start gap-2.5">
                    <span className="text-lg">👂</span>
                    <div>
                      <h4 className="text-xs font-bold text-cyan-300">Acústica & Álibi</h4>
                      <p className="text-[11px] text-neutral-400">
                        Quem estava em cômodos adjacentes ouve barulhos e pode comprovar se o suspeito estava realmente onde disse estar.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'voting' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800">
                <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-emerald-400" /> Julgamento Popular
                </h3>
                <p className="text-neutral-300 text-xs sm:text-sm mb-3">
                  Não existem detetives exclusivos: <strong>todos os jogadores vivos têm poder de voto igualitário!</strong>
                </p>
                <div className="space-y-2 text-xs text-neutral-300">
                  <p>1. Debata abertamente quem estava em qual cômodo quando o crime aconteceu.</p>
                  <p>2. Cada um seleciona seu voto secreto no celular.</p>
                  <p>3. O jogador com a maioria dos votos é executado e seu papel revelado no telão!</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-neutral-800 bg-[#18181b] flex justify-end">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-xl bg-[#E50914] hover:bg-[#b80710] text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
          >
            Entendido, Vamos Jogar!
          </button>
        </div>
      </div>
    </div>
  );
}
