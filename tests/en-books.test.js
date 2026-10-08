// Chia Tiếng Anh theo giáo trình: phạm vi Ms Hoa theo bài, câu đủ điều kiện Ôn tổng hợp, chia hạn mức đề trộn tuần.
// Điểm khởi chạy thật (luyện, kế hoạch hôm nay, thử thách cún, thẻ Ôn tổng hợp) kiểm trên trình duyệt: tests/en-books.e2e.js
// Chạy: node tests/en-books.test.js   (dùng dữ liệu thật trong data-lop3, nạp qua API như trên web)
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const REPO = path.join(__dirname, '..');

async function boot(store) {
  const m = store || new Map();
  const ctx = { console, JSON, Date, Math, Object, String, Number, Array, Set, Map, Error, Promise, setTimeout, clearTimeout, structuredClone };
  ctx.window = ctx;
  ctx.localStorage = { get length() { return m.size; }, key: i => [...m.keys()][i] ?? null,
    getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
  ctx.document = { addEventListener() {}, getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; } };
  // fetch giả: đọc file trong repo (đường dẫn tương đối như trên web)
  ctx.fetch = async u => { const f = path.join(REPO, String(u).split('?')[0]);
    return fs.existsSync(f) ? { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(f, 'utf8')) } : { ok: false, status: 404 }; };
  vm.createContext(ctx);
  for (const f of ['storage', 'api', 'today', 'pet-room', 'pet-accessories', 'pet', 'app']) vm.runInContext(fs.readFileSync(path.join(REPO, 'js', f + '.js'), 'utf8'), ctx);
  vm.runInContext(`Storage.switchPlayer('Thỏ'); App.playerName = 'Thỏ'; App.currentGrade = 'lop3';`, ctx);
  await vm.runInContext(`API.getAllData('lop3').then(d => { App.allData = d; })`, ctx);
  const run = code => vm.runInContext(code, ctx);
  return { ctx, m, run, J: code => JSON.parse(run('JSON.stringify(' + code + ')')) };
}
const S = `App.allData.subjects.find(x => x.id === 'tieng-anh')`;
const MS = `${S}.topics.find(t => t.id === 'en_mshoa-e2-u6')`;
const setLesson = (b, n) => b.run(`App.setBookScope(${S}, { lesson: { 'mshoa-explorer2': { unit: 6, lesson: ${n} } } })`);

const ROUND = 'claude-ra-101-20261009';
const confirm = b => b.run(`${S}.reviewRounds['${ROUND}'].confirmed = true`);
const mixOnly = (b, ids) => b.run(`App.setBookScope(${S}, { mix: { ${['nik3', 'mshoa-explorer2', 'gs3', 'nen'].map(id => `'${id}': ${ids.includes(id)}`).join(', ')} } })`);
// Môn giả để kiểm hạn mức: sách A có đúng 6 câu hợp lệ (+ 4 câu ngoài giai đoạn), sách B có 30 câu hợp lệ (+ 5 câu chưa rà).
const FAKE = `(() => {
  const mk = (tid, n, extra) => ({ id: tid, name: tid, book: tid.slice(0, 1), questions: Array.from({ length: n }, (_, i) => ({
    id: tid + '_q' + i, q: 'Q' + i, choices: ['a', 'b', 'c', 'd'], a: 0, stage: 1, ref: { contentReview: 'x' }, ...(extra ? extra(i) : {}) })) });
  return { id: 'fake', name: 'Fake', stages: [{ id: 1 }, { id: 2 }], defaultStage: 1,
    books: [{ id: 'A', name: 'A', mixDefault: true }, { id: 'B', name: 'B', mixDefault: true, fallback: true }],
    topics: [mk('A1', 10, i => (i >= 6 ? { stage: 2 } : {})), mk('B1', 20), mk('B2', 15, i => (i >= 10 ? { ref: undefined } : {}))] };
})()`;

const tests = {
  async 'nạp index: sách, book của chủ đề, lượt rà 101 câu (chưa xác nhận)'() {
    const b = await boot();
    assert.deepStrictEqual(b.J(`${S}.books.map(x => x.id)`), ['nik3', 'mshoa-explorer2', 'gs3', 'nen']);
    assert.strictEqual(b.J(`${MS}.book`), 'mshoa-explorer2');
    assert.strictEqual(b.J(`${S}.topics.filter(t => !t.book).length`), 0);
    assert.strictEqual(b.J(`${S}.reviewRounds['${ROUND}'].confirmed`), false);
    assert.strictEqual(b.J(`App.getBookScope(App.allData.subjects.find(x => x.id === 'toan'))`), null);
  },
  async 'Ms Hoa mặc định U6 L2: đủ 23 câu; chọn L1: 12 câu, không có câu L2 / đoạn E'() {
    const b = await boot();
    assert.strictEqual(b.J(`App._allowedIndices(${S}, ${MS}).length`), 23);
    setLesson(b, 1);
    const qs = b.J(`App._allowedIndices(${S}, ${MS}).map(i => ${MS}.questions[i])`);
    assert.strictEqual(qs.length, 12);
    assert.ok(qs.every(q => q.bookLesson.lesson === 1 && !q.passage));
  },
  async 'mốc Ms Hoa không đổi thiết lập NIK, giai đoạn NIK không lọc Ms Hoa'() {
    const b = await boot();
    setLesson(b, 1);
    assert.strictEqual(b.run(`Storage.get('stageBySubject') === undefined`), true);
    b.run(`App.setStageSetting(${S}, 2, true)`);
    assert.strictEqual(b.J(`App._allowedIndices(${S}, ${MS}).length`), 12);
    const vis = b.J(`App._visibleTopics(${S}).map(t => t.id)`);
    assert.ok(vis.includes('en_nik3-unit3') && vis.includes('en_mshoa-e2-u6') && !vis.includes('en_nik3-unit1'));
  },
  async 'câu vào Ôn tổng hợp xét từng câu: lô đã duyệt luôn vào; 101 câu cũ chỉ vào khi lượt rà được xác nhận; pending và câu chưa rà không bao giờ vào'() {
    const b = await boot();
    const elig = () => b.J(`${S}.topics.flatMap(t => t.questions.filter(q => App._mixEligible(${S}, q)).map(q => q.id))`);
    const e1 = new Set(elig());
    assert.strictEqual(e1.size, 34 + 23 + 23); // lô 1, lô 2 (U3), Ms Hoa
    assert.ok(![...e1].some(id => /_q0(0\d|1\d|2[0-2])$/.test(id) && /nik3-unit[12]_/.test(id)));
    confirm(b);
    const e2 = new Set(elig());
    assert.strictEqual(e2.size, 80 + 98); // + 87 ok + 11 fixed
    for (const id of ['en_nik3-unit2_q003', 'en_adj-adv_q001', 'en_adj-adv_q014']) assert.ok(!e2.has(id), id);
    assert.ok(b.J(`${S}.topics.flatMap(t => t.questions).filter(q => q.source === 'claude-audit-20260924')`).every(q => !e2.has(q.id)));
  },
  async 'Ôn tổng hợp mặc định (GĐ1, lượt rà chưa xác nhận): NIK 10 + Ms Hoa 10, Nền không có câu hợp lệ nên không vào'() {
    const b = await boot();
    const mix = b.J(`App._buildWeeklyMix(${S})`);
    assert.strictEqual(mix.pool.length, 20);
    assert.strictEqual(new Set(mix.pool.map(q => q.id)).size, 20);
    assert.ok(mix.pool.every(q => b.J(`App._mixEligible(${S}, ${JSON.stringify(q)})`)));
    assert.deepStrictEqual(Object.fromEntries(mix.sources.map(x => [x.id, x.n])), { nik3: 10, 'mshoa-explorer2': 10 });
    assert.ok(mix.pool.filter(q => q.passage).every(q => /^Read: "/.test(q.q)));
  },
  async 'Ôn tổng hợp sau khi xác nhận lượt rà: NIK / Ms Hoa / Nền 7-7-6, GS3 vẫn tắt, không có câu pending'() {
    const b = await boot();
    confirm(b);
    const mix = b.J(`App._buildWeeklyMix(${S})`);
    assert.deepStrictEqual(mix.sources.map(x => x.n).sort(), [6, 7, 7]);
    assert.ok(!mix.sources.some(x => x.id === 'gs3'));
    assert.ok(!mix.pool.some(q => ['en_nik3-unit2_q003', 'en_adj-adv_q001', 'en_adj-adv_q014'].includes(q.id)));
  },
  async 'chỉ bật Ms Hoa: L1 → đề ngắn 12 câu (1 chủ đề), L2 → 20 câu'() {
    const b = await boot();
    mixOnly(b, ['mshoa-explorer2']);
    setLesson(b, 1);
    const m1 = b.J(`App._buildWeeklyMix(${S})`);
    assert.strictEqual(m1.pool.length, 12); assert.strictEqual(m1.short, true); assert.strictEqual(m1.topicCount, 1);
    assert.ok(m1.pool.every(q => q.bookLesson.lesson === 1));
    setLesson(b, 2);
    assert.strictEqual(b.J(`App._buildWeeklyMix(${S}).pool.length`), 20);
  },
  async 'hạn mức: nguồn chỉ còn 6 câu hợp lệ → lấy 6, nguồn kia nhận 14; không trùng, không vượt phạm vi, không lấy câu chưa rà'() {
    const b = await boot();
    b.run(`var F = ${FAKE}; App.allData.subjects.push(F);`);
    for (let w = 0; w < 5; w++) {
      b.run(`App.playerName = 'Bé ${w}'`); // đổi hạt giống xáo
      const mix = b.J(`App._buildWeeklyMix(F)`);
      const n = Object.fromEntries(mix.sources.map(x => [x.id, x.n]));
      assert.deepStrictEqual(n, { A: 6, B: 14 });
      assert.strictEqual(new Set(mix.pool.map(q => q.id)).size, 20);
      assert.ok(mix.pool.every(q => q.stage === 1 && q.ref && q.ref.contentReview), 'vượt phạm vi / chưa rà');
    }
    // Tổng câu hợp lệ < 20 (chỉ bật A) → đề ngắn đúng 6 câu, không kéo câu ngoài phạm vi
    b.run(`App.setBookScope(F, { mix: { B: false } })`);
    const m = b.J(`App._buildWeeklyMix(F)`);
    assert.strictEqual(m.pool.length, 6); assert.strictEqual(m.short, true);
  },
  async 'tắt NIK khỏi Ôn tổng hợp: kế hoạch hôm nay + thử thách cún vẫn lấy NIK'() {
    const b = await boot();
    b.run(`App.setBookScope(${S}, { mix: { nik3: false } })`);
    assert.ok(b.J(`App._buildWeeklyMix(${S}).pool`).every(q => !q.topicId.startsWith('en_nik3')));
    assert.ok(b.J(`App._visibleTopics(${S}).map(t => t.id)`).includes('en_nik3-unit1'));
    let nik = 0;
    for (let i = 0; i < 40; i++) nik += b.J(`Pet.buildChallenge(App.allData, 'x' + ${i}).pool.filter(q => q.topicId.startsWith('en_nik3')).length`);
    assert.ok(nik > 0);
  },
  async 'đổi nguồn / mốc bài → khoá đề tuần đổi; môn khác giữ khoá cũ'() {
    const b = await boot();
    const k1 = b.J(`App._mixKey(${S})`);
    setLesson(b, 1);
    assert.notStrictEqual(k1, b.J(`App._mixKey(${S})`));
    assert.ok(/\|b:nik3,mshoa-explorer2@6\.2,nen$/.test(k1), k1);
    assert.ok(!/\|b:/.test(b.J(`App._mixKey(App.allData.subjects.find(x => x.id === 'toan'))`)));
  },
  async 'cài đặt sai / bài không tồn tại → về mặc định, không vỡ'() {
    const b = await boot();
    b.run(`Storage.set('bookScopeBySubject', { 'lop3:tieng-anh': { lesson: { 'mshoa-explorer2': { unit: 6, lesson: 9 } }, mix: { nik3: 'x' } } })`);
    const bs = b.J(`App.getBookScope(${S})`);
    assert.deepStrictEqual(bs.lesson['mshoa-explorer2'], { unit: 6, lesson: 2 });
    assert.strictEqual(bs.mix.nik3, true);
  },
};

(async () => {
  let fail = 0;
  for (const [name, fn] of Object.entries(tests)) {
    try { await fn(); console.log('✔', name); } catch (e) { fail++; console.log('✘', name, '\n ', e.message); }
  }
  if (fail) { console.log(fail + ' test lỗi'); process.exit(1); }
  console.log('en-books OK —', Object.keys(tests).length, 'test');
})();
