import {useState} from 'react';
import {EyeOff,ScanEye,Moon,Skull,Clock3,Zap,Bell,Flag,Check,NotebookPen} from 'lucide-react';
import type {PrivatePlayerData,PublicGameState,MansionRoomId} from '../../types';
import {getMansionRoom,getRoomCenter} from '../../data/mansion';
import {canWalkSegment} from '../../data/navigation';
import {Mansion3DGridMap} from '../common/Mansion3DGridMap';
import {sound} from '../../utils/audio';
interface Props {
 privateData:PrivatePlayerData; publicState:PublicGameState;
 onKill:(id:string,room?:string,x?:number,y?:number)=>void;
 onMove?:(x:number,y:number,room?:string)=>void; onInvestigate?:(id:string)=>void;
 onTask:(id:string,symbol:number)=>void; onRepair:()=>void; onReport:()=>void; onMeeting:()=>void; onBlackout:()=>void;
}
export function MobileNightAction({privateData:d,publicState:s,onKill,onMove,onInvestigate,onTask,onRepair,onReport,onMeeting,onBlackout}:Props){
 const [selectedTask,setSelectedTask]=useState<string|null>(null);
 const [lastTap,setLastTap]=useState(0);
 const p=d.player,killer=p.role==='ASSASSINO',detective=p.role==='DETETIVE';
 const live=s.players.find(v=>v.id===p.id) || p;
 const near=(roomId:MansionRoomId)=>{const c=getRoomCenter(roomId);return live.x!==undefined&&live.y!==undefined&&Math.hypot(live.x-c.x,live.y-c.y)<65&&canWalkSegment({x:live.x,y:live.y},c);};
 const tasks=d.tasks||[],task=tasks.find(t=>t.id===selectedTask)||tasks.find(t=>!t.completed)||tasks[0];
 const tap=(action:()=>void)=>{const now=Date.now();if(now-lastTap<350)return;setLastTap(now);sound.playClick();sound.triggerVibrate(20);action();};
 if(d.isNightVictim||!p.isAlive)return <div className="mobile-night eliminated-screen"><Skull size={52}/><span className="eyebrow">SEU SEGREDO CONTINUA AQUI</span><h1>Você foi eliminado.</h1><p>Guarde o que viu. Sua descoberta vai reunir o grupo. Não revele o infiltrado aos outros jogadores.</p><span className="secret-note"><EyeOff size={15}/>Acompanhe a reunião no telão.</span></div>;
 return <div className="mobile-night"><header className="mobile-night-heading"><span className="eyebrow"><Moon size={14}/>NOITE {s.round}</span><span className="small-clock"><Clock3 size={14}/>{s.timerSeconds}s</span></header>
 <div className={`role-strip ${killer?'killer':detective?'detective':'innocent'}`}><span>{killer?'O INFILTRADO':detective?'O DETETIVE':'INOCENTE'}</span><EyeOff size={15}/></div>
 <h1>{killer?d.nightActionSubmitted?'Alguém pode ter visto.':'Misture-se aos convidados.':detective?'Observe antes de acusar.':'Mantenha a mansão viva.'}</h1>
 <p className="night-objective">{killer?d.nightActionSubmitted?'A vítima ficou onde caiu. Quem a encontrar pode encerrar a noite. Seus encontros continuam registrados.':'Faça tarefas para sustentar seu álibi. Isole uma pessoa ou provoque um apagão. Um ataque por noite.':detective?'Faça tarefas, observe os encontros e investigue um relato. Na reunião, só você poderá acusar.':'Conclua tarefas, repare apagões e memorize os encontros. Na reunião, seu relato ajuda o detetive.'}</p>
 {s.nightStatus?.blackout&&<section className="blackout-alert" role="status"><Zap size={20}/><div><strong>Apagão · {s.nightStatus.blackoutSeconds}s</strong><p>Vá ao porão. Restaure 3 fusíveis para recuperar a visão.</p></div></section>}
 <Mansion3DGridMap players={s.players} currentPlayerId={p.id} isKiller={killer} isNight blackout={s.nightStatus?.blackout} canMove onMove={onMove} lastStabLocation={d.nearbyBody} highlightRoomId={task?.completed?undefined:task?.roomId} onKillTarget={killer&&!d.nightActionSubmitted&&!d.attackReadyIn?(id,x,y)=>onKill(id,undefined,x,y):undefined} compact/>
 {killer&&!d.nightActionSubmitted&&!!d.attackReadyIn&&<p className="secret-note"><Clock3 size={14}/>Ataque disponível em {d.attackReadyIn}s. Aproveite para criar um álibi.</p>}
 <div className="night-actions">
 {d.nearbyBody&&<button className="button-danger" onClick={onReport}><Flag size={18}/>Relatar descoberta de {d.nearbyBody.victimName}</button>}
 {s.nightStatus?.blackout&&<button className="button-secondary" disabled={!near('basement')} onClick={()=>tap(onRepair)}><Zap size={16}/>Restaurar fusível · {s.nightStatus.repairs}/3{!near('basement')?' · vá ao porão':''}</button>}
 {killer&&<button className="button-secondary" disabled={!d.canBlackout} onClick={onBlackout}><Zap size={16}/>Provocar apagão{!d.canBlackout?' · indisponível':''}</button>}
 <button className="button-secondary" disabled={!d.canCallMeeting||!near('living')} onClick={onMeeting}><Bell size={16}/>{!d.canCallMeeting?'Reunião indisponível':near('living')?'Tocar sino e reunir o grupo':'Sino de emergência · vá à sala'}</button>
 </div>
 <section className="night-task-panel"><div className="task-heading"><span className="eyebrow">TAREFAS DA MANSÃO</span><span>{s.nightStatus?.tasksCompleted||0}/{s.nightStatus?.taskGoal||0}</span></div><p>A meta coletiva recupera o horário do ataque para a investigação.</p><div className="task-tabs">{tasks.map(t=><button key={t.id} className={task?.id===t.id?'active':''} onClick={()=>setSelectedTask(t.id)}>{t.completed?<Check size={16}/>:<span className="task-dot"/>}<span>{t.title}<small>{getMansionRoom(t.roomId).name}</small></span></button>)}</div>
 {task&&<div className="task-console"><h3>{task.title}</h3>{task.completed?<p className="task-complete"><Check size={16}/>Concluída. Seu álibi ganhou um detalhe real.</p>:<><p>{near(task.roomId)?task.instruction:`Vá ao centro de ${getMansionRoom(task.roomId).name} para interagir. O cômodo está destacado no mapa.`}</p><div className="task-sequence" aria-label={`Sequência: ${task.sequence.join(', ')}. ${task.progress} passos concluídos.`}>{task.sequence.map((n,i)=><span key={i} className={i<task.progress?'done':i===task.progress?'current':''}>{n}</span>)}</div><div className="task-keys">{[1,2,3,4].map(n=><button key={n} disabled={!near(task.roomId)} onClick={()=>tap(()=>onTask(task.id,n))}>{n}</button>)}</div><small>Repita a sequência com calma. Um erro reinicia esta tarefa.</small></>}</div>}
 </section>
 {detective&&<section className="investigation-panel"><span className="eyebrow"><ScanEye size={14}/> INVESTIGAÇÃO PARTICULAR</span>{d.detectiveInvestigationResult?<p className="investigation-result">{d.detectiveInvestigationResult.resultText}</p>:<><p>Consulte os encontros de uma pessoa. O relatório traz fatos, sem revelar a identidade dela.</p><div className="suspect-options">{s.players.filter(v=>v.id!==p.id&&v.isAlive).map(v=><button disabled={d.hasUsedAbility} key={v.id} onClick={()=>onInvestigate?.(v.id)}>{v.name}<ScanEye size={14}/></button>)}</div></>}</section>}
 <details className="witness-notebook"><summary><NotebookPen size={16}/>Caderno de encontros · {d.sightings?.length||0}</summary>{d.sightings?.length?d.sightings.slice(-6).reverse().map((m,i)=><p key={i}><strong>{m.playerName}</strong> · {getMansionRoom(m.roomId).name}<small>{m.secondsIntoNight}s após o início da noite</small></p>):<p>Aproxime-se de alguém. Os encontros visíveis serão anotados aqui.</p>}</details>
 <p className="secret-note"><EyeOff size={14}/>Só você deve ver esta tela. Qualquer um pode blefar.</p></div>;
}
