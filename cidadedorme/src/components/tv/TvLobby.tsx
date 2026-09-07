import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { PublicGameState } from '../../types';
import { Users, QrCode, Play, UserPlus, AlertCircle, Trash2, Copy, Check, Wifi, Sparkles, BookOpen } from 'lucide-react';
import { sound } from '../../utils/audio';
import { Avatar3D } from '../common/Avatar3D';
import { GameRulesModal } from '../common/GameRulesModal';

interface TvLobbyProps {
  state: PublicGameState;
  onStartGame: () => void;
  onAddBot: () => void;
  onRemovePlayer?: (id: string) => void;
}

export function TvLobby({ state, onStartGame, onAddBot, onRemovePlayer }: TvLobbyProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [joinUrl, setJoinUrl] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [urlMode, setUrlMode] = useState<'direct' | 'preview'>('direct');
  const [showHostHelp, setShowHostHelp] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);

  useEffect(() => {
    let origin = window.location.origin;
    // Fix for iPhone 'Action required to load your app':
    // ais-dev-* requires Google Workspace authentication on external devices,
    // whereas ais-pre-* provides the public preview without login.
    if (urlMode === 'preview' && origin.includes('ais-dev-')) {
      origin = origin.replace('ais-dev-', 'ais-pre-');
    }
    const url = `${origin}${window.location.pathname}?room=${state.roomCode}&role=player`;
    setJoinUrl(url);

    // High contrast black on white QR code for instant camera recognition on any phone
    QRCode.toDataURL(url, {
      width: 320,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((data) => setQrDataUrl(data))
      .catch((err) => console.error('QR code generation failed:', err));
  }, [state.roomCode, urlMode]);

  const playerCount = state.players.length;
  const canStart = playerCount >= 3 && playerCount <= 5;

  const handleStart = () => {
    sound.playTaDum();
    onStartGame();
  };

  const handleAddBotClick = () => {
    sound.playClick();
    onAddBot();
  };

  const handleCopyLink = () => {
    sound.playClick();
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(() => {});
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-6 flex flex-col justify-between bg-[#141414] text-neutral-100">
      {/* Top Netflix Show Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#E50914]/15 border border-[#E50914]/40 text-[#E50914] text-xs font-black uppercase tracking-[0.2em] mb-2">
          <span className="w-2 h-2 rounded-full bg-[#E50914] animate-pulse" />
          <span>SALA DE ESPERA • SÉRIE ORIGINAL</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-wider uppercase font-['Bebas_Neue',sans-serif] text-white drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)] leading-none">
          O INFILTRADO
        </h1>
        <p className="text-sm md:text-base text-neutral-400 max-w-2xl mx-auto mt-2 font-normal">
          Conecte os celulares para receber os papéis secretos e iniciar a investigação no telão.
        </p>
      </div>

      {/* Main Content: QR Code (Left) + Netflix Connected Profiles (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center flex-1 my-auto">
        {/* Left: QR Code & Access Code Box */}
        <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 md:p-8 rounded-xl bg-[#181818] border border-neutral-800 shadow-[0_15px_40px_rgba(0,0,0,0.8)] relative overflow-hidden">
          <div className="absolute -top-20 -left-20 w-44 h-44 bg-[#E50914]/15 rounded-full blur-3xl pointer-events-none" />

          {/* Access Code */}
          <div className="text-center mb-3">
            <span className="text-xs uppercase tracking-widest text-neutral-400 font-bold block mb-1">
              CÓDIGO DE ENTRADA NA SALA
            </span>
            <div className="inline-block px-7 py-2.5 rounded-lg bg-black/90 border-2 border-amber-500 text-3xl md:text-4xl font-mono font-black tracking-widest text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
              {state.roomCode}
            </div>
          </div>

          {/* QR Code Container */}
          <div className="p-3 bg-white rounded-xl shadow-2xl border-4 border-neutral-700 transition-transform hover:scale-[1.02] duration-300">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Code para sala ${state.roomCode}`}
                className="w-48 h-48 md:w-56 md:h-56 rounded-md object-contain"
              />
            ) : (
              <div className="w-48 h-48 md:w-56 md:h-56 bg-neutral-100 animate-pulse rounded-md flex items-center justify-center">
                <QrCode className="w-12 h-12 text-neutral-400" />
              </div>
            )}
          </div>

          {/* Mode Switcher for External iPhone/Android */}
          <div className="flex items-center gap-1.5 p-1 bg-neutral-900 rounded-lg border border-neutral-700 mt-3 mb-2">
            <button
              onClick={() => setUrlMode('preview')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                urlMode === 'preview'
                  ? 'bg-[#E50914] text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              📱 Celulares (Público)
            </button>
            <button
              onClick={() => setUrlMode('direct')}
              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                urlMode === 'direct'
                  ? 'bg-neutral-700 text-white shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              💻 Redirecionamento Direto
            </button>
          </div>

          {/* Direct Camera Instructions */}
          <p className="mt-1 text-sm text-white font-bold flex items-center gap-2 text-center">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            Aponte a câmera do celular para conectar
          </p>
          <p className="text-xs text-neutral-400 mt-0.5 text-center">
            100% Anônimo • Sem Login ou Senha
          </p>

          <button
            onClick={() => setShowHostHelp(true)}
            className="text-[11px] text-amber-400 hover:text-amber-300 mt-2 text-center bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded px-2.5 py-1.5 transition-colors cursor-pointer w-full"
          >
            ❓ Não conseguiu conectar no iPhone ou quer hospedar no Railway?
          </button>

          {/* Copy Link Button */}
          <div className="mt-3.5 w-full pt-3 border-t border-neutral-800 flex items-center justify-between gap-2">
            <span className="text-[11px] text-neutral-400 font-mono truncate max-w-[220px]">
              {joinUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 rounded bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right: Connected Netflix Profiles Panel */}
        <div className="lg:col-span-7 flex flex-col justify-between h-full p-6 md:p-8 rounded-xl bg-[#181818] border border-neutral-800 shadow-[0_15px_40px_rgba(0,0,0,0.8)]">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#E50914]/20 border border-[#E50914]/40 flex items-center justify-center text-[#E50914]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-wide text-white uppercase font-['Bebas_Neue',sans-serif]">
                    QUEM ESTÁ NA SALA ({playerCount}/5)
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Necessário de 3 a 5 jogadores para iniciar
                  </p>
                </div>
              </div>

              <div className="px-3.5 py-1 rounded-full bg-black/60 border border-neutral-700 text-xs font-bold font-mono">
                <span className={playerCount >= 3 ? 'text-emerald-400' : 'text-amber-400'}>
                  {playerCount}
                </span>
                <span className="text-neutral-500"> / 5 Vagas</span>
              </div>
            </div>

            {/* Players Slots Grid (Netflix Profile Cards) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
              {Array.from({ length: 5 }).map((_, index) => {
                const player = state.players[index];

                if (player) {
                  return (
                    <div
                      key={player.id}
                      className="p-3.5 rounded-2xl bg-[#222222] border border-neutral-700 hover:border-neutral-500 flex items-center justify-between group transition-all duration-200 shadow-md animate-in fade-in"
                    >
                      <div className="flex items-center gap-3">
                        {/* 3D Profile Avatar */}
                        <Avatar3D avatar={player.avatar} size="sm" animated={true} />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-bold text-white tracking-wide truncate max-w-[130px]">
                              {player.name}
                            </h4>
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          </div>
                          <span className="text-[11px] text-neutral-400 font-normal">
                            {player.isBot ? 'Jogador Virtual' : 'Conectado'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          PRONTO
                        </span>
                        {onRemovePlayer && (
                          <button
                            onClick={() => onRemovePlayer(player.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded text-neutral-500 hover:text-red-400 hover:bg-red-950/40 transition-all cursor-pointer"
                            title="Remover jogador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={`empty-${index}`}
                    className="p-3.5 rounded-lg border border-dashed border-neutral-800 bg-[#161616] flex items-center justify-center gap-2.5 text-neutral-600"
                  >
                    <span className="w-6 h-6 rounded-md border border-neutral-800 flex items-center justify-center text-xs font-mono font-bold">
                      {index + 1}
                    </span>
                    <span className="text-xs font-medium tracking-wide">
                      Aguardando jogador celular...
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                id="btn-add-test-bot"
                onClick={handleAddBotClick}
                disabled={playerCount >= 5}
                className="px-4 py-3 rounded-xl bg-[#2a2a2a] hover:bg-[#333333] text-neutral-200 hover:text-white border border-neutral-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <UserPlus className="w-4 h-4 text-amber-400" />
                <span>Adicionar Bot</span>
              </button>

              <button
                id="btn-tv-rules-modal"
                onClick={() => {
                  sound.playClick();
                  setShowRulesModal(true);
                }}
                className="px-4 py-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white border border-neutral-700 text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-amber-400" />
                <span>Como Jogar & Regras</span>
              </button>
            </div>

            <button
              id="btn-start-game"
              onClick={handleStart}
              disabled={!canStart}
              className={`px-8 py-3.5 rounded-xl font-black tracking-wider uppercase text-base flex items-center gap-2.5 transition-all duration-200 shadow-xl ${
                canStart
                  ? 'bg-[#E50914] hover:bg-[#B81D24] active:scale-[0.98] text-white shadow-[0_0_25px_rgba(229,9,20,0.5)] cursor-pointer'
                  : 'bg-neutral-800 text-neutral-500 border border-neutral-700 cursor-not-allowed'
              }`}
            >
              <Play className="w-5 h-5 fill-current" />
              <span>COMEÇAR PARTIDA</span>
            </button>
          </div>

          {!canStart && (
            <div className="mt-2.5 flex items-center gap-1.5 text-xs text-amber-400 justify-center">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Conecte pelo menos 3 jogadores (ou adicione Bots de teste) para iniciar.</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Info (Wi-Fi 3MB badge) */}
      <div className="text-center pt-4 text-xs text-neutral-500 border-t border-neutral-800/80 flex items-center justify-center gap-4">
        <span className="flex items-center gap-1 text-emerald-400">
          <Wifi className="w-3 h-3" />
          <span>Otimizado para Wi-Fi de 3 Mbps</span>
        </span>
        <span>•</span>
        <span>1 Assassino • Todos Investigam & Votam</span>
        <span>•</span>
        <span>100% no Navegador • Sem Aplicativo</span>
      </div>

      {/* Rules Modal */}
      <GameRulesModal isOpen={showRulesModal} onClose={() => setShowRulesModal(false)} />

      {/* Deployment & iPhone Help Modal */}
      {showHostHelp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#181818] border border-neutral-700 rounded-2xl max-w-xl w-full p-6 text-left shadow-2xl relative">
            <h3 className="text-2xl font-black uppercase font-['Bebas_Neue',sans-serif] tracking-wider text-white mb-2">
              CONEXÃO NO IPHONE & HOSPEDAGEM EXTERNA
            </h3>
            
            <div className="space-y-4 text-xs md:text-sm text-neutral-300">
              <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <h4 className="font-bold text-amber-400 flex items-center gap-1.5 mb-1 text-sm">
                  <span>📱 1. Por que deu "Action Required" ou "Page Not Found" no iPhone?</span>
                </h4>
                <p className="leading-relaxed text-neutral-300">
                  No Google AI Studio, o ambiente de desenvolvimento (<code className="text-red-400">ais-dev-</code>) exige login da conta Google dona do projeto. Já o link de prévia (<code className="text-emerald-400">ais-pre-</code>) só fica ativo após você clicar no botão <strong>"Compartilhar" (Share)</strong> no menu superior do AI Studio.
                </p>
                <p className="mt-2 text-neutral-400 text-xs">
                  👉 <strong>Solução rápida:</strong> Clique no botão <strong>Share / Compartilhar</strong> no canto superior do Google AI Studio para ativar o link público para todos os iPhones sem login.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800">
                <h4 className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1 text-sm">
                  <span>🚀 2. Como colocar no Railway ou Render (100% Grátis)?</span>
                </h4>
                <p className="leading-relaxed text-neutral-300">
                  Você pode rodar este jogo em qualquer servidor 24 horas por dia sem depender do Google AI Studio:
                </p>
                <ol className="list-decimal pl-4 mt-2 space-y-1 text-neutral-300">
                  <li>No menu superior do AI Studio, clique em <strong>Export to GitHub</strong> (ou baixe como ZIP).</li>
                  <li>Acesse <strong>Render.com</strong> ou <strong>Railway.app</strong> e crie um novo <strong>Web Service</strong> conectando seu repositório.</li>
                  <li>O build roda com <code className="bg-black/60 px-1 py-0.5 rounded text-amber-300">npm run build</code> e inicializa com <code className="bg-black/60 px-1 py-0.5 rounded text-amber-300">npm start</code>.</li>
                  <li>O Render/Railway vai gerar uma URL pública como <code className="text-blue-400">https://meu-jogo.onrender.com</code>.</li>
                </ol>
                <p className="mt-2 text-xs text-neutral-400">
                  📄 Um arquivo completo de instruções foi criado em <strong>DEPLOY.md</strong> na raiz do projeto.
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowHostHelp(false)}
                className="px-5 py-2 rounded-lg bg-[#E50914] hover:bg-[#B81D24] text-white font-bold text-xs cursor-pointer transition-colors"
              >
                Entendi, fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
