import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
const base = process.env.TEST_ORIGIN || 'http://localhost:3000';
const request = async (path, token, body) => {
 const res=await fetch(base+path,{method:body?'POST':'GET',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token||''}`},body:body?JSON.stringify(body):undefined});
 return {status:res.status,data:await res.json()};
};
const connect = async (roomCode, token, playerId='') => {
 const ws=new WebSocket(base.replace('http','ws')+'/ws');const messages=[];
 ws.on('message',data=>messages.push(JSON.parse(String(data))));
 await new Promise((resolve,reject)=>{ws.on('open',resolve);ws.on('error',reject);});
 ws.send(JSON.stringify({type:'ATTACH_SESSION',roomCode,token,playerId}));
 const wait=async predicate=>{for(let i=0;i<100;i++){const result=messages.find(predicate);if(result)return result;await new Promise(r=>setTimeout(r,50));}throw new Error('Timed out waiting for server message');};
 await wait(m=>m.type==='SESSION_READY');
 return {ws,messages,wait,send:(action,payload={})=>ws.send(JSON.stringify({type:'ACTION',action,payload}))};
};
const sockets=[];
try{
 const {data:created}=await request('/api/rooms',null,{});const code=created.roomCode,hostToken=created.hostToken;
 assert.equal(created.state.players.length,0);
 const players=[];
 for(let i=0;i<5;i++){const r=await request(`/api/rooms/${code}/join`,null,{name:`Teste ${i}`,avatarId:'avatar-fox'});assert.equal(r.status,200);players.push(r.data);}
 assert.equal((await request(`/api/rooms/${code}/join`,null,{name:'Extra'})).status,400);
 const h=await connect(code,hostToken);sockets.push(h.ws);
 const clients=[];for(const p of players){const c=await connect(code,p.playerToken,p.playerId);clients.push(c);sockets.push(c.ws);}
 assert.equal((await request(`/api/rooms/${code}/private?playerId=${players[0].playerId}`)).status,403);
 assert.equal((await request(`/api/rooms/${code}/action`,players[0].playerToken,{action:'RESTART_GAME',playerId:players[0].playerId})).status,400);
 clients[0].send('START_GAME');await clients[0].wait(m=>m.type==='JOIN_ERROR');
 h.send('START_GAME');await h.wait(m=>m.type==='STATE_UPDATE'&&m.state.phase==='INTRO');
 await h.wait(m=>m.type==='STATE_UPDATE'&&m.state.phase==='ROLE_REVEAL');
 const initial=await request(`/api/rooms/${code}/state`);assert.equal(initial.data.state.players.length,5);assert.ok(initial.data.state.players.every(p=>p.role===undefined));
 h.ws.close();const reconnect=await connect(code,hostToken);sockets.push(reconnect.ws);await reconnect.wait(m=>m.type==='STATE_UPDATE'&&m.state.roomCode===code);
 reconnect.send('ADVANCE_PHASE');await clients[0].wait(m=>m.type==='STATE_UPDATE'&&m.state.phase==='NIGHT_KILLER');
 const hostNight=(await request(`/api/rooms/${code}/state`)).data.state;assert.ok(hostNight.players.every(p=>p.x===undefined));
 const data=(await request(`/api/rooms/${code}/private?playerId=${players[0].playerId}`,players[0].playerToken)).data.data;
 assert.ok(data.player.role);
 const move=await request(`/api/rooms/${code}/action`,players[0].playerToken,{action:'MOVE_PLAYER',playerId:players[0].playerId,x:data.player.x+5,y:data.player.y});assert.equal(move.status,200);assert.equal(move.data.privateData.player.x,data.player.x+5);
 // A stale socket closing must not disconnect its replacement.
 const replacement=await connect(code,players[1].playerToken,players[1].playerId);sockets.push(replacement.ws);clients[1].ws.close();
 await new Promise(r=>setTimeout(r,100));assert.equal((await request(`/api/rooms/${code}/state`)).data.state.players.find(p=>p.id===players[1].playerId).connected,true);
 reconnect.send('RESTART_GAME');await reconnect.wait(m=>m.type==='STATE_UPDATE'&&m.state.phase==='LOBBY');
 const final=(await request(`/api/rooms/${code}/state`)).data.state;assert.equal(final.roomCode,code);assert.equal(final.players.length,5);assert.equal(final.phase,'LOBBY');
 console.log('PASS: five clients, full-room join, secret roles, host permissions, host/player reconnection, HTTP movement fallback and restart.');
}finally{for(const ws of sockets)ws.close();}
