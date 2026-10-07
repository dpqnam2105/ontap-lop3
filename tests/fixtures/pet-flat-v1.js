// Nhà cún: profile transactions; persist before starting animation.
const Pet = {
  // KIND is a persistent data identifier; never change it when replacing the artwork.
  VERSION: 1, KIND: 'dog-fluffy-brown', DAILY_MEALS: 3, THRESHOLDS: [0, 10, 30],
  // Adoption is earned through the three-subject challenge; meals are optional, never a penalty.
  STARTER_FOOD: 6,
  CHALLENGE_SUBJECTS: ['toan','tieng-viet','tieng-anh'],
  ENRICH_TOPICS: ['toan_tu-duy-so','toan_loi-van-hay','toan_tu-duy-logic','toan_kieu-kangaroo','toan_dem-hinh-gap-khuc','toan_day-so-cach-deu','toan_so-do-doan-thang'],
  FOODS: { kibble: { name: 'Hạt cho cún', price: 10 }, treat: { name: 'Bánh thưởng', price: 15 } },
  SLOTS: ['bed', 'rug', 'bowl', 'toy', 'plant', 'wall'],
  ITEMS: {}, _inTx: false,
  dateKey(d = new Date()) {
    return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
  },
  count(n, max = 1000000) { return Number.isSafeInteger(n) && n >= 0 ? Math.min(n,max) : 0; },
  defaults() { return Object.fromEntries(this.SLOTS.map(s => [s,s+'-default'])); },
  normalize(raw) {
    if (!raw || typeof raw !== 'object' || raw.kind !== this.KIND) return null;
    const growth = this.count(raw.growth);
    const stage = Math.max(this.count(raw.stage,2), growth >= 30 ? 2 : growth >= 10 ? 1 : 0);
    const owned = [...new Set((Array.isArray(raw.owned) ? raw.owned : []).filter(id => Object.hasOwn(this.ITEMS,id)))];
    const room = this.defaults();
    for (const slot of this.SLOTS) {
      const id = raw.room && raw.room[slot], item = this.ITEMS[id];
      if (item && item.slot === slot && (item.free || owned.includes(id))) room[slot] = id;
    }
    const bag = Object.fromEntries(Object.keys(this.FOODS).map(id=>[id,this.count(raw.bag && raw.bag[id],999)]));
    return {v:1,kind:this.KIND,name:(typeof raw.name==='string'?raw.name.trim().slice(0,20):'') || 'Cún Nâu',
      adoptedDate:typeof raw.adoptedDate==='string'?raw.adoptedDate:this.dateKey(),stage,growth,
      day:{date:typeof raw.day?.date==='string'?raw.day.date:'',meals:this.count(raw.day?.meals,3)},
      bag,owned,room,lastVisitDate:typeof raw.lastVisitDate==='string'?raw.lastVisitDate:'',
      receipts:(Array.isArray(raw.receipts)?raw.receipts:[]).filter(x=>typeof x==='string').slice(-20)};
  },
  snapshot() { return this.normalize(Storage.load().pet); },
  adoptionRight(profile) {
    const p=profile||Storage.load(), r=p.petAdopt;
    return r && typeof r.runId==='string' && r.runId.length>0 && typeof r.earnedAt==='string'
      && Number.isFinite(Date.parse(r.earnedAt)) && r.total===15 && Number.isInteger(r.score) && r.score>=0 && r.score<=15 && (!r.usedAt || !this.normalize(p.pet)) ? r : null;
  },
  recoveryName(profile) {
    const p=profile||Storage.load(), old=p.pet || p.petBroken;
    return typeof old?.name==='string' && old.name.trim() ? old.name.trim().slice(0,20) : 'Cún Nâu';
  },
  isCore(q,t) {
    if (q.track) return q.track==='core';
    if (t.track) return t.track==='core';
    // Untagged legacy questions in established core topics remain eligible.
    return !this.ENRICH_TOPICS.includes(t.id);
  },
  buildChallenge(data,runId) {
    const pool=[];
    const rand=App._seededRandom(runId+'|'+Storage.canonName(Storage.getActiveName()));
    const shuffle=arr=>{const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rand()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;};
    for(const id of this.CHALLENGE_SUBJECTS){
      const s=(data && data.subjects || []).find(s=>s.id===id);
      if(!s)return {ok:false,error:'questions',subject:id};
      const seen=new Set(), buckets=[];
      for(const t of s.topics||[]){
        if(t.drill)continue;
        const allowed=App._allowedIndices(s,t);
        const idx=allowed===null?(t.questions||[]).map((_,i)=>i):allowed;
        const list=[];
        for(const i of shuffle(idx)){
          const q=t.questions[i],qid=q&&(q.id || t.id+'_'+i);
          if(!q||!this.isCore(q,t)||seen.has(qid)||!Array.isArray(q.choices)||q.choices.length<2||!Number.isInteger(q.a)||q.a<0||q.a>=q.choices.length)continue;
          seen.add(qid);list.push({...q,id:qid,_idx:i,subjectId:s.id,topicId:t.id,_subjectName:s.name,_topicName:t.name});
        }
        if(list.length)buckets.push(list);
      }
      const candidates=shuffle(buckets), pick=[];let round=0;
      while(pick.length<5 && candidates.some(b=>b.length>round)){
        for(const b of candidates){if(pick.length===5)break;if(b[round])pick.push(b[round]);}round++;
      }
      if(pick.length<5)return {ok:false,error:'questions',subject:s.name};
      pool.push(...pick);
    }
    return {ok:true,pool:shuffle(pool)};
  },
  startChallenge() {
    if(!Storage.getActiveName()||!Storage.load().playerName)return {ok:false,error:'guest'};
    if(this.snapshot()||this.adoptionRight())return {ok:false,error:'earned'};
    const runId='adopt-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    const result=this.buildChallenge(App.allData,runId);
    if(!result.ok)return result;
    this._challengeRun={runId,player:Storage.canonName(Storage.getActiveName()),grade:App.currentGrade};
    Quiz.startMixed(result.pool,'Toán · Tiếng Việt · Tiếng Anh','pet_adopt',null,null,{challenge:{kind:'pet_adopt',runId}});
    return {ok:true,runId};
  },
  onChallengeFinish(info) {
    const run=this._challengeRun;
    if(!info||info.kind!=='pet_adopt'||info.mainTotal!==15||!run||info.runId!==run.runId
      ||run.player!==Storage.canonName(Storage.getActiveName())||run.grade!==App.currentGrade
      ||!Number.isInteger(info.score)||info.score<0||info.score>15)return {ok:false,error:'challenge'};
    const result=this.tx(p=>{
      if(p.pet||p.petAdopt)return {ok:false,error:'earned'};
      p.petAdopt={earnedAt:new Date().toISOString(),runId:info.runId,score:info.score,total:15};
      return {ok:true,action:'earned'};
    });
    if(result.ok||result.error==='earned')this._challengeRun=null;
    return result;
  },
  tx(fn, requestId) {
    if (this._inTx) return {ok:false,error:'busy'};
    this._inTx=true;
    try {
      const profile = Storage.load();
      if (!profile.playerName || !Storage.getActiveName()) return {ok:false,error:'guest'};
      profile.stars=this.count(profile.stars);
      const normalized=this.normalize(profile.pet);
      const broken=profile.pet!=null && !normalized;
      if(broken && !Object.hasOwn(profile,'petBroken'))profile.petBroken=profile.pet;
      profile.pet=normalized;
      if (requestId && profile.pet?.receipts.includes(requestId)) return {ok:false,error:'duplicate'};
      const result=fn(profile);
      if (!result || !result.ok) {
        // Preserve the original even if this action cannot continue (e.g. feed a broken pet).
        if(broken){Storage.save(profile);if(JSON.stringify(Storage.load().petBroken)!==JSON.stringify(profile.petBroken))return {ok:false,error:'save'};}
        return result || {ok:false,error:'invalid'};
      }
      if (requestId && profile.pet) profile.pet.receipts=[...profile.pet.receipts,requestId].slice(-20);
      const expected=JSON.stringify({stars:profile.stars,pet:profile.pet,petAdopt:profile.petAdopt,petBroken:profile.petBroken});
      Storage.save(profile);
      const saved=Storage.load();
      // Storage.save catches quota errors; do not play a success animation unless readback matches.
      if (JSON.stringify({stars:saved.stars,pet:saved.pet,petAdopt:saved.petAdopt,petBroken:saved.petBroken})!==expected) return {ok:false,error:'save'};
      try { if (window.Rewards && Rewards.updateUI) Rewards.updateUI(); }
      catch(e) { console.warn('Pet: saved, UI refresh failed',e); }
      return {...result,pet:this.normalize(saved.pet)};
    } catch(e) { console.warn('Pet.tx failed',e); return {ok:false,error:'save'}; }
    finally {this._inTx=false;}
  },
  adopt(name, requestId) {
    return this.tx(p=>{
      if(p.pet) return {ok:false,error:'adopted'};
      const right=this.adoptionRight(p);
      if(!right)return {ok:false,error:'challenge'};
      p.pet=this.normalize({kind:this.KIND,name,adoptedDate:this.dateKey(),growth:0,stage:0,bag:{kibble:this.STARTER_FOOD},room:this.defaults()});
      p.petAdopt.usedAt=new Date().toISOString();
      return {ok:true,action:'adopt'};
    },requestId);
  },
  rename(name, requestId) {
    return this.tx(p=>{if(!p.pet)return {ok:false,error:'no-pet'};
      const clean=typeof name==='string'?name.trim().slice(0,20):'';
      if(!clean)return {ok:false,error:'name'};
      p.pet.name=clean;return {ok:true,action:'rename'};},requestId);
  },
  visit() {
    return this.tx(p=>{if(!p.pet)return {ok:false,error:'no-pet'};
      const wake=p.pet.lastVisitDate!==this.dateKey();p.pet.lastVisitDate=this.dateKey();
      return {ok:true,action:wake?'wake':'greet'};});
  },
  feed(id, requestId) {
    return this.tx(p=>{
      if(!p.pet)return {ok:false,error:'no-pet'};
      if(!Object.hasOwn(this.FOODS,id))return {ok:false,error:'id'};
      const today=this.dateKey(), day=p.pet.day.date===today?p.pet.day:{date:today,meals:0};
      if(day.meals>=this.DAILY_MEALS)return {ok:false,error:'full'};
      if(p.pet.bag[id]<1)return {ok:false,error:'food'};
      const before=p.pet.stage;p.pet.bag[id]--;day.meals++;p.pet.day=day;p.pet.growth++;
      p.pet.stage=Math.max(before,p.pet.growth>=30?2:p.pet.growth>=10?1:0);
      return {ok:true,action:'eat',food:id,celebrate:p.pet.stage>before};
    },requestId);
  },
  buyFood(id, requestId) {
    return this.tx(p=>{
      if(!p.pet)return {ok:false,error:'no-pet'};
      const item=Object.hasOwn(this.FOODS,id)?this.FOODS[id]:null;
      if(!item)return {ok:false,error:'id'};
      if(!Number.isSafeInteger(item.price)||item.price<0)return {ok:false,error:'price-pending'};
      if(p.pet.bag[id]>=999)return {ok:false,error:'bag-full'};
      if(p.stars<item.price)return {ok:false,error:'stars'};
      p.stars-=item.price;p.pet.bag[id]++;return {ok:true,action:'buy'};
    },requestId);
  },
  equip(id, requestId) {
    return this.tx(p=>{
      if(!p.pet)return {ok:false,error:'no-pet'};
      const item=Object.hasOwn(this.ITEMS,id)?this.ITEMS[id]:null;
      if(!item)return {ok:false,error:'id'};
      if(!item.free&&!p.pet.owned.includes(id))return {ok:false,error:'not-owned'};
      p.pet.room[item.slot]=id;return {ok:true,action:'inspect',slot:item.slot};
    },requestId);
  },
  buyItem(id, requestId) {
    return this.tx(p=>{
      if(!p.pet)return {ok:false,error:'no-pet'};
      const item=Object.hasOwn(this.ITEMS,id)?this.ITEMS[id]:null;
      if(!item)return {ok:false,error:'id'};
      if(item.free||p.pet.owned.includes(id))return {ok:false,error:'owned'};
      if(!Number.isSafeInteger(item.price)||item.price<0)return {ok:false,error:'price-pending'};
      if(p.stars<item.price)return {ok:false,error:'stars'};
      p.stars-=item.price;p.pet.owned.push(id);p.pet.room[item.slot]=id;
      return {ok:true,action:'inspect',slot:item.slot};
    },requestId);
  }
};
for(const [slot,label] of Object.entries({bed:'Giường',rug:'Thảm',bowl:'Bát',toy:'Đồ chơi',plant:'Cây',wall:'Màu tường'})) {
  for(const [suffix,name,free] of [['default',label+' cơ bản',true],['blue',label+' xanh',false],['pink',label+' hồng',false]])
    Pet.ITEMS[slot+'-'+suffix]={slot,name,free,price:free?0:50};
}
window.Pet=Pet;
