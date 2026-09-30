// =============================================
// TODAY.JS — màn "Hôm nay học gì?" + nhiệm vụ hằng ngày thật
// Mỗi ngày Rabbit chọn sẵn 3 việc từ dữ liệu thật của bé:
//   1) Ôn câu sai (nếu có)  2) Luyện 10 câu chủ đề còn yếu  3) Thử thách tuần (hoặc môn khác)
// Kế hoạch cố định trong ngày, lưu riêng từng bé. Xong cả 3 việc → +10 sao (1 lần/ngày).
// =============================================

const Today = {
  KEY: 'todayPlan',
  REWARD: 10,

  _dateKey(d) {
    const x = d || new Date();
    return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
  },

  _data() {
    return (App._dataByGrade && App._dataByGrade[App.currentGrade]) || null;
  },

  _subject(id) {
    const d = this._data();
    return d && d.subjects ? d.subjects.find(s => s.id === id) : null;
  },

  _allowed(s, t) {
    const a = App._allowedIndices(s, t);
    return a === null ? (t.questions || []).map((_, i) => i) : a;
  },

  _topicProgress(s, t) {
    const allowed = this._allowed(s, t);
    const set = new Set(allowed);
    const tot = Storage.getTotalProgress ? Storage.getTotalProgress((t.id || t.name).toString()) : { ok: [] };
    const ok = (tot.ok || []).filter(i => set.has(i)).length;
    return { ok, total: allowed.length, pct: allowed.length ? ok / allowed.length : 0 };
  },

  _rand(seed) {
    return App._seededRandom(seed + '|' + Storage.canonName(App.playerName || ''));
  },

  /** Chọn chủ đề nên luyện: chủ đề còn thấp nhất (chưa tới 90%), bốc ngẫu nhiên trong 3 chủ đề thấp nhất để đổi món. */
  _pickTopic(s, seed, exclude) {
    if (!s) return null;
    const cands = App._visibleTopics(s)
      .filter(t => !(exclude || []).includes(t.id))
      .map(t => ({ t, p: this._topicProgress(s, t) }))
      .filter(x => x.p.total >= 5 && x.p.pct < 0.9);
    if (!cands.length) return null;
    cands.sort((a, b) => a.p.pct - b.p.pct);
    const pool = cands.slice(0, 3);
    const r = this._rand(seed)();
    return pool[Math.floor(r * pool.length)];
  },

  _pendingWrong() {
    const d = this._data();
    if (!d || !Storage.getUnresolvedWrong) return 0;
    return Storage.getUnresolvedWrong(40).filter(it => {
      const s = d.subjects.find(x => x.id === it.subjectId);
      return s && (s.topics || []).some(t => (t.id || t.name).toString() === String(it.topicId));
    }).length;
  },

  _topicTask(id, s, pick, withSubject) {
    const t = pick.t;
    const sub = pick.p.ok === 0 ? 'Chủ đề mới cho con' : 'Con đã đúng ' + pick.p.ok + '/' + pick.p.total + ' câu — cố thêm nhé';
    return {
      id, kind: 'topic', subjectId: s.id, topicId: t.id,
      title: 'Luyện 10 câu ' + (withSubject ? s.name + ': ' : '') + t.name,
      sub, minutes: 5, icon: 'book', done: false
    };
  },

  build() {
    const d = this._data();
    if (!d || !d.subjects || !d.subjects.length) return null;
    const today = this._dateKey();
    const main = this._subject('toan') || d.subjects[0];
    const others = d.subjects.filter(s => s.id !== main.id && s.id !== 'toan-tieng-anh');
    const tasks = [];

    const wrongN = this._pendingWrong();
    if (wrongN > 0) {
      const n = Math.min(5, wrongN);
      tasks.push({ id: 'wrong', kind: 'wrong', n, title: 'Ôn lại ' + n + ' câu con từng sai', sub: 'Sửa lỗi cũ cho thật chắc', minutes: 3, icon: 'redo', done: false });
    }

    const used = [];
    const p1 = this._pickTopic(main, today + '|p1', used);
    if (p1) { tasks.push(this._topicTask('practice', main, p1, false)); used.push(p1.t.id); }

    let mixDone = false;
    try { mixDone = !!(Storage.get('weeklyMix') || {})[App._mixKey(main)]; } catch (e) { mixDone = false; }
    const mixCard = App._buildWeeklyMix(main);
    if (!mixDone && mixCard.pool.length >= 5) {
      tasks.push({ id: 'mix', kind: 'mix', subjectId: main.id, title: 'Thử thách tuần: ' + mixCard.pool.length + ' câu trộn', sub: 'Trộn các dạng con đã học trong tuần', minutes: 10, icon: 'dice', done: false });
    }

    // Còn thiếu thì thêm môn khác, xoay vòng theo ngày
    let k = new Date().getDate();
    for (let guard = 0; tasks.length < 3 && guard < 6; guard++, k++) {
      const s = others.length ? others[k % others.length] : main;
      const pick = this._pickTopic(s, today + '|o' + guard, s.id === main.id ? used : []);
      if (!pick) continue;
      if (tasks.some(x => x.topicId === pick.t.id)) continue;
      tasks.push(this._topicTask('practice' + (tasks.length + 1), s, pick, true));
    }
    return { date: today, grade: App.currentGrade, player: Storage.canonName(App.playerName || ''), tasks: tasks.slice(0, 3), rewarded: false };
  },

  plan() {
    if (!App.playerName || !this._data()) return null;
    let p = null;
    try { p = Storage.get(this.KEY); } catch (e) { p = null; }
    const player = Storage.canonName(App.playerName || '');
    if (!p || p.date !== this._dateKey() || p.grade !== App.currentGrade || p.player !== player || !Array.isArray(p.tasks)) {
      p = this.build();
      if (p) this.save(p);
    }
    return p;
  },

  save(p) { try { Storage.set(this.KEY, p); } catch (e) { /* bỏ qua */ } },

  nextIndex(p) {
    p = p || this.plan();
    if (!p) return -1;
    return p.tasks.findIndex(t => !t.done);
  },

  start(i) {
    const p = this.plan();
    if (!p || !p.tasks[i]) return;
    const task = p.tasks[i];
    const d = this._data();
    App.allData = d;
    if (task.kind === 'wrong') {
      Quiz.startWrongReview(task.n, task.id);
    } else if (task.kind === 'mix') {
      const s = this._subject(task.subjectId);
      const { key, pool } = App._buildWeeklyMix(s);
      Quiz.startMixed(pool, s.name, s.id, key, task.id);
    } else {
      const s = this._subject(task.subjectId);
      const t = s && s.topics.find(x => x.id === task.topicId);
      if (!t) { task.done = true; this.save(p); this.render(); return; }
      Quiz.start(t, s.name, { mode: 'practice', subjectId: s.id, allowed: this._allowed(s, t), count: 10, todayTaskId: task.id });
    }
  },

  startNext() {
    const i = this.nextIndex();
    if (i >= 0) this.start(i);
    else this.startExtra();
  },

  /** Đã xong kế hoạch: làm thêm một lượt 10 câu ở chủ đề còn yếu (không tính vào nhiệm vụ). */
  startExtra() {
    const d = this._data();
    if (!d) return;
    App.allData = d;
    const main = this._subject('toan') || d.subjects[0];
    const pick = this._pickTopic(main, String(Date.now()), []);
    if (!pick) { App.goLearn(); return; }
    Quiz.start(pick.t, main.name, { mode: 'practice', subjectId: main.id, allowed: this._allowed(main, pick.t), count: 10 });
  },

  onSessionFinish(info) {
    const p = this.plan();
    if (!p) return;
    let changed = false;
    p.tasks.forEach(t => {
      if (t.done) return;
      const hit = (info.taskId && info.taskId === t.id)
        || (t.kind === 'wrong' && info.mode === 'wrong_review')
        || (t.kind === 'mix' && info.mode === 'mixed' && info.subjectId === t.subjectId)
        || (t.kind === 'topic' && info.mode === 'practice' && info.topicId === t.topicId);
      if (hit) { t.done = true; changed = true; }
    });
    if (!changed) return;
    const allDone = p.tasks.length && p.tasks.every(t => t.done);
    if (allDone && !p.rewarded) {
      p.rewarded = true;
      this.save(p);
      Rewards.addStar(this.REWARD);
      setTimeout(() => {
        Rewards._achievementPopup('🎉 Con đã xong việc hôm nay! Thưởng ' + this.REWARD + ' sao!');
        if (Quiz._confettiBurst) Quiz._confettiBurst();
      }, 600);
    } else {
      this.save(p);
    }
    this.render();
  },

  // ─── Giao diện ─────────────────────────────

  ICONS: {
    redo: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#c25e00" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 5v6h-6"/></svg>',
    book: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d63d8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5a2 2 0 0 1 2-2h12v16H6a2 2 0 0 0-2 2z"/><path d="M8 7h6M8 11h6"/></svg>',
    dice: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#6b3fd4" stroke-width="2.2" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1.3" fill="#6b3fd4"/><circle cx="15" cy="15" r="1.3" fill="#6b3fd4"/><circle cx="15" cy="9" r="1.3" fill="#6b3fd4"/><circle cx="9" cy="15" r="1.3" fill="#6b3fd4"/></svg>',
    check: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    play: '<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z"/></svg>',
    flame: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e67e00" stroke-width="2.2" stroke-linejoin="round"><path d="M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-4 2-6 2 1 3 2 3 4 1-2 1-5 0-8z"/></svg>',
    star: '<svg width="16" height="16" viewBox="0 0 24 24" fill="#ffc928" stroke="#c98d00" stroke-width="1.6" stroke-linejoin="round"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>'
  },

  RABBIT: '<svg class="today-rabbit" width="74" height="86" viewBox="0 0 74 86" aria-hidden="true"><ellipse cx="25" cy="22" rx="8" ry="20" fill="#fff" stroke="#142033" stroke-width="2.5"/><ellipse cx="49" cy="22" rx="8" ry="20" fill="#fff" stroke="#142033" stroke-width="2.5"/><ellipse cx="25" cy="24" rx="3.5" ry="13" fill="#ffc6d3"/><ellipse cx="49" cy="24" rx="3.5" ry="13" fill="#ffc6d3"/><circle cx="37" cy="58" r="25" fill="#fff" stroke="#142033" stroke-width="2.5"/><circle cx="28" cy="55" r="3.2" fill="#142033"/><circle cx="46" cy="55" r="3.2" fill="#142033"/><ellipse cx="37" cy="63" rx="3.5" ry="2.5" fill="#f28b9c"/><circle cx="21" cy="64" r="4" fill="#ffd5de"/><circle cx="53" cy="64" r="4" fill="#ffd5de"/></svg>',

  _esc(s) { return App._escape(s); },

  _levelInfo() {
    try {
      const d = Rewards._loadData();
      const need = Rewards._xpForNextLevel(d.level);
      return { level: d.level || 1, xp: d.xp || 0, need, stars: d.stars || 0, streak: d.streak || 0 };
    } catch (e) { return { level: 1, xp: 0, need: 80, stars: 0, streak: 0 }; }
  },

  render() {
    const screen = document.getElementById('screenRegister');
    const box = document.getElementById('todayCard');
    if (!screen || !box) return;
    const p = this.plan();
    if (!App.playerName || !p) {
      screen.classList.remove('has-today');
      box.classList.add('hidden');
      return;
    }
    screen.classList.add('has-today');
    box.classList.remove('hidden');

    const L = this._levelInfo();
    const names = { lop2: 'Lớp 2', lop3: 'Lớp 3', lop4: 'Lớp 4', lop5: 'Lớp 5' };
    const doneN = p.tasks.filter(t => t.done).length;
    const allDone = doneN === p.tasks.length;
    const nextI = p.tasks.findIndex(t => !t.done);
    const minutes = p.tasks.filter(t => !t.done).reduce((a, t) => a + (t.minutes || 0), 0);
    const bubble = allDone
      ? 'Con đã xong việc hôm nay rồi! Giỏi quá! Muốn luyện thêm thì bấm nút bên dưới nhé.'
      : (doneN === 0
        ? 'Hôm nay mình học khoảng <b>' + minutes + ' phút</b> nhé! Rabbit đã chọn sẵn ' + p.tasks.length + ' việc cho con.'
        : 'Con làm tốt lắm! Còn <b>' + (p.tasks.length - doneN) + ' việc</b> nữa, khoảng ' + minutes + ' phút thôi.');

    const rows = p.tasks.map((t, i) => {
      const state = t.done ? 'done' : (i === nextI ? 'next' : 'todo');
      const icon = t.done ? '<div class="tt-icon tt-icon-done">' + this.ICONS.check + '</div>'
        : '<div class="tt-icon tt-icon-' + t.icon + '">' + (this.ICONS[t.icon] || this.ICONS.book) + '</div>';
      return `<button type="button" class="tt-row tt-${state}" data-task="${i}">
        ${icon}
        <span class="tt-text"><b>${this._esc(t.title)}</b><small>${t.done ? 'Xong rồi!' : this._esc(t.sub)}</small></span>
        <span class="tt-min">${t.done ? '✓' : t.minutes + ' phút'}</span>
      </button>`;
    }).join('<div class="tt-sep"></div>');

    const btnLabel = allDone ? 'Làm thêm một lượt' : (doneN === 0 ? 'Bắt đầu học' : 'Học tiếp');

    box.innerHTML = `
      <div class="today-head">
        <div class="today-avatar">${this._esc((App.playerName || '?').split(' ').map(w => w[0]).slice(-2).join('').toUpperCase())}</div>
        <div class="today-hello">
          <b>Chào ${this._esc(App.playerName)}!</b>
          <span>${names[App.currentGrade] || ''} · <button type="button" class="link-btn" data-act="grade">Đổi lớp</button></span>
        </div>
        <div class="today-chips">
          <span class="today-chip chip-streak">${this.ICONS.flame}${L.streak} ngày</span>
          <span class="today-chip chip-star">${this.ICONS.star}${L.stars}</span>
        </div>
      </div>
      <div class="today-level" title="Level ${L.level}">
        <span>Level ${L.level}</span>
        <div class="today-level-bar"><div style="width:${Math.min(100, Math.round(L.xp / L.need * 100))}%"></div></div>
        <small>còn ${Math.max(0, L.need - L.xp)} XP lên Level ${L.level + 1}</small>
      </div>
      <div class="today-say">${this.RABBIT}<div class="today-bubble">${bubble}</div></div>
      <div class="today-plan">
        <div class="today-plan-head"><b>Kế hoạch hôm nay</b><span>${doneN}/${p.tasks.length} xong${p.rewarded ? ' · đã nhận ' + this.REWARD + ' ⭐' : ' · xong hết +' + this.REWARD + ' ⭐'}</span></div>
        ${rows}
      </div>
      <button type="button" class="today-go${allDone ? ' today-go-extra' : ''}" data-act="go">${this.ICONS.play}${btnLabel}</button>
      <div class="today-links"><button type="button" class="link-btn" data-act="pick">Con muốn tự chọn bài</button></div>`;

    box.querySelectorAll('.tt-row').forEach(b => b.addEventListener('click', () => {
      const i = Number(b.dataset.task);
      if (p.tasks[i] && !p.tasks[i].done) this.start(i);
    }));
    box.querySelector('[data-act="go"]').addEventListener('click', () => this.startNext());
    box.querySelector('[data-act="pick"]').addEventListener('click', () => App.goLearn());
    box.querySelector('[data-act="grade"]').addEventListener('click', () => App.showScreen('grade'));
  },

  /** Phần thêm ở màn kết quả: sao/XP vừa nhận, thanh level, việc tiếp theo, làm thêm một lượt. */
  renderResult(gain) {
    const box = document.getElementById('resExtra');
    if (!box) return;
    const L = this._levelInfo();
    const p = this.plan();
    const nextI = p ? p.tasks.findIndex(t => !t.done) : -1;
    const next = nextI >= 0 ? p.tasks[nextI] : null;
    const doneN = p ? p.tasks.filter(t => t.done).length : 0;
    const planLine = p ? (next
      ? 'Kế hoạch hôm nay: ' + doneN + '/' + p.tasks.length + ' việc'
      : 'Con đã xong cả ' + p.tasks.length + ' việc hôm nay!') : '';

    box.innerHTML = `
      <div class="res-gain">
        <span class="res-chip">${this.ICONS.star}+${gain.stars} sao</span>
        <span class="res-chip res-chip-xp">+${gain.xp} XP</span>
      </div>
      <div class="today-level res-level">
        <span>Level ${L.level}</span>
        <div class="today-level-bar"><div style="width:${Math.min(100, Math.round(L.xp / L.need * 100))}%"></div></div>
        <small>còn ${Math.max(0, L.need - L.xp)} XP lên Level ${L.level + 1}</small>
      </div>
      ${planLine ? `<div class="res-plan">${this._esc(planLine)}</div>` : ''}
      <div class="res-actions">
        ${next ? `<button type="button" class="today-go" data-act="next">${this.ICONS.play}Việc tiếp theo: ${this._esc(next.title)}</button>` : ''}
        <button type="button" class="${next ? 'btn-secondary res-more' : 'today-go'}" data-act="more">${next ? '' : this.ICONS.play}Làm thêm một lượt</button>
        <button type="button" class="btn-secondary" data-act="home">🏠 Về trang chủ</button>
      </div>`;
    const nb = box.querySelector('[data-act="next"]');
    if (nb) nb.addEventListener('click', () => this.start(nextI));
    box.querySelector('[data-act="more"]').addEventListener('click', () => this.relaunch());
    box.querySelector('[data-act="home"]').addEventListener('click', () => { App.showScreen('register'); });
  },

  /** Làm lại đúng loại bài vừa làm (không tính vào nhiệm vụ). */
  relaunch() {
    const l = Quiz._lastLaunch;
    if (!l) { this.startExtra(); return; }
    if (l.type === 'wrong') Quiz.startWrongReview(l.limit);
    else if (l.type === 'mixed') Quiz.startMixed(l.pool, l.subjectName, l.subjectId, l.mixKey);
    else Quiz.start(l.topic, l.subjectName, l.options);
  }
};

window.Today = Today;
