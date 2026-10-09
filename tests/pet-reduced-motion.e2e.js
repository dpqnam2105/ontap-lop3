// Reduced motion skips interpolation/frames but preserves play, eat and callback cancellation.
// Run: node tests/pet-reduced-motion.e2e.js (optional PET_BROWSER_CHANNEL=msedge or chrome).
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.PET_BROWSER_CHANNEL?{channel:process.env.PET_BROWSER_CHANNEL}:{})});
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
 await page.evaluate(()=>{Storage.switchPlayer('Reduced Test');App.playerName='Reduced Test';const p=Storage.load();p.petAdopt={earnedAt:new Date().toISOString(),runId:'reduced',total:15,score:15};p.stars=100;Storage.save(p);Pet.adopt('Bông');const a=Storage.load();a.pet.stage=2;a.pet.growth=30;Storage.save(a);});
 const reset=async()=>page.evaluate(()=>{App.showScreen('pet');PetView.stop();PetView.active=true;PetView.render();PetView.positionActor({x:490,y:520},true);});
 const sample=()=>page.evaluate(()=>({time:performance.now(),point:PetView.displayedPoint(),pose:document.querySelector('#petActor svg').dataset.petPose,interval:PetView.poseTimer,raf:PetView.depthFrame,busy:PetView.busy,transition:getComputedStyle(document.getElementById('petActor')).transitionDuration}));
 for(const [stage,width] of [[0,548],[1,1280],[2,2560]]){
  await page.evaluate(stage=>{const p=Storage.load();p.pet.stage=stage;p.pet.growth=[0,10,30][stage];Storage.save(p);},stage);
  await page.setViewportSize({width,height:900});await reset();
  const target=await page.evaluate(()=>PetRoom.target(Pet.snapshot().room,'play'));
  const samples=await page.evaluate(()=>new Promise(resolve=>{
    const points=[],started=performance.now();
    const record=()=>points.push({time:performance.now()-started,point:PetView.displayedPoint(),pose:document.querySelector('#petActor svg').dataset.petPose,interval:PetView.poseTimer,raf:PetView.depthFrame,transition:getComputedStyle(document.getElementById('petActor')).transitionDuration});
    document.getElementById('petPlay').click();record();
    const timer=setInterval(record,10);setTimeout(()=>{clearInterval(timer);record();resolve(points);},700);
  }));
  const hops=samples.filter(s=>s.pose==='hop');assert.ok(hops.length,'hop is visible');
  assert.ok(hops.at(-1).time-hops[0].time>=400,'reduced play holds hop for 400ms: '+JSON.stringify(hops));
  for(const s of hops){assert.ok(Math.hypot(s.point.x-target.x,s.point.y-target.y)<3);assert.equal(s.interval,null);assert.equal(s.raf,null);assert.equal(s.transition,'0s');}
  assert.ok(samples.every(s=>Math.hypot(s.point.x-target.x,s.point.y-target.y)<3||Math.hypot(s.point.x-490,s.point.y-520)<3),'reduced travel has only endpoint positions');
  await page.waitForFunction(()=>!PetView.busy,{},{timeout:2000});
  const home=await sample();assert.ok(Math.hypot(home.point.x-490,home.point.y-520)<3);
  await reset();const before=await page.evaluate(()=>Pet.snapshot());await page.locator('#petFood').click();
  await page.waitForFunction(()=>document.querySelector('#petActor svg')?.dataset.petPose==='eat',{},{timeout:1500});
  await page.waitForTimeout(850);assert.equal((await sample()).pose,'eat','reduced feed keeps meal dwell');
  const after=await page.evaluate(()=>Pet.snapshot());assert.equal(after.growth,before.growth+1);assert.equal(after.bag.kibble,before.bag.kibble-1);
  await page.evaluate(()=>PetView.stop());await page.waitForTimeout(700);assert.equal((await sample()).busy,false,'stop cancels remaining callbacks');
  console.log('reduced motion passed',width);
 }
 assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});