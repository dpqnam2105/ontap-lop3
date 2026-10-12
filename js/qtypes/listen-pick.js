// =============================================
// QTYPES/LISTEN-PICK.JS — Nghe rồi chọn tranh
// Schema: { type:'listen-pick', q:'Listen. Which sign is it?', audio:{ text, lang:'en' },
//           choices:[nhãn chữ…], choiceImages:[đường dẫn ảnh…], a, choiceImageReview:{ status:'ok', by, date, from:[id câu nguồn] } }
// - Lời nghe (audio.text) và nhãn chữ KHÔNG hiện trước khi chấm; nút 🔊 chung bị ẩn (không đọc lựa chọn).
// - choices vẫn là chuỗi → log, báo cáo phụ huynh, báo lỗi không ra [object Object].
// - Ảnh lựa chọn phải qua cổng duyệt: choiceImageReview.status === 'ok'.
// =============================================
(function (root) {
  const Q = root.QTypes;
  if (!Q) return;
  const RATE = { normal: 0.85, slow: 0.6 };

  Q.register('listen-pick', {
    readAloud: false,
    needsVoice: 'en',
    validateQuestion(q) {
      const e = [];
      const n = Array.isArray(q.choices) ? q.choices.length : 0;
      if (n < 2 || n > 4) e.push('listen-pick cần 2–4 lựa chọn');
      if (n && q.choices.some(c => typeof c !== 'string' || !c.trim())) e.push('nhãn lựa chọn phải là chữ');
      if (n && new Set(q.choices).size !== n) e.push('nhãn lựa chọn trùng');
      if (!Array.isArray(q.choiceImages) || q.choiceImages.length !== n || q.choiceImages.some(s => typeof s !== 'string' || !s)) e.push('choiceImages phải đủ ảnh cho từng lựa chọn');
      else if (new Set(q.choiceImages).size !== n) e.push('ảnh lựa chọn trùng');
      if (!Q.isIndex(q.a, n)) e.push('a hỏng');
      if (!q.audio || typeof q.audio.text !== 'string' || !q.audio.text.trim()) e.push('thiếu audio.text');
      if (q.image) e.push('listen-pick không dùng image chung (hình nằm trong lựa chọn)');
      return e;
    },
    imagesReady(q) { return !!(q.choiceImageReview && q.choiceImageReview.status === 'ok'); },
    validateResponse(q, r) { return { ok: !!r && Q.isIndex(r.selectedIndex, (q.choices || []).length) }; },
    grade(q, r) { return { valid: true, correct: r.selectedIndex === q.a }; },
    describeResponse(q, r) { const c = (q.choices || [])[r && r.selectedIndex]; return c != null ? String(c) : ''; },
    describeAnswer(q) { return String((q.choices || [])[q.a] || ''); },
    responseKey(q, r) { return 'i:' + (r && Number.isInteger(r.selectedIndex) ? r.selectedIndex : ''); },
    speakParts(q, slow) { return [{ text: q.audio.text, lang: q.audio.lang || 'en', rate: slow ? RATE.slow : RATE.normal }]; },

    render(ctx) {
      const { host, q, onChange } = ctx;
      const Speak = root.Speak;
      const canSpeak = !!(Speak && Speak.supported);
      let selected = null, locked = false, autoTimer = null, destroyed = false;
      host.innerHTML = '';
      host.classList.add('qt-listen');

      const bar = document.createElement('div');
      bar.className = 'lp-bar';
      bar.innerHTML = '<button type="button" class="lp-play" data-rate="normal">🔊 Nghe</button>' +
        '<button type="button" class="lp-play lp-slow" data-rate="slow">🐢 Nghe chậm</button>';
      host.appendChild(bar);
      const play = slow => {
        if (!canSpeak || destroyed) return;
        bar.querySelectorAll('.lp-play').forEach(b => b.classList.remove('playing'));
        const btn = bar.querySelector(slow ? '.lp-slow' : '.lp-play:not(.lp-slow)');
        if (btn) btn.classList.add('playing');
        Speak.speakParts(this.speakParts(q, slow), () => { if (btn) btn.classList.remove('playing'); });
      };
      bar.querySelectorAll('.lp-play').forEach(b => b.addEventListener('click', () => play(b.dataset.rate === 'slow')));
      if (!canSpeak) {
        const warn = document.createElement('div');
        warn.className = 'lp-warn';
        warn.textContent = 'Máy này chưa phát được giọng đọc. Bố mẹ đọc giúp con câu nghe nhé.';
        host.appendChild(warn);
        bar.querySelectorAll('.lp-play').forEach(b => { b.disabled = true; });
      }

      const grid = document.createElement('div');
      grid.className = 'lp-grid';
      const order = Q.shuffle(q.choices.map((_, i) => i));
      const tiles = order.map((orig, k) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'lp-tile';
        b.dataset.idx = String(orig);
        b.setAttribute('aria-pressed', 'false');
        b.setAttribute('aria-label', 'Tranh ' + (k + 1));
        const img = document.createElement('img');
        img.src = q.choiceImages[orig];
        img.alt = 'Tranh ' + (k + 1);     // không để lộ nhãn chữ qua alt
        img.loading = 'eager';
        img.draggable = false;
        const lab = document.createElement('span');
        lab.className = 'lp-label';
        lab.hidden = true;
        lab.textContent = q.choices[orig];
        b.appendChild(img); b.appendChild(lab);
        b.addEventListener('click', () => {
          if (locked) return;
          selected = orig;
          tiles.forEach(t => { const on = t === b; t.classList.toggle('selected', on); t.setAttribute('aria-pressed', String(on)); });
          tiles.forEach(t => t.classList.remove('wrong'));
          onChange(true);
        });
        grid.appendChild(b);
        return b;
      });
      host.appendChild(grid);

      const transcript = document.createElement('div');
      transcript.className = 'lp-transcript';
      transcript.hidden = true;
      host.appendChild(transcript);

      // Tự phát 1 lần khi mở câu (máy chặn tự phát thì bé bấm 🔊)
      if (canSpeak) autoTimer = setTimeout(() => { autoTimer = null; play(false); }, 350);

      return {
        getResponse() { return { selectedIndex: selected }; },
        showResult(res) {
          // res: { correct, reveal, markSelection }
          tiles.forEach(t => {
            const i = Number(t.dataset.idx);
            if (res.markSelection && i === selected) t.classList.add(res.correct ? 'correct' : 'wrong');
            if (res.reveal) {
              t.querySelector('.lp-label').hidden = false;
              if (i === q.a) t.classList.add('correct');
            }
          });
          if (res.reveal) {
            transcript.hidden = false;
            transcript.innerHTML = '🎧 Câu nghe: <b>' + Q.esc(q.audio.text) + '</b>';
          }
        },
        lock() { locked = true; tiles.forEach(t => { t.disabled = true; }); },
        unlock() { locked = false; tiles.forEach(t => { t.disabled = false; }); },
        destroy() {
          destroyed = true;
          if (autoTimer) { clearTimeout(autoTimer); autoTimer = null; }
          if (Speak) Speak.stop();
          host.classList.remove('qt-listen');
        }
      };
    }
  });
})(typeof window !== 'undefined' ? window : globalThis);
