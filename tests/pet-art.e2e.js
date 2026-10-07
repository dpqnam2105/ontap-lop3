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
   const type={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'}[path.extname(file)];
   return route.fulfill({contentType:type||'application/octet-stream',body:fs.readFileSync(file)});
  }
  if(url.hostname==='script.google.com')return route.fulfill({contentType:'application/json',body:url.searchParams.get('action')==='get'?'{"ok":true,"found":false,"ver":0}':route.request().method()==='POST'?'{"ok":true,"saved":true,"ver":1}':'[]'});
  return route.abort();
 });
 await page.goto('http://pet.test/');await page.waitForFunction(()=>App.allData&&App.allData.subjects.length>=3);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(()=>{Storage.switchPlayer('Bé Duyệt Hình');App.playerName='Bé Duyệt Hình';const p=Storage.load();p.petAdopt={earnedAt:new Date().toISOString(),runId:'art-test',total:15,score:15};p.stars=100;Storage.save(p);Pet.adopt('Bông');App.showScreen('pet')});
 await page.waitForTimeout(100);
 const expected={idle:0,walk:1,sit:2,sleep:3,wake:4,eat:5,wag:6,tilt:7,hop:8,sniff:9,chase:10,happy:11,celebrate:12};
 for(let stage=0;stage<3;stage++){
  await page.evaluate(stage=>{const p=Storage.load();p.pet.stage=stage;p.pet.growth=[0,10,30][stage];Storage.save(p);PetView.render()},stage);
  const before=await page.evaluate(()=>JSON.stringify(Storage.load()));
  for(const [pose,frame] of Object.entries(expected)){
   await page.evaluate(pose=>PetView.setPose(pose),pose);
   const sprite=page.locator('#petActor>svg');
   assert.equal(await sprite.getAttribute('data-pet-frame'),String(frame));
   assert.equal(await sprite.getAttribute('data-pet-stage'),String(stage));
   assert.ok((await sprite.locator('image').getAttribute('href')).includes('stage'+stage+'-v2.png'));
  }
  assert.equal(await page.evaluate(()=>JSON.stringify(Storage.load())),before,'drawing never modifies profile');
  await page.evaluate(()=>PetView.setPose('unknown'));assert.equal(await page.locator('#petActor>svg').getAttribute('data-pet-frame'),'0');
  const loaded=await page.evaluate(stage=>new Promise(resolve=>{const img=new Image();img.onload=()=>resolve([img.naturalWidth,img.naturalHeight]);img.onerror=()=>resolve(null);img.src=PetView.artPath(stage)}),stage);
  assert.deepEqual(loaded,[1254,1254]);
  for(const width of [360,390,430,1280]){
   await page.setViewportSize({width,height:844});
   await page.waitForTimeout(350); // Let the existing rail width transition settle after changing viewport.
   await page.evaluate(()=>{PetView.setPose('chase');PetView.positionActor(76)});
   const actor=await page.locator('#petActor').boundingBox(), room=await page.locator('#petRoom').boundingBox();
   assert.ok(actor.x>=room.x-1 && actor.x+actor.width<=room.x+room.width+1,'dog stays in room');
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
   if(width===360){const labels=await page.evaluate(()=>[...document.querySelectorAll('.side-rail .lbl-short')].filter(e=>e.getBoundingClientRect().width>0).map(e=>({text:e.textContent,width:e.clientWidth,scroll:e.scrollWidth})));assert.ok(labels.every(e=>e.scroll<=e.width),'all short labels fit '+JSON.stringify(labels));}
  }
 }
 assert.equal(await page.evaluate(()=>Pet.KIND),'dog-fluffy-brown');
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>PetView.setPose('walk'));await page.waitForTimeout(350);
 assert.equal(await page.locator('#petActor>svg').getAttribute('data-pet-frame'),'13','second walking frame');
 await page.evaluate(()=>App.showScreen('register'));assert.equal(await page.evaluate(()=>PetView.poseTimer),null);
 await page.evaluate(()=>App.showScreen('pet'));await page.waitForTimeout(50);
 await page.evaluate(()=>PetView.setPose('walk'));assert.ok(await page.evaluate(()=>PetView.poseTimer));
 await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>PetView.poseTimer===null,{},{timeout:1500});
 assert.equal(await page.evaluate(()=>PetView.poseTimer),null,'changing reduced motion stops the existing frame timer');
 fs.mkdirSync(path.join(__dirname,'out'),{recursive:true});
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>{PetView.stop();PetView.active=true;PetView.render()});
 await page.waitForTimeout(500);
 await page.screenshot({path:path.join(__dirname,'out','pet-painted-390.png'),fullPage:true});
 await page.goto('http://pet.test/docs/pet-art-preview.html');await page.setViewportSize({width:1280,height:900});
 await page.waitForTimeout(500);assert.equal(await page.locator('#poses .card').count(),42);
 assert.equal(await page.locator('#growth [data-pet-accessory]').count(),1,'bow is a separate layer');
 await page.locator('#tryBow').check();assert.equal(await page.locator('#poses [data-pet-accessory]').count(),14,'bow follows every baby pose only');
 await page.screenshot({path:path.join(__dirname,'out','pet-art-bow-poses.png'),fullPage:true});
 await page.locator('#tryBow').uncheck();assert.equal(await page.locator('#poses [data-pet-accessory]').count(),0,'bow removes without changing base image');
 await page.screenshot({path:path.join(__dirname,'out','pet-art-poses.png'),fullPage:true});
 await page.locator('#growth').screenshot({path:path.join(__dirname,'out','pet-growth-v2.png')});
 assert.deepEqual(errors,[]);await context.close();await browser.close();console.log('pet art e2e passed: 3 stages / 13 contract poses / real PNGs / no profile mutations / bounds / rail / animation cleanup / reduced motion');
})().catch(e=>{console.error(e);process.exit(1)});
