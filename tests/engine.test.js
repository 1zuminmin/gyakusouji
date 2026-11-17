import test from 'node:test';
import assert from 'node:assert/strict';
import { Game, Flick, gradeFor } from '../src/engine.js';
import { CONFIG } from '../src/config.js';
function spawned(){const g=new Game(CONFIG,()=>0);g.start(0);g.tick(CONFIG.firstSpawnMs);return g;}
test('grade boundaries use remaining milliseconds, including exact deadline',()=>{
 for(const [ms,name] of [[401,'OK'],[400,'GOOD'],[221,'GOOD'],[220,'GREAT'],[101,'GREAT'],[100,'GREAT'],[50,'GREAT'],[10.001,'GREAT'],[10,'CRITICAL'],[1,'CRITICAL'],[.001,'CRITICAL'],[0,null],[-1,null]])assert.equal(gradeFor(ms)?.name??null,name);
});
test('both directions evade immediately; each vehicle awards exactly once',()=>{
 for(const dir of [-1,1])for(const [ms,name,bonus] of [[500,'OK',0],[300,'GOOD',50],[150,'GREAT',150],[.5,'CRITICAL',1000]]){
  const g=spawned(),t=g.car.deadline-ms;assert.equal(g.dodge(dir,t).name,name);assert.equal(g.bonus,bonus);assert.equal(g.dodged,1);assert.equal(g.dodge(-dir,t+1),null);assert.equal(g.bonus,bonus);assert.equal(g.dodged,1);assert.ok(g.offset(t+1)*dir>0);
  const deadline=g.car.deadline;g.tick(deadline+CONFIG.passMs);assert.equal(g.car,null);g.tick(deadline+CONFIG.passMs+CONFIG.returnMs);assert.ok(Math.abs(g.offset(g.lastTime))===0);assert.equal(g.mode,'playing');assert.ok(g.nextSpawn>=g.lastTime+CONFIG.spawnGapMinMs);
 }
});
test('accepted input survives a late render even when animation is unfinished',()=>{
 const g=spawned(),t=g.car.deadline-1;assert.equal(g.dodge(1,t).name,'CRITICAL');g.tick(t+200);assert.equal(g.mode,'playing');assert.equal(g.bonus,1000);
});
test('late input crashes; distance stops at scheduled collision despite dropped frames',()=>{
 const g=spawned(),deadline=g.car.deadline;assert.equal(g.dodge(-1,deadline+500),null);assert.equal(g.mode,'crashed');assert.equal(g.distance,deadline*CONFIG.driveSpeed/1000);g.start(10000);assert.equal(g.score,0);assert.equal(g.mode,'playing');
});
test('empty-road input is discarded; bonus does not increase difficulty',()=>{
 const a=spawned(),b=spawned();b.bonus=99999;for(const g of [a,b]){g.dodge(1,g.car.deadline-200);g.tick(g.car.deadline+CONFIG.passMs+CONFIG.returnMs);assert.equal(g.dodge(-1,g.lastTime+1),null);g.tick(g.nextSpawn);assert.equal(g.car.evaded,false);assert.equal(g.direction,0);}assert.equal(a.car.speed,b.car.speed);
});
test('flick commits at pointermove, once, supports both directions and ignores vertical gestures',()=>{
 for(const direction of [-1,1]){const f=new Flick();f.begin(1,100,100);assert.equal(f.move(2,200,100),0);assert.equal(f.move(1,110,100),0);assert.equal(f.move(1,100+direction*27,102),direction);assert.equal(f.used,true);assert.equal(f.move(1,100-direction*50,100),0);f.clear(1);assert.equal(f.id,null);}
 const f=new Flick();f.begin(1,0,0);assert.equal(f.move(1,30,80),0);
});
test('pause shifts encounter schedule without consuming reaction time',()=>{const g=spawned(),remaining=g.car.deadline-g.lastTime;g.shiftTime(5000);assert.equal(g.car.deadline-g.lastTime,remaining);g.tick(g.lastTime+10);assert.equal(g.mode,'playing');});
test('EARLY boundary, single penalty, signed distance and safe passage in both directions',()=>{
 assert.equal(gradeFor(800).name,'OK');assert.equal(gradeFor(800.001).name,'EARLY');
 for(const dir of [-1,1]){const g=spawned(),deadline=g.car.deadline;const distance=g.distance;
  assert.equal(g.dodge(dir,deadline-801).name,'EARLY');assert.equal(g.penalty,200);assert.equal(g.bonus,0);assert.equal(g.score,Math.floor(g.distance-200));assert.ok(g.score<0);
  assert.equal(g.dodge(-dir,deadline-800),null);assert.equal(g.penalty,200);assert.equal(g.dodged,1);
  g.tick(deadline+CONFIG.passMs+CONFIG.returnMs);assert.equal(g.mode,'playing');assert.equal(Math.abs(g.offset(g.lastTime)),0);
  assert.equal(g.dodge(dir,g.lastTime),null);assert.equal(g.penalty,200);
  g.start(10000);assert.equal(g.penalty,0);assert.equal(g.score,0);
 }
});
test('penalty does not change approach speed or overwrite earned bonuses',()=>{
 const a=spawned(),b=spawned();b.penalty=2000;b.bonus=50;
 for(const g of [a,b]){g.dodge(1,g.car.deadline-801);g.tick(g.car.deadline+CONFIG.passMs+CONFIG.returnMs);g.tick(g.nextSpawn);}
 assert.equal(a.car.speed,b.car.speed);assert.equal(b.bonus,50);assert.equal(b.penalty,2200);
});
test('secret arrival uses positive displayed distance and ends once at the threshold',()=>{
 const g=spawned();const t=g.car.deadline-900;
 const currentDistance=g.distance+(t-g.lastTime)*CONFIG.driveSpeed/1000;
 g.penalty=currentDistance+9800;
 g.dodge(1,t);
 assert.equal(g.score,-10000);assert.equal(g.mode,'arrived');assert.equal(g.lastDodgeRemainingMs,900);
 const score=g.score,penalty=g.penalty;g.tick(t+10000);assert.equal(g.score,score);assert.equal(g.dodge(-1,t+10000),null);assert.equal(g.penalty,penalty);
 g.start(t+12000);assert.equal(g.mode,'playing');assert.equal(g.arrivalAt,null);assert.equal(g.lastDodgeRemainingMs,null);assert.equal(g.score,0);
});
test('secret arrival does not trigger below threshold or for negative displayed distance',()=>{
 for(const penalty of [0,9000]){const g=spawned();g.penalty=penalty;g.dodge(1,g.car.deadline-900);assert.equal(g.mode,'playing');}
 const g=spawned();g.bonus=10000;g.dodge(1,g.car.deadline-900);assert.equal(g.mode,'playing');
});
