import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Room } from '../server/gameManager';
import { canWalkSegment, findMansionPath, stepTowards } from '../src/data/navigation';
import { MANSION_ROOMS, getRoomCenter } from '../src/data/mansion';
function setup(t: any, count=5) {
 t.mock.timers.enable({apis:['setTimeout','setInterval','Date']});
 const room=new Room('TESTE');
 for(let i=0;i<count;i++)room.addPlayer(`p${i}`,`Pessoa ${i}`,'avatar-fox');
 t.after(()=>room.cleanup());
 return room;
}
test('all 30 room-to-room routes reach their destination through doors',()=>{
 for(const a of MANSION_ROOMS)for(const b of MANSION_ROOMS){
  if(a===b)continue;
  const from=getRoomCenter(a.id),to=getRoomCenter(b.id),route=findMansionPath(from,to);
  assert.ok(route.length,`${a.id} -> ${b.id}`);assert.deepEqual(route.at(-1),to);
  let previous=from;for(const point of route){assert.ok(canWalkSegment(previous,point),`${a.id} -> ${b.id}`);previous=point;}
 }
 assert.equal(canWalkSegment({x:200,y:160},{x:260,y:160}),false);
});
test('movement speed is independent of frame rate and stops at destination',()=>{
 for(const fps of [30,60,120]){let p={x:100,y:100};for(let i=0;i<fps;i++)p=stepTowards(p,{x:700,y:100},220/fps);assert.ok(Math.abs(p.x-320)<.01);}
 assert.deepEqual(stepTowards({x:10,y:0},{x:13,y:0},12),{x:13,y:0});
});
test('one start assigns one killer and one detective, repeated start is ignored',t=>{
 const r=setup(t);assert.equal(r.startGame(),true);const roles=[...r.players.values()].map(p=>p.role);
 assert.equal(roles.filter(x=>x==='ASSASSINO').length,1);assert.equal(roles.filter(x=>x==='DETETIVE').length,1);
 assert.equal(r.startGame(),false);assert.deepEqual([...r.players.values()].map(p=>p.role),roles);
});
test('movement rejects wrong phase, invalid coordinates, teleporting and walls',t=>{
 const r=setup(t);const p=r.players.get('p0')!;p.x=200;p.y=160;
 r.movePlayer(p.id,210,160);assert.equal(p.x,200);
 r.phase='NIGHT_KILLER';r.movePlayer(p.id,NaN,160);assert.equal(p.x,200);
 r.movePlayer(p.id,700,160);assert.equal(p.x,200);
 r.movePlayer(p.id,210,160);assert.equal(p.x,210);
 t.mock.timers.tick(200);r.movePlayer(p.id,260,160);assert.equal(p.x,210);
 p.isAlive=false;r.movePlayer(p.id,205,160);assert.equal(p.x,210);
});
test('night public data never shows positions on TV or distant players on phones',t=>{
 const r=setup(t);r.startGame();r.startNightKillerPhase();
 const host=r.getPublicState();assert.ok(host.players.every(p=>p.x===undefined&&p.y===undefined));
 assert.ok(host.players.every(p=>!('role' in p)));assert.equal(host.detectiveAccusation,undefined);
 const viewer=r.players.get('p0')!;viewer.x=100;viewer.y=100;
 const far=r.players.get('p1')!;far.x=700;far.y=400;
 const phone=r.getPublicState(viewer.id);assert.equal(phone.players.find(p=>p.id===far.id)?.x,undefined);
 assert.equal(phone.players.find(p=>p.id===viewer.id)?.x,100);
});
test('attacks require proximity, only once per night; detective can be a victim',t=>{
 const r=setup(t);r.startGame();r.startNightKillerPhase();
 const k=r.players.get(r.killerPlayerId!)!,d=r.players.get(r.detectivePlayerId!)!;
 k.x=100;k.y=100;d.x=700;d.y=400;
 assert.ok(!r.setNightKill(k.id,d.id));
 d.x=140;d.y=100;assert.equal(r.setNightKill(k.id,d.id),true);
 assert.equal(r.winner,null);assert.equal(r.getPrivateData(d.id)?.isNightVictim,true);
 assert.equal(r.getPublicState().lastStabLocation,undefined);
 assert.ok(!r.setNightKill(k.id,[...r.players.keys()].find(id=>id!==k.id&&id!==d.id)!));
 r.revealCrimeScene();assert.equal(d.isAlive,false);assert.equal(r.phase,'CRIME_SCENE');
});
test('private investigation survives refresh, is limited and never broadcasts the answer',t=>{
 const r=setup(t);r.startGame();r.startNightKillerPhase();
 const d=r.detectivePlayerId!,k=r.killerPlayerId!;
 r.useDetectiveAbility(d,k);assert.equal(r.getPrivateData(d)?.detectiveInvestigationResult?.isKiller,true);
 assert.equal(r.getPublicState().detectiveAccusation,undefined);
 const other=[...r.players.keys()].find(id=>id!==d&&id!==k)!;
 r.useDetectiveAbility(d,other);assert.equal(r.getPrivateData(d)?.detectiveInvestigationResult?.isKiller,true);
 assert.equal(r.getPrivateData(other)?.detectiveInvestigationResult,undefined);
});
test('all living roles vote; only confirmed votes count; votes are not revealed early',t=>{
 const r=setup(t);r.startGame();r.startVotingPhase();const ids=[...r.players.keys()];
 r.confirmVote(ids[0]);assert.equal(r.activeVotesCount,0);
 for(let i=0;i<ids.length;i++){r.submitVote(ids[i],ids[(i+1)%ids.length]);r.confirmVote(ids[i]);}
 assert.equal(r.activeVotesCount,5);assert.equal(r.getPublicState().revealedVotes.length,0);
 r.confirmVote(ids[0]);assert.equal(r.activeVotesCount,5);
 t.mock.timers.tick(1000);assert.equal(r.phase,'VOTE_REVEAL');
 const votes=r.revealedVotes.length;r.tallyVotesAndReveal();assert.equal(r.revealedVotes.length,votes);
 for(let i=0;i<5;i++)t.mock.timers.tick(2500);t.mock.timers.tick(3000);assert.equal(r.phase,'VERDICT');assert.equal(r.eliminatedPlayer,null);
});
test('an unconfirmed vote is excluded from tally',t=>{
 const r=setup(t);r.startGame();r.startVotingPhase();r.submitVote('p0','p1');r.tallyVotesAndReveal();assert.equal(r.revealedVotes.length,0);
});
test('3-player game still gives survivors a chance to debate and vote',t=>{
 const r=setup(t,3);r.startGame();r.startNightKillerPhase();
 const k=r.players.get(r.killerPlayerId!)!,v=[...r.players.values()].find(p=>p.id!==k.id)!;k.x=100;k.y=100;v.x=130;v.y=100;
 r.setNightKill(k.id,v.id);r.revealCrimeScene();assert.equal(r.phase,'CRIME_SCENE');
 t.mock.timers.tick(12000);assert.equal(r.phase,'ROUND_QUESTION');
});
test('restart cancels delayed transitions and clears private round state',t=>{
 const r=setup(t);r.startGame();r.startVotingPhase();r.submitVote('p0','p1',true);r.tallyVotesAndReveal();
 r.restartGame();t.mock.timers.tick(90000);assert.equal(r.phase,'LOBBY');assert.equal(r.round,0);assert.equal(r.nightVictimId,null);
 assert.ok([...r.players.values()].every(p=>p.role===undefined));assert.deepEqual(r.revealedVotes,[]);
});
test('a recorded alibi goes through reveal and discussion',t=>{
 const r=setup(t);r.startGame();r.startQuestionPhase();
 for(const p of r.players.values())r.submitAnswer(p.id,'Eu estava na biblioteca.');
 t.mock.timers.tick(1000);assert.equal(r.phase,'ROUND_REVEAL');assert.equal(r.getPublicState().answers?.length,5);
 t.mock.timers.tick(6500);assert.equal(r.phase,'DISCUSSION');
 r.useKillerSabotage(r.killerPlayerId!,'FALSE_CLUE');assert.equal(r.currentEvent?.id,'sabotage_rumor');assert.equal(r.players.get(r.killerPlayerId!)?.hasUsedAbility,true);
});
