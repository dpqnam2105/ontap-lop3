// Shop stays inside mobile viewport; pet reaches the toy during its interaction.
// Run: node tests/layout-regression.e2e.js (optional PET_BROWSER_CHANNEL=msedge or chrome).
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
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>{Storage.switchPlayer('Layout Test');App.playerName='Layout Test';const p=Storage.load();p.petAdopt={earnedAt:new Date().toISOString(),runId:'layout',total:15,score:15};Storage.save(p);Pet.adopt('Bông');const adopted=Storage.load();adopted.pet.stage=2;adopted.pet.growth=30;Storage.save(adopted);});
 for(const width of [360,390,430,1280,1920,2560]){
  await page.setViewportSize({width,height:900});
  await page.evaluate(()=>App.showScreen('shop'));await page.waitForTimeout(450);
  const overflow=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,bad:[...document.querySelectorAll('#screenShop *')].filter(n=>{const r=n.getBoundingClientRect();return r.width&&r.right>innerWidth+1;}).slice(0,10).map(n=>({cls:n.className,right:n.getBoundingClientRect().right,width:n.getBoundingClientRect().width}))}));
  assert.deepEqual(overflow.bad,[], 'shop children must fit viewport '+width); fs.mkdirSync(path.join(__dirname,'out'),{recursive:true}); if(width===390||width===1280)await page.screenshot({path:path.join(__dirname,'out','shop-fixed-'+width+'.png'),fullPage:true});
  await page.evaluate(()=>{App.showScreen('pet');PetView.stop();PetView.active=true;PetView.render();PetView.positionActor({x:490,y:520},true);PetView.perform('play');});
  const points=[];for(let i=0;i<18;i++){points.push(await page.evaluate(()=>({p:PetView.displayedPoint(),pose:document.querySelector('#petActor svg').dataset.petPose,target:PetRoom.target(Pet.snapshot().room,'play')})));await page.waitForTimeout(100);}
  const hops=points.filter(x=>x.pose==='hop'); assert.ok(hops.length,'pet reaches interaction pose at '+width); const closest=Math.min(...hops.map(x=>Math.hypot(x.p.x-x.target.x,x.p.y-x.target.y))); assert.ok(closest<3,'pet reaches toy spot during hop at '+width+' (closest '+closest+')'); assert.ok(points.some(x=>x.p.x>510&&x.p.x<660),'pet has intermediate positions at '+width); console.log('shop and pet regression passed',width);
  await page.evaluate(()=>PetView.stop());
 }
 assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
