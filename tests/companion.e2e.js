// Desktop companion: real timers, quiz quietness, per-child/day receipts, mobile hiding and read-only learning data.
// Run: node tests/companion.e2e.js; optional PET_BROWSER_CHANNEL=msedge, COMPANION_SHOTS=docs.
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
     const body=fs.readFileSync(file);
   return route.fulfill({contentType:type||'application/octet-stream',body});
  }
  if(url.hostname==='script.google.com')return route.fulfill({contentType:'application/json',body:url.searchParams.get('action')==='get'?'{"ok":true,"found":false,"ver":0}':route.request().method()==='POST'?'{"ok":true,"saved":true,"ver":1}':'[]'});
  return route.abort();
 });
 await page.goto('http://pet.test/');await page.waitForFunction(()=>App.allData&&App.allData.subjects.length>=3);

 await page.setViewportSize({width:1280,height:1000});
 await page.waitForFunction(()=>Companion.initialized);
 const out=path.join(root,process.env.COMPANION_SHOTS==='docs'?'docs/companion':'tests/out/companion');fs.mkdirSync(out,{recursive:true});
 const text=()=>page.locator('.companion-bubble').textContent();
 const speaking=()=>page.locator('.rail-companion').evaluate(n=>n.classList.contains('companion-speaking'));
 const shot=async name=>page.locator('.side-rail').screenshot({path:path.join(out,name+'.png'),animations:'disabled'});
 const player=async name=>page.evaluate(name=>{
   Storage.switchPlayer(name);App.playerName=name;App.currentGrade='lop3';
   const date=Today._dateKey();Storage.save({...Storage.load(),playerName:name,stars:137,achievements:{},
     todayPlan:{date,player:Storage.canonName(name),grade:'lop3',rewarded:false,tasks:['a','b','c'].map((id,i)=>({id,done:i===0,title:'Việc '+id,sub:'Ôn bài',minutes:5,icon:'book'}))}});
   App.showScreen('register');
 },name);
 const receipt=()=>page.evaluate(()=>localStorage.getItem(Companion.PREFIX+Companion.snapshot().key));
 await page.waitForTimeout(3200); // Initial guest greeting has settled.
 for(const reducedMotion of ['no-preference','reduce']){
   await page.emulateMedia({reducedMotion});
   const name='Bé Thỏ '+reducedMotion;
   await player(name);assert.equal(await text(),'Mình cùng học nhé!');
   assert.equal(await page.locator('.companion-button').evaluate(n=>n.getBoundingClientRect().height>=44),true);
   const before=await page.evaluate(()=>JSON.stringify(Cloud.collect(App.playerName).keys));
   if(reducedMotion==='no-preference')await shot('greet-1280');
   await page.waitForTimeout(1800);assert.equal(await speaking(),true,'readable dwell also with reduced motion');
   if(reducedMotion==='reduce')assert.equal(await page.locator('.rail-companion img').evaluate(n=>getComputedStyle(n).animationName),'none');
   await page.waitForTimeout(1500);assert.equal(await text(),'Kế hoạch hôm nay còn 2 việc.');
   if(reducedMotion==='no-preference')await shot('reminder-1280');
   await page.waitForTimeout(3200);assert.equal(await speaking(),false);
   await page.evaluate(()=>{Companion.sync();App.showScreen('subject');App.showScreen('register');});
   assert.equal(await speaking(),false,'reminder never repeats during same page session');
   assert.equal(await page.evaluate(()=>JSON.stringify(Cloud.collect(App.playerName).keys)),before,'greeting/reminder never writes learning data');
   // Known facts: one day with 7 correct plus a completed day with 0 correct.
   const days=await page.evaluate(()=>{const log={},ws=App._weekStart();const day=new Date(ws);day.setDate(ws.getDate()+(Today._dateKey(ws)<Today._dateKey()?1:0));
     log[Today._dateKey(day)]=0;log[Today._dateKey(ws)]=7;Storage.getStudyLog=()=>log;
     const d=Storage.load();d.lastStudyDate=Today._dateKey(day);Storage.save(d);return Object.keys(log).length;
   });
   const tapBefore=await page.evaluate(()=>JSON.stringify(Cloud.collect(App.playerName).keys));
   await page.locator('.companion-button').focus();await page.keyboard.press('Enter');
   assert.equal(await text(),'Tuần này con đã đúng 7 câu.');
   await page.locator('.companion-button').click();assert.equal(await text(),'Tuần này con đã học '+days+' ngày.');
   await page.evaluate(()=>App.showScreen('quiz'));
   assert.equal(await speaking(),false);assert.equal(await page.locator('.companion-button').isDisabled(),true);
   assert.match(await page.locator('.rail-companion img').getAttribute('src'),/tho-doc-sach/);
   await page.waitForTimeout(3300);assert.equal(await speaking(),false,'old callbacks cannot disturb quiz');
   assert.equal(await page.evaluate(()=>JSON.stringify(Cloud.collect(App.playerName).keys)),tapBefore,'taps/quiz quietness never write learning data');
   // No companion writes to learning data, stars, XP, or cloud snapshot.
   const after=await page.evaluate(()=>{const d=Storage.load();return {stars:d.stars};});assert.equal(after.stars,137);
   const complete=await page.evaluate(()=>{App.showScreen('register');const d=Storage.load();d.todayPlan.tasks.forEach(t=>t.done=true);Storage.save(d);return JSON.stringify(Cloud.collect(App.playerName).keys);});
   await page.evaluate(()=>Today.render());
   assert.equal(await page.evaluate(()=>JSON.stringify(Cloud.collect(App.playerName).keys)),complete,'celebration receipt never enters snapshot or changes profile');
   assert.equal(await text(),'Con đã xong 3 việc hôm nay!');assert.equal(await receipt(),'1');
   if(reducedMotion==='no-preference')await shot('celebrate-1280');
   await page.waitForTimeout(3300);await page.evaluate(()=>{Companion.sync();Companion.sync();});
   assert.equal(await speaking(),false);
   await page.goto('http://pet.test/');await page.waitForFunction(()=>App.allData&&Companion.initialized);
   assert.equal(await receipt(),'1');await page.waitForTimeout(3300);
   assert.equal(await speaking(),false,'reload may greet but cannot celebrate again');
   assert.equal(await page.evaluate(()=>JSON.stringify(Cloud.collect(App.playerName).keys)),complete,'drawing/reload never changes cloud snapshot');
   console.log('companion passed',reducedMotion);
 }
 // A new child can celebrate the same date independently. Same child can celebrate another date.
 await player('Bé Hai');await page.evaluate(()=>{const d=Storage.load();d.todayPlan.tasks.forEach(t=>t.done=true);Storage.save(d);Companion._clear();Companion.sync();});
 assert.equal(await receipt(),'1');assert.equal(await page.evaluate(()=>Companion.active),'celebrate');
 await page.evaluate(()=>{const real=Today._dateKey;Today._dateKey=d=>d?real.call(Today,d):'2030-01-02';const p=Storage.load();p.todayPlan.date='2030-01-02';Storage.save(p);Companion.sync();Companion._clear();Companion.sync();});
 assert.equal(await receipt(),'1');assert.equal(await page.evaluate(()=>Companion.active),'celebrate');
 await page.setViewportSize({width:1280,height:768});await page.waitForTimeout(150);assert.ok(await page.locator('.rail-companion').evaluate(n=>n.getBoundingClientRect().bottom<=innerHeight+1),'mascot fits shorter desktop rail');if(process.env.COMPANION_SHOTS==='docs')await shot('desktop-768');
 for(const width of [390,1100]){await page.setViewportSize({width,height:844});await page.waitForTimeout(100);assert.equal(await page.locator('.rail-companion').isVisible(),false);assert.equal(await speaking(),false);}
 assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
