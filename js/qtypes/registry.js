// =============================================
// QTYPES/REGISTRY.JS — sổ đăng ký dạng bài (Đợt 0, 10/2026)
// Câu không có trường "type" = 'mcq' (trắc nghiệm cũ, giữ nguyên đường render/chấm cũ trong quiz.js).
// Mỗi dạng tự lo: validateQuestion, validateResponse, grade, describeResponse, describeAnswer,
// render (dạng mới) → controller { getResponse, showResult, lock, unlock, destroy }.
// Renderer CHỈ cung cấp câu trả lời; Quiz.submit() gọi grade() để quyết đúng/sai.
// File này không đụng DOM lúc nạp → chạy được trong test Node (vm).
// =============================================
(function (root) {
  const types = {};
  const cache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

  const QTypes = {
    RESPONSE_VERSION: 1,

    register(name, def) { types[name] = Object.assign({ name }, def); return types[name]; },
    get(name) { return types[name] || null; },
    names() { return Object.keys(types); },
    typeOf(q) { return (q && typeof q.type === 'string' && q.type) || 'mcq'; },
    forQuestion(q) { return types[this.typeOf(q)] || null; },
    isMcq(q) { return this.typeOf(q) === 'mcq'; },

    /** Danh sách lỗi schema của câu ([] = hợp lệ). Dạng chưa hỗ trợ → lỗi. */
    validate(q) {
      const T = this.forQuestion(q);
      if (!T) return ['dạng chưa hỗ trợ: ' + this.typeOf(q)];
      try { return T.validateQuestion(q) || []; } catch (e) { return ['validate lỗi: ' + e.message]; }
    },

    /** Câu dùng được trên web: dạng có hỗ trợ, schema đúng, hình của lựa chọn đã duyệt. Có cache theo object câu. */
    ready(q) {
      if (!q || typeof q !== 'object') return false;
      if (cache && cache.has(q)) return cache.get(q);
      const T = this.forQuestion(q);
      let ok = !!T && this.validate(q).length === 0;
      if (ok && T.imagesReady) ok = !!T.imagesReady(q);
      if (cache) cache.set(q, ok);
      return ok;
    },

    /** Gói câu trả lời để lưu (không lưu DOM / toạ độ / diễn biến kéo thả). */
    pack(q, response) {
      const T = this.forQuestion(q);
      let text = '';
      try { text = T ? String(T.describeResponse(q, response)) : ''; } catch (e) { text = ''; }
      return { questionType: this.typeOf(q), responseVersion: this.RESPONSE_VERSION, response: response, text: text };
    },

    /** Khoá so sánh hai câu trả lời "giống nhau về nội dung" (dạng tự định nghĩa, mặc định JSON). */
    responseKey(q, response) {
      const T = this.forQuestion(q);
      try { return T && T.responseKey ? String(T.responseKey(q, response)) : JSON.stringify(response == null ? null : response); }
      catch (e) { return JSON.stringify(response == null ? null : response); }
    },

    describeAnswer(q) {
      const T = this.forQuestion(q);
      try { return T ? String(T.describeAnswer(q)) : ''; } catch (e) { return ''; }
    },

    // ─── tiện ích dùng chung cho renderer ───
    esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    },
    isIndex(v, n) { return Number.isInteger(v) && v >= 0 && v < n; }
  };

  // ─── Trắc nghiệm (mcq): render/chấm vẫn ở quiz.js (legacy) — chỉ khai báo để dùng chung lưu/mô tả ───
  QTypes.register('mcq', {
    legacy: true,
    readAloud: true,
    validateQuestion(q) {
      const e = [];
      if (!Array.isArray(q.choices) || q.choices.length < 2) e.push('mcq cần ≥2 lựa chọn');
      else if (q.choices.some(c => typeof c !== 'string' && typeof c !== 'number')) e.push('lựa chọn phải là chữ/số');
      if (!QTypes.isIndex(q.a, (q.choices || []).length)) e.push('a hỏng');
      return e;
    },
    validateResponse(q, r) { return { ok: !!r && QTypes.isIndex(r.selectedIndex, (q.choices || []).length) }; },
    grade(q, r) { return { valid: true, correct: r.selectedIndex === q.a }; },
    describeResponse(q, r) { const c = (q.choices || [])[r && r.selectedIndex]; return c != null ? String(c) : ''; },
    describeAnswer(q) { const c = (q.choices || [])[q.a]; return c != null ? String(c) : ''; }
  });

  root.QTypes = QTypes;
})(typeof window !== 'undefined' ? window : globalThis);
