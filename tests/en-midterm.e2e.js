// Ôn giữa kỳ I Tiếng Anh — kiểm tại điểm khởi chạy thật trên trình duyệt (390 px và 1280 px):
// thẻ đứng sau Ôn tổng hợp, mở/thu gọn, Ôn nhóm / Đề thử / Bài thêm / Ôn câu sai chỉ nhận câu sẵn sàng (không câu chờ hình),
// Đề thử chỉ lấy phần bắt buộc. Chạy: (cd <repo> && python3 -m http.server 8765) rồi node tests/en-midterm.e2e.js
const { chromium } = require('playwright');
const assert = require('assert');
const URL = process.env.BASE_URL || 'http://localhost:8765/';
const SHOT = process.env.SHOT_DIR || '';

(async () => {
  const b = await chromium.launch();
  try {
    for (const [vp, mobile] of [[{ width: 390, height: 844 }, true], [{ width: 1280, height: 900 }, false]]) {
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
      const W = vp.width + 'px';
      const info = await p.evaluate(() => {
        const s = App.allData.subjects.find(x => x.id === 'tieng-anh');
        const set = s.reviewSets[0];
        const all = s.topics.flatMap(t => t.questions);
        return { pending: all.filter(q => q.image && q.imageReview && q.imageReview.status !== 'ok').map(q => q.id),
          req: set.groups.flatMap(g => g.required), ext: set.groups.flatMap(g => g.extra) };
      });
      const pend = new Set(info.pending), req = new Set(info.req), ext = new Set(info.ext);
      const open = async () => { await p.evaluate(() => App._chooseSubject(App.allData.subjects.findIndex(s => s.id === 'tieng-anh'))); await p.waitForTimeout(300); };
      await open();
      const order = await p.evaluate(() => [...document.querySelectorAll('#topicList > *')].slice(0, 2).map(e => e.className));
      assert.ok(/mix-card/.test(order[0]) && /gk-card/.test(order[1]), 'thứ tự thẻ: ' + order);
      assert.ok(await p.isHidden('.gk-card .gk-panel'));
      await p.click('.gk-card .gk-toggle');
      assert.ok(await p.isVisible('.gk-card .gk-panel'));
      const noScroll = await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
      assert.ok(noScroll, 'tràn ngang');
      if (SHOT) await p.locator('.gk-card').screenshot({ path: SHOT + '/gk-' + vp.width + '.png' });
      console.log('✔', W + ': thẻ Ôn giữa kỳ sau Ôn tổng hợp, mở được, không tràn ngang');
      const ids = () => p.evaluate(() => Quiz.questions.map(q => q.id));
      // Ôn từng nhóm
      const groups = await p.$$eval('.gk-card [data-act="group"]', bs => bs.map(x => x.dataset.g));
      assert.ok(groups.length >= 7);
      for (const g of groups) {
        await open(); await p.click('.gk-card .gk-toggle');
        await p.click(`.gk-card [data-act="group"][data-g="${g}"]`); await p.waitForTimeout(250);
        const q = await ids();
        assert.ok(q.length > 0 && q.every(id => req.has(id) && !pend.has(id)), g + ': ' + q.filter(id => pend.has(id) || !req.has(id)));
        assert.ok((await p.textContent('#qText')).trim().length > 0);
      }
      console.log('✔', W + ': Ôn ' + groups.length + ' nhóm — chỉ câu bắt buộc, không câu chờ hình');
      await open(); await p.click('.gk-card .gk-toggle'); await p.click('.gk-card [data-act="mock"]'); await p.waitForTimeout(250);
      let q = await ids();
      assert.strictEqual(q.length, 20); assert.strictEqual(new Set(q).size, 20);
      assert.ok(q.every(id => req.has(id) && !pend.has(id)));
      console.log('✔', W + ': Đề thử 20 câu, không lặp, chỉ bắt buộc');
      await open(); await p.click('.gk-card .gk-toggle'); await p.click('.gk-card [data-act="extra"]'); await p.waitForTimeout(250);
      q = await ids();
      assert.ok(q.length > 0 && q.every(id => ext.has(id) && !pend.has(id)));
      console.log('✔', W + ': Bài thêm chỉ câu extra sẵn sàng (' + q.length + ')');
      // Ôn câu sai: ghi 1 câu sai thuộc danh sách
      await p.evaluate(() => Storage.recordAnswer({ subjectId: 'tieng-anh', topicId: 'en_nik3-unit3', questionId: 'en_nik3-unit3_q002', question: 'x', isCorrect: false }));
      await open(); await p.click('.gk-card .gk-toggle');
      assert.ok(!(await p.isDisabled('.gk-card [data-act="wrong"]')));
      await p.click('.gk-card [data-act="wrong"]'); await p.waitForTimeout(250);
      assert.deepStrictEqual(await ids(), ['en_nik3-unit3_q002']);
      console.log('✔', W + ': Ôn câu sai giữa kỳ');
      assert.deepStrictEqual(errs, []);
      await ctx.close();
    }
    console.log('en-midterm e2e OK');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
