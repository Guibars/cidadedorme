import { useState } from 'react';
import { ArrowUpRight, Play, Smartphone, Users, Tv, Eye, Moon, Fingerprint, BookOpen, Loader2 } from 'lucide-react';
import { GameRulesModal } from '../common/GameRulesModal';
interface Props { onCreateRoom:()=>void; onSwitchToPlayer:()=>void; isCreatingRoom?:boolean }
export function TvHome({onCreateRoom,onSwitchToPlayer,isCreatingRoom}:Props) {
  const [rules,setRules]=useState(false);
  return <div className="home-screen">
    <img className="home-art" src="/art/mansion-night.png" alt="Uma mansão iluminada por velas, cercada de neblina, e cinco convidados misteriosos."/>
    <div className="home-shade"/>
    <div className="home-content">
      <div className="eyebrow"><span className="status-dot"/> UMA NOITE. MUITAS MENTIRAS.</div>
      <h1 className="game-title"><span>O</span> INFILTRADO<span className="title-period">.</span></h1>
      <p className="home-tagline">Confie nos seus amigos.<br/><em>Se você tiver coragem.</em></p>
      <p className="home-description">A cidade dorme. Alguém faz sua jogada.<br/>Entre na mansão, esconda sua identidade e descubra<br className="desktop-break"/> quem está mentindo antes que seja tarde.</p>
      <div className="home-actions">
        <button id="btn-create-room" className="button-primary" disabled={isCreatingRoom} onClick={onCreateRoom}>{isCreatingRoom?<Loader2 className="animate-spin" size={18}/>:<Play size={18} fill="currentColor"/>}{isCreatingRoom?'Preparando a sala…':'Criar partida'}<ArrowUpRight size={18}/></button>
        <button id="btn-switch-player-mode" className="button-secondary" onClick={onSwitchToPlayer}><Smartphone size={18}/>Entrar com código</button>
      </div>
      <div className="home-meta"><span><Users size={14}/>3–5 jogadores</span><span><Tv size={14}/>TV + celulares</span><span><Eye size={14}/>Papéis secretos</span></div>
    </div>
    <div className="home-bottom">
      <div className="home-chapter"><span>O CENÁRIO</span><strong>Mansão Blackwood</strong><small>Todos são convidados. Ninguém é confiável.</small></div>
      <button className="rules-link" onClick={()=>setRules(true)}><BookOpen size={16}/>Como jogar<ArrowUpRight size={15}/></button>
    </div>
    <div className="game-loop"><div><Moon/><span><strong>01 / A NOITE</strong>Explore. Observe. Aja em segredo.</span></div><div><Fingerprint/><span><strong>02 / O ÁLIBI</strong>Conte sua versão. Sustente a mentira.</span></div><div><Users/><span><strong>03 / O JULGAMENTO</strong>Debata. Vote. Revele o infiltrado.</span></div></div>
    <GameRulesModal isOpen={rules} onClose={()=>setRules(false)}/>
  </div>;
}
