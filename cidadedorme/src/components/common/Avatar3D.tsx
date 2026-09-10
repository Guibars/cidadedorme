import {Fingerprint,Skull,ScanEye,Shield,Eye} from 'lucide-react';
import type {PlayerAvatar,Role} from '../../types';
interface Props{avatar:PlayerAvatar;size?:'xs'|'sm'|'md'|'lg'|'xl'|'2xl';isDead?:boolean;role?:Role;showRoleBadge?:boolean;showGlow?:boolean;interactive?:boolean;animated?:boolean;className?:string;onClick?:()=>void}
export function Avatar3D({avatar,size='md',isDead,role,showRoleBadge,className='',onClick}:Props){
 const pixels={xs:28,sm:40,md:48,lg:76,xl:100,'2xl':128}[size];
 const Icon=isDead?Skull:showRoleBadge?role==='ASSASSINO'?Eye:role==='DETETIVE'?ScanEye:Shield:Fingerprint;
 return <div className={`identity-avatar ${className}`} onClick={onClick} style={{width:pixels,height:pixels,color:isDead?'#7d878b':avatar.color,borderColor:isDead?'#45515a':`${avatar.color}70`,background:isDead?'#192028':`${avatar.color}16`}}><Icon size={pixels*.55} strokeWidth={1.25}/><span style={{fontSize:Math.max(8,pixels*.13)}}>{isDead?'ELIMINADO':avatar.name.split(' ')[0].toUpperCase()}</span></div>;
}
