// Tiến độ theo ID cho chủ đề câu tự sinh (toan_g13). Chạy: node tests/progress-id.test.js
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const REPO = path.join(__dirname, '..');

function boot(store) {
  const m = store || new Map();
  const ctx = { console, JSON, Date, Math, Object, String, Number, Array, Set, Map, Error, setTimeout, clearTimeout };
  ctx.window = ctx;
  ctx.localStorage = { get length() { return m.size; }, key: i => [...m.keys()][i] ?? null,
    getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
  ctx.document = { addEventListener() {}, getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; } };
  vm.createContext(ctx);
  for (const f of ['storage', 'gen-b1b3']) vm.runInContext(fs.readFileSync(path.join(REPO, 'js', f + '.js'), 'utf8'), ctx);
  vm.runInContext(`Storage.switchPlayer('Thỏ'); var data = [{ id: 'toan', topics: [] }]; GenB13.augment(data, 'lop3'); var T = data[0].topics[0];`, ctx);
  return { ctx, m, run: code => vm.runInContext(code, ctx) };
}
const J = (b, code) => JSON.parse(b.run('JSON.stringify(' + code + ')'));

const tests = {
  'Codex: thêm A → ghi đúng → thêm B (id đứng trước A) → tải lại → dấu đúng vẫn thuộc A, không thuộc B (tích lũy + trong ngày)'() {
    const store = new Map();
    let b = boot(store);
    const [A, B] = J(b, `(() => { const have = new Set(T.questions.map(q => q.id));
      const out = GenB13.pick('ngoai-kho-ab', 400).map(q => q.id).filter(id => !have.has(id)).sort(); return [out[out.length - 1], out[0]]; })()`);
    assert.ok(B < A, 'B đứng trước A theo thứ tự id');
    b.run(`GenB13.ensureIds(data, [${JSON.stringify(A)}])`);
    const iA = b.run(`T.questions.findIndex(q => q.id === ${JSON.stringify(A)})`);
    assert.strictEqual(iA, 300);
    b.run(`Storage.markTotalProgress('toan_g13', ${iA}, true); Storage.saveTopicProgress('toan_g13', [${iA}], [])`);
    b.run(`GenB13.ensureIds(data, [${JSON.stringify(B)}])`);
    // tải lại: dựng cả A, B từ lịch sử (sắp xếp lại → B lên vị trí 300)
    b = boot(store);
    b.run(`GenB13.ensureIds(data, ${JSON.stringify([A, B])})`);
    const pos = J(b, `({ A: T.questions.findIndex(q => q.id === ${JSON.stringify(A)}), B: T.questions.findIndex(q => q.id === ${JSON.stringify(B)}) })`);
    assert.strictEqual(pos.B, 300, 'đúng như Codex tái hiện: B chiếm vị trí 300 sau tải lại');
    const tot = J(b, `Storage.getTotalProgress('toan_g13')`), day = J(b, `Storage.getTopicProgress('toan_g13')`);
    assert.deepStrictEqual(tot.ok, [pos.A], 'tích lũy: đúng thuộc A');
    assert.deepStrictEqual(day.learned, [pos.A], 'trong ngày: thuộc A');
  },
  'id đã lưu mà chủ đề chưa có (chưa dựng lại) được giữ nguyên khi lưu tiếp, có lại câu thì hiện lại'() {
    const store = new Map();
    let b = boot(store);
    const A = b.run(`(() => { const have = new Set(T.questions.map(q => q.id)); return GenB13.pick('giu-id', 300).map(q => q.id).find(id => !have.has(id)); })()`);
    b.run(`GenB13.ensureIds(data, [${JSON.stringify(A)}]); Storage.markTotalProgress('toan_g13', 300, true); Storage.saveTopicProgress('toan_g13', [300], [300])`);
    b = boot(store);                                   // chưa dựng A
    assert.deepStrictEqual(J(b, `Storage.getTotalProgress('toan_g13').ok`), []);
    b.run(`Storage.markTotalProgress('toan_g13', 5, true); Storage.saveTopicProgress('toan_g13', [5], [])`);
    b.run(`GenB13.ensureIds(data, [${JSON.stringify(A)}])`);
    assert.deepStrictEqual(J(b, `Storage.getTotalProgress('toan_g13').ok`).sort((x, y) => x - y), [5, 300]);
    assert.deepStrictEqual(J(b, `Storage.getTopicProgress('toan_g13')`).learned.sort((x, y) => x - y), [5, 300]);
    assert.deepStrictEqual(J(b, `Storage.getTopicProgress('toan_g13')`).wrong, [300], 'câu sai trong ngày của A vẫn giữ');
  },
  'lên phiên bản (kho đổi hoàn toàn): câu mới KHÔNG kế thừa dấu của câu cũ cùng vị trí'() {
    const store = new Map();
    const b = boot(store);
    b.run(`for (let i = 0; i < 300; i++) Storage.markTotalProgress('toan_g13', i, true)`);
    assert.strictEqual(J(b, `Storage.getTotalProgress('toan_g13').ok`).length, 300);
    b.run(`T.questions.splice(0, 300, ...GenB13.pick('kho-gia-lap-v2', 300).map(q => Object.assign({}, q, { id: q.id.replace('_v1_', '_v2_') })))`);
    assert.deepStrictEqual(J(b, `Storage.getTotalProgress('toan_g13').ok`), [], 'kho mới: chưa câu nào đúng');
    b.run(`T.questions.push(GenB13.bank()[7])`);     // câu v1 cũ được dựng lại từ lịch sử
    assert.deepStrictEqual(J(b, `Storage.getTotalProgress('toan_g13').ok`), [300], 'câu cũ dựng lại giữ đúng trạng thái của nó');
  },
  'dữ liệu cũ lưu theo chỉ số (bản 1f57129) đổi sang id theo kho v1; chỉ số ngoài kho bị bỏ'() {
    const store = new Map();
    const b = boot(store);
    const key = b.run(`Storage._scoped(Storage.PROGRESS_TOTAL_KEY)`);
    store.set(key, JSON.stringify({ toan_g13: { seen: [0, 5, 301], ok: [5, 301] }, 'toan_bang-nhan-chia': { seen: [1], ok: [1] } }));
    assert.deepStrictEqual(J(b, `Storage.getTotalProgress('toan_g13')`), { seen: [0, 5], ok: [5] });
    b.run(`Storage.markTotalProgress('toan_g13', 9, true)`);
    const raw = JSON.parse(store.get(key));
    assert.deepStrictEqual(raw.toan_g13.okIds, J(b, `[T.questions[5].id, T.questions[9].id]`), 'ghi lại thành id');
    assert.deepStrictEqual(J(b, `Storage.getTotalProgress('toan_bang-nhan-chia')`), { seen: [1], ok: [1] }, 'chủ đề tĩnh vẫn theo chỉ số');
  },
  'chủ đề chưa nạp: đọc rỗng, ghi không làm gì (không ghi chỉ số bừa)'() {
    const store = new Map();
    const b = boot(store);
    b.run(`Storage._idTopics = {}`);
    b.run(`Storage.markTotalProgress('toan_g13', 3, true); Storage.saveTopicProgress('toan_g13', [3], [])`);
    assert.ok(!store.get(b.run(`Storage._scoped(Storage.PROGRESS_TOTAL_KEY)`)), 'không ghi');
    assert.deepStrictEqual(J(b, `Storage.getTotalProgress('toan_g13')`), { seen: [], ok: [] });
  }
};
let fail = 0;
for (const [name, fn] of Object.entries(tests)) { try { fn(); console.log('✔', name); } catch (e) { fail++; console.log('✘', name, '\n   ', e.message); } }
console.log(fail ? fail + ' lỗi' : 'Tất cả đạt'); process.exit(fail ? 1 : 0);
