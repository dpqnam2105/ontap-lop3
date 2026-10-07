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

 await page.locator('#petDecor').click();
 const button=page.locator('[data-accessory="bow-blue"]');await button.dblclick({delay:20});
 assert.equal(await page.evaluate(()=>Storage.load().stars),50);
 assert.equal(await page.evaluate(()=>Pet.wardrobe().equipped.head),'bow-blue');
 assert.equal(await page.locator('#petActor [data-pet-accessory="bow-blue"]').count(),1);
 await page.waitForTimeout(700);await page.locator('[data-unwear="head"]').click();
 assert.equal(await page.locator('#petActor [data-pet-accessory]').count(),0);assert.equal(await page.evaluate(()=>Storage.load().stars),50);
 await page.locator('[data-accessory="bow-blue"]').click();assert.equal(await page.evaluate(()=>Storage.load().stars),50);
 await page.reload();await page.waitForFunction(()=>App.allData&&App.allData.subjects.length>=3);await page.evaluate(()=>App.showScreen('pet'));await page.waitForTimeout(100);
 assert.equal(await page.evaluate(()=>Pet.wardrobe().equipped.head),'bow-blue');
 const snapshot=await page.evaluate(()=>Cloud.collect(App.playerName));
 await page.evaluate(()=>{const p=Storage.load();delete p.petWardrobe;Storage.save(p)});
 assert.ok(await page.evaluate(s=>Cloud.apply(s,App.playerName),snapshot));assert.equal(await page.evaluate(()=>Pet.wardrobe().equipped.head),'bow-blue');
 fs.mkdirSync(path.join(__dirname,'out'),{recursive:true});
 for(let stage=0;stage<3;stage++){
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(stage=>{const p=Storage.load();p.pet.stage=stage;p.pet.growth=[0,10,30][stage];Storage.save(p);PetView.stop();PetView.active=true;PetView.render();PetView.positionActor(PetRoom.template(Pet.snapshot().room).dog.spawn,true);PetView.setPose('idle')},stage);
  for(const pose of Object.keys({idle:0,walk:1,sit:2,sleep:3,wake:4,eat:5,wag:6,tilt:7,hop:8,sniff:9,chase:10,happy:11,celebrate:12})){
   await page.evaluate(pose=>PetView.setPose(pose),pose);
   assert.equal(await page.locator('#petActor [data-pet-accessory]').count(),pose==='sleep'?0:1);
  }
  await page.evaluate(()=>PetView.setPose('idle'));await page.waitForTimeout(100);
  await page.locator('#petRoom').screenshot({path:path.join(__dirname,'out','pet-bow-stage'+stage+'-390.png')});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 await page.setViewportSize({width:1440,height:1100});
 await page.evaluate(()=>{
  PetView.stop();const grid=document.createElement('div');grid.id='petAnchorReview';grid.style.cssText='position:absolute;top:0;left:0;background:#fff8ef;display:grid;grid-template-columns:repeat(8,170px);gap:8px;padding:12px;z-index:99999';
  for(let stage=0;stage<3;stage++)for(let frame=0;frame<16;frame++){
   const cell=document.createElement('div');cell.innerHTML='<div style="width:170px;height:170px">'+PetView.svg(stage,'idle',frame,'bow-blue')+'</div><small>stage '+stage+' · frame '+frame+'</small>';grid.appendChild(cell);
  }document.body.appendChild(grid);
 });
 await page.locator('#petAnchorReview').screenshot({path:path.join(__dirname,'out','pet-bow-anchors.png')});
 assert.deepEqual(errors,[]);await context.close();await browser.close();console.log('accessory e2e passed: buy/double click/remove/equip/reload/Cloud/3 stages/13 poses/mobile');
})().catch(e=>{console.error(e);process.exit(1)});
