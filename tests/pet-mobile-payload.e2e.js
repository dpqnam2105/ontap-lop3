const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
(async()=>{
 const browser=await chromium.launch({channel:process.env.PET_BROWSER_CHANNEL||'chrome',headless:true});
 const report=[];
 for(let stage=0;stage<3;stage++){
  const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage(),requests=[];
  await context.route('**/*',async route=>{
   const url=new URL(route.request().url());
   if(url.hostname==='pet.test'){
    const file=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
    if(!file.startsWith(root+path.sep)||!fs.existsSync(file))return route.fulfill({status:404,body:''});
    const body=fs.readFileSync(file),type={'.html':'text/html','.js':'application/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'}[path.extname(file)];
    if(url.pathname.startsWith('/assets/pet/'))requests.push({file:path.basename(file),bytes:body.length});
    return route.fulfill({contentType:type||'application/octet-stream',body,headers:{'Content-Length':String(body.length)}});
   }
   if(url.hostname==='script.google.com')return route.fulfill({contentType:'application/json',body:url.searchParams.get('action')==='get'?'{"ok":true,"found":false,"ver":0}':route.request().method()==='POST'?'{"ok":true,"saved":true,"ver":1}':'[]'});
   return route.abort();
  });
  await page.goto('http://pet.test/');await page.waitForFunction(()=>App.allData&&App.allData.subjects.length>=3);
  await page.evaluate(stage=>{Storage.switchPlayer('Bé Đo Tải');App.playerName='Bé Đo Tải';const p=Storage.load();p.petAdopt={earnedAt:new Date().toISOString(),runId:'payload',score:15,total:15};Storage.save(p);Pet.adopt('Bông');const d=Storage.load();d.pet.stage=stage;d.pet.growth=[0,10,30][stage];Storage.save(d);App.showScreen('pet')},stage);
  await page.waitForTimeout(2500); // Covers the initial greeting and multiple frame changes.
  const atlas=requests.filter(r=>r.file.startsWith('dog-fluffy'));
  const room=requests.filter(r=>!r.file.startsWith('dog-fluffy'));
  assert.equal(atlas.length,1,'only current stage atlas');
  assert.equal(room.length,7,'background and five equipped pieces, with split bed');
  assert.ok(!requests.some(r=>r.file.includes('bow-blue')));
  assert.ok(room.reduce((n,r)=>n+r.bytes,0)<350000,'room art delivery budget');
  assert.equal(atlas[0].file,'dog-fluffy-brown-stage'+stage+(stage===2?'-v3.webp':'-v2.webp'));
  assert.ok(atlas[0].bytes<500000,'atlas payload below 500kB');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  report.push({stage,viewport:'390x844',requests:requests.length,imageBytes:atlas[0].bytes,file:atlas[0].file});
  await context.close();
 }
 const bowBytes=fs.statSync(path.join(root,'assets/pet/bow-blue-tuft-v1.webp')).size;
 assert.ok(bowBytes<30000,'bow below 30kB');
 fs.mkdirSync(path.join(__dirname,'out'),{recursive:true});fs.writeFileSync(path.join(__dirname,'out','pet-mobile-payload.json'),JSON.stringify({note:'Cold Chromium contexts with local HTTP routes; image body bytes, not production timing.',stages:report,bowBytes},null,2));
 console.log(JSON.stringify({stages:report,bowBytes}));await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
