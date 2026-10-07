const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.PET_BROWSER_CHANNEL||'chrome'});
 const context=await browser.newContext(), page=await context.newPage(), errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await context.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.hostname==='pet.test'){
   const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
   if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
   const type={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'}[path.extname(file)];
   return route.fulfill({contentType:type||'application/octet-stream',body:fs.readFileSync(file)});
  }
  if(url.hostname==='script.google.com')return route.fulfill({contentType:'application/json',body:url.searchParams.get('action')==='get'?'{"ok":true,"found":false,"ver":0}':route.request().method()==='POST'?'{"ok":true,"saved":true,"ver":1}':'[]'});
  return route.abort();
 });
 await page.goto('http://pet.test/');await page.waitForFunction(()=>App.allData&&App.allData.subjects.length>=3);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(()=>{Storage.switchPlayer('Bé Duyệt Hình');App.playerName='Bé Duyệt Hình';const p=Storage.load();p.petAdopt={earnedAt:new Date().toISOString(),runId:'art-test',total:15,score:15};p.stars=100;Storage.save(p);Pet.adopt('Bông');App.showScreen('pet')});
 await page.waitForTimeout(100);
 assert.equal(await page.locator('#petArtStyle').count(),0,'styles belong in pet.css');
 const p0=await page.evaluate(()=>Storage.load());
 assert.equal(p0.pet.room.template,'room-cozy-v1');assert.ok(p0.pet.room.slots);
 const geometry=await page.evaluate(()=>{const room=document.getElementById('petRoom').getBoundingClientRect();return room.width/room.height});
 assert.ok(Math.abs(geometry-1.6)<.02,'1000x625 frame ratio');
 assert.equal(await page.locator('#petSlot-bed').count(),1);assert.equal(await page.locator('#petSlot-bed-front').count(),1);
 await page.emulateMedia({reducedMotion:'no-preference'});
 // Change only room data: the actual eat path must follow the new target.
 await page.evaluate(()=>{PetView.stop();PetView.active=true;PetView.render();PetRoom.TEMPLATES['room-cozy-v1'].slots.bowl.spot={x:410,y:545}});
 await page.locator('#petFood').click();
 assert.deepEqual(await page.evaluate(()=>PetView.actorPoint),{x:410,y:545});
 await page.locator('#petActor').click();assert.equal(await page.locator('#petCanvas>.pet-heart').count(),1,'effect above the scene, not trapped inside dog depth');
 await page.waitForTimeout(4800);
 // The split bed surrounds the dog at the sleep target and stops surrounding it once it walks out.
 await page.evaluate(()=>PetView.perform('wake'));await page.waitForTimeout(100);
 const lying=await page.evaluate(()=>({point:PetView.actorPoint,back:+document.getElementById('petSlot-bed').style.zIndex,dog:+document.getElementById('petActor').style.zIndex,front:+document.getElementById('petSlot-bed-front').style.zIndex}));
 assert.deepEqual(lying.point,{x:690,y:425});assert.ok(lying.back<lying.dog&&lying.dog<lying.front);
 await page.waitForTimeout(800);fs.mkdirSync(path.join(__dirname,'out'),{recursive:true});
 await page.locator('#petRoom').screenshot({path:path.join(__dirname,'out','pet-room-sleep.png')});
 await page.evaluate(()=>{PetView.stop();PetView.active=true;PetView.positionActor({x:490,y:530});PetView.setPose('idle')});
 await page.waitForTimeout(150);
 assert.ok(await page.evaluate(()=>+document.getElementById('petActor').style.zIndex<+document.getElementById('petSlot-bed-front').style.zIndex),'while foot is still behind bed rim');
 await page.waitForTimeout(1600);
 assert.ok(await page.evaluate(()=>+document.getElementById('petActor').style.zIndex>+document.getElementById('petSlot-bed-front').style.zIndex));
 for(const width of [360,390,430,1280]){
  await page.setViewportSize({width,height:844});await page.waitForTimeout(350);
  for(let stage=0;stage<3;stage++){
   await page.evaluate(stage=>{const p=Storage.load();p.pet.stage=stage;p.pet.growth=[0,10,30][stage];Storage.save(p);PetView.render()},stage);
   const size=await page.evaluate(()=>({actor:document.getElementById('petActor').getBoundingClientRect().width,room:document.getElementById('petRoom').clientWidth,bed:document.getElementById('petSlot-bed').getBoundingClientRect().width}));
   assert.ok(Math.abs(size.actor/size.room-[255,295,320][stage]/(width<=750?720:1000))<.005);assert.ok(size.actor<=size.bed,'adult cannot cover whole bed by size');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(width<=750){
    await page.evaluate(()=>PetView.positionActor({x:9999,y:9999},true));
    assert.ok(await page.evaluate(()=>{const r=document.getElementById('petRoom').getBoundingClientRect();return [...document.querySelectorAll('.pet-room-prop,#petActor')].every(n=>{const b=n.getBoundingClientRect();return b.left>=r.left-1&&b.right<=r.right+1&&b.top>=r.top-1&&b.bottom<=r.bottom+1})}),'all furniture and dog inside narrow frame');
    assert.ok(await page.locator('#petRoom').evaluate(n=>n.clientHeight)>245);
   }
  }
 }
 // Backups from before this PR still restore equipment; no inventory or stars reset.
 const backup=await page.evaluate(()=>Cloud.collect(App.playerName));
 await page.evaluate(()=>{const p=Storage.load();p.pet.room={bed:'bed-blue',rug:'rug-default',bowl:'bowl-default',toy:'toy-default',plant:'plant-default',wall:'wall-default'};p.pet.owned=['bed-blue'];Storage.save(p)});
 const legacy=await page.evaluate(()=>Cloud.collect(App.playerName));
 await page.evaluate(()=>{const p=Storage.load();p.pet.room.slots={bed:'bed-default'};Storage.save(p)});
 assert.ok(await page.evaluate(s=>Cloud.apply(s,App.playerName),legacy));await page.evaluate(()=>App.showScreen('pet'));
 assert.equal(await page.evaluate(()=>Storage.load().pet.room.slots.bed),'bed-blue');
 assert.equal(await page.locator('#petSlot-bed').getAttribute('data-item-id'),'bed-blue');
 assert.ok(await page.evaluate(s=>Cloud.apply(s,App.playerName),backup));
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{PetView.stop();PetView.active=true;PetView.render()});await page.waitForTimeout(500);
 await page.evaluate(()=>{PetView.stop();PetView.active=true;PetView.render();PetView.positionActor(PetRoom.template(Pet.snapshot().room).dog.spawn,true);PetView.setPose('idle')});
 await page.waitForFunction(()=>[...document.querySelectorAll('#petRoom img')].every(i=>i.complete&&i.naturalWidth>0));
 assert.equal(await page.locator('#petRoom img').count(),7);
 await page.screenshot({path:path.join(__dirname,'out','pet-room-frame-390.png'),fullPage:true});
 await page.locator('#petRoom').screenshot({path:path.join(__dirname,'out','pet-room-pilot-390.png')});
 await page.setViewportSize({width:1280,height:900});await page.waitForTimeout(400);
 await page.locator('#petRoom').screenshot({path:path.join(__dirname,'out','pet-room-pilot-1280.png')});
 await page.screenshot({path:path.join(__dirname,'out','pet-room-page-1280.png'),fullPage:true});
 await page.evaluate(()=>PetView.perform('wake'));await page.waitForTimeout(100);
 await page.locator('#petRoom').screenshot({path:path.join(__dirname,'out','pet-room-pilot-sleep.png')});
 const beforeWall=await page.evaluate(()=>Storage.load());
 await page.evaluate(()=>{const p=Storage.load();p.pet.owned.push('wall-pink');Storage.save(p);Pet.equip('wall-pink');PetView.render()});
 assert.equal(await page.locator('.pet-wall-art-tint').getAttribute('data-wall-id'),'wall-pink');
 assert.ok(await page.locator('.pet-wall-art-tint').evaluate(n=>n.getBoundingClientRect().height/document.getElementById('petCanvas').clientHeight<.52),'wall tint stays above wood floor');
 await page.evaluate(p=>Storage.save(p),beforeWall);
 for(const colour of ['blue','pink']){
  // Buy through the real transaction flow, then verify every paid prop is an image, never CSS/emoji.
  await page.evaluate(colour=>{
   const p=Storage.load();p.stars=1000;Storage.save(p);
   for(const slot of Pet.SLOTS){const id=slot+'-'+colour;const r=Pet.buyItem(id);if(!r.ok&&r.error==='owned')Pet.equip(id);else if(!r.ok)throw Error(id+': '+r.error);}
   PetView.stop();PetView.active=true;PetView.render();PetView.positionActor(PetRoom.template(Pet.snapshot().room).dog.spawn,true);PetView.setPose('idle');
  },colour);
  await page.waitForFunction(()=>[...document.querySelectorAll('#petRoom img')].every(i=>i.complete&&i.naturalWidth>0));
  for(const slot of ['bed','rug','bowl','toy','plant']){
   assert.equal(await page.locator('#petSlot-'+slot).getAttribute('data-item-id'),slot+'-'+colour);
   assert.equal(await page.locator('#petSlot-'+slot+'>img').count(),1);
   assert.equal(await page.locator('#petSlot-'+slot+'>svg').count(),0);
  }
  assert.equal(await page.locator('#petSlot-bed-front>img').count(),1);
  await page.setViewportSize({width:1280,height:900});await page.waitForTimeout(350);
  await page.locator('#petRoom').screenshot({path:path.join(__dirname,'out','pet-room-full-'+colour+'-1280.png')});
  await page.setViewportSize({width:390,height:844});await page.waitForTimeout(350);
  assert.ok(await page.evaluate(()=>{const r=document.getElementById('petRoom').getBoundingClientRect();return [...document.querySelectorAll('.pet-room-prop')].every(n=>{const b=n.getBoundingClientRect();return b.left>=r.left-1&&b.right<=r.right+1})}));
  await page.locator('#petRoom').screenshot({path:path.join(__dirname,'out','pet-room-full-'+colour+'-390.png')});
 }
 assert.deepEqual(errors,[]);await context.close();await browser.close();console.log('room e2e passed: data-driven eat / bed back-front depth / stage sizes / mobile ratio / legacy Cloud backup / CSS styles');
})().catch(e=>{console.error(e);process.exit(1)});
