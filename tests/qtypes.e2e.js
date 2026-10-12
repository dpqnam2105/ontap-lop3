// Dạng bài mới trên trình duyệt thật (390 px điện thoại + 1280 px): nghe chọn tranh, sắp xếp câu, trắc nghiệm cũ.
// Hồ sơ thử "Thử nghiệm", ?pilot=1; mọi request tới Apps Script bị chặn và đếm (chế độ thử không được ghi gì).
// Chạy: (cd <repo> && python3 -m http.server 8765) rồi node tests/qtypes.e2e.js
const { chromium } = require('playwright');
const assert = require('assert');
const URL = (process.env.BASE_URL || 'http://localhost:8765/') + '?pilot=1';
const SHOT = process.env.SHOT_DIR || '';
const LP = 'en_thu-dang-moi_q001', OD_THE = 'en_thu-dang-moi_q007';

// Giọng đọc giả: ghi lại mọi câu được đọc (chữ + tốc độ), không phát tiếng thật
const FAKE_SPEECH = () => {
  window.__spoken = [];
  class U { constructor(t) { this.text = t; this.rate = 1; this.lang = ''; } }
  const voices = [{ lang: 'en-US', name: 'Test English', localService: true }, { lang: 'vi-VN', name: 'Test VI', localService: true }];
  const synth = {
    getVoices: () => voices, addEventListener() {}, cancel() {},
    speak(u) { window.__spoken.push({ text: u.text, rate: u.rate }); setTimeout(() => u.onend && u.onend(), 5); }
  };
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: U, configurable: true, writable: true });
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true, writable: true });
};

(async () => {
  const b = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
  let checks = 0;
  const ok = (v, m) => { assert.ok(v, m); checks++; };
  const eq = (a, e, m) => { assert.deepStrictEqual(a, e, m); checks++; };
  try {
    for (const [vp, mobile] of [[{ width: 390, height: 844 }, true], [{ width: 1280, height: 900 }, false]]) {
      const tag = vp.width + 'px';
      const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile });
      const gas = [];
      await ctx.route('https://script.google.com/**', r => {
        gas.push(r.request().method() + ' ' + (new globalThis.URL(r.request().url()).searchParams.get('action') || 'post'));
        r.fulfill({ contentType: 'application/json', body: '[]' });
      });
      await ctx.addInitScript(FAKE_SPEECH);
      const p = await ctx.newPage();
      const errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.goto(URL); await p.waitForTimeout(700);
      await p.fill('#nameInput', 'Thử nghiệm'); await p.click('#btnStart'); await p.waitForTimeout(300);
      await p.waitForFunction(() => window.App && App.allData && App.allData.subjects && App.allData.subjects.length);
      ok(await p.isVisible('#pilotBanner'), tag + ': có dải báo chế độ thử');
      eq(await p.evaluate(() => Cloud.enabled()), false, tag + ': chế độ thử tắt sao lưu');

      // Mở 1 câu cụ thể của chủ đề thử ở chế độ cho trước
      const openQ = (id, mode) => p.evaluate(([id, mode]) => {
        const s = App.allData.subjects.find(x => x.id === 'tieng-anh');
        const t = s.topics.find(x => x.id === 'en_thu-dang-moi');
        const i = t.questions.findIndex(q => q.id === id);
        Quiz.start(t, s.name, { subjectId: s.id, allowed: [i], mode: mode || 'practice' });
        return i;
      }, [id, mode]);
      const state = () => p.evaluate(() => ({
        score: Quiz.score, stars: Quiz.sessionStars || 0, details: Quiz.sessionDetails.length,
        ev: LearningEngine.loadLearningState().analytics.events.length,
        check: (() => { const c = document.getElementById('btnCheck'); return c ? { disabled: c.disabled, hidden: c.classList.contains('hidden') } : null; })(),
        next: !document.getElementById('btnNext').classList.contains('hidden')
      }));
      const tap = async ids => { for (const id of ids) await p.click(`.od-pool .od-chip[data-id="${id}"]`); };
      const noHScroll = () => p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);

      // ── 1. Chủ đề thử chỉ có khi ?pilot=1 ──
      const topics = await p.evaluate(() => App.allData.subjects.find(x => x.id === 'tieng-anh').topics.map(t => t.id));
      ok(topics.includes('en_thu-dang-moi'), tag + ': chủ đề thử đã nạp');

      // ── 2. Sắp xếp câu: thao tác, nộp đôi, sửa lại không có thưởng, ôn sai ──
      await openQ(OD_THE);
      ok(await p.isVisible('#qtHost .od-line') && await p.isHidden('#ansGrid'), tag + ': order dùng renderer riêng');
      let st = await state();
      ok(st.check.disabled, tag + ': chưa xếp đủ thẻ → Kiểm tra khoá');
      ok(await noHScroll(), tag + ': order không tràn ngang');
      const chipH = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.od-chip')].map(c => c.getBoundingClientRect().height)));
      ok(chipH >= 44, tag + ': thẻ đủ lớn để chạm (' + chipH + 'px)');
      // bấm phím: Enter trên thẻ cũng đặt được thẻ
      await p.focus('.od-pool .od-chip[data-id="t0"]'); await p.keyboard.press('Enter');
      eq(await p.evaluate(() => [...document.querySelectorAll('.od-line .od-chip')].map(c => c.dataset.id)), ['t0'], tag + ': bàn phím đặt thẻ');
      await p.click('.od-undo');
      eq(await p.evaluate(() => document.querySelectorAll('.od-line .od-chip').length), 0, tag + ': Hoàn tác');
      await tap(['t0', 't1', 't5', 't3', 't4', 't2']);          // Put the bin in the trash
      ok(!(await state()).check.disabled, tag + ': đủ thẻ → Kiểm tra mở');
      // nộp đôi (gọi trực tiếp 2 lần liền + click) → chỉ ghi 1 lần
      const before = await state();
      await p.evaluate(() => { Quiz.submit(); Quiz.submit(); document.getElementById('btnCheck').click(); });
      st = await state();
      eq(st.details - before.details, 1, tag + ': nộp đôi chỉ ghi 1 chi tiết');
      eq(st.ev - before.ev, 1, tag + ': nộp đôi chỉ ghi 1 sự kiện học');
      eq(st.score, 0, tag + ': sai không có điểm');
      ok(st.check.disabled, tag + ': sau khi sai, chưa đổi gì thì chưa nộp lại được');
      eq(await p.evaluate(() => [...document.querySelectorAll('.od-line .od-chip')].map(c => c.className.includes('wrong'))), [false, false, true, false, false, true], tag + ': luyện tập tô thẻ sai');
      ok(await p.isHidden('.od-solution'), tag + ': lần sai đầu chưa lộ câu đúng');
      const det = await p.evaluate(() => Quiz.sessionDetails[Quiz.sessionDetails.length - 1]);
      eq([det.questionType, det.responseVersion, det.selectedAnswer, det.correctAnswer, det.isCorrect], ['order', 1, 'Put the bin in the trash.', 'Put the trash in the bin.', false], tag + ': chi tiết phiên');
      eq(det.response, { tokenIds: ['t0', 't1', 't5', 't3', 't4', 't2'] }, tag + ': lưu tokenIds');
      // sửa: Làm lại rồi xếp đúng, hai thẻ "the" đổi chỗ
      await p.click('.od-reset');
      await tap(['t0', 't4', 't2', 't3', 't1', 't5']);
      await p.click('#btnCheck');
      st = await state();
      eq([st.score, st.stars, st.details - before.details, st.ev - before.ev], [0, 0, 1, 1], tag + ': sửa đúng cùng lượt: không thưởng, không ghi thêm');
      ok(st.next && st.check.hidden, tag + ': xong câu → hiện Câu tiếp theo');
      ok(await p.isVisible('.od-solution'), tag + ': chữa bài hiện câu đúng');
      // _retry: chỉ củng cố, không ghi kết quả học / thưởng
      const r0 = await state();
      await p.evaluate(() => { const q = Quiz.questions[Quiz.curIdx]; Quiz.questions.push({ ...q, _retry: true }); Quiz.curIdx = Quiz.questions.length - 1; Quiz.render(); });
      await tap(['t0', 't1', 't2', 't3', 't4', 't5']); await p.click('#btnCheck');
      st = await state();
      eq([st.score, st.stars, st.details, st.ev], [r0.score, r0.stars, r0.details, r0.ev], tag + ': _retry không ghi gì');
      ok(await p.evaluate(() => Quiz.questions[Quiz.curIdx]._fixed === true), tag + ': _retry đúng lần đầu → đã sửa');
      // lịch sử câu sai giữ câu trả lời sai
      const wh = await p.evaluate(id => Storage.getWrongHistory()[id], OD_THE);
      eq(wh.lastWrongResponse && wh.lastWrongResponse.text, 'Put the bin in the trash.', tag + ': lastWrongResponse');
      // ── Ôn câu sai: dựng lại đúng dạng theo ID, sau khi nộp hiện câu trả lời lần trước ──
      await p.evaluate(() => Quiz.startWrongReview(10));
      const qid = await p.evaluate(() => Quiz.questions[Quiz.curIdx].id);
      eq(qid, OD_THE, tag + ': ôn sai lấy đúng câu order');
      ok(await p.isVisible('#qtHost .od-line'), tag + ': ôn sai dựng lại dạng sắp xếp');
      await tap(['t0', 't1', 't2', 't3', 't4', 't5']); await p.click('#btnCheck');
      ok((await p.textContent('#fbAns')).includes('Lần trước con trả lời: Put the bin in the trash.'), tag + ': hiện câu trả lời lần trước');
      eq(await p.evaluate(() => Storage.getUnresolvedWrong().length), 0, tag + ': làm đúng trong ôn sai → đã sửa');

      // ── 3. Chế độ kiểm tra: không tô từng phần, không lộ câu đúng, 1 lần nộp ──
      await openQ('en_thu-dang-moi_q006', 'test');
      await tap(['t1', 't0', 't2', 't3']); await p.click('#btnCheck');
      st = await state();
      eq(await p.evaluate(() => document.querySelectorAll('.od-chip.wrong, .od-chip.correct').length), 0, tag + ': test không tô thẻ');
      ok(await p.isHidden('.od-solution'), tag + ': test không hiện câu đúng');
      ok(st.next && st.check.hidden, tag + ': test nộp 1 lần');
      eq(await p.evaluate(() => Quiz.submit().ok), false, tag + ': test không nộp lại được');

      // ── 4. Chuyển câu khi đang thao tác: callback cũ không ảnh hưởng câu mới ──
      await openQ('en_thu-dang-moi_q008');
      await tap(['t0', 't1']);
      await p.evaluate(() => { window.__oldChip = document.querySelector('.od-pool .od-chip'); });
      await openQ(OD_THE);
      await p.evaluate(() => window.__oldChip.click());
      eq(await p.evaluate(() => document.querySelectorAll('.od-line .od-chip').length), 0, tag + ': thẻ của câu cũ không đặt vào câu mới');
      ok((await state()).check.disabled, tag + ': câu mới bắt đầu sạch');
      eq(await p.evaluate(() => Quiz._qtState.qid), OD_THE, tag + ': trạng thái thuộc câu mới');

      // ── 5. Nghe chọn tranh: không lộ lời nghe/nhãn trước khi chấm ──
      await p.evaluate(() => { window.__spoken = []; });
      await openQ(LP);
      await p.waitForTimeout(500);
      const lpInfo = await p.evaluate(() => {
        const q = Quiz.questions[Quiz.curIdx];
        const vis = document.getElementById('screenQuiz').innerText;
        return { audio: q.audio.text, choices: q.choices, a: q.a, vis,
          alts: [...document.querySelectorAll('.lp-tile img')].map(i => i.alt + '|' + (i.closest('button').getAttribute('aria-label') || '')),
          speakHidden: (() => { const s = document.getElementById('btnSpeak'); return !s || s.classList.contains('hidden'); })() };
      });
      ok(!lpInfo.vis.includes(lpInfo.audio), tag + ': lời nghe không hiện trước khi trả lời');
      ok(lpInfo.choices.every(c => !lpInfo.vis.includes(c)), tag + ': nhãn tranh không hiện');
      ok(lpInfo.alts.every(a => lpInfo.choices.every(c => !a.includes(c))), tag + ': alt/aria không lộ nhãn');
      ok(lpInfo.speakHidden, tag + ': ẩn nút 🔊 chung (không đọc lựa chọn)');
      let spoken = await p.evaluate(() => window.__spoken);
      eq(spoken.map(s => s.text), [lpInfo.audio], tag + ': tự đọc đúng 1 lần lời nghe');
      ok(Math.abs(spoken[0].rate - 0.85) < 1e-6, tag + ': tốc độ vừa');
      await p.click('.lp-slow'); await p.waitForTimeout(50);
      spoken = await p.evaluate(() => window.__spoken);
      ok(Math.abs(spoken[spoken.length - 1].rate - 0.6) < 1e-6, tag + ': nghe chậm');
      ok(spoken.every(s => s.text === lpInfo.audio), tag + ': chỉ đọc lời nghe, không đọc lựa chọn');
      ok(await noHScroll(), tag + ': listen-pick không tràn ngang');
      const tileW = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.lp-tile')].map(t => t.getBoundingClientRect().width)));
      ok(tileW >= 120, tag + ': ô tranh đủ lớn (' + tileW + 'px)');
      ok((await state()).check.disabled, tag + ': chưa chọn tranh → khoá Kiểm tra');
      const wrongIdx = (lpInfo.a + 1) % lpInfo.choices.length;
      const s0 = await state();
      await p.click(`.lp-tile[data-idx="${wrongIdx}"]`); await p.click('#btnCheck');
      ok(!(await p.evaluate(() => document.getElementById('screenQuiz').innerText)).includes(lpInfo.audio), tag + ': sai lần đầu vẫn chưa lộ lời nghe');
      await p.click(`.lp-tile[data-idx="${lpInfo.a}"]`); await p.click('#btnCheck');
      st = await state();
      eq([st.score - s0.score, st.details - s0.details], [0, 1], tag + ': listen-pick sửa đúng không thưởng, ghi 1 lần');
      ok(await p.isVisible('.lp-transcript'), tag + ': chữa bài hiện lời nghe');
      eq(await p.evaluate(() => [...document.querySelectorAll('.lp-label')].every(l => !l.hidden)), true, tag + ': chữa bài hiện nhãn');
      const ld = await p.evaluate(() => Quiz.sessionDetails[Quiz.sessionDetails.length - 1]);
      eq([ld.questionType, ld.selectedIndex, ld.correctIndex, ld.selectedAnswer], ['listen-pick', wrongIdx, lpInfo.a, lpInfo.choices[wrongIdx]], tag + ': chi tiết listen-pick');
      ok(ld.question.includes(lpInfo.audio), tag + ': báo cáo phụ huynh thấy lời nghe');
      if (SHOT) await p.screenshot({ path: SHOT + '/qt-listen-' + tag + '.png', fullPage: true });
      // đúng ngay lần đầu → 1 sao
      await openQ('en_thu-dang-moi_q003');
      const s1 = await state();
      const a3 = await p.evaluate(() => Quiz.questions[Quiz.curIdx].a);
      await p.click(`.lp-tile[data-idx="${a3}"]`);
      await p.dblclick('#btnCheck');
      st = await state();
      eq([st.score - s1.score, st.stars - s1.stars, st.details - s1.details], [1, 1, 1], tag + ': đúng lần đầu đúng 1 sao (kể cả bấm đôi)');

      // ── 6. Cổng ảnh lựa chọn ──
      eq(await p.evaluate(id => {
        const q = App.allData.subjects.find(x => x.id === 'tieng-anh').topics.find(t => t.id === 'en_thu-dang-moi').questions.find(x => x.id === id);
        const c = JSON.parse(JSON.stringify(q)); c.choiceImageReview.status = 'pending';
        return [App.questionReady(q), App.questionReady(c)];
      }, LP), [true, false], tag + ': ảnh lựa chọn chờ duyệt bị chặn');

      // ── 7. Trắc nghiệm cũ giữ hành vi ──
      await p.evaluate(() => {
        const s = App.allData.subjects.find(x => x.id === 'tieng-anh');
        const t = s.topics.find(x => x.id === 'en_nik3-unit3');
        Quiz.start(t, s.name, { subjectId: s.id, allowed: [0] });
      });
      ok(await p.isVisible('#ansGrid .ans-btn') && await p.isHidden('#qtHost') && await p.isHidden('#qtBar'), tag + ': mcq dùng lưới cũ, ẩn khu dạng mới');
      const m0 = await state();
      const mq = await p.evaluate(() => { const q = Quiz.questions[Quiz.curIdx]; return { right: q.choices[q.a], wrong: q.choices[(q.a + 1) % 4] }; });
      await p.click(`#ansGrid .ans-btn:text-is("${mq.wrong}")`);
      await p.click(`#ansGrid .ans-btn:text-is("${mq.right}")`);
      st = await state();
      eq([st.score - m0.score, st.details - m0.details, st.ev - m0.ev], [0, 1, 1], tag + ': mcq sai rồi đúng: không điểm, ghi 1 lần');
      const md = await p.evaluate(() => Quiz.sessionDetails[Quiz.sessionDetails.length - 1]);
      eq([md.questionType, md.selectedAnswer, md.correctAnswer, typeof md.selectedIndex, typeof md.correctIndex], ['mcq', mq.wrong, mq.right, 'number', 'number'], tag + ': mcq giữ trường cũ');
      const lastEv = await p.evaluate(() => { const e = LearningEngine.loadLearningState().analytics.events; return e[e.length - 1]; });
      eq([lastEv.type, lastEv.questionType, Number.isInteger(lastEv.selectedIndex)], ['answer', 'mcq', true], tag + ': sự kiện mcq như cũ');

      // ── 8. Kết thúc lượt trong chế độ thử: không ghi Apps Script ──
      await p.evaluate(() => Quiz._finish());
      await p.waitForTimeout(400);
      eq(gas.filter(x => x.startsWith('POST')), [], tag + ': chế độ thử không POST lên Apps Script');
      eq(errs, [], tag + ': không lỗi JS');
      await ctx.close();
    }

    // ── 9. Không có ?pilot → chủ đề thử không nạp ──
    const ctx2 = await b.newContext({ viewport: { width: 390, height: 844 } });
    await ctx2.route('https://script.google.com/**', r => r.fulfill({ contentType: 'application/json', body: '[]' }));
    const p2 = await ctx2.newPage();
    await p2.goto(URL.replace('?pilot=1', '')); await p2.waitForTimeout(700);
    await p2.fill('#nameInput', 'Thử nghiệm'); await p2.click('#btnStart');
    await p2.waitForFunction(() => window.App && App.allData && App.allData.subjects && App.allData.subjects.length);
    const t2 = await p2.evaluate(() => App.allData.subjects.find(x => x.id === 'tieng-anh').topics.map(t => t.id));
    ok(!t2.includes('en_thu-dang-moi'), 'không pilot: chủ đề thử bị ẩn');
    ok(await p2.isHidden('#pilotBanner'), 'không pilot: không có dải báo');
    await ctx2.close();
    console.log('qtypes e2e OK —', checks, 'kiểm tra');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
