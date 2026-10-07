// Runtime animation only; all persistent actions go through Pet.tx.
const PetView = {
  active:false, busy:false, epoch:0, timers:[], idleTimer:null, lastReaction:null, panel:'food', buyUntil:0,
  priorities:{idle:0,react:1,inspect:2,eat:3,play:3,celebrate:4},
  state:'idle', reduced:window.matchMedia('(prefers-reduced-motion: reduce)'),
  esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));},
  token(){return 'pet-'+Date.now()+'-'+Math.random().toString(36).slice(2);},
  stop(){clearInterval(this.poseTimer);this.poseTimer=null;cancelAnimationFrame(this.depthFrame);this.depthFrame=null;this.active=false;this.epoch++;this.timers.forEach(clearTimeout);this.timers=[];clearTimeout(this.idleTimer);this.busy=false;this.state='idle';},
  later(fn,ms,realTime=false){const e=this.epoch;const t=setTimeout(()=>{if(this.active&&this.epoch===e)fn();},this.reduced.matches&&!realTime?0:ms);this.timers.push(t);},
  // KIND lives in Pet data; artwork revisions only change these assets and frame rectangles.
  artVersion:'20261007dog3', poseTimer:null, artSerial:0,
  poses:{idle:0,walk:1,sit:2,sleep:3,wake:4,eat:5,wag:6,tilt:7,hop:8,sniff:9,chase:10,happy:11,celebrate:12,rest:15},
  frameRects:[[[35,56,308,294],[353,55,626,291],[668,56,907,293],[949,114,1231,293],[40,368,308,581],[348,389,620,579],[646,347,914,582],[972,339,1215,583],[50,623,298,878],[334,681,600,883],[656,658,950,881],[980,673,1219,894],[56,902,279,1188],[354,961,626,1175],[670,945,941,1176],[950,1003,1229,1179]],[[25,37,317,304],[343,39,644,298],[682,36,901,302],[946,121,1230,296],[25,347,312,607],[353,348,617,590],[647,340,926,602],[973,347,1231,604],[50,626,294,890],[338,656,613,882],[639,647,954,882],[1009,642,1231,894],[49,905,268,1202],[327,938,638,1189],[667,918,933,1195],[945,1008,1229,1189]],[[10,26,317,313],[333,31,657,307],[682,32,938,312],[949,140,1249,313],[17,321,326,615],[344,328,646,598],[652,348,950,616],[988,336,1242,616],[27,621,286,892],[322,632,621,895],[638,656,962,906],[991,635,1234,916],[21,889,289,1217],[313,928,649,1205],[659,920,954,1213],[930,1033,1244,1210]]],
  artPath(stage){return 'assets/pet/dog-fluffy-brown-stage'+stage+'-v2.webp?v='+this.artVersion;},
  bowPath(){return 'assets/pet/bow-blue-tuft-v1.webp?v='+this.artVersion;},
  depthFrame:null,
  positionActor(point,instant=false){
    const actor=document.getElementById('petActor'),pet=Pet.snapshot();if(!actor||!pet)return;
    cancelAnimationFrame(this.depthFrame);this.depthFrame=null;
    const t=PetRoom.template(pet.room),p=PetRoom.clamp(pet.room,point,pet.stage,window.innerWidth);
    if(instant)actor.style.transition='none';
    this.actorPoint=p;actor.style.left=(p.x/t.width*100)+'%';actor.style.top=(p.y/t.height*100)+'%';
    const current=this.syncActorDepth();
    if(instant){actor.getBoundingClientRect();actor.style.transition='';return;}
    // Native CSS moves the dog; depth must follow its displayed foot, not jump to the destination.
    if(this.active&&!this.reduced.matches&&Math.abs(current-p.y)>.2){
      const start=performance.now(),tick=()=>{
        if(!this.active||document.hidden){this.depthFrame=null;return;}
        const y=this.syncActorDepth();
        this.depthFrame=Math.abs(y-p.y)>.2&&performance.now()-start<2000?requestAnimationFrame(tick):null;
      };
      this.depthFrame=requestAnimationFrame(tick);
    }
  },
  syncActorDepth(){
    const actor=document.getElementById('petActor'),room=document.getElementById('petRoom');
    if(!actor||!room)return this.actorPoint?.y||0;
    const y=parseFloat(getComputedStyle(actor).top)/room.clientHeight*PetRoom.template({template:room.dataset.template}).height;
    actor.dataset.roomY=Number.isFinite(y)?y:this.actorPoint.y;this.orderScene();return Number(actor.dataset.roomY);
  },
  orderScene(){
    const nodes=[...document.querySelectorAll('#petRoom [data-room-layer]')];
    const ordered=PetRoom.order(nodes.map(node=>({id:node.id,layer:node.dataset.roomLayer,y:Number(node.dataset.roomY),node})));
    ordered.forEach((entry,i)=>{if(entry.node.style.zIndex!==String(i+1))entry.node.style.zIndex=i+1;});
  },
  roomStage(p){
    const t=PetRoom.template(p.room),wall=PetRoom.ITEMS[p.room.slots.wall],bg=t.background,win=bg.window;
    const v=PetRoom.viewport(p.room,window.innerWidth);
    const place=(item)=>'left:'+item.x/t.width*100+'%;top:'+item.y/t.height*100+'%;width:'+item.w/t.width*100+'%;height:'+item.h/t.height*100+'%;';
    let html='<div class="pet-room" id="petRoom" data-template="'+this.esc(t.id)+'" style="--room-ratio:'+v.w+'/'+t.height+';--room-wall:'+this.esc(wall.tint||bg.wall)+';--room-floor:'+this.esc(bg.floor)+';--room-horizon:'+bg.horizon/t.height*100+'%"><div id="petCanvas" class="pet-canvas" style="width:'+t.width/v.w*100+'%;left:'+(-v.x/v.w*100)+'%">';
    if(bg.img)html+='<img class="pet-room-background" src="'+this.esc(bg.img)+'" alt="">';
    else if(win)html+='<div class="pet-stage-window" style="'+place(win)+'"></div>';
    // Existing paid wall colours still work with a painted background; do not tint floor or furniture.
    if(bg.img&&wall.id!=='wall-default')html+='<div class="pet-wall-art-tint" data-wall-id="'+this.esc(wall.id)+'" style="height:'+bg.horizon/t.height*100+'%;background:'+this.esc(wall.id==='wall-pink'?'#f2a1bf':'#95c9f3')+'"></div>';
    for(const slot of Object.keys(t.slots)){
      const entry=PetRoom.placement(p.room,slot),item=entry.item;
      const image=item.img?'<img src="'+this.esc(item.img)+'" alt="">':slot==='plant'||slot==='bowl'||slot==='toy'?'<svg viewBox="0 0 '+entry.w+' '+entry.h+'" aria-hidden="true"><text x="50%" y="85%" text-anchor="middle" font-size="'+Math.min(entry.w,entry.h)*.85+'">'+({plant:'🪴',bowl:'🍲',toy:'🎾'})[slot]+'</text></svg>':'';
      html+='<div id="petSlot-'+slot+'" class="pet-room-prop pet-prop-'+slot+(slot==='bed'?'-back':'')+'" data-room-layer="'+entry.layer+'" data-room-y="'+entry.y+'" data-item-id="'+this.esc(item.id)+'" style="'+place(entry)+'--prop-tint:'+this.esc(item.placeholderTint||'#a5c8db')+'">'+image+'</div>';
      if(entry.frontLayer)html+='<div id="petSlot-'+slot+'-front" class="pet-room-prop pet-prop-'+slot+'-front" data-room-layer="'+entry.frontLayer+'" data-room-y="'+entry.frontDepthY+'" style="'+place(entry)+'--prop-tint:'+this.esc(item.placeholderTint||'#a5c8db')+'">'+(item.frontImg?'<img src="'+this.esc(item.frontImg)+'" alt="">':'<span class="pet-bed-lip"></span>')+'</div>';
    }
    const width=t.dog.widthByStage[p.stage];
    html+='<button class="pet-actor pet-stage-'+p.stage+'" id="petActor" data-room-layer="depth" data-room-y="'+t.dog.spawn.y+'" aria-label="Vuốt ve cún" style="width:'+width/t.width*100+'%;height:'+width/t.height*100+'%">'+this.svg(p.stage)+'</button>';
    return html+'<div class="pet-speech" id="petSpeech" style="left:'+t.dog.speech.x/t.width*100+'%;top:'+t.dog.speech.y/t.height*100+'%">Gâu! Mình ở đây nè 💛</div></div></div>';
  },
  resizeRoom(){
    if(!this.active)return;
    const p=Pet.snapshot(),room=document.getElementById('petRoom'),canvas=document.getElementById('petCanvas');
    if(!this.active||!p||!room||!canvas)return;
    const t=PetRoom.template(p.room),v=PetRoom.viewport(p.room,window.innerWidth);
    room.style.setProperty('--room-ratio',v.w+'/'+t.height);canvas.style.width=t.width/v.w*100+'%';canvas.style.left=-v.x/v.w*100+'%';
    this.positionActor(this.actorPoint||t.dog.spawn,true);
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
    cancelAnimationFrame(this.depthFrame);this.depthFrame=null;
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
    host.innerHTML+='<div class="pet-layout"><div class="pet-card">'+this.roomStage(p)+'<div class="pet-name"><b>'+this.esc(p.name)+'</b><button id="petRename">Đổi tên</button><span>'+labels[p.stage]+'</span></div><div class="pet-growth"><label>Đang lớn lên · '+p.growth+' bữa lớn</label><progress max="'+(p.stage===0?10:30)+'" value="'+Math.min(p.growth,30)+'"></progress><p>'+meals+'/3 bữa lớn hôm nay · '+(meals===3?'Mai lớn tiếp nhé 💛':'Mỗi bữa giúp cún lớn thêm.')+'</p></div><div class="pet-actions"><button id="petFood">🍲 Cho ăn</button><button id="petPlay">🎾 Chơi cùng</button><button id="petDecor">🏡 Trang trí</button></div><p id="petStatus" role="status" aria-live="polite"></p></div><aside class="pet-card" id="petPanel"></aside></div>';
    document.getElementById('petActor').onclick=()=>this.react();
    document.getElementById('petFood').onclick=()=>this.feedNow();
    document.getElementById('petDecor').onclick=()=>this.showPanel('decor');
    document.getElementById('petPlay').onclick=()=>this.perform('play');
    document.getElementById('petRename').onclick=()=>{if(this.busy)return;const name=window.prompt('Con muốn đặt tên gì?',p.name);if(name!==null)this.commit(()=>Pet.rename(name,this.token()));};
    this.positionActor(PetRoom.template(p.room).dog.spawn);this.renderPanel();this.buttons();
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
        const owned=item.free||p.owned.includes(id), equipped=p.room.slots[item.slot]===id;
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
    if(this.busy){
      const room=document.getElementById('petCanvas'),style=getComputedStyle(actor);
      const heart=document.createElement('span');heart.className='pet-heart';heart.textContent='💛';
      heart.style.left=parseFloat(style.left)/room.clientWidth*100+'%';heart.style.top=(parseFloat(style.top)-actor.offsetHeight*.8)/room.clientHeight*100+'%';
      room.appendChild(heart);this.later(()=>heart.remove(),900);return;
    }
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
    const pet=Pet.snapshot(),stage=pet.stage,t=PetRoom.template(pet.room),home=t.dog.spawn;
    const target=does=>PetRoom.target(pet.room,does)||home;
    const move=(point,pose,instant=false)=>{this.positionActor(point,instant);a.className='pet-actor pet-stage-'+stage+' pet-'+pose;this.setPose(pose);};
    if(action==='eat'||action==='celebrate'){
      const spot=target('eat');move(spot,'walk');this.say('Có đồ ăn rồi! Mình tới ngay.');
      this.later(()=>{move(spot,'eat');this.say('Măm măm… ngon quá!');},1600);
      this.later(()=>{move(home,action==='celebrate'?'celebrate':slot==='treat'?'hop':'happy');this.say(action==='celebrate'?'Mình lớn thêm rồi! 💛':slot==='treat'?'Bánh thưởng! Vui quá, cảm ơn con 💛':'No rồi! Cảm ơn con 💛');},3200);
    }else if(action==='play'){
      const spot=target('play');move(spot,'chase');this.say('Mình đuổi theo bóng nhé!');
      this.later(()=>move(spot,'hop'),1600);this.later(()=>move(home,'walk'),2600);this.later(()=>move(home,'happy'),3300);
    }else if(action==='inspect'){
      const spot=PetRoom.placement(pet.room,slot)?.spot||home;move(spot,'walk');this.say('Nhà mới đẹp quá!');this.later(()=>move(home,'happy'),1800);
    }else if(action==='wake'){
      const spot=target('sleep');move(spot,'sleep',true);this.say('Cún đang ngủ…');
      this.later(()=>{move(spot,'wake');this.say('Mình dậy rồi! Chào con 💛');},1100);this.later(()=>move(home,'happy'),2400);
    }else{move(home,'walk');this.say('Con về rồi! Mình vui quá!');this.later(()=>move(home,'happy'),2000);}
    this.later(()=>{move(home,'idle');this.busy=false;this.state='idle';this.buttons();this.renderPanel();this.idle();},action==='eat'||action==='celebrate'?4700:3900);
  },
  idle(){
    clearTimeout(this.idleTimer);if(!this.active)return;
    this.idleTimer=setTimeout(()=>{
      if(!this.active)return;
      if(!this.busy&&!document.hidden){
        const a=document.getElementById('petActor'),p=Pet.snapshot();
        if(a&&p){
          const t=PetRoom.template(p.room),actions=['walk','sniff','rest','sit','sleep'],action=actions[Math.floor(Math.random()*actions.length)];
          const spot=action==='sniff'?PetRoom.target(p.room,'sniff'):action==='sleep'?PetRoom.target(p.room,'sleep'):action==='rest'?PetRoom.target(p.room,'rest'):action==='walk'?{x:t.dog.spawn.x+(Math.random()-.5)*t.dog.wander.x,y:t.dog.spawn.y+(Math.random()-.5)*t.dog.wander.y}:t.dog.spawn;
          this.positionActor(spot);a.className='pet-actor pet-stage-'+p.stage+' pet-'+action;this.setPose(action);
        }
      }
      this.idle();
    },6000+Math.random()*6000);
  }
};
window.PetView=PetView;
PetView.reduced.addEventListener('change',()=>{if(PetView.active){const pose=document.querySelector('#petActor>svg')?.dataset.petPose;if(pose)PetView.setPose(pose);}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)PetView.stop();else if(document.getElementById('screenPet')?.classList.contains('active'))PetView.resume();});

window.addEventListener('resize',()=>PetView.resizeRoom());
