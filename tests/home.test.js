// Kiểm thử logic trang chủ: chuỗi ngày (một nguồn), thưởng kế hoạch hôm nay (1 lần, ghi nhận thật), điểm tuần.
// Chạy: node tests/home.test.js   (Node 18+, không cần cài gì thêm)
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const REPO = process.argv[2] || path.join(__dirname, '..');

function boot(store) {
  const m = store || new Map();
  const ctx = { console, JSON, Date, Math, Object, String, Number, Array, Set, Error, setTimeout, clearTimeout };
  ctx.window = ctx;
  ctx.localStorage = {
    get length() { return m.size; }, key: i => [...m.keys()][i] ?? null,
    getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: k => m.delete(k)
  };
  ctx.document = { addEventListener() {}, getElementById() { return null; }, querySelector() { return null; }, querySelectorAll() { return []; } };
  vm.createContext(ctx);
  for (const f of ['storage', 'quiz', 'today', 'api']) vm.runInContext(fs.readFileSync(path.join(REPO, 'js', f + '.js'), 'utf8'), ctx);
  // Giả lập phần App mà Today cần
  vm.runInContext(`window.App = { playerName: 'Thỏ', currentGrade: 'lop3' }; Rewards.updateUI = () => {}; Rewards._titleUpgradeAnimation = () => {};
    Storage.switchPlayer('Thỏ'); Today.render = () => {};`, ctx);
  return ctx;
}
const run = (c, code) => vm.runInContext(code, c);
const J = (c, code) => JSON.parse(run(c, 'JSON.stringify(' + code + ')'));
const key = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const at = (y, mo, d, h, mi) => new Date(y, mo - 1, d, h || 0, mi || 0).getTime();
const streak = (c, last, n, now) => run(c, `Today.streakNow({ streak: ${n}, lastStudyDate: ${JSON.stringify(last)} }, ${now})`);

const tests = {
  'chuỗi: học hôm nay → giữ'() { const c = boot(); assert.strictEqual(streak(c, '2026-10-07', 4, at(2026, 10, 7, 20)), 4); },
  'chuỗi: sáng nay CHƯA học, hôm qua có học → vẫn giữ (không về 0 sớm)'() { const c = boot(); assert.strictEqual(streak(c, '2026-10-06', 4, at(2026, 10, 7, 7)), 4); },
  'chuỗi: lần học cuối cách 2 ngày → 0 (số cũ trong hồ sơ không còn đúng)'() { const c = boot(); assert.strictEqual(streak(c, '2026-10-05', 4, at(2026, 10, 7, 7)), 0); },
  'chuỗi: kéo dài từ tuần trước (sáng thứ Hai, hôm qua là Chủ nhật)'() { const c = boot(); assert.strictEqual(streak(c, '2026-10-11', 9, at(2026, 10, 12, 6)), 9); },
  'chuỗi: qua nửa đêm (23:59 vẫn là hôm nay, 00:01 hôm sau vẫn giữ, 00:01 ngày kế tiếp nữa thì đứt)'() {
    const c = boot();
    assert.strictEqual(streak(c, '2026-10-07', 3, at(2026, 10, 7, 23, 59)), 3);
    assert.strictEqual(streak(c, '2026-10-07', 3, at(2026, 10, 8, 0, 1)), 3);
    assert.strictEqual(streak(c, '2026-10-07', 3, at(2026, 10, 9, 0, 1)), 0);
  },
  'chuỗi: qua tháng / qua năm'() {
    const c = boot();
    assert.strictEqual(streak(c, '2026-10-31', 5, at(2026, 11, 1, 8)), 5);
    assert.strictEqual(streak(c, '2026-12-31', 5, at(2027, 1, 1, 8)), 5);
  },

  'thưởng: cộng 10 sao và đánh dấu đã nhận trong CÙNG một lần lưu'() {
    const c = boot();
    run(c, `(() => { const d = Storage.load(); d.stars = 100; Storage.save(d); })()`);
    let saves = 0;
    run(c, `(() => { const o = Storage.save.bind(Storage); Storage.save = d => { globalThis.__saves = (globalThis.__saves || 0) + 1; return o(d); }; })()`);
    const p = { date: '2026-10-07', player: 'thỏ', grade: 'lop3', tasks: [{ id: 'a', done: true }], rewarded: false };
    c.__p = p;
    assert.strictEqual(run(c, 'Today.grantReward(__p)'), true);
    saves = run(c, 'globalThis.__saves');
    assert.strictEqual(saves, 1, 'đúng 1 lần lưu hồ sơ');
    const d = J(c, 'Storage.load()');
    assert.strictEqual(d.stars, 110);
    assert.strictEqual(d.todayPlan.rewarded, true);
    assert.strictEqual(d.todayPlan.rewardStars, 10);
  },

  'thưởng: gọi lại / mở lại trang → KHÔNG cộng thêm'() {
    const store = new Map();
    const c = boot(store);
    run(c, `(() => { const d = Storage.load(); d.stars = 50; Storage.save(d); })()`);
    c.__p = { date: '2026-10-07', player: 'thỏ', grade: 'lop3', tasks: [{ id: 'a', done: true }], rewarded: false };
    assert.strictEqual(run(c, 'Today.grantReward(__p)'), true);
    c.__p2 = { date: '2026-10-07', player: 'thỏ', grade: 'lop3', tasks: [{ id: 'a', done: true }], rewarded: false };   // bản cũ trong bộ nhớ
    assert.strictEqual(run(c, 'Today.grantReward(__p2)'), false, 'kế hoạch đã nhận trong hồ sơ → không cộng nữa');
    const c2 = boot(store);   // mở lại trang
    c2.__p = J(c2, 'Storage.load().todayPlan');
    assert.strictEqual(run(c2, 'Today.grantReward(__p)'), false);
    assert.strictEqual(J(c2, 'Storage.load()').stars, 60);
  },

  'thưởng: onSessionFinish nhiều lần sau khi xong → chỉ cộng 1 lần'() {
    const c = boot();
    run(c, `(() => { const d = Storage.load(); d.stars = 0; Storage.save(d);
      Today.plan = () => { const s = Storage.get('todayPlan'); return s || null; };
      Storage.set('todayPlan', { date: Today._dateKey(), player: 'thỏ', grade: 'lop3', rewarded: false,
        tasks: [{ id: 'a', kind: 'topic', topicId: 't1', done: true }, { id: 'b', kind: 'topic', topicId: 't2', done: false }] });
      globalThis.Quiz = { _confettiBurst() {} }; Rewards._achievementPopup = () => {}; })()`);
    run(c, `Today.onSessionFinish({ mode: 'practice', topicId: 't2' })`);
    run(c, `Today.onSessionFinish({ mode: 'practice', topicId: 't2' })`);
    run(c, `Today.onSessionFinish({ mode: 'practice', topicId: 't1' })`);
    assert.strictEqual(J(c, 'Storage.load()').stars, 10);
    assert.strictEqual(J(c, 'Storage.load().todayPlan').rewarded, true);
  },

  'tuần bắt đầu 00:00 thứ Hai (cả khi hôm nay là Chủ nhật)'() {
    const c = boot();
    assert.strictEqual(key(new Date(run(c, `API.weekStart(${at(2026, 10, 11, 21)}).getTime()`))), '2026-10-05');
    assert.strictEqual(key(new Date(run(c, `API.weekStart(${at(2026, 10, 12, 0, 0)}).getTime()`))), '2026-10-12');
    assert.strictEqual(new Date(run(c, `API.weekStart(${at(2026, 10, 8, 15)}).getTime()`)).getHours(), 0);
  },

  'điểm tuần = số câu đúng từ thứ Hai (không phải sao); lượt trước thứ Hai không tính'() {
    const c = boot();
    const ws = at(2026, 10, 5);
    c.__logs = [
      { time: new Date(at(2026, 10, 4, 23, 59)).toISOString(), correct: 50, total: 50 },   // Chủ nhật tuần trước
      { time: new Date(at(2026, 10, 5, 0, 0)).toISOString(), correct: 7, total: 10 },     // đúng 00:00 thứ Hai
      { time: new Date(at(2026, 10, 7, 19)).toISOString(), correct: 12, total: 20 },
      { time: new Date(at(2026, 10, 8, 8)).toISOString(), score: 3 },                     // nhật ký kiểu cũ chỉ có score
      { time: 'không hợp lệ', correct: 99 }
    ];
    assert.strictEqual(run(c, `API.weekScoreFromLogs(__logs, new Date(${ws}))`), 22);
  },
};

let fail = 0;
for (const [name, fn] of Object.entries(tests)) {
  try { fn(); console.log('✔', name); } catch (e) { fail++; console.log('✘', name, '\n   ', e.message); }
}
console.log(fail ? fail + ' lỗi' : 'Tất cả đạt');
process.exit(fail ? 1 : 0);
