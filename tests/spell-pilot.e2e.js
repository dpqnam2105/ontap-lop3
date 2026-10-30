// Local server on 8765. PLAYWRIGHT_CHANNEL=msedge when bundled Chromium is unavailable.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch(process.env.PLAYWRIGHT_CHANNEL?{channel:process.env.PLAYWRIGHT_CHANNEL}:{});let checks=0;try{
for(const width of [390,1280]){const ctx=await b.newContext({viewport:{width,height:900}});let requests=0;await ctx.route('https://script.google.com/**',r=>{if(r.request().method()!=='GET'||/action=(save|sync|log|backup)/i.test(r.request().url()))requests++;return r.fulfill({body:'[]',contentType:'application/json'});});const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto('http://127.0.0.1:8765/?pilot=1');await p.fill('#nameInput','Thử spell');await p.click('#btnStart');await p.waitForFunction(()=>window.App?.allData?.subjects?.length);
const ready=await p.evaluate(()=>{const s=App.allData.subjects.find(s=>s.id==='tieng-anh');App.setStageSetting(s,2,false);App._chooseSubject(App.allData.subjects.indexOf(s));return {n:SpellPilot.pools()?.valid.length,scope:Storage.get('stageBySubject')};});assert.equal(ready.n,12,JSON.stringify(ready));checks++;
assert(await p.evaluate(()=>{const {s,t}=SpellPilot.source();return !App._visibleTopics(s).includes(t)&&t.questions.every(q=>!App._mixEligible(s,q)&&!Pet.isCore(q,t));}));checks++;
const before=await p.evaluate(()=>{const q=SpellPilot.pools().valid[0];Storage.recordReview(q.checkId,false,{});Storage.recordAnswer({questionId:q.checkId,isCorrect:false,question:'seed error'});return JSON.stringify([Storage.getReviewMap(),Storage.getWrongHistory()]);});
assert(await p.evaluate(()=>SpellPilot.start('baseline')));checks++;
async function answerProbe(){await p.evaluate(()=>{const q=Quiz.questions[Quiz.curIdx];const btn=[...document.querySelectorAll('.ans-btn')].find(b=>b.textContent===q.choices[q.a]);if(!btn)throw new Error('Missing answer button');btn.click();});}
// Use the existing MCQ handler with original choice index; it retains all Quiz first-answer guards.
for(let i=0;i<12;i++){await answerProbe();await p.evaluate(()=>Quiz.next());}
assert(await p.evaluate(()=>SpellPilot.status().baseline?.complete));checks++;
assert(await p.evaluate(()=>SpellPilot.start('practice')));checks++;
for(let i=0;i<12;i++){
const q=await p.evaluate(()=>Quiz.questions[Quiz.curIdx]);
if(i===0){await p.locator('.sf-char[data-index="0"]').click();await p.click('#btnCheck');assert.equal(await p.evaluate(()=>SpellPilot.entry(Quiz.questions[Quiz.curIdx]).attempts.length),1);checks++;
await p.reload();await p.waitForFunction(()=>window.App?.allData?.subjects?.length);assert(await p.evaluate(()=>SpellPilot.start('practice')));assert.equal(await p.evaluate(()=>Quiz._qtState.attempts),1);checks++;}
const e=q.acceptEdits[0];if(q.op==='delete')await p.locator('.sf-char[data-index="'+e.index+'"]').click();else{await p.locator('.sf-gap[data-index="'+e.index+'"]').click();await p.getByRole('button',{name:'Điền chữ '+e.letter,exact:true}).click();}
await p.click('#btnCheck');if(i===5)await p.screenshot({path:'tests/out/spell-question-'+width+'.png'});
const state=await p.evaluate(()=>({done:Quiz._qtState.done,n:SpellPilot.entry(Quiz.questions[Quiz.curIdx])?.attempts.length}));assert(state.done,JSON.stringify(state));checks++;const duplicate=await p.evaluate(()=>{const score=Quiz.score,stars=Storage.load().stars;Quiz.submit();return score===Quiz.score&&stars===Storage.load().stars;});assert(duplicate);checks++;await p.evaluate(()=>Quiz.next());}
const result=await p.evaluate(()=>({practice:SpellPilot.status().practice,history:JSON.stringify([Storage.getReviewMap(),Storage.getWrongHistory()]),overflow:document.documentElement.scrollWidth>innerWidth}));assert(result.practice?.complete);assert.equal(result.history,before);assert(!result.overflow);assert.equal(requests,0);assert.deepEqual(errors,[]);checks+=5;
assert.equal(await p.evaluate(()=>SpellPilot.start('followup')),false);checks++;
await p.evaluate(()=>{const d=SpellPilot.state();const r=d.runs.find(r=>r.kind==='practice');const now=new Date();now.setDate(now.getDate()-3);r.date=Today._dateKey(now);SpellPilot.save(d);});
assert(await p.evaluate(()=>SpellPilot.start('followup')));checks++;
for(let i=0;i<12;i++){assert(await p.evaluate(()=>{const q=Quiz.questions[Quiz.curIdx];return !q.hint&&q._spNoHelp&&q.noHint;}));checks++;await answerProbe();await p.evaluate(()=>Quiz.next());}
assert.equal(await p.evaluate(()=>SpellPilot.start('followup')),false);checks++;
await p.evaluate(()=>{App._chooseSubject(App.allData.subjects.findIndex(s=>s.id==='tieng-anh'));});await p.screenshot({path:'tests/out/spell-'+width+'.png',fullPage:true});await ctx.close();}
console.log('spell browser:',checks,'checks passed');}finally{await b.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
