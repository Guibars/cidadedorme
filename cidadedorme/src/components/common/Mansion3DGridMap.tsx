import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Crosshair, MapPin, Swords } from 'lucide-react';
import type { PublicPlayer, MansionRoomId, ForensicEvidence } from '../../types';
import { MANSION_ROOMS, MANSION_ROOM_BOUNDS, getRoomAtPosition, getRoomCenter } from '../../data/mansion';
import { canWalkSegment, findMansionPath, stepTowards, type Point } from '../../data/navigation';
interface Props {
  players: PublicPlayer[]; currentPlayerId?: string; isKiller?: boolean; isNight?: boolean; canMove?: boolean;
  lastStabLocation?: {x:number;y:number;victimId?:string;victimName?:string;roomId?:MansionRoomId} | null;
  forensicEvidence?: ForensicEvidence | null; highlightRoomId?: MansionRoomId | null; victimPlayerId?: string | null;
  onMove?: (x:number,y:number,roomId:MansionRoomId)=>void;
  onKillTarget?: (id:string,x:number,y:number)=>void; showControls?: boolean; compact?: boolean;
}
export function Mansion3DGridMap(props: Props) {
  const {players,currentPlayerId,isNight=false,canMove=true,showControls=true} = props;
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props); latest.current=props;
  const mine=players.find(p=>p.id===currentPlayerId);
  const position=useRef<Point>({x:mine?.x??400,y:mine?.y??240});
  const path=useRef<Point[]>([]);
  const direction=useRef<Point>({x:0,y:0});
  const [room,setRoom]=useState(getRoomAtPosition(position.current.x,position.current.y));
  const [nearby,setNearby]=useState<PublicPlayer | null>(null);
  const nearRef=useRef<PublicPlayer | null>(null);
  const mapImage=useRef<HTMLImageElement | null>(null);
  const moving=useRef(false);
  const lastSent=useRef(0);
  const remote=useRef(new Map<string,Point>());
  useEffect(()=>{
    const image=new Image(); image.src='/art/mansion-map.png'; image.onload=()=>{mapImage.current=image;};
    return()=>{image.onload=null;};
  },[]);
  useEffect(()=>{
    if(mine?.x!==undefined && mine.y!==undefined && !moving.current) position.current={x:mine.x,y:mine.y};
  },[mine?.x,mine?.y,currentPlayerId]);
  const stop=()=>{ direction.current={x:0,y:0}; };
  useEffect(()=>{
    const keys=new Set<string>();
    const update=()=>{
      direction.current={x:Number(keys.has('d')||keys.has('arrowright'))-Number(keys.has('a')||keys.has('arrowleft')),y:Number(keys.has('s')||keys.has('arrowdown'))-Number(keys.has('w')||keys.has('arrowup'))};
    };
    const down=(e:KeyboardEvent)=>{
      if(!latest.current.canMove || !latest.current.currentPlayerId || /INPUT|TEXTAREA|SELECT/.test((e.target as HTMLElement).tagName))return;
      if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(e.key.toLowerCase())) {
        e.preventDefault(); path.current=[]; keys.add(e.key.toLowerCase());update();
      }
    };
    const up=(e:KeyboardEvent)=>{keys.delete(e.key.toLowerCase());update();};
    const reset=()=>{keys.clear();stop();path.current=[];};
    window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',reset);
    document.addEventListener('visibilitychange',reset);
    return()=>{window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',reset);};
  },[]);
  useEffect(()=>{
    let frame=0, previous=0, lastUi=0;
    const draw=(now:number)=>{
      const p=latest.current;
      const dt=Math.min((now-(previous||now))/1000,0.04);previous=now;
      const old=position.current;
      if(p.canMove && p.currentPlayerId) {
        let next=old;
        const dir=direction.current;
        if(dir.x||dir.y) {
          const len=Math.hypot(dir.x,dir.y);
          const target={x:old.x+dir.x/len*220*dt,y:old.y+dir.y/len*220*dt};
          if(canWalkSegment(old,target))next=target;
        } else if(path.current.length) {
          next=stepTowards(old,path.current[0],220*dt);
          if(!canWalkSegment(old,next)) {path.current=[];next=old;}
          else if(Math.hypot(next.x-path.current[0].x,next.y-path.current[0].y)<1)path.current.shift();
        }
        position.current=next;
        const changed=next.x!==old.x||next.y!==old.y;
        if((changed && now-lastSent.current>=75)||(moving.current&&!changed)) {
          p.onMove?.(next.x,next.y,getRoomAtPosition(next.x,next.y));lastSent.current=now;
        }
        moving.current=changed;
      } else {path.current=[];stop();moving.current=false;}
      const pos=position.current;
      if(now-lastUi>120) {
        setRoom(getRoomAtPosition(pos.x,pos.y));
        const victim=p.isKiller && p.onKillTarget ? p.players.filter(v=>v.id!==p.currentPlayerId&&v.isAlive&&v.x!==undefined&&v.y!==undefined&&Math.hypot(v.x-pos.x,v.y-pos.y)<=85&&canWalkSegment(pos,{x:v.x,y:v.y})).sort((a,b)=>Math.hypot(a.x!-pos.x,a.y!-pos.y)-Math.hypot(b.x!-pos.x,b.y!-pos.y))[0] : undefined;
        if(nearRef.current?.id!==victim?.id){nearRef.current=victim??null;setNearby(victim??null);}
        lastUi=now;
      }
      const c=canvas.current,ctx=c?.getContext('2d');
      if(c&&ctx) {
        ctx.setTransform(c.width/800,0,0,c.height/500,0,0);
        ctx.clearRect(0,0,800,500);
        ctx.fillStyle='#101c23';ctx.fillRect(0,0,800,500);
        if(mapImage.current)ctx.drawImage(mapImage.current,0,0,800,500);
        ctx.fillStyle='rgba(4,12,18,0.18)';ctx.fillRect(0,0,800,500);
        if(p.isNight && p.currentPlayerId) {
          const light=ctx.createRadialGradient(pos.x,pos.y,55,pos.x,pos.y,210);
          light.addColorStop(0,'rgba(2,8,13,0)');light.addColorStop(1,'rgba(2,8,13,.78)');ctx.fillStyle=light;ctx.fillRect(0,0,800,500);
        }
        for(const r of MANSION_ROOMS) {
          const b=MANSION_ROOM_BOUNDS[r.id];
          const highlight=p.highlightRoomId===r.id||p.forensicEvidence?.crimeRoomId===r.id;
          ctx.font='600 10px system-ui';ctx.textAlign='center';
          const label=r.name.replace(' da Mansão','').replace(' & Jardim','').replace(' Elétrico','');
          const width=ctx.measureText(label).width+18;
          ctx.fillStyle=highlight?'#952d38':'rgba(5,12,16,.87)';ctx.beginPath();ctx.roundRect(b.x+b.w/2-width/2,b.y+8,width,20,4);ctx.fill();
          ctx.fillStyle=highlight?'#fff':'#dfd2b9';ctx.fillText(label,b.x+b.w/2,b.y+22);
        }
        if(path.current.length) {
          const end=path.current[path.current.length-1];ctx.strokeStyle='#d6b879';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(end.x,end.y,7,0,Math.PI*2);ctx.stroke();
        }
        for(const player of p.players) {
          if(player.x===undefined||player.y===undefined)continue;
          const self=player.id===p.currentPlayerId;
          const target={x:player.x,y:player.y};
          const prior=remote.current.get(player.id)??target;
          const point=self?pos:{x:prior.x+(target.x-prior.x)*Math.min(1,dt*14),y:prior.y+(target.y-prior.y)*Math.min(1,dt*14)};
          remote.current.set(player.id,point);
          if(p.isNight&&p.currentPlayerId&&!self&&Math.hypot(point.x-pos.x,point.y-pos.y)>170)continue;
          ctx.save();ctx.translate(point.x,point.y);
          ctx.shadowColor='#000';ctx.shadowBlur=8;ctx.shadowOffsetY=3;
          ctx.fillStyle=player.isAlive?player.avatar.color:'#485058';ctx.beginPath();ctx.arc(0,0,self?13:11,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;ctx.shadowOffsetY=0;
          ctx.strokeStyle=self?'#f4e4bc':'#c9c3b0';ctx.lineWidth=self?2.5:1;ctx.stroke();
          ctx.fillStyle='#fff';ctx.textAlign='center';ctx.font='bold 11px system-ui';ctx.fillText(player.isAlive?player.name.slice(0,1).toUpperCase():'×',0,4);
          ctx.font='600 10px system-ui';const label=self?'VOCÊ':player.name;const width=ctx.measureText(label).width+10;
          ctx.fillStyle='#081218e8';ctx.beginPath();ctx.roundRect(-width/2,16,width,17,3);ctx.fill();ctx.fillStyle=self?'#ead19d':'#fff';ctx.fillText(label,0,28);
          ctx.restore();
        }
        if(p.lastStabLocation && !p.isNight) {
          const {x,y}=p.lastStabLocation;ctx.strokeStyle='#ff6370';ctx.lineWidth=2;ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2);ctx.stroke();
        }
      }
      frame=requestAnimationFrame(draw);
    };
    frame=requestAnimationFrame(draw);return()=>cancelAnimationFrame(frame);
  },[]);
  const walkTo=(point:Point)=>{if(canMove) {stop();path.current=findMansionPath(position.current,point);}};
  const pointer=(e:PointerEvent<HTMLCanvasElement>)=>{
    if(!canMove)return;
    const r=e.currentTarget.getBoundingClientRect();walkTo({x:(e.clientX-r.left)/r.width*800,y:(e.clientY-r.top)/r.height*500});
  };
  return <div className="mansion-map">
    <div className="map-topline"><span><MapPin size={13}/>{currentPlayerId?MANSION_ROOMS.find(r=>r.id===room)?.name:'Planta da mansão'}</span><span>{isNight?'VISIBILIDADE LIMITADA':'CENA DA INVESTIGAÇÃO'}</span></div>
    <div className="map-viewport">
      <canvas ref={canvas} width={1600} height={1000} onPointerDown={pointer} aria-label="Mapa da mansão. Toque para caminhar ou use as setas e WASD." />
      {nearby&&props.onKillTarget&&canMove&&<button className="strike-button" onClick={()=>{
        const p=position.current;props.onMove?.(p.x,p.y,getRoomAtPosition(p.x,p.y));props.onKillTarget?.(nearby.id,p.x,p.y);
      }}><Swords size={17}/>Atacar {nearby.name}</button>}
    </div>
    {showControls&&canMove&&<div className="map-controls">
      <div className="room-shortcuts">{MANSION_ROOMS.map((r,i)=><button key={r.id} className={room===r.id?'active':''} onClick={()=>walkTo(getRoomCenter(r.id))}><span>0{i+1}</span>{r.name.split(' ')[0]}</button>)}<p>Toque no mapa para andar. Segure as setas para controlar.</p></div>
      <div className="direction-pad">{[{x:0,y:-1,Icon:ArrowUp,label:'Cima',cls:'up'},{x:-1,y:0,Icon:ArrowLeft,label:'Esquerda',cls:'left'},{x:1,y:0,Icon:ArrowRight,label:'Direita',cls:'right'},{x:0,y:1,Icon:ArrowDown,label:'Baixo',cls:'down'}].map(d=><button key={d.cls} className={d.cls} aria-label={d.label} onPointerDown={e=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);path.current=[];direction.current={x:d.x,y:d.y};}} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop}><d.Icon size={20}/></button>)}<Crosshair className="pad-center" size={18}/></div>
    </div>}
  </div>;
}
