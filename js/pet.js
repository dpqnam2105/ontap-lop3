// Nhà cún: profile transactions; persist before starting animation.
const Pet = {
  VERSION: 1, KIND: 'dog-fluffy-brown', DAILY_MEALS: 3, THRESHOLDS: [0, 10, 30],
  // Prices remain closed until Nam approves the economy. Tests can supply explicit prices.
  adoptionPrice: null,
  FOODS: { kibble: { name: 'Hạt cho cún', price: null }, treat: { name: 'Bánh thưởng', price: null } },
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
  tx(fn, requestId) {
    if (this._inTx) return {ok:false,error:'busy'};
    this._inTx=true;
    try {
      const profile = Storage.load();
      if (!profile.playerName || !Storage.getActiveName()) return {ok:false,error:'guest'};
      profile.stars=this.count(profile.stars);
      profile.pet=this.normalize(profile.pet);
      if (requestId && profile.pet?.receipts.includes(requestId)) return {ok:false,error:'duplicate'};
      const result=fn(profile);
      if (!result || !result.ok) return result || {ok:false,error:'invalid'};
      if (requestId && profile.pet) profile.pet.receipts=[...profile.pet.receipts,requestId].slice(-20);
      const expected=JSON.stringify({stars:profile.stars,pet:profile.pet});
      Storage.save(profile);
      const saved=Storage.load();
      // Storage.save catches quota errors; do not play a success animation unless readback matches.
      if (JSON.stringify({stars:saved.stars,pet:saved.pet})!==expected) return {ok:false,error:'save'};
      try { if (window.Rewards && Rewards.updateUI) Rewards.updateUI(); }
      catch(e) { console.warn('Pet: saved, UI refresh failed',e); }
      return {...result,pet:this.normalize(saved.pet)};
    } catch(e) { console.warn('Pet.tx failed',e); return {ok:false,error:'save'}; }
    finally {this._inTx=false;}
  },
  adopt(name, requestId) {
    return this.tx(p=>{
      if(p.pet) return {ok:false,error:'adopted'};
      if(!Number.isSafeInteger(this.adoptionPrice) || this.adoptionPrice<0) return {ok:false,error:'price-pending'};
      if(p.stars<this.adoptionPrice) return {ok:false,error:'stars'};
      p.stars-=this.adoptionPrice;
      p.pet=this.normalize({kind:this.KIND,name,adoptedDate:this.dateKey(),growth:0,stage:0,bag:{},room:this.defaults()});
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
      return {ok:true,action:'eat',celebrate:p.pet.stage>before};
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
    Pet.ITEMS[slot+'-'+suffix]={slot,name,free,price:free?0:null};
}
window.Pet=Pet;
