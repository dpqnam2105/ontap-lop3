const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),assert=require('assert');
const ROOT=path.join(__dirname,'..'), OUT=path.join(ROOT,'docs/midterm-images');
fs.mkdirSync(OUT,{recursive:true});
(async()=>{
 const browser=await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? {channel:process.env.PLAYWRIGHT_CHANNEL} : {});
 try{
 const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await ctx.route('https://script.google.com/**',r=>r.fulfill({contentType:'application/json',body:'[]'}));
 const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.env.BASE_URL||'http://127.0.0.1:8765/');
 await page.fill('#nameInput','SVG review');await page.click('#btnStart');
 await page.waitForFunction(()=>window.App&&App.allData&&App.allData.subjects.length);
 const qs=await page.evaluate(()=>App.allData.subjects.find(s=>s.id==='tieng-anh').topics.flatMap(t=>t.questions).filter(q=>q.source==='claude-nik3-lo3-giuaky-20261012'&&q.image).map(q=>({id:q.id,image:q.image,answer:q.choices[q.a]})));
 assert.strictEqual(qs.length,20);
 const evidence=[];
 for(const item of qs){
 await page.evaluate(id=>{
 const s=App.allData.subjects.find(s=>s.id==='tieng-anh'), t=s.topics.find(t=>t.questions.some(q=>q.id===id)),q=t.questions.find(q=>q.id===id);
 // Preview approval is in browser memory only. Disk data stays pending until visual review.
 q.imageReview={status:'ok'};
 Quiz.startMixed([{...q,_idx:t.questions.indexOf(q),subjectId:s.id,topicId:t.id,_subjectName:s.name,_topicName:t.name}],s.name,s.id);
 },item.id);
 const img=page.locator('.question-image');await img.waitFor();
 await page.waitForFunction(()=>{const i=document.querySelector('.question-image');return i&&i.complete&&i.naturalWidth>0});
 const info=await img.evaluate(el=>{const r=el.getBoundingClientRect();return {width:r.width,height:r.height,left:r.left,right:r.right,naturalWidth:el.naturalWidth}});
 assert(info.width>80&&info.height>80&&info.right<=390&&info.left>=0,item.id+': image bounds');
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=390),item.id+': horizontal overflow');
 await img.screenshot({path:path.join(OUT,item.id+'-image.png')});
 await page.screenshot({path:path.join(OUT,item.id+'-390.png'),fullPage:true});
 evidence.push({...item,...info});
 }
 assert.deepStrictEqual(errors,[]);
 fs.writeFileSync(path.join(OUT,'mobile-390.json'),JSON.stringify({viewport:{width:390,height:844},questions:evidence},null,2)+'\n');
 console.log('20 question images load within 390px; saved screenshots and answer evidence.');
 await ctx.close();
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
