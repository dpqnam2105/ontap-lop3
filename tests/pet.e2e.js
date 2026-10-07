const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const b=await chromium.launch({headless:true,channel:process.env.PET_BROWSER_CHANNEL||'chrome'});
 const ctx=await b.newContext();const p=await ctx.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
 await ctx.route('**/*',async r=>{
   const u=new URL(r.request().url());
   if(u.hostname==='pet.test'){
     const file=path.resolve(root,'.'+decodeURIComponent(u.pathname==='/'?'/index.html':u.pathname));
     if(!file.startsWith(root+path.sep))return r.fulfill({status:403,body:''});
     if(!fs.existsSync(file))return r.fulfill({status:404,body:''});
     const ext=path.extname(file),types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
     return r.fulfill({contentType:types[ext]||'application/octet-stream',body:fs.readFileSync(file)});
   }
   if(u.hostname==='script.google.com')return r.fulfill({contentType:'application/json',body:u.searchParams.get('action')==='get'?'{"ok":true,"found":false,"ver":0}':r.request().method()==='POST'?'{"ok":true,"saved":true,"ver":1}':'[]'});
   return r.abort();
 });
 await p.goto('http://pet.test/');await p.waitForTimeout(500);
 await p.evaluate(()=>{App.showScreen('pet')});
 assert.equal(await p.locator('#screenPet.active').count(),0,'guest blocked');
 await p.evaluate(()=>{Storage.switchPlayer('Bé Thử Cún');App.playerName='Bé Thử Cún';Pet.adoptionPrice=0;Pet.FOODS.kibble.price=5;const data=Storage.load();data.stars=100;Storage.save(data);App.showScreen('pet')});
 await p.fill('#petAdopt input','Bông');await p.locator('#petAdopt button').click();
 assert.equal(await p.locator('.pet-name>b').textContent(),'Bông');
 await p.waitForTimeout(4100);
 await p.locator('[data-food="kibble"]').click();
 const before=await p.evaluate(()=>Storage.load().pet.growth);
 await p.locator('[data-feed="kibble"]').click();await p.evaluate(()=>document.querySelector('[data-feed="kibble"]').click());
 assert.equal(await p.evaluate(()=>Storage.load().pet.growth),before+1,'double feed blocked');
 assert.equal(await p.evaluate(()=>Storage.load().stars),95);
 // Reload while animation is running: persistent action already committed.
 await p.reload();await p.waitForTimeout(500);await p.evaluate(()=>App.showScreen('pet'));
 assert.equal(await p.evaluate(()=>Storage.load().pet.growth),before+1);
 const snapshot=await p.evaluate(()=>Cloud.collect(App.playerName));
 await p.evaluate(()=>{const d=Storage.load();d.pet.name='Changed';Storage.save(d)});
 assert.ok(await p.evaluate(s=>Cloud.apply(s,App.playerName),snapshot));
 assert.equal(await p.evaluate(()=>Storage.load().pet.name),'Bông');
 await p.evaluate(()=>{App.showScreen('register');App.showScreen('pet')});await p.waitForTimeout(4100);
 for(const width of [360,390,430,1280]){
   await p.setViewportSize({width,height:844});
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow '+width);
   const nav=await p.locator('.rail-btn[data-screen="pet"]').boundingBox();assert.ok(nav&&nav.x+nav.width<=width,'pet nav visible '+width);
   if(width===390||width===1280){fs.mkdirSync(path.join(__dirname,'out'),{recursive:true});await p.screenshot({path:path.join(__dirname,'out','pet-'+width+'.png'),fullPage:true});}
 }
 await p.evaluate(()=>App.showScreen('register'));assert.equal(await p.evaluate(()=>PetView.active),false);assert.equal(await p.evaluate(()=>PetView.busy),false);
 assert.deepEqual(errors,[]);
 await ctx.close();await b.close();console.log('pet e2e passed: guest / adopt / buy / double feed / reload / backup / mobile / stop');
})().catch(e=>{console.error(e);process.exit(1)});
