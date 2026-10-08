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


 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>{PetView.stop();PetView.active=true;PetView.render();PetView.positionActor({x:650,y:530},true)});
 const before=await page.evaluate(()=>PetView.displayedPoint());
 await page.evaluate(()=>PetView.render());const after=await page.evaluate(()=>PetView.displayedPoint());
 assert.ok(Math.abs(before.x-after.x)<1,'render retains foot instead of resetting to spawn');
 await page.locator('#petFood').click();const start=await page.evaluate(()=>PetView.displayedPoint());assert.ok(Math.abs(start.x-before.x)<5,'feed starts from current foot');
 await page.waitForTimeout(250);const mid=await page.evaluate(()=>PetView.displayedPoint());assert.ok(mid.x<start.x-5&&mid.x>335+5,'travel has intermediate positions');
 assert.equal(await page.locator('#petActor svg').getAttribute('data-pet-pose'),'walk');assert.equal(await page.locator('#petActor').evaluate(n=>n.style.getPropertyValue('--pet-facing')),'-1');
 await page.waitForTimeout(1050);assert.equal(await page.locator('#petActor svg').getAttribute('data-pet-pose'),'eat');
 await page.waitForFunction(()=>!PetView.busy,{},{timeout:6000});
 await page.evaluate(()=>{PetView.positionActor({x:650,y:530},true);PetView.positionActor({x:335,y:530})});await page.waitForTimeout(200);await page.evaluate(()=>PetView.stop());
 const frozen=await page.evaluate(()=>PetView.displayedPoint());await page.waitForTimeout(350);assert.ok(Math.abs(frozen.x-(await page.evaluate(()=>PetView.displayedPoint())).x)<1,'stop freezes CSS motion too');
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>{PetView.active=true;PetView.positionActor({x:490,y:530})});assert.equal(await page.evaluate(()=>PetView.depthFrame),null);
 fs.mkdirSync(path.join(__dirname,'out'),{recursive:true});await page.setViewportSize({width:390,height:844});
 await page.evaluate(()=>{const p=Storage.load();p.pet.stage=2;p.pet.growth=30;Storage.save(p);PetView.render();PetView.positionActor(PetRoom.template(Pet.snapshot().room).dog.spawn,true);PetView.setPose('idle')});
 await page.locator('#petRoom').screenshot({path:path.join(__dirname,'out','pet-feedback-390.png')});
 await page.setViewportSize({width:1280,height:900});await page.waitForTimeout(350);await page.locator('#petRoom').screenshot({path:path.join(__dirname,'out','pet-feedback-1280.png')});

 const originals=await page.evaluate(()=>({rects:PetView.frameRects[2]}));
 await page.evaluate(rects=>{window._newAdultPath=PetView.artPath;window._newAdultClip=window.PetAdultArt;PetView.frameRects[2]=rects;window.PetAdultArt=null;PetView.artPath=stage=>'assets/pet/dog-fluffy-brown-stage'+stage+'-v2.webp';PetView.setPose('idle')},JSON.parse(fs.readFileSync(path.join(__dirname,'fixtures/pet-adult-rects-v2.json'),'utf8')));
 await page.locator('#petActor image').evaluate(n=>new Promise(resolve=>{const i=new Image();i.onload=resolve;i.src=n.getAttribute('href')}));
 await page.locator('#petRoom').screenshot({path:path.join(__dirname,'out','pet-feedback-before-1280.png')});
 await page.evaluate(rects=>{PetView.frameRects[2]=rects;PetView.artPath=window._newAdultPath;window.PetAdultArt=window._newAdultClip;PetView.setPose('idle')},originals.rects);
 await page.setViewportSize({width:390,height:844});await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>{PetView.stop();PetView.active=true;PetView.render();PetView.positionActor(PetRoom.template(Pet.snapshot().room).dog.spawn,true);PetView.perform('play')});
 for(let frame=0;frame<24;frame++){await page.locator('#petRoom').screenshot({path:path.join(__dirname,'out','pet-motion-'+String(frame).padStart(2,'0')+'.png')});await page.waitForTimeout(110);}
 assert.deepEqual(errors,[]);await context.close();await browser.close();console.log('motion e2e passed: render continuity / intermediate travel / arrival before eat / freeze / reduced motion');
})().catch(e=>{console.error(e);process.exit(1)});
