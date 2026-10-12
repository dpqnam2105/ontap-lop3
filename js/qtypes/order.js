// =============================================
// QTYPES/ORDER.JS — Sắp xếp thẻ thành câu
// Schema: { type:'order', q, tokens:[{ id:'t0', text:"Don't" }, …], end:'.'|'?'|'!',
//           answers:["Don't feed the animals", …] }   // các thứ tự đúng, KHÔNG kèm dấu kết thúc
// - Mỗi thẻ có ID riêng (kể cả hai thẻ cùng chữ "the"). Lưu tokenIds; chấm theo chuỗi chữ
//   sau khi xác nhận đủ thẻ, không thiếu, không trùng.
// - So khớp: không phân biệt hoa/thường, gộp khoảng trắng, ’ = '. Dấu kết thúc cố định (hiện sẵn).
// - Thao tác: chạm thẻ dưới → nối vào câu; chạm thẻ trong câu → trả về; Hoàn tác; Làm lại.
// =============================================
(function (root) {
  const Q = root.QTypes;
  if (!Q) return;

  const norm = s => String(s == null ? '' : s).replace(/[’‘`]/g, "'").replace(/\s+/g, ' ').trim().toLowerCase();

  /** Tách một đáp án thành dãy chữ-thẻ (thẻ có thể nhiều từ). Trả null nếu không tách được bằng đúng bộ thẻ. */
  function segment(answer, tokens) {
    const words = norm(answer).split(' ').filter(Boolean);
    const pool = tokens.map(t => norm(t.text));
    const used = pool.map(() => false);
    const out = [];
    const go = pos => {
      if (pos === words.length) return used.every(Boolean);
      for (let i = 0; i < pool.length; i++) {
        if (used[i]) continue;
        const w = pool[i].split(' ');
        if (words.slice(pos, pos + w.length).join(' ') !== pool[i]) continue;
        used[i] = true; out.push(pool[i]);
        if (go(pos + w.length)) return true;
        used[i] = false; out.pop();
      }
      return false;
    };
    return go(0) ? out.slice() : null;
  }

  const def = Q.register('order', {
    readAloud: true,
    MIN_TOKENS: 3,
    MAX_TOKENS: 7,
    _norm: norm,
    _segment: segment,

    validateQuestion(q) {
      const e = [];
      const t = q.tokens;
      if (!Array.isArray(t) || t.length < this.MIN_TOKENS || t.length > this.MAX_TOKENS) { e.push('order cần ' + this.MIN_TOKENS + '–' + this.MAX_TOKENS + ' thẻ'); return e; }
      const ids = new Set();
      t.forEach((x, i) => {
        if (!x || typeof x.id !== 'string' || !x.id) e.push('thẻ ' + i + ' thiếu id');
        else if (ids.has(x.id)) e.push('trùng id thẻ ' + x.id); else ids.add(x.id);
        if (!x || typeof x.text !== 'string' || !x.text.trim()) e.push('thẻ ' + i + ' thiếu chữ');
        else if (/[.?!]\s*$/.test(x.text.trim())) e.push('dấu kết thúc không nằm trong thẻ: ' + x.text);
      });
      if (!['.', '?', '!'].includes(q.end)) e.push('end phải là . ? hoặc !');
      if (!Array.isArray(q.answers) || !q.answers.length) e.push('thiếu answers');
      else q.answers.forEach(a => {
        if (typeof a !== 'string' || /[.?!]\s*$/.test(a.trim())) e.push('đáp án không kèm dấu kết thúc: ' + a);
        else if (!segment(a, t)) e.push('đáp án không ghép đúng bộ thẻ: ' + a);
      });
      if ('choices' in q || 'a' in q) e.push('order không dùng choices/a');
      return e;
    },

    validateResponse(q, r) {
      const ids = r && r.tokenIds;
      if (!Array.isArray(ids)) return { ok: false, reason: 'missing' };
      const known = new Set(q.tokens.map(t => t.id));
      if (ids.length !== q.tokens.length) return { ok: false, reason: 'incomplete' };
      if (new Set(ids).size !== ids.length) return { ok: false, reason: 'duplicate' };
      if (ids.some(id => !known.has(id))) return { ok: false, reason: 'unknown' };
      return { ok: true };
    },

    _texts(q, ids) { const by = new Map(q.tokens.map(t => [t.id, t.text])); return ids.map(id => by.get(id)); },

    grade(q, r) {
      const texts = this._texts(q, r.tokenIds);
      const said = norm(texts.join(' '));
      const correct = q.answers.some(a => norm(a) === said);
      // parts: từng vị trí đúng/sai so với đáp án gần nhất (chỉ dùng để tô khi chữa ở chế độ luyện tập)
      let best = null, bestHit = -1;
      q.answers.forEach(a => {
        const seg = segment(a, q.tokens);
        if (!seg) return;
        const hit = seg.filter((w, i) => norm(texts[i]) === w).length;
        if (hit > bestHit) { bestHit = hit; best = seg; }
      });
      const parts = best ? texts.map((w, i) => norm(w) === best[i]) : texts.map(() => correct);
      return { valid: true, correct, parts: correct ? texts.map(() => true) : parts };
    },

    describeResponse(q, r) {
      if (!r || !Array.isArray(r.tokenIds)) return '';
      return this._texts(q, r.tokenIds).filter(Boolean).join(' ') + (r.tokenIds.length === q.tokens.length ? q.end : ' …');
    },
    describeAnswer(q) { return String(q.answers[0]) + q.end; },
    speakParts(q) { return [{ text: q.q }]; },

    render(ctx) {
      const { host, q, onChange } = ctx;
      host.innerHTML = '';
      host.classList.add('qt-order');
      let placed = [];            // tokenIds theo thứ tự trong câu
      let history = [];           // các trạng thái trước để Hoàn tác
      let locked = false;
      let marks = null;           // tô đúng/sai sau khi chấm; xoá khi bé đổi thẻ
      // Thứ tự thẻ hiển thị: xáo, tránh trùng đúng một đáp án
      let poolOrder = Q.shuffle(q.tokens.map(t => t.id));
      for (let k = 0; k < 6 && q.answers.some(a => norm(a) === norm(this._texts(q, poolOrder).join(' '))); k++) poolOrder = Q.shuffle(poolOrder);
      const byId = new Map(q.tokens.map(t => [t.id, t]));

      const line = document.createElement('div');
      line.className = 'od-line';
      line.setAttribute('aria-label', 'Câu con đang xếp');
      const pool = document.createElement('div');
      pool.className = 'od-pool';
      pool.setAttribute('aria-label', 'Thẻ từ');
      const tools = document.createElement('div');
      tools.className = 'od-tools';
      tools.innerHTML = '<button type="button" class="od-undo">↶ Hoàn tác</button><button type="button" class="od-reset">↺ Làm lại</button>';
      const solution = document.createElement('div');
      solution.className = 'od-solution';
      solution.hidden = true;
      host.appendChild(line); host.appendChild(pool); host.appendChild(tools); host.appendChild(solution);

      const chip = (id, where) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'od-chip';
        b.dataset.id = id;
        b.textContent = byId.get(id).text;
        b.disabled = locked;
        b.addEventListener('click', () => {
          if (locked) return;
          history.push(placed.slice());
          marks = null;
          if (where === 'pool') placed.push(id);
          else placed = placed.filter(x => x !== id);
          draw();
        });
        return b;
      };

      const draw = (silent) => {
        line.innerHTML = '';
        placed.forEach((id, i) => {
          const c = chip(id, 'line');
          if (marks) c.classList.add(marks[i] ? 'correct' : 'wrong');
          line.appendChild(c);
        });
        for (let i = placed.length; i < q.tokens.length; i++) {
          const s = document.createElement('span'); s.className = 'od-slot'; s.setAttribute('aria-hidden', 'true'); line.appendChild(s);
        }
        const end = document.createElement('span'); end.className = 'od-end'; end.textContent = q.end; line.appendChild(end);
        pool.innerHTML = '';
        poolOrder.forEach(id => {
          if (placed.includes(id)) { const g = document.createElement('span'); g.className = 'od-gap'; g.textContent = byId.get(id).text; g.setAttribute('aria-hidden', 'true'); pool.appendChild(g); }
          else pool.appendChild(chip(id, 'pool'));
        });
        tools.querySelector('.od-undo').disabled = locked || !history.length;
        tools.querySelector('.od-reset').disabled = locked || !placed.length;
        if (!silent) onChange(placed.length === q.tokens.length);
      };
      tools.querySelector('.od-undo').addEventListener('click', () => { if (locked || !history.length) return; marks = null; placed = history.pop(); draw(); });
      tools.querySelector('.od-reset').addEventListener('click', () => { if (locked || !placed.length) return; marks = null; history.push(placed.slice()); placed = []; draw(); });
      draw();

      return {
        getResponse() { return { tokenIds: placed.slice() }; },
        showResult(res) {
          // res: { correct, parts?, reveal } — parts chỉ được truyền ở chế độ luyện tập
          marks = res.correct ? placed.map(() => true) : (Array.isArray(res.parts) ? res.parts.slice() : null);
          draw(true);
          if (res.reveal) { solution.hidden = false; solution.innerHTML = '✅ Câu đúng: <b>' + Q.esc(def.describeAnswer(q)) + '</b>'; }
        },
        lock() { locked = true; host.querySelectorAll('button').forEach(b => { b.disabled = true; }); },
        unlock() { locked = false; draw(true); },
        destroy() { locked = true; host.classList.remove('qt-order'); }
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
