// Kiểm thử Cloud (#3) trong Node: localStorage giả, fetch giả.
const fs = require('fs'), vm = require('vm'), assert = require('assert');
// Chạy: node tests/cloud.test.js   (cần Node 18+, không cần cài gì thêm)
const REPO = process.argv[2] || require('path').join(__dirname, '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));

function makeLS(store) {
  return {
    _m: store,
    get length() { return this._m.size; },
    key(i) { return [...this._m.keys()][i] ?? null; },
    getItem(k) { return this._m.has(k) ? this._m.get(k) : null; },
    setItem(k, v) { this._m.set(k, String(v)); },
    removeItem(k) { this._m.delete(k); },
  };
}

function boot(store, fetchImpl, extra) {
  const ctx = { console, setTimeout, clearTimeout, Promise, JSON, Date, Math, Object, String, Number, Array, Error, encodeURIComponent };
  ctx.window = ctx;
  ctx.localStorage = makeLS(store);
  ctx.beacons = [];
  ctx.navigator = { sendBeacon: (u, b) => { ctx.beacons.push(JSON.parse(b)); return true; } };
  ctx.document = { addEventListener() {}, querySelector() { return null; }, getElementById() { return null; } };
  ctx.addEventListener = () => {};
  ctx.fetch = fetchImpl;
  Object.assign(ctx, extra || {});
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(REPO + '/js/storage.js', 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(REPO + '/js/cloud.js', 'utf8'), ctx);
  vm.runInContext('Cloud.DEBOUNCE_MS = 20; Cloud.RETRY_MS = [150, 300, 500];', ctx);
  return ctx;
}

// Máy chủ giả
function server(opts) {
  const s = { saves: [], mode: 'ok', delay: 0, rows: {} };
  s.fetch = async (url, init) => {
    if (!init) { // GET
      if (s.delay) await sleep(s.delay);
      const key = decodeURIComponent(/key=([^&]*)/.exec(url)[1]);
      const row = s.rows[key];
      return { ok: true, status: 200, json: async () => row ? { ok: true, found: true, snapshot: row.snapshot, meta: row.meta } : { ok: true, found: false } };
    }
    const body = JSON.parse(init.body);
    s.saves.push(body);
    if (s.delay) await sleep(s.delay);
    if (s.mode === 'neterr') throw new Error('offline');
    if (s.mode === 'http500') return { ok: false, status: 500, json: async () => ({}) };
    if (s.mode === 'html') return { ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token <'); } };
    const old = s.rows[body.key];
    if (old && !body.force && body.meta.p < old.meta.p) return { ok: true, status: 200, json: async () => ({ ok: false, reason: 'older', meta: old.meta }) };
    s.rows[body.key] = { snapshot: body.snapshot, meta: body.meta };
    return { ok: true, status: 200, json: async () => ({ ok: true, saved: true }) };
  };
  return s;
}

const meta = (ctx, n) => JSON.parse(ctx.localStorage.getItem('khoBaiTap_cloudmeta::' + n) || '{}');
const run = (ctx, code) => vm.runInContext(code, ctx);
function earn(ctx, name, xp, stars) {
  run(ctx, `(() => { const d = Storage.switchPlayer(${JSON.stringify(name)}); d.xp = (d.xp||0) + ${xp}; d.stars = (d.stars||0) + ${stars || 0}; Storage.save(d); })()`);
}

const tests = {
  async 'thay đổi trong lúc đang gửi vẫn là chưa lưu, rồi được gửi tiếp'() {
    const srv = server(); srv.delay = 80;
    const ctx = boot(new Map(), srv.fetch); run(ctx, 'Cloud.init()');
    earn(ctx, 'Thỏ', 10);                       // rev 1
    await sleep(40);                            // lượt gửi rev 1 đang chạy
    assert.strictEqual(srv.saves.length, 1);
    earn(ctx, 'Thỏ', 5);                        // rev 2 phát sinh giữa lúc gửi
    await sleep(100);                            // rev 1 xác nhận xong
    let m = meta(ctx, 'thỏ');
    assert.strictEqual(m.savedRev, 1); assert.strictEqual(m.localRev, 2);
    await sleep(1300);
    m = meta(ctx, 'thỏ');
    assert.strictEqual(m.savedRev, 2, 'rev 2 phải được gửi tiếp');
    assert.strictEqual(srv.saves.length, 2);
  },

  async 'HTTP 500 / mất mạng / phản hồi HTML: giữ chưa lưu và thử lại theo backoff'() {
    for (const mode of ['http500', 'neterr', 'html']) {
      const srv = server(); srv.mode = mode;
      const ctx = boot(new Map(), srv.fetch); run(ctx, 'Cloud.init()');
      earn(ctx, 'Thỏ', 10);
      await sleep(50);
      assert.strictEqual(srv.saves.length, 1, mode);
      assert.ok(run(ctx, 'Cloud._unsaved("Thỏ")'), mode + ': phải còn chưa lưu');
      assert.ok(!meta(ctx, 'thỏ').lastPush, mode + ': không được ghi lastPush');
      await sleep(60);
      assert.strictEqual(srv.saves.length, 1, mode + ': chưa tới mốc thử lại thì không gửi');
      srv.mode = 'ok';
      await sleep(120);                         // mốc 150ms
      assert.strictEqual(srv.saves.length, 2, mode + ': thử lại sau backoff');
      assert.ok(!run(ctx, 'Cloud._unsaved("Thỏ")'), mode + ': thử lại thành công → đã lưu');
    }
  },

  async 'lỗi liên tục: khoảng chờ tăng dần, không gửi dồn dập'() {
    const srv = server(); srv.mode = 'http500';
    const ctx = boot(new Map(), srv.fetch); run(ctx, 'Cloud.init()');
    earn(ctx, 'Thỏ', 10);
    await sleep(1100);                          // 20 + 150 + 300 + 500 = 970ms → 4 lần
    assert.ok(srv.saves.length === 4, 'số lần gửi: ' + srv.saves.length);
  },

  async 'tải lại trang khi còn chưa lưu → tự gửi lại'() {
    const store = new Map();
    const srv = server(); srv.mode = 'neterr';
    let ctx = boot(store, srv.fetch); run(ctx, 'Cloud.init()');
    earn(ctx, 'Thỏ', 10);
    await sleep(40);
    assert.ok(run(ctx, 'Cloud._unsaved("Thỏ")'));
    run(ctx, 'clearTimeout(Cloud._timer)');     // "đóng tab"
    srv.mode = 'ok'; srv.saves.length = 0;
    const ctx2 = boot(store, srv.fetch);        // mở lại, cùng localStorage
    run(ctx2, 'Cloud.init()');
    await sleep(100);
    assert.ok(srv.saves.some(b => b.key === 'thỏ'), 'phải gửi lại sau khi tải trang');
    assert.ok(!run(ctx2, 'Cloud._unsaved("Thỏ")'));
  },

  async 'đổi bé giữa lúc gửi: xác nhận đúng bé, đúng rev'() {
    const srv = server(); srv.delay = 80;
    const ctx = boot(new Map(), srv.fetch); run(ctx, 'Cloud.init()');
    earn(ctx, 'Thỏ', 10);
    await sleep(40);                            // đang gửi Thỏ rev 1
    earn(ctx, 'Coca', 7);                       // đổi sang Coca, Coca rev 1
    await sleep(110);                           // lượt Thỏ (xong ở ~100ms) đã xác nhận
    assert.strictEqual(meta(ctx, 'thỏ').savedRev, 1);
    assert.ok(!meta(ctx, 'coca').savedRev, 'Coca chưa được gửi thì chưa được đánh dấu');
    assert.strictEqual(srv.saves[0].key, 'thỏ');
    assert.strictEqual(srv.saves[0].meta.p, 10);
    await sleep(1300);
    assert.strictEqual(meta(ctx, 'coca').savedRev, 1, 'Coca được gửi ở lượt sau');
    assert.strictEqual(srv.rows['coca'].meta.p, 7);
  },

  async 'beacon không đánh dấu đã lưu'() {
    const srv = server(); srv.mode = 'neterr';
    const ctx = boot(new Map(), srv.fetch); run(ctx, 'Cloud.init()');
    earn(ctx, 'Thỏ', 10);
    run(ctx, 'Cloud._beacon()');
    assert.strictEqual(ctx.beacons.length, 1);
    assert.ok(run(ctx, 'Cloud._unsaved("Thỏ")'));
    run(ctx, 'clearTimeout(Cloud._timer)');
  },

  async 'máy chủ trả older: đánh dấu xung đột, không gửi lại liên tục'() {
    const srv = server();
    srv.rows['thỏ'] = { snapshot: { v: 1, name: 'Thỏ', keys: {} }, meta: { p: 999 } };
    const ctx = boot(new Map(), srv.fetch); run(ctx, 'Cloud.init()');
    earn(ctx, 'Thỏ', 10);
    await sleep(600);
    assert.strictEqual(srv.saves.length, 1);
    assert.ok(meta(ctx, 'thỏ').conflict, 'phải ghi nhận xung đột');
    assert.ok(run(ctx, 'Cloud._unsaved("Thỏ")'), 'vẫn là chưa lưu');
    assert.strictEqual(run(ctx, 'Cloud._pendingNames().length'), 0);
    run(ctx, 'Cloud._beacon()');
    assert.strictEqual(ctx.beacons.length, 0, 'không beacon khi đang xung đột');
  },

  async 'lấy bản mạng về: coi như đã đồng bộ, làm mới giao diện không tạo rev mới'() {
    const srv = server();
    // máy khác đã lưu bản tiến xa hơn
    const other = boot(new Map(), srv.fetch); run(other, 'Cloud.init()');
    earn(other, 'Thỏ', 200, 30);
    await sleep(60);
    assert.ok(srv.rows['thỏ']);
    const ctx = boot(new Map(), srv.fetch, {});
    // giả lập Rewards.updateUI có gọi Storage.save
    run(ctx, 'window.Rewards = { updateUI(){ Storage.save(Storage.load()); } }');
    run(ctx, 'Storage.switchPlayer("Thỏ")');
    run(ctx, 'Cloud.init()');
    await sleep(60);
    const m = meta(ctx, 'thỏ');
    assert.strictEqual(m.lastPull > 0, true, 'phải lấy bản mạng về');
    assert.ok(!run(ctx, 'Cloud._unsaved("Thỏ")'), 'sau khi lấy về không được coi là thay đổi mới');
    assert.strictEqual(JSON.parse(ctx.localStorage.getItem('khoBaiTap_profile_thỏ')).stars, 30);
  },

  async 'máy dùng bản web cũ: thay đổi sau lần gửi cuối → chưa lưu'() {
    const store = new Map();
    store.set('khoBaiTap_cloudmeta::thỏ', JSON.stringify({ lastChange: 2000, lastPush: 1000 }));
    store.set('khoBaiTap_cloudmeta::coca', JSON.stringify({ lastChange: 1000, lastPush: 2000 }));
    const ctx = boot(store, server().fetch);
    run(ctx, 'Cloud._migrateMeta()');
    assert.ok(run(ctx, 'Cloud._unsaved("thỏ")'));
    assert.ok(!run(ctx, 'Cloud._unsaved("coca")'));
  },

  async 'bản trên mạng y hệt máy → đánh dấu đã lưu, không gửi'() {
    const srv = server();
    const ctx = boot(new Map(), srv.fetch); run(ctx, 'Cloud.init()');
    earn(ctx, 'Thỏ', 10);
    await sleep(60);
    const n = srv.saves.length;
    run(ctx, 'Cloud._setMeta("Thỏ", { localRev: 5 })');   // giả sử beacon đã lưu nhưng máy không biết
    run(ctx, 'clearTimeout(Cloud._timer)');
    const r = await run(ctx, 'Cloud.sync("Thỏ")');
    assert.strictEqual(r, 'same');
    assert.ok(!run(ctx, 'Cloud._unsaved("Thỏ")'));
    assert.strictEqual(srv.saves.length, n);
  },
  async 'mở file sao lưu gặp HTTP 500 → tự thử lại, vẫn là ghi đè (force)'() {
    const srv = server(); srv.mode = 'http500';
    srv.rows['thỏ'] = { snapshot: { v: 1, name: 'Thỏ', keys: {} }, meta: { p: 999 } }; // trên mạng "tiến xa hơn"
    const ctx = boot(new Map(), srv.fetch); run(ctx, 'Cloud.init()');
    const file = JSON.stringify({ v: 1, name: 'Thỏ', at: 1, keys: { '@profile': JSON.stringify({ playerName: 'Thỏ', xp: 50, stars: 4, level: 1 }) } });
    ctx.__file = { text: async () => file };
    await run(ctx, 'Cloud.openFile(__file)');
    assert.strictEqual(srv.saves.length, 1); assert.strictEqual(srv.saves[0].force, true);
    assert.ok(run(ctx, 'Cloud._unsaved("Thỏ")'));
    assert.strictEqual(run(ctx, 'Cloud._fail'), 1);
    srv.mode = 'ok';
    await sleep(200);                           // không thao tác gì thêm, không tải lại
    assert.strictEqual(srv.saves.length, 2, 'phải tự thử lại');
    assert.strictEqual(srv.saves[1].force, true, 'lần thử lại vẫn là ghi đè');
    assert.ok(!run(ctx, 'Cloud._unsaved("Thỏ")'));
    assert.strictEqual(srv.rows['thỏ'].meta.p, 50);
    assert.ok(!meta(ctx, 'thỏ').forceRev, 'ghi đè xong thì xoá ý định');
  },

  async 'nút Sao lưu ngay gặp lỗi → tự thử lại'() {
    const srv = server();
    const ctx = boot(new Map(), srv.fetch); run(ctx, 'Cloud.init()');
    earn(ctx, 'Thỏ', 10);
    run(ctx, 'clearTimeout(Cloud._timer)');     // bỏ lượt tự động, chỉ còn nút bấm
    srv.mode = 'html';
    const r = await run(ctx, 'Cloud.push("Thỏ")');
    assert.strictEqual(r.ok, false);
    srv.mode = 'ok';
    await sleep(200);
    assert.strictEqual(srv.saves.length, 2);
    assert.ok(!run(ctx, 'Cloud._unsaved("Thỏ")'));
  },

  async 'sync gửi lên gặp lỗi mạng → tự thử lại'() {
    const srv = server();
    const store = new Map();
    const ctx0 = boot(store, srv.fetch); run(ctx0, 'Cloud.init()');
    earn(ctx0, 'Thỏ', 10);                      // có dữ liệu trên máy, chưa gửi
    run(ctx0, 'clearTimeout(Cloud._timer)');
    srv.mode = 'neterr';
    const ctx = boot(store, srv.fetch);
    run(ctx, 'Cloud.DEBOUNCE_MS = 100000');     // bỏ lượt tự động lúc init, chỉ còn sync
    run(ctx, 'Cloud.init()');
    await sleep(30);
    assert.strictEqual(srv.saves.length, 1, 'sync đã thử gửi 1 lần');
    srv.mode = 'ok';
    await sleep(200);
    assert.strictEqual(srv.saves.length, 2, 'phải tự thử lại sau lỗi của sync');
    assert.ok(!run(ctx, 'Cloud._unsaved("Thỏ")'));
  },

  async 'lượt tự động lỗi chỉ tăng backoff 1 lần'() {
    const srv = server(); srv.mode = 'http500';
    const ctx = boot(new Map(), srv.fetch); run(ctx, 'Cloud.init()');
    earn(ctx, 'Thỏ', 10);
    await sleep(60);
    assert.strictEqual(run(ctx, 'Cloud._fail'), 1);
    run(ctx, 'clearTimeout(Cloud._timer)');
  },
};

(async () => {
  let fail = 0;
  for (const [name, fn] of Object.entries(tests)) {
    try { await fn(); console.log('✔', name); }
    catch (e) { fail++; console.log('✘', name, '\n   ', e.message); }
  }
  await sleep(50);
  console.log(fail ? fail + ' lỗi' : 'Tất cả đạt');
  process.exit(fail ? 1 : 0);
})();
