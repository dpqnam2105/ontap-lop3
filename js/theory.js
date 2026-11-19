/**
 * 📒 Lý thuyết — bài học ngắn để bé xem lại quy tắc khi quên.
 * Dữ liệu: data/theory/<lớp>.json (mỗi lớp một file; lớp chưa có file → lời nhắn thân thiện).
 * Hai lối vào: nút "Lý thuyết" trên menu (màn screenTheory) và nút "Xem lại bài" khi bé trả lời sai
 * (mở dạng hộp nổi ngay trên câu hỏi, đóng lại là về đúng câu đang làm).
 * Câu hỏi nối với bài: q.theoryId → questionIds → skills (chỉ câu có id đúng tiền tố môn).
 * Module chỉ đọc dữ liệu, không ghi localStorage.
 */
const Theory = {
  VERSION: '20261119th1',
  _cache: {},      // grade → data | null (null = lớp chưa có lý thuyết)
  _loading: {},    // grade → Promise
  _view: null,     // id bài đang mở trên màn Lý thuyết (null = danh sách)

  _grade() { return (window.App && App.currentGrade) || 'lop3'; },

  load(grade) {
    grade = grade || this._grade();
    if (grade in this._cache) return Promise.resolve(this._cache[grade]);
    if (this._loading[grade]) return this._loading[grade];
    this._loading[grade] = fetch('data/theory/' + encodeURIComponent(grade) + '.json?v=' + this.VERSION)
      .then(r => (r.ok ? r.json() : null))
      .catch(() => null)
      .then(d => { this._cache[grade] = this._index(d); delete this._loading[grade]; return this._cache[grade]; });
    return this._loading[grade];
  },

  /** Dựng bảng tra nhanh: id bài, id câu → bài, skill → bài (theo môn). */
  _index(d) {
    if (!d || !Array.isArray(d.lessons)) return null;
    const byId = {}, byQ = {}, bySkill = {};
    d.lessons.forEach(l => {
      if (!l || !l.id) return;
      byId[l.id] = l;
      (l.questionIds || []).forEach(id => { if (!byQ[id]) byQ[id] = l.id; });
      (l.skills || []).forEach(sk => { const k = l.subject + '|' + sk; if (!bySkill[k]) bySkill[k] = l.id; });
    });
    d._byId = byId; d._byQ = byQ; d._bySkill = bySkill;
    return d;
  },

  _data() { return this._cache[this._grade()] || null; },

  _subjectOfQ(d, q) {
    const id = String((q && q.id) || '');
    return (d.subjects || []).find(s => s.idPrefix && id.indexOf(s.idPrefix) === 0) || null;
  },

  /** Bài lý thuyết của một câu hỏi (null nếu chưa có). */
  lessonFor(q) {
    const d = this._data();
    if (!d || !q) return null;
    if (q.theoryId && d._byId[q.theoryId]) return d._byId[q.theoryId];
    if (q.id && d._byQ[q.id]) return d._byId[d._byQ[q.id]];
    const s = this._subjectOfQ(d, q);
    if (s && q.skill && d._bySkill[s.id + '|' + q.skill]) return d._byId[d._bySkill[s.id + '|' + q.skill]];
    return null;
  },

  // ─── Định dạng chữ: escape trước, rồi **đậm** và ~~gạch~~ ───
  _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  _fmt(s) {
    return this._esc(s)
      .replace(/\*\*(.+?)\*\*/g, '<b class="th-hl">$1</b>')
      .replace(/~~(.+?)~~/g, '<s class="th-bad">$1</s>');
  },

  // ─── Màn Lý thuyết (menu) ───
  render() {
    const box = document.getElementById('theoryBody');
    if (!box) return;
    const grade = this._grade();
    if (!(grade in this._cache)) {
      box.innerHTML = '<div class="loading-text">Đang mở sổ lý thuyết...</div>';
      this.load(grade).then(() => this.render());
      return;
    }
    const d = this._cache[grade];
    if (!d) {
      box.innerHTML = '<div class="card th-empty"><div class="th-empty-icon">📒</div><b>Lớp của con chưa có bài lý thuyết.</b><p>Bố mẹ sẽ thêm bài sớm thôi. Con vào học bài khác trước nhé!</p><button class="btn-primary" data-th="learn">📖 Vào học</button></div>';
      this._wire(box);
      return;
    }
    if (this._view && d._byId[this._view]) { this._renderLesson(box, d._byId[this._view], false); return; }
    this._view = null;
    box.innerHTML = (d.subjects || []).map(s => `
      <section class="th-subject">
        <h3 class="th-subject-title">${this._esc(s.icon || '')} ${this._esc(s.name)}</h3>
        ${(s.groups || []).map(g => `
          <div class="th-group">
            <div class="th-group-name">${this._esc(g.name)}</div>
            <div class="th-list">
              ${(g.lessons || []).map(id => d._byId[id]).filter(Boolean).map(l => `
                <button class="th-card" data-th="open" data-id="${this._esc(l.id)}">
                  <span class="th-card-icon">${this._esc(l.icon || '📒')}</span>
                  <span class="th-card-text"><b>${this._esc(l.title)}</b><small>${this._esc(l.book || '')}</small></span>
                  <span class="th-card-go" aria-hidden="true">›</span>
                </button>`).join('')}
            </div>
          </div>`).join('')}
      </section>`).join('');
    this._wire(box);
  },

  open(id) {
    this._view = id || null;
    if (window.App) App.showScreen('theory');
    else this.render();
  },

  /** Nội dung một bài (dùng chung cho màn Lý thuyết và hộp nổi). */
  _lessonHtml(l, inModal) {
    const f = s => this._fmt(s);
    const list = arr => (arr || []).map(x => `<li>${f(x)}</li>`).join('');
    const n = this._practiceCount(l);
    const t = l.table;
    return `
      <div class="th-lesson">
        <div class="th-lesson-head">
          <span class="th-lesson-icon">${this._esc(l.icon || '📒')}</span>
          <div><h2>${this._esc(l.title)}</h2>${l.book ? `<small>${this._esc(l.book)}</small>` : ''}</div>
        </div>
        ${l.rule && l.rule.length ? `<div class="th-box th-rule"><div class="th-box-title">💡 Nhớ nhanh</div><ul>${list(l.rule)}</ul></div>` : ''}
        ${t ? `<div class="th-box th-table-box">${t.title ? `<div class="th-box-title">📋 ${this._esc(t.title)}</div>` : ''}
          <div class="th-table-wrap"><table class="th-table">
            ${t.head ? `<thead><tr>${t.head.map(h => `<th>${f(h)}</th>`).join('')}</tr></thead>` : ''}
            <tbody>${(t.rows || []).map(r => `<tr>${r.map(c => `<td>${f(c)}</td>`).join('')}</tr>`).join('')}</tbody>
          </table></div></div>` : ''}
        ${l.examples && l.examples.length ? `<div class="th-box th-ex"><div class="th-box-title">🗣️ Ví dụ</div><ul lang="en">${list(l.examples)}</ul></div>` : ''}
        ${l.mistakes && l.mistakes.length ? `<div class="th-box th-mis"><div class="th-box-title">⚠️ Lỗi hay gặp</div>
          ${l.mistakes.map(m => `<div class="th-mis-row">
            <div class="th-mis-wrong"><span class="th-tag th-tag-bad">✗ Sai</span><span lang="en">${f(m.wrong)}</span></div>
            <div class="th-mis-right"><span class="th-tag th-tag-ok">✓ Đúng</span><span lang="en">${f(m.right)}</span></div>
            ${m.why ? `<div class="th-mis-why">${f(m.why)}</div>` : ''}
          </div>`).join('')}</div>` : ''}
        ${l.tip ? `<div class="th-box th-tip"><div class="th-box-title">🐰 Mẹo nhớ</div><p>${f(l.tip)}</p></div>` : ''}
        ${l.check && l.check.length ? `<div class="th-box th-check"><div class="th-box-title">✅ Tự kiểm tra</div>
          ${l.check.map((c, i) => `<div class="th-check-row">
            <span class="th-check-q" lang="en">${i + 1}. ${f(c.q)}</span>
            <button class="th-reveal" data-th="reveal" aria-expanded="false">Xem đáp án</button>
            <span class="th-check-a hidden" lang="en">→ ${f(c.a)}</span>
          </div>`).join('')}</div>` : ''}
        <div class="th-actions">
          ${inModal
            ? '<button class="btn-primary th-close-main" data-th="close">← Quay lại câu hỏi</button>'
            : `${n ? `<button class="btn-primary" data-th="practice" data-id="${this._esc(l.id)}">✏️ Luyện ${n} câu</button>` : ''}
               <button class="btn-secondary" data-th="list">📒 Các bài khác</button>`}
        </div>
      </div>`;
  },

  _renderLesson(box, l) {
    box.innerHTML = `<button class="btn-nav th-back" data-th="list">← Các bài lý thuyết</button>` + this._lessonHtml(l, false);
    this._wire(box);
  },

  _wire(root) {
    root.querySelectorAll('[data-th]').forEach(el => el.addEventListener('click', e => {
      e.stopPropagation();
      const act = el.dataset.th;
      if (act === 'open') { this._view = el.dataset.id; this.render(); window.scrollTo(0, 0); }
      else if (act === 'list') { this._view = null; this.render(); window.scrollTo(0, 0); }
      else if (act === 'reveal') {
        const a = el.parentNode.querySelector('.th-check-a');
        const show = a.classList.contains('hidden');
        a.classList.toggle('hidden', !show);
        el.textContent = show ? 'Ẩn đáp án' : 'Xem đáp án';
        el.setAttribute('aria-expanded', String(show));
      }
      else if (act === 'practice') this.practice(el.dataset.id);
      else if (act === 'close') this.closeModal();
      else if (act === 'learn' && window.App) App.goLearn();
    }));
  },

  // ─── Luyện 5 câu: lấy câu cùng bài trong ngân hàng (qua cổng duyệt + giai đoạn đang học) ───
  PRACTICE_SIZE: 5,

  _hits(l) {
    if (!window.App || !App.allData || !App._reviewSetHits) return { s: null, hits: [] };
    const d = this._data();
    const s = (App.allData.subjects || []).find(x => x.id === l.subject);
    if (!d || !s) return { s: null, hits: [] };
    const sub = (d.subjects || []).find(x => x.id === l.subject) || {};
    const prefix = sub.idPrefix || '';
    const ids = (l.questionIds || []).slice();
    const skills = new Set(l.skills || []);
    if (skills.size) (s.topics || []).forEach(t => (t.questions || []).forEach(q => {
      if (q && q.id && String(q.id).indexOf(prefix) === 0 && skills.has(q.skill) && !ids.includes(q.id)) ids.push(q.id);
    }));
    (s.topics || []).forEach(t => (t.questions || []).forEach(q => {
      if (q && q.theoryId === l.id && q.id && !ids.includes(q.id)) ids.push(q.id);
    }));
    return { s, hits: App._reviewSetHits(s, ids, { scope: 'stage' }) };
  },

  _practiceCount(l) {
    try { return Math.min(this.PRACTICE_SIZE, this._hits(l).hits.length); } catch (e) { return 0; }
  },

  practice(id) {
    const d = this._data();
    const l = d && d._byId[id];
    if (!l || !window.Quiz || !window.App) return;
    if (!App.playerName) { App.showScreen('register'); return; }
    const { s, hits } = this._hits(l);
    if (!s || !hits.length) { if (window.Rewards) Rewards._achievementPopup('🌱 Bài này chưa có câu luyện, con xem lại lý thuyết nhé!'); return; }
    Quiz.startMixed(App._reviewSetPick(s, hits, this.PRACTICE_SIZE), s.name, s.id, '', null,
      { title: '📒 ' + l.title, modeLabel: '✏️ Luyện theo lý thuyết', finishLabel: '✏️ ' + l.title });
    Quiz._setBack('theory');
  },

  // ─── Nút "Xem lại bài" trong ô nhận xét khi bé trả lời sai ───
  attachLink(q) {
    this.clearLink();
    const l = this.lessonFor(q);
    const fb = document.getElementById('feedback');
    if (!l || !fb) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.id = 'fbTheory';
    b.className = 'fb-theory';
    b.textContent = '📒 Xem lại bài: ' + l.title;
    b.addEventListener('click', e => { e.stopPropagation(); this.showModal(l.id); });
    fb.appendChild(b);
  },

  clearLink() {
    const old = document.getElementById('fbTheory');
    if (old) old.remove();
  },

  showModal(id) {
    const d = this._data();
    const l = d && d._byId[id];
    if (!l) return;
    this.closeModal();
    if (window.Speak) Speak.stop();
    const wrap = document.createElement('div');
    wrap.id = 'theoryModal';
    wrap.className = 'th-modal';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-modal', 'true');
    wrap.setAttribute('aria-label', 'Lý thuyết: ' + l.title);
    wrap.innerHTML = `<div class="th-modal-card card">
      <button class="th-modal-x" data-th="close" aria-label="Đóng">✕</button>
      ${this._lessonHtml(l, true)}
    </div>`;
    wrap.addEventListener('click', e => { if (e.target === wrap) this.closeModal(); });
    this._onKey = e => { if (e.key === 'Escape') this.closeModal(); };
    document.addEventListener('keydown', this._onKey);
    document.body.appendChild(wrap);
    document.body.classList.add('th-modal-open');
    this._wire(wrap);
    const x = wrap.querySelector('.th-close-main');
    if (x) x.focus();
  },

  closeModal() {
    const m = document.getElementById('theoryModal');
    if (m) m.remove();
    document.body.classList.remove('th-modal-open');
    if (this._onKey) { document.removeEventListener('keydown', this._onKey); this._onKey = null; }
  }
};

window.Theory = Theory;
