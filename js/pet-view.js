// Runtime animation only; all persistent actions go through Pet.tx.
const PetView = {
  active:false, busy:false, epoch:0, timers:[], idleTimer:null, lastReaction:null, panel:'food', buyUntil:0,
  priorities:{idle:0,react:1,inspect:2,eat:3,play:3,celebrate:4},
  state:'idle', reduced:window.matchMedia('(prefers-reduced-motion: reduce)'),
  esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));},
  token(){return 'pet-'+Date.now()+'-'+Math.random().toString(36).slice(2);},
  stop(){clearInterval(this.poseTimer);this.poseTimer=null;this.active=false;this.epoch++;this.timers.forEach(clearTimeout);this.timers=[];clearTimeout(this.idleTimer);this.busy=false;this.state='idle';},
  later(fn,ms,realTime=false){const e=this.epoch;const t=setTimeout(()=>{if(this.active&&this.epoch===e)fn();},this.reduced.matches&&!realTime?0:ms);this.timers.push(t);},
  // KIND lives in Pet data; artwork revisions only change these assets and frame rectangles.
  artVersion:'20261007dog2', poseTimer:null, artSerial:0,
  poses:{idle:0,walk:1,sit:2,sleep:3,wake:4,eat:5,wag:6,tilt:7,hop:8,sniff:9,chase:10,happy:11,celebrate:12,rest:15},
  frameRects:[[[35,56,308,294],[353,55,626,291],[668,56,907,293],[949,114,1231,293],[40,368,308,581],[348,389,620,579],[646,347,914,582],[972,339,1215,583],[50,623,298,878],[334,681,600,883],[656,658,950,881],[980,673,1219,894],[56,902,279,1188],[354,961,626,1175],[670,945,941,1176],[950,1003,1229,1179]],[[25,37,317,304],[343,39,644,298],[682,36,901,302],[946,121,1230,296],[25,347,312,607],[353,348,617,590],[647,340,926,602],[973,347,1231,604],[50,626,294,890],[338,656,613,882],[639,647,954,882],[1009,642,1231,894],[49,905,268,1202],[327,938,638,1189],[667,918,933,1195],[945,1008,1229,1189]],[[10,26,317,313],[333,31,657,307],[682,32,938,312],[949,140,1249,313],[17,321,326,615],[344,328,646,598],[652,348,950,616],[988,336,1242,616],[27,621,286,892],[322,632,621,895],[638,656,962,906],[991,635,1234,916],[21,889,289,1217],[313,928,649,1205],[659,920,954,1213],[930,1033,1244,1210]]],
  artPath(stage){return 'assets/pet/dog-fluffy-brown-stage'+stage+'-v2.png?v='+this.artVersion;},
  bowPath(){return 'assets/pet/bow-blue-tuft-v1.png?v='+this.artVersion;},
  artStyle(){
    if(document.getElementById('petArtStyle'))return;
    const style=document.createElement('style');style.id='petArtStyle';
    // The painted poses already contain their anatomy: do not squash sleep or rotate sniff again.
    style.textContent='#screenPet .pet-actor{width:210px;height:210px}#screenPet .pet-actor svg{rotate:0;scale:1}#screenPet .pet-stage-0 svg{scale:.85}#screenPet .pet-stage-2 svg{scale:1.1}';
    document.head.appendChild(style);
  },
  positionActor(left){
    const actor=document.getElementById('petActor'),room=document.getElementById('petRoom');if(!actor||!room)return;
    const scale=Pet.snapshot()?.stage===2?1.1:1;
    const margin=Math.min(49,(actor.offsetWidth*scale/2+8)/room.clientWidth*100);
    actor.style.left=Math.max(margin,Math.min(100-margin,left))+'%';
  },
  svg(stage=0,pose='idle',frame,bow=false){
    stage=Number.isInteger(stage)&&stage>=0&&stage<=2?stage:0;
    const index=Number.isInteger(frame)&&frame>=0&&frame<16?frame:(Object.hasOwn(this.poses,pose)?this.poses[pose]:0);
    const [x,y,right,bottom]=this.frameRects[stage][index], w=right-x, h=bottom-y;
    const left=(360-w)/2, top=350-h, clip='pet-art-'+(++this.artSerial);
    // Two v2 atlas corners contain a few pixels from a neighboring pose.
    const corners=stage===2&&index===12?[[21,897],[126,897],[126,889],[289,889],[289,1217],[21,1217]]:
      stage===2&&index===15?[[960,1033],[1244,1033],[1244,1210],[930,1210],[930,1080],[960,1080]]:null;
    const region=corners?'<polygon points="'+corners.map(([px,py])=>(px-x+left)+','+(py-y+top)).join(' ')+'"/>':'<rect x="'+left+'" y="'+top+'" width="'+w+'" height="'+h+'"/>';
    // Only the baby accessory is approved. Separate overlay, never baked into the atlas or profile.
    const anchors=[[150,60],[499,60],[787,62],[1060,140],[133,398],[455,429],[755,350],[1096,340],[170,630],[463,730],[829,662],[1097,675],[166,907],[506,964],[786,949],[1099,1018]];
    let accessory='';
    if(bow&&stage===0){const [hx,hy]=anchors[index], ax=left+hx-x-55, ay=top+hy-y-50;accessory='<image data-pet-accessory="bow-blue" href="'+this.bowPath()+'" x="'+ax+'" y="'+ay+'" width="110" height="73.333"'+(pose==='tilt'?' transform="rotate(-12 '+(ax+55)+' '+(ay+50)+')"':'')+'/>';}
    // Clip the atlas in SVG at render time; generated PNGs are preserved untouched.
    return '<svg viewBox="0 0 360 360" aria-hidden="true" data-pet-pose="'+this.esc(pose)+'" data-pet-stage="'+stage+'" data-pet-frame="'+index+'"><defs><clipPath id="'+clip+'">'+region+'</clipPath></defs><image href="'+this.artPath(stage)+'" x="'+(left-x)+'" y="'+(top-y)+'" width="1254" height="1254" clip-path="url(#'+clip+')"/>'+accessory+'</svg>';
  },
  setPose(pose){
    clearInterval(this.poseTimer);this.poseTimer=null;
    const actor=document.getElementById('petActor'), pet=Pet.snapshot();if(!actor||!pet)return;
    const paint=frame=>{const previous=actor.querySelector('svg');if(previous)previous.outerHTML=this.svg(pet.stage,pose,frame);};
    paint();
    const frames=pose==='walk'?[1,13]:pose==='wag'?[6,14]:null;
    if(frames&&!this.reduced.matches&&this.active&&!document.hidden){let i=0;this.poseTimer=setInterval(()=>{if(!this.active||document.hidden||this.reduced.matches){clearInterval(this.poseTimer);this.poseTimer=null;return;}paint(frames[++i%frames.length]);},pose==='walk'?320:420);}
  },
  open(){
    this.stop();this.active=true;this.render();
    const pet=Pet.snapshot();if(pet){const r=Pet.visit();if(r.ok)this.perform(r.action);}
    this.idle();
  },
  resume(){this.active=true;this.render();if(this.buyUntil>Date.now())this.later(()=>this.renderPanel(),this.buyUntil-Date.now(),true);this.idle();},
  showPanel(panel,message){
    if(this.busy)return;
    this.panel=panel;this.renderPanel();if(message)this.say(message);
    if(window.matchMedia('(max-width:750px)').matches)document.getElementById('petPanel')?.scrollIntoView({behavior:this.reduced.matches?'instant':'smooth',block:'start'});
  },
  feedNow(){
    if(this.busy)return;
    const p=Pet.snapshot();if(!p)return;
    if(p.day.date===Pet.dateKey()&&p.day.meals>=Pet.DAILY_MEALS){this.react();this.showPanel('food','Hôm nay cún đã ăn đủ để lớn rồi 💛 Mai lớn tiếp nhé.');return;}
    const id=p.bag.kibble>0?'kibble':p.bag.treat>0?'treat':null;
    if(id)this.commit(()=>Pet.feed(id,this.token()));
    else this.showPanel('food','Túi hết đồ ăn rồi. Con có thể mua thêm ở đây nhé.');
  },
  buy(fn){
    if(this.busy||Date.now()<this.buyUntil)return;
    const r=this.commit(fn);
    if(r?.ok){this.buyUntil=Date.now()+600;this.renderPanel();this.later(()=>this.renderPanel(),600,true);}
  },
  render(){
    clearInterval(this.poseTimer);this.poseTimer=null;
    this.artStyle();
    const host=document.getElementById('screenPet');if(!host)return;
    const p=Pet.snapshot(), stars=Storage.load().stars||0;
    host.innerHTML='<div class="pet-heading"><div><h2>🐶 Nhà cún</h2><p>Một người bạn nhỏ, lớn lên cùng con.</p></div><b>⭐ '+this.esc(stars)+'</b></div>';
    if(!p){
      const earned=Pet.adoptionRight();
      host.innerHTML+='<div class="pet-card pet-adopt"><div class="pet-preview">'+this.svg()+'</div><h3>'+(earned?'Con đã sẵn sàng đón cún về nhà!':'Thử thách đón cún 🐶')+'</h3>'+
        (earned?'<form id="petAdopt"><input name="petName" maxlength="20" value="'+this.esc(Pet.recoveryName())+'" aria-label="Tên cún" required><button>Đón cún về nhà</button></form><p>Miễn phí · kèm 6 phần hạt và đồ dùng cơ bản.</p>':'<p>15 câu: 5 Toán · 5 Tiếng Việt · 5 Tiếng Anh.<br>Hoàn thành lượt để nhận cún. Không giới hạn thời gian hay điểm tối thiểu.</p><button id="petChallenge">Làm thử thách đón cún</button>')+
        '<p id="petStatus" role="status" aria-live="polite"></p></div>';
      const f=document.getElementById('petAdopt');if(f)f.onsubmit=e=>{e.preventDefault();this.commit(()=>Pet.adopt(f.elements.petName.value,this.token()));};
      const c=document.getElementById('petChallenge');if(c)c.onclick=()=>{if(!this.active)return;c.disabled=true;const r=Pet.startChallenge();if(!r.ok){c.disabled=false;this.say(r.error==='questions'?'Chưa chuẩn bị được đủ 5 câu phù hợp cho môn '+r.subject+'. Mình thử lại sau nhé.':'Con chưa bắt đầu được thử thách.');}};
      return;
    }
    const today=Pet.dateKey(), meals=p.day.date===today?p.day.meals:0, labels=['Cún sơ sinh','Cún lớn vừa','Trưởng thành'];
    host.innerHTML+='<div class="pet-layout"><div class="pet-card"><div class="pet-room pet-wall-'+p.room.wall.split('-').pop()+'" id="petRoom"><div class="pet-window"></div><span class="pet-plant pet-color-'+p.room.plant.split('-').pop()+'">🪴</span><div class="pet-bed pet-color-'+p.room.bed.split('-').pop()+'"></div><div class="pet-rug pet-color-'+p.room.rug.split('-').pop()+'"></div><span class="pet-bowl pet-color-'+p.room.bowl.split('-').pop()+'">🍲</span><span class="pet-toy pet-color-'+p.room.toy.split('-').pop()+'">🎾</span><div class="pet-speech" id="petSpeech">Gâu! Mình ở đây nè 💛</div><button class="pet-actor pet-stage-'+p.stage+'" id="petActor" aria-label="Vuốt ve cún">'+this.svg(p.stage)+'</button></div><div class="pet-name"><b>'+this.esc(p.name)+'</b><button id="petRename">Đổi tên</button><span>'+labels[p.stage]+'</span></div><div class="pet-growth"><label>Đang lớn lên · '+p.growth+' bữa lớn</label><progress max="'+(p.stage===0?10:30)+'" value="'+Math.min(p.growth,30)+'"></progress><p>'+meals+'/3 bữa lớn hôm nay · '+(meals===3?'Mai lớn tiếp nhé 💛':'Mỗi bữa giúp cún lớn thêm.')+'</p></div><div class="pet-actions"><button id="petFood">🍲 Cho ăn</button><button id="petPlay">🎾 Chơi cùng</button><button id="petDecor">🏡 Trang trí</button></div><p id="petStatus" role="status" aria-live="polite"></p></div><aside class="pet-card" id="petPanel"></aside></div>';
    document.getElementById('petActor').onclick=()=>this.react();
    document.getElementById('petFood').onclick=()=>this.feedNow();
    document.getElementById('petDecor').onclick=()=>this.showPanel('decor');
    document.getElementById('petPlay').onclick=()=>this.perform('play');
    document.getElementById('petRename').onclick=()=>{if(this.busy)return;const name=window.prompt('Con muốn đặt tên gì?',p.name);if(name!==null)this.commit(()=>Pet.rename(name,this.token()));};
    this.renderPanel();this.buttons();
  },
  renderPanel(){
    const h=document.getElementById('petPanel'),p=Pet.snapshot();if(!h||!p)return;
    if(this.panel==='food'){
      const full=p.day.date===Pet.dateKey()&&p.day.meals>=3;
      h.innerHTML='<h3>Đồ ăn cho cún</h3>'+(full?'<p>Hôm nay cún đã ăn đủ để lớn rồi 💛 Mai lớn tiếp nhé.</p>':'')+
        Object.entries(Pet.FOODS).map(([id,f])=>'<div class="pet-item"><b>'+this.esc(f.name)+'</b><small>Trong túi: '+p.bag[id]+'</small><button data-feed="'+id+'" '+(this.busy?'disabled':'')+'>'+ (full?'Vẫy đuôi': 'Cho ăn')+'</button><button data-food="'+id+'" '+(f.price===null||this.busy?'disabled':'')+'>'+ (f.price===null?'Chờ chốt giá':'Mua · '+f.price+' ⭐')+'</button></div>').join('');
      h.querySelectorAll('[data-feed]').forEach(b=>b.onclick=()=>{if(full){this.react();return;}this.commit(()=>Pet.feed(b.dataset.feed,this.token()));});
      h.querySelectorAll('[data-food]').forEach(b=>{if(Date.now()<this.buyUntil)b.disabled=true;b.onclick=()=>this.buy(()=>Pet.buyFood(b.dataset.food,this.token()));});
    }else{
      h.innerHTML='<h3>Góc trang trí</h3><p>Đồ đã có có thể dùng lại.</p>'+Object.entries(Pet.ITEMS).map(([id,item])=>{
        const owned=item.free||p.owned.includes(id), equipped=p.room[item.slot]===id;
        return '<div class="pet-item"><b>'+this.esc(item.name)+'</b><button data-item="'+id+'" '+(equipped||this.busy||!owned&&item.price===null?'disabled':'')+'>'+ (equipped?'Đang dùng':owned?'Đặt vào phòng':item.price===null?'Chờ chốt giá':'Mua · '+item.price+' ⭐')+'</button></div>';
      }).join('');
      h.querySelectorAll('[data-item]').forEach(b=>{const id=b.dataset.item,owned=Pet.ITEMS[id].free||p.owned.includes(id);if(!owned&&Date.now()<this.buyUntil)b.disabled=true;b.onclick=()=>owned?this.commit(()=>Pet.equip(id,this.token())):this.buy(()=>Pet.buyItem(id,this.token()));});
    }
  },
  buttons(){document.querySelectorAll('#screenPet .pet-actions button,#petRename').forEach(b=>b.disabled=this.busy);},
  say(text){const a=document.getElementById('petSpeech'),b=document.getElementById('petStatus');if(a)a.textContent=text;if(b)b.textContent=text;},
  commit(fn){
    if(this.busy)return;
    this.busy=true;this.buttons();const r=fn();this.busy=false;
    if(!r.ok){const errors={full:'Hôm nay cún đã ăn đủ để lớn rồi 💛',food:'Túi hết đồ ăn rồi.',stars:'Con chưa đủ sao.',guest:'Con nhập tên trước nhé.',save:'Chưa lưu được. Mình thử lại sau nhé.', 'price-pending':'Giá đang chờ chốt.',owned:'Con đã có món này rồi.'};this.buttons();this.say(errors[r.error]||'Mình chưa thực hiện được.');return;}
    this.render();if(r.action==='adopt'){this.say('Chào con! Cùng chăm mình nhé 💛');this.idle();}
    else if(r.action==='eat')this.perform(r.celebrate?'celebrate':'eat',r.food);
    else if(r.action==='inspect')this.perform('inspect',r.slot);
    else this.say('Đã lưu rồi 💛');
    return r;
  },
  react(){
    const actor=document.getElementById('petActor');if(!actor)return;
    if(this.busy){const heart=document.createElement('span');heart.className='pet-heart';heart.textContent='💛';actor.appendChild(heart);this.later(()=>heart.remove(),900);return;}
    this.state='react';
    const choices=['wag','tilt','hop'].filter(x=>x!==this.lastReaction);this.lastReaction=choices[Math.floor(Math.random()*choices.length)];
    actor.className='pet-actor pet-stage-'+Pet.snapshot().stage+' pet-'+this.lastReaction;this.setPose(this.lastReaction);this.say('Thích quá! 💛');
    this.later(()=>{actor.className='pet-actor pet-stage-'+Pet.snapshot().stage;this.state='idle';this.setPose('idle');this.idle();},1300);
  },
  perform(action,slot){
    const priority=this.priorities[action]||0;
    if(!this.active||(this.busy&&priority<=(this.priorities[this.state]||0)))return;
    this.timers.forEach(clearTimeout);this.timers=[];clearTimeout(this.idleTimer);
    this.busy=true;this.state=action;this.buttons();this.renderPanel();
    const a=document.getElementById('petActor');if(!a){this.busy=false;return;}
    const stage=Pet.snapshot().stage;
    const move=(left,cls)=>{this.positionActor(left);a.className='pet-actor pet-stage-'+stage+' pet-'+cls;this.setPose(cls);};
    if(action==='eat'||action==='celebrate'){
      move(22,'walk');this.say('Có đồ ăn rồi! Mình tới ngay.');
      this.later(()=>{move(22,'eat');this.say('Măm măm… ngon quá!');},1600);
      this.later(()=>{move(40,action==='celebrate'?'celebrate':slot==='treat'?'hop':'happy');this.say(action==='celebrate'?'Mình lớn thêm rồi! 💛':slot==='treat'?'Bánh thưởng! Vui quá, cảm ơn con 💛':'No rồi! Cảm ơn con 💛');},3200);
    }else if(action==='play'){move(76,'chase');this.say('Mình đuổi theo bóng nhé!');this.later(()=>move(76,'hop'),1600);this.later(()=>move(48,'walk'),2600);this.later(()=>move(48,'happy'),3300);}
    else if(action==='inspect'){move(slot==='bowl'?22:slot==='plant'||slot==='bed'?75:50,'walk');this.say('Nhà mới đẹp quá!');this.later(()=>move(50,'happy'),1800);}
    else if(action==='wake'){move(48,'sleep');this.say('Cún đang ngủ…');this.later(()=>{move(48,'wake');this.say('Mình dậy rồi! Chào con 💛');},1100);this.later(()=>move(48,'happy'),2400);}
    else {move(48,'walk');this.say('Con về rồi! Mình vui quá!');this.later(()=>move(48,'happy'),2000);}
    this.later(()=>{move(48,'idle');this.busy=false;this.state='idle';this.buttons();this.renderPanel();this.idle();},action==='eat'||action==='celebrate'?4700:3900);
  },
  idle(){
    clearTimeout(this.idleTimer);if(!this.active)return;
    this.idleTimer=setTimeout(()=>{
      if(!this.active)return;
      if(!this.busy&&!document.hidden){const a=document.getElementById('petActor'),p=Pet.snapshot();if(a&&p){const actions=['walk','sniff','rest','sit','sleep'];const action=actions[Math.floor(Math.random()*actions.length)];a.className='pet-actor pet-stage-'+p.stage+' pet-'+action;this.setPose(action);if(action==='walk')this.positionActor(30+Math.random()*40);if(action==='sniff')this.positionActor(72);}}
      this.idle();
    },6000+Math.random()*6000);
  }
};
window.PetView=PetView;
PetView.reduced.addEventListener('change',()=>{if(PetView.active){const pose=document.querySelector('#petActor>svg')?.dataset.petPose;if(pose)PetView.setPose(pose);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)PetView.stop();else if(document.getElementById('screenPet')?.classList.contains('active'))PetView.resume();});
