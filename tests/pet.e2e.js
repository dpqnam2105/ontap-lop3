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
     const ext=path.extname(file),types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg'};
     return r.fulfill({contentType:types[ext]||'application/octet-stream',body:fs.readFileSync(file)});
   }
   if(u.hostname==='script.google.com')return r.fulfill({contentType:'application/json',body:u.searchParams.get('action')==='get'?'{"ok":true,"found":false,"ver":0}':r.request().method()==='POST'?'{"ok":true,"saved":true,"ver":1}':'[]'});
   return r.abort();
 });
 await p.goto('http://pet.test/');await p.waitForTimeout(500);
 await p.waitForFunction(()=>App.allData && App.allData.subjects.length>=3);
 await p.evaluate(()=>{App.showScreen('pet')});
 assert.equal(await p.locator('#screenPet.active').count(),0,'guest blocked');
 await p.evaluate(()=>{Storage.switchPlayer('Bé Thử Cún');App.playerName='Bé Thử Cún';const data=Storage.load();data.stars=100;Storage.save(data);App.showScreen('pet')});
 assert.equal(await p.locator('#petAdopt').count(),0,'cannot adopt before challenge');
 await p.locator('#petChallenge').click();
 const shape=await p.evaluate(()=>({counts:Quiz.questions.reduce((a,q)=>(a[q.subjectId]=(a[q.subjectId]||0)+1,a),{}),total:Quiz._mainTotal(),replay:Quiz._lastLaunch,label:Quiz.sessionInfo.modeLabel}));
 assert.deepEqual(shape.counts,{toan:5,'tieng-viet':5,'tieng-anh':5});assert.equal(shape.total,15);assert.equal(shape.replay,null);assert.equal(shape.label,'Thử thách đón cún 🐶');
 await p.evaluate(()=>{const q=Quiz.questions[0];[...document.querySelectorAll('.ans-btn')].find(b=>b.textContent===String(q.choices[q.a])).click();document.getElementById('btnNext').click();App.showScreen('pet')});
 assert.equal(await p.evaluate(()=>!!Storage.load().petAdopt),false,'abandoned run gives no right');
 await p.evaluate(()=>{Storage.set('todayPlan',{date:Today._dateKey(),grade:App.currentGrade,player:Storage.canonName(App.playerName),rewarded:false,tasks:[{id:'mix-test',kind:'mix',subjectId:'pet_adopt',done:false}]});});
 await p.locator('#petChallenge').click();
 // A wrong first answer creates a retry. Complete the actual mixed flow, including that retry.
 await p.evaluate(()=>{const q=Quiz.questions[0];[...document.querySelectorAll('.ans-btn')].find(b=>b.textContent!==String(q.choices[q.a])).click()});
 for(let i=0;i<35;i++){
   if(!await p.locator('#screenQuiz').evaluate(el=>el.classList.contains('active')))break;
   await p.evaluate(()=>{const q=Quiz.questions[Quiz.curIdx];[...document.querySelectorAll('.ans-btn')].find(b=>b.textContent===String(q.choices[q.a])&&!b.disabled).click();document.getElementById('btnNext').click()});
   await p.waitForTimeout(30);
 }
 assert.equal(await p.locator('#screenResult.active').count(),1);
 const earned=await p.evaluate(()=>({right:Storage.load().petAdopt,weekly:Storage.get('weeklyMix'),plan:Storage.get('todayPlan'),retry:Quiz.questions.some(q=>q._retry),flag:Quiz.challenge}));
 assert.ok(earned.right);assert.equal(earned.right.total,15);assert.ok(earned.retry);assert.equal(earned.flag,null);assert.equal(earned.plan.tasks[0].done,false);assert.ok(!earned.weekly||!Object.hasOwn(earned.weekly,''),'no empty weekly key');
 await p.evaluate(()=>Quiz._finish());
 assert.deepEqual(await p.evaluate(()=>Storage.load().petAdopt),earned.right,'finish twice grants once');
 assert.ok(await p.evaluate(()=>!Storage.get('weeklyMix')||!Object.hasOwn(Storage.get('weeklyMix'),'')));
 const earnedBackup=await p.evaluate(()=>Cloud.collect(App.playerName));
 await p.reload();await p.waitForFunction(()=>App.allData&&App.allData.subjects.length>=3);await p.evaluate(()=>App.showScreen('pet'));
 assert.equal(await p.locator('#petAdopt').count(),1,'earned right survives reload before naming');
 await p.evaluate(()=>{const data=Storage.load();delete data.petAdopt;Storage.save(data)});
 assert.ok(await p.evaluate(s=>Cloud.apply(s,App.playerName),earnedBackup));
 await p.evaluate(()=>{App.showScreen('pet')});assert.equal(await p.locator('#petAdopt').count(),1,'earned right restored by backup');
 await p.fill('#petAdopt input','Bông');await p.locator('#petAdopt button').click();
 assert.equal(await p.locator('.pet-name>b').textContent(),'Bông');
 assert.equal(await p.evaluate(()=>Storage.load().pet.bag.kibble),6);
 const adoptionStars=await p.evaluate(()=>Storage.load().stars);
 await p.waitForTimeout(4100);
 await p.emulateMedia({reducedMotion:'reduce'});
 await p.locator('[data-food="kibble"]').click();
 await p.evaluate(()=>document.querySelector('[data-food="kibble"]').click());
 assert.equal(await p.evaluate(()=>Storage.load().stars),adoptionStars-10,'rapid purchase blocked');
 await p.waitForTimeout(650);assert.equal(await p.locator('[data-food="kibble"]').isDisabled(),false);
 await p.emulateMedia({reducedMotion:'no-preference'});
 const before=await p.evaluate(()=>Storage.load().pet.growth);
 await p.locator('[data-feed="kibble"]').click();await p.evaluate(()=>document.querySelector('[data-feed="kibble"]').click());
 assert.equal(await p.evaluate(()=>Storage.load().pet.growth),before+1,'double feed blocked');
 assert.equal(await p.evaluate(()=>Storage.load().stars),adoptionStars-10);
 // Reload while animation is running: persistent action already committed.
 await p.reload();await p.waitForTimeout(500);await p.evaluate(()=>App.showScreen('pet'));
 assert.equal(await p.evaluate(()=>Storage.load().pet.growth),before+1);
 const snapshot=await p.evaluate(()=>Cloud.collect(App.playerName));
 await p.evaluate(()=>{const d=Storage.load();d.pet.name='Changed';Storage.save(d)});
 assert.ok(await p.evaluate(s=>Cloud.apply(s,App.playerName),snapshot));
 assert.equal(await p.evaluate(()=>Storage.load().pet.name),'Bông');
 await p.evaluate(()=>{App.showScreen('register');App.showScreen('pet')});await p.waitForTimeout(4100);
 await p.setViewportSize({width:390,height:844});
 const growth=await p.evaluate(()=>Storage.load().pet.growth);
 await p.locator('#petFood').click();assert.equal(await p.evaluate(()=>Storage.load().pet.growth),growth+1,'primary feed acts immediately');
 await p.waitForTimeout(4800);
 await p.evaluate(()=>{const d=Storage.load();d.pet.bag.kibble=0;d.pet.bag.treat=0;Storage.save(d)});
 await p.locator('#petFood').click();await p.waitForTimeout(700);
 assert.match(await p.locator('#petStatus').textContent(),/Túi hết/);assert.ok((await p.locator('#petPanel').boundingBox()).y<600,'empty bag opens visible shop');
 await p.evaluate(()=>{const d=Storage.load();d.pet.bag.kibble=0;d.pet.bag.treat=1;Storage.save(d)});
 await p.locator('#petFood').click();assert.equal(await p.evaluate(()=>Storage.load().pet.bag.treat),0,'treat fallback');await p.waitForTimeout(4800);
 const cap=await p.evaluate(()=>Storage.load().pet.growth);
 await p.locator('#petFood').click();await p.waitForTimeout(1400);
 assert.equal(await p.evaluate(()=>Storage.load().pet.growth),cap,'cap does not feed');
 assert.match(await p.locator('#petStatus').textContent(),/đã ăn đủ/);
 assert.ok((await p.locator('#petPanel').boundingBox()).y<600,'panel scrolled into view');
 await p.locator('#petDecor').click();await p.waitForTimeout(700);assert.equal(await p.locator('#petPanel h3').textContent(),'Góc trang trí');
 // Returning to a visible tab resumes idle without writing a visit or greeting.
 const resumed=await p.evaluate(()=>{let visits=0;const old=Pet.visit;Pet.visit=()=>{visits++;return old.call(Pet)};PetView.stop();PetView.resume();Pet.visit=old;return {visits,state:PetView.state,busy:PetView.busy,idle:!!PetView.idleTimer}});
 assert.deepEqual(resumed,{visits:0,state:'idle',busy:false,idle:true});
 for(const width of [360,390,430,1280]){
   await p.setViewportSize({width,height:844});
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no overflow '+width);
   const nav=await p.locator('.rail-btn[data-screen="pet"]').boundingBox();assert.ok(nav&&nav.x+nav.width<=width,'pet nav visible '+width);
   if(width<=430){const labels=await p.evaluate(()=>[...document.querySelectorAll('.side-rail .lbl-short')].filter(e=>e.getBoundingClientRect().width>0).map(e=>({text:e.textContent,width:e.clientWidth,scroll:e.scrollWidth})));assert.ok(labels.every(e=>e.scroll<=e.width),'short labels not clipped '+width+' '+JSON.stringify(labels));}
   if(width===390||width===1280){fs.mkdirSync(path.join(__dirname,'out'),{recursive:true});await p.screenshot({path:path.join(__dirname,'out','pet-'+width+'.png'),fullPage:true});}
 }
 await p.evaluate(()=>App.showScreen('register'));assert.equal(await p.evaluate(()=>PetView.active),false);assert.equal(await p.evaluate(()=>PetView.busy),false);
 // Ordinary mixed session neither grants adoption nor inherits the challenge flag.
 await p.evaluate(()=>{Storage.switchPlayer('Bé Đề Trộn');App.playerName='Bé Đề Trộn';const s=App.allData.subjects.find(s=>s.id==='toan');const mix=App._buildWeeklyMix(s);Quiz.startMixed(mix.pool.slice(0,5),s.name,s.id,'normal-pet-regression')});
 for(let i=0;i<5;i++)await p.evaluate(()=>{const q=Quiz.questions[Quiz.curIdx];[...document.querySelectorAll('.ans-btn')].find(b=>b.textContent===String(q.choices[q.a])).click();document.getElementById('btnNext').click()});
 assert.equal(await p.evaluate(()=>!!Storage.load().petAdopt),false);assert.ok(await p.evaluate(()=>Storage.get('weeklyMix')['normal-pet-regression']));
 const flags=await p.evaluate(()=>{const out=[];Quiz.challenge={kind:'pet_adopt'};Quiz.startReviewPool([]);out.push(Quiz.challenge);Quiz.challenge={kind:'pet_adopt'};Quiz.startWrongReview(1);out.push(Quiz.challenge);const s=App.allData.subjects.find(s=>s.id==='toan'),t=s.topics[0];Quiz.challenge={kind:'pet_adopt'};Quiz.start(t,s.name,{mode:'test',subjectId:s.id,allowed:[0]});out.push(Quiz.challenge);return out});
 assert.deepEqual(flags,[null,null,null]);
 assert.deepEqual(errors,[]);
 await ctx.close();await b.close();console.log('pet e2e passed: guest / adopt / buy / double feed / reload / backup / mobile / stop');
})().catch(e=>{console.error(e);process.exit(1)});
