// =============================================
// CLOUD.JS — sao lưu sao, sticker, ngọc rồng, tiến độ lên Google Sheet
// Đổi máy / xoá trình duyệt: gõ đúng tên cũ là lấy lại được.
// Thêm: tải file sao lưu / mở file sao lưu (không cần mạng).
// Chỉ coi là "đã lưu" khi máy chủ trả JSON ok:true, saved:true; lỗi thì giữ trạng thái chưa lưu và thử lại.
// =============================================

const Cloud = {
  // Điền URL ứng dụng web Apps Script (…/exec) của file backup-apps-script/Code.gs
  URL: 'https://script.google.com/macros/s/AKfycbxA0Br0LUEf9rKDtietHfQmYcA0GyvBf1TyOt6EXlnVK9Uj2kkcpDymJ_jgLAJ9IrnVcg/exec',
  META_PREFIX: 'khoBaiTap_cloudmeta::',
  DEBOUNCE_MS: 4000,
  _timer: null,
  _checked: {},
  _busy: false,

  enabled() { return !!this.URL; },
  _canon(name) { return Storage.canonName(name || Storage.getActiveName() || ''); },

  // ─── Gom / ghi dữ liệu của 1 bé ─────────────────────
  _ownKeys(name) {
    const c = this._canon(name);
    if (!c) return [];
    const pk = Storage.profileKey(name || Storage.getActiveName());
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || k.startsWith(this.META_PREFIX)) continue;
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

  apply(snapshot, name) {
    if (!snapshot || !snapshot.keys) return false;
    const nm = name || snapshot.name;
    const c = this._canon(nm);
    if (!c) return false;
    Object.entries(snapshot.keys).forEach(([base, v]) => {
      try {
        if (base === '@profile') localStorage.setItem(Storage.profileKey(nm), v);
        else localStorage.setItem(base + '::' + c, v);
      } catch (e) { console.warn('Cloud.apply', base, e); }
    });
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

  _meta(name) {
    try { return JSON.parse(localStorage.getItem(this.META_PREFIX + this._canon(name)) || '{}'); } catch (e) { return {}; }
  },
  _setMeta(name, patch) {
    try {
      const m = Object.assign(this._meta(name), patch);
      localStorage.setItem(this.META_PREFIX + this._canon(name), JSON.stringify(m));
    } catch (e) { /* bỏ qua */ }
  },

  // ─── Trạng thái lưu ─────────────────────────────────
  // Mỗi bé có 2 số trong cloudmeta:
  //   localRev = số lần dữ liệu trên máy thay đổi (tăng ở schedule()).
  //   savedRev = localRev của bản mới nhất mà MÁY CHỦ đã xác nhận lưu (ok:true, saved:true).
  // localRev > savedRev → còn thay đổi chưa sao lưu. Lưu trong localStorage nên tải lại trang vẫn biết.
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
      if (m.conflict && !m.forceRev) continue;        // bản trên mạng tiến xa hơn → chờ xử lý, không gửi liên tục
      if (m.stuckRev != null && rev <= m.stuckRev) continue; // máy chủ đã từ chối đúng bản này → chờ thay đổi mới
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
      .then(r => { this._onResult(r); return r; });
    this._chain = job.catch(() => {});
    return job;
  },

  /** Lỗi tạm thời → tăng backoff 1 lần và hẹn gửi lại; gửi được → xoá backoff. */
  _onResult(r) {
    if (r && r.transient) {
      this._fail++;
      this._retryAt = Date.now() + this.RETRY_MS[Math.min(this._fail, this.RETRY_MS.length) - 1];
      this._kick(0);                       // _kick tự chờ tới _retryAt
    } else if (r && r.ok && !r.skipped) {
      this._fail = 0;
      this._retryAt = 0;
    }
  },

  async _sendNow(name, opts) {
    if (!this.enabled()) return { ok: false, error: 'off' };
    // Giữ cố định tên bé, rev và snapshot của lượt gửi này (đổi bé giữa chừng không làm xác nhận nhầm)
    const nm = Storage.normalizeName(name || '');
    if (!nm) return { ok: false, error: 'no name' };
    const rev = this._meta(nm).localRev || 0;
    if (opts.onlyIfUnsaved && !this._unsaved(nm)) return { ok: true, skipped: true };
    // Bố mẹ chủ động ghi đè: nhớ ý định này để nếu gửi lỗi thì lần thử lại vẫn là ghi đè (không bị đổi thành "older")
    if (opts.force) this._setMeta(nm, { forceRev: Math.max(this._meta(nm).forceRev || 0, rev) });
    const snap = this.collect(nm);
    const meta = this.summary(snap);
    if (!opts.force && !this._hasProgress(meta)) {
      this._markSaved(nm, rev);                 // chưa có gì để lưu → không thử lại
      return { ok: false, error: 'empty' };
    }
    const body = { action: 'save', key: this._canon(nm), meta, snapshot: snap };
    if (opts.force) body.force = true;
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
      const extra = { lastPush: Date.now(), conflict: null, stuckRev: null };
      if (opts.force) extra.forceRev = null;       // yêu cầu ghi đè đã xong
      this._markSaved(nm, rev, extra);
      return out;
    }
    if (out && out.reason === 'older') {
      this._setMeta(nm, { conflict: { at: Date.now(), remote: out.meta || null } });
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
    if (!nm || !this._unsaved(nm) || this._meta(nm).conflict) return;
    const snap = this.collect(nm);
    const meta = this.summary(snap);
    if (!this._hasProgress(meta)) return;
    try {
      navigator.sendBeacon(this.URL, JSON.stringify({ action: 'save', key: this._canon(nm), meta, snapshot: snap }));
    } catch (e) { /* bỏ qua */ }
  },

  /** Có thay đổi → tăng localRev, hẹn vài giây sau mới gửi (gom nhiều thay đổi làm 1). */
  schedule() {
    if (this._applying) return;        // đang chép bản tải về vào máy → không phải thay đổi mới
    const nm = Storage.getActiveName();
    if (!nm) return;
    const m = this._meta(nm);
    this._setMeta(nm, { name: Storage.normalizeName(nm), lastChange: Date.now(), localRev: (m.localRev || 0) + 1 });
    this._kick(this.DEBOUNCE_MS);
  },

  /**
   * Gọi khi mở web hoặc khi bé nhập tên.
   * Bản trên mạng tiến xa hơn → lấy về. Bản trên máy tiến xa hơn → gửi lên.
   */
  async sync(name, opts) {
    if (!this.enabled()) return null;
    const nm = name || Storage.getActiveName();
    if (!nm || this._busy) return null;
    this._busy = true;
    try {
      const r = await this.fetchRemote(nm);
      this._checked[this._canon(nm)] = true;
      const localSnap = this.collect(nm);
      const local = this.summary(localSnap);
      if (r && r.ok && r.found && r.snapshot) {
        const remote = this.summary(r.snapshot);
        const differs = JSON.stringify(localSnap.keys) !== JSON.stringify(r.snapshot.keys);
        const remoteBetter = remote.p > local.p || (remote.p === local.p && differs && remote.at > local.at);
        if (remoteBetter) {
          this._applying = true;
          try {
            this.apply(r.snapshot, nm);
            // Bản vừa tải về chính là bản trên máy chủ → coi như đã đồng bộ
            const m = this._meta(nm);
            this._setMeta(nm, { name: Storage.normalizeName(nm), lastChange: remote.at, lastPull: Date.now(), savedRev: m.localRev || 0, conflict: null, stuckRev: null });
            this._refreshUI();
          } finally {
            this._applying = false;
          }
          if (!(opts && opts.silent) && this._hasProgress(remote) && !this._hasProgress(local)) {
            this._toast('☁️ Đã lấy lại ⭐ ' + remote.stars + ' sao · ' + remote.stickers + ' sticker · ' + remote.balls + ' ngọc rồng của ' + Storage.normalizeName(nm) + '!');
          }
          return 'pulled';
        }
        if (local.p > remote.p || (local.p === remote.p && differs && local.at > remote.at)) {
          await this.push(nm);
          return 'pushed';
        }
        if (!differs) this._markSaved(nm, this._meta(nm).localRev || 0, { conflict: null }); // trên mạng y hệt máy
        return 'same';
      }
      if (r && r.ok && !r.found) { await this.push(nm); return 'pushed'; }
      return null;
    } catch (e) {
      console.warn('Cloud.sync', e);
      return null;
    } finally {
      this._busy = false;
    }
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

  _toast(msg) {
    if (window.Rewards && Rewards._achievementPopup) Rewards._achievementPopup(msg);
  },

  // ─── File sao lưu (dùng được cả khi chưa có máy chủ) ─
  downloadFile(name) {
    const nm = name || Storage.getActiveName();
    if (!nm) return;
    const snap = this.collect(nm);
    const blob = new Blob([JSON.stringify(snap)], { type: 'application/json' });
    const a = document.createElement('a');
    const d = new Date();
    const pad = n => String(n).padStart(2, '0');
    a.href = URL.createObjectURL(blob);
    a.download = 'sao-luu-' + this._canon(nm).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-') + '-' + d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + '.json';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  },

  async openFile(file) {
    const text = await file.text();
    const snap = JSON.parse(text);
    if (!snap || !snap.keys || !snap.name) throw new Error('File không đúng định dạng sao lưu');
    this._applying = true;
    try {
      this.apply(snap, snap.name);
      this._refreshUI();
    } finally {
      this._applying = false;
    }
    // Mở file là thay đổi thật trên máy → tăng localRev để nếu gửi lỗi thì web tự gửi lại
    const m = this._meta(snap.name);
    this._setMeta(snap.name, { name: Storage.normalizeName(snap.name), lastChange: Date.now(), localRev: (m.localRev || 0) + 1 });
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
    const nm = Storage.getActiveName();
    const sum = nm ? this.summary(this.collect(nm)) : null;
    const meta = nm ? this._meta(nm) : {};
    const when = meta.lastPush ? new Date(meta.lastPush).toLocaleString('vi-VN') : 'chưa';
    card.innerHTML =
      '<h3 class="parent-section-title">☁️ Sao lưu phần thưởng</h3>' +
      (nm ? '<p class="backup-line">Bé đang dùng máy này: <b>' + nm + '</b> · ⭐ ' + sum.stars + ' sao · ' + sum.stickers + ' sticker · ' + sum.balls + ' ngọc rồng</p>' : '<p class="backup-line">Máy này chưa có tên bé.</p>') +
      (this.enabled()
        ? '<p class="backup-note">Web tự sao lưu lên mạng sau mỗi lượt học và khi mua sticker. Đổi máy hoặc xoá trình duyệt: gõ đúng tên cũ là lấy lại được. Lần sao lưu gần nhất: <b>' + when + '</b>.' +
          (meta.conflict ? ' <b>⚠️ Trên mạng có bản tiến xa hơn bản ở máy này — bấm "Sao lưu ngay" để chọn giữ bản nào.</b>'
            : (nm && this._unsaved(nm) ? ' ⏳ Còn thay đổi chưa sao lưu, web sẽ tự gửi lại.' : '')) + '</p>'
        : '<p class="backup-note">Chưa bật sao lưu tự động lên mạng. Trong lúc chờ, bố mẹ có thể tải file sao lưu về giữ.</p>') +
      '<div class="backup-actions">' +
      (this.enabled() && nm ? '<button class="btn-primary" id="btnBackupNow">☁️ Sao lưu ngay</button>' : '') +
      (nm ? '<button class="btn-secondary" id="btnBackupDownload">💾 Tải file sao lưu</button>' : '') +
      '<label class="btn-secondary backup-open">📂 Mở file sao lưu<input type="file" accept=".json,application/json" id="backupFileInput" hidden></label>' +
      '</div><div class="backup-status" id="backupStatus"></div>';

    const status = t => { const s = document.getElementById('backupStatus'); if (s) s.textContent = t; };
    const b1 = document.getElementById('btnBackupNow');
    if (b1) b1.onclick = async () => {
      status('Đang sao lưu…');
      const r = await this.push(nm);
      if (r.ok) { this.renderParentCard(); status('✅ Đã sao lưu xong.'); return; }
      if (r.reason === 'older') {
        const m = r.meta || {};
        if (confirm('Trên mạng đang có bản tiến xa hơn (⭐ ' + m.stars + ' sao, ' + m.stickers + ' sticker).\nBấm OK để LẤY BẢN ĐÓ về máy này.\nBấm Huỷ để giữ nguyên.')) {
          const res = await this.sync(nm);
          status(res === 'pulled' ? '✅ Đã lấy bản trên mạng về.' : 'Chưa lấy được, thử lại sau nhé.');
          this.renderParentCard();
        } else status('Đã giữ nguyên.');
        return;
      }
      status(r.error === 'empty' ? 'Máy này chưa có sao/sticker nào để sao lưu.' : '⚠️ Chưa sao lưu được (mạng?). Thử lại sau nhé.');
    };
    const b2 = document.getElementById('btnBackupDownload');
    if (b2) b2.onclick = () => this.downloadFile(nm);
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
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this._beacon(); });
    window.addEventListener('pagehide', () => this._beacon());
    const nm = Storage.getActiveName();
    if (nm) this.sync(nm, { silent: false });
    // Tải lại trang mà vẫn còn thay đổi chưa lưu (của bất kỳ bé nào trên máy) → khởi động lại việc gửi
    if (this._pendingNames().length) this._kick(this.DEBOUNCE_MS);
  }
};

window.Cloud = Cloud;
