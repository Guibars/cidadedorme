import {Volume2,VolumeX,RotateCcw} from 'lucide-react';
import {useState, useEffect} from 'react';
import {sound} from '../../utils/audio';
import type {PublicGameState} from '../../types';
interface Props{state?:PublicGameState;roomCode?:string;round?:number;maxRounds?:number;phaseLabel?:string;onRestart?:()=>void}
export function TvHeader({state,roomCode,round,maxRounds,phaseLabel,onRestart}:Props){
 const [audio,setAudio]=useState(sound.enabled);
 useEffect(()=>{const sync=()=>setAudio(sound.enabled);window.addEventListener('infiltrado-audio-change',sync);return()=>window.removeEventListener('infiltrado-audio-change',sync);},[]);
 const labels:Record<string,string>={LOBBY:'SALA DE ESPERA',INTRO:'O CONVITE',ROLE_REVEAL:'IDENTIDADES SECRETAS',NIGHT_KILLER:'A CIDADE DORME',NIGHT_FALL:'A CIDADE DORME',DAY_BREAK:'AMANHECER',CRIME_SCENE:'CENA DO CRIME',ROUND_QUESTION:'SEU ÁLIBI',ROUND_REVEAL:'DEPOIMENTOS',DISCUSSION:'DEBATE',VOTING:'ACUSAÇÃO DO DETETIVE',VOTE_REVEAL:'A ACUSAÇÃO',VERDICT:'VEREDITO',GAME_OVER:'IDENTIDADES REVELADAS'};
 return <header className="phase-header"><div className="phase-header-left"><small>SALA <strong>{state?.roomCode||roomCode}</strong></small><span className="phase-badge">{phaseLabel||labels[state?.phase||'LOBBY']||'EM JOGO'}</span></div><div className="phase-header-right">{!!(state?.round||round)&&<small>RODADA {state?.round||round} / {state?.maxRounds||maxRounds||3}</small>}{state&&state.phase!=='LOBBY'&&onRestart&&<button className="button-quiet" onClick={()=>{if(confirm('Voltar para a sala e encerrar esta partida?'))onRestart();}}><RotateCcw size={13}/>Reiniciar</button>}<button className="icon-button" aria-label={audio?'Silenciar áudio':'Ativar áudio'} onClick={()=>setAudio(sound.toggleSound())}>{audio?<Volume2 size={17}/>:<VolumeX size={17}/>}</button></div></header>;
}
