// Chia Tiếng Anh theo giáo trình: phạm vi Ms Hoa theo bài, Ôn tổng hợp (đề trộn tuần), 4 luồng lấy câu.
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

const tests = {
  async 'nạp index: sách + nhãn chủ đề (book, reviewed) đi kèm chủ đề'() {
    const b = await boot();
    assert.deepStrictEqual(b.J(`${S}.books.map(x => x.id)`), ['nik3', 'mshoa-explorer2', 'gs3', 'nen']);
    assert.strictEqual(b.J(`${MS}.book`), 'mshoa-explorer2');
    assert.strictEqual(b.J(`${S}.topics.filter(t => t.reviewed === false).length`), 7);
    assert.strictEqual(b.J(`${S}.topics.filter(t => !t.book).length`), 0);
    // Môn khác không có books → hành vi cũ
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
    b.run(`App.setStageSetting(${S}, 2, true)`); // chỉ GĐ2
    assert.strictEqual(b.J(`App._allowedIndices(${S}, ${MS}).length`), 12);
    const vis = b.J(`App._visibleTopics(${S}).map(t => t.id)`);
    assert.ok(vis.includes('en_nik3-unit3') && vis.includes('en_mshoa-e2-u6') && !vis.includes('en_nik3-unit1'));
  },
  async '4 luồng ở mốc L1 không lấy câu L2 / đoạn E; ở L2 lấy được'() {
    const b = await boot();
    const L2 = new Set(b.J(`${MS}.questions.filter(q => q.bookLesson.lesson === 2).map(q => q.id)`));
    const collect = () => {
      const ids = new Set();
      // 1. Luyện trong chủ đề: Quiz.start nhận allowed
      b.J(`App._allowedIndices(${S}, ${MS}).map(i => ${MS}.questions[i].id)`).forEach(x => ids.add(x));
      // 2. Kế hoạch hôm nay: chủ đề ứng viên + câu trong phạm vi (cùng _allowedIndices)
      const cand = b.J(`App._visibleTopics(${S}).map(t => t.id)`);
      assert.ok(cand.includes('en_mshoa-e2-u6'));
      // 3. Đề trộn tuần
      b.J(`App._buildWeeklyMix(${S}).pool.map(q => q.id)`).forEach(x => ids.add(x));
      // 4. Thử thách cún (nhiều lượt)
      for (let i = 0; i < 60; i++) b.J(`Pet.buildChallenge(App.allData, 'r' + ${i}).pool.map(q => q.id)`).forEach(x => ids.add(x));
      return [...ids].filter(x => x.startsWith('en_mshoa'));
    };
    setLesson(b, 1);
    const l1 = collect();
    assert.ok(l1.length > 0 && l1.every(id => !L2.has(id)), 'mốc L1 lẫn câu L2: ' + l1.filter(id => L2.has(id)));
    setLesson(b, 2);
    assert.ok(collect().some(id => L2.has(id)), 'mốc L2 phải lấy được câu L2');
  },
  async 'Ôn tổng hợp: chỉ chủ đề đã rà, sách ☑ (GS3 ☐ mặc định), 20 câu chia đều, không lặp ID'() {
    const b = await boot();
    const mix = b.J(`App._buildWeeklyMix(${S})`);
    const topicBook = b.J(`Object.fromEntries(${S}.topics.map(t => [t.id, [t.book, t.reviewed]]))`);
    assert.strictEqual(mix.pool.length, 20);
    assert.strictEqual(new Set(mix.pool.map(q => q.id)).size, 20);
    assert.ok(mix.pool.every(q => topicBook[q.topicId][1] === true), 'có câu chưa rà');
    assert.ok(mix.pool.every(q => topicBook[q.topicId][0] !== 'gs3'), 'GS3 chưa bật mà vẫn vào');
    const per = {}; mix.pool.forEach(q => { const k = topicBook[q.topicId][0]; per[k] = (per[k] || 0) + 1; });
    // GĐ1 mặc định: NIK, Ms Hoa, Nền đều đủ câu → 7/7/6 theo thứ tự xáo
    assert.deepStrictEqual(Object.values(per).sort(), [6, 7, 7]);
    assert.deepStrictEqual(mix.sources.map(x => x.n).sort(), [6, 7, 7]);
    assert.strictEqual(mix.short, false);
    // Câu đọc trong đề trộn còn nguyên đoạn
    assert.ok(mix.pool.filter(q => q.passage).every(q => /^Read: "/.test(q.q)));
  },
  async 'Ôn tổng hợp: nguồn thiếu câu lấy hết, bù đều; bật GS3 thì GS3 vào'() {
    const b = await boot();
    setLesson(b, 1); // Ms Hoa còn 12 câu
    b.run(`App.setBookScope(${S}, { mix: { nik3: false, nen: false, gs3: true } })`); // chỉ Ms Hoa + GS3
    const mix = b.J(`App._buildWeeklyMix(${S})`);
    const n = Object.fromEntries(mix.sources.map(x => [x.id, x.n]));
    assert.deepStrictEqual(n, { 'mshoa-explorer2': 10, gs3: 10 });
    b.run(`App.setBookScope(${S}, { mix: { gs3: false } })`); // chỉ Ms Hoa L1: 12 câu
    const m2 = b.J(`App._buildWeeklyMix(${S})`);
    assert.strictEqual(m2.pool.length, 12);
    assert.strictEqual(m2.short, true);
    assert.ok(m2.pool.every(q => q.bookLesson && q.bookLesson.lesson === 1));
  },
  async 'tắt NIK khỏi Ôn tổng hợp: kế hoạch hôm nay + thử thách cún vẫn lấy NIK'() {
    const b = await boot();
    b.run(`App.setBookScope(${S}, { mix: { nik3: false } })`);
    assert.ok(b.J(`App._buildWeeklyMix(${S}).pool`).every(q => !q.topicId.startsWith('en_nik3') && q.topicId !== 'en_reading-nik3'));
    assert.ok(b.J(`App._visibleTopics(${S}).map(t => t.id)`).includes('en_nik3-unit1'));
    let nik = 0;
    for (let i = 0; i < 40; i++) nik += b.J(`Pet.buildChallenge(App.allData, 'x' + ${i}).pool.filter(q => q.topicId.startsWith('en_nik3')).length`);
    assert.ok(nik > 0);
  },
  async 'đổi nguồn / mốc bài → khoá đề tuần đổi (điểm cũ không lẫn); môn khác giữ khoá cũ'() {
    const b = await boot();
    const k1 = b.J(`App._mixKey(${S})`);
    setLesson(b, 1);
    const k2 = b.J(`App._mixKey(${S})`);
    assert.notStrictEqual(k1, k2);
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
