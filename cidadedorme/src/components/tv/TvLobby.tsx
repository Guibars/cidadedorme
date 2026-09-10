import {useEffect,useState} from 'react';
import QRCode from 'qrcode';
import {Users,Copy,Check,Play,UserPlus,Trash2,BookOpen,Smartphone,ArrowRight} from 'lucide-react';
import type {PublicGameState} from '../../types';
import {Avatar3D} from '../common/Avatar3D';
import {GameRulesModal} from '../common/GameRulesModal';
interface Props {state:PublicGameState;onStartGame:()=>void;onAddBot:()=>void;onRemovePlayer?:(id:string)=>void}
export function TvLobby({state,onStartGame,onAddBot,onRemovePlayer}:Props){
 const [qr,setQr]=useState(''),[url,setUrl]=useState(''),[copied,setCopied]=useState(false),[rules,setRules]=useState(false);
 useEffect(()=>{let cancelled=false;(async()=>{
   let origin=location.origin;
   try{const res=await fetch('/api/join-origin');if(res.ok){const data=await res.json();origin=data.origin||origin;}}catch{}
   const link=`${origin}${location.pathname}?role=player&room=${state.roomCode}`;
   const image=await QRCode.toDataURL(link,{width:320,margin:2,color:{dark:'#10242b',light:'#ffffff'}});
   if(!cancelled){setUrl(link);setQr(image);}
 })();return()=>{cancelled=true;};},[state.roomCode]);
 const count=state.players.length;
 return <div className="lobby-screen">
   <div className="lobby-heading"><div><div className="eyebrow">MANSÃO BLACKWOOD / ANTES DA MEIA-NOITE</div><h1>A lista de convidados<span>.</span></h1><p>Reúna seus amigos. Um de vocês tem algo a esconder.</p></div><button className="button-quiet" onClick={()=>setRules(true)}><BookOpen size={16}/>Como jogar</button></div>
   <div className="lobby-grid">
     <section className="invite-panel"><span className="eyebrow"><Smartphone size={14}/> SEU CELULAR É O CONTROLE</span><h2>Seu convite está aqui.</h2><p>Aponte a câmera ou entre com o código.</p><div className="qr-frame">{qr?<img src={qr} alt={`QR Code da sala ${state.roomCode}`}/>:<span>Gerando convite…</span>}</div><span className="field-label">CÓDIGO DA SALA</span><strong className="room-code">{state.roomCode}</strong><button className="button-quiet" onClick={async()=>{try{await navigator.clipboard.writeText(url);setCopied(true);}catch{setCopied(false);}}}>{copied?<Check size={15}/>:<Copy size={15}/>} {copied?'Convite copiado':'Copiar convite'}</button><small>Na mesma rede Wi-Fi ao jogar localmente.</small></section>
     <section className="guest-panel"><div className="guest-panel-heading"><div><Users size={19}/><h2>Quem vai entrar no jogo?</h2></div><span>{count}<small> / 5</small></span></div><div className="guest-list">{Array.from({length:5},(_,i)=>{const p=state.players[i];return p?<div className="guest-row" key={p.id}><span className="guest-number">0{i+1}</span><Avatar3D avatar={p.avatar} size="md"/><div className="guest-name"><strong>{p.name}</strong><small>{p.isBot?'Convidado virtual':p.connected?'Celular conectado':'Reconectando…'}</small></div><span className={p.connected?'guest-ready':'guest-offline'}>{p.connected?'PRONTO':'OFFLINE'}</span>{onRemovePlayer&&<button className="icon-button" aria-label={`Remover ${p.name}`} onClick={()=>onRemovePlayer(p.id)}><Trash2 size={15}/></button>}</div>:<div className="guest-row empty" key={i}><span className="guest-number">0{i+1}</span><span className="empty-guest"><UserPlus size={20}/></span><span>Um lugar à espera de um segredo.</span></div>;})}</div><div className="lobby-actions"><button id="btn-add-test-bot" className="button-secondary" disabled={count>=5} onClick={onAddBot}><UserPlus size={16}/>Adicionar bot</button><button className="button-secondary" disabled={count>3} onClick={()=>{onAddBot();onAddBot();}}><UserPlus size={16}/>Adicionar 2 bots</button><button id="btn-start-game" className="button-primary" disabled={count<3} onClick={onStartGame}><Play size={16} fill="currentColor"/>Começar partida<ArrowRight size={17}/></button></div><p className="lobby-hint">{count<3?`Faltam ${3-count} convidados. Você também pode completar com bots.`:'Prontos para jogar, inclusive em dupla + 2 bots. O detetive será uma pessoa real.'}</p></section>
   </div><div className="lobby-footer"><span>1 infiltrado · 1 detetive · inocentes</span><span>Todos podem mentir. Só o detetive acusa.</span></div><GameRulesModal isOpen={rules} onClose={()=>setRules(false)}/>
 </div>;
}
