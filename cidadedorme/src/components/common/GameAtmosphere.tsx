import {useEffect,useRef,useState} from 'react';
import {Volume2,VolumeX,Vibrate,AudioLines} from 'lucide-react';
import type {PrivatePlayerData,PublicGameState} from '../../types';
import {sound} from '../../utils/audio';
export function GameAtmosphere({state,privateData,mobile=false}:{state:PublicGameState|null;privateData?:PrivatePlayerData|null;mobile?:boolean}){
 const [,refresh]=useState(0);
 const [visible,setVisible]=useState(!document.hidden);
 const [notice,setNotice]=useState('');
 const lastFeedback=useRef('');
 const night=state?.phase==='NIGHT_KILLER'||state?.phase==='NIGHT_FALL';
 const tense=night||state?.phase==='DISCUSSION';
 const audioEnabled=sound.enabled;
 useEffect(()=>{const sync=()=>refresh(n=>n+1);const visibility=()=>setVisible(!document.hidden);window.addEventListener('infiltrado-audio-change',sync);document.addEventListener('visibilitychange',visibility);return()=>{window.removeEventListener('infiltrado-audio-change',sync);document.removeEventListener('visibilitychange',visibility);};},[]);
 useEffect(()=>{
   if(mobile||!tense||!visible||!audioEnabled)return;
   sound.startDrone(); sound.playHauntedWind();
   const ambient=window.setInterval(()=>{sound.playHauntedWind();if(!sound.gentle)sound.playFootsteps();},14000);
   return()=>{clearInterval(ambient);sound.stopDrone();};
 },[tense,mobile,visible,audioEnabled]);
 useEffect(()=>{
   if(!state||!visible)return;
   if(night){if(mobile)sound.triggerNightFallVibrate();else sound.playNightFall();}
   if(state.phase==='DAY_BREAK'){if(mobile)sound.triggerMorningVibrate();else if(state.nightStatus?.meetingReason)sound.playMeetingBell();}
   if(state.phase==='VOTING'&&mobile){sound.triggerVibrate([60,70,60]);setNotice('Hora da decisão. Só o detetive pode acusar.');}
 },[state?.phase,state?.round,state?.roomCode]);
 useEffect(()=>{
   if(!night||!visible||!state?.nightStatus?.blackout)return;
   if(mobile){sound.triggerVibrate([50,50,50]);setNotice('Apagão! Repare os fusíveis no porão.');}else sound.playMeetingBell();
 },[state?.nightStatus?.blackout]);
 useEffect(()=>{
   const f=privateData?.feedback;if(!f||!state)return;
   const key=`${state.roomCode}:${f.id}`;if(key===lastFeedback.current)return;lastFeedback.current=key;
   setNotice(f.text);
   // All personal sounds stay generic: speakers must not reveal anyone's role.
   sound.triggerVibrate(f.kind==='victim'?[120,80,120]:f.kind==='task'?[35,45,35]:30);
 },[privateData?.feedback?.id,state?.roomCode]);
 useEffect(()=>{if(!notice)return;const timeout=setTimeout(()=>setNotice(''),6500);return()=>clearTimeout(timeout);},[notice]);
 useEffect(()=>{
   if(!visible||!state||state.timerSeconds>5||state.timerSeconds<=0||state.phase==='LOBBY')return;
   if(mobile)sound.triggerUrgentTimerVibrate();else sound.playTick();
 },[state?.timerSeconds]);
 return <><details className={`atmosphere-controls ${mobile?'mobile':''}`}><summary><AudioLines size={15}/>Ambiente <span>{sound.enabled?'Som ligado':'Silencioso'} · {sound.gentle?'suave':'sombrio'}</span></summary><div className="atmosphere-settings"><button aria-pressed={sound.enabled} onClick={()=>sound.toggleSound()}>{sound.enabled?<Volume2 size={16}/>:<VolumeX size={16}/>}Som</button><label>Volume<input type="range" min="0" max="1" step="0.05" value={sound.volume} onChange={e=>sound.setVolume(Number(e.target.value))}/></label><button aria-pressed={sound.gentle} onClick={()=>sound.setGentle(!sound.gentle)}>{sound.gentle?'Clima suave':'Clima sombrio'}</button>{mobile&&<button aria-pressed={sound.hapticsEnabled} onClick={()=>{sound.toggleHaptics();sound.triggerVibrate(50);}}><Vibrate size={16}/>Vibração {sound.hapticsEnabled?'ligada':'desligada'}</button>}</div>{mobile&&<p>Trilha no telão. Avisos aqui e vibração nos aparelhos compatíveis.</p>}</details>{mobile&&notice&&<div key={notice} className="game-notice" role="status" aria-live="polite">{notice}</div>}</>;
}
