// =============================================
// ACHIEVE.JS — Thành tích + dòng tin vui chạy ngang trên trang chủ
// Mỗi bé tự ghi thành tích (kèm ngày đạt) vào hồ sơ của mình → được sao lưu.
// Dòng chạy đọc thành tích của cả 3 bé (bé khác: từ bản sao lưu trên mạng).
// =============================================

const Achieve = {
  // tiers: các mốc; v(profile, extra) trả về giá trị hiện tại
  DEFS: [
    { id: 'streak', tiers: [3, 7, 14, 30, 60, 100], icon: '🔥', text: (n, v) => 'Chúc mừng ' + n + ' đã học liên tục ' + v + ' ngày!' },
    { id: 'run', tiers: [10, 20, 50, 100, 200], icon: '🎯', text: (n, v) => 'Chúc mừng ' + n + ' đã trả lời đúng liên tiếp ' + v + ' câu!' },
    { id: 'correct', tiers: [100, 300, 500, 1000, 2000, 5000], icon: '✅', text: (n, v) => n + ' đã làm đúng tổng cộng ' + v + ' câu hỏi!' },
    { id: 'level', tiers: [5, 10, 15, 20, 30, 50], icon: '⭐', text: (n, v) => 'Chúc mừng ' + n + ' đã lên Level ' + v + '!' },
    { id: 'balls', tiers: [7], icon: '🐉', text: (n) => n + ' đã thu thập đủ 7 viên ngọc rồng!' },
    { id: 'stickers', tiers: [10, 20, 30, 50], icon: '🎒', text: (n, v) => n + ' đã sưu tập được ' + v + ' sticker!' }
  ],
  RECENT_DAYS: 14,
  MAX_ITEMS: 8,
  _busy: false,
  _cache: null,

  _today() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  _values(prof, balls) {
    return {
      streak: Number(prof.streak || 0),
      run: Number(prof.runBest || 0),
      correct: Number(prof.totalCorrect || 0),
      level: Number(prof.level || 1),
      balls: Number(balls || 0),
      stickers: Array.isArray(prof.inventory) ? prof.inventory.length : 0
    };
  },

  _balls() {
    try {
      const c = Storage.canonName(Storage.getActiveName());
      return (JSON.parse(localStorage.getItem('rabbit_dragonball_collection::' + c) || '[]') || []).length;
    } catch (e) { return 0; }
  },

  /** Ghi các mốc mới đạt của bé đang dùng máy. Lần đầu chạy: mốc cũ ghi ngày 0 (không báo), chỉ mốc cao nhất được báo. */
  check() {
    if (this._busy || !Storage.getActiveName()) return;
    this._busy = true;
    try {
      const prof = Storage.load();
      const ach = prof.achievements && typeof prof.achievements === 'object' ? prof.achievements : null;
      const first = !ach;
      const got = Object.assign({}, ach || {});
      const vals = this._values(prof, this._balls());
      const fresh = [];
      this.DEFS.forEach(def => {
        const reached = def.tiers.filter(t => vals[def.id] >= t);
        reached.forEach((t, i) => {
          const key = def.id + ':' + t;
          if (got[key] != null) return;
          const isTop = i === reached.length - 1;
          got[key] = (first && !isTop) ? 0 : this._today();
          if (!first || isTop) fresh.push({ def, t });
        });
      });
      if (first || fresh.length) {
        prof.achievements = got;
        Storage.save(prof);
        this._cache = null;
        if (!first) fresh.forEach((f, i) => setTimeout(() => {
          if (window.Rewards && Rewards._achievementPopup) Rewards._achievementPopup(f.def.icon + ' ' + f.def.text(Storage.normalizeName(prof.playerName || Storage.getActiveName()), f.t));
        }, 2800 + i * 2600));
      }
    } catch (e) { console.warn('Achieve.check', e); }
    finally { this._busy = false; }
  },

  /** Chuỗi trả lời đúng liên tiếp (chỉ tính lần chọn đầu tiên của mỗi câu). */
  recordAnswer(isCorrect) {
    try {
      const prof = Storage.load();
      prof.runNow = isCorrect ? Number(prof.runNow || 0) + 1 : 0;
      prof.runBest = Math.max(Number(prof.runBest || 0), prof.runNow);
      Storage.save(prof);
    } catch (e) { /* bỏ qua */ }
  },

  // ─── Dòng tin vui ────────────────────────────────────
  async _kidsAchievements() {
    const kids = (window.API && API.KIDS && API.KIDS.length) ? API.KIDS.map(k => k.name) : [Storage.getActiveName()].filter(Boolean);
    const active = Storage.canonName(Storage.getActiveName());
    const lists = await Promise.all(kids.map(async name => {
      try {
        if (Storage.canonName(name) === active || (window.API && API.kidOf && API.kidOf(Storage.getActiveName()) === name)) {
          return { name, ach: Storage.load().achievements || {} };
        }
        if (!window.Cloud || !Cloud.enabled()) return { name, ach: {} };
        const r = await Cloud.fetchRemote(name);
        const prof = r && r.found && r.snapshot ? JSON.parse((r.snapshot.keys || {})['@profile'] || '{}') : {};
        return { name, ach: prof.achievements || {} };
      } catch (e) { return { name, ach: {} }; }
    }));
    return lists;
  },

  async items() {
    if (this._cache && Date.now() - this._cache.at < 5 * 60 * 1000) return this._cache.items;
    const since = new Date(Date.now() - this.RECENT_DAYS * 864e5);
    const sinceStr = since.getFullYear() + '-' + String(since.getMonth() + 1).padStart(2, '0') + '-' + String(since.getDate()).padStart(2, '0');
    const out = [];
    (await this._kidsAchievements()).forEach(({ name, ach }) => {
      // Mỗi loại chỉ lấy mốc cao nhất gần đây của bé
      this.DEFS.forEach(def => {
        const hits = def.tiers.filter(t => ach[def.id + ':' + t] && ach[def.id + ':' + t] >= sinceStr);
        if (!hits.length) return;
        const t = hits[hits.length - 1];
        out.push({ date: ach[def.id + ':' + t], text: def.icon + ' ' + def.text(Storage.normalizeName(name), t) });
      });
    });
    out.sort((a, b) => b.date.localeCompare(a.date));
    const items = out.slice(0, this.MAX_ITEMS);
    this._cache = { at: Date.now(), items };
    return items;
  },

  async renderTicker() {
    const screen = document.getElementById('screenRegister');
    if (!screen) return;
    let bar = document.getElementById('newsTicker');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'newsTicker';
      bar.className = 'news-ticker';
      bar.setAttribute('role', 'status');
      screen.insertBefore(bar, screen.firstChild);
    }
    let items = [];
    try { items = await this.items(); } catch (e) { items = []; }
    const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const texts = items.length ? items.map(i => i.text) : ['🐰 Bảng tin Vương Quốc Thỏ: học đều mỗi ngày để có tên ở đây nhé!'];
    const line = texts.map(t => '<span class="nt-item">' + esc(t) + '</span>').join('<span class="nt-sep">✦</span>');
    bar.innerHTML = '<span class="nt-label"><span class="nt-mega">📣</span> Tin vui</span><div class="nt-view"><div class="nt-track">' +
      line + '<span class="nt-sep">✦</span>' + line + '<span class="nt-sep">✦</span></div></div>';
    this._startScroll(bar);
  },

  /** Chạy chữ bằng JS (không phụ thuộc cài đặt "giảm hiệu ứng" của máy): chậm, đều, từ phải sang trái. */
  SPEED: 38, // px mỗi giây
  _startScroll(bar) {
    const track = bar.querySelector('.nt-track');
    if (!track) return;
    if (this._raf) cancelAnimationFrame(this._raf);
    let x = bar.querySelector('.nt-view').clientWidth * 0.6; // bắt đầu từ bên phải
    let last = performance.now();
    let paused = false;
    bar.onmouseenter = () => { paused = true; };
    bar.onmouseleave = () => { paused = false; };
    bar.ontouchstart = () => { paused = true; };
    bar.ontouchend = () => { setTimeout(() => { paused = false; }, 1500); };
    const step = (now) => {
      if (!document.body.contains(track)) return;
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      const half = track.scrollWidth / 2;
      if (!paused && !document.hidden && half > 0) {
        x -= this.SPEED * dt;
        if (x <= -half) x += half;
        track.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
      }
      this._raf = requestAnimationFrame(step);
    };
    this._raf = requestAnimationFrame(step);
  },

  init() {
    this.check();
    this.renderTicker();
    if (Storage.save && !Storage._achWrapped) {
      const orig = Storage.save.bind(Storage);
      let t = null;
      Storage.save = (data) => {
        const r = orig(data);
        if (!this._busy) { clearTimeout(t); t = setTimeout(() => this.check(), 300); }
        return r;
      };
      Storage._achWrapped = true;
    }
  }
};

window.Achieve = Achieve;
