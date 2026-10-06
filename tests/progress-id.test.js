// Tiến độ theo ID cho chủ đề câu tự sinh (toan_g13). Chạy: node tests/progress-id.test.js
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const REPO = path.join(__dirname, '..');

function boot(store, opts) {
  opts = opts || {};
  const m = store || new Map();
  const ctx = { console, JSON, Date, Math, Object, String, Number, Array, Set, Map, Error, setTimeout, clearTimeout };
  ctx.window = ctx;
  ctx.localStorage = { get length() { return m.size; }, key: i => [...m.keys()][i] ?? null,
    getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k) };
  ctx.document = { addEventListener() {}, getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; } };
  vm.createContext(ctx);
  for (const f of ['storage', 'gen-b1b3']) vm.runInContext(fs.readFileSync(path.join(REPO, 'js', f + '.js'), 'utf8'), ctx);
  // Giả lập phiên bản 2: cùng bảng mẫu nhưng id/kho mới (_v2_, seed kho-web-v2); bảng v1 vẫn dựng được câu cũ
  if (opts.v2) vm.runInContext(`GenB13.VERSION = 2; Object.defineProperty(GenB13, 'T_BY_VER', { get() { return { 1: this.T, 2: this.T }; } });`, ctx);
  vm.runInContext(`Storage.switchPlayer(${JSON.stringify(opts.player || 'Thỏ')}); var data = [{ id: 'toan', topics: [] }]; GenB13.augment(data, 'lop3'); var T = data[0].topics[0];`, ctx);
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
  'Codex P2: dữ liệu cũ theo chỉ số → chỉ mở/đọc, KHÔNG trả lời thêm → đã lưu bền thành id; lên v2 → dựng lại câu v1 → vẫn còn dấu (tích lũy + trong ngày)'() {
    const store = new Map();
    let b = boot(store);
    const today = b.run('Storage._getToday()');
    const kT = b.run('Storage._scoped(Storage.PROGRESS_TOTAL_KEY)'), kD = b.run('Storage._scoped(Storage.PROGRESS_KEY)');
    const v1 = J(b, 'GenB13.legacyBankIds()');
    store.set(kT, JSON.stringify({ toan_g13: { seen: [5, 7], ok: [5] } }));
    store.set(kD, JSON.stringify({ _date: today, toan_g13: { learned: [5, 7], wrong: [7], date: today } }));
    b = boot(store);                                       // mở bản này: chỉ tải trang, không làm câu nào
    assert.deepStrictEqual(JSON.parse(store.get(kT)).toan_g13, { seenIds: [v1[5], v1[7]], okIds: [v1[5]] }, 'tích lũy đã lưu bền thành id');
    assert.deepStrictEqual(JSON.parse(store.get(kD)).toan_g13.learnedIds, [v1[5], v1[7]], 'trong ngày đã lưu bền thành id');
    b = boot(store, { v2: true });                         // lên v2: kho mới
    assert.ok(J(b, 'T.questions[0].id').includes('_v2_'));
    assert.deepStrictEqual(J(b, `Storage.getTotalProgress('toan_g13').ok`), [], 'kho v2 không kế thừa dấu');
    b.run(`GenB13.ensureIds(data, ${JSON.stringify([v1[5], v1[7]])})`);
    const i5 = b.run(`T.questions.findIndex(q => q.id === ${JSON.stringify(v1[5])})`), i7 = b.run(`T.questions.findIndex(q => q.id === ${JSON.stringify(v1[7])})`);
    assert.ok(i5 >= 300 && i7 >= 300);
    assert.deepStrictEqual(J(b, `Storage.getTotalProgress('toan_g13')`), { seen: [i5, i7], ok: [i5] });
    assert.deepStrictEqual(J(b, `Storage.getTopicProgress('toan_g13')`), { learned: [i5, i7], wrong: [i7], date: today });
  },
  'bé chưa mở lại máy ở v1 (dữ liệu vẫn theo chỉ số) → mở thẳng ở v2 vẫn chuyển được nhờ ánh xạ kho v1 giữ mãi; đổi cho mọi bé trên máy'() {
    const store = new Map();
    let b = boot(store);
    const v1 = J(b, 'GenB13.legacyBankIds()');
    const kOther = b.run(`Storage._scoped(Storage.PROGRESS_TOTAL_KEY, 'Bé Khác')`);
    store.set(kOther, JSON.stringify({ toan_g13: { seen: [9], ok: [9] }, 'toan_bang-nhan-chia': { seen: [9], ok: [9] } }));
    b = boot(store, { v2: true, player: 'Thỏ' });           // đang chơi bé khác, bản v2
    const raw = JSON.parse(store.get(kOther));
    assert.deepStrictEqual(raw.toan_g13, { seenIds: [v1[9]], okIds: [v1[9]] }, 'bé không đang chơi cũng được đổi');
    assert.deepStrictEqual(raw['toan_bang-nhan-chia'], { seen: [9], ok: [9] }, 'chủ đề tĩnh giữ nguyên');
    b = boot(store, { v2: true, player: 'Bé Khác' });
    b.run(`GenB13.ensureIds(data, ${JSON.stringify([v1[9]])})`);
    const i9 = b.run(`T.questions.findIndex(q => q.id === ${JSON.stringify(v1[9])})`);
    assert.deepStrictEqual(J(b, `Storage.getTotalProgress('toan_g13').ok`), [i9]);
  },
  'ánh xạ kho v1 = đúng kho web v1 hiện tại, và không đổi khi lên v2'() {
    const b1 = boot(new Map()), b2 = boot(new Map(), { v2: true });
    assert.deepStrictEqual(J(b1, 'GenB13.legacyBankIds()'), J(b1, 'GenB13.bank().map(q => q.id)'));
    assert.deepStrictEqual(J(b2, 'GenB13.legacyBankIds()'), J(b1, 'GenB13.legacyBankIds()'));
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
