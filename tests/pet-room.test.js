const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const roomSource=fs.readFileSync(path.join(__dirname,'../js/pet-room.js'),'utf8'),petSource=fs.readFileSync(path.join(__dirname,'../js/pet.js'),'utf8');
function boot(initial={playerName:'Thỏ',stars:200,petAdopt:{earnedAt:'2026-10-07T00:00:00Z',runId:'room',score:15,total:15}}){
 let profile=JSON.parse(JSON.stringify(initial)),writes=0;const storage={load:()=>JSON.parse(JSON.stringify(profile)),getActiveName:()=>profile.playerName,save:p=>{profile=JSON.parse(JSON.stringify(p));writes++;}};
 const box={window:{},console,Storage:storage};vm.createContext(box);vm.runInContext(roomSource,box);vm.runInContext(fs.readFileSync(path.join(__dirname,'../js/pet-accessories.js'),'utf8'),box);vm.runInContext(petSource,box);
 return {R:box.window.PetRoom,P:box.window.Pet,storage,read:()=>profile,writes:()=>writes};
}
const plain=x=>JSON.parse(JSON.stringify(x));let count=0;function test(name,fn){fn();console.log('OK',name);count++;}
test('legacy flat room becomes nested without mutating input or writing on snapshot',()=>{
 const b=boot();b.P.adopt('Bông');const p=b.read();p.pet.owned=['bed-blue','bowl-pink'];p.pet.room={bed:'bed-blue',bowl:'bowl-pink',rug:'rug-default',toy:'toy-default',plant:'plant-default',wall:'wall-default'};
 const before=JSON.stringify(p),writes=b.writes(),room=b.P.snapshot().room;
 assert.equal(room.template,'room-cozy-v1');assert.equal(room.slots.bed,'bed-blue');assert.equal(room.slots.bowl,'bowl-pink');assert.equal(JSON.stringify(p),before);assert.equal(b.writes(),writes);
 assert.ok(b.P.visit().ok);assert.equal(b.read().pet.room.slots.bed,'bed-blue');assert.equal(b.read().pet.room.bed,'bed-blue');assert.equal(b.read().stars,200);
});
test('equip and purchase update canonical slots plus old-client mirrors in one save',()=>{
 const b=boot();b.P.adopt('Bông');let before=b.writes();assert.ok(b.P.buyItem('bed-blue','buy').ok);assert.equal(b.writes(),before+1);assert.equal(b.read().stars,150);assert.equal(b.read().pet.room.slots.bed,'bed-blue');assert.equal(b.read().pet.room.bed,'bed-blue');
 assert.ok(b.P.equip('bed-default','eq').ok);assert.equal(b.read().pet.room.slots.bed,'bed-default');assert.equal(b.read().pet.room.bed,'bed-default');assert.equal(b.read().stars,150);
});
test('already-open v1 code can save modern profile without losing purchased equipment',()=>{
 const b=boot();b.P.adopt('Bông');b.P.buyItem('bed-blue');b.P.buyItem('bowl-pink');
 const old={window:{},console,Storage:b.storage};vm.createContext(old);vm.runInContext(fs.readFileSync(path.join(__dirname,'fixtures/pet-flat-v1.js'),'utf8'),old);
 assert.ok(old.window.Pet.feed('kibble','old-feed').ok);assert.equal(b.read().pet.room.bed,'bed-blue');assert.equal(b.read().pet.room.bowl,'bowl-pink');assert.equal(b.read().pet.room.slots,undefined);
 assert.ok(b.P.visit().ok);assert.equal(b.read().pet.room.slots.bed,'bed-blue');assert.equal(b.read().pet.room.slots.bowl,'bowl-pink');assert.equal(b.read().pet.growth,1);assert.equal(b.read().stars,100);
});
test('nested slots are authoritative; unknown/unowned/wrong-slot IDs and templates fall back safely',()=>{
 const b=boot();const room=b.R.normalize({template:'constructor',slots:{bed:'bed-blue',rug:'bowl-default',wall:'toString'},bed:'bed-pink'},[]);
 assert.equal(room.template,'room-cozy-v1');assert.equal(room.slots.bed,'bed-default');assert.equal(room.slots.rug,'rug-default');assert.equal(room.slots.wall,'wall-default');
 assert.equal(b.R.normalize({slots:{bed:'bed-blue'},bed:'bed-pink'},['bed-blue','bed-pink']).slots.bed,'bed-blue');assert.equal(b.R.normalize([]).slots.bed,'bed-default');
});
test('reserved pos accepts valid known-slot logical coordinates, but is not applied to layout',()=>{
 const b=boot();const r=b.R.normalize({pos:{bed:{x:600,y:430},toy:{x:-1,y:500},plant:{x:Infinity,y:1},wall:{x:0,y:0},rug:{x:'50',y:5}}});
 assert.deepEqual(plain(r.pos),{bed:{x:600,y:430}});assert.equal(b.R.placement(r,'bed').x,690);assert.deepEqual(plain(b.R.normalize(r).pos),{bed:{x:600,y:430}});
});
test('capability routing responds to template/manifest data without changing behavior code',()=>{
 const b=boot(),room=b.R.normalize(null);assert.equal(b.R.target(room,'eat').slot,'bowl');assert.equal(b.R.target(room,'sleep').slot,'bed');assert.equal(b.R.target(room,'unknown'),null);
 b.R.TEMPLATES['room-cozy-v1'].slots.bowl.spot={x:410,y:540};assert.deepEqual(plain(b.R.target(room,'eat')),{slot:'bowl',x:410,y:540});
 b.R.TEMPLATES['room-cozy-v1'].slots.bowl.does=[];b.R.ITEMS['toy-default'].does=['eat'];assert.equal(b.R.target(room,'eat').slot,'toy');
});
test('manifest size/offset adjust imagery without changing interaction spot',()=>{
 const b=boot();b.R.ITEMS['toy-default'].size={w:115,h:85};b.R.ITEMS['toy-default'].offset={x:5,y:-6};const p=b.R.placement(b.R.normalize(null),'toy');
 assert.deepEqual([p.x,p.y,p.w,p.h],[755,549,115,85]);assert.deepEqual(plain(p.spot),{x:680,y:530});
});
test('depth ordering places dog between bed back/front when lying, then in front when walking out',()=>{
 const b=boot(),nodes=[{id:'bed-back',layer:'back',y:445},{id:'rug',layer:'floor',y:605},{id:'bed-front',layer:'depth',y:457},{id:'dog',layer:'depth',y:425}];
 assert.deepEqual(plain(b.R.order(nodes).map(n=>n.id)),['bed-back','rug','dog','bed-front']);nodes[3].y=530;assert.deepEqual(plain(b.R.order(nodes).map(n=>n.id)),['bed-back','rug','bed-front','dog']);
});
test('out-of-range movement is clamped inside walk polygon and stage bounds for all sizes',()=>{
 const b=boot(),room=b.R.normalize(null),t=b.R.template(room);
 for(let stage=0;stage<3;stage++)for(const x of [-500,0,160,500,850,1500])for(const y of [-500,0,390,550,1000]){
  const p=b.R.clamp(room,{x,y},stage),w=t.dog.widthByStage[stage];assert.ok(b.R.inside(b.R.viewport(room).walkArea.polygon,p));assert.ok(p.x-w/2>=0&&p.x+w/2<=1000);assert.ok(p.y-w>=0&&p.y<=625);
 }
 assert.deepEqual(plain(b.R.clamp(room,{x:NaN,y:NaN})),plain(t.dog.spawn));assert.ok(t.slots.bed.w>=t.dog.widthByStage[2]);
});
test('JSON backup preserves nested room, equipment, stars and reserved pos',()=>{
 const b=boot();b.P.adopt('Bông');b.P.buyItem('bed-pink');b.read().pet.room.pos={bed:{x:700,y:430}};const c=boot(plain(b.read()));
 assert.equal(c.P.snapshot().room.slots.bed,'bed-pink');assert.equal(c.read().stars,150);assert.deepEqual(plain(c.P.snapshot().room.pos),{bed:{x:700,y:430}});assert.ok(c.P.visit().ok);assert.equal(c.read().pet.room.bed,'bed-pink');
});
test('mobile viewport contains every furniture box and exact action spot for all stages',()=>{
 const b=boot(),room=b.R.normalize(null),t=b.R.template(room);
 for(const px of [360,390,750]){
  const v=b.R.viewport(room,px);assert.equal(v.x,140);assert.equal(v.w,720);
  for(const slot of Object.keys(t.slots)){
   const p=b.R.placement(room,slot);assert.ok(p.x-p.w/2>=140&&p.x+p.w/2<=860);
   for(let stage=0;stage<3;stage++)assert.deepEqual(plain(b.R.clamp(room,p.spot,stage,px)),plain(p.spot));
  }
  for(let stage=0;stage<3;stage++)for(const x of [-999,9999]){
   const p=b.R.clamp(room,{x,y:555},stage,px),w=t.dog.widthByStage[stage];assert.ok(p.x-w/2>=140&&p.x+w/2<=860);
  }
 }
 assert.equal(b.R.viewport(room,751).w,1000);
});
test('desktop wander is wider than mobile and still contains the whole dog',()=>{
 const b=boot(),r=b.R.normalize(null);
 const wide=b.R.clamp(r,{x:100,y:530},2,1280),narrow=b.R.clamp(r,{x:100,y:530},2,390);
 assert.ok(wide.x<narrow.x);assert.ok(wide.x>=168);assert.equal(narrow.x,310);
});
test('every paid item has real artwork, bed layers keep the same canvas',()=>{
 const b=boot();
 for(const item of Object.values(b.R.ITEMS)){
  assert.ok(item.img,item.id+' must not fall back to a placeholder');
  assert.ok(fs.existsSync(path.join(__dirname,'..',item.img)),item.id+' image exists');
  if(item.slot==='bed')assert.ok(fs.existsSync(path.join(__dirname,'..',item.frontImg)),item.id+' front exists');
 }
 const report=JSON.parse(fs.readFileSync(path.join(__dirname,'../docs/pet-room-recolor-payload-v1.json'),'utf8'));
 assert.equal(report.length,12);
 for(const item of Object.values(b.R.ITEMS).filter(x=>!x.free&&x.slot!=='wall')){
  assert.ok(report.some(x=>x.file===path.basename(item.img)),item.id+' uses a colour-tested paid asset');
 }
 assert.ok(b.R.ITEMS['bed-blue'].img.endsWith('bed-blue-navy-v1.webp'));
 assert.ok(b.R.ITEMS['bowl-blue'].img.endsWith('bowl-blue-navy-v1.webp'));
 for(const entry of report){assert.ok(entry.alphaExact);assert.ok(entry.valueExact||entry.navy);assert.ok(Math.max(...entry.size)<=512);assert.ok(entry.changedPixels>100);}
 for(const colour of ['blue-navy','pink'])assert.deepEqual(report.find(x=>x.file==='bed-'+colour+'-v1.webp').size,report.find(x=>x.file==='bed-front-'+colour+'-v1.webp').size);
});
console.log(count+' room tests passed');
