// =============================================
// CLOUD.JS — sao lưu sao, sticker, ngọc rồng, tiến độ lên Google Sheet
// Đổi máy / xoá trình duyệt: gõ đúng tên cũ là lấy lại được.
// Thêm: tải file sao lưu / mở file sao lưu (không cần mạng).
// Chỉ coi là "đã lưu" khi máy chủ trả JSON ok:true, saved:true; lỗi thì giữ trạng thái chưa lưu và thử lại.
// Đồng bộ 2 máy: máy chủ đánh số phiên bản (ver) cho mỗi bé. Máy còn thay đổi chưa lưu mà bản trên mạng
// đã đổi kể từ lần máy biết gần nhất → XUNG ĐỘT: không tự kéo đè, cất bản máy, chờ bố mẹ chọn.
// =============================================

const Cloud = {
  // Điền URL ứng dụng web Apps Script (…/exec) của file backup-apps-script/Code.gs
  URL: 'https://script.google.com/macros/s/AKfycbxA0Br0LUEf9rKDtietHfQmYcA0GyvBf1TyOt6EXlnVK9Uj2kkcpDymJ_jgLAJ9IrnVcg/exec',
  META_PREFIX: 'khoBaiTap_cloudmeta::',
  CONFLICT_PREFIX: 'khoBaiTap_conflict::',   // bản máy được cất khi xung đột — KHÔNG đưa vào snapshot sao lưu
  DEBOUNCE_MS: 4000,
  VISIBLE_SYNC_MS: 30000,                     // tab hiện lại → đồng bộ, tối đa 1 lần / 30 giây
  _timer: null,
  _checked: {},
  _busy: false,
  _syncAgain: null,
  _lastVisibleSync: 0,

  enabled() { return !!this.URL; },
  _canon(name) { return Storage.canonName(name || Storage.getActiveName() || ''); },
  _esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },

  // ─── Gom / ghi dữ liệu của 1 bé ─────────────────────
  _ownKeys(name) {
    const c = this._canon(name);
    if (!c) return [];
    const pk = Storage.profileKey(name || Storage.getActiveName());
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || k.startsWith(this.META_PREFIX) || k.startsWith(this.CONFLICT_PREFIX)) continue;
      if (k === pk || k.endsWith('::' + c)) out.push(k);
    }
    return out;
  },

  collect(name) {
    const c = this._canon(name);
    const keys = {};
    this._ownKeys(name).forEach(k => {
      // Lưu theo "đuôi" bỏ tên để mở lại trên máy khác vẫn khớp
      const v = localStorage.getItem(k);
      if (v == null) return;
      if (k === Storage.profileKey(name || Storage.getActiveName())) keys['@profile'] = v;
      else keys[k.slice(0, -(c.length + 2))] = v;
    });
    return { v: 1, name: Storage.normalizeName(name || Storage.getActiveName()), at: this._meta(name).lastChange || 0, keys };
  },

  /** Snapshot hợp lệ: keys là object, mọi giá trị là chuỗi, không đụng khoá hệ thống của web. */
  _validSnapshot(snapshot) {
    if (!snapshot || typeof snapshot.keys !== 'object' || !snapshot.keys || Array.isArray(snapshot.keys)) return false;
    return Object.entries(snapshot.keys).every(([base, v]) =>
      typeof v === 'string' && typeof base === 'string' && base.length > 0 &&
      // base + '::<tên>' là khoá thật → không được trùng cloudmeta hay bản cất (vd. base 'khoBaiTap_cloudmeta')
      !(base + '::').startsWith(this.META_PREFIX) && !(base + '::').startsWith(this.CONFLICT_PREFIX));
  },

  /**
   * Đặt dữ liệu của 1 bé thành ĐÚNG snapshot: ghi các key có trong snapshot, xoá key dữ liệu của bé đó
   * không có trong snapshot. Không đụng cloudmeta, bản cất xung đột, PIN và dữ liệu bé khác.
   * Lỗi giữa chừng (vd. hết bộ nhớ) → trả lại nguyên trạng như trước khi gọi, trả về false.
   */
  apply(snapshot, name) {
    if (!this._validSnapshot(snapshot)) return false;
    const nm = name || snapshot.name;
    const c = this._canon(nm);
    if (!c) return false;
    const pk = Storage.profileKey(nm);
    const target = {};
    Object.entries(snapshot.keys).forEach(([base, v]) => { target[base === '@profile' ? pk : base + '::' + c] = v; });
    const before = {};
    this._ownKeys(nm).forEach(k => { before[k] = localStorage.getItem(k); });
    try {
      Object.keys(target).forEach(k => localStorage.setItem(k, target[k]));
      Object.keys(before).forEach(k => { if (!(k in target)) localStorage.removeItem(k); });
    } catch (e) {
      console.warn('Cloud.apply', e);
      // Trả lại nguyên trạng: xoá key mới thêm trước (giải phóng chỗ), rồi ghi lại giá trị cũ
      Object.keys(target).forEach(k => { if (!(k in before)) { try { localStorage.removeItem(k); } catch (x) { /* bỏ qua */ } } });
      Object.keys(before).forEach(k => { try { localStorage.setItem(k, before[k]); } catch (x) { /* bỏ qua */ } });
      return false;
    }
    try { localStorage.setItem(Storage.ACTIVE_KEY, Storage.normalizeName(nm)); } catch (e) { /* bỏ qua */ }
    return true;
  },

  /** Tóm tắt để so bản nào "tiến xa hơn": tổng XP tích luỹ không bao giờ giảm. */
  summary(snapshot) {
    let prof = {};
    try { prof = JSON.parse((snapshot.keys || {})['@profile'] || '{}') || {}; } catch (e) { prof = {}; }
    const level = Math.max(1, Number(prof.level || 1));
    let cum = Number(prof.xp || 0);
    for (let l = 1; l < level; l++) cum += 80 + (l - 1) * 30;
    let balls = 0;
    try { balls = (JSON.parse((snapshot.keys || {}).rabbit_dragonball_collection || '[]') || []).length; } catch (e) { balls = 0; }
    return {
      name: snapshot.name,
      at: snapshot.at || 0,
      p: cum,
      stars: Number(prof.stars || 0),
      stickers: Array.isArray(prof.inventory) ? prof.inventory.length : 0,
      balls
    };
  },

  _hasProgress(sum) { return sum.p > 0 || sum.stars > 0 || sum.stickers > 0 || sum.balls > 0; },

  /** Dấu vân tay nội dung (không phụ thuộc thứ tự key trong localStorage). */
  _hash(keys) {
    const s = JSON.stringify(Object.keys(keys || {}).sort().map(k => [k, keys[k]]));
    let h = 0x811c9dc5;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
    return (h >>> 0).toString(16) + ':' + s.length;
  },

  /**
   * Trường hồ sơ tự sinh lại được, KHÔNG phải tiến độ bé học: kế hoạch hôm nay, lớp/giai đoạn đang chọn,
   * huy hiệu thành tích (tính lại từ tiến độ), chuỗi đúng hiện tại. Khác nhau ở các trường này không tính là xung đột.
   */
  EPHEMERAL: ['p.todayPlan', 'p.lastGrade', 'p.stageBySubject', 'p.achievements', 'p.runNow'],

  /** Dấu vân tay từng mục: mỗi key một mã, riêng hồ sơ thì từng trường một mã. */
  _print(keys) {
    const out = {};
    const h = v => this._hash({ v: v });
    Object.keys(keys || {}).forEach(k => {
      if (k !== '@profile') { out[k] = h(keys[k]); return; }
      let prof = null;
      try { prof = JSON.parse(keys[k]); } catch (e) { prof = null; }
      if (!prof || typeof prof !== 'object') { out[k] = h(keys[k]); return; }
      Object.keys(prof).forEach(f => { out['p.' + f] = h(JSON.stringify(prof[f])); });
    });
    return out;
  },

  /** Các mục bé thật sự thay đổi so với bản đã đồng bộ gần nhất (bỏ qua trường tự sinh). */
  _changedSince(localSnap, basePrint) {
    const now = this._print(localSnap.keys);
    const skip = new Set(this.EPHEMERAL);
    const all = new Set(Object.keys(now).concat(Object.keys(basePrint || {})));
    return [...all].filter(k => !skip.has(k) && now[k] !== (basePrint || {})[k]);
  },

  /** Ghi nhận bản đang có trên máy chính là bản đã đồng bộ. */
  _baseFrom(snap) {
    return { savedHash: this._hash(snap.keys), savedPrint: this._print(snap.keys) };
  },

  _meta(name) {
    try { return JSON.parse(localStorage.getItem(this.META_PREFIX + this._canon(name)) || '{}') || {}; } catch (e) { return {}; }
  },
  _setMeta(name, patch) {
    try {
      const m = Object.assign(this._meta(name), patch);
      localStorage.setItem(this.META_PREFIX + this._canon(name), JSON.stringify(m));
    } catch (e) { /* bỏ qua */ }
  },

  // ─── Trạng thái lưu ─────────────────────────────────
  // cloudmeta của mỗi bé:
  //   localRev  = số lần dữ liệu trên máy thay đổi (tăng ở schedule()).
  //   savedRev  = localRev của bản mới nhất mà MÁY CHỦ đã xác nhận lưu (ok:true, saved:true).
  //   savedHash = dấu vân tay của bản đó (bắt cả thay đổi ghi thẳng localStorage không qua schedule()).
  //   serverVer = phiên bản trên máy chủ mà máy này đã đọc / được xác nhận gần nhất.
  //   beaconHash= dấu vân tay bản gửi bằng beacon (không biết có lên hay chưa).
  //   conflict  = { at, remoteVer, remote } khi đang xung đột; forceRev = bố mẹ đã chọn ghi đè, chờ gửi xong.
  RETRY_MS: [30000, 120000, 300000],   // lỗi mạng / HTTP / phản hồi hỏng → thử lại sau 30 giây, 2 phút, rồi 5 phút
  _fail: 0,
  _retryAt: 0,
  _pushing: false,
  _applying: false,
  _chain: Promise.resolve(),

  _unsaved(name) {
    const m = this._meta(name);
    return (m.localRev || 0) > (m.savedRev || 0);
  },

  /**
   * Máy có tiến độ CHƯA lên mạng không (dùng để quyết định có được kéo bản mạng đè lên hay không).
   * Có bản đồng bộ gần nhất (savedPrint) → so từng mục, bỏ qua trường tự sinh; bắt được cả dữ liệu
   * ghi thẳng localStorage không qua schedule(). Máy cũ chưa có savedPrint → dựa vào rev.
   */
  _dirty(name, localSnap) {
    const m = this._meta(name);
    if (!m.savedPrint) return this._unsaved(name);
    return this._changedSince(localSnap || this.collect(name), m.savedPrint).length > 0;
  },

  _bumpRev(name) {
    const m = this._meta(name);
    this._setMeta(name, { name: Storage.normalizeName(name), lastChange: Date.now(), localRev: (m.localRev || 0) + 1 });
  },

  _markSaved(name, rev, extra) {
    const m = this._meta(name);
    this._setMeta(name, Object.assign({ savedRev: Math.max(m.savedRev || 0, rev || 0) }, extra || {}));
  },

  /** Các bé trên máy còn thay đổi chưa sao lưu và nên tự gửi lại. */
  _pendingNames() {
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.startsWith(this.META_PREFIX)) continue;
      let m;
      try { m = JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { continue; }
      const rev = m.localRev || 0;
      if (rev <= (m.savedRev || 0)) continue;
      if ((m.conflict || m.needCheck) && !m.forceRev) continue; // chờ đối chiếu / bố mẹ chọn → không gửi liên tục
      if (m.stuckRev != null && rev <= m.stuckRev) continue;    // máy chủ đã từ chối đúng bản này → chờ thay đổi mới
      out.push(m.name || k.slice(this.META_PREFIX.length));
    }
    return out;
  },

  /** Máy đang dùng bản web cũ (chưa có localRev): thay đổi sau lần gửi cuối → coi là chưa lưu. */
  _migrateMeta() {
    try {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.META_PREFIX)) keys.push(k);
      }
      keys.forEach(k => {
        let m;
        try { m = JSON.parse(localStorage.getItem(k) || '{}') || {}; } catch (e) { return; }
        if (m.localRev != null) return;
        m.localRev = (m.lastChange || 0) > (m.lastPush || 0) ? 1 : 0;
        m.savedRev = 0;
        localStorage.setItem(k, JSON.stringify(m));
      });
    } catch (e) { /* bỏ qua */ }
  },

  // ─── Mạng ───────────────────────────────────────────
  async fetchRemote(name) {
    const res = await fetch(this.URL + '?action=get&key=' + encodeURIComponent(this._canon(name)) + '&t=' + Date.now());
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return res.json();
  },

  /** Gửi bản sao lưu (force = bố mẹ chủ động ghi đè). Mọi lượt gửi chạy lần lượt, không chồng nhau. */
  push(name, force) {
    return this._send(name || Storage.getActiveName(), { force: !!force });
  },

  /** Mọi đường gửi (tự động, nút Sao lưu ngay, sync, mở file) đều qua đây → cùng một chỗ xử lý kết quả và hẹn thử lại. */
  _send(name, opts) {
    const job = this._chain
      .then(() => this._sendNow(name, opts || {}))
      .then(r => { this._onResult(r, name); return r; });
    this._chain = job.catch(() => {});
    return job;
  },

  /** Lỗi tạm thời → tăng backoff 1 lần và hẹn gửi lại; gửi được → xoá backoff; máy chủ báo bản mạng đã đổi → đối chiếu. */
  _onResult(r, name) {
    if (r && r.transient) {
      this._fail++;
      this._retryAt = Date.now() + this.RETRY_MS[Math.min(this._fail, this.RETRY_MS.length) - 1];
      this._kick(0);                       // _kick tự chờ tới _retryAt
    } else if (r && r.ok && !r.skipped) {
      this._fail = 0;
      this._retryAt = 0;
    } else if (r && (r.reason === 'conflict' || r.reason === 'older')) {
      // Có thể chỉ là bản beacon của chính máy này đã lên → để sync() đối chiếu nội dung rồi mới kết luận xung đột.
      // Chặn vòng lặp sync → gửi → bị từ chối → sync: mỗi bé tối đa 1 lần / 10 giây; còn lại chờ lần đồng bộ sau.
      const k = this._canon(name);
      this._lastCheck = this._lastCheck || {};
      if (Date.now() - (this._lastCheck[k] || 0) > 10000) {
        this._lastCheck[k] = Date.now();
        this.sync(name, { silent: true });
      }
    }
  },

  async _sendNow(name, opts) {
    if (!this.enabled()) return { ok: false, error: 'off' };
    // Giữ cố định tên bé, rev và snapshot của lượt gửi này (đổi bé giữa chừng không làm xác nhận nhầm)
    const nm = Storage.normalizeName(name || '');
    if (!nm) return { ok: false, error: 'no name' };
    const m0 = this._meta(nm);
    const rev = m0.localRev || 0;
    if (opts.onlyIfUnsaved && !this._unsaved(nm)) return { ok: true, skipped: true };
    // Bố mẹ chủ động ghi đè: nhớ ý định này để nếu gửi lỗi thì lần thử lại vẫn là ghi đè (không bị đổi thành "older")
    if (opts.force) this._setMeta(nm, { forceRev: Math.max(m0.forceRev || 0, rev) });
    const snap = this.collect(nm);
    const meta = this.summary(snap);
    if (!opts.force && !this._hasProgress(meta)) {
      this._markSaved(nm, rev);                 // chưa có gì để lưu → không thử lại
      return { ok: false, error: 'empty' };
    }
    const body = { action: 'save', key: this._canon(nm), meta, snapshot: snap };
    if (opts.force) body.force = true;
    else if (typeof m0.serverVer === 'number') body.baseVer = m0.serverVer; // máy chủ chỉ nhận nếu bản mạng chưa đổi
    let res;
    try {
      res = await fetch(this.URL, { method: 'POST', body: JSON.stringify(body) });
    } catch (e) {
      console.warn('Cloud.push', e);
      return { ok: false, error: String(e), transient: true };
    }
    if (!res.ok) return { ok: false, error: 'HTTP ' + res.status, transient: true };
    let out;
    try { out = await res.json(); } catch (e) {
      // Apps Script lỗi (hết giờ chờ khoá, hết quota…) trả về trang HTML chứ không phải JSON → CHƯA lưu
      return { ok: false, error: 'bad response', transient: true };
    }
    if (out && out.ok === true && out.saved === true) {
      const extra = Object.assign({ lastPush: Date.now(), conflict: null, needCheck: null, stuckRev: null }, this._baseFrom(snap));
      if (typeof out.ver === 'number') extra.serverVer = out.ver;
      if (opts.force) extra.forceRev = null;    // yêu cầu ghi đè đã xong
      this._markSaved(nm, rev, extra);
      this._dropBackupIfSaved(nm, snap.keys);   // bản cất đã nằm nguyên trên mạng → không cần giữ nữa
      return out;
    }
    if (out && (out.reason === 'conflict' || out.reason === 'older')) {
      this._setMeta(nm, { needCheck: true });   // tạm ngừng tự gửi tới khi sync() đối chiếu xong
      return out;
    }
    // Máy chủ trả lời nhưng từ chối (quá lớn, thiếu dữ liệu…): gửi lại y nguyên cũng không được
    this._setMeta(nm, { stuckRev: rev });
    return Object.assign({}, out || {}, { ok: false, error: (out && out.error) || 'server' });
  },

  /** Hẹn lượt gửi các thay đổi chưa lưu (không sớm hơn mốc thử lại sau lỗi). */
  _kick(delay) {
    if (!this.enabled()) return;
    const wait = Math.max(delay || 0, this._retryAt - Date.now(), 0);
    clearTimeout(this._timer);
    this._timer = setTimeout(() => { this._timer = null; this._drain(); }, wait);
  },

  async _drain() {
    if (this._pushing) return;
    this._pushing = true;
    let retry = false;
    try {
      for (const nm of this._pendingNames()) {
        const r = await this._send(nm, { onlyIfUnsaved: true, force: !!this._meta(nm).forceRev });
        if (r && r.transient) { retry = true; break; }   // backoff đã được _onResult hẹn
      }
    } catch (e) {
      console.warn('Cloud._drain', e);
    } finally {
      this._pushing = false;
    }
    // Lỗi → đã hẹn theo backoff. Thành công mà vẫn còn rev mới (bé học tiếp trong lúc gửi) → gửi tiếp.
    if (!retry && this._pendingNames().length) this._kick(1000);
  },

  /** Gửi nhanh khi đóng tab / chuyển app. Không có phản hồi nên KHÔNG đánh dấu đã lưu. */
  _beacon() {
    if (!this.enabled() || !navigator.sendBeacon) return;
    const nm = Storage.getActiveName();
    if (!nm || !this._unsaved(nm)) return;
    const m = this._meta(nm);
    if (m.conflict || m.needCheck || m.forceRev) return;
    const snap = this.collect(nm);
    const meta = this.summary(snap);
    if (!this._hasProgress(meta)) return;
    const body = { action: 'save', key: this._canon(nm), meta, snapshot: snap };
    if (typeof m.serverVer === 'number') body.baseVer = m.serverVer;
    try {
      // Nhớ dấu vân tay: lần sau thấy bản này trên mạng thì biết là của chính máy mình, không phải xung đột
      this._setMeta(nm, { beaconHash: this._hash(snap.keys) });
      navigator.sendBeacon(this.URL, JSON.stringify(body));
    } catch (e) { /* bỏ qua */ }
  },

  /** Có thay đổi → tăng localRev, hẹn vài giây sau mới gửi (gom nhiều thay đổi làm 1). */
  schedule() {
    if (this._applying) return;        // đang chép bản tải về vào máy → không phải thay đổi mới
    const nm = Storage.getActiveName();
    if (!nm) return;
    this._bumpRev(nm);
    this._kick(this.DEBOUNCE_MS);
  },

  // ─── Đồng bộ ────────────────────────────────────────
  /**
   * Gọi khi mở web, khi bé nhập tên, khi tab hiện lại, và khi máy chủ báo bản mạng đã đổi.
   * Trả về: 'pulled' | 'pushed' | 'same' | 'conflict' | 'force-pending' | null (lỗi mạng).
   */
  async sync(name, opts) {
    if (!this.enabled()) return null;
    const nm = name || Storage.getActiveName();
    if (!nm) return null;
    if (this._busy) { this._syncAgain = nm; return null; }
    this._busy = true;
    let result = null;
    try {
      const r = await this.fetchRemote(nm);
      this._checked[this._canon(nm)] = true;
      if (r && r.ok) result = await this._reconcile(nm, r, opts || {});
    } catch (e) {
      console.warn('Cloud.sync', e);
    } finally {
      this._busy = false;
    }
    this._markParentLink();
    if (this._syncAgain) { const again = this._syncAgain; this._syncAgain = null; this.sync(again, { silent: true }); }
    return result;
  },

  async _reconcile(nm, r, opts) {
    const m = this._meta(nm);
    const rv = typeof r.ver === 'number' ? r.ver : null;   // null = máy chủ chưa cập nhật Code.gs mới
    this._setMeta(nm, { needCheck: null });

    // Bố mẹ đã chọn ghi đè bằng bản máy (mở file / giữ bản máy) mà chưa gửi xong → không bao giờ kéo bản mạng đè lên
    if (m.forceRev && this._unsaved(nm)) { this._kick(0); return 'force-pending'; }

    if (!r.found || !r.snapshot) {
      if (rv != null) this._setMeta(nm, { serverVer: rv });
      await this.push(nm);
      return 'pushed';
    }

    const localSnap = this.collect(nm);
    const local = this.summary(localSnap);
    const remote = this.summary(r.snapshot);
    const lh = this._hash(localSnap.keys);
    const rh = this._hash(r.snapshot.keys);

    // Giống hệt → đã đồng bộ
    if (lh === rh) {
      const patch = Object.assign({ savedRev: this._meta(nm).localRev || 0, conflict: null }, this._baseFrom(localSnap));
      if (rv != null) patch.serverVer = rv;
      this._setMeta(nm, patch);
      this._dropBackupIfSaved(nm, localSnap.keys);   // chỉ xoá bản cất đã nằm nguyên trên mạng; bản khác thì giữ
      return 'same';
    }

    // Máy chưa có gì (máy mới / vừa xoá trình duyệt) → lấy bản mạng
    if (!this._hasProgress(local) && this._hasProgress(remote)) return this._pull(nm, r, local, remote, opts);

    const dirty = this._dirty(nm, localSnap);
    const ownRemote = rh === m.savedHash || rh === m.beaconHash;   // bản trên mạng do chính máy này gửi lên
    let remoteChanged = null;                                       // null = không biết (chưa có số phiên bản)
    if (ownRemote) remoteChanged = false;
    else if (rv != null && typeof m.serverVer === 'number') remoteChanged = rv !== m.serverVer;

    if (remoteChanged === null) {
      // Máy cũ / máy chủ cũ: chưa có số phiên bản → so XP như trước, nhưng KHÔNG kéo đè khi còn thay đổi chưa lưu
      const remoteBetter = remote.p > local.p || (remote.p === local.p && remote.at > local.at);
      if (!remoteBetter) remoteChanged = false;
      else return dirty ? this._enterConflict(nm, r, remote) : this._pull(nm, r, local, remote, opts);
    }

    if (remoteChanged === false) {
      // Bản mạng chưa đổi kể từ bản máy này biết → máy này là bản mới hơn: gửi lên
      if (rv != null) this._setMeta(nm, { serverVer: rv });
      if (!this._unsaved(nm)) this._bumpRev(nm);   // khác bản mạng mà rev chưa tăng (ghi thẳng localStorage)
      await this.push(nm);
      return 'pushed';
    }

    // Bản mạng đã đổi (máy khác đã lưu)
    return dirty ? this._enterConflict(nm, r, remote) : this._pull(nm, r, local, remote, opts);
  },

  /** Lấy bản mạng về. Chỉ gọi khi máy KHÔNG còn thay đổi chưa lưu (hoặc máy chưa có gì). */
  _pull(nm, r, local, remote, opts) {
    if (!this._validSnapshot(r.snapshot)) return null;
    this._applying = true;
    try {
      if (!this.apply(r.snapshot, nm)) return null;   // ghi không được → giữ nguyên máy, KHÔNG đánh dấu đã đồng bộ
      this._refreshUI();
      // Bản vừa tải về chính là bản trên máy chủ → coi như đã đồng bộ.
      // Mốc so sánh = bản trên máy sau khi chép và làm mới giao diện.
      const m = this._meta(nm);
      const patch = Object.assign({
        name: Storage.normalizeName(nm), lastChange: remote.at, lastPull: Date.now(),
        savedRev: m.localRev || 0, conflict: null, needCheck: null, stuckRev: null
      }, this._baseFrom(this.collect(nm)));
      if (typeof r.ver === 'number') patch.serverVer = r.ver;
      this._setMeta(nm, patch);
    } finally {
      this._applying = false;
    }
    if (!(opts && opts.silent) && this._hasProgress(remote) && !this._hasProgress(local)) {
      this._toast('☁️ Đã lấy lại ⭐ ' + remote.stars + ' sao · ' + remote.stickers + ' sticker · ' + remote.balls + ' ngọc rồng của ' + Storage.normalizeName(nm) + '!');
    }
    return 'pulled';
  },

  // ─── Bản cất (không bao giờ nằm trong snapshot sao lưu) ─
  // • Ô "conflict": bản máy lúc đang xung đột, được cất lại mỗi lần phát hiện (cùng một máy đang học tiếp).
  // • Danh sách "restore": bản máy trước khi bố mẹ chọn "Lấy bản trên mạng", giữ tối đa 3 bản.
  // Chỉ tự xoá một bản cất khi nội dung của nó đã nằm nguyên trên mạng; còn lại chỉ bố mẹ xoá.
  RESTORE_KEEP: 3,
  _backupKey(nm, slot) { return this.CONFLICT_PREFIX + (slot === 'restore' ? 'restore::' : '') + this._canon(nm); },
  _readJSON(k, def) { try { return JSON.parse(localStorage.getItem(k) || 'null') || def; } catch (e) { return def; } },

  /** Cất bản máy HIỆN TẠI vào ô xung đột (gồm cả phần bé học thêm sau lúc phát hiện). */
  _saveBackup(nm) {
    try {
      localStorage.setItem(this._backupKey(nm), JSON.stringify({ at: Date.now(), snapshot: this.collect(nm) }));
      return true;
    } catch (e) {
      console.warn('Cloud._saveBackup', e);   // đầy bộ nhớ: bản máy vẫn còn nguyên vì không tự kéo đè
      return false;
    }
  },

  /** Thêm bản máy hiện tại vào danh sách khôi phục (mới nhất ở đầu, tối đa 3). */
  _addRestore(nm) {
    const k = this._backupKey(nm, 'restore');
    const list = this._readJSON(k, []).filter(x => x && x.snapshot);
    const snap = this.collect(nm);
    if (!list.length || this._hash(list[0].snapshot.keys) !== this._hash(snap.keys)) {
      list.unshift({ id: 'r' + Date.now(), at: Date.now(), snapshot: snap });
    }
    try {
      localStorage.setItem(k, JSON.stringify(list.slice(0, this.RESTORE_KEEP)));
      return true;
    } catch (e) {
      console.warn('Cloud._addRestore', e);
      return false;
    }
  },

  /** Mọi bản cất của bé: id 'conflict' (ô xung đột) và các id 'r…' (danh sách khôi phục). */
  _backups(nm) {
    const out = [];
    const c = this._readJSON(this._backupKey(nm), null);
    if (c && c.snapshot) out.push({ id: 'conflict', at: c.at, snapshot: c.snapshot });
    this._readJSON(this._backupKey(nm, 'restore'), []).forEach(x => { if (x && x.snapshot) out.push(x); });
    return out;
  },
  _getBackup(nm, id) { return this._backups(nm).find(x => x.id === (id || 'conflict')) || null; },

  _dropBackup(nm, id) {
    try {
      if (!id || id === 'conflict') localStorage.removeItem(this._backupKey(nm));
      else {
        const k = this._backupKey(nm, 'restore');
        const list = this._readJSON(k, []).filter(x => x && x.id !== id);
        if (list.length) localStorage.setItem(k, JSON.stringify(list)); else localStorage.removeItem(k);
      }
    } catch (e) { /* bỏ qua */ }
  },

  /**
   * Tự xoá bản cất CHỈ khi nội dung của nó đã nằm nguyên trên mạng: không khác bản vừa đồng bộ ở mục nào,
   * trừ các trường tự sinh (kế hoạch hôm nay…) mà giao diện ghi lại khi làm mới.
   */
  _dropBackupIfSaved(nm, syncedKeys) {
    if (!syncedKeys) return;
    const base = this._print(syncedKeys);
    this._backups(nm).forEach(b => {
      if (this._changedSince({ keys: b.snapshot.keys }, base).length === 0) this._dropBackup(nm, b.id);
    });
  },

  /** Xung đột: cất bản máy, ghi nhận, ngừng tự gửi. Bé vẫn học bình thường trên bản máy. */
  _enterConflict(nm, r, remote) {
    const saved = this._saveBackup(nm);
    this._setMeta(nm, {
      conflict: { at: Date.now(), remoteVer: typeof r.ver === 'number' ? r.ver : null, remote, backup: saved }
    });
    return 'conflict';
  },

  // ─── Bố mẹ xử lý xung đột ───────────────────────────
  /** Giữ bản máy này (bản hiện tại, gồm cả phần học thêm) → ghi đè bản mạng. */
  async resolveKeepLocal(nm) {
    this._saveBackup(nm);          // cất bản đúng lúc bấm; gửi lên y hệt thì bản cất tự xoá
    this._bumpRev(nm);
    return this.push(nm, true);
  },

  /** Lấy bản mạng về; bản máy hiện tại được đưa vào danh sách khôi phục trước. */
  async resolveTakeRemote(nm) {
    let r;
    try { r = await this.fetchRemote(nm); } catch (e) { return { ok: false, error: 'network' }; }
    if (!r || !r.ok || !r.found || !this._validSnapshot(r.snapshot)) return { ok: false, error: 'network' };
    if (!this._addRestore(nm)) return { ok: false, error: 'backup' };   // không cất được thì KHÔNG kéo đè
    const local = this.summary(this.collect(nm));
    if (this._pull(nm, r, local, this.summary(r.snapshot), { silent: true }) !== 'pulled') return { ok: false, error: 'apply' };
    // Ô xung đột là bản cũ hơn của chính bản vừa đưa vào danh sách khôi phục → không cần giữ thêm
    this._dropBackup(nm, 'conflict');
    return { ok: true };
  },

  /** Khôi phục một bản cất → đặt máy đúng bằng bản đó rồi ghi đè lên mạng. */
  async restoreBackup(nm, id) {
    const b = this._getBackup(nm, id);
    if (!b || !this._validSnapshot(b.snapshot)) return { ok: false, error: 'none' };
    let ok = false;
    this._applying = true;
    try { ok = this.apply(b.snapshot, nm); if (ok) this._refreshUI(); } finally { this._applying = false; }
    if (!ok) return { ok: false, error: 'apply' };
    this._bumpRev(nm);
    return this.push(nm, true);      // gửi lên y hệt bản cất → bản cất tự xoá
  },

  _refreshUI() {
    try {
      if (window.App) {
        const d = Storage.load();
        if (d.playerName) App.playerName = d.playerName;
      }
      if (window.Rewards && Rewards.updateUI) Rewards.updateUI();
      if (window.DragonBall && DragonBall._renderHomeWidgets) DragonBall._renderHomeWidgets();
      if (window.Today && Today.render) Today.render();
    } catch (e) { console.warn('Cloud._refreshUI', e); }
  },

  /** Dấu ☁️⚠️ nhỏ cạnh link Phụ huynh khi bé đang dùng máy có xung đột chờ bố mẹ chọn. */
  _markParentLink() {
    try {
      const link = document.getElementById('footerParent');
      if (!link) return;
      const nm = Storage.getActiveName();
      const on = !!(nm && this._meta(nm).conflict);
      let dot = document.getElementById('cloudConflictDot');
      if (on && !dot) {
        dot = document.createElement('span');
        dot.id = 'cloudConflictDot';
        dot.title = 'Sao lưu: có 2 bản khác nhau, bố mẹ vào chọn giúp nhé';
        dot.textContent = ' ☁️⚠️';
        link.appendChild(dot);
      } else if (!on && dot) dot.remove();
    } catch (e) { /* bỏ qua */ }
  },

  _toast(msg) {
    if (window.Rewards && Rewards._achievementPopup) Rewards._achievementPopup(msg);
  },

  // ─── File sao lưu (dùng được cả khi chưa có máy chủ) ─
  _fileName(nm, tag) {
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    return 'sao-luu-' + this._canon(nm).normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-') +
      (tag ? '-' + tag : '') + '-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '.json';
  },

  _saveJSON(obj, filename) {
    const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },

  downloadFile(name, tag) {
    const nm = name || Storage.getActiveName();
    if (!nm) return;
    this._saveJSON(this.collect(nm), this._fileName(nm, tag));
  },

  async openFile(file) {
    const text = await file.text();
    const snap = JSON.parse(text);
    if (!snap || !snap.name || !this._validSnapshot(snap)) throw new Error('File không đúng định dạng sao lưu');
    let ok = false;
    this._applying = true;
    try {
      ok = this.apply(snap, snap.name);
      if (ok) this._refreshUI();
    } finally {
      this._applying = false;
    }
    if (!ok) throw new Error('Không ghi được vào máy (bộ nhớ trình duyệt đầy?). Dữ liệu cũ vẫn giữ nguyên.');
    // Mở file là thay đổi thật trên máy → tăng localRev để nếu gửi lỗi thì web tự gửi lại
    this._bumpRev(snap.name);
    if (this.enabled()) await this.push(snap.name, true);
    return this.summary(snap);
  },

  // ─── Khung trong Khu vực Bố Mẹ ──────────────────────
  renderParentCard() {
    const host = document.querySelector('#screenParent .parent-wrap');
    if (!host) return;
    let card = document.getElementById('backupCard');
    if (!card) {
      card = document.createElement('div');
      card.className = 'card';
      card.id = 'backupCard';
      host.appendChild(card);
    }
    this._markParentLink();
    const nm = Storage.getActiveName();
    const sum = nm ? this.summary(this.collect(nm)) : null;
    const meta = nm ? this._meta(nm) : {};
    const when = meta.lastPush ? new Date(meta.lastPush).toLocaleString('vi-VN') : 'chưa';
    const line = s => '⭐ ' + s.stars + ' sao · ' + s.stickers + ' sticker · ' + s.balls + ' ngọc rồng · ' + s.p + ' điểm kinh nghiệm';
    const c = meta.conflict;
    const conflictBox = c && nm
      ? '<div class="backup-conflict">' +
          '<p><b>⚠️ Có 2 bản khác nhau của ' + this._esc(nm) + '</b> — có lẽ con đã học trên máy khác. Web chưa tự lấy bản nào để không mất phần con vừa học.</p>' +
          '<p>📱 <b>Máy này:</b> ' + line(sum) + '<br>☁️ <b>Trên mạng:</b> ' + (c.remote ? line(c.remote) : '?') + '</p>' +
          '<div class="backup-actions">' +
            '<button class="btn-secondary" id="btnKeepLocal">📱 Giữ bản máy này</button>' +
            '<button class="btn-secondary" id="btnTakeRemote">☁️ Lấy bản trên mạng</button>' +
            '<button class="btn-secondary" id="btnDownloadBoth">💾 Tải cả hai bản về</button>' +
          '</div>' +
          '<p class="backup-note">Lấy bản trên mạng thì bản của máy này vẫn được cất lại, tải về hoặc khôi phục được.</p>' +
        '</div>'
      : '';
    const saved = !c && nm ? this._backups(nm) : [];
    const restoreBox = saved.length
      ? '<div class="backup-conflict"><p><b>🗂️ Bản cũ của máy này đang được cất</b> (chỉ bố mẹ xoá được):</p>' +
          saved.map(b => '<p>• ' + new Date(b.at).toLocaleString('vi-VN') + ': ' + line(this.summary(b.snapshot)) + '</p>' +
            '<div class="backup-actions">' +
            '<button class="btn-secondary" data-bk="restore" data-id="' + b.id + '">↩️ Khôi phục bản này</button>' +
            '<button class="btn-secondary" data-bk="download" data-id="' + b.id + '">💾 Tải về</button>' +
            '<button class="btn-secondary" data-bk="drop" data-id="' + b.id + '">🗑️ Xoá</button></div>').join('') +
        '</div>'
      : '';
    card.innerHTML =
      '<h3 class="parent-section-title">☁️ Sao lưu phần thưởng</h3>' +
      (nm ? '<p class="backup-line">Bé đang dùng máy này: <b>' + this._esc(nm) + '</b> · ⭐ ' + sum.stars + ' sao · ' + sum.stickers + ' sticker · ' + sum.balls + ' ngọc rồng</p>' : '<p class="backup-line">Máy này chưa có tên bé.</p>') +
      (this.enabled()
        ? '<p class="backup-note">Web tự sao lưu lên mạng sau mỗi lượt học và khi mua sticker. Đổi máy hoặc xoá trình duyệt: gõ đúng tên cũ là lấy lại được. Lần sao lưu gần nhất: <b>' + when + '</b>.' +
          (!c && nm && this._unsaved(nm) ? (meta.forceRev ? ' ⏳ Đang chờ gửi bản bố mẹ đã chọn, web sẽ tự gửi lại.' : ' ⏳ Còn thay đổi chưa sao lưu, web sẽ tự gửi lại.') : '') + '</p>'
        : '<p class="backup-note">Chưa bật sao lưu tự động lên mạng. Trong lúc chờ, bố mẹ có thể tải file sao lưu về giữ.</p>') +
      conflictBox + restoreBox +
      '<div class="backup-actions">' +
      (this.enabled() && nm && !c ? '<button class="btn-primary" id="btnBackupNow">☁️ Sao lưu ngay</button>' : '') +
      (nm ? '<button class="btn-secondary" id="btnBackupDownload">💾 Tải file sao lưu</button>' : '') +
      '<label class="btn-secondary backup-open">📂 Mở file sao lưu<input type="file" accept=".json,application/json" id="backupFileInput" hidden></label>' +
      '</div><div class="backup-status" id="backupStatus"></div>';

    const status = t => { const s = document.getElementById('backupStatus'); if (s) s.textContent = t; };
    const on = (id, fn) => { const b = document.getElementById(id); if (b) b.onclick = fn; };
    const failMsg = r => r && r.error === 'empty' ? 'Máy này chưa có sao/sticker nào để sao lưu.' : '⚠️ Chưa gửi được (mạng?). Web sẽ tự thử lại.';

    on('btnBackupNow', async () => {
      status('Đang sao lưu…');
      const r = await this.push(nm);
      if (r.ok) { this.renderParentCard(); status('✅ Đã sao lưu xong.'); return; }
      if (r.reason === 'conflict' || r.reason === 'older') {
        const res = await this.sync(nm, { silent: true });
        this.renderParentCard();
        status(res === 'conflict' ? 'Trên mạng có bản khác, bố mẹ chọn giữ bản nào ở trên nhé.' : res === 'pushed' ? '✅ Đã sao lưu xong.' : res === 'pulled' ? '✅ Đã lấy bản mới nhất trên mạng về.' : '');
        return;
      }
      status(failMsg(r));
    });
    on('btnKeepLocal', async () => {
      if (!confirm('Giữ bản của MÁY NÀY và ghi đè bản trên mạng?\n(Bản trên mạng cũ vẫn còn trong lịch sử sao lưu của Google Sheet.)')) return;
      status('Đang gửi bản máy này…');
      const r = await this.resolveKeepLocal(nm);
      this.renderParentCard();
      status(r.ok ? '✅ Đã giữ bản máy này và sao lưu lên mạng.' : failMsg(r));
    });
    on('btnTakeRemote', async () => {
      if (!confirm('Lấy bản TRÊN MẠNG về máy này?\nBản của máy này sẽ được cất lại để tải về hoặc khôi phục sau.')) return;
      status('Đang lấy bản trên mạng…');
      const r = await this.resolveTakeRemote(nm);
      this.renderParentCard();
      status(r.ok ? '✅ Đã lấy bản trên mạng. Bản cũ của máy này đã được cất.' : r.error === 'backup' ? '⚠️ Máy hết chỗ để cất bản cũ — bố mẹ bấm "Tải cả hai bản về" trước nhé.' : '⚠️ Chưa lấy được (mạng?). Thử lại sau nhé.');
    });
    on('btnDownloadBoth', async () => {
      this.downloadFile(nm, 'may-nay');
      try {
        const r = await this.fetchRemote(nm);
        if (r && r.ok && r.snapshot) this._saveJSON(r.snapshot, this._fileName(nm, 'tren-mang'));
        else status('⚠️ Chưa tải được bản trên mạng (mạng?).');
      } catch (e) { status('⚠️ Chưa tải được bản trên mạng (mạng?).'); }
    });
    card.querySelectorAll('[data-bk]').forEach(btn => btn.onclick = async () => {
      const id = btn.dataset.id;
      const b = this._getBackup(nm, id);
      if (!b) return;
      if (btn.dataset.bk === 'download') { this._saveJSON(b.snapshot, this._fileName(nm, 'ban-cat')); return; }
      if (btn.dataset.bk === 'drop') { if (confirm('Xoá bản cất này? Không lấy lại được.')) { this._dropBackup(nm, id); this.renderParentCard(); } return; }
      if (!confirm('Khôi phục bản cất này và ghi đè bản trên mạng?')) return;
      status('Đang khôi phục…');
      const r = await this.restoreBackup(nm, id);
      this.renderParentCard();
      status(r.ok ? '✅ Đã khôi phục và sao lưu lên mạng.' : r.error === 'apply' ? '⚠️ Không ghi được vào máy (bộ nhớ đầy?).' : failMsg(r));
    });
    on('btnBackupDownload', () => this.downloadFile(nm));
    const inp = document.getElementById('backupFileInput');
    if (inp) inp.onchange = async () => {
      const f = inp.files && inp.files[0];
      if (!f) return;
      try {
        const s = await this.openFile(f);
        this.renderParentCard();
        status('✅ Đã mở bản sao lưu của ' + s.name + ': ⭐ ' + s.stars + ' sao · ' + s.stickers + ' sticker · ' + s.balls + ' ngọc rồng.');
      } catch (e) { status('⚠️ ' + (e.message || 'Không mở được file.')); }
      inp.value = '';
    };
  },

  init() {
    this._migrateMeta();
    // Mỗi lần lưu hồ sơ (sao, sticker, XP, ngọc rồng) → hẹn sao lưu
    const orig = Storage.save.bind(Storage);
    Storage.save = (data) => { const r = orig(data); this.schedule(); return r; };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') { this._beacon(); return; }
      // Tab hiện lại (vd. bé vừa học trên máy khác) → đồng bộ, tối đa 1 lần / 30 giây
      const nm = Storage.getActiveName();
      if (nm && Date.now() - this._lastVisibleSync > this.VISIBLE_SYNC_MS) {
        this._lastVisibleSync = Date.now();
        this.sync(nm, { silent: true });
      }
    });
    window.addEventListener('pagehide', () => this._beacon());
    const nm = Storage.getActiveName();
    if (nm) { this._lastVisibleSync = Date.now(); this.sync(nm, { silent: false }); }
    // Tải lại trang mà vẫn còn thay đổi chưa lưu (của bất kỳ bé nào trên máy) → khởi động lại việc gửi
    if (this._pendingNames().length) this._kick(this.DEBOUNCE_MS);
  }
};

window.Cloud = Cloud;
