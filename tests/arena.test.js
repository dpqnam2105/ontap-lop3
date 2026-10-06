// Kiểm thử phạm vi danh hiệu Đấu trường (js/table-gen.js).
// Chạy: node tests/arena.test.js   (Node 18+, không cần cài gì thêm)
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const REPO = process.argv[2] || path.join(__dirname, '..');

function boot() {
  const m = new Map();
  const ctx = { console, JSON, Date, Math, Object, String, Number, Array, Set, Error };
  ctx.window = ctx;
  ctx.localStorage = {
    get length() { return m.size; }, key: i => [...m.keys()][i] ?? null,
    getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k)
  };
  ctx.document = { addEventListener() {}, getElementById() { return null; }, querySelector() { return null; } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(REPO, 'js/storage.js'), 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(path.join(REPO, 'js/table-gen.js'), 'utf8'), ctx);
  vm.runInContext('Storage.switchPlayer("Thỏ")', ctx);
  return ctx;
}
const run = (ctx, code) => vm.runInContext(code, ctx);
const J = (ctx, code) => JSON.parse(run(ctx, 'JSON.stringify(' + code + ')'));
const pass = (ctx, level, t, g, score) =>
  J(ctx, `TableGen.setLevelResult(${level}, ${score == null ? 17 : score}, ${t ? JSON.stringify({ t, g: g || 'all' }) : 'undefined'})`);
const ALL = [2, 3, 4, 5, 6, 7, 8, 9];

const tests = {
  'huy hiệu cũ (chưa có phạm vi) giữ nguyên, hiện "chưa ghi nhận phạm vi"'() {
    const c = boot();
    run(c, `localStorage.setItem(TableGen._speedKey(), JSON.stringify({ facts: {}, level: { unlocked: 2, best: { 0: 18, 1: 17 }, passed: { 0: '2026-10-01', 1: '2026-10-03' } } }))`);
    assert.strictEqual(run(c, 'TableGen.rankOf()'), 1, 'danh hiệu cao nhất giữ nguyên');
    assert.strictEqual(run(c, 'TableGen.levelScopeText(1)'), 'chưa ghi nhận phạm vi');
    assert.strictEqual(run(c, 'TableGen.levelScopeText(1, null, true)'), '', 'nhãn cạnh tên không hiện chữ thừa');
    assert.strictEqual(run(c, 'TableGen.scopesOf(1).length'), 0);
  },

  'huy hiệu cũ, đạt lại có phạm vi → ghi phạm vi thật, GIỮ ngày đạt cũ, không tính là huy hiệu mới'() {
    const c = boot();
    run(c, `localStorage.setItem(TableGen._speedKey(), JSON.stringify({ facts: {}, level: { unlocked: 1, best: { 0: 18 }, passed: { 0: '2026-10-01' } } }))`);
    const r = pass(c, 0, [2]);
    assert.strictEqual(r.newBadge, false);
    assert.strictEqual(r.newScope, true);
    assert.strictEqual(run(c, 'TableGen.getSpeed().level.passed[0]'), '2026-10-01');
    assert.strictEqual(run(c, 'TableGen.levelScopeText(0)'), 'bảng 2');
  },

  'đạt bảng 2 và bảng 5 ở hai lượt riêng → KHÔNG thành "bảng 2, 5"'() {
    const c = boot();
    pass(c, 4, [2]); pass(c, 4, [5]);
    const list = J(c, 'TableGen.scopesOf(4)');
    assert.strictEqual(list.length, 2);
    assert.ok(!list.some(x => x.t.length > 1), 'không có phạm vi gộp');
    assert.ok(['bảng 2', 'bảng 5'].includes(run(c, 'TableGen.levelScopeText(4)')));
  },

  'đạt thật lượt trộn bảng 2, 5 → mới hiện "bảng 2, 5"'() {
    const c = boot();
    pass(c, 4, [2]); pass(c, 4, [2, 5]);
    assert.strictEqual(run(c, 'TableGen.levelScopeText(4)'), 'bảng 2, 5');
  },

  'vượt riêng 2 nhóm dạng → KHÔNG thành "tất cả dạng"'() {
    const c = boot();
    pass(c, 3, ALL, 'calc'); pass(c, 3, ALL, 'rel');
    const list = J(c, 'TableGen.scopesOf(3)');
    assert.ok(!list.some(x => x.g === 'all'));
    assert.match(run(c, 'TableGen.levelScopeText(3)'), /^bảng 2–9 · /);
    pass(c, 3, ALL, 'all');
    assert.strictEqual(run(c, 'TableGen.levelScopeText(3)'), 'bảng 2–9', 'chỉ khi đạt lượt trộn thật');
  },

  'không đạt (dưới 16/20) thì không ghi phạm vi'() {
    const c = boot();
    pass(c, 0, [2, 3], 'all', 12);
    assert.strictEqual(run(c, 'TableGen.scopesOf(0).length'), 0);
    assert.ok(!run(c, 'TableGen.getSpeed().level.passed[0]'));
  },

  'đạt lại đúng phạm vi cũ → không trùng, giữ điểm cao nhất'() {
    const c = boot();
    pass(c, 1, [3], 'rel', 16); pass(c, 1, [3], 'rel', 19); pass(c, 1, [3], 'rel', 17);
    const list = J(c, 'TableGen.scopesOf(1)');
    assert.strictEqual(list.length, 1);
    assert.strictEqual(list[0].s, 19);
  },

  'gọi kiểu cũ (không có phạm vi) vẫn chạy như trước'() {
    const c = boot();
    const r = pass(c, 0, null);
    assert.strictEqual(r.newBadge, true);
    assert.strictEqual(run(c, 'TableGen.levelScopeText(0)'), 'chưa ghi nhận phạm vi');
  },

  'scopeOf lấy đúng bảng + nhóm dạng của kho câu lượt đó'() {
    const c = boot();
    run(c, `globalThis.__topic = { questions: [
      { _table: 2, _form: 'mul' }, { _table: 5, _form: 'r10' }, { _table: 7, _form: 'div' }, { _table: 5, _form: 'mfac' } ] }`);
    assert.deepStrictEqual(J(c, 'TableGen.scopeOf(__topic, [0, 1, 3], "all")'), { t: [2, 5], g: 'all' });
    assert.deepStrictEqual(J(c, 'TableGen.scopeOf(__topic, [0, 3], "all")'), { t: [2, 5], g: 'calc' }, 'chọn "tất cả" mà kho chỉ có 1 nhóm → ghi đúng nhóm');
    assert.deepStrictEqual(J(c, 'TableGen.scopeOf(__topic, [0, 2], "calc")'), { t: [2, 7], g: 'calc' });
  },

  'cách viết bảng'() {
    const c = boot();
    const f = t => run(c, 'TableGen.fmtTables(' + JSON.stringify(t) + ')');
    assert.strictEqual(f([2]), '2');
    assert.strictEqual(f([2, 3]), '2, 3');
    assert.strictEqual(f([2, 3, 4, 7]), '2–4, 7');
    assert.strictEqual(f([5, 2, 9]), '2, 5, 9');
    assert.strictEqual(run(c, 'TableGen.scopeText({ t: [2,3,4,5,6,7,8,9], g: "all" })'), 'bảng 2–9');
    assert.strictEqual(run(c, 'TableGen.scopeText({ t: [2,3,4,6,8], g: "rel" }, true)'), '5 bảng · quan hệ');
    assert.strictEqual(run(c, 'TableGen.scopeText({ t: [2,3,4,6,8], g: "calc" })'), 'bảng 2–4, 6, 8 · Tính & tìm số thiếu');
  },

  'phạm vi rộng nhất không bao giờ bị cắt khi danh sách quá dài'() {
    const c = boot();
    pass(c, 2, ALL, 'all');
    for (let a = 2; a <= 9; a++) for (const g of ['calc', 'rel']) pass(c, 2, [a], g);
    const list = J(c, 'TableGen.scopesOf(2)');
    assert.ok(list.length <= 13);
    assert.strictEqual(run(c, 'TableGen.levelScopeText(2)'), 'bảng 2–9');
  },
};

let fail = 0;
for (const [name, fn] of Object.entries(tests)) {
  try { fn(); console.log('✔', name); } catch (e) { fail++; console.log('✘', name, '\n   ', e.message); }
}
console.log(fail ? fail + ' lỗi' : 'Tất cả đạt');
process.exit(fail ? 1 : 0);
