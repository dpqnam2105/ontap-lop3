// Kiểm thử tích hợp bộ sinh B1–B3 trên trình duyệt thật (Chromium), đi qua luồng web thật.
// Chạy: (cd <repo> && python3 -m http.server 8765) rồi  node tests/gen.e2e.js   (cần Playwright + Chromium)
// Ảnh chụp câu điền dấu trên điện thoại: tests/out/dau-390.png
const { chromium } = require('playwright');
const assert = require('assert');
const fs = require('fs'), path = require('path');
const URL = process.env.BASE_URL || 'http://localhost:8765/';
const OUT = path.join(__dirname, 'out');

async function open(b, opts) {
  opts = opts || {};
  const ctx = await b.newContext({ viewport: opts.vp || { width: 1280, height: 900 }, isMobile: !!opts.mobile, hasTouch: !!opts.mobile });
  await ctx.route('https://script.google.com/**', r => {
    const a = new globalThis.URL(r.request().url()).searchParams.get('action');
    let body = '[]';
    if (a === 'get') body = '{"ok":true,"found":false,"ver":0}';
    else if (r.request().method() === 'POST') body = '{"ok":true,"saved":true,"ver":1}';
    r.fulfill({ contentType: 'application/json', body });
  });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForFunction(() => App.allData && App._dataByGrade.lop3);
  await p.fill('#nameInput', opts.name || 'Bé Thử Sinh'); await p.click('#btnStart'); await p.waitForTimeout(1200);
  return { p, ctx, errs };
}
const reload = async p => { await p.goto(URL); await p.waitForFunction(() => App.allData && App._dataByGrade.lop3); };
const toToan = async p => {
  await p.click('.rail-btn-learn'); await p.waitForTimeout(500);
  await p.evaluate(() => App._chooseSubject(App.allData.subjects.findIndex(s => s.id === 'toan'))); await p.waitForTimeout(400);
};
const card = (p, topicName) => p.locator('.topic-card', { hasText: topicName }).first();
const sess = p => p.evaluate(() => Quiz.questions.filter(q => !q._retry).map(q => ({ id: q.id, topicId: q.topicId, idx: q._idx, lesson: q.lesson ? q.lesson.no : null, tpl: (GenB13.parse(q.id) || {}).tpl || null })));
const G13 = 'Nền số đến 1000';

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch();
  const ok = m => console.log('✔', m);
  let fail = 0;
  const T = async (name, fn) => { try { await fn(); ok(name); } catch (e) { fail++; console.log('✘', name, '\n   ', e.message); } };

  // ── 1) Mốc bài đã học: áp dụng ở mọi đường tạo lượt mới; chưa chọn → theo giai đoạn ──
  await T('mốc bài: chủ đề, kế hoạch hôm nay, đề trộn tuần, trộn vào chủ đề tĩnh đều lọc theo bài; chưa chọn / giá trị hỏng → theo giai đoạn', async () => {
    const { p, ctx, errs } = await open(b);
    await toToan(p);
    const info = () => p.evaluate(() => { const s = App.allData.subjects.find(x => x.id === 'toan'); const g = s.topics.find(t => t.id === 'toan_g13');
      const a = App._allowedIndices(s, g); return { n: a.length, maxLesson: Math.max(...a.map(i => g.questions[i].lesson.no)), total: g.questions.length }; });
    let x = await info();
    assert.strictEqual(x.n, x.total, 'chưa chọn mốc: cả kho GĐ1 hiện'); assert.strictEqual(x.maxLesson, 3);
    await p.selectOption('#lessonSelect', '1'); await p.waitForTimeout(400);
    x = await info();
    assert.ok(x.n > 50 && x.n < x.total && x.maxLesson === 1, 'chọn Bài 1: chỉ câu B1 (' + x.n + ')');
    // a) tự chọn bài: bấm Luyện tập ở thẻ chủ đề
    await card(p, G13).locator('.topic-toggle').click();
    await card(p, G13).locator('[data-mode="practice"]').click(); await p.waitForTimeout(400);
    let q = await sess(p); assert.ok(q.length && q.every(y => y.lesson === 1), 'lượt chủ đề: chỉ B1');
    // b) kế hoạch hôm nay (đường Today.start)
    await p.evaluate(() => { Storage.set('todayPlan', { date: Today._dateKey(), grade: App.currentGrade, player: Storage.canonName(App.playerName), rewarded: false,
      tasks: [{ id: 'practice', kind: 'topic', subjectId: 'toan', topicId: 'toan_g13', title: 'x', done: false }] }); Today.start(0); });
    await p.waitForTimeout(400);
    q = await sess(p); assert.ok(q.length === 10 && q.every(y => y.lesson === 1), 'kế hoạch hôm nay: 10 câu, chỉ B1');
    // c) ôn tổng hợp: đề trộn tuần
    const mix = await p.evaluate(() => App._buildWeeklyMix(App.allData.subjects.find(x => x.id === 'toan')).pool.filter(q => q.lesson).map(q => q.lesson.no));
    assert.ok(mix.every(n => n <= 1), 'đề trộn tuần: câu có mốc bài đều ≤ B1');
    // d) trộn vào chủ đề tĩnh: lời văn là B2 → không được trộn khi mới học đến Bài 1
    await toToan(p);
    // (sau vòng 10 mọi câu GĐ1 của chủ đề lời văn đều ≥ B2 → ở Bài 1 cả chủ đề ẩn, không có lượt nào để trộn)
    assert.strictEqual(await card(p, 'Giải toán có lời văn').count(), 0, 'Bài 1: chủ đề lời văn không có câu nào → ẩn');
    // Bài 2: được trộn lời văn sinh (B2), nhưng mọi câu trong lượt đều ≤ B2
    await p.selectOption('#lessonSelect', '2'); await p.waitForTimeout(400);
    await card(p, 'Giải toán có lời văn').locator('.topic-toggle').click();
    await card(p, 'Giải toán có lời văn').locator('[data-mode="practice"]').click(); await p.waitForTimeout(400);
    q = await sess(p); assert.ok(q.length && q.every(y => y.lesson === null || y.lesson <= 2), 'Bài 2: lượt lời văn chỉ có câu ≤ B2');
    await toToan(p); await p.selectOption('#lessonSelect', '1'); await p.waitForTimeout(400);
    // câu tĩnh đã ghi số bài cũng bị lọc: Bài 1 → ẩn câu bảng 4 đã gắn B6, câu chưa gắn vẫn hiện
    const st = await p.evaluate(() => { const s = App.allData.subjects.find(x => x.id === 'toan'); const t = s.topics.find(x => x.id === 'toan_bang-nhan-chia');
      const a = new Set(App._allowedIndices(s, t)); const at = id => a.has(t.questions.findIndex(q => q.id === id));
      const free = t.questions.filter(q => !q.lesson).map(q => q.id).filter(at);
      return { q020: at('toan_bang-nhan-chia_q020'), free: free.length }; });
    assert.ok(!st.q020 && st.free > 0, 'câu tĩnh có lesson B6 bị ẩn khi mới học Bài 1; câu chưa gắn vẫn hiện (' + st.free + ')');
    // Đợt 9: mỗi câu tĩnh có lesson mở đúng ở mốc của nó, ẩn ở mốc ngay trước; câu không gắn luôn hiện
    const lv = await p.evaluate(() => {
      const s = App.allData.subjects.find(x => x.id === 'toan'); const out = { mismatch: [], spot: {}, tagged: 0 };
      const byId = {}; s.topics.forEach(t => t.questions.forEach((q, i) => { byId[q.id] = { t, i, q }; }));
      const vis = (id, no) => { App.setLessonSetting(s, no); const r = byId[id]; const a = App._allowedIndices(s, r.t); return !a || a.includes(r.i); };
      const base = id => { App.setLessonSetting(s, null); const r = byId[id]; const a = App._allowedIndices(s, r.t); return !a || a.includes(r.i); };
      Object.keys(byId).filter(id => !id.startsWith('toan_g13_')).forEach(id => {
        const q = byId[id].q; if (!base(id)) return;
        if (q.lesson && q.lesson.book === 'kntt-toan3') {
          out.tagged++; const n = q.lesson.no;
          if (!vis(id, n) || (n > 1 && vis(id, n - 1))) out.mismatch.push(id + '@B' + n);
        } else if (!vis(id, 1)) out.mismatch.push(id + ' (không gắn mà bị ẩn)');
      });
      const spot = { 'toan_bang-nhan-chia_q018': [8, 7], 'toan_bang-nhan-chia_q049': [9, 8], 'toan_bang-nhan-chia_q086': [10, 9],
        'toan_bang-nhan-chia_q017': [13, 12], 'toan_bang-nhan-chia_q052': [8, 7], 'toan_bang-nhan-chia_q008': [10, 9],
        'toan_bang-nhan-chia_q058': [9, 8], 'toan_bang-nhan-chia_q038': [5, 4], 'toan_bang-nhan-chia_q075': [4, 3],
        'toan_phan-so-don-gian_q011': [14, 13], 'toan_phan-so-don-gian_q029': [14, 13], 'toan_xem-dong-ho-thoi-gian_q001': [7, 6] };
      for (const [id, [on, off]] of Object.entries(spot)) out.spot[id] = byId[id] ? [vis(id, on), vis(id, off)] : 'thiếu';
      out.doLuong = ['toan_do-luong_q002', 'toan_do-luong_q017'].map(id => byId[id] && !byId[id].q.lesson && vis(id, 1));
      App.setLessonSetting(s, null);
      return out;
    });
    assert.deepStrictEqual(lv.mismatch, [], 'mọi câu có lesson mở đúng mốc');
    assert.ok(lv.tagged >= 193, 'đủ câu đã gắn bài (' + lv.tagged + ')');
    for (const [id, v] of Object.entries(lv.spot)) assert.deepStrictEqual(v, [true, false], id + ' mở/ẩn đúng mốc');
    assert.deepStrictEqual(lv.doLuong, [true, true], 'câu độ dài / ước lượng kg không gắn bài, luôn hiện');
    // bỏ chọn → về hành vi giai đoạn
    await toToan(p); await p.selectOption('#lessonSelect', ''); await p.waitForTimeout(300);
    x = await info(); assert.strictEqual(x.n, x.total, 'bỏ chọn mốc bài → như cũ');
    // giá trị lưu hỏng không mở/không khoá gì thêm: coi như chưa chọn
    await p.evaluate(() => Storage.set('lessonBySubject', { 'lop3:toan': { book: 'kntt-toan3', vol: 1, no: 99 } }));
    x = await info(); assert.strictEqual(x.n, x.total, 'mốc bài hỏng → theo giai đoạn');
    // giai đoạn khác: chỉ GĐ3 → chủ đề nền B1–B3 không hiện
    await toToan(p);
    await p.click('.stage-chip[data-stage="3"]'); await p.waitForTimeout(300); await p.click('.stage-mode-btn[data-only="1"]'); await p.waitForTimeout(300);
    assert.strictEqual(await card(p, G13).count(), 0, 'chỉ GĐ3: ẩn chủ đề nền');
    assert.deepStrictEqual(errs, []);
    await ctx.close();
  });

  // ── 2) Quota: ≤ 40%, chỉ mẫu hợp chủ đề, không chèn vào chủ đề khác; tiến độ ghi đúng nơi ──
  await T('trộn câu sinh: ≤ 40% lượt, đúng mẫu theo chủ đề, không vào chủ đề khác; tiến độ ngày của chủ đề tĩnh không nhận chỉ số câu sinh', async () => {
    const { p, ctx, errs } = await open(b);
    await toToan(p);
    for (const [name, onlyLv] of [['Giải toán có lời văn', true], ['Ôn tập tổng hợp', false]]) {
      for (const mode of ['practice', 'test']) {
        await toToan(p);
        await card(p, name).locator(".topic-toggle").click();
        await card(p, name).locator(`[data-mode="${mode}"]`).click(); await p.waitForTimeout(400);
        const q = await sess(p);
        const gen = q.filter(y => y.topicId === 'toan_g13');
        assert.ok(gen.length > 0 && gen.length <= Math.floor(q.length * 0.4), name + '/' + mode + ': ' + gen.length + '/' + q.length);
        if (onlyLv) assert.ok(gen.every(y => y.tpl === 'lv'), name + ': chỉ lời văn');
      }
    }
    for (const name of ['Đếm hình', 'Bảng nhân, chia', 'Một phần mấy']) {
      await toToan(p);
      await card(p, name).locator('.topic-toggle').click();
      await card(p, name).locator('[data-mode="practice"]').click(); await p.waitForTimeout(400);
      assert.ok((await sess(p)).every(y => y.topicId !== 'toan_g13'), name + ': không có câu sinh');
    }
    // làm hết lượt Giải toán có lời văn (đúng ngay) → tiến độ ngày chủ đề tĩnh chỉ có chỉ số câu tĩnh
    await toToan(p);
    await card(p, 'Giải toán có lời văn').locator('.topic-toggle').click();
    await card(p, 'Giải toán có lời văn').locator('[data-mode="practice"]').click(); await p.waitForTimeout(400);
    const q = await sess(p);
    for (let k = 0; k < q.length; k++) {
      await p.evaluate(() => { const q = Quiz.questions[Quiz.curIdx]; const right = String(q.choices[q.a]);
        [...document.querySelectorAll('.ans-btn')].find(x => x.textContent === right).click(); });
      await p.waitForTimeout(150);
      await p.click('#btnNext'); await p.waitForTimeout(150);
    }
    const prog = await p.evaluate(() => ({ host: Storage.getTopicProgress('toan_giai-toan-co-loi-van').learned, g: Storage.getTotalProgress('toan_g13').ok }));
    const st = q.filter(y => y.topicId !== 'toan_g13').map(y => y.idx).sort(), gn = q.filter(y => y.topicId === 'toan_g13').map(y => y.idx).sort();
    assert.deepStrictEqual(prog.host.slice().sort(), st, 'tiến độ ngày chủ đề tĩnh = đúng các câu tĩnh');
    assert.ok(gn.every(i => prog.g.includes(i)), 'câu sinh ghi vào tiến độ tích lũy của chủ đề nền');
    assert.deepStrictEqual(errs, []);
    await ctx.close();
  });

  // ── 3) Ôn câu sai qua luồng thật: sai → lưu → tải lại → mở ôn → đúng câu → trả lời đúng; lịch ôn; sao lưu sang máy khác ──
  let snap = null, wrongQ = null;
  await T('ôn câu sai câu sinh: làm sai → tải lại trang → bấm "Ôn lại câu con hay sai" → đúng đề / lựa chọn / đáp án → trả lời đúng là xong', async () => {
    const { p, ctx, errs } = await open(b, { name: 'Bé Ôn Sai' });
    await toToan(p);
    await card(p, G13).locator('.topic-toggle').click();
    await card(p, G13).locator('[data-mode="test"]').click(); await p.waitForTimeout(400);
    wrongQ = await p.evaluate(() => { const q = Quiz.questions[0]; return { id: q.id, q: q.q, choices: q.choices.slice(), a: q.a, hint: q.hint }; });
    await p.evaluate(() => { const q = Quiz.questions[0]; const right = String(q.choices[q.a]);
      [...document.querySelectorAll('.ans-btn')].find(x => x.textContent !== right).click(); });
    await p.waitForTimeout(300);
    const rec = await p.evaluate(id => ({ w: Storage.getUnresolvedWrong(40).map(x => x.questionId), r: Storage.getReviewMap()[id] }), wrongQ.id);
    assert.ok(rec.w.includes(wrongQ.id) && rec.r && rec.r.topicId === 'toan_g13', 'đã ghi câu sai + lịch ôn');
    snap = await p.evaluate(() => Cloud.collect(App.playerName));
    await reload(p);
    const items = await p.evaluate(() => Today._reviewItems().map(x => x.qid));
    assert.ok(items.includes(wrongQ.id), 'lịch ôn hôm nay có câu sinh đã sai');
    await p.click('.rail-btn-learn'); await p.waitForTimeout(500);
    await p.click('.wrong-review-bar'); await p.waitForTimeout(500);
    const cur = await p.evaluate(() => { const q = Quiz.questions[Quiz.curIdx]; return { id: q.id, q: q.q, choices: q.choices.slice(), a: q.a, hint: q.hint, shown: document.getElementById('qText').textContent, btns: [...document.querySelectorAll('.ans-btn')].map(x => x.textContent) }; });
    assert.deepStrictEqual({ id: cur.id, q: cur.q, choices: cur.choices, a: cur.a, hint: cur.hint }, wrongQ, 'dựng lại đúng câu');
    assert.strictEqual(cur.shown, wrongQ.q);
    assert.deepStrictEqual(cur.btns.slice().sort(), wrongQ.choices.slice().sort(), 'nút = các lựa chọn của câu');
    await p.locator('.ans-btn', { hasText: new RegExp('^' + wrongQ.choices[wrongQ.a].replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }).first().click(); await p.waitForTimeout(300);
    assert.ok(await p.evaluate(() => document.getElementById('feedback').className.includes('correct')), 'chấm đúng');
    await p.click('#btnNext'); await p.waitForTimeout(400);
    assert.ok(!(await p.evaluate(id => Storage.getUnresolvedWrong(40).some(x => x.questionId === id), wrongQ.id)), 'đã sửa → không còn trong câu sai');
    assert.deepStrictEqual(errs, []);
    await ctx.close();
  });

  await T('sao lưu / đồng bộ: dữ liệu bé (Cloud.collect) mở trên máy khác → ôn câu sai dựng lại đúng câu sinh', async () => {
    assert.ok(snap && wrongQ);
    const { p, ctx, errs } = await open(b, { name: 'Bé Ôn Sai' });
    assert.ok(await p.evaluate(s => Cloud.apply(s, 'Bé Ôn Sai'), snap), 'áp bản sao lưu');
    await reload(p);
    await p.click('.rail-btn-learn'); await p.waitForTimeout(500);
    await p.click('.wrong-review-bar'); await p.waitForTimeout(500);
    const got = await p.evaluate(() => Quiz.questions.map(q => ({ id: q.id, q: q.q, choices: q.choices, a: q.a, hint: q.hint })));
    assert.ok(got.some(x => JSON.stringify(x) === JSON.stringify(wrongQ)), 'máy mới có đúng câu');
    assert.deepStrictEqual(errs, []);
    await ctx.close();
  });

  await T('câu sinh trong lịch sử nhưng KHÔNG có trong kho (như sau khi lên phiên bản) → vẫn dựng lại và ôn được; lịch ôn cũng thấy', async () => {
    const { p, ctx, errs } = await open(b, { name: 'Bé Ngoài Kho' });
    const outId = await p.evaluate(() => { const have = new Set(GenB13.bank().map(q => q.id));
      const q = GenB13.pick('ngoai-kho', 200).find(x => !have.has(x.id));
      Storage.recordAnswer({ questionId: q.id, isCorrect: false, subjectId: 'toan', topicId: 'toan_g13', question: q.q });
      Storage.recordReview(q.id, false, { subjectId: 'toan', topicId: 'toan_g13' });
      return q.id; });
    await reload(p);
    assert.ok(await p.evaluate(id => Today._reviewItems().some(x => x.qid === id), outId), 'lịch ôn thấy câu ngoài kho');
    await p.click('.rail-btn-learn'); await p.waitForTimeout(500);
    await p.click('.wrong-review-bar'); await p.waitForTimeout(500);
    const same = await p.evaluate(id => { const q = Quiz.questions.find(x => x.id === id); const b = GenB13.build(id);
      return !!q && q.q === b.q && JSON.stringify(q.choices) === JSON.stringify(b.choices) && q.a === b.a; }, outId);
    assert.ok(same, 'ôn câu sai có câu ngoài kho, đúng nội dung build(id)');
    assert.deepStrictEqual(errs, []);
    await ctx.close();
  });

  // ── 3b) Tiến độ chủ đề câu sinh theo ID: câu dựng lại đổi vị trí sau tải lại vẫn giữ đúng dấu (cả sang máy khác) ──
  await T('tiến độ theo id: thêm A → làm đúng → thêm B (id đứng trước) → tải lại (B chiếm vị trí cũ của A) → dấu đúng vẫn ở A; sang máy khác cũng vậy', async () => {
    const { p, ctx, errs } = await open(b, { name: 'Bé Tiến Độ' });
    const [A, B] = await p.evaluate(() => { const have = new Set(GenB13.bank().map(q => q.id));
      const out = GenB13.pick('tien-do-ab', 400).map(q => q.id).filter(id => !have.has(id)).sort(); return [out[out.length - 1], out[0]]; });
    const addWrong = id => p.evaluate(id => { const q = GenB13.build(id);
      Storage.recordAnswer({ questionId: id, isCorrect: false, subjectId: 'toan', topicId: 'toan_g13', question: q.q });
      Storage.recordReview(id, false, { subjectId: 'toan', topicId: 'toan_g13' }); }, id);
    const answerRight = async () => { await p.evaluate(() => { const q = Quiz.questions[Quiz.curIdx]; const right = String(q.choices[q.a]);
      [...document.querySelectorAll('.ans-btn')].find(x => x.textContent === right).click(); }); await p.waitForTimeout(200); await p.click('#btnNext'); await p.waitForTimeout(300); };
    await addWrong(A); await reload(p);
    await toToan(p);
    // làm đúng A trong lượt luyện của chủ đề nền (ghi tiến độ ngày + tích lũy)
    await p.evaluate(id => { const s = App.allData.subjects.find(x => x.id === 'toan'); const t = s.topics.find(x => x.id === 'toan_g13');
      Quiz.start(t, s.name, { mode: 'practice', subjectId: 'toan', allowed: [t.questions.findIndex(q => q.id === id)] }); }, A);
    await p.waitForTimeout(300); await answerRight();
    const before = await p.evaluate(id => { const t = App.allData.subjects.find(x => x.id === 'toan').topics.find(x => x.id === 'toan_g13'); return t.questions.findIndex(q => q.id === id); }, A);
    assert.strictEqual(before, 300, 'A ở vị trí 300 lúc đầu');
    await addWrong(B); await reload(p);
    const check = () => p.evaluate(([a, bb]) => { Today._reviewItems();
      const t = App.allData.subjects.find(x => x.id === 'toan').topics.find(x => x.id === 'toan_g13');
      const ia = t.questions.findIndex(q => q.id === a), ib = t.questions.findIndex(q => q.id === bb);
      return { ia, ib, ok: Storage.getTotalProgress('toan_g13').ok, day: Storage.getTopicProgress('toan_g13').learned }; }, [A, B]);
    let r = await check();
    assert.strictEqual(r.ib, 300, 'sau tải lại B chiếm vị trí 300 (như Codex tái hiện)');
    assert.ok(r.ok.includes(r.ia) && !r.ok.includes(r.ib), 'tích lũy: đúng ở A, không ở B ' + JSON.stringify(r));
    assert.ok(r.day.includes(r.ia) && !r.day.includes(r.ib), 'trong ngày: đúng ở A, không ở B');
    const snap2 = await p.evaluate(() => Cloud.collect(App.playerName));
    assert.deepStrictEqual(errs, []);
    await ctx.close();
    const o = await open(b, { name: 'Bé Tiến Độ' });
    await o.p.evaluate(s => Cloud.apply(s, 'Bé Tiến Độ'), snap2); await reload(o.p);
    r = await o.p.evaluate(([a, bb]) => { Today._reviewItems();
      const t = App.allData.subjects.find(x => x.id === 'toan').topics.find(x => x.id === 'toan_g13');
      const ia = t.questions.findIndex(q => q.id === a), ib = t.questions.findIndex(q => q.id === bb);
      return { ia, ib, ok: Storage.getTotalProgress('toan_g13').ok }; }, [A, B]);
    assert.ok(r.ia >= 300 && r.ok.includes(r.ia) && !r.ok.includes(r.ib), 'máy khác: đúng ở A, không ở B ' + JSON.stringify(r));
    assert.deepStrictEqual(o.errs, []);
    await o.ctx.close();
  });

  // ── 4) Câu điền dấu: đúng 3 lựa chọn, chấm điểm, hiển thị đáp án, bàn phím, điện thoại ──
  await T('câu điền dấu: 3 nút (>, <, =) một hàng, không thêm lựa chọn giả; chấm đúng/sai; gợi ý; bàn phím; 390px không cuộn ngang', async () => {
    const { p, ctx, errs } = await open(b, { vp: { width: 390, height: 844 }, mobile: true, name: 'Bé Điền Dấu' });
    await toToan(p);
    const startDau = mode => p.evaluate(m => { const s = App.allData.subjects.find(x => x.id === 'toan'); const t = s.topics.find(x => x.id === 'toan_g13');
      const i = t.questions.findIndex(q => GenB13.parse(q.id).tpl === 'dau' && q.choices[q.a] !== '=');
      Quiz.start(t, s.name, { mode: m, subjectId: s.id, allowed: [i] }); return t.questions[i]; }, mode);
    const q = await startDau('practice'); await p.waitForTimeout(400);
    const ui = await p.evaluate(() => { const bs = [...document.querySelectorAll('.ans-btn')];
      return { texts: bs.map(x => x.textContent), tops: bs.map(x => Math.round(x.getBoundingClientRect().top)), three: document.getElementById('ansGrid').classList.contains('answers-3'),
        sw: document.documentElement.scrollWidth, cw: innerWidth, right: Math.max(...bs.map(x => x.getBoundingClientRect().right)) }; });
    assert.deepStrictEqual(ui.texts, ['>', '<', '='], 'đúng 3 nút, thứ tự cố định');
    assert.ok(ui.three && new Set(ui.tops).size === 1, 'một hàng');
    assert.ok(ui.sw === ui.cw && ui.right <= ui.cw, 'không tràn ngang');
    await p.screenshot({ path: path.join(OUT, 'dau-390.png') });
    const wrong = ['>', '<'].find(x => x !== q.choices[q.a]);
    await p.locator('.ans-btn', { hasText: wrong }).first().click(); await p.waitForTimeout(300);
    const fb = await p.evaluate(() => ({ cls: document.getElementById('feedback').className, ans: document.getElementById('fbAns').textContent }));
    assert.ok(fb.cls.includes('wrong') && fb.ans.includes(q.hint), 'sai → hiện gợi ý');
    // bàn phím: Tab tới nút đúng rồi Enter
    const rightIdx = ['>', '<', '='].indexOf(q.choices[q.a]);
    await p.evaluate(i => document.querySelectorAll('.ans-btn')[i].focus(), rightIdx); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
    assert.ok(await p.evaluate(() => document.getElementById('feedback').className.includes('correct')), 'Enter trên nút đúng → chấm đúng');
    await p.screenshot({ path: path.join(OUT, 'dau-390-dung.png') });
    // kiểm tra (test mode): sai → ghi nhận, điểm 0/1
    await startDau('test'); await p.waitForTimeout(300);
    await p.locator('.ans-btn', { hasText: wrong }).first().click(); await p.waitForTimeout(200);
    await p.click('#btnNext'); await p.waitForTimeout(400);
    assert.strictEqual(await p.evaluate(() => document.getElementById('resScore').textContent), '0/1');
    assert.deepStrictEqual(errs, []);
    await ctx.close();
  });

  // ── 5) Điểm: câu sinh đi qua cùng luồng chấm điểm, XP, sao, lần đầu như câu tĩnh ──
  await T('điểm: câu sinh và câu tĩnh cộng sao / XP / số câu đúng như nhau (cùng chế độ, cùng trạng thái)', async () => {
    const { p, ctx, errs } = await open(b, { name: 'Bé Tính Điểm' });
    await toToan(p);
    const one = (topicId, pickFirst) => p.evaluate(([tid]) => {
      const s = App.allData.subjects.find(x => x.id === 'toan'); const t = s.topics.find(x => x.id === tid);
      const allowed = App._allowedIndices(s, t);
      const before = Storage.load();
      Quiz.start(t, s.name, { mode: 'test', subjectId: s.id, allowed: [allowed[0]] });
      const q = Quiz.questions[0]; const right = String(q.choices[q.a]);
      [...document.querySelectorAll('.ans-btn')].find(x => x.textContent === right).click();
      const after = Storage.load();
      return { stars: after.stars - before.stars, xp: (after.xp || 0) - (before.xp || 0), correct: (after.totalCorrect || 0) - (before.totalCorrect || 0), score: Quiz.score };
    }, [topicId]);
    const st = await one('toan_giai-toan-co-loi-van');
    await p.click('#btnNext'); await p.waitForTimeout(300);
    const gn = await one('toan_g13');
    assert.deepStrictEqual(gn, st, 'câu sinh ' + JSON.stringify(gn) + ' vs câu tĩnh ' + JSON.stringify(st));
    assert.ok(st.score === 1 && st.correct === 1, 'có cộng điểm');
    assert.deepStrictEqual(errs, []);
    await ctx.close();
  });

  await b.close();
  console.log(fail ? fail + ' lỗi' : 'Tất cả đạt');
  process.exit(fail ? 1 : 0);
})();
