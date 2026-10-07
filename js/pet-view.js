// Runtime animation only; all persistent actions go through Pet.tx.
const PetView = {
  active:false, busy:false, epoch:0, timers:[], idleTimer:null, lastReaction:null, panel:'food', buyUntil:0,
  priorities:{idle:0,react:1,inspect:2,eat:3,play:3,celebrate:4},
  state:'idle', reduced:window.matchMedia('(prefers-reduced-motion: reduce)'),
  esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));},
  token(){return 'pet-'+Date.now()+'-'+Math.random().toString(36).slice(2);},
  stop(){this.active=false;this.epoch++;this.timers.forEach(clearTimeout);this.timers=[];clearTimeout(this.idleTimer);this.busy=false;this.state='idle';},
  later(fn,ms,realTime=false){const e=this.epoch;const t=setTimeout(()=>{if(this.active&&this.epoch===e)fn();},this.reduced.matches&&!realTime?0:ms);this.timers.push(t);},
  svg(){return '<svg viewBox="0 0 140 150" aria-hidden="true"><g class="pet-tail"><path d="M105 107 Q132 89 120 73" stroke="#a66c3c" stroke-width="18" fill="none" stroke-linecap="round"/><circle cx="120" cy="73" r="12" fill="#c38a50"/></g><ellipse cx="74" cy="112" rx="34" ry="25" fill="#bf8850"/><g fill="#b17a44"><rect x="43" y="114" width="20" height="30" rx="10"/><rect x="84" y="113" width="20" height="30" rx="10"/></g><g fill="#a26839"><ellipse cx="28" cy="61" rx="17" ry="28"/><ellipse cx="111" cy="61" rx="17" ry="28"/></g><ellipse cx="69" cy="48" rx="43" ry="37" fill="#ca965e"/><g fill="#d3a36b"><circle cx="35" cy="28" r="13"/><circle cx="53" cy="18" r="13"/><circle cx="72" cy="15" r="13"/><circle cx="91" cy="23" r="14"/><circle cx="104" cy="42" r="12"/><circle cx="29" cy="48" r="12"/></g><ellipse cx="69" cy="65" rx="23" ry="16" fill="#ebcda3"/><g fill="#34271e"><ellipse cx="48" cy="48" rx="6" ry="8"/><ellipse cx="88" cy="48" rx="6" ry="8"/><ellipse cx="69" cy="62" rx="7" ry="5"/></g><g fill="white"><circle cx="50" cy="45" r="2"/><circle cx="90" cy="45" r="2"/></g><path d="M58 73 Q69 83 80 72" fill="none" stroke="#69462b" stroke-width="3"/><path d="M65 76 Q65 90 74 85 L76 75" fill="#ed989f"/><path d="M42 84 Q70 94 97 84" stroke="#83afc9" stroke-width="6" fill="none"/><circle cx="70" cy="91" r="6" fill="#f5d37b"/></svg>';},
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
    const today=Pet.dateKey(), meals=p.day.date===today?p.day.meals:0, labels=['Cún con','Cún lớn','Trưởng thành'];
    host.innerHTML+='<div class="pet-layout"><div class="pet-card"><div class="pet-room pet-wall-'+p.room.wall.split('-').pop()+'" id="petRoom"><div class="pet-window"></div><span class="pet-plant pet-color-'+p.room.plant.split('-').pop()+'">🪴</span><div class="pet-bed pet-color-'+p.room.bed.split('-').pop()+'"></div><div class="pet-rug pet-color-'+p.room.rug.split('-').pop()+'"></div><span class="pet-bowl pet-color-'+p.room.bowl.split('-').pop()+'">🍲</span><span class="pet-toy pet-color-'+p.room.toy.split('-').pop()+'">🎾</span><div class="pet-speech" id="petSpeech">Gâu! Mình ở đây nè 💛</div><button class="pet-actor pet-stage-'+p.stage+'" id="petActor" aria-label="Vuốt ve cún">'+this.svg()+'</button></div><div class="pet-name"><b>'+this.esc(p.name)+'</b><button id="petRename">Đổi tên</button><span>'+labels[p.stage]+'</span></div><div class="pet-growth"><label>Đang lớn lên · '+p.growth+' bữa lớn</label><progress max="'+(p.stage===0?10:30)+'" value="'+Math.min(p.growth,30)+'"></progress><p>'+meals+'/3 bữa lớn hôm nay · '+(meals===3?'Mai lớn tiếp nhé 💛':'Mỗi bữa giúp cún lớn thêm.')+'</p></div><div class="pet-actions"><button id="petFood">🍲 Cho ăn</button><button id="petPlay">🎾 Chơi cùng</button><button id="petDecor">🏡 Trang trí</button></div><p id="petStatus" role="status" aria-live="polite"></p></div><aside class="pet-card" id="petPanel"></aside></div>';
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
    else if(r.action==='eat')this.perform(r.celebrate?'celebrate':'eat');
    else if(r.action==='inspect')this.perform('inspect',r.slot);
    else this.say('Đã lưu rồi 💛');
    return r;
  },
  react(){
    const actor=document.getElementById('petActor');if(!actor)return;
    if(this.busy){const heart=document.createElement('span');heart.className='pet-heart';heart.textContent='💛';actor.appendChild(heart);this.later(()=>heart.remove(),900);return;}
    this.state='react';
    const choices=['wag','tilt','hop'].filter(x=>x!==this.lastReaction);this.lastReaction=choices[Math.floor(Math.random()*choices.length)];
    actor.className='pet-actor pet-stage-'+Pet.snapshot().stage+' pet-'+this.lastReaction;this.say('Thích quá! 💛');
    this.later(()=>{actor.className='pet-actor pet-stage-'+Pet.snapshot().stage;this.state='idle';this.idle();},1300);
  },
  perform(action,slot){
    const priority=this.priorities[action]||0;
    if(!this.active||(this.busy&&priority<=(this.priorities[this.state]||0)))return;
    this.timers.forEach(clearTimeout);this.timers=[];clearTimeout(this.idleTimer);
    this.busy=true;this.state=action;this.buttons();this.renderPanel();
    const a=document.getElementById('petActor');if(!a){this.busy=false;return;}
    const stage=Pet.snapshot().stage;
    const move=(left,cls)=>{a.style.left=left+'%';a.className='pet-actor pet-stage-'+stage+' pet-'+cls;};
    if(action==='eat'||action==='celebrate'){
      move(22,'walk');this.say('Có đồ ăn rồi! Mình tới ngay.');
      this.later(()=>{move(22,'eat');this.say('Măm măm… ngon quá!');},1600);
      this.later(()=>{move(40,action==='celebrate'?'hop':'wag');this.say(action==='celebrate'?'Mình lớn thêm rồi! 💛':'No rồi! Cảm ơn con 💛');},3200);
    }else if(action==='play'){move(76,'walk');this.say('Mình đuổi theo bóng nhé!');this.later(()=>move(76,'hop'),1600);this.later(()=>move(48,'walk'),2600);}
    else if(action==='inspect'){move(slot==='bowl'?22:slot==='plant'||slot==='bed'?75:50,'walk');this.say('Nhà mới đẹp quá!');}
    else if(action==='wake'){move(48,'rest');this.say('Cún đang ngủ…');this.later(()=>{move(48,'wake');this.say('Mình dậy rồi! Chào con 💛');},1100);}
    else {move(48,'walk');this.say('Con về rồi! Mình vui quá!');}
    this.later(()=>{move(48,'idle');this.busy=false;this.state='idle';this.buttons();this.renderPanel();this.idle();},action==='eat'||action==='celebrate'?4700:3900);
  },
  idle(){
    clearTimeout(this.idleTimer);if(!this.active)return;
    this.idleTimer=setTimeout(()=>{
      if(!this.active)return;
      if(!this.busy&&!document.hidden){const a=document.getElementById('petActor'),p=Pet.snapshot();if(a&&p){const actions=['walk','sniff','rest'];const action=actions[Math.floor(Math.random()*3)];a.className='pet-actor pet-stage-'+p.stage+' pet-'+action;if(action==='walk')a.style.left=(30+Math.random()*40)+'%';if(action==='sniff')a.style.left='72%';}}
      this.idle();
    },6000+Math.random()*6000);
  }
};
window.PetView=PetView;
document.addEventListener('visibilitychange',()=>{if(document.hidden)PetView.stop();else if(document.getElementById('screenPet')?.classList.contains('active'))PetView.resume();});
