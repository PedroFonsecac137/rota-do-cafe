import * as pc from 'playcanvas';
import { GAME, ITEMS } from './config.js';

const hex = value => new pc.Color(((value>>16)&255)/255,((value>>8)&255)/255,(value&255)/255);

export class Game extends EventTarget {
  constructor(container) {
    super(); this.container=container; this.canvas=document.createElement('canvas'); container.append(this.canvas);
    this.app=new pc.Application(this.canvas,{graphicsDeviceOptions:{antialias:true,powerPreference:'high-performance'}});
    this.app.setCanvasFillMode(pc.FILLMODE_FILL_WINDOW);this.app.setCanvasResolution(pc.RESOLUTION_AUTO);this.app.graphicsDevice.maxPixelRatio=Math.min(devicePixelRatio,1.6);
    this.app.scene.ambientLight=new pc.Color(.62,.7,.68);this.app.scene.toneMapping=pc.TONEMAP_ACES;this.app.scene.exposure=1;this.app.scene.fog.type=pc.FOG_NONE;
    this.items=[];this.rows=[];this.effects=[];this.mode='menu';this.materials=new Map();this.buildWorld();this.resize();
    addEventListener('resize',()=>this.resize());this.app.on('update',dt=>this.update(Math.min(dt,.033)));queueMicrotask(()=>this.app.start());
  }
  mat(color,emissive=0){const key=`${color}-${emissive}`;if(this.materials.has(key))return this.materials.get(key);const m=new pc.StandardMaterial();m.diffuse=hex(color);m.gloss=3;m.metalness=0;m.specular=new pc.Color(.08,.08,.08);if(emissive){m.emissive=hex(color);m.emissiveIntensity=emissive;}m.update();this.materials.set(key,m);return m;}
  shape(name,type,color,scale=[1,1,1],position=[0,0,0],parent=this.app.root){const e=new pc.Entity(name);e.addComponent('render',{type,material:this.mat(color),castShadows:true,receiveShadows:true});e.setLocalScale(...scale);e.setLocalPosition(...position);parent.addChild(e);return e;}
  group(name,parent=this.app.root){const e=new pc.Entity(name);parent.addChild(e);return e;}
  buildWorld(){
    this.camera=this.group('Camera');this.camera.addComponent('camera',{clearColor:new pc.Color(.43,.76,.88),farClip:170,fov:50});this.camera.setPosition(0,6.5,14.5);this.camera.lookAt(0,2,-17);
    const sun=this.group('Sun');sun.addComponent('light',{type:'directional',color:new pc.Color(1,.9,.72),intensity:1.55,castShadows:true,shadowResolution:2048,shadowBias:.2,normalOffsetBias:.1});sun.setEulerAngles(52,-35,0);
    this.shape('Field','box',0x69a94f,[80,.3,180],[0,-.5,-35]);
    for(const x of [-29,-18,18,29])this.shape('Field parcel','box',x<0?(Math.abs(x)>20?0x8ac557:0x72b454):(Math.abs(x)>20?0x7fbd50:0x93c85d),[9,.08,180],[x,-.31,-35]);
    for(const side of [-1,1])for(let x=10;x<38;x+=2.4)this.shape('Crop line','box',x%4.8<1?0x4f9342:0x5da246,[.18,.07,180],[side*x,-.2,-35]);
    this.shape('Road border','box',0xf1d7a0,[14.4,.25,180],[0,-.27,-35]);this.shape('Road','box',0xad633c,[13,.36,180],[0,-.2,-35]);
    for(const x of [-4.25,4.25])this.shape('Road shoulder','box',0xd69258,[.16,.025,180],[x,-.005,-35]);
    for(const x of [-2,2])for(let z=8;z>-105;z-=7)this.shape('Lane dash','box',0xf6d982,[.055,.025,2.7],[x,.005,z]);
    for(let z=5;z>-104;z-=8)for(const x of [-4.7,4.7]){const pebble=this.shape('Road texture','sphere',z%16?0x925034:0xc47a4a,[.14,.025,.5],[x+(z%3)*.1,.01,z]);pebble.setEulerAngles(0,25,0);}
    this.buildBackdrop();this.buildRows();this.player=this.makePlayer();this.player.setPosition(0,0,GAME.playerZ);
  }
  buildBackdrop(){
    this.shape('Sun disc','sphere',0xffdf6c,[3.1,3.1,.5],[-27,22,-88]);
    for(const [x,z,s,c] of [[-33,-86,19,0x4b8d58],[29,-98,23,0x579b5c],[0,-116,29,0x70ad69]])this.shape('Hill','sphere',c,[s,s*.36,s],[x,-3,z]);
    for(const [x,y,z,s] of [[-20,18,-48,1],[16,20,-68,.8],[2,23,-96,.65]]){const cloud=this.group('Cloud');for(let i=0;i<5;i++)this.shape('Puff','sphere',0xfff7df,[s*(1.6+i%2*.45),s*(1.1+i%2*.25),s*1.2],[i*s*1.3,Math.sin(i)*s*.35,0],cloud);cloud.setPosition(x,y,z);}
    const barn=this.group('Barn');this.shape('Body','box',0xc9543f,[8,5,6],[0,2.5,0],barn);const roof=this.shape('Roof','cone',0x69392f,[5.7,3,5.7],[0,6,0],barn);roof.setEulerAngles(0,45,0);this.shape('Door','box',0x62392a,[2.5,3,.15],[0,1.5,3.05],barn);this.shape('Door trim','box',0xf4d496,[3,.16,.18],[0,3,3.17],barn);barn.setPosition(-23,0,-50);
    const silo=this.group('Silo');this.shape('Tower','cylinder',0xe7cd98,[2.4,7,2.4],[0,3.5,0],silo);this.shape('Cap','cone',0xb84934,[2.8,2,2.8],[0,8,0],silo);silo.setPosition(22,0,-62);
    const water=this.group('Water tower');this.shape('Tank','cylinder',0x5ca6a4,[2,2.5,2],[0,7,0],water);for(const x of [-1.2,1.2])for(const z of [-.65,.65])this.shape('Leg','box',0x695943,[.14,6,.14],[x,3,z],water);water.setPosition(-20,0,-74);
    const windmill=this.group('Windmill');this.shape('Mast','box',0xe9d5a5,[.35,7,.35],[0,3.5,0],windmill);this.shape('Hub','cylinder',0xd6533d,[.52,.22,.52],[0,7,.4],windmill).setLocalEulerAngles(90,0,0);for(const a of [0,45,90,135]){const blade=this.shape('Blade','box',0xffedbe,[.16,3.8,.08],[0,7,.55],windmill);blade.setLocalEulerAngles(0,0,a);}windmill.setPosition(20,0,-39);
    const gate=this.group('Harvest gate');for(const x of [-6,6])this.shape('Gate post','box',0x1f6248,[.42,4,.42],[x,2,0],gate);this.shape('Gate beam','box',0x1f6248,[12.8,.5,.5],[0,5.5,0],gate);this.shape('Gate sign','box',0xf4cf58,[5.4,1.25,.18],[0,5.45,.55],gate);for(const x of [-2.1,2.1])this.shape('Sign bean','sphere',0xcf4635,[.45,.65,.15],[x,5.45,.78],gate).setLocalEulerAngles(0,0,x*12);gate.setPosition(0,0,-45);
    for(const side of [-1,1])for(let z=8;z>-82;z-=8){this.shape('Post','box',0xe1c58f,[.18,1.25,.18],[side*6.15,.62,z]);this.shape('Rail','box',0xe1c58f,[.14,.14,8],[side*6.15,.92,z-4]);}
    for(let i=0;i<18;i++){const side=i%2?-1:1,x=side*(10+(i%4)*2.2),z=4-i*6,c=i%3===0?0xf1c84b:i%3===1?0xea6a51:0xf4e9b0;this.shape('Flower','sphere',c,[.2,.2,.2],[x,.32,z]);this.shape('Flower stem','cylinder',0x397744,[.03,.38,.03],[x,.06,z]);}
    for(const [x,z] of [[-10,-25],[11,-58],[-12,-82]]){const crates=this.group('Farm crates');for(let i=0;i<3;i++)this.shape('Crate','box',i===2?0xd99442:0xb96a32,[1.05,.7,1.05],[(i-1)*1.05,i===2?.9:0,0],crates);crates.setPosition(x,.65,z);}
  }
  buildRows(){for(let r=0;r<18;r++){const row=this.group('Coffee row');row.setPosition(0,0,10-r*6);for(const side of [-1,1]){const bush=this.group('Coffee plant',row);bush.setLocalPosition(side*(7.15+(r%3)*.16),0,0);bush.setLocalScale(.84+(r%4)*.055,.9+(r%3)*.04,.84+(r%4)*.055);this.shape('Stem','cylinder',0x553522,[.15,1.2,.15],[0,.6,0],bush);for(let i=0;i<5;i++){const crown=this.shape('Crown','sphere',i%2?0x286e42:0x34834b,[1.16,.58,.74],[(i-2)*.48,1.24+Math.sin(i*2+r)*.19,Math.cos(i+r)*.15],bush);crown.setLocalEulerAngles(0,0,(i-2)*6);}for(let i=0;i<6;i++)this.shape('Cherry','sphere',i%3?0xcf4034:0xee7442,[.12,.14,.11],[-.7+i*.28,1.05+(i%3)*.27,.62],bush);}this.rows.push(row);}}
  makePlayer(){
    const p=this.group('Producer'),body=this.group('Body',p);p.body=body;p.limbs=[];
    this.shape('Round torso','capsule',0xf2bd3f,[.9,1.02,.7],[0,2.18,0],body);this.shape('Round waist','sphere',0x225b42,[.82,.66,.68],[0,1.58,.08],body);this.shape('Overalls back','capsule',0x225b42,[.62,.67,.59],[0,1.95,.2],body);
    for(const x of [-.35,.35]){const strap=this.shape('Overall strap','capsule',0x194632,[.09,.55,.06],[x,2.37,.57],body);strap.setLocalEulerAngles(0,0,x*7);this.shape('Brass button','sphere',0xefc952,[.08,.08,.05],[x,2.13,.64],body);}
    this.shape('Short neck','cylinder',0xb9784c,[.3,.22,.3],[0,2.95,0],body);p.head=this.shape('Round head','sphere',0xc78858,[.59,.62,.56],[0,3.3,0],body);this.shape('Round hair','sphere',0x38251b,[.59,.37,.57],[0,3.5,.08],body);
    p.hat=this.shape('Hat brim','cylinder',0xf5d783,[.91,.09,.82],[0,3.76,0],body);this.shape('Hat crown','cylinder',0xeac36a,[.55,.38,.54],[0,3.98,0],body);this.shape('Hat dome','sphere',0xf2d27b,[.54,.16,.53],[0,4.18,0],body);this.shape('Hat band','cylinder',0xd94b35,[.59,.09,.58],[0,3.86,0],body);
    this.shape('Basket cushion','sphere',0xb96b2d,[.67,.76,.32],[0,2.05,.78],body);p.basket=this.shape('Round basket','cylinder',0xc47a35,[.65,.7,.6],[0,2.02,.92],body);this.shape('Basket rim','cylinder',0xeda950,[.72,.09,.67],[0,2.57,.92],body);for(let y=1.58;y<2.48;y+=.22)this.shape('Basket weave','box',0xe0a04c,[1.03,.035,.055],[0,y,1.5],body);for(let i=0;i<7;i++)this.shape('Coffee cherry','sphere',i%3?0xd23e30:0xef7938,[.12,.13,.11],[(i%4-1.5)*.2,2.65+Math.floor(i/4)*.1,1.18],body);
    for(const [x,phase] of [[-.37,0],[.37,Math.PI]]){const leg=this.group('Leg',body);leg.setLocalPosition(x,1.22,0);this.shape('Round leg','capsule',0x225b42,[.24,.58,.24],[0,-.38,0],leg);const boot=this.shape('Round boot','capsule',0x6d3c25,[.28,.34,.33],[0,-.91,-.12],leg);boot.setLocalEulerAngles(90,0,0);leg.phase=phase;p.limbs.push(leg);const arm=this.group('Arm',body);arm.setLocalPosition(x*1.85,2.58,0);this.shape('Shoulder','sphere',0xf2bd3f,[.3,.31,.28],[0,-.06,0],arm);this.shape('Short sleeve','capsule',0xf2bd3f,[.23,.34,.23],[0,-.29,0],arm);this.shape('Round forearm','capsule',0xc78858,[.19,.4,.19],[0,-.65,0],arm);this.shape('Round hand','sphere',0xc78858,[.21,.22,.2],[0,-.94,0],arm);arm.phase=phase+Math.PI;p.limbs.push(arm);}
    p.scarf=this.shape('Scarf tail','capsule',0xd94b35,[.1,.36,.08],[.28,2.7,.52],body);p.scarf.setLocalEulerAngles(0,0,-22);p.setLocalScale(.88,.88,.88);return p;
  }
  loadPlayerModel(){
    this.app.assets.loadFromUrl('/assets/models/producer.glb','container',(error,asset)=>{
      if(error||!asset?.resource)return;
      const model=asset.resource.instantiateRenderEntity();model.name='Producer 3D';model.setLocalScale(.72,.72,.72);model.setLocalEulerAngles(0,180,0);model.setLocalPosition(0,0,0);this.player.addChild(model);
      this.app.assets.loadFromUrl('/assets/kenney-protagonists/Skins/skaterMaleA.png','texture',(textureError,textureAsset)=>{
        if(textureError||!textureAsset)return;for(const render of model.findComponents('render'))for(const mesh of render.meshInstances){const material=mesh.material.clone();material.diffuseMap=textureAsset.resource;material.emissiveMap=null;material.gloss=6;material.update();mesh.material=material;}
      });
      const basket=this.group('Producer basket',this.player);basket.enabled=false;basket.setLocalPosition(0,2.05,.54);basket.setLocalScale(.72,.72,.72);this.shape('Basket body','cone',0xb96c2e,[.54,.68,.54],[0,0,0],basket);this.shape('Basket rim','cylinder',0xe3a24e,[.61,.08,.61],[0,.39,0],basket);for(let i=0;i<7;i++)this.shape('Coffee','sphere',i%3?0xcf382d:0xea6936,[.11,.12,.1],[(i%4-1.5)*.17,.48+Math.floor(i/4)*.1,(i%2-.5)*.15],basket);
      this.app.assets.loadFromUrl('/assets/models/producer-run.glb','container',(runError,runAsset)=>{const track=runAsset?.resource?.animations?.[0];if(runError||!track){basket.destroy();model.destroy();this.player.body.enabled=true;return;}model.addComponent('anim',{activate:true});model.anim.assignAnimation('run',track);model.anim.baseLayer.transition('run',0);basket.enabled=true;this.player.body.enabled=false;this.player.model=model;});
    });
  }
  makeItem(type,lane,z){
    const d=ITEMS[type],g=this.group(type);
    if(type==='ripe'||type==='green'||type==='golden'){
      const count=type==='green'?3:2;for(let i=0;i<count;i++){const x=(i-(count-1)/2)*.62,fruit=this.shape('Coffee cherry','sphere',d.color,[.5,.68,.46],[x,i%2*.14,0],g);fruit.setLocalEulerAngles(0,0,x*-14);this.shape('Cherry shine','sphere',type==='golden'?0xfff0a0:0xff8a68,[.09,.18,.06],[x-.13,.2,.42],g);}
      const stem=this.shape('Stem','capsule',0x3d6f38,[.055,.52,.055],[0,.72,0],g);stem.setLocalEulerAngles(0,0,-8);for(const side of [-1,1]){const leaf=this.shape('Leaf','sphere',0x3e9149,[.42,.18,.09],[side*.34,.9,0],g);leaf.setLocalEulerAngles(0,0,side*-34);}
      if(type==='golden'){const halo=this.shape('Golden halo','cylinder',0xffe46a,[.86,.025,.86],[0,0,-.12],g);halo.setLocalEulerAngles(90,0,0);halo.render.material=this.mat(0xffda38,1.3);}
    }else if(type==='shield'){
      const plate=this.shape('Shield plate','cylinder',0x3cb89a,[.78,.12,.78],[0,0,0],g);plate.setLocalEulerAngles(90,0,0);this.shape('Shield inset','cylinder',0xbdf5da,[.58,.14,.58],[0,0,.12],g).setLocalEulerAngles(90,0,0);this.shape('Shield leaf','sphere',0x247357,[.19,.4,.07],[0,.04,.3],g).setLocalEulerAngles(0,0,-32);
    }else if(type==='rock'){
      for(const [x,y,s,c,rz] of [[0,.18,.92,0x686b66,-8],[-.62,.04,.52,0x555954,18],[.62,.02,.44,0x858981,-14]]){const rock=this.shape('Faceted rock','sphere',c,[s*1.12,s*.66,s],[x,y,0],g);rock.setLocalEulerAngles(0,rz,rz);}
    }else if(type==='leaf'){
      for(let i=0;i<4;i++){const leaf=this.shape('Dry leaf','sphere',i%2?0xb26a32:0xd4943f,[.32,.7,.075],[(i-1.5)*.42,(i%2)*.18,0],g);leaf.setLocalEulerAngles(0,0,18+(i-1.5)*32);this.shape('Leaf vein','capsule',0x754226,[.025,.5,.025],[(i-1.5)*.42,(i%2)*.18,.08],g).setLocalEulerAngles(0,0,18+(i-1.5)*32);}
    }else if(type==='branch'){
      const trunk=this.shape('Fallen branch','capsule',0x754226,[.19,1.85,.19],[0,0,0],g);trunk.setLocalEulerAngles(0,0,86);for(const side of [-1,1]){const twig=this.shape('Twig','capsule',0x754226,[.09,.65,.09],[side*.62,.24,0],g);twig.setLocalEulerAngles(0,0,side*48);}
    }else if(type==='basket'){
      this.shape('Bonus basket','cone',0xc97b32,[.82,.76,.82],[0,0,0],g);this.shape('Basket rim','cylinder',0xf0ae52,[.9,.1,.9],[0,.46,0],g);for(let i=0;i<9;i++)this.shape('Cherry','sphere',i%4?0xd83d2e:0xee7837,[.2,.23,.2],[(i%3-1)*.34,.55+Math.floor(i/3)*.17,(i%2-.5)*.28],g);for(let y=-.35;y<.35;y+=.22)this.shape('Weave','box',0xe2a14c,[1.3,.035,.07],[0,y,.72],g);
    }else{
      this.shape('Borer body','capsule',0x372219,[.42,.68,.38],[0,0,0],g).setLocalEulerAngles(90,0,0);for(let i=-2;i<=2;i++)this.shape('Shell stripe','box',0x5a3422,[.36,.035,.32],[0,i*.22,.34],g);this.shape('Borer head','sphere',0x22150f,[.4,.34,.38],[0,.05,.63],g);for(const side of [-1,1]){this.shape('Antenna','capsule',0x1c130f,[.035,.45,.035],[side*.2,.22,.92],g).setLocalEulerAngles(side*28,0,side*25);for(const yy of [-.28,0,.28]){const leg=this.shape('Borer leg','capsule',0x241610,[.045,.48,.045],[side*.48,yy,.08],g);leg.setLocalEulerAngles(0,0,side*62);}}
    }
    if(!d.obstacle){const marker=this.shape('Item marker','cylinder',d.good?0xf5d85c:0xe66b49,[.72,.025,.72],[0,-.72,0],g);marker.render.material=this.mat(d.good?0xf5d85c:0xe66b49,.45);}
    g.setPosition(GAME.lanes[lane],d.obstacle?.2:1.35,z);g.type=type;g.baseY=g.getPosition().y;g.hit=false;this.items.push(g);return g;
  }
  spawnPattern(){const safe=Math.floor(Math.random()*3),hazards=['rock','green','leaf','branch','borer'],danger=hazards[Math.floor(Math.random()*hazards.length)],phase=this.elapsed<8?0:this.elapsed<20?1:2;const reward=Math.random()<.055?'golden':Math.random()<.045?'shield':'ripe';if(phase===0){this.makeItem(reward,safe,GAME.spawnZ);if(Math.random()<.6)this.makeItem(danger,(safe+1)%3,GAME.spawnZ);}else if(phase===1){for(let lane=0;lane<3;lane++)this.makeItem(lane===safe?reward:danger,lane,GAME.spawnZ);if(Math.random()<.55)this.makeItem('ripe',pc.math.clamp(safe+(Math.random()<.5?-1:1),0,2),GAME.spawnZ-5);}else{const next=pc.math.clamp(safe+(Math.random()<.5?-1:1),0,2);for(let lane=0;lane<3;lane++)this.makeItem(lane===safe?reward:danger,lane,GAME.spawnZ);this.makeItem('ripe',next,GAME.spawnZ-5);this.makeItem('ripe',safe,GAME.spawnZ-10);}}
  start(){for(const item of this.items)item.destroy();for(const fx of this.effects)fx.destroy();this.items=[];this.effects=[];Object.assign(this,{mode:'playing',score:0,combo:0,maxCombo:0,collected:0,mistakes:0,golden:0,shield:false,time:GAME.duration,speed:GAME.baseSpeed,targetLane:1,y:0,velocityY:0,spawnDistance:16,elapsed:0,cameraShake:0,hudTick:0,finalRush:false});this.player.setPosition(0,0,GAME.playerZ);this.player.setEulerAngles(0,0,0);this.emit('hud');}
  move(d){if(this.mode==='playing')this.targetLane=pc.math.clamp(this.targetLane+d,0,2);} jump(){if(this.mode==='playing'&&this.y<.02)this.velocityY=GAME.jumpVelocity;}
  emit(name,detail={}){this.dispatchEvent(new CustomEvent(name,{detail:{score:this.score,combo:this.combo,time:this.time,...detail}}));}
  collect(item){const d=ITEMS[item.type];item.hit=true;if(d.powerup==='shield'){this.shield=true;this.emit('feedback',{good:true,text:'PROTEÇÃO ATIVADA'});}else if(d.good){this.combo++;this.maxCombo=Math.max(this.maxCombo,this.combo);this.collected++;if(item.type==='golden')this.golden++;const m=1+Math.min(4,Math.floor(this.combo/5));this.score+=d.points*m;this.emit('feedback',{good:true,text:`+${d.points*m} ${d.label.toUpperCase()}`});}else if(this.shield){this.shield=false;this.emit('feedback',{good:true,text:'PROTEÇÃO SALVOU VOCÊ'});}else{this.combo=0;this.mistakes++;this.score=Math.max(0,this.score+d.points);this.cameraShake=.22;this.emit('feedback',{good:false,text:`${d.points} ${d.label.toUpperCase()}`});}item.destroy();this.emit('hud');}
  update(dt){
    if(this.mode!=='playing')return;this.elapsed+=dt;this.time=Math.max(0,GAME.duration-this.elapsed);const phaseBoost=this.elapsed<8?0:this.elapsed<20?2:5;this.speed=Math.min(GAME.maxSpeed,GAME.baseSpeed+phaseBoost+this.elapsed*.08);if(this.time<=5&&!this.finalRush){this.finalRush=true;this.emit('rush');}
    const targetX=GAME.lanes[this.targetLane],pos=this.player.getPosition();this.player.setPosition(pc.math.lerp(pos.x,targetX,Math.min(1,dt*12)),this.y,GAME.playerZ);
    if(this.velocityY||this.y>0){this.velocityY-=GAME.gravity*dt;this.y=Math.max(0,this.y+this.velocityY*dt);if(!this.y)this.velocityY=0;}
    const bounce=Math.abs(Math.sin(this.elapsed*11.5));this.player.body.setLocalPosition(0,bounce*.09,0);this.player.body.setLocalScale(1+bounce*.025,1-bounce*.035,1+bounce*.025);this.player.limbs.forEach(l=>l.setLocalEulerAngles(Math.sin(this.elapsed*11.5+l.phase)*42,0,0));this.player.scarf.setLocalEulerAngles(0,0,-20+Math.sin(this.elapsed*9)*8);
    for(const row of this.rows){row.translate(0,0,this.speed*dt);if(row.getPosition().z>16)row.translate(0,0,-108);}
    this.spawnDistance-=this.speed*dt;if(this.spawnDistance<=0){this.spawnPattern();this.spawnDistance=(this.elapsed<8?14:this.elapsed<20?11:9)+Math.random()*2;}
    for(const item of this.items){if(item.hit)continue;item.translate(0,0,this.speed*dt);item.rotateLocal(0,dt*(ITEMS[item.type].obstacle?18:95),0);if(!ITEMS[item.type].obstacle){const p=item.getPosition();item.setPosition(p.x,item.baseY+Math.sin(this.elapsed*4+p.z)*.12,p.z);}const p=item.getPosition(),pp=this.player.getPosition(),same=Math.abs(p.x-pp.x)<1.05,near=Math.abs(p.z-GAME.playerZ)<1.15,jumped=ITEMS[item.type].obstacle&&this.y>1.05;if(same&&near&&!jumped)this.collect(item);}
    this.items=this.items.filter(i=>{if(i.hit)return false;if(i.getPosition().z>GAME.despawnZ){i.destroy();return false;}return true;});
    const cp=this.camera.getPosition(),shake=this.cameraShake>0?(Math.random()-.5)*this.cameraShake:0;this.camera.setPosition(pc.math.lerp(cp.x,this.player.getPosition().x*.16+shake,dt*7),this.baseCameraY+Math.sin(this.elapsed*8)*.035,this.cameraZ);this.camera.lookAt(this.player.getPosition().x*.08,2,-12);if(this.cameraShake>0)this.cameraShake-=dt;
    this.hudTick-=dt;if(this.hudTick<=0){this.emit('hud',{shield:this.shield});this.hudTick=.1;}if(this.time<=0){this.mode='ended';this.emit('end',{collected:this.collected,mistakes:this.mistakes,maxCombo:this.maxCombo,golden:this.golden,accuracy:Math.round(this.collected/Math.max(1,this.collected+this.mistakes)*100)});}
  }
  resize(){const w=this.container.clientWidth,h=this.container.clientHeight,portrait=w/h<.7;this.baseCameraY=portrait?8.7:6.55;this.cameraZ=portrait?19:15.1;this.camera.camera.fov=portrait?65:50;this.camera.setPosition(0,this.baseCameraY,this.cameraZ);this.camera.lookAt(0,2,-16);this.app.resizeCanvas(w,h);}
}
