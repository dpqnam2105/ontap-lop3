// Dạng bài mới — Đợt 0 (registry, order, listen-pick, lưu response, lỗi câu sai cùng ngày, LearningEngine, cloud round-trip).
// Chạy: node tests/qtypes.test.js   (không cần trình duyệt; luồng nộp bài trên giao diện ở tests/qtypes.e2e.js)
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const REPO = path.join(__dirname, '..');

function makeLS(m) {
  return { get length() { return m.size; }, key: i => [...m.keys()][i] ?? null,
    getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
}
function boot(files, store) {
  const ctx = { console, JSON, Date, Math, Object, String, Number, Array, Set, Map, WeakMap, Error, setTimeout, clearTimeout, Promise, encodeURIComponent };
  ctx.window = ctx; ctx.globalThis = ctx;
  ctx.localStorage = makeLS(store || new Map());
  ctx.document = { addEventListener() {}, getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; } };
  ctx.navigator = {}; ctx.addEventListener = () => {};
  vm.createContext(ctx);
  for (const f of files) vm.runInContext(fs.readFileSync(path.join(REPO, 'js', f), 'utf8'), ctx);
  return ctx;
}
const QFILES = ['qtypes/registry.js', 'qtypes/listen-pick.js', 'qtypes/order.js'];
const pilot = JSON.parse(fs.readFileSync(path.join(REPO, 'data-lop3/tieng-anh/thu-dang-moi.json'), 'utf8')).topic.questions;
const byId = id => JSON.parse(JSON.stringify(pilot.find(q => q.id === id)));
const ORDER_THE = 'en_thu-dang-moi_q007';   // Put the trash in the bin (2 thẻ "the")
const ORDER_TWO = 'en_thu-dang-moi_q008';   // I need a flashlight and a compass (2 thứ tự đúng)
const ORDER_Q = 'en_thu-dang-moi_q009';     // Is there a blanket in the tent?
const LP = 'en_thu-dang-moi_q001';

const tests = {
  'registry: câu cũ không có type = mcq, ready; type lạ / sai schema bị chặn an toàn'() {
    const c = boot(QFILES); const Q = c.QTypes;
    const mcq = { q: 'x', choices: ['a', 'b', 'c', 'd'], a: 2 };
    assert.strictEqual(Q.typeOf(mcq), 'mcq');
    assert.ok(Q.isMcq(mcq) && Q.ready(mcq));
    assert.ok(Q.get('mcq').legacy, 'mcq đi đường render/chấm cũ');
    assert.strictEqual(Q.ready({ type: 'drag-map', q: 'x' }), false, 'type chưa hỗ trợ');
    assert.strictEqual(Q.ready({ q: 'x', choices: ['a'], a: 0 }), false, 'mcq hỏng');
    assert.strictEqual(Q.ready({ type: 'order', q: 'x', tokens: [{ id: 't0', text: 'a' }], end: '.', answers: ['a'] }), false, 'order quá ít thẻ');
    assert.strictEqual(Q.ready(null), false);
    // toàn bộ 1294 câu cũ vẫn ready (không đổi gì với dữ liệu cũ)
    let n = 0, bad = [];
    const walk = x => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === 'object') { if ('choices' in x && 'q' in x && !x.type) { n++; if (!Q.ready(x)) bad.push(x.id); } else Object.values(x).forEach(walk); } };
    const dir = path.join(REPO, 'data-lop3');
    const files = []; const ls = d => fs.readdirSync(d, { withFileTypes: true }).forEach(e => e.isDirectory() ? ls(path.join(d, e.name)) : e.name.endsWith('.json') && files.push(path.join(d, e.name)));
    ls(dir); files.forEach(f => { try { walk(JSON.parse(fs.readFileSync(f, 'utf8'))); } catch (e) { /* file không phải JSON câu */ } });
    assert.ok(n >= 1294, 'đếm được ' + n);
    assert.deepStrictEqual(bad, []);
  },

  'listen-pick: ảnh lựa chọn phải qua cổng duyệt; câu thử đều hợp lệ'() {
    const c = boot(QFILES); const Q = c.QTypes;
    const q = byId(LP);
    assert.ok(Q.ready(q));
    const p1 = byId(LP); p1.choiceImageReview.status = 'pending';
    assert.strictEqual(Q.ready(p1), false, 'ảnh chờ duyệt → không dùng');
    const p2 = byId(LP); delete p2.choiceImageReview;
    assert.strictEqual(Q.ready(p2), false, 'thiếu choiceImageReview → không dùng');
    const p3 = byId(LP); p3.choiceImages.pop();
    assert.strictEqual(Q.ready(p3), false, 'thiếu ảnh');
    const T = Q.get('listen-pick');
    assert.strictEqual(T.readAloud, false, 'nút 🔊 chung không đọc lựa chọn');
    assert.deepStrictEqual(T.validateResponse(q, {}).ok, false);
    assert.deepStrictEqual(T.grade(q, { selectedIndex: q.a }).correct, true);
    assert.deepStrictEqual(T.grade(q, { selectedIndex: (q.a + 1) % 4 }).correct, false);
    assert.strictEqual(T.describeResponse(q, { selectedIndex: q.a }), q.choices[q.a]);
    pilot.forEach(x => assert.ok(Q.ready(x), x.id + ' không ready: ' + Q.validate(x).join('; ')));
  },

  'order: từ lặp — hai thẻ "the" đổi chỗ vẫn đúng; lưu theo ID'() {
    const c = boot(QFILES); const T = c.QTypes.get('order');
    const q = byId(ORDER_THE);
    const ids = q.tokens.map(t => t.id);                 // t0 Put, t1 the, t2 trash, t3 in, t4 the, t5 bin
    assert.ok(T.grade(q, { tokenIds: ids }).correct);
    const swapped = ['t0', 't4', 't2', 't3', 't1', 't5'];
    assert.ok(T.validateResponse(q, { tokenIds: swapped }).ok);
    assert.ok(T.grade(q, { tokenIds: swapped }).correct, 'chấm theo chữ, không theo ID thẻ');
    const wrong = ['t0', 't1', 't5', 't3', 't4', 't2'];
    const g = T.grade(q, { tokenIds: wrong });
    assert.strictEqual(g.correct, false);
    assert.deepStrictEqual(g.parts, [true, true, false, true, true, false]);
    assert.strictEqual(T.describeResponse(q, { tokenIds: wrong }), 'Put the bin in the trash.');
  },

  'order: thiếu thẻ / trùng thẻ / thẻ lạ → không hợp lệ (không chấm, không tính sai)'() {
    const c = boot(QFILES); const T0 = c.QTypes.get('order');
    const T = { validateResponse: (q, r) => JSON.parse(JSON.stringify(T0.validateResponse(q, r))) };
    const q = byId(ORDER_THE);
    assert.deepStrictEqual(T.validateResponse(q, { tokenIds: ['t0', 't1', 't2'] }), { ok: false, reason: 'incomplete' });
    assert.deepStrictEqual(T.validateResponse(q, { tokenIds: ['t0', 't1', 't1', 't3', 't4', 't5'] }), { ok: false, reason: 'duplicate' });
    assert.deepStrictEqual(T.validateResponse(q, { tokenIds: ['t0', 't1', 't2', 't3', 't4', 'x9'] }), { ok: false, reason: 'unknown' });
    assert.deepStrictEqual(T.validateResponse(q, null), { ok: false, reason: 'missing' });
  },

  'order: nhiều thứ tự hợp lệ; dấu câu cố định; hoa/thường và nháy cong'() {
    const c = boot(QFILES); const Q = c.QTypes; const T = Q.get('order');
    const q = byId(ORDER_TWO);                          // I | need | a flashlight | and | a compass
    assert.ok(T.grade(q, { tokenIds: ['t0', 't1', 't2', 't3', 't4'] }).correct);
    assert.ok(T.grade(q, { tokenIds: ['t0', 't1', 't4', 't3', 't2'] }).correct, 'đổi chỗ hai đồ vật vẫn đúng');
    assert.strictEqual(T.grade(q, { tokenIds: ['t1', 't0', 't2', 't3', 't4'] }).correct, false);
    const qq = byId(ORDER_Q);                           // Is | there | a blanket | in | the tent ?
    assert.strictEqual(T.grade(qq, { tokenIds: ['t1', 't0', 't2', 't3', 't4'] }).correct, false, '"there Is…" không phải câu hỏi');
    assert.strictEqual(T.describeAnswer(qq), 'Is there a blanket in the tent?');
    // dấu kết thúc không được nằm trong thẻ / đáp án
    const bad = byId(ORDER_Q); bad.tokens[4].text = 'the tent?';
    assert.ok(Q.validate(bad).some(m => /dấu kết thúc/.test(m)));
    const bad2 = byId(ORDER_Q); bad2.answers = ['Is there a blanket in the tent?'];
    assert.ok(Q.validate(bad2).length);
    const bad3 = byId(ORDER_Q); bad3.answers = ['Is there a tent in the blanket box'];
    assert.ok(Q.validate(bad3).some(m => /không ghép đúng/.test(m)));
    // Don’t (nháy cong) = Don't; không phân biệt hoa thường
    const d = byId('en_thu-dang-moi_q006'); d.tokens[0].text = 'don’t';
    assert.ok(T.grade(d, { tokenIds: ['t0', 't1', 't2', 't3'] }).correct);
  },

  'Storage: đúng rồi SAI LẠI trong cùng ngày vẫn là câu chưa sửa (lỗi cũ so theo ngày)'() {
    const c = boot(['storage.js']);
    vm.runInContext(`Storage.switchPlayer('Thử');
      Storage.recordAnswer({ questionId: 'qA', isCorrect: false, subjectId: 's', topicId: 't', question: 'A', now: 1000 });
      Storage.recordAnswer({ questionId: 'qA', isCorrect: true, now: 2000 });
      Storage.recordAnswer({ questionId: 'qA', isCorrect: false, now: 3000 });`, c);
    const ids = JSON.parse(vm.runInContext('JSON.stringify(Storage.getUnresolvedWrong().map(x => x.questionId))', c));
    assert.deepStrictEqual(ids, ['qA']);
    vm.runInContext(`Storage.recordAnswer({ questionId: 'qA', isCorrect: true, now: 4000 })`, c);
    assert.strictEqual(vm.runInContext('Storage.getUnresolvedWrong().length', c), 0);
  },

  'Storage: dữ liệu cũ chỉ có ngày vẫn đọc đúng; trộn cũ + mới'() {
    const c = boot(['storage.js']);
    const U = v => vm.runInContext('Storage.isWrongUnresolved(' + JSON.stringify(v) + ')', c);
    assert.strictEqual(U({ lastWrong: '2026-10-01', lastCorrect: null }), true);
    assert.strictEqual(U({ lastWrong: '2026-10-01', lastCorrect: '2026-10-02' }), false);
    assert.strictEqual(U({ lastWrong: '2026-10-02', lastCorrect: '2026-10-01' }), true);
    assert.strictEqual(U({ lastWrong: '2026-10-02', lastCorrect: '2026-10-02' }), false, 'giữ nguyên cách hiểu cũ khi chỉ có ngày');
    assert.strictEqual(U({ lastWrong: '2026-10-02', lastCorrect: '2026-10-02', lastWrongAt: 5 }), true, 'sai mới (có mốc) sau đúng cũ');
    assert.strictEqual(U({ lastWrong: '2026-10-02', lastCorrect: '2026-10-02', lastCorrectAt: 5 }), false, 'đúng mới (có mốc) sau sai cũ');
    assert.strictEqual(U({ lastWrong: null, lastCorrect: '2026-10-02' }), false);
    assert.strictEqual(U({}), false);
  },

  'Storage: lưu lastWrongResponse; lần đúng sau không ghi đè; câu cũ không có response vẫn ghi bình thường'() {
    const c = boot(['storage.js', ...QFILES]);
    c.Q = byId(ORDER_THE);
    vm.runInContext(`Storage.switchPlayer('Thử');
      Storage.recordAnswer({ questionId: Q.id, isCorrect: false, question: Q.q, response: QTypes.pack(Q, { tokenIds: ['t0','t1','t5','t3','t4','t2'] }), now: 10 });
      Storage.recordAnswer({ questionId: Q.id, isCorrect: true, response: QTypes.pack(Q, { tokenIds: ['t0','t1','t2','t3','t4','t5'] }), now: 20 });
      Storage.recordAnswer({ questionId: 'old_q', isCorrect: false, question: 'cũ', now: 30 });`, c);
    const h = JSON.parse(vm.runInContext('JSON.stringify(Storage.getWrongHistory())', c));
    const r = h[c.Q.id].lastWrongResponse;
    assert.strictEqual(r.questionType, 'order');
    assert.strictEqual(r.responseVersion, 1);
    assert.deepStrictEqual(r.response, { tokenIds: ['t0', 't1', 't5', 't3', 't4', 't2'] });
    assert.strictEqual(r.text, 'Put the bin in the trash.');
    assert.ok(!('lastWrongResponse' in h.old_q));
    assert.strictEqual(h.old_q.wrongCount, 1);
    assert.deepStrictEqual(Object.keys(r).sort(), ['at', 'questionType', 'response', 'responseVersion', 'text'], 'chỉ lưu câu trả lời gọn, không DOM/toạ độ');
  },

  'LearningEngine: dạng mới đưa kết quả đã chấm, không gắn invalid-answer; mcq cũ giữ nguyên'() {
    const c = boot(['learning-engine.js']);
    const run = code => JSON.parse(vm.runInContext('JSON.stringify(' + code + ')', c));
    const q = { id: 'o1', topicId: 't', difficulty: 1, type: 'order', tokens: [] };
    const r1 = run(`LearningEngine.recordAnswer({ learnerId: 'x', question: ${JSON.stringify(q)}, graded: { correct: true, valid: true }, questionType: 'order', startedAt: Date.now() - 5000 })`);
    assert.strictEqual(r1.correct, true);
    assert.ok(!r1.cheat.reasons.includes('invalid-answer'));
    const r2 = run(`LearningEngine.recordAnswer({ learnerId: 'x', question: ${JSON.stringify(q)}, graded: { correct: false, valid: true }, questionType: 'order', startedAt: Date.now() - 5000 })`);
    assert.strictEqual(r2.correct, false);
    assert.ok(!r2.cheat.reasons.includes('invalid-answer'), 'sai nhưng hợp lệ ≠ không hợp lệ');
    const r3 = run(`LearningEngine.recordAnswer({ learnerId: 'x', question: ${JSON.stringify(q)}, graded: { correct: false, valid: false }, questionType: 'order', startedAt: Date.now() - 5000 })`);
    assert.ok(r3.cheat.reasons.includes('invalid-answer'));
    const m = { id: 'm1', topicId: 't', difficulty: 1, choices: ['a', 'b'], a: 1 };
    const r4 = run(`LearningEngine.recordAnswer({ learnerId: 'x', question: ${JSON.stringify(m)}, selectedIndex: 1, startedAt: Date.now() - 5000 })`);
    assert.strictEqual(r4.correct, true);
    const r5 = run(`LearningEngine.recordAnswer({ learnerId: 'x', question: ${JSON.stringify(m)}, selectedIndex: -1, startedAt: Date.now() - 5000 })`);
    assert.ok(r5.cheat.reasons.includes('invalid-answer'), 'mcq: selectedIndex hỏng vẫn bị gắn như cũ');
    const ev = run(`LearningEngine.loadLearningState().analytics.events`);
    assert.strictEqual(ev[0].type, 'answer', 'type của sự kiện vẫn là answer');
    assert.strictEqual(ev[0].questionType, 'order');
    assert.ok(!('selectedIndex' in ev[0]), 'dạng mới không có selectedIndex giả');
    assert.strictEqual(ev[3].questionType, 'mcq');
    assert.strictEqual(ev[3].selectedIndex, 1);
  },

  'Cloud: wrongHistory kèm lastWrongResponse + mốc thời gian đi qua sao lưu và khôi phục nguyên vẹn'() {
    const A = boot(['storage.js', 'cloud.js', ...QFILES]);
    A.Q = byId(LP);
    vm.runInContext(`Storage.switchPlayer('Thử');
      Storage.recordAnswer({ questionId: Q.id, isCorrect: false, question: Q.q, response: QTypes.pack(Q, { selectedIndex: (Q.a + 1) % 4 }), now: 111 });`, A);
    const snap = vm.runInContext('JSON.stringify(Cloud.collect("Thử"))', A);
    const B = boot(['storage.js', 'cloud.js']);
    vm.runInContext('Storage.switchPlayer("Thử"); Cloud.apply(' + snap + ', "Thử")', B);
    const h = JSON.parse(vm.runInContext('JSON.stringify(Storage.getWrongHistory())', B));
    const e = h[A.Q.id];
    assert.ok(e, 'có lịch sử sau khôi phục');
    assert.strictEqual(e.lastWrongAt, 111);
    assert.strictEqual(e.lastWrongResponse.questionType, 'listen-pick');
    assert.strictEqual(e.lastWrongResponse.text, A.Q.choices[(A.Q.a + 1) % 4]);
    assert.strictEqual(vm.runInContext('Storage.getUnresolvedWrong().length', B), 1);
  },

  'Speak: listen-pick không đọc lời nghe/lựa chọn qua nút chung; order chỉ đọc đề'() {
    const c = boot(['speak.js', ...QFILES]);
    c.Speak._q = byId(LP);
    assert.deepStrictEqual(JSON.parse(JSON.stringify(c.Speak._parts())), []);
    c.Speak._q = byId(ORDER_THE);
    const parts = JSON.parse(JSON.stringify(c.Speak._parts()));
    assert.strictEqual(parts.length, 1);
    assert.strictEqual(parts[0].text, 'Put the words in order.');
  },

  'Ôn câu sai: dự phòng tìm theo chữ đề chỉ áp cho trắc nghiệm (dạng mới trùng đề → chỉ theo id)'() {
    const src = fs.readFileSync(path.join(REPO, 'js/quiz.js'), 'utf8');
    assert.ok(/findIndex\(q => !q\.type && \(q\.q \|\| ''\) === it\.question\)/.test(src));
  },

  'Pet: thử thách nhận cún chỉ lấy câu trắc nghiệm'() {
    const src = fs.readFileSync(path.join(REPO, 'js/pet.js'), 'utf8');
    assert.ok(/QTypes\.isMcq\(q\)/.test(src));
  }
};

let fail = 0;
for (const [name, fn] of Object.entries(tests)) {
  try { fn(); console.log('✔', name); } catch (e) { fail++; console.log('✘', name, '\n   ', e.message); }
}
if (fail) { console.log(fail + ' test lỗi'); process.exit(1); }
console.log('Tất cả đạt');
