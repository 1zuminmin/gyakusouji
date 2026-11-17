import './style.css';
import { CONFIG } from './config.js';
import { Game, Flick } from './engine.js';
import { World } from './world.js';
import { Audio } from './audio.js';
const $=id=>document.getElementById(id);
const game=new Game(),flick=new Flick(),audio=new Audio();
let world,best=0,pausedAt=null,crashShown=false,feedbackUntil=0;
try{best=Number(localStorage.getItem(CONFIG.bestStorageKey))||0;}catch{}
$('intro-best').textContent=best.toLocaleString('ja-JP');
try{world=new World($('scene'));}catch(e){$('error').hidden=false;console.error(e);}
function start(){
  audio.start().catch(()=>{$('sound').textContent='音 OFF';});
  game.start(performance.now());crashShown=false;pausedAt=null;flick.clear();
  $('intro').hidden=true;$('result').hidden=true;$('paused').hidden=true;$('hud').hidden=false;$('pause').hidden=false;$('footer').hidden=true;$('touch-hint').hidden=false;
  $('danger').className='';$('danger').style.opacity=0;document.body.classList.add('playing');$('feedback').className='';$('grade-frame').className='';
  $('best-hud').textContent=`BEST ${best.toLocaleString('ja-JP')} m`;
}
$('start').onclick=start;$('retry').onclick=start;
$('sound').onclick=()=>{const enabled=audio.toggle();$('sound').textContent=`音 ${enabled?'ON':'OFF'}`;$('sound').setAttribute('aria-pressed',String(enabled));if(enabled)audio.start().catch(()=>{});};
function pause(){if(game.mode!=='playing'||pausedAt!==null)return;pausedAt=performance.now();$('paused').hidden=false;flick.clear();audio.update(0,false);}
function resume(){if(pausedAt===null)return;game.shiftTime(performance.now()-pausedAt);pausedAt=null;$('paused').hidden=true;flick.clear();audio.start().catch(()=>{});}
$('pause').onclick=pause;$('resume').onclick=resume;
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause();});window.addEventListener('blur',pause);
function dodge(direction){
  if(pausedAt!==null)return;
  const grade=game.dodge(direction,performance.now());if(!grade)return;
  const now=performance.now();feedbackUntil=now+850;
  $('touch-hint').hidden=true;$('danger').style.opacity=0;$('warning').hidden=true;
  const f=$('feedback');f.querySelector('strong').textContent=grade.name;f.querySelector('span').textContent=`+${grade.bonus} m`;f.style.color=grade.color;
  f.className='';void f.offsetWidth;f.className='show';
  const frame=$('grade-frame');frame.className='';void frame.offsetWidth;frame.style.setProperty('--grade',grade.color);frame.className=`flash${grade.name==='PERFECT'?' rainbow':''}`;
  audio.success(3-CONFIG.grades.indexOf(grade));
  // Apply the first visible displacement within the input event, before pointerup.
  world?.render(game,now+1);
}
const app=$('app');
app.addEventListener('pointerdown',e=>{if(e.target.closest('button,a')||game.mode!=='playing'||pausedAt!==null)return;flick.begin(e.pointerId,e.clientX,e.clientY);app.setPointerCapture(e.pointerId);});
app.addEventListener('pointermove',e=>{const direction=flick.move(e.pointerId,e.clientX,e.clientY);if(direction)dodge(direction);});
app.addEventListener('pointerup',e=>flick.clear(e.pointerId));app.addEventListener('pointercancel',e=>flick.clear(e.pointerId));
window.addEventListener('keydown',e=>{if(e.code==='Escape'){if(pausedAt!==null)resume();else pause();}if(['ArrowLeft','ArrowRight'].includes(e.code)){e.preventDefault();if(!e.repeat)dodge(e.code==='ArrowLeft'?-1:1);}});
function results(){
  game.mode='result';const record=game.score>best;best=Math.max(best,game.score);try{localStorage.setItem(CONFIG.bestStorageKey,String(best));}catch{}
  for(const [id,value] of [['result-distance',game.score],['result-best',best],['result-base',Math.floor(game.distance)],['result-bonus',game.bonus],['result-count',game.dodged]])$(id).textContent=value.toLocaleString('ja-JP')+(id==='result-count'?' 台':id==='result-distance'?'':' m');
  $('new-best').hidden=!record;$('result').hidden=false;$('pause').hidden=true;$('hud').hidden=true;$('retry').focus();
}
function frame(now){
  requestAnimationFrame(frame);if(!world)return;
  if(pausedAt!==null)return;
  game.tick(now);
  let urgency=0;
  if(game.mode==='playing') {
    $('distance').textContent=game.score.toLocaleString('ja-JP');$('count').textContent=`${game.dodged} 台回避`;
    if(game.car&&!game.car.evaded)urgency=Math.max(0,1-(game.car.deadline-now)/1200);
    $('danger').style.opacity=urgency*.78;
    $('warning').hidden=!(urgency>.25);audio.update(urgency,true);
  } else if(game.mode==='crashed') {
    if(!crashShown){crashShown=true;audio.crash();$('warning').hidden=true;$('touch-hint').hidden=true;$('danger').className='crash';$('grade-frame').className='';}
    const elapsed=now-game.crashAt;$('danger').style.opacity=elapsed<90?.74:elapsed<CONFIG.crashCloseupMs?.35:.30;
    if(elapsed>=CONFIG.crashCloseupMs+CONFIG.crashExteriorMs)results();
  } else audio.update(0,false);
  if(now>feedbackUntil)$('grade-frame').className='';
  world.render(game,now,game.mode==='intro');
}
requestAnimationFrame(frame);
