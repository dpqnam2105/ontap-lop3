// Desktop companion. Only UI celebration receipts are stored; never writes a profile or rewards.
const Companion = {
  DURATION: 3000,
  PREFIX: 'rabbit_companion_celebrated_v1/',
  initialized: false,
  greeted: new Set(), reminded: new Set(), celebrated: new Set(),
  timer: null, active: null, tapIndex: 0,

  init() {
    if (this.initialized) return;
    this.root = document.querySelector('.rail-companion');
    if (!this.root) return;
    this.button = this.root.querySelector('.companion-button');
    this.image = this.root.querySelector('img');
    this.bubble = this.root.querySelector('.companion-bubble');
    this.motion = matchMedia('(prefers-reduced-motion: reduce)');
    this.desktop = matchMedia('(min-width: 1101px)');
    this.button.addEventListener('click', () => this.tap());
    this.desktop.addEventListener('change', () => this.sync());
    this.motion.addEventListener('change', () => {
      if (this.motion.matches) this.root.classList.remove('companion-wave', 'companion-hop');
    });
    document.addEventListener('visibilitychange', () => this.sync());
    this.initialized = true;
    this.sync();
  },

  snapshot() {
    const data = Storage.load();
    const player = Storage.canonName(App.playerName || '');
    const date = Today._dateKey();
    const plan = data.todayPlan;
    const valid = player && plan && plan.player === player && plan.date === date
      && plan.grade === App.currentGrade && Array.isArray(plan.tasks) && plan.tasks.length > 0;
    return { player, date, key: encodeURIComponent(player) + '/' + date, data,
      plan: valid ? plan : null,
      remaining: valid ? plan.tasks.filter(t => !t.done).length : null };
  },

  weekFacts(log, lastDay, start, today) {
    let correct = 0, days = 0;
    for (let i = 0; i < 7; i++) {
      const date = new Date(start); date.setDate(date.getDate() + i);
      const key = Today._dateKey(date);
      if (key > today) continue;
      const has = Object.prototype.hasOwnProperty.call(log, key);
      if (has || key === lastDay) days++;
      const n = Number(log[key]);
      if (Number.isFinite(n) && n > 0) correct += Math.floor(n);
    }
    return { correct, days };
  },

  _clear() {
    clearTimeout(this.timer); this.timer = null; this.active = null;
    this.root.classList.remove('companion-speaking', 'companion-wave', 'companion-hop');
    this.bubble.textContent = '';
  },

  _image(id) { this.image.src = 'images/mascot/tho-' + id + '.webp?v=1'; },

  _speak(id, text, action, motion) {
    this._clear(); this.active = action;
    this._image(id); this.bubble.textContent = text;
    this.root.classList.add('companion-speaking');
    if (!this.motion.matches && motion) {
      void this.image.offsetWidth;
      this.root.classList.add('companion-' + motion);
    }
    // Reduced motion suppresses movement, not the time available to read.
    this.timer = setTimeout(() => {
      this._clear(); this._image('vay-tay'); this.sync();
    }, this.DURATION);
  },

  _receipt(key) {
    if (this.celebrated.has(key)) return true;
    try { return localStorage.getItem(this.PREFIX + key) === '1'; }
    catch (_) { return false; }
  },

  _celebrate(s) {
    // Save before playing; reload cannot replay the same day's celebration.
    this.celebrated.add(s.key);
    try { localStorage.setItem(this.PREFIX + s.key, '1'); } catch (_) { /* session fallback */ }
    this._speak('an-mung', 'Con đã xong ' + s.plan.tasks.length + ' việc hôm nay!', 'celebrate', 'hop');
  },

  sync() {
    if (!this.initialized) return;
    const quiz = !!document.querySelector('#screenQuiz.active');
    this.button.disabled = quiz;
    if (quiz || !this.desktop.matches || document.hidden) {
      this._clear(); this._image(quiz ? 'doc-sach' : 'vay-tay'); return;
    }
    const s = this.snapshot();
    if (this.identity !== s.key) {
      this._clear(); this.identity = s.key;
    }
    if (!this.greeted.has(s.key)) {
      this.greeted.add(s.key);
      this._speak('vay-tay', 'Mình cùng học nhé!', 'greet', 'wave'); return;
    }
    if (this.active === 'greet') return;
    if (s.plan && s.remaining === 0 && !this._receipt(s.key)) {
      this._celebrate(s); return;
    }
    if (this.active) return;
    if (s.remaining > 0 && !this.reminded.has(s.key)) {
      this.reminded.add(s.key);
      this._speak('co-vu', 'Kế hoạch hôm nay còn ' + s.remaining + ' việc.', 'remind', 'wave');
    }
  },

  tap() {
    if (!this.initialized || this.button.disabled || !this.desktop.matches || document.hidden) return;
    const s = this.snapshot();
    const facts = s.player ? this.weekFacts(Storage.getStudyLog(), s.data.lastStudyDate, App._weekStart(), s.date) : {correct:0,days:0};
    const lines = [];
    if (facts.correct > 0) lines.push('Tuần này con đã đúng ' + facts.correct + ' câu.');
    if (facts.days > 0) lines.push('Tuần này con đã học ' + facts.days + ' ngày.');
    if (s.remaining > 0) lines.push('Kế hoạch hôm nay còn ' + s.remaining + ' việc.');
    if (s.plan && s.remaining === 0) lines.push('Con đã xong ' + s.plan.tasks.length + ' việc hôm nay.');
    if (!lines.length) lines.push('Mình cùng học nhé!');
    const images = ['ngon-cai', 'om-sao', 'co-vu', 'vay-tay'];
    const index = this.tapIndex++;
    this._speak(images[index % images.length], lines[index % lines.length], 'tap', 'wave');
  }
};
window.Companion = Companion;
