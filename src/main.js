import { Game } from './SideRunner.js'; import { addScore,loadRanking,clearRanking,exportRanking } from './ranking.js';
const $=s=>document.querySelector(s),shell=$('.game-shell'),game=new Game($('#game'));let player='',phone='';
window.__coffeeGame=game;
if('serviceWorker'in navigator&&location.protocol!=='file:')addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
const phoneInput=$('#playerPhone');
phoneInput.addEventListener('input',()=>{
 const digits=phoneInput.value.replace(/\D/g,'').slice(0,11);
 phoneInput.value=digits.length>10
  ?digits.replace(/(\d{2})(\d{5})(\d{0,4})/,'($1) $2-$3')
  :digits.replace(/(\d{2})(\d{4})(\d{0,4})/,'($1) $2-$3').replace(/-$/,'');
});
let soundOn=true,audio;
function tone(freq=440,duration=.08,type='sine',volume=.035){
 if(!soundOn)return;
 audio??=new AudioContext();
 const oscillator=audio.createOscillator(),gain=audio.createGain(),now=audio.currentTime;
 oscillator.type=type;oscillator.frequency.setValueAtTime(freq,now);
 gain.gain.setValueAtTime(volume,now);gain.gain.exponentialRampToValueAtTime(.0001,now+duration);
 oscillator.connect(gain).connect(audio.destination);oscillator.start(now);oscillator.stop(now+duration);
}
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let musicTimer,musicStep=0;
const melody=[
 659,null,831,988,740,null,659,740,831,null,988,1109,988,831,740,null,
 659,740,831,null,740,659,554,null,659,831,988,831,740,659,null,554,
 740,null,831,988,1109,988,831,null,740,831,988,null,831,740,659,null,
 554,659,740,831,740,659,554,null,659,null,831,740,659,554,494,null
];
const bass=[82,62,69,55,82,73,62,55];
const harmony=[[330,415,494],[247,311,370],[277,330,415],[220,277,330]];
function startMusic(){
  stopMusic();musicStep=0;
  musicTimer=setInterval(()=>{
  const step=musicStep%64,beat=step%16,bar=Math.floor(step/16),note=melody[step];
  if(note)tone(note,beat===0?.13:.072,beat%4===0?'square':'triangle',beat%4===0?.018:.012);
  if(beat%4===0||beat===10)tone(bass[Math.floor(step/8)%bass.length],beat===10?.1:.17,'sawtooth',.017);
  if([3,6,11,14].includes(beat)){const chord=harmony[bar%4];for(const frequency of chord)tone(frequency,.055,'triangle',.0045);}
  if(beat===0||beat===7||beat===10)tone(beat===0?67:82,.05,'sine',.04);
  if(beat===4||beat===12)tone(185,.045,'square',.012);
  if(step%2===0)tone(step%4===0?2100:1700,.018,'square',.003);
  musicStep++;
 },89);
 }
function stopMusic(){if(musicTimer){clearInterval(musicTimer);musicTimer=0;}}
function input(action){if(action==='left')game.move(-1);if(action==='right')game.move(1);if(action==='jump'){game.jump();tone(310,.08,'triangle');}}
addEventListener('keydown',e=>{
 if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;
 const down=e.code==='KeyS'||e.key==='ArrowDown';
 if(down){e.preventDefault();game.setSlide(true);}
 if(e.code==='KeyD'||e.key==='ArrowRight')input('right');
 if(e.code==='KeyW'||e.key==='ArrowUp'||e.code==='Space'){e.preventDefault();input('jump');}
});
addEventListener('keyup',e=>{if(e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;if(e.code==='KeyS'||e.key==='ArrowDown'){e.preventDefault();game.setSlide(false);}});
addEventListener('blur',()=>game.setSlide(false));
document.querySelectorAll('[data-action]').forEach(b=>{if(b.dataset.action==='left'){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture?.(e.pointerId);game.setSlide(true);});for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>game.setSlide(false));}else b.addEventListener('pointerdown',()=>input(b.dataset.action));});
let sx=0,sy=0;game.canvas.addEventListener('pointerdown',e=>{sx=e.clientX;sy=e.clientY;});game.canvas.addEventListener('pointerup',e=>{const dy=e.clientY-sy;if(dy>35)input('left');else input('jump');});
let padJump=false,padSlide=false,activePad='';
function systemToast(text){const t=$('#toast');t.textContent=text;t.style.background='#174733ee';t.classList.remove('show');void t.offsetWidth;t.classList.add('show');}
addEventListener('gamepadconnected',e=>{activePad=e.gamepad.id;document.body.classList.add('gamepad-ready');systemToast('CONTROLE CONECTADO');});
addEventListener('gamepaddisconnected',e=>{if(activePad===e.gamepad.id){activePad='';game.setSlide(false);document.body.classList.remove('gamepad-ready');}});
function pollGamepad(){const pads=navigator.getGamepads?.()||[],pad=[...pads].find(Boolean);if(pad){activePad=pad.id;document.body.classList.add('gamepad-ready');const b=i=>!!pad.buttons[i]?.pressed,vertical=pad.axes[1]||0,jump=b(0)||b(12)||vertical<-.62,slide=b(1)||b(13)||vertical>.56;if(jump&&!padJump)game.jump();if(slide!==padSlide)game.setSlide(slide);padJump=jump;padSlide=slide;}requestAnimationFrame(pollGamepad);}requestAnimationFrame(pollGamepad);
game.addEventListener('hud',e=>{$('#score').textContent=Math.round(e.detail.score).toLocaleString('pt-BR');$('#combo').textContent=`x${1+Math.min(4,Math.floor(e.detail.combo/5))}${e.detail.shield?' 🛡':''}`;$('#time').textContent=Math.ceil(e.detail.time);});
game.addEventListener('feedback',e=>{const t=$('#toast');t.textContent=e.detail.text;t.style.background=e.detail.good?'#176343ee':'#9e2f25ee';t.classList.remove('show');void t.offsetWidth;t.classList.add('show');tone(e.detail.good?720:120,e.detail.good?.1:.3,e.detail.good?'sine':'sawtooth',e.detail.good?.035:.05);});
game.addEventListener('rush',()=>{shell.classList.remove('final-rush');void shell.offsetWidth;shell.classList.add('final-rush');setTimeout(()=>shell.classList.remove('final-rush'),1100);});
game.addEventListener('end',e=>{stopMusic();shell.classList.remove('playing','final-rush');$('#hud').hidden=true;$('#mobileControls').hidden=true;$('#finalScore').textContent=Math.round(e.detail.score).toLocaleString('pt-BR');$('#resultTitle').textContent=e.detail.score>3500?'Colheita incrível!':e.detail.score>1800?'Boa colheita!':'Continue treinando!';$('#matchStats').innerHTML=`<div><strong>${e.detail.collected}</strong><small>maduros</small></div><div><strong>${e.detail.accuracy}%</strong><small>precisão</small></div><div><strong>${e.detail.maxCombo}</strong><small>maior combo</small></div>`;render(addScore(player,phone,Math.round(e.detail.score)),e.detail.score);tone(180,.45,'triangle',.045);$('#endScreen').classList.add('active');});
async function begin(){
 padJump=false;padSlide=false;document.activeElement?.blur();audio?.resume();
 $('#startScreen').classList.remove('active');$('#endScreen').classList.remove('active');
 const counter=$('#countdown');counter.hidden=false;
 for(const value of ['3','2','1','JÁ!']){
  counter.textContent=value;counter.style.animation='none';void counter.offsetWidth;counter.style.animation='';
  tone(value==='JÁ!'?760:440,value==='JÁ!'?.18:.08,'square',.035);await delay(value==='JÁ!'?520:680);
 }
 counter.hidden=true;game.start();startMusic();shell.classList.add('playing');$('#hud').hidden=false;$('#mobileControls').hidden=false;
}
function enterMobileGameMode(){
 const isMobile=matchMedia('(pointer:coarse)').matches||innerWidth<=900;
 if(!isMobile)return;
 document.activeElement?.blur();
 const fullscreenTarget=document.documentElement;
 const fullscreenPromise=document.fullscreenElement
  ?Promise.resolve()
  :(fullscreenTarget.requestFullscreen?.({navigationUI:'hide'})||fullscreenTarget.webkitRequestFullscreen?.()||Promise.resolve());
 Promise.resolve(fullscreenPromise)
  .then(()=>screen.orientation?.lock?.('landscape'))
  .catch(()=>{});
}
function render(ranking,score){$('#ranking').replaceChildren(...ranking.slice(0,5).map((entry,i)=>{const li=document.createElement('li');if(entry.name===player&&entry.score===Math.round(score))li.className='current';li.innerHTML=`<span>${i+1}º</span><span></span><span>${entry.score.toLocaleString('pt-BR')} pts</span>`;li.children[1].textContent=entry.name;return li;}));}
$('#startForm').addEventListener('submit',async e=>{
 e.preventDefault();
 const button=e.submitter||$('#startForm button[type="submit"]');
 player=$('#playerName').value.trim();
 phone=$('#playerPhone').value.trim();
 const digits=phone.replace(/\D/g,'');
 if(!player||digits.length<10){systemToast('PREENCHA NOME E TELEFONE COM DDD');return;}
 enterMobileGameMode();
 button.disabled=true;button.textContent='SALVANDO...';
 try{
  const response=await fetch('/api/participantes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome:player,telefone:phone})});
  if(!response.ok)throw new Error();
  begin();
 }catch{
  const offline=JSON.parse(localStorage.getItem('rotaCafeParticipantesOffline')||'[]');
  offline.push({nome:player,telefone:phone,data:new Date().toISOString()});
  localStorage.setItem('rotaCafeParticipantesOffline',JSON.stringify(offline));
  systemToast('CADASTRO SALVO NESTE APARELHO');
  begin();
 }finally{
  button.disabled=false;button.innerHTML='JOGAR <span>›</span>';
 }
});
function nextParticipant(){
 stopMusic();shell.classList.remove('playing');$('#endScreen').classList.remove('active');$('#startScreen').classList.add('active');
 player='';phone='';$('#playerName').value='';$('#playerPhone').value='';$('#privacyConsent').checked=false;$('#playerName').focus();
}
function renderAdmin(){
 const ranking=loadRanking();$('#adminSummary').textContent=`${ranking.length} resultado(s) salvo(s) neste computador.`;
 $('#adminList').replaceChildren(...ranking.map((entry,i)=>{
  const row=document.createElement('div');row.className='admin-row';
  for(const value of [`#${i+1}`,entry.name,entry.phone||'Sem telefone',`${entry.score.toLocaleString('pt-BR')} pts`]){
   const cell=document.createElement(value===entry.name||String(value).endsWith('pts')?'strong':'span');cell.textContent=value;row.append(cell);
  }
  return row;
 }));
}
$('#playAgain').addEventListener('click',nextParticipant);
$('#changePlayer').addEventListener('click',nextParticipant);
$('#soundButton').addEventListener('click',()=>{
 soundOn=!soundOn;$('#soundButton').textContent=soundOn?'♪':'×';$('#soundButton').setAttribute('aria-label',soundOn?'Desativar som':'Ativar som');if(soundOn)tone(520,.1);
});
$('#fullscreenButton').addEventListener('click',async()=>{
 try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen();}catch{systemToast('TELA CHEIA NÃO DISPONÍVEL');}
});
$('#adminButton').addEventListener('click',()=>{
 if(prompt('Digite a senha do painel:')!=='2468'){systemToast('SENHA INCORRETA');return;}
 renderAdmin();$('#adminPanel').hidden=false;
});
$('#adminClose').addEventListener('click',()=>$('#adminPanel').hidden=true);
$('#clearRanking').addEventListener('click',()=>{
 if(!confirm('Tem certeza que deseja zerar o ranking deste computador?'))return;
 clearRanking();renderAdmin();systemToast('RANKING ZERADO');
});
$('#exportRanking').addEventListener('click',()=>{
 const blob=new Blob(['\ufeff'+exportRanking()],{type:'text/csv;charset=utf-8'});
 const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`ranking-rota-do-cafe-${new Date().toISOString().slice(0,10)}.csv`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);
});
