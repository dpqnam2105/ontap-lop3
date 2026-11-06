const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8773/';
const SHOT = process.env.SHOT_DIR || path.join(__dirname, '../tmp/math-batch1-shots');
fs.mkdirSync(SHOT, { recursive: true });
(async () => {
  const browser = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
  let checks = 0;
  const ok = (v, m) => { assert.ok(v, m); checks++; };
  const eq = (a, b, m) => { assert.deepStrictEqual(a, b, m); checks++; };
  try {
    // Ordinary visits must not mount the pilot or fetch its ID manifest.
    const regular = await browser.newContext();
    const ordinary = await regular.newPage();
    const fetched = [];
    ordinary.on('request', r => fetched.push(r.url()));
    await ordinary.route('https://script.google.com/**', r => r.fulfill({ body: '[]', contentType: 'application/json' }));
    await ordinary.goto(BASE + '?pilot=0');
    await ordinary.waitForFunction(() => window.App && App.allData);
    ok(await ordinary.evaluate(() => !App.allData.subjects.some(s => s.topics.some(t => t.batch1Pilot))), 'normal: no pilot topics');
    ok(!fetched.some(u => u.includes('toan-batch1-ids.json')), 'normal: no pilot manifest request');
    await regular.close();
    for (const width of [390, 1280]) {
      const ctx = await browser.newContext({ viewport: { width, height: 844 }, isMobile: width === 390, hasTouch: width === 390 });
      let posts = 0;
      await ctx.route('https://script.google.com/**', r => { if (r.request().method() === 'POST') posts++; return r.fulfill({ body: '[]', contentType: 'application/json' }); });
      const p = await ctx.newPage();
      const errors = []; p.on('pageerror', e => errors.push(e.message));
      // Use a real profile sentinel outside pilot storage, then keep the exact same name in pilot.
      await p.goto(BASE + '?pilot=0');
      await p.waitForFunction(() => window.App && App.allData);
      await p.evaluate(() => { Storage.switchPlayer('Thử toán'); Storage.set('realSentinel', 731); });
      const before = (await ctx.storageState()).origins;
      await p.goto(BASE + '?pilot=1');
      await p.waitForFunction(() => window.App && App.allData && App.allData._batch1Pilot);
      await p.fill('#nameInput', 'Thử toán'); await p.click('#btnStart');
      const state = await p.evaluate(() => {
        const s = App.allData.subjects.find(s => s.id === 'toan');
        App.setStageSetting(s, 2, false);
        App._chooseSubject(App.allData.subjects.indexOf(s));
        const ts = s.topics.filter(t => t.batch1Pilot);
        return { count: ts.map(t => t.questions.length), titles: ts.map(t => t.name), manual: ts.every(t => t.manualOnly),
          auto: App._visibleTopics(s).some(t => t.batch1Pilot), normalized: ts.every(t => t.questions.every(q => q.adaptive && q.stage === 2)) };
      });
      eq(state.count, [60, 60], width + ': fixed 60 + 60');
      ok(state.titles.every(Boolean) && state.manual && !state.auto && state.normalized, width + ': named, normalized, manual only');
      await p.waitForFunction(() => !document.querySelector('.achievement-toast'));
      await p.locator('#topicList').screenshot({path:path.join(SHOT,width+'-topics.png')});
      ok(await p.evaluate(() => { const s=App.allData.subjects.find(s=>s.id==='toan'); App.setStageSetting(s,1,false); App._chooseSubject(App.allData.subjects.indexOf(s)); return !document.querySelector('[data-topic-id="toan-chia-het-co-du"]'); }),width+': stage 1 hides pilot');
      await p.evaluate(() => { const s=App.allData.subjects.find(s=>s.id==='toan'); App.setStageSetting(s,2,false); App._chooseSubject(App.allData.subjects.indexOf(s)); });
      const card = '[data-topic-id="toan-chia-het-co-du"]';
      await p.locator(card + ' .topic-toggle').click();
      await p.locator(card + ' .practice').click();
      ok(await p.locator('#qText').isVisible(), width + ': real card launches quiz');
      // Long paired answers, with real click -> wrong history -> right; no reward on retry.
      const long = await p.evaluate(() => {
        const s = App.allData.subjects.find(s => s.id === 'toan'), t = s.topics.find(t => t.id === 'toan-chia-het-co-du');
        const candidates = t.questions.map((q,i) => ({q,i})).filter(x => x.q.skill === 'chia-du-con-thua').sort((a,b) => Math.max(...b.q.choices.map(c=>c.length))-Math.max(...a.q.choices.map(c=>c.length)));
        const x = candidates[0]; Quiz.start(t,s.name,{subjectId:s.id,allowed:[x.i]}); return x.q;
      });
      const wrong = long.choices.find((c,i) => i !== long.a);
      await p.locator('#ansGrid .ans-btn').filter({ hasText: new RegExp('^' + wrong.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).click();
      ok(await p.evaluate(id => !!Storage.getWrongHistory()[id], long.id), width + ': actual wrong recorded');
      const box = await p.locator('#ansGrid .ans-btn').evaluateAll(bs => bs.map(b => ({ h:b.getBoundingClientRect().height, width:b.getBoundingClientRect().width, scroll:b.scrollWidth, client:b.clientWidth })));
      ok(box.every(x => x.h >= 44 && x.scroll <= x.client + 1), width + ': no answer clipping');
      await p.screenshot({ path: path.join(SHOT, width + '-wrong.png'), fullPage: true });
      if (width === 390) {
        // Stress wrapping in a narrow answer panel; production styles are unchanged.
        const large = await p.addStyleTag({content:'#ansGrid {max-width:220px!important;margin-inline:auto!important;} #ansGrid .ans-btn {font-size:28px!important;}'});
        const wraps = await p.locator('#ansGrid .ans-btn').evaluateAll(bs=>bs.map(b=>{const r=document.createRange();r.selectNodeContents(b);return {rects:r.getClientRects().length,overflow:b.scrollWidth>b.clientWidth+1};}));
        await p.screenshot({path:path.join(SHOT,'390-large-text-probe.png'),fullPage:true});
        ok(wraps.some(b=>b.rects>1) && wraps.every(b=>!b.overflow),'390: enlarged text wraps without clipping '+JSON.stringify(wraps));
        await p.screenshot({path:path.join(SHOT,'390-large-text-wrong.png'),fullPage:true});
        await large.evaluate(el=>el.remove());
      }
      await p.locator('#ansGrid .ans-btn').filter({ hasText: new RegExp('^' + long.choices[long.a].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).click();
      eq(await p.evaluate(() => Quiz.score), 0, width + ': retry gives no point');
      await p.screenshot({ path: path.join(SHOT, width + '-correct.png'), fullPage: true });
      await p.locator('#btnNext').scrollIntoViewIfNeeded();
      await p.screenshot({ path: path.join(SHOT,width+'-feedback.png') });
      ok(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth), width + ': no horizontal overflow');
      // Persist a previously seen question outside the sample bank.
      const external = 'toan_so-hang-thu-n_bo-tro-v1_sbn9_kc5_n23';
      await p.evaluate(id => {
        const topicId = 'toan-day-so-cach-deu';
        Storage.recordAnswer({ questionId:id, isCorrect:false, subjectId:'toan', topicId, question:'SHOULD NOT BE MATCHED BY TEXT' });
        const added = ToanBatch1Web.restore(App.allData); if (added.added !== 1) throw Error('external question not restored');
        const t=App.allData.subjects.find(s=>s.id==='toan').topics.find(t=>t.id===topicId);
        Storage.markTotalProgress(topicId,t.questions.findIndex(q=>q.id===id),false);
      }, external);
      await p.reload(); await p.waitForFunction(() => window.App && App.allData && App.allData._batch1Pilot);
      const restored = await p.evaluate(id => {
        Today._qIndex(); const t=App.allData.subjects.find(s=>s.id==='toan').topics.find(t=>t.id==='toan-day-so-cach-deu');
        const q=t.questions.find(q=>q.id===id), i=t.questions.findIndex(q=>q.id===id);
        Quiz.startWrongReview();
        return { found:!!q, normalized:!!q.adaptive, count:t.questions.filter(q=>q.id===id).length,
          seen:Storage.getTotalProgress(t.id).seen.includes(i), quiz:Quiz.questions.some(q=>q.id===id), again:ToanBatch1Web.restore(App.allData).added };
      }, external);
      eq(restored,{found:true,normalized:true,count:1,seen:true,quiz:true,again:0},width+': reload, ID progress, wrong review, idempotent');
      const profile = await p.evaluate(() => { Storage.switchPlayer('Bé khác'); return { wrong:Object.keys(Storage.getWrongHistory()).length, added:ToanBatch1Web.restore(App.allData).added, seen:Storage.getTotalProgress('toan-day-so-cach-deu').seen.length }; });
      eq(profile,{wrong:0,added:0,seen:0},width+': no cross-profile progress');
      const broken = 'toan_chia-co-du_bo-tro-v9_d6_q8_r5';
      const msg = await p.evaluate(id => {
        Storage.recordAnswer({questionId:id,isCorrect:false,subjectId:'toan',topicId:'toan-chia-het-co-du',question:'Phép chia nào dưới đây là phép chia hết?'});
        let message='';const orig=Rewards._achievementPopup;Rewards._achievementPopup=s=>{message=s;};Quiz.startWrongReview();Rewards._achievementPopup=orig;
        return {message,retained:!!Storage.getWrongHistory()[id]};
      },broken);
      ok(msg.retained && msg.message.includes('chưa tải được') && !msg.message.includes('không còn'),width+': bad ID retained, no false completion');
      await p.evaluate(async () => { await App._chooseGrade('lop2'); });
      ok(await p.evaluate(() => !ToanBatch1Web.active(App.allData)),width+': grade 2 not mounted');
      ok(await p.evaluate(() => { let m=''; const old=Rewards._achievementPopup;Rewards._achievementPopup=x=>{m=x;};Quiz.startWrongReview();Rewards._achievementPopup=old;return m.includes('chưa tải được'); }),width+': another grade does not falsely complete pilot wrong history');
      eq(posts,0,width+': no remote POST');
      eq(errors,[],width+': no pageerror');
      const after=(await ctx.storageState()).origins;
      const real = os => (os.find(o=>o.origin===new URL(BASE).origin)?.localStorage || []).filter(k=>!k.name.startsWith('pilot::')).sort((a,b)=>a.name.localeCompare(b.name));
      eq(real(after),real(before),width+': pilot did not change real profile');
      await ctx.close(); console.log('✔ '+width+'px');
    }
    console.log('math batch1 web OK — '+checks+' checks');
  } finally { await browser.close(); }
})().catch(e=>{console.error(e);process.exit(1);});
