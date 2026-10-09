// Compact topics: keyboard accordion, scoped review counts/sessions, guest guard and screenshots.
// Run: node tests/topic-cards.e2e.js (optional PET_BROWSER_CHANNEL=msedge or chrome).
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
   const relative=path.relative(root,file).split(path.sep).join('/');
   const body=process.env.TOPIC_BEFORE&&['index.html','js/app.js','js/quiz.js','js/guest-flow-guard.js','style.css'].includes(relative)?require('node:child_process').execFileSync('git',['show','31abf22:'+relative],{cwd:root}):fs.readFileSync(file);
   return route.fulfill({contentType:type||'application/octet-stream',body});
  }
  if(url.hostname==='script.google.com')return route.fulfill({contentType:'application/json',body:url.searchParams.get('action')==='get'?'{"ok":true,"found":false,"ver":0}':route.request().method()==='POST'?'{"ok":true,"saved":true,"ver":1}':'[]'});
  return route.abort();
 });
 await page.goto('http://pet.test/');await page.waitForFunction(()=>App.allData&&App.allData.subjects.length>=3);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.evaluate(()=>{Storage.switchPlayer('Bé Duyệt');App.playerName='Bé Duyệt';App.currentGrade='lop3';Storage.save({...Storage.load(),playerName:'Bé Duyệt'});});
 const choose=async subject=>{await page.evaluate(subject=>App._chooseSubject(App.allData.subjects.findIndex(s=>s.id===subject)),subject);await page.waitForTimeout(100);};
 const ms=()=>page.locator('[data-topic-id="en_mshoa-e2-u6"]');
 const out=path.join(root,'docs','topic-cards');fs.mkdirSync(out,{recursive:true});
 for(const width of [390,1280]){
  await page.setViewportSize({width,height:900});
  await page.evaluate(()=>{const s=App.allData.subjects.find(x=>x.id==='toan');App.setStageSetting(s,1,false);Storage.saveTopicProgress('toan_bang-nhan-chia',[],[0,1]);});
  await choose('toan');
  await page.locator('#topicList').screenshot({path:path.join(out,(process.env.TOPIC_BEFORE?'before':'after')+'-closed-'+width+'.png')});
  if(process.env.TOPIC_BEFORE)continue;
  assert.equal(await page.locator('.topic-toggle[aria-expanded="true"]').count(),0);
  await page.evaluate(()=>{window.__starts=0;if(!window.__originalStart){window.__originalStart=Quiz.start;Quiz.start=function(...args){window.__starts++;return window.__originalStart.apply(this,args);}}});
  const first=page.locator('#topicList .topic-toggle').first();await first.focus();await page.keyboard.press('Enter');
  assert.equal(await first.getAttribute('aria-expanded'),'true');assert.equal(await page.evaluate(()=>__starts),0);
  assert.equal(await page.locator('#topicList .topic-actions:visible').count(),1);
  assert.equal(await page.locator('#topicList .topic-card').first().locator('.mode-btn.review').count(),0);
  await page.locator('#topicList').screenshot({path:path.join(out,'after-no-review-'+width+'.png')});
  const second=page.locator('[data-topic-id="toan_bang-nhan-chia"] .topic-toggle');await second.focus();await page.keyboard.press('Space');
  assert.equal(await first.getAttribute('aria-expanded'),'false');assert.equal(await second.getAttribute('aria-expanded'),'true');
  assert.match(await page.locator('[data-topic-id="toan_bang-nhan-chia"] .mode-btn.review').textContent(),/2 câu/);
  assert.equal(await page.evaluate(()=>__starts),0);
  const focused=await second.evaluate(n=>getComputedStyle(n).outlineStyle);assert.notEqual(focused,'none');
  await page.locator('#topicList').screenshot({path:path.join(out,'after-with-review-'+width+'.png')});
  if(width===1280){const heights=await page.locator('#topicList .topic-card').evaluateAll(ns=>ns.slice(0,2).map(n=>n.getBoundingClientRect().height));assert.ok(heights[1]>heights[0],'neighbor card is not stretched to open height');}
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.ok(await page.locator('#topicList .topic-card').evaluateAll(ns=>ns.every(n=>n.getBoundingClientRect().right<=innerWidth+1)), 'cards fit viewport, not merely hidden overflow');
  // Same source as the actual review session, including wrongs from an excluded lesson.
  await page.evaluate(()=>{const s=App.allData.subjects.find(x=>x.id==='tieng-anh');App.setBookScope(s,{lesson:{'mshoa-explorer2':{unit:6,lesson:1}}});Storage.saveTopicProgress('en_mshoa-e2-u6',[],[12,15]);});
  await choose('tieng-anh');await ms().locator('.topic-toggle').click();assert.equal(await ms().locator('.mode-btn.review').count(),0);
  await page.evaluate(()=>Storage.saveTopicProgress('en_mshoa-e2-u6',[],[0,1,12,15]));await choose('tieng-anh');await ms().locator('.topic-toggle').click();
  assert.match(await ms().locator('.mode-btn.review').textContent(),/2 câu/);await ms().locator('.mode-btn.review').click();
  const qs=await page.evaluate(()=>Quiz.questions.map(q=>({id:q.id,i:q._idx,l:q.bookLesson.lesson})));assert.equal(qs.length,2);assert.ok(qs.every(q=>q.l===1));
  await page.evaluate(()=>{const s=App.allData.subjects.find(x=>x.id==='tieng-anh');App.setBookScope(s,{lesson:{'mshoa-explorer2':{unit:6,lesson:2}}});Storage.saveTopicProgress('en_mshoa-e2-u6',[],Array.from({length:23},(_,i)=>i));});
  await choose('tieng-anh');await ms().locator('.topic-toggle').click();assert.match(await ms().locator('.mode-btn.review').textContent(),/20 câu/);await ms().locator('.mode-btn.review').click();assert.equal(await page.evaluate(()=>Quiz.questions.length),20);
  await choose('tieng-anh');await ms().locator('.topic-toggle').click();await choose('tieng-anh');assert.equal(await ms().locator('.topic-toggle').getAttribute('aria-expanded'),'false','redraw closes card');
  const labels=await page.evaluate(()=>[0,1,40,70,90,100].map(p=>App._topicStatus(p).label));assert.deepEqual(labels,['Chưa bắt đầu','Đang luyện','Đang luyện','Đang luyện','Đã làm gần hết','Đã làm gần hết']);
  // Mastery still comes from spaced-review boxes, not coverage.
  await page.evaluate(()=>{const s=App.allData.subjects.find(x=>x.id==='tieng-anh'),t=s.topics.find(t=>t.id==='en_mshoa-e2-u6');const rv={};t.questions.forEach(q=>rv[q.id]={box:Storage.MASTER_BOX});const old=Storage.getReviewMap;Storage.getReviewMap=()=>rv;App._chooseSubject(App.allData.subjects.indexOf(s));Storage.getReviewMap=old;});
  assert.match(await ms().locator('.topic-status-tag').textContent(),/Đã vững/);
  // The guest may expand a rendered card but is blocked before starting a lesson.
  await page.evaluate(()=>{Storage.switchPlayer('');App.playerName='';document.getElementById('nameInput').value='';localStorage.removeItem(Storage.KEY);});
  await ms().locator('.topic-toggle').click();assert.equal(await page.locator('#guestFlowNotice').count(),0);
  await ms().locator('.mode-btn.practice').click();assert.equal(await page.locator('#guestFlowNotice').count(),1);assert.ok(await page.locator('#screenRegister').evaluate(n=>n.classList.contains('active')));
  await page.evaluate(()=>{Storage.switchPlayer('Bé Duyệt');App.playerName='Bé Duyệt';document.getElementById('nameInput').value='Bé Duyệt';document.getElementById('guestFlowNotice')?.remove();});
  console.log('topic cards passed',width);
 }
 if(!process.env.TOPIC_BEFORE)for(const width of [320,360,430]){await page.setViewportSize({width,height:900});await choose('toan');assert.ok(await page.locator('#topicList .topic-card').evaluateAll(ns=>ns.every(n=>n.getBoundingClientRect().right<=innerWidth+1)), 'cards fit '+width);}
 assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
