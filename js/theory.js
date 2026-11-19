/**
 * 📒 Lý thuyết — bài học ngắn để bé xem lại quy tắc khi quên.
 * Dữ liệu: data/theory/<lớp>.json (mỗi lớp một file; lớp chưa có file → lời nhắn thân thiện).
 * Hai lối vào: nút "Lý thuyết" trên menu (màn screenTheory) và nút "Xem lại bài" khi bé trả lời sai
 * (mở dạng hộp nổi ngay trên câu hỏi, đóng lại là về đúng câu đang làm).
 * Câu hỏi nối với bài: q.theoryId → questionIds → skills (chỉ câu có id đúng tiền tố môn).
 * Module chỉ đọc dữ liệu, không ghi localStorage.
 */
const Theory = {
  VERSION: '20261119th5',
  _cache: {},      // grade → data | null (null = lớp chưa có lý thuyết)
  _loading: {},    // grade → Promise
  _view: null,     // id bài đang mở trên màn Lý thuyết (null = danh sách)
  _tab: null,      // id môn đang chọn ở danh sách (null = môn đầu tiên)
  _failed: {},     // grade → true khi lần tải gần nhất lỗi mạng (chưa ghi cache, lần sau thử lại)
  _attachSeq: 0,   // chặn gắn nút "Xem lại bài" nhầm sang câu sau khi dữ liệu tải chậm
  _prevFocus: null,

  _grade() { return (window.App && App.currentGrade) || 'lop3'; },

  load(grade) {
    grade = grade || this._grade();
    if (grade in this._cache) return Promise.resolve(this._cache[grade]);
    if (this._loading[grade]) return this._loading[grade];
    // 404 = lớp chưa có lý thuyết (ghi cache null). Lỗi mạng/khác: không ghi cache để lần sau thử lại.
    this._loading[grade] = fetch('data/theory/' + encodeURIComponent(grade) + '.json?v=' + this.VERSION)
      .then(r => {
        if (r.status === 404) return null;
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(d => { this._cache[grade] = this._index(d); delete this._failed[grade]; delete this._loading[grade]; return this._cache[grade]; })
      .catch(() => { this._failed[grade] = true; delete this._loading[grade]; return null; });
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
      if (this._failed[grade] && !this._loading[grade]) {
        box.innerHTML = '<div class="card th-empty"><div class="th-empty-icon">📶</div><b>Chưa mở được sổ lý thuyết.</b><p>Mạng đang chập chờn. Con thử lại nhé!</p><button class="btn-primary" data-th="retry">🔄 Thử lại</button></div>';
        this._wire(box);
        return;
      }
      box.innerHTML = '<div class="loading-text">Đang mở sổ lý thuyết...</div>';
      this.load(grade).then(() => { if (this._grade() === grade) this.render(); });
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
    const subs = d.subjects || [];
    const cur = subs.find(s => s.id === this._tab) || subs[0];
    const tabs = subs.length > 1 ? `<div class="th-tabs" role="tablist" aria-label="Chọn môn">${subs.map(s => `
        <button class="th-tab${s === cur ? ' active' : ''}" role="tab" aria-selected="${s === cur}" data-th="tab" data-id="${this._esc(s.id)}">${this._esc(s.icon || '')} ${this._esc(s.name)}</button>`).join('')}
      </div>` : '';
    box.innerHTML = tabs + [cur].filter(Boolean).map(s => `
      <section class="th-subject" role="tabpanel">
        ${subs.length > 1 ? '' : `<h3 class="th-subject-title">${this._esc(s.icon || '')} ${this._esc(s.name)}</h3>`}
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
    const d = this._data();
    if (id && d && d._byId[id]) this._tab = d._byId[id].subject;
    if (window.App) App.showScreen('theory');
    else this.render();
  },

  /** Nội dung một bài (dùng chung cho màn Lý thuyết và hộp nổi). */
  _lessonHtml(l, inModal) {
    const f = s => this._fmt(s);
    const list = arr => (arr || []).map(x => `<li>${f(x)}</li>`).join('');
    const n = this._practiceCount(l);
    const t = l.table;
    const en = l.subject === 'tieng-anh' ? ' lang="en"' : '';
    return `
      <div class="th-lesson">
        <div class="th-lesson-head">
          <span class="th-lesson-icon">${this._esc(l.icon || '📒')}</span>
          <div><h2>${this._esc(l.title)}</h2>${l.book ? `<small>${this._esc(l.book)}</small>` : ''}</div>
        </div>
        ${l.rule && l.rule.length ? `<div class="th-box th-rule"><div class="th-box-title">💡 Nhớ nhanh</div><ul>${list(l.rule)}</ul></div>` : ''}
        ${l.divisions && l.divisions.length ? `<div class="th-box th-div-box"><div class="th-box-title">🧮 Đặt tính rồi tính</div>
          <div class="th-div-list">${l.divisions.map(v => this._divisionHtml(v)).join('')}</div></div>` : ''}
        ${t ? `<div class="th-box th-table-box">${t.title ? `<div class="th-box-title">📋 ${this._esc(t.title)}</div>` : ''}
          <div class="th-table-wrap"><table class="th-table">
            ${t.head ? `<thead><tr>${t.head.map(h => `<th>${f(h)}</th>`).join('')}</tr></thead>` : ''}
            <tbody>${(t.rows || []).map(r => `<tr>${r.map(c => `<td>${f(c)}</td>`).join('')}</tr>`).join('')}</tbody>
          </table></div></div>` : ''}
        ${l.examples && l.examples.length ? `<div class="th-box th-ex"><div class="th-box-title">🗣️ Ví dụ</div><ul${en}>${list(l.examples)}</ul></div>` : ''}
        ${l.mistakes && l.mistakes.length ? `<div class="th-box th-mis"><div class="th-box-title">⚠️ Lỗi hay gặp</div>
          ${l.mistakes.map(m => `<div class="th-mis-row">
            <div class="th-mis-wrong"><span class="th-tag th-tag-bad">✗ Sai</span><span${en}>${f(m.wrong)}</span></div>
            <div class="th-mis-right"><span class="th-tag th-tag-ok">✓ Đúng</span><span${en}>${f(m.right)}</span></div>
            ${m.why ? `<div class="th-mis-why">${f(m.why)}</div>` : ''}
          </div>`).join('')}</div>` : ''}
        ${l.tip ? `<div class="th-box th-tip"><div class="th-box-title">🐰 Mẹo nhớ</div><p>${f(l.tip)}</p></div>` : ''}
        ${l.check && l.check.length ? `<div class="th-box th-check"><div class="th-box-title">✅ Tự kiểm tra</div>
          ${l.check.map((c, i) => `<div class="th-check-row">
            <span class="th-check-q"${en}>${i + 1}. ${f(c.q)}</span>
            <button class="th-reveal" data-th="reveal" aria-expanded="false">Xem đáp án</button>
            <span class="th-check-a hidden"${en}>→ ${f(c.a)}</span>
          </div>`).join('')}</div>` : ''}
        <div class="th-actions">
          ${inModal
            ? '<button class="btn-primary th-close-main" data-th="close">← Quay lại câu hỏi</button>'
            : `${n ? `<button class="btn-primary" data-th="practice" data-id="${this._esc(l.id)}">✏️ Luyện ${n} câu</button>` : ''}
               <button class="btn-secondary" data-th="list">📒 Các bài khác</button>`}
        </div>
      </div>`;
  },

  // ─── Khung đặt tính chia kiểu Vở bài tập Toán 3 (số bị chia | số chia, thương dưới số chia) ───
  /** Các bước chia từ trái sang phải. Chỉ nhận số tự nhiên, số chia 1 chữ số (lớp 3). */
  _divide(a, b) {
    a = Math.floor(Number(a)); b = Math.floor(Number(b));
    if (!(a >= 0) || !(b >= 1 && b <= 9)) return null;
    const ds = String(a).split('').map(Number), steps = [];
    let cur = 0, started = false;
    ds.forEach((dg, i) => {
      cur = cur * 10 + dg;
      if (!started && cur < b && i < ds.length - 1) return;   // chưa đủ để chia: lấy thêm chữ số
      started = true;
      const q = Math.floor(cur / b), prod = q * b, rem = cur - prod;
      steps.push({ cur, q, prod, rem, end: i, next: i < ds.length - 1 ? ds[i + 1] : null });
      cur = rem;
    });
    const quot = Math.floor(a / b), rem = a % b;
    return { a, b, ds, steps, quot, rem };
  },

  _divisionHtml(v) {
    const r = this._divide(v.a, v.b);
    if (!r) return '';
    const n = r.ds.length, rows = [];
    const row = (text, end, ul) => rows.push(`<div class="dv-row"><span class="dv-num${ul ? ' dv-ul' : ''}" style="margin-left:${end + 1 - text.length}ch">${text}</span></div>`);
    r.steps.forEach((st, k) => {
      row(String(st.prod), st.end, true);
      if (st.next != null) row(String(st.rem) + st.next, st.end + 1, false);
      else row(String(st.rem), st.end, false);
    });
    const res = `${r.a} : ${r.b} = ${r.quot}${r.rem ? ` (dư ${r.rem})` : ''}`;
    const steps = v.steps ? `<ol class="dv-steps">${r.steps.map((st, k) => {
      const head = k === 0 ? '' : `Hạ ${r.ds[st.end]}; `;
      return `<li>${head}${st.cur} chia ${r.b} được ${st.q}, viết ${st.q}. ${st.q} nhân ${r.b} bằng ${st.prod}; ${st.cur} trừ ${st.prod} bằng ${st.rem}.</li>`;
    }).join('')}</ol>` : '';
    return `<figure class="dv-item">
      <div class="dv" role="img" aria-label="Đặt tính ${res}">
        <div class="dv-left" style="width:${n}ch">
          <div class="dv-row"><span class="dv-num" style="margin-left:0">${r.ds.join('')}</span></div>
          ${rows.join('')}
        </div>
        <div class="dv-right"><div class="dv-divisor">${r.b}</div><div class="dv-quot">${r.quot}</div></div>
      </div>
      <figcaption class="dv-res">${this._esc(res)}</figcaption>
      ${steps}
    </figure>`;
  },

  _renderLesson(box, l) {
    this._tab = l.subject;
    box.innerHTML = `<button class="btn-nav th-back" data-th="list">← Các bài lý thuyết</button>` + this._lessonHtml(l, false);
    this._wire(box);
  },

  _wire(root) {
    root.querySelectorAll('[data-th]').forEach(el => el.addEventListener('click', e => {
      e.stopPropagation();
      const act = el.dataset.th;
      if (act === 'open') { this._view = el.dataset.id; this.render(); window.scrollTo(0, 0); }
      else if (act === 'tab') { this._tab = el.dataset.id; this._view = null; this.render(); }
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
      else if (act === 'retry') { delete this._failed[this._grade()]; this.render(); }
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
    // Môn chia giáo trình (Tiếng Anh): dùng cổng duyệt của đề trộn. Môn khác (Toán): câu sẵn sàng, đúng giai đoạn đang học,
    // bỏ chủ đề luyện tốc độ / thử nghiệm (batch1Pilot, manualOnly) như kế hoạch hôm nay.
    if (s.books && s.books.length) return { s, hits: App._reviewSetHits(s, ids, { scope: 'stage' }) };
    const want = new Set(ids), hits = [];
    (s.topics || []).forEach(t => {
      if (t.drill || t.manualOnly || t.batch1Pilot) return;
      const allowed = App._allowedIndices(s, t);
      const ok = allowed === null ? null : new Set(allowed);
      (t.questions || []).forEach((q, i) => {
        if (!q || !want.has(q.id) || (ok && !ok.has(i))) return;
        if (!App.questionReady(q) || q.pilotCheck || q.type === 'spell-fix') return;
        hits.push({ t, q, i });
      });
    });
    return { s, hits };
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
    const seq = ++this._attachSeq;
    const grade = this._grade();
    const mount = () => {
      if (seq !== this._attachSeq || this._grade() !== grade) return;   // bé đã sang câu khác / đổi lớp
      this._mountLink(q);
    };
    if (grade in this._cache) mount();
    else this.load(grade).then(mount);
  },

  _mountLink(q) {
    const l = this.lessonFor(q);
    const fb = document.getElementById('feedback');
    if (!l || !fb || document.getElementById('fbTheory')) return;
    const b = document.createElement('button');
    b.type = 'button';
    b.id = 'fbTheory';
    b.className = 'fb-theory';
    b.textContent = '📒 Xem lại bài: ' + l.title;
    b.addEventListener('click', e => { e.stopPropagation(); this.showModal(l.id); });
    fb.appendChild(b);
  },

  clearLink() {
    this._attachSeq++;
    const old = document.getElementById('fbTheory');
    if (old) old.remove();
  },

  showModal(id) {
    const d = this._data();
    const l = d && d._byId[id];
    if (!l) return;
    this.closeModal();
    this._prevFocus = document.activeElement;
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
    // Focus nút ✕ ở đầu hộp (không cuộn), để bé thấy tiêu đề và "Nhớ nhanh" trước.
    const x = wrap.querySelector('.th-modal-x');
    if (x) x.focus({ preventScroll: true });
    wrap.scrollTop = 0;
  },

  closeModal() {
    const m = document.getElementById('theoryModal');
    if (m) m.remove();
    document.body.classList.remove('th-modal-open');
    if (this._onKey) { document.removeEventListener('keydown', this._onKey); this._onKey = null; }
    const prev = this._prevFocus;
    this._prevFocus = null;
    if (m && prev && prev.focus && document.contains(prev)) prev.focus({ preventScroll: true });
  }
};

window.Theory = Theory;
