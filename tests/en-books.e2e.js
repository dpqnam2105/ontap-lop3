// Chia Tiếng Anh theo giáo trình — kiểm tại ĐIỂM KHỞI CHẠY thật trên trình duyệt (Chromium):
// thẻ Ôn tổng hợp (đầu danh sách, chỉ bật Ms Hoa vẫn hiện, bấm ra đề đúng phạm vi), luyện / kiểm tra trong chủ đề,
// nhiệm vụ kế hoạch hôm nay (Today.start), thử thách đón cún (Pet.startChallenge), ở mốc Ms Hoa L1 và L2.
// Chạy: (cd <repo> && python3 -m http.server 8765) rồi  node tests/en-books.e2e.js   (cần Playwright + Chromium)
const { chromium } = require('playwright');
const assert = require('assert');
const URL = process.env.BASE_URL || 'http://localhost:8765/';

async function open(b, vp, mobile) {
  const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile });
  await ctx.route('https://script.google.com/**', r => {
    const a = new globalThis.URL(r.request().url()).searchParams.get('action');
    r.fulfill({ contentType: 'application/json', body: a === 'get' ? '{"ok":true,"found":false,"ver":0}' : r.request().method() === 'POST' ? '{"ok":true,"saved":true,"ver":1}' : '[]' });
  });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(800);
  await p.fill('#nameInput', 'Thỏ'); await p.click('#btnStart'); await p.waitForTimeout(400);
  await p.waitForFunction(() => window.App && App.allData && App.allData.subjects && App.allData.subjects.length);
  return { p, ctx, errs };
}
// Câu Quiz thực sự nhận (sau khi khởi chạy)
const quizQs = p => p.evaluate(() => Quiz.questions.map(q => ({ id: q.id, topicId: q.topicId || Quiz.currentTopicId, lesson: q.bookLesson ? q.bookLesson.lesson : null, passage: !!q.passage })));
const openEnglish = p => p.evaluate(() => App._chooseSubject(App.allData.subjects.findIndex(s => s.id === 'tieng-anh')));
const isMs = q => /^en_mshoa-e2-u6_/.test(q.id);

(async () => {
  const b = await chromium.launch();
  const ok = m => console.log('✔', m);
  try {
    for (const [vp, mobile] of [[{ width: 390, height: 844 }, true], [{ width: 1280, height: 900 }, false]]) {
      const { p, ctx, errs } = await open(b, vp, mobile);
      const W = vp.width + 'px';

      // 1) Trang phụ huynh: chọn Ms Hoa L1, bỏ tích NIK và Nền → chỉ Ms Hoa vào Ôn tổng hợp (GS3 mặc định tắt)
      await p.evaluate(() => ParentDashboard._openDashboard()); await p.waitForTimeout(600);
      const before = await p.evaluate(() => ['nik3', 'mshoa-explorer2', 'gs3', 'nen'].map(b => { const c = document.querySelector('.scope-mixcb[data-b="' + b + '"]'); return [b, c.checked, c.disabled]; }));
      assert.deepStrictEqual(before, [['nik3', true, false], ['mshoa-explorer2', true, false], ['gs3', false, false], ['nen', true, false]]);
      await p.selectOption('#bookScopeCard .scope-lesson', '6.1');
      await p.click('#bookScopeCard .scope-mixcb[data-b="nik3"]');
      await p.click('#bookScopeCard .scope-mixcb[data-b="nen"]');
      const saved = await p.evaluate(() => Storage.get('bookScopeBySubject')['lop3:tieng-anh']);
      assert.deepStrictEqual(saved, { lesson: { 'mshoa-explorer2': { unit: 6, lesson: 1 } }, mix: { nik3: false, nen: false } });
      ok(W + ': trang phụ huynh lưu mốc U6 L1, bỏ NIK và Nền khỏi Ôn tổng hợp');

      // 2) Thẻ Ôn tổng hợp: đứng đầu danh sách; chỉ Ms Hoa (1 chủ đề) vẫn hiện; bấm → 12 câu L1, không lặp, không đoạn E
      await openEnglish(p); await p.waitForTimeout(300);
      const first = await p.evaluate(() => document.querySelector('#topicList > *').className);
      assert.ok(/mix-card/.test(first), 'thẻ Ôn tổng hợp phải đứng đầu: ' + first);
      const src = await p.textContent('#topicList .mix-src');
      assert.ok(/Ms Hoa/.test(src) && /đề ngắn 12 câu/.test(src) && !/Now I Know|Kiến thức nền/.test(src), src);
      await p.click('#topicList .mix-card .mix-btn'); await p.waitForTimeout(400);
      let qs = await quizQs(p);
      assert.strictEqual(qs.length, 12);
      assert.strictEqual(new Set(qs.map(q => q.id)).size, 12);
      assert.ok(qs.every(q => isMs(q) && q.lesson === 1 && !q.passage), 'đề trộn lẫn câu ngoài L1');
      assert.ok((await p.textContent('#qText')).trim().length > 0, 'màn làm bài có câu hỏi');
      ok(W + ': chỉ bật Ms Hoa → thẻ Ôn tổng hợp ở đầu, bấm ra 12 câu U6 L1');

      // 3) Luyện tập + Kiểm tra trong chủ đề Ms Hoa ở mốc L1
      for (const mode of ['practice', 'test']) {
        await openEnglish(p); await p.waitForTimeout(200);
        await p.evaluate(m => { const card = [...document.querySelectorAll('#topicList .topic-card')].find(c => /Ms Hoa/.test(c.querySelector('.topic-name').textContent));
          card.querySelector('.mode-btn.' + m).click(); }, mode);
        await p.waitForTimeout(300);
        qs = await quizQs(p);
        assert.ok(qs.length > 0 && qs.every(q => q.lesson === 1 && !q.passage), mode + ' lẫn câu L2');
      }
      ok(W + ': Luyện tập / Kiểm tra Ms Hoa ở L1 chỉ nhận câu L1');

      // 4) Kế hoạch hôm nay: nhiệm vụ chủ đề Ms Hoa chạy qua Today.start (điểm khởi chạy thật)
      const runToday = () => p.evaluate(() => { const plan = Today.plan();
        plan.tasks.push({ id: 'e2e-ms', kind: 'topic', subjectId: 'tieng-anh', topicId: 'en_mshoa-e2-u6', title: 'e2e', sub: '', minutes: 5, icon: 'book', done: false });
        Today.save(plan); Today.start(plan.tasks.length - 1); });
      await runToday(); await p.waitForTimeout(300);
      qs = await quizQs(p);
      assert.ok(qs.length === 10 && qs.every(q => q.lesson === 1 && !q.passage), 'kế hoạch L1 lẫn câu L2: ' + qs.map(q => q.id));
      ok(W + ': nhiệm vụ kế hoạch hôm nay (Today.start) ở L1 chỉ nhận câu L1');

      // 5) Thử thách đón cún: nhiều lượt Pet.startChallenge, câu Ms Hoa (nếu có) đều L1
      const runPet = n => p.evaluate(n => { const seen = [];
        for (let i = 0; i < n; i++) { const r = Pet.startChallenge(); if (!r.ok) return { err: r.error };
          Quiz.questions.filter(q => /^en_mshoa/.test(q.id)).forEach(q => seen.push(q.bookLesson.lesson)); }
        return { seen }; }, n);
      let pet = await runPet(60);
      assert.ok(!pet.err, 'startChallenge: ' + pet.err);
      assert.ok(pet.seen.length > 0 && pet.seen.every(l => l === 1), 'thử thách cún ở L1: ' + pet.seen);
      ok(W + ': thử thách đón cún ở L1 chỉ lấy câu Ms Hoa L1 (' + pet.seen.length + ' câu qua 60 lượt)');

      // 6) Mốc L2: cả 4 điểm khởi chạy lấy được câu L2; đề trộn chỉ Ms Hoa đủ 20 câu
      await p.evaluate(() => App.setBookScope(App.allData.subjects.find(s => s.id === 'tieng-anh'), { lesson: { 'mshoa-explorer2': { unit: 6, lesson: 2 } } }));
      await openEnglish(p); await p.waitForTimeout(200);
      await p.click('#topicList .mix-card .mix-btn'); await p.waitForTimeout(300);
      qs = await quizQs(p);
      assert.ok(qs.length === 20 && qs.every(isMs) && qs.some(q => q.lesson === 2));
      await runToday(); await p.waitForTimeout(300);
      const l2today = [];
      for (let i = 0; i < 6 && !l2today.length; i++) { await runToday(); await p.waitForTimeout(150); (await quizQs(p)).filter(q => q.lesson === 2).forEach(q => l2today.push(q.id)); }
      assert.ok(l2today.length > 0, 'kế hoạch ở L2 phải lấy được câu L2');
      pet = await runPet(60);
      assert.ok(pet.seen.some(l => l === 2), 'thử thách cún ở L2 phải lấy được câu L2');
      ok(W + ': mốc L2 → đề trộn 20 câu, kế hoạch và thử thách cún có câu L2');

      assert.strictEqual(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, W + ' cuộn ngang');
      assert.deepStrictEqual(errs, []);
      await ctx.close();
    }
    console.log('en-books e2e OK');
  } catch (e) { console.error(e); process.exitCode = 1; } finally { await b.close(); }
})();
