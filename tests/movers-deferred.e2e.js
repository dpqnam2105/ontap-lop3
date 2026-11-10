const {chromium}=require('playwright'),assert=require('assert'),path=require('path'),fs=require('fs');
fs.mkdirSync(path.join(__dirname,'out'),{recursive:true});
const BASE=process.env.BASE_URL||'http://127.0.0.1:8773/';
const fakeSpeech=()=>{
 window.__spoken=[];window.__cancel=0;
 class U{constructor(text){this.text=text;}}
 let generation=0;
 const synth={getVoices:()=>[{name:'Test English',lang:'en-US',localService:true}],addEventListener(){},cancel(){generation++;window.__cancel++;},speak(u){const g=generation;window.__spoken.push(u.text);setTimeout(()=>{if(g===generation&&u.onend)u.onend();},5);}};
 Object.defineProperty(window,'SpeechSynthesisUtterance',{value:U,configurable:true});Object.defineProperty(window,'speechSynthesis',{value:synth,configurable:true});
};
(async()=>{const b=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});let count=0;const ok=(v,m)=>{assert.ok(v,m);count++;};
try{for(const width of [390,1280]){
 const c=await b.newContext({viewport:{width,height:844},isMobile:width===390,hasTouch:width===390});await c.addInitScript(fakeSpeech);
 let posts=0;await c.route('https://script.google.com/**',r=>{if(r.request().method()==='POST')posts++;return r.fulfill({body:'[]',contentType:'application/json'});});
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(BASE+'?pilot=0');await p.waitForFunction(()=>window.App&&App.allData);await p.evaluate(()=>{Storage.switchPlayer('Movers test');Storage.set('real-sentinel',321);});const before=(await c.storageState()).origins;
 await p.goto(BASE+'?pilot=1');await p.waitForFunction(()=>window.App&&App.allData);await p.fill('#nameInput','Movers test');await p.click('#btnStart');
 await p.addStyleTag({url:BASE+'movers.css'});await p.addScriptTag({url:BASE+'js/movers-audio.js'});await p.addScriptTag({url:BASE+'js/qtypes/movers-listen-p4.js'});
 await p.evaluate(async()=>{
  window.__fixture=(await (await fetch('tests/fixtures/movers-listening-p4.json')).json()).topic;
  window.__sounds=[];Sound.play=n=>window.__sounds.push(n);window.__achieve=0;Achieve.recordAnswer=()=>window.__achieve++;
  const split=MoversP4.splitExample(__fixture.questions);window.__scored=split.scored;window.__example=split.example[0];
  const host=document.createElement('div');document.body.appendChild(host);const q=__example;const x=QTypes.forQuestion(q).render({host,q,mode:'practice',onChange(){}});x.restore({choice:q.a});x.showResult({correct:true,reveal:true});x.destroy();host.remove();
 });
 ok(await p.evaluate(()=>Object.keys(Storage.getWrongHistory()).length===0&&Quiz.sessionDetails.length===0),'example does not record');
 await p.evaluate(()=>{window.__topic={...__fixture,questions:__scored};Quiz.start(__topic,'Tiếng Anh',{mode:'test',subjectId:'tieng-anh'});});
 ok(await p.evaluate(()=>Quiz.questions.length===5&&Quiz.questions.every(q=>!q.example)),'only five scored questions enter Quiz');
 const initial=await p.evaluate(()=>({stars:Rewards._loadData().stars||0,xp:Rewards._loadData().xp||0}));
 await p.waitForFunction(()=>document.querySelector('.mv-audio-status').textContent.includes('Đã nghe đủ 2'));
 await p.screenshot({path:path.join(__dirname,'out',`movers-question-${width}.png`),fullPage:true});
 ok(await p.locator('.mv-btn-play').isDisabled(),'two completed passes lock replay');
 ok(await p.evaluate(()=>!window.__spoken.some(t=>/\b(Girl|Boy|Man|Woman):/.test(t))),'real Speak interface only receives dialogue');
 for(let i=0;i<5;i++){
  const q=await p.evaluate(()=>Quiz.questions[Quiz.curIdx]);const pick=i===0?(q.a+1)%3:q.a;
  await p.locator('.mv-choice').nth(pick).click();await p.locator('#btnCheck').click();
  ok(await p.evaluate(()=>Quiz.score===0&&Quiz.sessionDetails.length===0&&window.__achieve===0),'no score/mastery/session recording before part ends');
  ok(await p.evaluate(()=>!document.querySelector('.is-correct,.is-wrong,.is-answer')&&document.querySelector('.mv-transcript').hidden),'no visual grade or transcript');
  ok(await p.evaluate(()=>!window.__sounds.some(s=>s==='correct'||s==='wrong')),'no answer sound');
  ok(await p.evaluate(()=>document.getElementById('feedback').className==='feedback mv-deferred'&&document.getElementById('fbText').textContent==='Đã ghi nhận. Con sang câu tiếp theo nhé.'),'same neutral feedback for correct and wrong');
  ok(await p.evaluate(()=>Object.keys(Storage.getWrongHistory()).length===0&&!(Storage.getTotalProgress('en_movers-listening-p4').seen||[]).length),'history/progress deferred');
  ok(await p.evaluate(()=>!Quiz.submit().ok),'double submit blocked');
  if(i===0){await p.evaluate(()=>Quiz._finish());ok(await p.evaluate(()=>Quiz.score===0&&document.getElementById('screenQuiz').classList.contains('active')),'premature finish cannot award');}
  await p.locator('#btnNext').click();
 }
 ok(await p.evaluate(()=>Quiz.score===4&&Quiz.sessionDetails.length===5&&Quiz.sessionStars===4&&Quiz.sessionXP===48&&window.__achieve===5),'part end settles grade and rewards once');
 ok(await p.evaluate(()=>Quiz.sessionDetails.filter(d=>d.isCorrect).length===4&&Quiz.sessionDetails.every(d=>d.questionType==='movers-listen-p4'&&d.response.choice>=0&&!d.questionId.endsWith('q000'))),'records preserve valid responses and exclude example');
 ok(await p.locator('#deferredReview details').count()===5,'all five questions can be reviewed at end');
 ok(await p.evaluate(()=>document.querySelectorAll('#deferredReview .is-answer').length===5&&document.querySelectorAll('#deferredReview .mv-transcript:not([hidden])').length===5),'answers and transcripts revealed only at result');
 await p.screenshot({path:path.join(__dirname,'out',`movers-result-${width}.png`),fullPage:true});
 const settled=await p.evaluate(()=>({stars:Rewards._loadData().stars,xp:Quiz.sessionXP,n:Quiz.sessionDetails.length}));await p.evaluate(()=>Quiz._finish());
 ok(await p.evaluate(a=>{return Rewards._loadData().stars===a.stars&&Quiz.sessionXP===a.xp&&Quiz.sessionDetails.length===a.n},settled),'repeat finish does not duplicate rewards or records');
 await p.evaluate(()=>Quiz.start({...__topic,id:'movers-practice-test',questions:[__scored[0]]},'Tiếng Anh',{mode:'practice',subjectId:'tieng-anh'}));
 const answer=await p.evaluate(()=>Quiz.questions[Quiz.curIdx].a);await p.locator('.mv-choice').nth(answer).click();await p.locator('#btnCheck').click();
 ok(await p.evaluate(()=>Quiz.score===1&&document.querySelector('.is-correct')&&!document.querySelector('.mv-transcript').hidden&&window.__sounds.includes('correct')),'practice feedback remains immediate');
 ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
 ok(errors.length===0,'no page exceptions: '+errors.join(';'));ok(posts===0,'pilot sends no remote POST');
 const real=os=>(os.find(o=>o.origin===new URL(BASE).origin)?.localStorage||[]).filter(k=>!k.name.startsWith('pilot::')).sort((a,b)=>a.name.localeCompare(b.name));
 assert.deepStrictEqual(real((await c.storageState()).origins),real(before));count++;
 await c.close();console.log('OK '+width+'px');
}console.log('movers deferred e2e OK — '+count+' checks');}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
