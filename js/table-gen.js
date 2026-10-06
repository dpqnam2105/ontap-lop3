// =============================================
// TABLE-GEN.JS — Tự sinh câu hỏi bảng nhân, chia 2–9 (Lớp 3)
// - Mỗi câu có id cố định theo (dạng, a, b): "toan_gen_<dạng>_<a>x<b>".
//   Cùng id luôn sinh ra cùng đề + cùng đáp án nhiễu → Ôn câu sai, lịch ôn,
//   báo cáo kỹ năng đều nhận ra câu cũ.
// - augment(): gắn vào dữ liệu Lớp 3 sau khi tải:
//     + chủ đề "Bảng nhân, chia (2–9)": thêm một phần câu tự sinh (sau câu cũ)
//     + chủ đề mới "⚡ Luyện bảng nhân chia (tự sinh)": toàn bộ kho tự sinh,
//       chọn bảng + nhóm dạng, mỗi lượt bốc 20 câu mới, ưu tiên phép con hay sai.
// - Phạm vi: bảng nhân/chia 2–9, thừa số thứ hai 2–10. Không có chia có dư.
// =============================================

const TableGen = {
  TABLES: [2, 3, 4, 5, 6, 7, 8, 9],
  KS: [2, 3, 4, 5, 6, 7, 8, 9, 10],
  OLD_TOPIC: 'toan_bang-nhan-chia',
  DRILL_TOPIC: 'toan_bang-nhan-chia-tu-sinh',
  DRILL_SIZE: 20,
  PREF_KEY: 'tableDrillPref_v1',

  GROUPS: {
    calc: { label: 'Tính & tìm số thiếu', forms: ['mul', 'div', 'mfac', 'mdsr', 'mdvd'] },
    rel:  { label: 'Quan hệ phép nhân',  forms: ['r10', 'rnext', 'rprev', 'rsplit', 'rsum', 'rswap', 'cmp'] }
  },

  // ---------- tiện ích ----------
  _hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  },
  _rng(seedStr) {
    let h = this._hash(seedStr);
    return () => {
      h += 0x6D2B79F5; let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },
  _shuffle(arr, rnd) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  },
  _id(form, a, b) { return 'toan_gen_' + form + '_' + a + 'x' + b; },
  groupOf(form) { return this.GROUPS.rel.forms.includes(form) ? 'rel' : 'calc'; },
  _diff(base, a, b) { return Math.min(3, base + ((a >= 7 || b >= 7) ? 1 : 0)); },

  /** 3 đáp án nhiễu sát đáp án (cùng số chữ số nếu được), cố định theo id. */
  _distract(ans, cands, id) {
    const rnd = this._rng(id + '|d');
    const len = String(ans).length;
    const uniq = [];
    cands.forEach(x => { if (Number.isInteger(x) && x > 0 && x !== ans && !uniq.includes(x)) uniq.push(x); });
    const same = this._shuffle(uniq.filter(x => String(x).length === len), rnd);
    const other = this._shuffle(uniq.filter(x => String(x).length !== len), rnd);
    const out = same.concat(other).slice(0, 3);
    let k = 1;
    while (out.length < 3) { const x = ans + k; if (!out.includes(x) && x !== ans) out.push(x); k = k > 0 ? -k : -k + 1; if (ans + k <= 0) k = -k + 1; }
    return out;
  },
  /** Ghép đáp án đúng vào vị trí cố định theo id (đều A/B/C/D). */
  _pack(id, q, ans, distractors, hint, extra) {
    const pos = this._hash(id + '|p') % 4;
    const choices = distractors.slice(0, 3).map(String);
    choices.splice(pos, 0, String(ans));
    return Object.assign({ id, q, choices, a: pos, hint, stage: 1, generated: true, source: 'table-gen' }, extra || {});
  },

  // ---------- sinh 1 câu theo id ----------
  make(form, a, b) {
    const id = this._id(form, a, b);
    const p = a * b;
    const near = x => [x - 1, x + 1, x - 2, x + 2];
    switch (form) {
      case 'mul': // a × b = ?
        return this._pack(id, a + ' × ' + b + ' = ?', p,
          this._distract(p, [p + a, p - a, a * (b + 1), a * (b - 1), p + 1, p - 1, p + 2, p - 2], id),
          b === 2 ? 'Gấp đôi số ' + a + ': cộng ' + a + ' với chính nó.' : 'Lấy kết quả ' + a + ' × ' + (b - 1) + ' rồi cộng thêm ' + a + '.',
          { difficulty: this._diff(1, a, b), skill: 'times-' + a });
      case 'div': // p : a = ?
        return this._pack(id, p + ' : ' + a + ' = ?', b,
          this._distract(b, near(b).concat([b + 2, a]), id),
          'Hỏi: ' + a + ' nhân mấy thì bằng ' + p + '?',
          { difficulty: this._diff(1, a, b), skill: 'divide-' + a });
      case 'mfac': // a × ? = p
        return this._pack(id, a + ' × ? = ' + p, b,
          this._distract(b, near(b), id),
          'Đọc lại bảng nhân ' + a + ': ' + a + ' nhân mấy thì được ' + p + '? (Cũng là ' + p + ' : ' + a + '.)',
          { difficulty: this._diff(2, a, b), skill: 'missing-factor' });
      case 'mdsr': // p : ? = b
        return this._pack(id, p + ' : ? = ' + b, a,
          this._distract(a, near(a), id),
          'Số chia = số bị chia : thương. Hoặc nhẩm: ' + b + ' nhân mấy thì được ' + p + '?',
          { difficulty: this._diff(2, a, b), skill: 'missing-divisor' });
      case 'mdvd': // ? : a = b
        return this._pack(id, '? : ' + a + ' = ' + b, p,
          this._distract(p, [p + a, p - a, p + b, p - b, p + 1, p - 1], id),
          'Số bị chia = thương × số chia.',
          { difficulty: this._diff(2, a, b), skill: 'missing-dividend' });
      case 'r10': // a × 9 = a × 10 − ?
        return this._pack(id, a + ' × 9 = ' + a + ' × 10 − ?', a,
          this._distract(a, [9, 10, a + 1, a - 1, 1], id),
          'Nhân với 9 thì ít hơn nhân với 10 đúng một lần số được nhân.',
          { difficulty: this._diff(2, a, 9), skill: 'rel-9-10' });
      case 'rnext': // a × b = a × (b−1) + ?
        return this._pack(id, a + ' × ' + b + ' = ' + a + ' × ' + (b - 1) + ' + ?', a,
          this._distract(a, [b, b - 1, 1, a + 1, a - 1], id),
          'Trong bảng nhân, mỗi kết quả hơn kết quả liền trước đúng một lần số đứng đầu.',
          { difficulty: this._diff(2, a, b), skill: 'rel-them-bot' });
      case 'rprev': // a × b = a × (b+1) − ?
        return this._pack(id, a + ' × ' + b + ' = ' + a + ' × ' + (b + 1) + ' − ?', a,
          this._distract(a, [b, b + 1, 1, a + 1, a - 1], id),
          'Trong bảng nhân, mỗi kết quả kém kết quả liền sau đúng một lần số đứng đầu.',
          { difficulty: this._diff(2, a, b), skill: 'rel-them-bot' });
      case 'rsplit': { // a × b = a × c + a × ?
        const c = 2 + (this._hash(id) % (b - 3)); // 2..b-2
        const ans = b - c;
        return this._pack(id, a + ' × ' + b + ' = ' + a + ' × ' + c + ' + ' + a + ' × ?', ans,
          this._distract(ans, near(ans).concat([c, b]), id),
          'Tách ' + b + ' lần thành ' + c + ' lần và mấy lần nữa?',
          { difficulty: this._diff(2, a, b), skill: 'rel-tach' });
      }
      case 'rsum': { // a + a + … (b số a) = a × ?
        const sum = Array(b).fill(a).join(' + ');
        return this._pack(id, sum + ' = ' + a + ' × ?', b,
          this._distract(b, near(b).concat([p]), id),
          'Đếm xem có bao nhiêu số ' + a + ' được cộng với nhau.',
          { difficulty: 1, skill: 'rel-tong' });
      }
      case 'rswap': // a × b = b × ?
        return this._pack(id, a + ' × ' + b + ' = ' + b + ' × ?', a,
          this._distract(a, near(a).concat([b, p]), id),
          'Đổi chỗ hai thừa số thì tích không đổi.',
          { difficulty: 1, skill: 'rel-doi-cho' });
      default: return null;
    }
  },

  /** So sánh hai tích: id toan_gen_cmp_a-b_c-d */
  makeCmp(a, b, c, d) {
    const id = 'toan_gen_cmp_' + a + '-' + b + '_' + c + '-' + d;
    const L = a * b, R = c * d;
    const ans = L > R ? 0 : L < R ? 1 : 2;
    return {
      id, q: 'Chọn dấu thích hợp: ' + a + ' × ' + b + ' … ' + c + ' × ' + d,
      choices: ['>', '<', '='], a: ans, keepOrder: true,
      hint: 'Tính kết quả từng bên rồi so sánh hai số.',
      difficulty: this._diff(2, Math.max(a, c), Math.max(b, d)), skill: 'cmp-tich',
      stage: 1, generated: true, source: 'table-gen'
    };
  },

  /** Dựng lại câu từ id (dùng khi cần tra ngược). */
  fromId(id) {
    let m = String(id).match(/^toan_gen_cmp_(\d+)-(\d+)_(\d+)-(\d+)$/);
    if (m) return this.makeCmp(+m[1], +m[2], +m[3], +m[4]);
    m = String(id).match(/^toan_gen_([a-z0-9]+)_(\d+)x(\d+)$/);
    return m ? this.make(m[1], +m[2], +m[3]) : null;
  },

  // ---------- kho đầy đủ ----------
  /** Toàn bộ câu tự sinh, thứ tự cố định. Mỗi câu kèm _table (bảng), _fact, _form. */
  fullBank() {
    if (this._full) return this._full;
    const out = [];
    const add = (q, table, fa, fb, form) => { if (q) out.push(Object.assign(q, { _table: table, _fact: Math.min(fa, fb) + 'x' + Math.max(fa, fb), _form: form })); };
    this.TABLES.forEach(a => {
      this.KS.forEach(b => {
        add(this.make('mul', a, b), a, a, b, 'mul');
        add(this.make('div', a, b), a, a, b, 'div');
        add(this.make('mfac', a, b), a, a, b, 'mfac');
        add(this.make(b % 2 ? 'mdvd' : 'mdsr', a, b), a, a, b, b % 2 ? 'mdvd' : 'mdsr');
        if (b >= 3) add(this.make(b % 2 ? 'rprev' : 'rnext', a, b), a, a, b, b % 2 ? 'rprev' : 'rnext');
        if (b >= 4) add(this.make('rsplit', a, b), a, a, b, 'rsplit');
        if (b <= 5) add(this.make('rsum', a, b), a, a, b, 'rsum');
        if (b !== a && b <= 9) add(this.make('rswap', a, b), a, a, b, 'rswap');
      });
      add(this.make('r10', a, 9), a, a, 9, 'r10');
    });
    // So sánh hai tích: các cặp có kết quả gần nhau; lấy đủ mọi cặp bằng nhau,
    // dấu > và < chia đều (đổi bên trái/phải xen kẽ).
    const facts = [];
    this.TABLES.forEach(a => this.KS.forEach(b => { if (a <= b) facts.push([a, b]); }));
    const eq = [], ne = [];
    facts.forEach(([a, b], i) => facts.slice(i + 1).forEach(([c, d]) => {
      if (a === c || b === d) return;
      const diff = Math.abs(a * b - c * d);
      if (diff === 0) eq.push([a, b, c, d]);
      else if (diff <= 4) ne.push([a, b, c, d]);
    }));
    const rnd = this._rng('cmp-pairs-v2');
    const chosen = eq.concat(this._shuffle(ne, rnd).slice(0, Math.max(0, 48 - eq.length)));
    chosen.forEach(([a, b, c, d], k) => {
      // đổi thứ tự thừa số cho đa dạng (3 × 8 hoặc 8 × 3)
      const L = (this._hash('L' + a + b) % 2) ? [a, b] : [b, a];
      const R = (this._hash('R' + c + d) % 2) ? [c, d] : [d, c];
      const bigLeft = a * b > c * d;
      const wantBigLeft = k % 2 === 0;
      const swap = (a * b !== c * d) && (bigLeft !== wantBigLeft);
      const q = swap ? this.makeCmp(R[0], R[1], L[0], L[1]) : this.makeCmp(L[0], L[1], R[0], R[1]);
      add(q, swap ? (c <= 9 ? c : d) : a, a, b, 'cmp');
    });
    this._full = out;
    return out;
  },

  /** Phần câu tự sinh gắn thêm vào chủ đề cũ (cố định, ~100 câu, đủ bảng 2–9). */
  oldTopicExtra(existingTexts) {
    const rnd = this._rng('old-topic-extra-v1');
    const full = this.fullBank();
    const want = { mul: 0, div: 0, mfac: 2, mdsr: 1, mdvd: 1, rnext: 1, rprev: 1, rsplit: 1, rsum: 1, rswap: 1, r10: 1, cmp: 0 };
    const out = [];
    this.TABLES.forEach(t => {
      // bảng 2, 3, 5 chưa có trong câu cũ → thêm 3 câu tính nhân + 3 câu tính chia
      const extraCalc = [2, 3, 5].includes(t) ? 3 : 0;
      const pick = (form, n) => {
        const c = this._shuffle(full.filter(q => q._table === t && q._form === form && !existingTexts.has(q.q)), rnd);
        c.slice(0, n).forEach(q => out.push(q));
      };
      pick('mul', extraCalc); pick('div', extraCalc);
      Object.keys(want).forEach(f => want[f] && pick(f, want[f]));
    });
    this._shuffle(full.filter(q => q._form === 'cmp'), rnd).slice(0, 10).forEach(q => out.push(q));
    return out;
  },

  _clean(q) {
    const c = Object.assign({}, q);
    delete c._table; delete c._fact; delete c._form;
    return c;
  },

  /** Gắn câu tự sinh vào dữ liệu Lớp 3 (gọi từ API sau khi tải). */
  augment(subjects, gradeId) {
    if (gradeId !== 'lop3' || !Array.isArray(subjects)) return;
    const toan = subjects.find(s => s && s.id === 'toan');
    if (!toan || !Array.isArray(toan.topics)) return;
    const full = this.fullBank();
    const oldIdx = toan.topics.findIndex(t => t.id === this.OLD_TOPIC);
    if (oldIdx >= 0) {
      const old = toan.topics[oldIdx];
      if (!old._genAdded) {
        const texts = new Set(old.questions.map(q => (q.q || '').replace(/\s+/g, ' ').trim()));
        const ids = new Set(old.questions.map(q => q.id));
        this.oldTopicExtra(texts).forEach(q => { if (!ids.has(q.id)) old.questions.push(this._clean(q)); });
        old.name = 'Bảng nhân, chia (2–9)';
        old._genAdded = true;
      }
    }
    if (!toan.topics.some(t => t.id === this.DRILL_TOPIC)) {
      const drill = {
        id: this.DRILL_TOPIC, icon: '⚡', name: 'Luyện bảng nhân chia 2–9 (tự sinh)',
        drill: true,
        questions: full.map(q => Object.assign(this._clean(q), { _table: q._table, _fact: q._fact, _form: q._form }))
      };
      toan.topics.splice(oldIdx >= 0 ? oldIdx + 1 : toan.topics.length, 0, drill);
    }
  },


  // =============================================
  // ⏱️ THỬ THÁCH TỐC ĐỘ
  // 5 mức: Ốc sên → Rùa → Thỏ → Đại bàng → Báo. Thời gian mỗi câu theo nhóm dạng
  // (tính thẳng / tìm số thiếu / quan hệ phép nhân). Đạt ≥16/20 câu đúng và kịp giờ
  // thì mở mức tiếp theo. Thời gian mỗi phép (a×b) lưu riêng cho từng bé để biết
  // phép nào con còn chậm → lượt sau hỏi lại nhiều hơn.
  // =============================================
  LEVELS: [
    { id: 'oc-sen',   icon: '🐌', name: 'Ốc sên',   t: { calc: 15, miss: 18, rel: 25 } },
    { id: 'rua',      icon: '🐢', name: 'Rùa',      t: { calc: 10, miss: 12, rel: 18 } },
    { id: 'tho',      icon: '🐰', name: 'Thỏ',      t: { calc: 8,  miss: 10, rel: 15 } },
    { id: 'dai-bang', icon: '🦅', name: 'Đại bàng', t: { calc: 5,  miss: 7,  rel: 11 } },
    { id: 'bao',      icon: '🐆', name: 'Báo',      t: { calc: 3,  miss: 5,  rel: 8 } }
  ],
  PASS_SCORE: 16,          // trên 20 câu
  SPEED_KEY: 'tableSpeed_v1',
  FAST_MS: 3000,           // dưới 3 giây (quy về câu tính thẳng) = nhanh
  SLOW_MS: 6000,           // từ 6 giây = chậm
  FORM_FACTOR: { calc: 1, miss: 1.25, rel: 1.9 },

  kindOf(form) {
    if (form === 'mul' || form === 'div') return 'calc';
    if (form === 'mfac' || form === 'mdsr' || form === 'mdvd') return 'miss';
    return 'rel';
  },
  timeLimit(level, form) {
    const L = this.LEVELS[level] || this.LEVELS[2];
    return L.t[this.kindOf(form)] || L.t.calc;
  },

  _speedKey() {
    return (window.Storage && Storage._scoped) ? Storage._scoped(this.SPEED_KEY) : this.SPEED_KEY;
  },
  getSpeed(raw) {
    let d = null;
    try { d = raw != null ? JSON.parse(raw) : JSON.parse(localStorage.getItem(this._speedKey()) || 'null'); } catch (e) { d = null; }
    d = d && typeof d === 'object' ? d : {};
    d.facts = d.facts || {};
    d.level = d.level || { unlocked: 0, best: {} };
    d.level.best = d.level.best || {};
    return d;
  },
  saveSpeed(d) {
    try { localStorage.setItem(this._speedKey(), JSON.stringify(d)); } catch (e) { /* bỏ qua */ }
    if (window.Cloud && Cloud.schedule) { try { Cloud.schedule(); } catch (e) { /* bỏ qua */ } }
  },

  /** Ghi thời gian 1 câu: [ms quy đổi, đúng 1/0, hết giờ 1/0, dạng, ngày]. Giữ 6 lần gần nhất mỗi phép. */
  recordSpeed(q, ms, ok, timedOut) {
    if (!q || !q._fact || q._form === 'cmp') return;
    const d = this.getSpeed();
    const norm = Math.round(ms / (this.FORM_FACTOR[this.kindOf(q._form)] || 1));
    const day = new Date().toISOString().slice(0, 10);
    const arr = d.facts[q._fact] || (d.facts[q._fact] = []);
    arr.push([norm, ok ? 1 : 0, timedOut ? 1 : 0, q._form, day]);
    if (arr.length > 6) arr.splice(0, arr.length - 6);
    this.saveSpeed(d);
  },

  /** Xếp loại 1 phép theo 3 lần gần nhất: fast / ok / slow / wrong (null = chưa có). */
  factClass(rec) {
    if (!rec || !rec.length) return null;
    const last3 = rec.slice(-3);
    const last = last3[last3.length - 1];
    if (!last[1] && !last[2]) return { cls: 'wrong', ms: last[0] };
    const times = last3.map(r => r[2] ? 99999 : r[0]).sort((a, b) => a - b);
    const med = times[Math.floor(times.length / 2)];
    const anyTO = last3.some(r => r[2]);
    if (anyTO || med >= this.SLOW_MS) return { cls: 'slow', ms: med, to: anyTO };
    if (med < this.FAST_MS) return { cls: 'fast', ms: med };
    return { cls: 'ok', ms: med };
  },

  /** Các phép còn chậm/sai, chậm nhất trước. */
  slowFacts(d, limit) {
    d = d || this.getSpeed();
    const out = [];
    Object.entries(d.facts || {}).forEach(([fact, rec]) => {
      const c = this.factClass(rec);
      if (c && (c.cls === 'slow' || c.cls === 'wrong')) out.push({ fact, cls: c.cls, ms: c.ms, to: c.to });
    });
    out.sort((a, b) => (a.cls === 'wrong' ? -1 : 0) - (b.cls === 'wrong' ? -1 : 0) || b.ms - a.ms);
    return limit ? out.slice(0, limit) : out;
  },
  factLabel(fact) { const [a, b] = fact.split('x'); return a + ' × ' + b; },

  setLevelResult(level, inTime) {
    const d = this.getSpeed();
    const best = d.level.best;
    const prev = best[level] || 0;
    if (inTime > prev) best[level] = inTime;
    let unlockedNew = false;
    if (inTime >= this.PASS_SCORE && d.level.unlocked === level && level < this.LEVELS.length - 1) {
      d.level.unlocked = level + 1; unlockedNew = true;
    }
    this.saveSpeed(d);
    return { unlockedNew, best: best[level], prevBest: prev };
  },

  /** Bảng tốc độ cho Khu Bố Mẹ: hàng = bảng 2–9, cột = thừa số 2–10. */
  speedGridHTML(d, childName, source) {
    d = d || this.getSpeed();
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const cnt = { fast: 0, ok: 0, slow: 0, wrong: 0 };
    let rows = '<tr><th></th>' + this.KS.map(k => '<th>×' + k + '</th>').join('') + '</tr>';
    this.TABLES.forEach(a => {
      rows += '<tr><th>' + a + '</th>' + this.KS.map(b => {
        const key = Math.min(a, b) + 'x' + Math.max(a, b);
        const c = this.factClass(d.facts[key]);
        const cls = c ? c.cls : 'none';
        const tip = a + ' × ' + b + ' = ' + (a * b) + (c ? ' · ' + (c.ms >= 99999 ? 'hết giờ' : (c.ms / 1000).toFixed(1) + ' giây') : ' · chưa đo');
        return '<td class="sg-' + cls + '" title="' + tip + '">' + (a * b) + '</td>';
      }).join('') + '</tr>';
    });
    Object.values(d.facts).forEach(rec => { const c = this.factClass(rec); if (c) cnt[c.cls]++; });
    const slow = this.slowFacts(d, 10);
    const lv = d.level || { unlocked: 0, best: {} };
    const lvText = this.LEVELS.map((L, i) => {
      const st = i <= lv.unlocked ? (lv.best[i] != null ? 'kỉ lục ' + lv.best[i] + '/20' : 'chưa chơi') : '🔒';
      return '<span class="sg-lv' + (i <= lv.unlocked ? ' on' : '') + '">' + L.icon + ' ' + L.name + ' <b>' + st + '</b></span>';
    }).join('');
    let html = '<h3 class="parent-section-title">⏱️ Tốc độ bảng nhân chia</h3>';
    if (!Object.keys(d.facts).length) {
      return html + '<div class="no-log">' + esc(childName) + ' chưa làm Thử thách tốc độ / Luyện bảng nhân chia tự sinh.</div>';
    }
    html += '<div class="sg-levels">' + lvText + '</div>';
    html += '<div class="sg-sum"><span class="sg-dot sg-fast"></span>Nhanh <b>' + cnt.fast + '</b> · <span class="sg-dot sg-ok"></span>Ổn <b>' + cnt.ok +
      '</b> · <span class="sg-dot sg-slow"></span>Chậm <b>' + cnt.slow + '</b> · <span class="sg-dot sg-wrong"></span>Đang sai <b>' + cnt.wrong + '</b> · <span class="sg-dot sg-none"></span>Chưa đo</div>';
    html += '<div class="sg-wrap"><table class="speed-grid">' + rows + '</table></div>';
    if (slow.length) {
      html += '<div class="sg-slow-list"><b>🐢 Nên ôn thêm:</b> ' + slow.map(x => '<span class="sg-chip sg-' + x.cls + '">' + this.factLabel(x.fact) +
        ' <small>' + (x.cls === 'wrong' ? 'sai' : x.to ? 'có lần hết giờ' : (x.ms / 1000).toFixed(1).replace('.', ',') + ' giây') + '</small></span>').join('') + '</div>';
    }
    html += '<p class="sk-note">Mỗi ô tính theo 3 lần gần nhất của phép đó (gộp cả hai chiều, vd. 7 × 8 và 8 × 7, và mọi dạng: 56 : 7, 7 × ? = 56…). Thời gian câu tìm số thiếu / quan hệ đã quy đổi về câu tính thẳng. Nhanh: dưới 3 giây · Chậm: từ 6 giây hoặc hết giờ. ' +
      (source === 'cloud' ? 'Số liệu lấy từ bản sao lưu trên mạng.' : 'Số liệu trên máy này.') + '</p>';
    return html;
  },

  async renderParent(name) {
    const host = document.querySelector('#screenParent .parent-wrap');
    if (!host || !name) return;
    let card = document.getElementById('speedCard');
    if (!card) {
      card = document.createElement('div');
      card.className = 'card'; card.id = 'speedCard';
      const after = document.getElementById('skillCard') || document.getElementById('parentSummary');
      if (after && after.nextSibling) host.insertBefore(card, after.nextSibling); else host.appendChild(card);
    }
    const token = (this._pToken = (this._pToken || 0) + 1);
    card.innerHTML = '<h3 class="parent-section-title">⏱️ Tốc độ bảng nhân chia</h3><div class="loading-text">Đang tải...</div>';
    let d = null, source = 'local';
    const c = Storage.canonName(name);
    if (c && c === Storage.canonName(Storage.getActiveName())) d = this.getSpeed();
    else if (window.Cloud && Cloud.enabled()) {
      try {
        const r = await Cloud.fetchRemote(name);
        if (r && r.ok && r.found && r.snapshot) { d = this.getSpeed((r.snapshot.keys || {})[this.SPEED_KEY] || '{}'); source = 'cloud'; }
      } catch (e) { /* bỏ qua */ }
    }
    if (token !== this._pToken) return;
    card.innerHTML = this.speedGridHTML(d || this.getSpeed('{}'), name, source);
  },

  // ---------- chọn câu cho 1 lượt luyện ----------
  getPref() {
    try {
      const p = JSON.parse(localStorage.getItem(this.PREF_KEY) || 'null');
      if (p && Array.isArray(p.tables) && p.tables.length) return { tables: p.tables.filter(t => this.TABLES.includes(t)), group: p.group || 'all', level: p.level };
    } catch (e) { /* bỏ qua */ }
    return { tables: this.TABLES.slice(), group: 'all' };
  },
  setPref(p) { try { localStorage.setItem(this.PREF_KEY, JSON.stringify(p)); } catch (e) { /* bỏ qua */ } },

  /** Chỉ số các câu trong chủ đề tự sinh hợp với bảng + nhóm dạng đã chọn. */
  filterIndices(topic, tables, group, allowed) {
    const ts = new Set(tables && tables.length ? tables : this.TABLES);
    const okIdx = allowed ? new Set(allowed) : null;
    const out = [];
    (topic.questions || []).forEach((q, i) => {
      if (okIdx && !okIdx.has(i)) return;
      if (!ts.has(q._table)) return;
      if (group && group !== 'all' && this.groupOf(q._form) !== group) return;
      out.push(i);
    });
    return out;
  },

  /** Độ "yếu" của từng phép (a×b) theo lịch sử câu sai + lịch ôn, gộp mọi dạng và cả câu cũ. */
  _factWeakness() {
    const w = {};
    const bump = (fact, v) => { if (fact) w[fact] = (w[fact] || 0) + v; };
    const factOfText = t => {
      let m = String(t || '').match(/(\d+)\s*[×x]\s*(\d+)\s*=\s*\?/);
      if (m) return Math.min(+m[1], +m[2]) + 'x' + Math.max(+m[1], +m[2]);
      m = String(t || '').match(/^(\d+)\s*:\s*(\d)\s*=\s*\?/);
      if (m && +m[1] % +m[2] === 0) { const q = +m[1] / +m[2]; return Math.min(q, +m[2]) + 'x' + Math.max(q, +m[2]); }
      return '';
    };
    const factOfId = id => {
      const q = this.fromId(id);
      if (!q) return '';
      const m = String(id).match(/_(\d+)x(\d+)$/);
      return m ? Math.min(+m[1], +m[2]) + 'x' + Math.max(+m[1], +m[2]) : '';
    };
    try {
      const hist = (window.Storage && Storage.getWrongHistory) ? Storage.getWrongHistory() : {};
      Object.entries(hist).forEach(([id, v]) => {
        if (!v || !v.wrongCount) return;
        const fact = String(id).startsWith('toan_gen_') ? factOfId(id) : factOfText(v.question);
        if (!fact) return;
        const unresolved = v.lastWrong && (!v.lastCorrect || v.lastCorrect < v.lastWrong);
        bump(fact, Math.min(3, v.wrongCount) + (unresolved ? 3 : 0));
      });
    } catch (e) { /* chưa có lịch sử */ }
    // Phép làm chậm / hết giờ ở Thử thách tốc độ cũng được ưu tiên hỏi lại
    try {
      const sp = this.getSpeed();
      Object.entries(sp.facts).forEach(([fact, rec]) => {
        const c = this.factClass(rec);
        if (!c) return;
        bump(fact, c.cls === 'wrong' ? 3 : c.cls === 'slow' ? (c.to ? 4 : 3) : c.cls === 'ok' ? 1 : 0);
      });
    } catch (e) { /* chưa có số liệu tốc độ */ }
    return w;
  },

  /**
   * Bốc n câu cho một lượt: ưu tiên phép con hay sai và câu chưa vững,
   * mỗi phép (a×b) tối đa 1 câu, các dạng xen kẽ nhau. Mỗi lần gọi ra bộ câu khác.
   */
  pickSession(topic, candidates, n) {
    n = n || this.DRILL_SIZE;
    const weak = this._factWeakness();
    let rv = {};
    try { rv = (window.Storage && Storage.getReviewMap) ? Storage.getReviewMap() : {}; } catch (e) { rv = {}; }
    const master = (window.Storage && Storage.MASTER_BOX) || 4;
    const scored = candidates.map(i => {
      const q = topic.questions[i];
      const r = rv[q.id];
      let s = Math.random() * 2;                        // đổi món mỗi lượt
      s += (weak[q._fact] || 0) * 1.2;                  // phép hay sai
      if (!r) s += 1.5;                                 // câu chưa làm
      else if (r.box >= master) s -= 2;                 // câu đã vững
      return { i, q, s };
    }).sort((x, y) => y.s - x.s);

    // Hạn mức mỗi dạng trong 1 lượt (tính trên 20 câu): phép tính trực tiếp nhiều nhất,
    // dạng quan hệ xen vào vừa phải để lượt luyện vẫn "chớp nhoáng".
    const groupsIn = new Set(candidates.map(i => this.groupOf(topic.questions[i]._form)));
    const mixed = groupsIn.has('calc') && groupsIn.has('rel');
    const QUOTA = mixed
      ? { mul: 4, div: 4, mfac: 2, mdsr: 1, mdvd: 1, r10: 1, rnext: 1, rprev: 1, rsplit: 2, rsum: 1, rswap: 1, cmp: 2 }
      : { mul: 6, div: 6, mfac: 4, mdsr: 2, mdvd: 2, r10: 2, rnext: 3, rprev: 3, rsplit: 4, rsum: 3, rswap: 3, cmp: 4 };
    const capOf = f => Math.max(1, Math.round((QUOTA[f] || 2) * n / 20));
    const out = [], usedFact = new Set(), formCount = {};
    const tryPass = (strict) => {
      for (const it of scored) {
        if (out.length >= n) break;
        if (out.includes(it.i)) continue;
        if (strict && usedFact.has(it.q._fact)) continue;
        if (strict && (formCount[it.q._form] || 0) >= capOf(it.q._form)) continue;
        out.push(it.i); usedFact.add(it.q._fact); formCount[it.q._form] = (formCount[it.q._form] || 0) + 1;
      }
    };
    tryPass(true);
    if (out.length < n) tryPass(false);
    // xáo thứ tự để câu yếu không dồn hết lên đầu
    for (let k = out.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [out[k], out[j]] = [out[j], out[k]]; }
    return out;
  },

  /** Thống kê "đã vững" theo bảng cho thẻ chủ đề. */
  tableStats(topic) {
    let rv = {};
    try { rv = (window.Storage && Storage.getReviewMap) ? Storage.getReviewMap() : {}; } catch (e) { rv = {}; }
    const master = (window.Storage && Storage.MASTER_BOX) || 4;
    const st = {};
    this.TABLES.forEach(t => { st[t] = { total: 0, solid: 0 }; });
    (topic.questions || []).forEach(q => {
      const s = st[q._table]; if (!s) return;
      s.total++;
      const r = rv[q.id]; if (r && r.box >= master) s.solid++;
    });
    return st;
  }
};

window.TableGen = TableGen;
