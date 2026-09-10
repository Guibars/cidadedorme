import { MANSION_ROOM_BOUNDS, clampMansionPosition } from './mansion';
export type Point = { x: number; y: number };
const CELL = 10;
const doors: Record<string, Point[]> = {
  bedroom: [{ x: 235, y: 110 }], kitchen: [{ x: 565, y: 110 }],
  living: [{ x: 285, y: 205 }, { x: 520, y: 205 }],
  library: [{ x: 235, y: 380 }], garden: [{ x: 565, y: 380 }],
  basement: [{ x: 400, y: 350 }],
};
export function isWalkable(x: number, y: number) {
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 40 || x > 760 || y < 40 || y > 460) return false;
  for (const room of Object.values(MANSION_ROOM_BOUNDS)) {
    const withinX = x >= room.x - 6 && x <= room.x + room.w + 6;
    const withinY = y >= room.y - 6 && y <= room.y + room.h + 6;
    const wall = withinX && withinY && (Math.abs(x-room.x)<7 || Math.abs(x-room.x-room.w)<7 || Math.abs(y-room.y)<7 || Math.abs(y-room.y-room.h)<7);
    if (wall && !doors[room.id].some(d => Math.hypot(d.x-x, d.y-y) < 24)) return false;
  }
  return true;
}
export function canWalkSegment(from: Point, to: Point) {
  const steps = Math.max(1, Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)/3));
  for(let i=1;i<=steps;i++) if(!isWalkable(from.x+(to.x-from.x)*i/steps,from.y+(to.y-from.y)*i/steps)) return false;
  return true;
}
export function findMansionPath(from: Point, rawTarget: Point): Point[] {
  const target = clampMansionPosition(rawTarget.x, rawTarget.y);
  if (canWalkSegment(from, target)) return [target];
  const key = (p: Point) => `${p.x},${p.y}`;
  const start = { x: Math.round(from.x/CELL)*CELL, y: Math.round(from.y/CELL)*CELL };
  if (!canWalkSegment(from,start)) return [];
  const queue = [start];
  const prev = new Map<string, Point | null>([[key(start), null]]);
  let nearest = start;
  let best = Infinity;
  for (let head=0;head<queue.length;head++) {
    const p = queue[head];
    const distance = Math.hypot(p.x-target.x,p.y-target.y);
    if (distance < best) { best=distance; nearest=p; }
    if (distance<=CELL && canWalkSegment(p,target)) { nearest=p; break; }
    for(const [dx,dy] of [[CELL,0],[-CELL,0],[0,CELL],[0,-CELL]]) {
      const next = {x:p.x+dx,y:p.y+dy};
      if(!prev.has(key(next)) && canWalkSegment(p,next)) { prev.set(key(next),p); queue.push(next); }
    }
  }
  const result: Point[]=[];
  let p: Point | null = nearest;
  while(p) { result.unshift(p); p=prev.get(key(p)) ?? null; }
  if (canWalkSegment(nearest,target)) result.push(target);
  return result;
}
export function stepTowards(from: Point, to: Point, distance: number): Point {
  const length=Math.hypot(to.x-from.x,to.y-from.y);
  if(length<=distance) return to;
  return {x:from.x+(to.x-from.x)/length*distance,y:from.y+(to.y-from.y)/length*distance};
}
