// Ôn giữa kỳ I Tiếng Anh (index.json reviewSets) + cổng duyệt hình (imageReview).
// Chạy: node tests/en-midterm.test.js   (dữ liệu thật trong data-lop3, nạp qua API như trên web)
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const REPO = path.join(__dirname, '..');

async function boot() {
  const m = new Map();
  const ctx = { console, JSON, Date, Math, Object, String, Number, Array, Set, Map, Error, Promise, setTimeout, clearTimeout, structuredClone };
  ctx.window = ctx;
  ctx.localStorage = { get length() { return m.size; }, key: i => [...m.keys()][i] ?? null,
    getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
  ctx.document = { addEventListener() {}, getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; } };
  ctx.fetch = async u => { const f = path.join(REPO, String(u).split('?')[0]);
    return fs.existsSync(f) ? { ok: true, status: 200, json: async () => JSON.parse(fs.readFileSync(f, 'utf8')) } : { ok: false, status: 404 }; };
  vm.createContext(ctx);
  for (const f of ['storage', 'api', 'today', 'pet-room', 'pet-accessories', 'pet', 'quiz', 'app']) vm.runInContext(fs.readFileSync(path.join(REPO, 'js', f + '.js'), 'utf8'), ctx);
  vm.runInContext(`Storage.switchPlayer('Thỏ'); App.playerName = 'Thỏ'; App.currentGrade = 'lop3';`, ctx);
  await vm.runInContext(`API.getAllData('lop3').then(d => { App.allData = d; App._dataByGrade = { lop3: d }; })`, ctx);
  const run = code => vm.runInContext(code, ctx);
  return { run, J: code => JSON.parse(run('JSON.stringify(' + code + ')')) };
}
const S = `App.allData.subjects.find(x => x.id === 'tieng-anh')`;
const SET = `${S}.reviewSets.find(x => x.id === 'en-giuaky1-2026')`;
// Mọi câu đang chờ duyệt hình trong môn
const PENDING = `${S}.topics.flatMap(t => t.questions).filter(q => q.image && q.imageReview && q.imageReview.status !== 'ok').map(q => q.id)`;
const ALLOWED_IDS = `${S}.topics.flatMap(t => (App._allowedIndices(${S}, t) || t.questions.map((_, i) => i)).map(i => t.questions[i].id))`;
const allStages = b => b.run(`App.setStageSetting ? App.setStageSetting(${S}, 2, false) : null`);

const tests = {
  async 'nạp reviewSets qua API; 20 câu chờ hình'() {
    const b = await boot();
    assert.strictEqual(b.J(`${SET}.groups.length`), 8);
    assert.strictEqual(b.J(`${PENDING}.length`), 20);
  },
  async 'cổng hình: câu chờ hình không vào _allowedIndices / _mixEligible ở mọi giai đoạn'() {
    const b = await boot();
    for (const st of [1, 2]) {
      b.run(`App.setStageSetting(${S}, ${st}, false)`);
      const pend = new Set(b.J(PENDING)), ids = b.J(ALLOWED_IDS);
      assert.ok(ids.every(id => !pend.has(id)), 'GĐ' + st + ': câu chờ hình lọt vào phạm vi');
      assert.ok(b.J(`${S}.topics.flatMap(t => t.questions).filter(q => App._mixEligible(${S}, q)).map(q => q.id)`).every(id => !pend.has(id)));
    }
  },
  async 'cổng hình: đổi imageReview.status = ok thì câu được dùng lại'() {
    const b = await boot();
    b.run(`App.setStageSetting(${S}, 2, false)`);
    const id = 'en_nik3-unit1_q044';
    assert.ok(!b.J(ALLOWED_IDS).includes(id));
    b.run(`${S}.topics.flatMap(t => t.questions).find(q => q.id === '${id}').imageReview.status = 'ok'`);
    assert.ok(b.J(ALLOWED_IDS).includes(id));
  },
  async 'kế hoạch hôm nay / thử thách cún / đề trộn tuần không lấy câu chờ hình'() {
    const b = await boot();
    b.run(`App.setStageSetting(${S}, 2, false)`);
    const pend = new Set(b.J(PENDING));
    for (let k = 0; k < 5; k++) {
      const mix = b.J(`App._buildWeeklyMix(${S}).pool.map(q => q.id)`);
      assert.ok(mix.every(id => !pend.has(id)));
    }
    for (let k = 0; k < 5; k++) {
      const pet = b.J(`Pet.buildChallenge(App.allData, 'run${'${k}'}').pool.map(q => q.id)`);
      assert.ok(pet.length && pet.every(id => !pend.has(id)));
    }
    const today = b.J(`Today._allowed(${S}, ${S}.topics.find(t => t.id === 'en_nik3-unit1')).map(i => ${S}.topics.find(t => t.id === 'en_nik3-unit1').questions[i].id)`);
    assert.ok(today.length && today.every(id => !pend.has(id)));
  },
  async 'Ôn giữa kỳ: nhóm, đề thử, bài thêm chỉ dùng câu sẵn sàng; đề thử chỉ phần bắt buộc, không lặp'() {
    const b = await boot();
    const pend = new Set(b.J(PENDING));
    const req = new Set(b.J(`${SET}.groups.flatMap(g => g.required)`));
    const ext = new Set(b.J(`${SET}.groups.flatMap(g => g.extra)`));
    for (let k = 0; k < 10; k++) {
      const mock = b.J(`App._reviewSetMock(${S}, ${SET}).map(q => q.id)`);
      assert.strictEqual(mock.length, 20);
      assert.strictEqual(new Set(mock).size, 20);
      assert.ok(mock.every(id => req.has(id) && !pend.has(id)));
    }
    const groups = b.J(`${SET}.groups.map(g => App._reviewSetHits(${S}, g.required).map(h => h.q.id))`);
    assert.ok(groups.flat().every(id => !pend.has(id)));
    const extra = b.J(`App._reviewSetHits(${S}, ${SET}.groups.flatMap(g => g.extra)).map(h => h.q.id)`);
    assert.ok(extra.length > 0 && extra.every(id => ext.has(id) && !pend.has(id)));
    // U3 (stage 2) vẫn có trong Ôn giữa kỳ dù bé đang chọn GĐ1: danh sách đã chốt phạm vi đề thi
    b.run(`App.setStageSetting(${S}, 1, true)`);
    assert.ok(b.J(`App._reviewSetHits(${S}, ${SET}.groups.find(g => g.id === 'u3-camping').required).length`) >= 20);
  },
  async 'Ôn câu sai giữa kỳ: chỉ câu sai thuộc danh sách'() {
    const b = await boot();
    b.run(`Storage.recordAnswer({ subjectId: 'tieng-anh', topicId: 'en_nik3-unit3', questionId: 'en_nik3-unit3_q001', question: 'x', isCorrect: false })`);
    b.run(`Storage.recordAnswer({ subjectId: 'tieng-anh', topicId: 'en_nik3-unit2', questionId: 'en_nik3-unit2_q010', question: 'x', isCorrect: false })`);
    const w = b.J(`App._reviewSetWrong(${S}, ${SET}).map(h => h.q.id)`);
    assert.deepStrictEqual(w, ['en_nik3-unit3_q001']); // q010 (Ai Cập) không thuộc danh sách
  },
  async 'câu cũ sửa nhiễu không còn từ ngoài phạm vi'() {
    const b = await boot();
    const qs = b.J(`${S}.topics.flatMap(t => t.questions).filter(q => ['en_nik3-unit2_q001','en_nik3-unit2_q002','en_nik3-unit2_q004','en_nik3-unit2_q005','en_nik3-unit2_q031'].includes(q.id))`);
    assert.strictEqual(qs.length, 5);
    assert.ok(qs.every(q => !/pharaoh|tomb|claw|gold|steps/.test(q.choices.join(' '))));
  },
};

(async () => {
  let fail = 0;
  for (const [name, fn] of Object.entries(tests)) {
    try { await fn(); console.log('✔', name); } catch (e) { fail++; console.log('✘', name, '\n  ', e.message); }
  }
  if (fail) { console.log(fail + ' test lỗi'); process.exit(1); }
  console.log('en-midterm OK —', Object.keys(tests).length, 'test');
})();
