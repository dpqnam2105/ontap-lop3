// 💡 Lý thuyết: danh sách bài, mở bài, xem đáp án, luyện theo bài, nút "Xem lại bài" khi trả lời sai (hộp nổi).
// Run: node tests/theory.e2e.js (optional PET_BROWSER_CHANNEL=msedge or chrome).
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
   return route.fulfill({contentType:type||'application/octet-stream',body:fs.readFileSync(file)});
  }
  if(url.hostname==='script.google.com')return route.fulfill({contentType:'application/json',body:url.searchParams.get('action')==='get'?'{"ok":true,"found":false,"ver":0}':route.request().method()==='POST'?'{"ok":true,"saved":true,"ver":1}':'[]'});
  return route.abort();
 });
 await page.goto('http://pet.test/');await page.waitForFunction(()=>App.allData&&App.allData.subjects.length>=3);
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(()=>Theory._cache.lop3);
 const before=await page.evaluate(()=>JSON.stringify(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])));
 const out=path.join(root,'docs','theory');fs.mkdirSync(out,{recursive:true});

 // Mọi id trong dữ liệu lý thuyết trỏ tới câu có thật; mỗi bài có câu luyện đã qua cổng duyệt.
 const audit=await page.evaluate(()=>{const s=App.allData.subjects.find(x=>x.id==='tieng-anh'),ids=new Set();s.topics.forEach(t=>t.questions.forEach(q=>ids.add(q.id)));
  const d=Theory._cache.lop3;return d.lessons.map(l=>({id:l.id,missing:(l.questionIds||[]).filter(i=>!ids.has(i)),n:Theory._hits(l).hits.length,grouped:d.subjects.some(x=>x.groups.some(g=>g.lessons.includes(l.id)))}));});
 audit.forEach(a=>{assert.deepEqual(a.missing,[],a.id+' trỏ id không có');assert.ok(a.grouped,a.id+' chưa nằm trong nhóm');assert.ok(a.n>=5,a.id+' quá ít câu luyện: '+a.n);});

 for(const width of [320,390,1280]){
  await page.setViewportSize({width,height:900});
  await page.evaluate(()=>{Storage.switchPlayer('');App.playerName='';Theory._view=null;});
  await page.locator('.side-rail .btn-nav[data-screen="theory"]').click();
  assert.ok(await page.locator('#screenTheory').evaluate(n=>n.classList.contains('active')),'mở được khi chưa nhập tên');
  assert.equal(await page.locator('.th-card').count(),6);
  if(width!==320)await page.locator('#screenTheory').screenshot({path:path.join(out,'list-'+width+'.png')});
  await page.locator('.th-card[data-id="en-do-does"]').click();
  assert.match(await page.locator('.th-lesson h2').textContent(),/Do \/ Does/);
  assert.equal(await page.locator('.th-check-a:visible').count(),0);
  await page.locator('.th-reveal').first().click();
  assert.equal(await page.locator('.th-check-a:visible').count(),1);
  assert.match(await page.locator('.th-check-a:visible').textContent(),/Does/);
  assert.equal(await page.locator('.th-lesson b.th-hl').first().evaluate(n=>n.tagName),'B');
  assert.ok(await page.locator('.th-bad').count()>0,'lỗi sai có gạch');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,'không tràn ngang '+width);
  if(width!==320)await page.locator('#screenTheory').screenshot({path:path.join(out,'lesson-'+width+'.png'),fullPage:false});
  // Chưa có tên: bấm Luyện → về Trang chủ, không bắt đầu lượt
  await page.locator('[data-th="practice"]').click();
  assert.ok(await page.locator('#screenRegister').evaluate(n=>n.classList.contains('active')));
  // Có tên: Luyện 5 câu → đề trộn đúng các câu của bài, nút Quay lại về Lý thuyết
  await page.evaluate(()=>{Storage.switchPlayer('Bé Duyệt');App.playerName='Bé Duyệt';App.currentGrade='lop3';});
  await page.locator('.side-rail .btn-nav[data-screen="theory"]').click();
  assert.match(await page.locator('[data-th="practice"]').textContent(),/Luyện 5 câu/);
  await page.locator('[data-th="practice"]').click();
  const sess=await page.evaluate(()=>({n:Quiz.questions.length,ids:Quiz.questions.map(q=>q.id),back:Quiz.backScreen,l:Quiz.questions.map(q=>Theory.lessonFor(q)&&Theory.lessonFor(q).id)}));
  assert.equal(sess.n,5);assert.equal(sess.back,'theory');assert.ok(sess.l.every(x=>x==='en-do-does'),JSON.stringify(sess));
  // Trả lời sai → nút Xem lại bài → hộp nổi → đóng về đúng câu
  const q0=await page.evaluate(()=>Quiz.curIdx);
  await page.evaluate(()=>{const q=Quiz.questions[Quiz.curIdx];const b=[...document.querySelectorAll('.ans-btn')].find(b=>b.textContent!==String(q.choices[q.a]));b.click();});
  await page.locator('#fbTheory').waitFor();
  assert.match(await page.locator('#fbTheory').textContent(),/Xem lại bài: Câu hỏi với Do \/ Does/);
  await page.locator('#fbTheory').click();
  assert.equal(await page.locator('#theoryModal').count(),1);
  assert.equal(await page.evaluate(()=>{const c=document.querySelector('.th-modal-card').getBoundingClientRect();return c.left>=0&&c.right<=innerWidth+1;}),true);
  if(width!==320)await page.screenshot({path:path.join(out,'modal-'+width+'.png')});
  await page.locator('.th-close-main').click();
  assert.equal(await page.locator('#theoryModal').count(),0);
  assert.ok(await page.locator('#screenQuiz').evaluate(n=>n.classList.contains('active')));
  assert.equal(await page.evaluate(()=>Quiz.curIdx),q0);
  // Esc cũng đóng; trả lời đúng → câu sau không còn nút cũ
  await page.locator('#fbTheory').click();await page.keyboard.press('Escape');assert.equal(await page.locator('#theoryModal').count(),0);
  await page.evaluate(()=>{const q=Quiz.questions[Quiz.curIdx];[...document.querySelectorAll('.ans-btn')].find(b=>b.textContent===String(q.choices[q.a])).click();});
  await page.locator('#btnNext').click();
  assert.equal(await page.locator('#fbTheory').count(),0,'câu mới không mang nút cũ');
  // Câu không có bài lý thuyết: không hiện nút
  await page.evaluate(()=>{const s=App.allData.subjects.find(x=>x.id==='toan');const t=s.topics.find(t=>t.questions&&t.questions.length&&!t.drill);Quiz.start(t,s.name,{subjectId:'toan'});const q=Quiz.questions[0];[...document.querySelectorAll('.ans-btn')].find(b=>b.textContent!==String(q.choices[q.a])).click();});
  assert.equal(await page.locator('#fbTheory').count(),0,'Toán chưa có lý thuyết');
  // Kiểm tra: không hiện nút
  await page.evaluate(()=>{const s=App.allData.subjects.find(x=>x.id==='tieng-anh');const t=s.topics.find(t=>t.id==='en_mshoa-e2-u6');Quiz.start(t,s.name,{subjectId:'tieng-anh',mode:'test'});const q=Quiz.questions[0];[...document.querySelectorAll('.ans-btn')].find(b=>b.textContent!==String(q.choices[q.a])).click();});
  assert.equal(await page.locator('#fbTheory').count(),0,'chế độ kiểm tra không gợi ý');
  // Rời màn làm bài khi hộp đang mở → hộp tự đóng
  await page.evaluate(()=>{Theory.showModal('en-time-oclock');App.showScreen('register');});
  assert.equal(await page.locator('#theoryModal').count(),0);
  console.log('theory passed',width);
 }
 // Lớp chưa có lý thuyết: lời nhắn thân thiện, không màn trắng
 await page.evaluate(()=>{Theory._cache.lop2=null;App.currentGrade='lop2';App.showScreen('theory');});
 assert.match(await page.locator('#theoryBody').textContent(),/chưa có bài lý thuyết/);
 await page.evaluate(()=>{App.currentGrade='lop3';});
 // Module chỉ đọc: không thêm key localStorage nào ngoài hồ sơ thử
 const keys=await page.evaluate(()=>Object.keys(localStorage).filter(k=>/theory/i.test(k)));
 assert.deepEqual(keys,[]);
 assert.ok(before.length>0);
 assert.deepEqual(errors,[]);await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
