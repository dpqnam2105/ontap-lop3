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

  // ---------- chọn câu cho 1 lượt luyện ----------
  getPref() {
    try {
      const p = JSON.parse(localStorage.getItem(this.PREF_KEY) || 'null');
      if (p && Array.isArray(p.tables) && p.tables.length) return { tables: p.tables.filter(t => this.TABLES.includes(t)), group: p.group || 'all' };
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
