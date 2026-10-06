// Kiểm thử sao lưu / đồng bộ (js/cloud.js) với máy chủ là CHÍNH file backup-apps-script/Code.gs
// chạy trên Google Sheet giả lập. Mỗi "máy" là một localStorage riêng.
// Chạy: node tests/cloud.test.js   (Node 18+, không cần cài gì thêm)
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const REPO = process.argv[2] || path.join(__dirname, '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));

// ─── Google Apps Script giả lập ───────────────────────
function makeSheet() {
  const sh = { rows: [] };
  const empty = v => v === '' || v == null;
  sh.appendRow = a => { sh.rows.push(a.slice()); };
  sh.setFrozenRows = () => {};
  sh.getLastRow = () => { for (let i = sh.rows.length - 1; i >= 0; i--) if ((sh.rows[i] || []).some(v => !empty(v))) return i + 1; return 0; };
  sh.getLastColumn = () => { let m = 0; sh.rows.forEach(r => { for (let j = (r || []).length - 1; j >= 0; j--) if (!empty(r[j])) { m = Math.max(m, j + 1); break; } }); return m; };
  sh.deleteRows = (start, n) => { sh.rows.splice(start - 1, n); };
  sh.getRange = (r, c, nr, nc) => ({
    getValues() {
      const out = [];
      for (let i = 0; i < nr; i++) { const row = sh.rows[r - 1 + i] || []; const o = []; for (let j = 0; j < nc; j++) o.push(empty(row[c - 1 + j]) ? '' : row[c - 1 + j]); out.push(o); }
      return out;
    },
    setValues(vals) {
      vals.forEach((v, i) => { const row = sh.rows[r - 1 + i] || (sh.rows[r - 1 + i] = []); v.forEach((x, j) => { row[c - 1 + j] = x; }); });
    },
    clearContent() {
      for (let i = 0; i < nr; i++) { const row = sh.rows[r - 1 + i]; if (row) for (let j = 0; j < nc; j++) row[c - 1 + j] = ''; }
    }
  });
  return sh;
}

function makeScript(file) {
  const sheets = {}, props = {};
  // Khoá giả lập: một lượt chạy khác (intruder) chỉ chen vào được khi KHÔNG ai giữ khoá.
  const sc = { held: false, intruder: null, flushedBeforeRelease: true, dirtyWrite: false };
  const maybeIntrude = () => {
    if (sc.intruder && !sc.held) { const f = sc.intruder; sc.intruder = null; f(); }
  };
  const g = {
    console, JSON, Date, Math, Number, String, Object, Array,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({ getSheetByName: n => sheets[n] || null, insertSheet: n => (sheets[n] = makeSheet()) }),
      flush: () => { sc.dirtyWrite = false; }
    },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ content: s, setMimeType() { return this; } }) },
    LockService: { getScriptLock: () => ({
      waitLock() { sc.held = true; },
      releaseLock() { if (sc.dirtyWrite) sc.flushedBeforeRelease = false; sc.held = false; maybeIntrude(); }
    }) },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: k => { maybeIntrude(); return k in props ? props[k] : null; },
      setProperty: (k, v) => { props[k] = String(v); }
    }) }
  };
  const origSheet = makeSheet;
  g.SpreadsheetApp.getActiveSpreadsheet = () => ({
    getSheetByName: n => sheets[n] || null,
    insertSheet: n => {
      const sh = (sheets[n] = origSheet());
      const gr = sh.getRange;
      sh.getRange = (...a) => { const r = gr(...a); const sv = r.setValues; r.setValues = v => { sc.dirtyWrite = true; return sv(v); }; return r; };
      return sh;
    }
  });
  vm.createContext(g);
  vm.runInContext(fs.readFileSync(file, 'utf8'), g);
  return Object.assign(sc, { g, sheets, props });
}

/** Máy chủ: kind 'new' = Code.gs hiện tại, 'old' = Code.gs trước khi có số phiên bản. */
function server(kind) {
  const file = kind === 'old' ? path.join(__dirname, 'fixtures', 'Code.v1.gs') : path.join(REPO, 'backup-apps-script', 'Code.gs');
  const sc = makeScript(file);
  const s = { saves: [], mode: 'ok', delay: 0, sc };
  const respond = text => ({ ok: true, status: 200, json: async () => JSON.parse(text) });
  s.get = key => JSON.parse(sc.g.doGet({ parameter: { action: 'get', key } }).content);
  s.post = body => JSON.parse(sc.g.doPost({ postData: { contents: body } }).content);
  s.fetch = async (url, init) => {
    if (!init) {
      if (s.delay) await sleep(s.delay);
      if (s.mode === 'neterr') throw new Error('offline');
      const q = Object.fromEntries(new URL(url).searchParams);
      return respond(sc.g.doGet({ parameter: q }).content);
    }
    s.saves.push(JSON.parse(init.body));
    if (s.delay) await sleep(s.delay);
    if (s.mode === 'neterr') throw new Error('offline');
    if (s.mode === 'http500') return { ok: false, status: 500, json: async () => ({}) };
    if (s.mode === 'html') return { ok: true, status: 200, json: async () => { throw new SyntaxError('Unexpected token <'); } };
    return respond(sc.g.doPost({ postData: { contents: init.body } }).content);
  };
  return s;
}

// ─── Một "máy" (trình duyệt) ──────────────────────────
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

function boot(store, srv, opts) {
  opts = opts || {};
  const ctx = { console, setTimeout, clearTimeout, Promise, JSON, Date, Math, Object, String, Number, Array, Error, Set, encodeURIComponent };
  ctx.window = ctx;
  ctx.localStorage = makeLS(store);
  ctx.beacons = [];
  ctx.navigator = { sendBeacon: (u, b) => { ctx.beacons.push(JSON.parse(b)); if (opts.deliverBeacon) srv.post(b); return true; } };
  ctx.document = { addEventListener() {}, querySelector() { return null; }, getElementById() { return null; } };
  ctx.addEventListener = () => {};
  ctx.fetch = srv.fetch;
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(REPO + '/js/storage.js', 'utf8'), ctx);
  vm.runInContext(fs.readFileSync(REPO + '/js/cloud.js', 'utf8'), ctx);
  vm.runInContext('Cloud.DEBOUNCE_MS = 20; Cloud.RETRY_MS = [150, 300, 500];', ctx);
  return ctx;
}

const meta = (ctx, n) => JSON.parse(ctx.localStorage.getItem('khoBaiTap_cloudmeta::' + n) || '{}');
const run = (ctx, code) => vm.runInContext(code, ctx);
const prof = (ctx, n) => JSON.parse(ctx.localStorage.getItem('khoBaiTap_profile_' + n) || '{}');
function earn(ctx, name, xp, stars) {
  run(ctx, `(() => { const d = Storage.switchPlayer(${JSON.stringify(name)}); d.xp = (d.xp||0) + ${xp}; d.stars = (d.stars||0) + ${stars || 0}; Storage.save(d); })()`);
}
function buySticker(ctx, name, id, cost) {
  run(ctx, `(() => { const d = Storage.switchPlayer(${JSON.stringify(name)}); d.stars -= ${cost}; d.inventory = (d.inventory||[]).concat(${JSON.stringify(id)}); Storage.save(d); })()`);
}
const stop = ctx => run(ctx, 'clearTimeout(Cloud._timer)');
/** Hai máy A, B cùng bé Thỏ, đã đồng bộ cùng 1 bản (xp 100, 20 sao). */
async function twoSyncedDevices(srv) {
  const A = boot(new Map(), srv); run(A, 'Cloud.init()');
  earn(A, 'Thỏ', 100, 20);
  await sleep(60);
  const B = boot(new Map(), srv); run(B, 'Storage.switchPlayer("Thỏ")'); run(B, 'Cloud.init()');
  await sleep(60);
  assert.strictEqual(prof(B, 'thỏ').xp, 100, 'B phải lấy được bản của A');
  return { A, B };
}

const tests = {
  // ═══ #3 — xác nhận sao lưu ═══
  async 'thay đổi trong lúc đang gửi vẫn là chưa lưu, rồi được gửi tiếp'() {
    const srv = server(); srv.delay = 80;
    const ctx = boot(new Map(), srv); run(ctx, 'Cloud.init()');
    earn(ctx, 'Thỏ', 10);
    await sleep(40);
    assert.strictEqual(srv.saves.length, 1);
    earn(ctx, 'Thỏ', 5);
    await sleep(100);
    let m = meta(ctx, 'thỏ');
    assert.strictEqual(m.savedRev, 1); assert.strictEqual(m.localRev, 2);
    await sleep(1300);
    m = meta(ctx, 'thỏ');
    assert.strictEqual(m.savedRev, 2, 'rev 2 phải được gửi tiếp');
    assert.strictEqual(srv.get('thỏ').meta.p, 15);
  },

  async 'HTTP 500 / mất mạng / phản hồi HTML: giữ chưa lưu và thử lại theo backoff'() {
    for (const mode of ['http500', 'neterr', 'html']) {
      const srv = server(); srv.mode = mode;
      const ctx = boot(new Map(), srv); run(ctx, 'Cloud.init()');
      earn(ctx, 'Thỏ', 10);
      await sleep(50);
      assert.strictEqual(srv.saves.length, 1, mode);
      assert.ok(run(ctx, 'Cloud._unsaved("Thỏ")'), mode + ': phải còn chưa lưu');
      assert.ok(!meta(ctx, 'thỏ').lastPush, mode + ': không được ghi lastPush');
      await sleep(60);
      assert.strictEqual(srv.saves.length, 1, mode + ': chưa tới mốc thử lại thì không gửi');
      srv.mode = 'ok';
      await sleep(150);
      assert.strictEqual(srv.saves.length, 2, mode + ': thử lại sau backoff');
      assert.ok(!run(ctx, 'Cloud._unsaved("Thỏ")'), mode + ': thử lại thành công → đã lưu');
    }
  },

  async 'lỗi liên tục: khoảng chờ tăng dần, không gửi dồn dập'() {
    const srv = server(); srv.mode = 'http500';
    const ctx = boot(new Map(), srv); run(ctx, 'Cloud.init()');
    earn(ctx, 'Thỏ', 10);
    await sleep(1100);                          // 20 + 150 + 300 + 500 = 970ms → 4 lần
    assert.strictEqual(srv.saves.length, 4);
    stop(ctx);
  },

  async 'tải lại trang khi còn chưa lưu → tự gửi lại'() {
    const store = new Map();
    const srv = server(); srv.mode = 'neterr';
    const ctx = boot(store, srv); run(ctx, 'Cloud.init()');
    earn(ctx, 'Thỏ', 10);
    await sleep(40);
    assert.ok(run(ctx, 'Cloud._unsaved("Thỏ")'));
    stop(ctx);
    srv.mode = 'ok'; srv.saves.length = 0;
    const ctx2 = boot(store, srv);
    run(ctx2, 'Cloud.init()');
    await sleep(120);
    assert.ok(srv.saves.some(b => b.key === 'thỏ'), 'phải gửi lại sau khi tải trang');
    assert.ok(!run(ctx2, 'Cloud._unsaved("Thỏ")'));
  },

  async 'đổi bé giữa lúc gửi: xác nhận đúng bé, đúng rev'() {
    const srv = server(); srv.delay = 80;
    const ctx = boot(new Map(), srv); run(ctx, 'Cloud.init()');
    earn(ctx, 'Thỏ', 10);
    await sleep(40);
    earn(ctx, 'Coca', 7);
    await sleep(110);
    assert.strictEqual(meta(ctx, 'thỏ').savedRev, 1);
    assert.ok(!meta(ctx, 'coca').savedRev, 'Coca chưa được gửi thì chưa được đánh dấu');
    assert.strictEqual(srv.saves[0].key, 'thỏ');
    assert.strictEqual(srv.saves[0].meta.p, 10);
    await sleep(1300);
    assert.strictEqual(meta(ctx, 'coca').savedRev, 1, 'Coca được gửi ở lượt sau');
    assert.strictEqual(srv.get('coca').meta.p, 7);
  },

  async 'beacon không đánh dấu đã lưu'() {
    const srv = server(); srv.mode = 'neterr';
    const ctx = boot(new Map(), srv); run(ctx, 'Cloud.init()');
    earn(ctx, 'Thỏ', 10);
    run(ctx, 'Cloud._beacon()');
    assert.strictEqual(ctx.beacons.length, 1);
    assert.ok(run(ctx, 'Cloud._unsaved("Thỏ")'));
    stop(ctx);
  },

  async 'lấy bản mạng về: coi như đã đồng bộ, làm mới giao diện không tạo rev mới'() {
    const srv = server();
    const other = boot(new Map(), srv); run(other, 'Cloud.init()');
    earn(other, 'Thỏ', 200, 30);
    await sleep(60);
    const ctx = boot(new Map(), srv);
    run(ctx, 'window.Rewards = { updateUI(){ Storage.save(Storage.load()); } }');   // giao diện có gọi Storage.save
    run(ctx, 'Storage.switchPlayer("Thỏ")');
    run(ctx, 'Cloud.init()');
    await sleep(60);
    assert.ok(meta(ctx, 'thỏ').lastPull > 0, 'phải lấy bản mạng về');
    assert.ok(!run(ctx, 'Cloud._unsaved("Thỏ")'), 'sau khi lấy về không được coi là thay đổi mới');
    assert.strictEqual(prof(ctx, 'thỏ').stars, 30);
  },

  async 'máy dùng bản web cũ: thay đổi sau lần gửi cuối → chưa lưu'() {
    const store = new Map();
    store.set('khoBaiTap_cloudmeta::thỏ', JSON.stringify({ lastChange: 2000, lastPush: 1000 }));
    store.set('khoBaiTap_cloudmeta::coca', JSON.stringify({ lastChange: 1000, lastPush: 2000 }));
    const ctx = boot(store, server());
    run(ctx, 'Cloud._migrateMeta()');
    assert.ok(run(ctx, 'Cloud._unsaved("thỏ")'));
    assert.ok(!run(ctx, 'Cloud._unsaved("coca")'));
  },

  async 'bản trên mạng y hệt máy → đánh dấu đã lưu, không gửi'() {
    const srv = server();
    const ctx = boot(new Map(), srv); run(ctx, 'Cloud.init()');
    earn(ctx, 'Thỏ', 10);
    await sleep(60);
    const n = srv.saves.length;
    run(ctx, 'Cloud._setMeta("Thỏ", { localRev: 5 })');
    stop(ctx);
    const r = await run(ctx, 'Cloud.sync("Thỏ")');
    assert.strictEqual(r, 'same');
    assert.ok(!run(ctx, 'Cloud._unsaved("Thỏ")'));
    assert.strictEqual(srv.saves.length, n);
  },

  async 'mở file sao lưu gặp HTTP 500 → tự thử lại, vẫn là ghi đè (force)'() {
    const srv = server();
    const { A } = await twoSyncedDevices(srv);
    earn(A, 'Thỏ', 900);                        // trên mạng tiến xa hơn file
    await sleep(60);
    srv.mode = 'http500';
    const file = JSON.stringify({ v: 1, name: 'Thỏ', at: 1, keys: { '@profile': JSON.stringify({ playerName: 'Thỏ', xp: 50, stars: 4, level: 1 }) } });
    A.__file = { text: async () => file };
    const before = srv.saves.length;
    await run(A, 'Cloud.openFile(__file)');
    assert.strictEqual(srv.saves.length, before + 1); assert.strictEqual(srv.saves.at(-1).force, true);
    assert.ok(run(A, 'Cloud._unsaved("Thỏ")'));
    srv.mode = 'ok';
    await sleep(200);
    assert.strictEqual(srv.saves.at(-1).force, true, 'lần thử lại vẫn là ghi đè');
    assert.ok(!run(A, 'Cloud._unsaved("Thỏ")'));
    assert.strictEqual(srv.get('thỏ').meta.p, 50);
    assert.ok(!meta(A, 'thỏ').forceRev, 'ghi đè xong thì xoá ý định');
  },

  async 'nút Sao lưu ngay gặp lỗi → tự thử lại'() {
    const srv = server();
    const ctx = boot(new Map(), srv); run(ctx, 'Cloud.init()');
    earn(ctx, 'Thỏ', 10);
    stop(ctx);
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
    const ctx0 = boot(store, srv); run(ctx0, 'Cloud.init()');
    earn(ctx0, 'Thỏ', 10);
    stop(ctx0);
    const ctx = boot(store, srv);
    run(ctx, 'Cloud.DEBOUNCE_MS = 100000');
    srv.mode = 'ok';
    // GET thành công, POST lỗi
    const realFetch = srv.fetch;
    ctx.fetch = async (u, init) => { if (init && srv.mode === 'postfail') throw new Error('offline'); return realFetch(u, init); };
    srv.mode = 'postfail';
    run(ctx, 'Cloud.init()');
    await sleep(30);
    srv.mode = 'ok';
    await sleep(200);
    assert.ok(srv.saves.length >= 1 && srv.get('thỏ').found, 'phải tự thử lại sau lỗi của sync');
    assert.ok(!run(ctx, 'Cloud._unsaved("Thỏ")'));
  },

  async 'lượt tự động lỗi chỉ tăng backoff 1 lần'() {
    const srv = server(); srv.mode = 'http500';
    const ctx = boot(new Map(), srv); run(ctx, 'Cloud.init()');
    earn(ctx, 'Thỏ', 10);
    await sleep(60);
    assert.strictEqual(run(ctx, 'Cloud._fail'), 1);
    stop(ctx);
  },

  // ═══ #2A — đồng bộ có bảo toàn dữ liệu ═══
  async 'máy sạch (không còn thay đổi) → tự lấy bản mạng mới hơn'() {
    const srv = server();
    const { A, B } = await twoSyncedDevices(srv);
    earn(A, 'Thỏ', 30, 5);
    await sleep(60);
    const r = await run(B, 'Cloud.sync("Thỏ", { silent: true })');
    assert.strictEqual(r, 'pulled');
    assert.strictEqual(prof(B, 'thỏ').xp, 130);
  },

  async 'máy còn thay đổi chưa lưu + bản mạng đã đổi → xung đột, KHÔNG kéo đè, cất bản máy'() {
    const srv = server();
    const { A, B } = await twoSyncedDevices(srv);
    srv.mode = 'neterr';
    earn(B, 'Thỏ', 7, 1);                       // B học lúc mất mạng
    await sleep(50); stop(B);
    srv.mode = 'ok';
    earn(A, 'Thỏ', 30, 5);                      // A học và lưu
    await sleep(60);
    const r = await run(B, 'Cloud.sync("Thỏ", { silent: true })');
    assert.strictEqual(r, 'conflict');
    assert.strictEqual(prof(B, 'thỏ').xp, 107, 'bản máy B còn nguyên');
    assert.strictEqual(srv.get('thỏ').meta.p, 130, 'bản mạng của A còn nguyên');
    assert.ok(B.localStorage.getItem('khoBaiTap_conflict::thỏ'), 'đã cất bản máy');
    assert.ok(!Object.keys(run(B, 'Cloud.collect("Thỏ")').keys).some(k => k.includes('conflict')), 'khoá conflict không nằm trong snapshot');
    assert.strictEqual(run(B, 'Cloud._pendingNames().length'), 0, 'ngừng tự gửi');
    run(B, 'Cloud._beacon()');
    assert.strictEqual(B.beacons.length, 0, 'không beacon khi xung đột');
  },

  async 'xung đột không phụ thuộc XP: máy nhiều XP hơn cũng không được đè (máy chủ chặn trong khoá)'() {
    const srv = server();
    const { A, B } = await twoSyncedDevices(srv);
    buySticker(A, 'Thỏ', 'dino-1', 10);        // A: XP giữ nguyên 100, mua sticker
    await sleep(60);
    assert.strictEqual(srv.get('thỏ').ver, 2);    // A lưu lần 1 (ver 1), mua sticker (ver 2)
    earn(B, 'Thỏ', 5);                          // B: XP 105 > 100, gửi với baseVer cũ
    await sleep(120);
    const s = srv.get('thỏ');
    assert.deepStrictEqual(JSON.parse(s.snapshot.keys['@profile']).inventory, ['dino-1'], 'sticker A mua không bị mất');
    assert.ok(meta(B, 'thỏ').conflict, 'B phải vào trạng thái xung đột');
    assert.strictEqual(prof(B, 'thỏ').xp, 105, 'bản B còn nguyên');
  },

  async 'hai máy gửi cùng lúc cùng baseVer → máy chủ chỉ nhận 1, máy kia bị từ chối'() {
    const srv = server();
    const { A, B } = await twoSyncedDevices(srv);
    stop(A); stop(B);
    run(A, '(() => { const d = Storage.load(); d.xp += 1; localStorage.setItem(Storage.profileKey("Thỏ"), JSON.stringify(d)); Cloud._bumpRev("Thỏ"); })()');
    run(B, '(() => { const d = Storage.load(); d.xp += 2; localStorage.setItem(Storage.profileKey("Thỏ"), JSON.stringify(d)); Cloud._bumpRev("Thỏ"); })()');
    const [ra, rb] = await Promise.all([run(A, 'Cloud.push("Thỏ")'), run(B, 'Cloud.push("Thỏ")')]);
    assert.strictEqual([ra, rb].filter(r => r.ok).length, 1);
    assert.strictEqual([ra, rb].filter(r => r.reason === 'conflict').length, 1);
  },

  async 'bé học thêm sau lúc phát hiện xung đột → "Giữ bản máy này" gửi cả phần học thêm'() {
    const srv = server();
    const { A, B } = await twoSyncedDevices(srv);
    srv.mode = 'neterr'; earn(B, 'Thỏ', 7); await sleep(50); stop(B); srv.mode = 'ok';
    earn(A, 'Thỏ', 30); await sleep(60);
    assert.strictEqual(await run(B, 'Cloud.sync("Thỏ", { silent: true })'), 'conflict');
    earn(B, 'Thỏ', 4, 2);                        // học tiếp trên B
    await sleep(60);
    assert.strictEqual(srv.get('thỏ').meta.p, 130, 'trong lúc xung đột B không tự gửi');
    const r = await run(B, 'Cloud.resolveKeepLocal("Thỏ")');
    assert.ok(r.ok);
    assert.strictEqual(srv.get('thỏ').meta.p, 111, 'trên mạng là bản B gồm cả phần học thêm');
    assert.ok(!meta(B, 'thỏ').conflict);
    assert.ok(!B.localStorage.getItem('khoBaiTap_conflict::thỏ'), 'xong thì xoá bản cất');
  },

  async '"Lấy bản trên mạng" → bản B (gồm phần học thêm) được cất, khôi phục lại được'() {
    const srv = server();
    const { A, B } = await twoSyncedDevices(srv);
    srv.mode = 'neterr'; earn(B, 'Thỏ', 7); await sleep(50); stop(B); srv.mode = 'ok';
    earn(A, 'Thỏ', 30); await sleep(60);
    await run(B, 'Cloud.sync("Thỏ", { silent: true })');
    earn(B, 'Thỏ', 4); stop(B);                  // học thêm sau khi phát hiện
    const r = await run(B, 'Cloud.resolveTakeRemote("Thỏ")');
    assert.ok(r.ok);
    assert.strictEqual(prof(B, 'thỏ').xp, 130, 'máy B giờ là bản A');
    const list = run(B, 'Cloud._backups("Thỏ")');
    assert.strictEqual(list.length, 1);
    assert.strictEqual(JSON.parse(list[0].snapshot.keys['@profile']).xp, 111, 'bản cất có cả phần học thêm');
    assert.ok(!run(B, 'Cloud._unsaved("Thỏ")'));
    const rr = await run(B, 'Cloud.restoreBackup("Thỏ", ' + JSON.stringify(list[0].id) + ')');
    assert.ok(rr.ok);
    assert.strictEqual(srv.get('thỏ').meta.p, 111);
  },

  async 'đang chờ gửi ghi đè (forceRev) → sync KHÔNG kéo bản mạng đè lên'() {
    const srv = server();
    const { A, B } = await twoSyncedDevices(srv);
    earn(A, 'Thỏ', 500); await sleep(60);       // trên mạng tiến xa
    srv.mode = 'http500';
    const file = JSON.stringify({ v: 1, name: 'Thỏ', at: 1, keys: { '@profile': JSON.stringify({ playerName: 'Thỏ', xp: 42, stars: 1, level: 1 }) } });
    B.__file = { text: async () => file };
    await run(B, 'Cloud.openFile(__file)');      // bố mẹ khôi phục file, gửi lỗi
    srv.mode = 'ok';
    const r = await run(B, 'Cloud.sync("Thỏ", { silent: true })');
    assert.strictEqual(r, 'force-pending');
    assert.strictEqual(prof(B, 'thỏ').xp, 42, 'bản bố mẹ chọn còn nguyên');
    await sleep(250);
    assert.strictEqual(srv.get('thỏ').meta.p, 42, 'lần thử lại ghi đè thành công');
  },

  async 'beacon của chính máy đã lên (ver tăng) → không bị coi là xung đột'() {
    const srv = server();
    const { B } = await twoSyncedDevices(srv);
    stop(B);
    B.navigator.sendBeacon = (u, b) => { srv.post(b); return true; };   // beacon lên được nhưng máy không biết
    run(B, '(() => { const d = Storage.load(); d.xp += 3; localStorage.setItem(Storage.profileKey("Thỏ"), JSON.stringify(d)); Cloud._bumpRev("Thỏ"); })()');
    run(B, 'Cloud._beacon()');
    const v = srv.get('thỏ').ver;
    earn(B, 'Thỏ', 2);                           // bé học tiếp → gửi với baseVer cũ → máy chủ từ chối → sync đối chiếu
    await sleep(200);
    assert.ok(!meta(B, 'thỏ').conflict, 'không được báo xung đột');
    assert.strictEqual(srv.get('thỏ').meta.p, 105);
    assert.ok(srv.get('thỏ').ver > v);
  },

  async 'sang ngày mới chỉ đổi kế hoạch hôm nay → không phải xung đột, lấy bản mạng'() {
    const srv = server();
    const { A, B } = await twoSyncedDevices(srv);
    earn(A, 'Thỏ', 30); await sleep(60);
    run(B, 'Storage.set("todayPlan", { date: "2099-01-01", tasks: [] })');   // web tự tạo kế hoạch ngày
    run(B, 'Storage.set("lastGrade", "lop3")');
    stop(B);
    const r = await run(B, 'Cloud.sync("Thỏ", { silent: true })');
    assert.strictEqual(r, 'pulled');
    assert.strictEqual(prof(B, 'thỏ').xp, 130);
  },

  async 'dữ liệu ghi thẳng localStorage (không qua schedule) vẫn được bảo toàn khi bản mạng đổi'() {
    const srv = server();
    const { A, B } = await twoSyncedDevices(srv);
    earn(A, 'Thỏ', 30); await sleep(60);
    B.localStorage.setItem('khoBaiTap_wrong_history_v1::thỏ', JSON.stringify([{ q: 'x', at: 1 }]));
    const r = await run(B, 'Cloud.sync("Thỏ", { silent: true })');
    assert.strictEqual(r, 'conflict');
    assert.ok(B.localStorage.getItem('khoBaiTap_wrong_history_v1::thỏ'));
  },

  async 'máy mới chưa có gì → lấy bản mạng, không báo xung đột'() {
    const srv = server();
    await twoSyncedDevices(srv);
    const C = boot(new Map(), srv);
    run(C, 'Cloud.init()');
    run(C, '(() => { const d = Storage.switchPlayer("Thỏ"); Storage.save(d); })()');   // nhập tên → có lưu hồ sơ trống
    const r = await run(C, 'Cloud.sync("Thỏ")');
    assert.strictEqual(r, 'pulled');
    assert.strictEqual(prof(C, 'thỏ').xp, 100);
  },

  async 'máy chủ CŨ (chưa triển khai lại Code.gs): vẫn không kéo đè khi còn thay đổi chưa lưu'() {
    const srv = server('old');
    const { A, B } = await twoSyncedDevices(srv);
    srv.mode = 'neterr'; earn(B, 'Thỏ', 7); await sleep(50); stop(B); srv.mode = 'ok';
    earn(A, 'Thỏ', 30); await sleep(60);
    assert.strictEqual(await run(B, 'Cloud.sync("Thỏ", { silent: true })'), 'conflict');
    assert.strictEqual(prof(B, 'thỏ').xp, 107);
    // máy sạch thì vẫn lấy về như trước
    const C = boot(new Map(), srv); run(C, 'Storage.switchPlayer("Thỏ")'); run(C, 'Cloud.init()');
    await sleep(60);
    assert.strictEqual(prof(C, 'thỏ').xp, 130);
  },

  async 'hết xung đột khi hai bản giống nhau trở lại'() {
    const srv = server();
    const { A, B } = await twoSyncedDevices(srv);
    srv.mode = 'neterr'; earn(B, 'Thỏ', 7); await sleep(50); stop(B); srv.mode = 'ok';
    earn(A, 'Thỏ', 30); await sleep(60);
    await run(B, 'Cloud.sync("Thỏ", { silent: true })');
    assert.ok(meta(B, 'thỏ').conflict);
    // ví dụ: bố mẹ chép đúng bản B lên từ máy khác
    srv.post(JSON.stringify({ action: 'save', key: 'thỏ', force: true, meta: run(B, 'Cloud.summary(Cloud.collect("Thỏ"))'), snapshot: run(B, 'Cloud.collect("Thỏ")') }));
    assert.strictEqual(await run(B, 'Cloud.sync("Thỏ", { silent: true })'), 'same');
    assert.ok(!meta(B, 'thỏ').conflict);
    assert.ok(!B.localStorage.getItem('khoBaiTap_conflict::thỏ'));
  },
  // ═══ Góp ý của Codex sau #2A ═══
  async 'GET bị một POST chen vào giữa: snapshot và ver luôn khớp nhau'() {
    const srv = server();
    const { A } = await twoSyncedDevices(srv);
    const before = srv.get('thỏ');
    const intruderSnap = run(A, '(() => { const s = Cloud.collect("Thỏ"); const p = JSON.parse(s.keys["@profile"]); p.xp = 999; s.keys["@profile"] = JSON.stringify(p); return s; })()');
    srv.sc.intruder = () => srv.post(JSON.stringify({ action: 'save', key: 'thỏ', baseVer: before.ver, meta: { p: 999 }, snapshot: intruderSnap }));
    const got = srv.get('thỏ');                  // POST chen vào lúc GET đang chạy (nếu GET không giữ khoá)
    const xp = JSON.parse(got.snapshot.keys['@profile']).xp;
    if (got.ver === before.ver) assert.strictEqual(xp, 100, 'ver cũ phải đi với bản cũ');
    else { assert.strictEqual(got.ver, before.ver + 1); assert.strictEqual(xp, 999, 'ver mới phải đi với bản mới'); }
    assert.strictEqual(srv.sc.intruder, null, 'POST chen ngang đã chạy');
    assert.strictEqual(srv.get('thỏ').ver, before.ver + 1);
  },

  async 'POST ghi Sheet xong (flush) rồi mới nhả khoá'() {
    const srv = server();
    await twoSyncedDevices(srv);
    assert.strictEqual(srv.sc.flushedBeforeRelease, true);
  },

  async 'Lấy bản mạng → sync/tải lại trang → vẫn còn bản cất và khôi phục được'() {
    const srv = server();
    const store = new Map();
    const { A } = await twoSyncedDevices(srv);
    const B = boot(store, srv); run(B, 'Storage.switchPlayer("Thỏ")'); run(B, 'Cloud.init()'); await sleep(60);
    srv.mode = 'neterr'; earn(B, 'Thỏ', 7); await sleep(50); stop(B); srv.mode = 'ok';
    earn(A, 'Thỏ', 30); await sleep(60);
    assert.strictEqual(await run(B, 'Cloud.sync("Thỏ", { silent: true })'), 'conflict');
    assert.ok((await run(B, 'Cloud.resolveTakeRemote("Thỏ")')).ok);
    assert.strictEqual(await run(B, 'Cloud.sync("Thỏ", { silent: true })'), 'same');
    assert.strictEqual(run(B, 'Cloud._backups("Thỏ").length'), 1, 'nhánh same không được xoá bản khôi phục');
    const B2 = boot(store, srv); run(B2, 'Cloud.init()'); await sleep(60);   // tải lại trang
    const list = run(B2, 'Cloud._backups("Thỏ")');
    assert.strictEqual(list.length, 1, 'tải lại trang vẫn còn');
    assert.ok((await run(B2, 'Cloud.restoreBackup("Thỏ", ' + JSON.stringify(list[0].id) + ')')).ok);
    assert.strictEqual(srv.get('thỏ').meta.p, 107);
    assert.strictEqual(run(B2, 'Cloud._backups("Thỏ").length'), 0, 'khôi phục xong (đã lên mạng y hệt) thì tự xoá');
  },

  async 'xung đột lần sau không ghi đè bản khôi phục cũ'() {
    const srv = server();
    const { A, B } = await twoSyncedDevices(srv);
    for (const add of [7, 3]) {
      srv.mode = 'neterr'; earn(B, 'Thỏ', add); await sleep(50); stop(B); srv.mode = 'ok';
      earn(A, 'Thỏ', 30); await sleep(60);
      assert.strictEqual(await run(B, 'Cloud.sync("Thỏ", { silent: true })'), 'conflict');
      assert.ok((await run(B, 'Cloud.resolveTakeRemote("Thỏ")')).ok);
    }
    const xs = run(B, 'Cloud._backups("Thỏ")').map(b => JSON.parse(b.snapshot.keys['@profile']).xp);
    assert.strictEqual(JSON.stringify(xs), '[133,107]', 'giữ cả 2 bản khôi phục, mới nhất trước');
  },

  async 'lấy bản mạng thay hẳn dữ liệu của bé (không tạo bản lai), giữ nguyên bé khác + cloudmeta'() {
    const srv = server();
    const { A, B } = await twoSyncedDevices(srv);
    earn(A, 'Thỏ', 30); await sleep(60);
    B.localStorage.setItem('tableSpeed_v1::thỏ', '{"facts":{}}');          // B có, bản mạng không có
    run(B, 'Cloud._setMeta("Thỏ", Cloud._baseFrom(Cloud.collect("Thỏ")))'); // coi như đã đồng bộ (máy sạch)
    B.localStorage.setItem('khoBaiTap_profile_coca', '{"xp":5}');
    B.localStorage.setItem('tableSpeed_v1::coca', '{"x":1}');
    B.localStorage.setItem('rabbit_parent_pin', '1234');
    const r = await run(B, 'Cloud.sync("Thỏ", { silent: true })');
    assert.strictEqual(r, 'pulled');
    assert.strictEqual(B.localStorage.getItem('tableSpeed_v1::thỏ'), null, 'key không có trong bản mạng phải bị xoá');
    assert.strictEqual(run(B, 'Cloud._hash(Cloud.collect("Thỏ").keys)'), run(B, 'Cloud._hash(' + JSON.stringify(srv.get('thỏ').snapshot.keys) + ')'));
    assert.strictEqual(B.localStorage.getItem('tableSpeed_v1::coca'), '{"x":1}', 'dữ liệu bé khác giữ nguyên');
    assert.strictEqual(B.localStorage.getItem('khoBaiTap_profile_coca'), '{"xp":5}');
    assert.strictEqual(B.localStorage.getItem('rabbit_parent_pin'), '1234', 'PIN giữ nguyên');
    assert.ok(B.localStorage.getItem('khoBaiTap_cloudmeta::thỏ'), 'cloudmeta giữ nguyên');
  },

  async 'ghi bản mạng vào máy bị lỗi giữa chừng → máy giữ nguyên, KHÔNG đánh dấu đã đồng bộ'() {
    const srv = server();
    const { A, B } = await twoSyncedDevices(srv);
    earn(A, 'Thỏ', 30); await sleep(60);
    B.localStorage.setItem('tableSpeed_v1::thỏ', '{"facts":{"2x3":[1]}}');
    run(B, 'Cloud._setMeta("Thỏ", Cloud._baseFrom(Cloud.collect("Thỏ")))');
    const before = run(B, 'JSON.stringify(Cloud.collect("Thỏ").keys)');
    const metaBefore = JSON.stringify(meta(B, 'thỏ'));
    const ls = B.localStorage, orig = ls.setItem.bind(ls);
    ls.setItem = (k, v) => { if (k === 'khoBaiTap_profile_thỏ') throw new Error('QuotaExceededError'); return orig(k, v); };
    const r = await run(B, 'Cloud.sync("Thỏ", { silent: true })');
    ls.setItem = orig;
    assert.notStrictEqual(r, 'pulled');
    assert.strictEqual(run(B, 'JSON.stringify(Cloud.collect("Thỏ").keys)'), before, 'dữ liệu máy y nguyên');
    assert.strictEqual(JSON.stringify(meta(B, 'thỏ')), metaBefore, 'không đổi trạng thái đồng bộ');
  },

  async 'mở file sao lưu sai định dạng → từ chối, không đụng dữ liệu'() {
    const srv = server();
    const { B } = await twoSyncedDevices(srv);
    const before = run(B, 'JSON.stringify(Cloud.collect("Thỏ").keys)');
    for (const bad of [{ name: 'Thỏ', keys: { '@profile': { xp: 1 } } }, { name: 'Thỏ', keys: { 'khoBaiTap_cloudmeta': 'x' } }, { name: 'Thỏ', keys: { 'khoBaiTap_conflict::restore': '[]' } }, { name: 'Thỏ', keys: [] }]) {
      B.__file = { text: async () => JSON.stringify(bad) };
      await assert.rejects(run(B, 'Cloud.openFile(__file)'));
    }
    assert.strictEqual(run(B, 'JSON.stringify(Cloud.collect("Thỏ").keys)'), before);
  },
  async 'khôi phục xong mà giao diện tự ghi lại kế hoạch hôm nay → bản cất vẫn được tự xoá'() {
    const srv = server();
    const { A, B } = await twoSyncedDevices(srv);
    srv.mode = 'neterr'; earn(B, 'Thỏ', 7); await sleep(50); stop(B); srv.mode = 'ok';
    earn(A, 'Thỏ', 30); await sleep(60);
    await run(B, 'Cloud.sync("Thỏ", { silent: true })');
    assert.ok((await run(B, 'Cloud.resolveTakeRemote("Thỏ")')).ok);
    run(B, 'window.Today = { render(){ Storage.set("todayPlan", { date: "2099-01-02", tasks: [1] }); } }');
    const id = run(B, 'Cloud._backups("Thỏ")[0].id');
    assert.ok((await run(B, 'Cloud.restoreBackup("Thỏ", ' + JSON.stringify(id) + ')')).ok);
    assert.strictEqual(run(B, 'Cloud._backups("Thỏ").length'), 0);
  },
};

(async () => {
  let fail = 0;
  const only = process.argv[3];
  for (const [name, fn] of Object.entries(tests)) {
    if (only && !name.includes(only)) continue;
    try { await fn(); console.log('✔', name); }
    catch (e) { fail++; console.log('✘', name, '\n   ', e.message); }
    await sleep(30);
  }
  console.log(fail ? fail + ' lỗi' : 'Tất cả đạt');
  process.exit(fail ? 1 : 0);
})();
