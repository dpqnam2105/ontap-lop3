// Động từ bất quy tắc (lô 6): thẻ ôn theo nhóm dùng reviewSets với scope "stage".
// Chạy: node tests/en-irregular.test.js   (dữ liệu thật trong data-lop3, nạp qua API như trên web)
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
const IRR = `${S}.reviewSets.find(x => x.id === 'en-batquytac-2026')`;
const GK = `${S}.reviewSets.find(x => x.id === 'en-giuaky1-2026')`;
const hitIds = (b, set, g) => b.J(`App._reviewSetHits(${S}, ${set}.groups[${g}].required, ${set}).map(h => h.q.id)`);
const allHits = (b, set) => b.J(`${set}.groups.flatMap(g => App._reviewSetHits(${S}, g.required, ${set}).map(h => h.q.id))`);
const ORDER = ['be', 'begin', 'break', 'bring', 'build', 'buy', 'catch', 'choose', 'come', 'cost', 'cut', 'do', 'draw', 'drive', 'eat',
  'fall', 'feel', 'find', 'get', 'give', 'go', 'grow', 'have', 'hear', 'hit', 'hold', 'keep', 'know', 'lead', 'leave'];

const tests = {
  async 'bộ bất quy tắc có scope stage; bộ giữa kỳ không có scope'() {
    const b = await boot();
    assert.strictEqual(b.J(`${IRR}.scope`), 'stage');
    assert.strictEqual(b.J(`${GK}.scope || null`), null);
  },
  async 'GĐ1: không thấy câu nào của bộ bất quy tắc (thẻ ẩn vì < 5 câu)'() {
    const b = await boot();
    b.run(`App.setStageSetting(${S}, 1, false)`);
    assert.deepStrictEqual(allHits(b, IRR), []);
    assert.deepStrictEqual(b.J(`App._reviewSetMock(${S}, ${IRR})`), []);
  },
  async 'GĐ2: thấy đúng toàn bộ câu đã duyệt; mỗi nhóm chỉ có từ của nhóm mình và nhóm trước'() {
    const b = await boot();
    b.run(`App.setStageSetting(${S}, 2, false)`);
    const listed = b.J(`${IRR}.groups.flatMap(g => g.required)`);
    assert.deepStrictEqual(allHits(b, IRR).sort(), listed.slice().sort());
    const byId = b.J(`Object.fromEntries(${S}.topics.flatMap(t => t.questions).map(q => [q.id, q]))`);
    b.J(`${IRR}.groups.map(g => g.id)`).forEach((gid, gi) => {
      for (const id of hitIds(b, IRR, gi)) {
        const q = byId[id];
        assert.strictEqual(q.irrGroup, gi + 1, id + ' sai nhóm');
        for (const v of q.verbs) assert.ok(Math.floor(ORDER.indexOf(v) / 5) <= gi, id + ': từ ' + v + ' thuộc nhóm sau');
      }
    });
  },
  async 'đề thử: 12 câu, rút đều mỗi nhóm 4, không lặp'() {
    const b = await boot();
    b.run(`App.setStageSetting(${S}, 2, false)`);
    const mock = b.J(`App._reviewSetMock(${S}, ${IRR}).map(q => q.id)`);
    const groups = b.J(`${IRR}.groups.map(g => g.required)`);
    assert.strictEqual(mock.length, 12);
    assert.strictEqual(new Set(mock).size, 12);
    if (groups.length === 3) groups.forEach(g => assert.strictEqual(mock.filter(id => g.includes(id)).length, 4));
  },
  async 'bộ giữa kỳ giữ hành vi cũ: không lọc theo giai đoạn'() {
    const b = await boot();
    b.run(`App.setStageSetting(${S}, 1, false)`);
    const g1 = allHits(b, GK).length;
    b.run(`App.setStageSetting(${S}, 2, false)`);
    assert.strictEqual(allHits(b, GK).length, g1);
    assert.ok(g1 > 0);
  },
};

(async () => {
  let fail = 0;
  for (const [name, fn] of Object.entries(tests)) {
    try { await fn(); console.log('✔', name); } catch (e) { fail++; console.log('✘', name, '\n  ', e.message); }
  }
  if (fail) { console.log(fail + ' test lỗi'); process.exit(1); }
  console.log('en-irregular OK —', Object.keys(tests).length, 'test');
})();
