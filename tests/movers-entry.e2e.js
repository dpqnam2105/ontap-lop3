const {chromium}=require('playwright'),assert=require('assert');
const BASE=process.env.BASE_URL||'http://127.0.0.1:8773/';
(async()=>{
 const b=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL||'msedge'});let n=0;
 const ok=(v,m)=>{assert.ok(v,m);n++;};
 try{for(const width of [390,1280]){
  const c=await b.newContext({viewport:{width,height:844}});let posts=0;
  await c.addInitScript(()=>{let gen=0;class U{constructor(text){this.text=text;}}Object.defineProperty(window,'SpeechSynthesisUtterance',{value:U});Object.defineProperty(window,'speechSynthesis',{value:{getVoices:()=>[{name:'English fixture',lang:'en-GB'}],addEventListener(){},cancel(){gen++;},speak(u){const g=gen;setTimeout(()=>{if(g===gen&&u.onend)u.onend();},10);}}});});
  await c.route('https://script.google.com/**',r=>{if(r.request().method()==='POST')posts++;return r.fulfill({body:'[]',contentType:'application/json'});});
  const p=await c.newPage(),errors=[],requests=[];p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()));
  await p.goto(BASE+'?pilot=0');await p.waitForFunction(()=>window.App&&App.allData);
  ok(await p.locator('#btnMoversPilot').count()===0,'normal visit has no pilot banner button');
  ok(!requests.some(u=>/movers-audio|movers-listen-p4|movers\.css|data\/pilot/.test(u)),'normal visit loads no Movers payload');
  await p.fill('#nameInput','Resource link test');await p.click('#btnStart');
  // Finish normal profile initialization before comparing pilot isolation.
  await p.waitForFunction(()=>typeof Storage.load().achievements==='object');
  const resource=p.locator((width===390?'.today-res':'.side-rail')+' a[href*="movers=1"]');
  ok(await resource.isVisible(),'Movers resource link visible on normal home');
  ok(await resource.evaluate(el=>el.getBoundingClientRect().height>=44),'resource tap target is at least 44px');
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'resource row does not overflow');
  ok(await resource.getAttribute('target')==='_blank'&&await resource.getAttribute('rel')==='noopener noreferrer','resource opens isolated tab');
  const before=(await c.storageState()).origins;
  const popupPromise=c.waitForEvent('page');await resource.click();const popup=await popupPromise;
  await popup.waitForSelector('.mv-intro[open]');
  ok(await popup.evaluate(()=>API.pilotOn()),'resource opens the pilot intro');
  ok(await p.evaluate(()=>!API.pilotOn()),'original home stays outside pilot');
  await popup.close();
  await p.goto(BASE+'?pilot=1&movers=1');await p.waitForSelector('.mv-intro[open]');
  await p.waitForFunction(()=>!document.querySelector('[data-mv="start"]').disabled);
  ok(await p.locator('#btnMoversPilot').isVisible(),'pilot banner entry exists');
  await p.click('.mv-intro .mv-btn-play');await p.waitForFunction(()=>document.querySelector('.mv-intro .mv-audio-status').textContent.includes('bao nhiêu'));
  ok(await p.locator('.mv-intro .mv-example-badge').isVisible(),'example is outside Quiz');
  await p.click('[data-mv="answer"]');ok(await p.locator('.mv-intro .mv-transcript').isVisible(),'example can reveal its transcript');
  await p.selectOption('[data-mv="mode"]','test');await p.click('[data-mv="start"]');
  await p.waitForFunction(()=>document.querySelector('#qtHost .mv-audio-status').textContent.includes('Đã nghe đủ 2'));
  ok(await p.evaluate(()=>Quiz.questions.length===5&&Quiz.questions.every(q=>!q.example)),'tap starts five scored questions');
  ok(await p.locator('.mv-intro').isVisible()===false,'intro closes without stopping new audio');
  ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'quiz fits viewport');
  await p.click('#btnEndPart');ok(await p.locator('#resScore').textContent()==='Chưa chấm','user can exit demo');
  ok(posts===0,'pilot never posts results');ok(errors.length===0,errors.join(';'));
  const real=origins=>origins.map(o=>({origin:o.origin,localStorage:o.localStorage.filter(x=>!x.name.startsWith('pilot::')).sort((a,b)=>a.name.localeCompare(b.name))}));
  assert.deepStrictEqual(real((await c.storageState()).origins),real(before));n++;
  await c.close();console.log('entry OK '+width+'px');
 }console.log('Movers entry: '+n+' checks');}finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1)});
