const {chromium}=require('playwright'),assert=require('assert'),fs=require('fs'),path=require('path');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8773/';
(async()=>{const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});let checks=0;
const ok=(x,m)=>{assert.ok(x,m);checks++;};
try{for(const width of [390,1280]){
 const ctx=await browser.newContext({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390});
 await ctx.route('https://script.google.com/**',r=>r.fulfill({body:'[]',contentType:'application/json'}));
 const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(BASE+'?pilot=0');await p.waitForFunction(()=>window.App&&App.allData);
 await p.fill('#nameInput','Ms Hoa test');await p.click('#btnStart');
 await p.evaluate(()=>App._chooseSubject(App.allData.subjects.findIndex(s=>s.id==='tieng-anh')));
 const card=p.locator('[data-topic-id="en_mshoa-e2-u7"]');ok(await card.isVisible(),'U7 card visible at default U7 L3');
 await card.locator('.topic-toggle').click();await card.locator('.practice').click();
 ok(await p.locator('#qText').isVisible(),'real practice button launches new topic');
 const scope=await p.evaluate(()=>{
  const s=App.allData.subjects.find(s=>s.id==='tieng-anh'),t=s.topics.find(t=>t.id==='en_mshoa-e2-u7');
  App.setBookScope(s,{lesson:{'mshoa-explorer2':{unit:6,lesson:2}}});const old=App._allowedIndices(s,t).length;
  App.setBookScope(s,{lesson:{'mshoa-explorer2':{unit:7,lesson:3}}});const current=App._allowedIndices(s,t).length;
  Quiz.start(t,s.name,{mode:'test',subjectId:s.id,allowed:t.questions.map((_,i)=>i),count:20});return {old,current};
 });ok(scope.old===0&&scope.current===20,'lesson scope preserves older pupils and unlocks U7');
 const ids=new Set();
 for(let i=0;i<20;i++){
  const q=await p.evaluate(()=>Quiz.questions[Quiz.curIdx]);ids.add(q.id);
  ok(!/[àáạảãâăèéẹẻẽêìíịỉĩòóọỏõôơùúụủũưỳýỵỷỹđ]/i.test(q.q+q.choices.join(' ')),'English-only prompt and choices');
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no page overflow');
  ok(await p.locator('#ansGrid .ans-btn').evaluateAll(bs=>bs.every(b=>b.clientWidth>=44&&b.getBoundingClientRect().height>=44&&b.scrollWidth<=b.clientWidth+1)),'answer targets readable without clipping');
  if(width===390&&q.skill==='determiners-mixed'){fs.mkdirSync(path.join(__dirname,'../tmp'),{recursive:true});await p.screenshot({path:path.join(__dirname,'../tmp/mshoa-u7-390.png'),fullPage:true});}
  await p.locator('#ansGrid .ans-btn').filter({hasText:new RegExp('^'+q.choices[q.a].replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$')}).click();
  ok(await p.locator('#ansGrid .correct').count()===1,'correct source answer maps to one button');
  await p.locator('#btnNext').click();
 }
 ok(ids.size===20&&await p.evaluate(()=>Quiz.score===20),'full topic completes 20/20 without duplicates');
 ok(errors.length===0,'no browser exceptions '+errors.join(';'));
 await ctx.close();console.log('OK '+width+'px');
}console.log('mshoa U7 e2e OK — '+checks+' checks');}finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1)});
