const W=480,H=270,G=220,DURATION=30,START_SPEED=148,SPEED_GAIN=3.6,C={sky:'#79cde7',mist:'#dff3e7',hill:'#71a865',hill2:'#4f914f',grass:'#72ad47',leaf:'#246340',leaf2:'#347d4b',soil:'#d18447',cream:'#ffe1a0',yellow:'#efbc3e',red:'#d84937',green:'#205a42',skin:'#bd7950',brown:'#704128',gray:'#737a72',dark:'#183c2c'};
const rnd=(a,b)=>a+Math.random()*(b-a);
export class Game extends EventTarget{
 constructor(el){super();this.container=el;this.canvas=document.createElement('canvas');this.canvas.width=W;this.canvas.height=H;el.append(this.canvas);this.g=this.canvas.getContext('2d',{alpha:false,desynchronized:true});this.renderScale=1;this.runner=new Image();this.runner.src='/assets/characters/producer-run-capricornio-v1.png';this.actions=new Image();this.actions.src='/assets/characters/producer-actions-capricornio-v1.png';this.specialActions=new Image();this.specialActions.src='/assets/characters/producer-crouch-fall-capricornio-v1.png';this.rollArt=new Image();this.rollArt.src='/assets/characters/producer-roll-capricornio-v1.png';this.itemsArt=new Image();this.itemsArt.src='/assets/items/coffee-items.png?v=3';this.farmArt=new Image();this.farmArt.src='/assets/items/farm-obstacles-v2.png?v=1';this.birdArt=new Image();this.birdArt.src='/assets/items/bird-flight-chibi-clean-v4-alpha.png?v=1';this.background=new Image();this.background.src='/assets/backgrounds/coffee-farm-chibi.png?v=4';this.mode='menu';this.t=0;this.last=performance.now();this.objects=[];this.particles=[];this.assetsReady=false;Promise.all([this.runner,this.actions,this.specialActions,this.rollArt,this.itemsArt,this.farmArt,this.birdArt,this.background].map(i=>i.decode().catch(()=>{}))).then(()=>this.assetsReady=true);addEventListener('resize',()=>this.resize());this.resize();requestAnimationFrame(n=>this.loop(n));}
 resize(){const r=this.container.getBoundingClientRect(),s=Math.max(r.width/W,r.height/H),dw=Math.ceil(W*s),dh=Math.ceil(H*s),pr=Math.max(1,Math.min(window.devicePixelRatio||1,2560/dw));Object.assign(this.canvas.style,{position:'absolute',width:`${dw}px`,height:`${dh}px`,left:'50%',top:'50%',transform:'translate(-50%,-50%)'});this.canvas.width=Math.round(dw*pr);this.canvas.height=Math.round(dh*pr);this.renderScale=this.canvas.width/W;this.g.imageSmoothingEnabled=true;this.g.imageSmoothingQuality='high';}
 emit(n,d={}){this.dispatchEvent(new CustomEvent(n,{detail:{score:this.score||0,combo:this.combo||0,time:this.time??DURATION,bonusTime:this.bonusTime||0,...d}}));}
 start(){Object.assign(this,{mode:'playing',score:0,basePoints:0,bonusPoints:0,combo:0,maxCombo:0,collected:0,mistakes:0,time:DURATION,elapsed:0,speed:START_SPEED,next:1,y:0,vy:0,land:0,slide:0,slideHold:false,inv:0,rush:false,birdScheduled:false,sackSpawned:false,sacks:0,bonusTime:0,dying:false,deathTimer:0,deathType:'',runStep:-1,objects:[],particles:[]});this.emit('hud');}
 jump(){if(this.mode!=='playing'||this.vy>0)return;this.slideHold=false;this.slide=0;this.vy=230;this.dust(94,G-this.y-3,7);}
 setSlide(active){if(this.mode!=='playing')return;this.slideHold=active;if(active&&this.y>1){this.vy=Math.min(this.vy,-310);return;}this.slide=active?1:0;}
 move(d){if(this.mode!=='playing')return;if(d<0){if(this.y>1){this.vy=Math.min(this.vy,-310);return;}this.slide=.6;return;}this.jump();}
 loop(n){const dt=Math.min(.034,(n-this.last)/1000);this.last=n;this.t+=dt;if(this.mode==='playing'){this.update(dt);this.speed*=1.18;this.next-=dt*.5;}this.draw();requestAnimationFrame(x=>this.loop(x));}
 update(dt){this.elapsed+=dt;if(this.dying){this.deathTimer+=dt;for(const o of this.objects)o.x-=this.speed*dt*.18;for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=130*dt;p.life-=dt;}this.particles=this.particles.filter(p=>p.life>0);if(this.deathTimer>(this.deathType==='fall'?1.05:.82))this.finish();return;}this.time=Math.max(0,DURATION-this.elapsed);this.speed=START_SPEED+this.elapsed*SPEED_GAIN;this.bonusTime=Math.max(0,this.bonusTime-dt);this.land=Math.max(0,this.land-dt);this.slide=this.slideHold&&this.y<2?1:Math.max(0,this.slide-dt);if(this.slide)this.rollTime+=dt;this.inv=Math.max(0,this.inv-dt);const wasY=this.y;if(this.vy||this.y){this.vy-=520*dt;const nextY=Math.max(0,this.y+this.vy*dt),playerLeft=88,playerRight=115;let landing=0;if(this.vy<=0){for(const p of this.objects){if(p.type==='platform'&&playerRight>p.x&&playerLeft<p.x+p.w&&wasY>=p.height-2&&nextY<=p.height)landing=Math.max(landing,p.height);}}this.y=landing||nextY;if(landing){this.vy=0;if(wasY>landing+2){this.land=.16;this.dust(96,G-landing-2,9);}}else if(!this.y){this.vy=0;if(wasY>0){this.land=.16;this.dust(96,G-2,12);}}}if(!this.birdScheduled&&this.elapsed>3.2&&!this.objects.some(o=>o.x>335)){this.birdScheduled=true;this.objects.push({type:'bird',x:500,y:146,w:40,h:22,good:false,points:-100});}this.next-=dt;if(this.next<=0){this.spawn();this.next=Math.max(.7,1.17-this.elapsed*.011)+Math.random()*.28;}for(const o of this.objects)o.x-=this.speed*dt;
  if(!this.y&&!this.slide){const runFps=10+Math.min(4,(this.speed-START_SPEED)/28),step=Math.floor(this.elapsed*runFps)%6;if(step!==this.runStep){this.runStep=step;if(step===1||step===4)this.dust(91,G-1,5);}}
  for(const o of this.objects){if(o.type!=='platform'&&!o.hit&&this.collides(o))this.hit(o);}this.objects=this.objects.filter(o=>o.x>-140&&(!o.hit||(this.dying&&o.type==='hole')));for(const p of this.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=130*dt;p.life-=dt;}this.particles=this.particles.filter(p=>p.life>0);if(this.time<=5&&!this.rush){this.rush=true;this.emit('rush');}this.emit('hud');if(!this.time)this.finish();}
 collides(o){
 const player=this.slide
   ?{x:88,y:G-27,w:27,h:27}
   :{x:88,y:G-this.y-65,w:27,h:65};
  const overlaps=b=>player.x<b.x+b.w&&player.x+player.w>b.x&&player.y<b.y+b.h&&player.y+player.h>b.y;
  if(o.type==='rake'){
   return overlaps({x:o.x-3,y:G-17,w:38,h:16});
  }
  const boxes={
   coffee:{x:o.x+1,y:o.y,w:17,h:21},
   green:{x:o.x-3,y:G-32,w:30,h:30},
   rock:{x:o.x-5,y:G-29,w:34,h:28},
   branch:{x:o.x-5,y:G-13,w:48,h:12},
   borer:{x:o.x-3,y:G-30,w:31,h:29},
   bird:{x:o.x,y:139,w:40,h:20},
   bees:{x:o.x,y:139,w:40,h:20},
   hole:{x:o.x+3,y:G-8,w:42,h:10},
   crate:{x:o.x,y:G-33,w:32,h:32}
   ,fence:{x:o.x-2,y:G-44,w:52,h:44}
   ,capriSack:{x:o.x+2,y:o.y+1,w:29,h:34}
  };
  const b=boxes[o.type]||{x:o.x,y:o.y,w:o.w,h:o.h};
  return overlaps(b);
 }
 spawn(){
  if(this.objects.some(o=>o.x>350))return;
  const coffee=()=>{
   const count=Math.random()<.62?3:2,arc=Math.random()<.42;
   for(let i=0;i<count;i++)this.objects.push({type:'coffee',x:500+i*30,y:arc?184-(i===1?28:12):184,w:18,h:21,good:true,points:100});
  };
  const progress=Math.min(1,this.elapsed/DURATION);
  if(!this.sackSpawned&&this.elapsed>7&&Math.random()<.16){
   this.sackSpawned=true;
   this.objects.push({type:'capriSack',x:500,y:G-38,w:33,h:38,good:true,points:0});
   return;
  }
  if(this.elapsed>2&&Math.random()<.3){
   const height=Math.random()<.5?36:46,w=118,x=500;
   this.objects.push({type:'platform',x,y:G-height,w,h:14,height,solid:true});
   for(let i=0;i<4;i++)this.objects.push({type:'coffee',x:x+12+i*29,y:G-height-52-(i===1||i===2?8:0),w:18,h:21,good:true,points:100});
   return;
  }
  const coffeeChance=.6-progress*.05;
  if(Math.random()<coffeeChance){coffee();return;}
  const easy=['rock','branch','green','borer','bird','hole','crate','rake','bees','fence'];
  const advanced=['rock','branch','green','borer','bird','hole','crate','rake','bees','fence','bird','hole','crate','rock','rake','bees','fence'];
  const pool=progress>.35?advanced:easy,type=pool[Math.floor(Math.random()*pool.length)];
  const w=type==='branch'?38:type==='bird'||type==='bees'?40:type==='hole'?48:type==='rake'?48:type==='crate'?32:type==='fence'?50:25;
  const h=type==='green'?22:type==='branch'?12:type==='bird'||type==='bees'?22:type==='hole'?9:type==='rake'?14:type==='crate'?31:type==='fence'?44:25;
  const y=type==='bird'||type==='bees'?146:G-h;
  this.objects.push({type,x:500,y,w,h,good:false,points:type==='borer'||type==='bird'||type==='bees'?-100:-70});
  if(this.elapsed>8&&Math.random()<.3&&!['bird','bees','hole','rake'].includes(type)){
   const secondPool=['rock','branch','green','crate','fence'],second=secondPool[Math.floor(Math.random()*secondPool.length)],sw=second==='branch'?38:second==='crate'?32:second==='fence'?50:25,sh=second==='branch'?12:second==='crate'?31:second==='fence'?44:25;
   this.objects.push({type:second,x:582,y:G-sh,w:sw,h:sh,good:false,points:-70});
  }
 }
 hit(o){o.hit=true;if(o.type==='capriSack'){this.sacks++;this.bonusTime=5;this.emit('feedback',{good:true,text:'SACA CAPRI — PONTOS x2 POR 5s'});for(let i=0;i<14;i++)this.particles.push({x:o.x+14,y:o.y+12,vx:rnd(-85,85),vy:rnd(-120,-35),life:rnd(.5,.9),c:i%2?C.yellow:'#8d263f'});return;}if(o.good){this.combo++;this.maxCombo=Math.max(this.maxCombo,this.combo);this.collected++;const comboMultiplier=this.combo>=5?2:1,capriMultiplier=this.bonusTime>0?2:1,multiplier=comboMultiplier*capriMultiplier,gained=o.points*multiplier;this.basePoints+=o.points;this.bonusPoints+=gained-o.points;this.score+=gained;this.emit('feedback',{good:true,text:multiplier>1?`+${gained} BÔNUS x${multiplier}`:`+${gained} CAFÉ MADURO`});for(let i=0;i<8;i++)this.particles.push({x:o.x+8,y:o.y+8,vx:rnd(-70,70),vy:rnd(-105,-35),life:rnd(.4,.7),c:C.yellow});return;}this.combo=0;this.mistakes++;this.dying=true;this.deathTimer=0;this.deathType=o.type==='hole'?'fall':'hit';this.slide=0;this.slideHold=false;this.vy=0;this.emit('feedback',{good:false,text:o.type==='hole'?'CAIU NO BURACO!':'BATEU! FIM DE JOGO'});for(let i=0;i<12;i++)this.particles.push({x:o.x+8,y:o.y+8,vx:rnd(-80,80),vy:rnd(-115,-40),life:rnd(.45,.8),c:C.red});}
 finish(){if(this.mode==='ended')return;this.mode='ended';this.emit('end',{collected:this.collected,mistakes:this.mistakes,maxCombo:this.maxCombo,basePoints:this.basePoints,bonusPoints:this.bonusPoints,sacks:this.sacks,golden:0,accuracy:Math.round(this.collected/Math.max(1,this.collected+this.mistakes)*100)});}
 dust(x,y,n){for(let i=0;i<n;i++)this.particles.push({dust:true,x:x+rnd(-12,12),y:y+rnd(-3,2),vx:rnd(-30,20),vy:rnd(-45,-12),life:rnd(.3,.55),size:rnd(3,7),c:'#f4d5a0'});}
 rect(x,y,w,h,c){this.g.fillStyle=c;this.g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h));}
 circ(x,y,r,c){this.g.fillStyle=c;this.g.beginPath();this.g.arc(Math.round(x),Math.round(y),r,0,7);this.g.fill();}
 oval(x,y,rx,ry,c,stroke=C.dark){const g=this.g;g.fillStyle=c;g.strokeStyle=stroke;g.lineWidth=2;g.beginPath();g.ellipse(x,y,rx,ry,0,0,7);g.fill();g.stroke();}
 draw(){const shake=this.dying&&this.deathType==='hit'&&this.deathTimer<.28?(1-this.deathTimer/.28)*4:0,ox=shake?Math.sin(this.deathTimer*85)*shake:0,oy=shake?Math.cos(this.deathTimer*67)*shake*.45:0;this.g.setTransform(this.renderScale,0,0,this.renderScale,ox*this.renderScale,oy*this.renderScale);this.g.clearRect(-8,-8,W+16,H+16);this.world();for(const o of this.objects)this.itemPolished(o);for(const p of this.particles)p.dust?this.circ(p.x,p.y,p.size*Math.max(.2,p.life*2),p.c):this.rect(p.x,p.y,3,3,p.c);if(this.mode!=='ended')this.playerPolished();if(this.dying&&this.deathType==='fall'){const hole=this.objects.find(o=>o.type==='hole');if(hole)this.holeRim(hole);}}
 world(){const s=this.mode==='playing'?this.elapsed*this.speed:this.t*10,g=this.g;if(this.background.complete&&this.background.naturalWidth){const sw=this.background.naturalHeight*(W/H),maxX=Math.max(0,this.background.naturalWidth-sw),progress=this.mode==='playing'?Math.min(1,this.elapsed/DURATION):.12,cropX=maxX*progress;g.imageSmoothingEnabled=true;g.drawImage(this.background,cropX,0,sw,this.background.naturalHeight,0,0,W,H);g.imageSmoothingEnabled=false;for(let i=-1;i<13;i++){this.rect(i*43-(s%43),235+(i%4)*7,15+i%6,2,'#ad6438');this.rect(i*67-(s%67),216+(i%3)*12,5,2,'#efb469');}return;}const sky=g.createLinearGradient(0,0,0,175);sky.addColorStop(0,C.sky);sky.addColorStop(1,C.mist);g.fillStyle=sky;g.fillRect(0,0,W,H);this.circ(410-(s*.01)%560,38,17,'#ffe27b');g.lineWidth=3;g.lineJoin='round';g.strokeStyle=C.dark;
  for(let i=-1;i<4;i++){const x=i*190-(s*.07)%190;g.fillStyle='#78a879';g.beginPath();g.moveTo(x,172);g.quadraticCurveTo(x+40,117,x+72,137);g.quadraticCurveTo(x+108,85,x+170,172);g.closePath();g.fill();g.stroke();}
  for(let i=-1;i<5;i++){const x=i*145-(s*.14)%145;g.fillStyle=C.hill2;g.beginPath();g.moveTo(x,188);g.quadraticCurveTo(x+48,137,x+78,154);g.quadraticCurveTo(x+112,118,x+145,188);g.closePath();g.fill();g.stroke();}
  this.rect(0,166,W,58,C.grass);const houseX=345-(s*.18)%720;if(houseX>-120&&houseX<520)this.house(houseX,153);for(const d of [[-28,1],[58,.86],[151,1.08],[257,.82],[414,1.05],[535,.9]])this.tree(d[0]-(s*.31)%600,170,d[1]);this.rect(0,G,W,H-G,C.soil);this.rect(0,G,W,4,C.cream);for(let i=-1;i<12;i++)this.rect(i*48-(s%48),246+(i%3),18+i%4,2,'#b66c3c');
  const posts=[-20,29,83,142,208,279,347,421,493];for(const base of posts){const x=base-(s*.68)%540;this.rect(x,204+(base%3),4,16,'#9b6336');this.rect(x,207,38,3,'#c38a4c');}for(const d of [[-12,.8],[25,1],[68,.72],[106,1.08],[154,.83],[201,.96],[247,.75],[288,1.1],[340,.86],[389,1],[441,.7],[477,1.05],[525,.82]])this.bush(d[0]-(s*.88)%555,199,d[1]);}
 tree(x,y,s=1){this.rect(x+13*s,y-30*s,5*s,30*s,C.brown);this.circ(x+8*s,y-35*s,12*s,C.leaf);this.circ(x+20*s,y-40*s,14*s,C.leaf2);this.circ(x+31*s,y-34*s,10*s,C.leaf);}
 bush(x,y,s=1){this.circ(x,y,8*s,C.leaf);this.circ(x+10*s,y-3*s,10*s,C.leaf2);this.circ(x+20*s,y,8*s,C.leaf);this.circ(x+7*s,y-2*s,2*s,C.red);this.circ(x+17*s,y,2*s,C.red);}
 house(x,y){const g=this.g;this.rect(x,y-38,63,38,'#c95840');this.rect(x+9,y-23,14,23,'#f0d49d');this.rect(x+41,y-24,13,13,'#417255');g.fillStyle='#75402e';g.beginPath();g.moveTo(x-7,y-38);g.lineTo(x+31,y-66);g.lineTo(x+70,y-38);g.closePath();g.fill();g.stroke();}
 player(){if(this.inv&&Math.floor(this.inv*14)%2===0)return;const x=93,y=G-this.y,st=Math.sin((this.mode==='playing'?this.elapsed:this.t*.15)*13),g=this.g;if(this.runner.complete&&this.runner.naturalWidth){const action=this.dying||this.y>0||this.slide;let img=this.runner,f=0,bob=0,tilt=0,shift=0,special=false,rolling=false;if(action&&this.actions.complete&&this.actions.naturalWidth){if(this.slide&&this.specialActions.complete&&this.specialActions.naturalWidth){img=this.specialActions;special=true;f=0;bob=Math.sin(this.elapsed*14)*.7;}else if(this.dying&&this.deathType==='fall'&&this.specialActions.complete&&this.specialActions.naturalWidth){img=this.specialActions;special=true;f=this.deathTimer<.24?2:3;}else{img=this.actions;f=this.dying?3:this.vy>=0?0:1;}if(this.dying){if(this.deathType==='fall'){const p=Math.min(1,this.deathTimer/1.05),ease=p*p*(3-2*p);bob=3+ease*82;tilt=Math.sin(p*Math.PI)*.18;shift=Math.sin(p*Math.PI*3)*2;}else{tilt=-.12;bob=Math.sin(this.deathTimer*24)*2;}}}else{const bobs=[-1,1,-4,-1,1,-4],shifts=[0,-3,4,0,-3,4],leans=[-.04,.025,.085,-.04,.025,.085],phase=this.mode==='playing'?Math.floor(this.elapsed*12)%6:0;f=phase;bob=bobs[phase];shift=shifts[phase];tilt=this.mode==='playing'?leans[phase]:0;}
   const shadowScale=action?(this.y?Math.max(.45,1-this.y/170):1):.9+Math.abs(Math.sin(this.elapsed*14))*.1;g.save();g.globalAlpha=.22;g.fillStyle='#19331f';g.beginPath();g.ellipse(x+7,G+1,23*shadowScale,5*shadowScale,0,0,7);g.fill();g.restore();
   const isRun=img===this.runner,actionCrops=[[38,8,172,207],[31,32,187,193],[8,46,270,177],[43,7,207,241]],specialCrops=[[80,130,380,390],[585,170,400,370],[1100,130,360,390],[1540,150,410,400]],ac=special?specialCrops[f]:actionCrops[f],rollCell=rolling?this.rollArt.naturalWidth/6:0,sx=isRun?f*256+45:rolling?f*rollCell:special?ac[0]:f*256+ac[0],sy=isRun?8:rolling?185:ac[1],sw=isRun?170:rolling?rollCell:ac[2],sh=isRun?202:rolling?335:ac[3],dw=isRun?61:rolling?69:special?67:this.dying&&f===3?67:63,dh=isRun?72:rolling?64:special?72:this.dying&&f===3?77:70,footY=y+(this.slide?1:0)+bob;if(isRun&&this.mode==='playing')this.runFx(x,y);g.save();g.imageSmoothingEnabled=true;g.translate(x+8+shift,footY);if(this.land&&!this.slide){const p=this.land/.16;g.scale(1+(p*.08),1-(p*.09));}if(this.dying&&this.deathType==='fall'){const sc=Math.max(.64,1-this.deathTimer*.28);g.scale(sc,sc);}g.rotate(tilt);g.drawImage(img,sx,sy,sw,sh,-dw*.5,-dh,dw,dh);g.restore();g.imageSmoothingEnabled=false;return;}if(this.slide){this.rect(x-7,y-19,30,14,C.green);this.circ(x+23,y-17,11,C.skin);this.rect(x+13,y-31,25,4,C.cream);this.rect(x+18,y-39,15,9,C.yellow);this.rect(x-9,y-7,18,6,C.brown);return;}
  const hip=y-18;this.circ(x+7,hip-31,14,C.yellow);this.rect(x-2,hip-30,19,25,C.yellow);this.rect(x,hip-18,15,18,C.green);this.rect(x-2,hip-23,4,13,C.dark);this.rect(x+13,hip-23,4,13,C.dark);this.circ(x+7,hip-43,14,C.skin);this.rect(x-6,hip-53,29,5,C.cream);this.rect(x-1,hip-64,19,12,C.yellow);this.rect(x-1,hip-55,19,3,C.red);this.rect(x-9,hip-32,10,22,C.brown);this.rect(x-11,hip-34,14,4,'#d69542');
  const a=st*6,b=-st*6;this.rect(x-1+a,hip-3,7,17,C.green);this.rect(x-3+a,hip+12,11,5,C.brown);this.rect(x+10+b,hip-3,7,17,C.green);this.rect(x+9+b,hip+12,11,5,C.brown);this.rect(x-10-b,hip-27,7,18,C.skin);this.circ(x-7-b,hip-8,4,C.skin);this.rect(x+19+b,hip-27,7,18,C.skin);this.circ(x+22+b,hip-8,4,C.skin);}
 item(o){const g=this.g;if(o.type==='bird'){this.bird(o);return;}if(['crate','rake','bees'].includes(o.type)){this.newObstacle(o);return;}if(['puddle','sack','hole'].includes(o.type)){this.farmObstacle(o);return;}if(this.itemsArt.complete&&this.itemsArt.naturalWidth){const crop={coffee:[62,65,142,158],green:[54,66,150,158],rock:[48,70,165,146],branch:[35,73,190,123],borer:[45,65,176,160]},sizes={coffee:[35,39],green:[35,39],rock:[43,38],branch:[56,29],borer:[39,36]},c=crop[o.type]||crop.coffee,[dw,dh]=sizes[o.type]||[36,36],bob=o.good?Math.sin(this.t*5+o.x*.04)*2:0,dx=o.x+o.w/2-dw/2,ground=o.good?o.y+o.h+bob:G+(o.type==='rock'?10:2),dy=ground-dh;g.save();if(!o.good){g.globalAlpha=.3;g.fillStyle='#263526';g.beginPath();g.ellipse(o.x+o.w/2,G+(o.type==='rock'?5:1),Math.max(10,dw*.38),o.type==='rock'?3:2.2,0,0,7);g.fill();g.globalAlpha=1;}g.imageSmoothingEnabled=true;g.drawImage(this.itemsArt,(Math.floor((crop[o.type]?['coffee','green','rock','branch','borer'].indexOf(o.type):0))*256)+c[0],c[1],c[2],c[3],dx,dy,dw,dh);g.restore();return;}g.lineJoin='round';if(o.type==='coffee'||o.type==='green'){const c=o.type==='coffee'?C.red:'#75a947';g.strokeStyle=C.dark;g.lineWidth=2;g.beginPath();g.moveTo(o.x+12,o.y+4);g.quadraticCurveTo(o.x+9,o.y-2,o.x+6,o.y-4);g.stroke();this.oval(o.x+7,o.y+10,4.5,6,c);this.oval(o.x+14,o.y+8,4.5,6,c);this.oval(o.x+12,o.y+15,4.5,6,c);this.oval(o.x+18,o.y+1,6,2.5,C.leaf2);}
  else if(o.type==='rock'){g.fillStyle=C.gray;g.strokeStyle=C.dark;g.lineWidth=3;g.beginPath();g.moveTo(o.x,o.y+21);g.lineTo(o.x+3,o.y+10);g.lineTo(o.x+10,o.y+3);g.lineTo(o.x+20,o.y+6);g.lineTo(o.x+25,o.y+16);g.lineTo(o.x+21,o.y+24);g.lineTo(o.x+5,o.y+24);g.closePath();g.fill();g.stroke();g.strokeStyle='#aeb4ab';g.lineWidth=2;g.beginPath();g.moveTo(o.x+8,o.y+9);g.lineTo(o.x+15,o.y+7);g.stroke();}
  else if(o.type==='branch'){g.strokeStyle=C.dark;g.lineCap='round';g.lineWidth=9;g.beginPath();g.moveTo(o.x+2,o.y+8);g.lineTo(o.x+36,o.y+5);g.stroke();g.strokeStyle=C.brown;g.lineWidth=5;g.stroke();g.strokeStyle=C.dark;g.lineWidth=6;g.beginPath();g.moveTo(o.x+23,o.y+6);g.lineTo(o.x+29,o.y-1);g.stroke();g.strokeStyle=C.brown;g.lineWidth=3;g.stroke();g.lineCap='butt';}
  else{this.oval(o.x+12,o.y+13,8,10,'#4a2b1c');this.oval(o.x+12,o.y+5,6,5,'#261711');for(const sx of [-1,1]){g.strokeStyle=C.dark;g.lineWidth=2;for(let i=0;i<3;i++){g.beginPath();g.moveTo(o.x+12+sx*5,o.y+9+i*5);g.lineTo(o.x+12+sx*12,o.y+6+i*6);g.stroke();}g.beginPath();g.moveTo(o.x+10+sx*2,o.y+2);g.lineTo(o.x+8+sx*8,o.y-3);g.stroke();}g.strokeStyle='#a86a38';g.beginPath();g.moveTo(o.x+8,o.y+11);g.lineTo(o.x+16,o.y+11);g.moveTo(o.x+8,o.y+16);g.lineTo(o.x+16,o.y+16);g.stroke();}}
 newObstacle(o){const g=this.g,map={crate:0,rake:1,bees:2},f=map[o.type],cell=this.farmArt.naturalWidth/3,crops={crate:[90,105,500,445],rake:[12,52,625,548],bees:[35,45,650,600]},c=crops[o.type],sizes={crate:[43,39],rake:[66,58],bees:[57,52]},[dw,dh]=sizes[o.type],bob=o.type==='bees'?Math.sin(this.t*12)*2:0,x=o.x+o.w/2-dw/2,y=o.type==='bees'?o.y+o.h/2-dh/2+bob:G-dh+2;if(this.farmArt.complete&&this.farmArt.naturalWidth){g.save();if(o.type!=='bees'){g.globalAlpha=.28;g.fillStyle=C.dark;g.beginPath();g.ellipse(o.x+o.w/2,G+1,dw*.34,2.4,0,0,7);g.fill();g.globalAlpha=1;}g.imageSmoothingEnabled=true;g.drawImage(this.farmArt,f*cell+c[0],c[1],c[2],c[3],x,y,dw,dh);g.restore();}}
 farmObstacle(o){const g=this.g,x=o.x,y=o.y;if(o.type==='hole'){g.save();g.lineJoin='round';g.fillStyle='#70402b';g.strokeStyle='#3b281f';g.lineWidth=2.5;g.beginPath();g.moveTo(x,G-3);g.lineTo(x+5,G-9);g.lineTo(x+13,G-10);g.lineTo(x+18,G-13);g.lineTo(x+27,G-11);g.lineTo(x+35,G-12);g.lineTo(x+42,G-8);g.lineTo(x+48,G-3);g.lineTo(x+43,G+3);g.lineTo(x+34,G+5);g.lineTo(x+25,G+7);g.lineTo(x+15,G+5);g.lineTo(x+6,G+3);g.closePath();g.fill();g.stroke();g.fillStyle='#18130f';g.beginPath();g.ellipse(x+24,G-2,20,6.2,0,0,7);g.fill();g.stroke();g.strokeStyle='#8f5030';g.lineWidth=1.5;for(const c of [[5,-7,-2,-13],[41,-7,48,-13],[10,3,4,9],[38,3,44,8]]){g.beginPath();g.moveTo(x+c[0],G+c[1]);g.lineTo(x+c[2],G+c[3]);g.stroke();}g.restore();return;}if(o.type==='puddle'){g.save();g.fillStyle='#5b3929';g.strokeStyle=C.dark;g.lineWidth=2;g.beginPath();g.ellipse(x+22,G-3,22,6,0,0,7);g.fill();g.stroke();g.fillStyle='#8d6043';g.beginPath();g.ellipse(x+17,G-5,9,2.5,-.1,0,7);g.fill();g.restore();return;}g.save();g.fillStyle='#b8894f';g.strokeStyle=C.dark;g.lineWidth=2.5;g.beginPath();g.moveTo(x+5,G);g.quadraticCurveTo(x+1,G-15,x+9,G-27);g.quadraticCurveTo(x+18,G-32,x+28,G-26);g.quadraticCurveTo(x+36,G-14,x+31,G);g.closePath();g.fill();g.stroke();g.strokeStyle='#6f452c';g.lineWidth=2;g.beginPath();g.moveTo(x+7,G-21);g.quadraticCurveTo(x+18,G-17,x+30,G-21);g.moveTo(x+9,G-8);g.lineTo(x+30,G-8);g.stroke();g.fillStyle=C.red;g.beginPath();g.arc(x+18,G-14,4,0,7);g.fill();g.restore();}
 holeRim(o){const g=this.g,x=o.x,p=Math.min(1,this.deathTimer/1.05);g.save();g.lineCap='round';g.fillStyle='rgba(25,17,12,.38)';g.beginPath();g.ellipse(x+24,G+2,22,5.5,0,0,Math.PI);g.fill();g.strokeStyle='#38251c';g.lineWidth=7;g.beginPath();g.ellipse(x+24,G-2,21,6.5,0,0,Math.PI);g.stroke();g.strokeStyle='#a35d35';g.lineWidth=3.5;g.stroke();g.fillStyle='#b66b3d';for(const d of [[5,-5,3],[43,-4,2.5],[10,3,2],[38,3,2]]){g.beginPath();g.arc(x+d[0],G+d[1],d[2]*(1+p*.25),0,7);g.fill();}if(p>.12&&p<.82){g.globalAlpha=(1-p)*.8;g.strokeStyle='#d69254';g.lineWidth=2;for(const d of [[8,-8,-5,-14],[39,-7,48,-13],[16,-9,12,-17],[32,-9,36,-16]]){g.beginPath();g.moveTo(x+d[0],G+d[1]);g.lineTo(x+d[2],G+d[3]);g.stroke();}}g.restore();}
 runFx(){}
 bird(o){const g=this.g;if(this.birdArt.complete&&this.birdArt.naturalWidth){const f=Math.floor(this.t*11)%4,sw=this.birdArt.naturalWidth/4,sy=115,sh=510,dw=52,dh=54,x=o.x+o.w/2-dw/2,y=o.y+o.h/2-dh/2;g.save();g.imageSmoothingEnabled=true;g.drawImage(this.birdArt,f*sw,sy,sw,sh,x,y,dw,dh);g.restore();return;}const x=o.x+18,y=o.y+10;this.oval(x,y,13,7,'#4f91b6');this.circ(x-10,y-2,5,'#5ca3c5');}
 itemPolished(o){
  if(o.type==='platform'){this.platform(o);return;}
  if(o.type==='capriSack'){this.capriSack(o);return;}
  if(o.type==='fence'){this.fence(o);return;}
  if(o.type==='hole'){this.holeClean(o);return;}
  this.item(o);
 }
 platform(o){if(!this.platformArt){this.platformArt=new Image();this.platformArt.src='/assets/items/capri/platform-capri-v1.png';}const g=this.g,x=o.x,y=G-o.height;if(this.platformArt.complete&&this.platformArt.naturalWidth){g.save();g.imageSmoothingEnabled=true;g.drawImage(this.platformArt,x-2,y-3,o.w+4,o.height+5);g.restore();return;}this.rect(x,y,o.w,14,'#a76835');}
 capriSack(o){if(!this.sackArt){this.sackArt=new Image();this.sackArt.src='/assets/items/capri/sack-capri-v2.png';}const g=this.g,x=o.x,y=o.y,bob=Math.sin(this.t*6)*1.5;if(this.sackArt.complete&&this.sackArt.naturalWidth){g.save();g.imageSmoothingEnabled=true;g.drawImage(this.sackArt,x-4,y-5+bob,42,42);g.restore();return;}this.oval(x+16,y+19,14,18,'#e7c995');}
 fence(o){if(!this.fenceArt){this.fenceArt=new Image();this.fenceArt.src='/assets/items/capri/fence-capri-v1.png';}const g=this.g,x=o.x,y=G-47;if(this.fenceArt.complete&&this.fenceArt.naturalWidth){g.save();g.imageSmoothingEnabled=true;g.drawImage(this.fenceArt,x-7,y-3,64,50);g.restore();return;}this.rect(x,y,50,44,'#9b6336');}
 holeClean(o){
  const g=this.g,x=o.x+o.w/2,y=G-2;
  g.save();g.lineJoin='round';
  g.fillStyle='rgba(70,38,24,.2)';g.beginPath();g.ellipse(x+2,y+5,28,6.5,0,0,7);g.fill();
  const soil=g.createLinearGradient(0,y-10,0,y+8);
  soil.addColorStop(0,'#a85f35');soil.addColorStop(.55,'#7b4329');soil.addColorStop(1,'#56301f');
  g.fillStyle=soil;g.strokeStyle='#4b2c20';g.lineWidth=2;
  g.beginPath();g.moveTo(x-27,y-1);
  g.bezierCurveTo(x-25,y-9,x-16,y-12,x-8,y-10);
  g.bezierCurveTo(x-1,y-14,x+8,y-12,x+13,y-9);
  g.bezierCurveTo(x+21,y-10,x+28,y-6,x+28,y);
  g.bezierCurveTo(x+26,y+7,x+15,y+9,x+7,y+7);
  g.bezierCurveTo(x,y+11,x-10,y+9,x-15,y+7);
  g.bezierCurveTo(x-23,y+8,x-29,y+4,x-27,y-1);g.closePath();g.fill();g.stroke();
  const depth=g.createRadialGradient(x-4,y-5,2,x,y-1,24);
  depth.addColorStop(0,'#352219');depth.addColorStop(.55,'#211713');depth.addColorStop(1,'#0e0c0a');
  g.fillStyle=depth;g.beginPath();g.ellipse(x,y-1,22.5,7.2,0,0,7);g.fill();
  g.strokeStyle='#2f2018';g.lineWidth=2.2;g.stroke();
  g.strokeStyle='#c57a48';g.lineWidth=2.3;g.beginPath();
  g.ellipse(x,y-2.5,21,5.5,0,Math.PI+.16,Math.PI*2-.16);g.stroke();
  g.fillStyle='#d28a53';
  for(const d of [[-24,-4,2.2],[-16,7,1.8],[17,6,2],[25,-2,1.7],[-8,-10,1.4],[11,-9,1.3]]){
   g.beginPath();g.ellipse(x+d[0],y+d[1],d[2],d[2]*.65,0,0,7);g.fill();
  }
  g.restore();
 }
 playerPolished(){
  if(this.inv&&Math.floor(this.inv*14)%2===0)return;
  const g=this.g,x=101,ground=G-this.y;
  if(!this.runner.complete||!this.runner.naturalWidth){this.player();return;}
  let img=this.runner,crop=[60,8,160,202],dw=61,dh=72;
  let bob=0,shift=0,tilt=0,scaleX=1,scaleY=1,isRun=false;
  if(this.dying&&this.deathType==='fall'&&this.specialActions.complete){
   const p=Math.min(1,this.deathTimer/1.05),ease=p*p*(3-2*p),frame=p<.22?2:3;
   img=this.specialActions;crop=frame===2?[1100,130,360,390]:[1540,150,410,400];
   dw=67;dh=72;bob=3+ease*84;shift=Math.sin(p*Math.PI*3)*2.2;
   tilt=Math.sin(p*Math.PI)*.2;scaleX=scaleY=Math.max(.72,1-p*.22);
  }else if(this.dying){
   img=this.actions;crop=[811,7,207,241];dw=67;dh=77;
   const p=Math.min(1,this.deathTimer/.82);
   bob=Math.sin(p*Math.PI*3)*2;shift=-p*4;tilt=-.1-p*.18;
   scaleX=1+p*.08;scaleY=1-p*.09;
  }else if(this.slide&&this.specialActions.complete){
   img=this.specialActions;crop=[80,130,380,390];dw=67;dh=72;
   const pulse=Math.sin(this.elapsed*13);
   bob=pulse*.55;tilt=-.025;scaleX=1+pulse*.012;scaleY=1-pulse*.012;
  }else if(this.y>0&&this.actions.complete){
   img=this.actions;
   const rising=this.vy>42,apex=Math.abs(this.vy)<=42;
   crop=rising?[38,8,172,207]:[287,32,187,193];
   dw=63;dh=70;tilt=rising?-.075:.055;
   scaleX=apex?1.05:rising?.96:1.02;scaleY=apex?.95:rising?1.06:.98;
  }else{
   isRun=true;
   const fps=10+Math.min(4,(this.speed-START_SPEED)/28),cycle=this.elapsed*fps,frame=Math.floor(cycle)%6,mix=cycle%1,smooth=mix*mix*(3-2*mix),next=(frame+1)%6;
   // Exclui os pixels soltos no começo de cada quadro que pareciam um rastro preto.
   crop=[frame*256+60,8,160,202];
   const contact=frame===1||frame===4;
   const bobs=[0,1,-2,0,1,-2],shifts=[0,-1,1,0,-1,1],leans=[-.025,.008,.045,-.025,.008,.045];
   const blend=values=>values[frame]+(values[next]-values[frame])*smooth;
   bob=blend(bobs);shift=blend(shifts);tilt=blend(leans);
   const footImpact=contact*Math.max(0,1-Math.abs(mix-.16)*4.2);
   scaleX=.995+footImpact*.025;scaleY=1.005-footImpact*.03;
  }
  const shadow=Math.max(.48,1-Math.max(0,this.y)/145);
  g.save();g.globalAlpha=.23;g.fillStyle='#19331f';g.beginPath();
  g.ellipse(x,G+1,22*shadow*(this.slide?1.12:1),4.8*shadow,0,0,7);g.fill();g.restore();
  g.save();g.imageSmoothingEnabled=true;
  if(this.dying&&this.deathType==='fall'){g.beginPath();g.rect(0,0,W,G+5);g.clip();}
  g.translate(x+shift,ground+bob);
  if(this.land&&!this.slide){const p=this.land/.16,wave=Math.sin(p*Math.PI);scaleX*=1+wave*.09;scaleY*=1-wave*.1;}
  g.rotate(tilt);g.scale(scaleX*.94,scaleY);
  g.drawImage(img,crop[0],crop[1],crop[2],crop[3],-dw*.5,-dh,dw,dh);
  g.restore();g.imageSmoothingEnabled=false;
 }
}
