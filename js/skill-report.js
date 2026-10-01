// =============================================
// SKILL-REPORT.JS — Báo cáo kỹ năng cho bố mẹ + Rabbit gợi ý
// Nguồn: lịch ôn (Leitner) + lịch sử câu sai của bé.
// Bé đang dùng máy này → đọc ngay trên máy; bé khác → đọc bản sao lưu trên mạng.
// =============================================

const SkillReport = {
  SUBJECTS: [
    { id: 'toan', name: 'Toán', icon: '🔢' },
    { id: 'tieng-viet', name: 'Tiếng Việt', icon: '📖' },
    { id: 'tieng-anh', name: 'Tiếng Anh', icon: '🌍' },
    { id: 'toan-tieng-anh', name: 'Toán Tiếng Anh', icon: '🧮' }
  ],
  _bank: null,
  _labels: null,
  _token: 0,

  _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  /** Câu cũ chưa gắn kỹ năng (bảng nhân chia): đoán từ đề "4 × 3" / "12 : 4". */
  _guessSkill(q) {
    const t = String(q.q || '');
    let m = t.match(/^\s*(\d)\s*[×x]\s*\d+\s*=/);
    if (m) return 'times-' + m[1];
    m = t.match(/^\s*\d+\s*:\s*(\d)\s*=/);
    if (m) return 'divide-' + m[1];
    return '';
  },

  async _loadBank() {
    if (this._bank) return this._bank;
    if (!this._labels) {
      try { this._labels = (await fetch('data-lop3/skills.json').then(r => r.json())).labels || {}; } catch (e) { this._labels = {}; }
    }
    const data = await API.getAllData('lop3');
    const byId = {};
    const topics = {};
    ((data && data.subjects) || []).forEach(s => {
      const L = this._labels[s.id] || {};
      (s.topics || []).forEach(t => {
        const tid = t.id || t.name;
        topics[tid] = { id: tid, name: t.name, subjectId: s.id, total: 0, stages: {} };
        (t.questions || []).forEach((q, i) => {
          const code = q.skill || this._guessSkill(q);
          const skillKey = s.id + ':' + tid + ':' + (code || '_');
          const label = (code && L[code]) || t.name;
          const item = { subjectId: s.id, topicId: tid, topicName: t.name, skillKey, label, q: q.q, stage: q.stage || 1 };
          byId[q.id || (tid + '_' + i)] = item;
          // id dự phòng giống quiz.js khi câu không có id
          if (q.id) byId[tid + '_' + i] = byId[tid + '_' + i] || item;
          topics[tid].total++;
          topics[tid].stages[item.stage] = (topics[tid].stages[item.stage] || 0) + 1;
        });
      });
    });
    this._bank = { byId, topics };
    return this._bank;
  },

  async _childData(name) {
    const c = Storage.canonName(name);
    if (c && c === Storage.canonName(Storage.getActiveName())) {
      return { review: Storage.getReviewMap(), wrong: Storage.getWrongHistory(), source: 'local' };
    }
    if (window.Cloud && Cloud.enabled()) {
      try {
        const r = await Cloud.fetchRemote(name);
        if (r && r.ok && r.found && r.snapshot) {
          const k = r.snapshot.keys || {};
          const parse = x => { try { return JSON.parse(x || '{}') || {}; } catch (e) { return {}; } };
          return { review: parse(k[Storage.REVIEW_KEY]), wrong: parse(k[Storage.WRONG_HISTORY_KEY]), source: 'cloud', at: r.meta && r.meta.at };
        }
      } catch (e) { console.warn('SkillReport cloud', e); }
    }
    return { review: {}, wrong: {}, source: 'none' };
  },

  /** Gộp dữ liệu từng câu thành thống kê theo kỹ năng và chủ đề. */
  compute(bank, review, wrong) {
    const ids = new Set([...Object.keys(review || {}), ...Object.keys(wrong || {})]);
    const skills = {};
    const topics = {};
    const now = Date.now();
    ids.forEach(id => {
      const meta = bank.byId[id];
      if (!meta) return;
      const r = review[id];
      const w = wrong[id];
      let state = 'learning';
      if (r && r.box >= 0) {
        if (r.box === 0) state = 'wrong';
        else if (r.box >= Storage.MASTER_BOX) state = 'solid';
        else state = 'once';
      } else if (w) {
        state = (w.lastWrong && (!w.lastCorrect || w.lastWrong > w.lastCorrect)) ? 'wrong' : 'once';
      }
      const due = !!(r && r.box >= 1 && r.due && r.due <= now);
      const wc = (w && w.wrongCount) || 0;
      const lastWrong = (w && w.lastWrong) || '';
      [[skills, meta.skillKey, { label: meta.label, subjectId: meta.subjectId, topicName: meta.topicName }],
       [topics, meta.topicId, { label: meta.topicName, subjectId: meta.subjectId }]].forEach(([bag, key, base]) => {
        const s = bag[key] || (bag[key] = Object.assign({ key, seen: 0, solid: 0, wrong: 0, once: 0, due: 0, wrongTimes: 0, n: 0, ok: 0, lastWrongQ: '', lastWrongDay: '' }, base));
        s.seen++;
        if (state === 'solid') s.solid++;
        else if (state === 'wrong') s.wrong++;
        else s.once++;
        if (due) s.due++;
        s.wrongTimes += wc;
        if (r && r.n) { s.n += r.n; s.ok += r.ok || 0; }
        if (state === 'wrong' && lastWrong >= s.lastWrongDay) { s.lastWrongDay = lastWrong; s.lastWrongQ = meta.q; }
      });
    });
    Object.values(skills).forEach(s => { s.status = this._status(s); });
    Object.values(topics).forEach(t => { t.status = this._status(t); t.total = (bank.topics[t.key] || {}).total || 0; });
    return { skills, topics, seen: ids.size };
  },

  _status(s) {
    if (s.seen >= 2 && (s.wrong / s.seen >= 0.34 || (s.wrong >= 3 && s.wrong / s.seen >= 0.2))) return 'weak';
    if (s.seen >= 3 && s.solid / s.seen >= 0.8) return 'solid';
    if (s.seen >= 3 && (s.solid + s.once) / s.seen >= 0.8 && s.wrong === 0) return 'almost';
    return 'learning';
  },

  STATUS: {
    weak: { text: 'Cần ôn', cls: 'sk-weak' },
    learning: { text: 'Đang học', cls: 'sk-learning' },
    almost: { text: 'Sắp vững', cls: 'sk-almost' },
    solid: { text: 'Đã vững', cls: 'sk-solid' }
  },

  /** 3–5 câu gợi ý ngắn cho bố mẹ. */
  suggestions(stats, childName) {
    const out = [];
    const sk = Object.values(stats.skills);
    const weak = sk.filter(s => s.status === 'weak').sort((a, b) => (b.wrong - a.wrong) || (b.wrongTimes - a.wrongTimes)).slice(0, 3);
    weak.forEach(s => {
      out.push({
        icon: '🎯',
        html: '<b>' + this._esc(s.label) + '</b>: còn ' + s.wrong + '/' + s.seen + ' câu đang sai.' +
          (s.lastWrongQ ? ' <span class="sk-eg">Ví dụ: «' + this._esc(String(s.lastWrongQ).slice(0, 90)) + (String(s.lastWrongQ).length > 90 ? '…' : '') + '»</span>' : '')
      });
    });
    if (weak.length) out.push({ icon: '👉', html: 'Bố mẹ ngồi làm cùng con 1–2 câu ở dạng trên; các câu con sai, Rabbit sẽ tự đưa lại vào phần "Ôn lại".' });
    const almost = sk.filter(s => s.status === 'almost' || (s.status === 'learning' && s.once >= 3 && s.wrong === 0)).sort((a, b) => b.once - a.once).slice(0, 2);
    almost.forEach(s => {
      out.push({ icon: '🌱', html: '<b>' + this._esc(s.label) + '</b> sắp vững (' + s.once + ' câu mới đúng 1 lần, đúng lại vào hôm khác là vững).' });
    });
    const solid = sk.filter(s => s.status === 'solid').sort((a, b) => b.solid - a.solid).slice(0, 2);
    if (solid.length) out.push({ icon: '🌟', html: 'Con đã vững: <b>' + solid.map(s => this._esc(s.label)).join('</b>, <b>') + '</b>. Bố mẹ khen con nhé!' });
    const dueTotal = sk.reduce((a, s) => a + s.due, 0);
    if (dueTotal >= 5) out.push({ icon: '🧠', html: 'Có <b>' + dueTotal + '</b> câu đến hạn ôn (sắp quên). Nhắc ' + this._esc(childName) + ' làm việc "Ôn lại" trong Hôm nay học gì.' });
    if (!out.length) out.push({ icon: '🐰', html: stats.seen ? 'Chưa đủ dữ liệu để nhận xét. Con làm thêm vài lượt nữa, Rabbit sẽ có gợi ý cụ thể.' : 'Chưa có dữ liệu học của ' + this._esc(childName) + '.' });
    return out;
  },

  _bar(s, total) {
    const base = Math.max(total || s.seen, 1);
    const pct = x => (x / base * 100).toFixed(1) + '%';
    return '<div class="sk-bar"><span class="sk-b-solid" style="width:' + pct(s.solid) + '"></span><span class="sk-b-once" style="width:' + pct(s.once) + '"></span><span class="sk-b-wrong" style="width:' + pct(s.wrong) + '"></span></div>';
  },

  renderHTML(stats, childName, source) {
    const S = this.STATUS;
    let html = '<h3 class="parent-section-title">🧩 Kỹ năng của con</h3>';
    const sum = Object.values(stats.topics).reduce((a, t) => ({ seen: a.seen + t.seen, solid: a.solid + t.solid, wrong: a.wrong + t.wrong }), { seen: 0, solid: 0, wrong: 0 });
    html += '<div class="sk-total">Đã gặp <b>' + sum.seen + '</b> câu · <span class="sk-dot sk-solid"></span>vững <b>' + sum.solid + '</b> · <span class="sk-dot sk-weak"></span>đang sai <b>' + sum.wrong + '</b></div>';
    html += '<div class="sk-suggest"><div class="sk-suggest-title">🐰 Rabbit gợi ý cho bố mẹ</div><ul>' +
      this.suggestions(stats, childName).map(s => '<li><span class="sk-ic">' + s.icon + '</span><span>' + s.html + '</span></li>').join('') + '</ul></div>';

    this.SUBJECTS.forEach(subj => {
      const tps = Object.values(stats.topics).filter(t => t.subjectId === subj.id).sort((a, b) => b.seen - a.seen);
      if (!tps.length) return;
      const sks = Object.values(stats.skills).filter(s => s.subjectId === subj.id);
      html += '<details class="sk-subject"' + (subj.id === 'toan' ? ' open' : '') + '><summary>' + subj.icon + ' ' + subj.name + ' <small>' + tps.length + ' chủ đề đã học</small></summary>';
      tps.forEach(t => {
        const tSkills = sks.filter(s => s.topicName === t.label).sort((a, b) => ({ weak: 0, learning: 1, almost: 2, solid: 3 }[a.status] - { weak: 0, learning: 1, almost: 2, solid: 3 }[b.status]) || (b.seen - a.seen));
        html += '<div class="sk-topic"><div class="sk-topic-head"><span class="sk-topic-name">' + this._esc(t.label) + '</span><span class="sk-tag ' + S[t.status].cls + '">' + S[t.status].text + '</span></div>' +
          this._bar(t, t.total) +
          '<div class="sk-topic-sub">' + t.seen + '/' + t.total + ' câu đã làm · vững ' + t.solid + (t.wrong ? ' · <b class="sk-red">đang sai ' + t.wrong + '</b>' : '') + '</div>';
        if (tSkills.length > 1 || (tSkills[0] && tSkills[0].label !== t.label)) {
          html += '<div class="sk-chips">' + tSkills.map(s => '<span class="sk-chip ' + S[s.status].cls + '" title="' + s.seen + ' câu · vững ' + s.solid + ' · sai ' + s.wrong + '">' + this._esc(s.label) + ' <b>' + s.solid + '/' + s.seen + '</b></span>').join('') + '</div>';
        }
        html += '</div>';
      });
      html += '</details>';
    });
    html += '<div class="sk-legend"><span><span class="sk-dot sk-solid"></span>Đã vững (đúng ở 2 ngày khác nhau)</span><span><span class="sk-dot sk-once"></span>Đúng 1 lần</span><span><span class="sk-dot sk-weak"></span>Đang sai</span></div>';
    html += '<p class="sk-note">' + (source === 'cloud' ? 'Số liệu lấy từ bản sao lưu trên mạng.' : 'Số liệu trên máy này.') + ' Ô "a/b" ở mỗi kỹ năng: số câu đã vững / số câu đã làm.</p>';
    return html;
  },

  async render(name) {
    const host = document.querySelector('#screenParent .parent-wrap');
    if (!host || !name) return;
    let card = document.getElementById('skillCard');
    if (!card) {
      card = document.createElement('div');
      card.className = 'card';
      card.id = 'skillCard';
      const after = document.getElementById('parentSummary');
      if (after && after.nextSibling) host.insertBefore(card, after.nextSibling); else host.appendChild(card);
    }
    const token = ++this._token;
    card.innerHTML = '<h3 class="parent-section-title">🧩 Kỹ năng của con</h3><div class="loading-text">Đang tải...</div>';
    try {
      const [bank, child] = await Promise.all([this._loadBank(), this._childData(name)]);
      if (token !== this._token) return;
      if (child.source === 'none') {
        card.innerHTML = '<h3 class="parent-section-title">🧩 Kỹ năng của con</h3><div class="no-log">Chưa có dữ liệu kỹ năng của ' + this._esc(name) + '. Mở web trên máy con hay học (có mạng) để sao lưu trước nhé.</div>';
        return;
      }
      const stats = this.compute(bank, child.review, child.wrong);
      card.innerHTML = this.renderHTML(stats, name, child.source);
    } catch (e) {
      console.error('SkillReport', e);
      if (token === this._token) card.innerHTML = '<h3 class="parent-section-title">🧩 Kỹ năng của con</h3><div class="no-log">Chưa tải được báo cáo kỹ năng.</div>';
    }
  }
};

window.SkillReport = SkillReport;
