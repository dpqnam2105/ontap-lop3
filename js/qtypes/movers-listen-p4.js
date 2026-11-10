// Movers Listening Part 4 — nghe hội thoại ngắn, chọn 1 trong 3 tranh.
// Chế độ lấy từ ctx.mode do Quiz truyền: 'test' → mô phỏng (exam), còn lại → luyện (practice).
(function () {
  const TYPE = 'movers-listen-p4';
  const CHOICES_P4 = 3;

  function isIndex(v, len) {
    if (window.QTypes && typeof QTypes.isIndex === 'function') return QTypes.isIndex(v, len);
    return Number.isInteger(v) && v >= 0 && v < len;
  }

  const H = {
    // Engine chưa hiểu cờ example/scored → NƠI DỰNG POOL phải gọi hàm này:
    // .example cho bước hướng dẫn, .scored cho phần làm bài.
    splitExample(questions) {
      const list = Array.isArray(questions) ? questions : [];
      return {
        example: list.filter(q => q && q.example === true),
        scored: list.filter(q => !(q && q.example === true))
      };
    },
    isExample(q) { return !!(q && q.example === true); },

    // 'test' là tên chế độ Quiz đang dùng; map sang mô phỏng.
    modeOf(ctx) {
      const m = ctx && ctx.mode;
      if (m === 'test' || m === 'exam') return 'exam';
      return 'practice';
    },
    isExamCtx(ctx) { return H.modeOf(ctx) === 'exam'; },
    // Quiz phải hỏi chỗ này trước khi phát âm báo / cộng điểm / hiện feedback.
    feedbackPolicy(ctx) { return H.isExamCtx(ctx) ? 'deferred' : 'immediate'; },

    validate(q) {
      const errs = [];
      const push = (m) => errs.push(`${(q && q.id) || '?'}: ${m}`);
      if (!q || typeof q !== 'object') return ['câu rỗng'];
      if (q.type !== TYPE) push('type phải là ' + TYPE);
      if (typeof q.q !== 'string' || !q.q.trim()) push('thiếu đề');
      const ch = q.choices;
      if (!Array.isArray(ch) || ch.length !== CHOICES_P4) push(`Part 4 phải có đúng ${CHOICES_P4} lựa chọn`);
      else {
        if (!ch.every(c => typeof c === 'string' && c.trim())) push('có nhãn lựa chọn rỗng');
        if (new Set(ch).size !== ch.length) push('lựa chọn trùng nhau');
      }
      const im = q.choiceImages;
      if (!Array.isArray(im) || im.length !== (ch || []).length) push('choiceImages phải khớp số lựa chọn');
      else {
        if (!im.every(s => typeof s === 'string' && s.trim())) push('có đường dẫn ảnh rỗng');
        if (new Set(im).size !== im.length) push('hình trùng nhau');
      }
      if (!isIndex(q.a, (ch || []).length)) push('a ngoài phạm vi');
      const a = q.audio || {};
      const hasLines = Array.isArray(a.lines) && a.lines.length &&
        a.lines.every(l => l && typeof l.text === 'string' && l.text.trim());
      if (a.lines != null && !hasLines) push('audio.lines có phần tử rỗng hoặc không hợp lệ');
      if (!hasLines && !(a.fallback && typeof a.fallback.text === 'string' && a.fallback.text.trim())) push('thiếu audio.lines hoặc audio.fallback.text');
      if (hasLines && a.lines.some(l => /^\s*(girl|boy|man|woman|teacher|narrator)\s*:/i.test(l.text)))
        push('audio.lines[].text không được chứa nhãn người nói');
      if (a.fallback && /\b(Girl|Boy|Man|Woman|Teacher|Narrator)\s*:/i.test(a.fallback.text || ''))
        push('fallback.text không được chứa nhãn người nói (TTS sẽ đọc thành tiếng)');
      if (typeof a.transcript !== 'string' || !a.transcript.trim()) push('thiếu transcript');
      if (a.plays != null && a.plays !== 2) push('audio.plays phải là 2');
      if (q.example === true && q.scored !== false) push('câu ví dụ phải có scored: false');
      return errs;
    },

    validateResponse(q, r) {
      const n = (q.choices || []).length;
      return { ok: !!(r && isIndex(r.choice, n)) };
    },

    grade(q, r) {
      const n = (q.choices || []).length;
      const ok = !!(r && isIndex(r.choice, n));
      const out = { valid: ok, correct: ok && r.choice === q.a };
      if (H.isExample(q)) out.scored = false;
      return out;
    },

    responseKey(q, r) {
      const n = (q.choices || []).length;
      return (r && isIndex(r.choice, n)) ? String(r.choice) : '';
    },
    describeResponse(q, r) {
      const n = (q.choices || []).length;
      return (r && isIndex(r.choice, n)) ? q.choices[r.choice] : '(chưa chọn)';
    },
    describeAnswer(q) { return q.choices[q.a]; }
  };

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function render(ctx) {
    const { host, q } = ctx;
    const onChange = typeof ctx.onChange === 'function' ? ctx.onChange : function () {};
    const exam = H.isExamCtx(ctx);

    let picked = null, locked = false;
    let passesDone = 0;            // chỉ đếm lượt nghe TRỌN VẸN
    let playing = false, failed = false;

    host.innerHTML = '';
    const wrap = el('div', 'mv-p4');
    if (H.isExample(q)) wrap.appendChild(el('div', 'mv-example-badge', 'Câu ví dụ — không tính điểm'));

    const bar = el('div', 'mv-audio-bar');
    const btnPlay = el('button', 'mv-btn mv-btn-play', exam ? '🔊 Nghe (2 lượt)' : '🔊 Nghe');
    btnPlay.type = 'button'; bar.appendChild(btnPlay);
    let btnSlow = null;
    if (!exam) {
      btnSlow = el('button', 'mv-btn mv-btn-slow', '🐢 Nghe chậm');
      btnSlow.type = 'button'; bar.appendChild(btnSlow);
    }
    const btnStop = el('button', 'mv-btn mv-btn-stop', '⏹ Dừng');
    btnStop.type = 'button'; bar.appendChild(btnStop);
    const status = el('div', 'mv-audio-status', '');
    wrap.appendChild(bar); wrap.appendChild(status);

    const grid = el('div', 'mv-choices');
    const cards = q.choices.map((label, i) => {
      const b = el('button', 'mv-choice');
      b.type = 'button';
      b.setAttribute('aria-label', 'Tranh ' + (i + 1));
      const img = document.createElement('img');
      img.src = q.choiceImages[i]; img.alt = ''; img.loading = 'lazy';
      b.appendChild(img);
      const cap = el('span', 'mv-choice-label', label);
      cap.hidden = true;
      b.appendChild(cap);
      b.addEventListener('click', () => {
        if (locked) return;
        picked = i;
        cards.forEach((c, j) => c.classList.toggle('is-picked', j === i));
        onChange(true);                    // đã chọn → Quiz mở nút Kiểm tra
      });
      grid.appendChild(b);
      return b;
    });
    wrap.appendChild(grid);

    const transcript = el('div', 'mv-transcript');
    transcript.hidden = true;
    wrap.appendChild(transcript);
    host.appendChild(wrap);

    function paint() {
      if (locked) { btnPlay.disabled = true; if (btnSlow) btnSlow.disabled = true; return; }
      if (failed && !playing) { btnPlay.disabled = false; status.textContent = 'Chưa phát được. Bấm Nghe để thử lại.'; return; }
      if (!exam) {
        btnPlay.disabled = playing;
        status.textContent = playing ? 'Đang phát…' : 'Con nghe lại bao nhiêu lần cũng được.';
        return;
      }
      const left = Math.max(0, 2 - passesDone);
      btnPlay.disabled = playing || left === 0;
      if (playing) status.textContent = `Đang phát lượt ${Math.min(passesDone + 1, 2)}…`;
      else if (left === 0) status.textContent = 'Đã nghe đủ 2 lượt.';
      else status.textContent = `Còn ${left} lượt nghe. Bấm Nghe để bắt đầu.`;
    }

    function onPass() { passesDone = Math.min(2, passesDone + 1); paint(); }

    function finish(status_) {
      playing = false;
      failed = status_ === 'error';
      paint();
    }

    function startExam() {
      if (locked || playing || passesDone >= 2) return;
      failed = false; playing = true; paint();
      const remaining = 2 - passesDone;
      const run = remaining >= 2
        ? MoversAudio.playTwice(q, { onPass, onEnded: finish })
        : MoversAudio.play(q, { onPass, onEnded: finish });
      return run;
    }

    function startPractice(slow) {
      if (locked) return;
      failed = false; playing = true; paint();
      return MoversAudio.play(q, { slow, onEnded: finish });
    }

    btnPlay.addEventListener('click', () => exam ? startExam() : startPractice(false));
    if (btnSlow) btnSlow.addEventListener('click', () => startPractice(true));
    btnStop.addEventListener('click', () => { MoversAudio.stop(); playing = false; paint(); });

    paint();
    if (exam) startExam();

    return {
      getResponse() { return picked == null ? null : { choice: picked }; },
      showResult(res) {
        res = res || {};
        MoversAudio.stop(); playing = false;
        // Mô phỏng: không lộ đúng/sai cho tới khi chữa cuối phần.
        const mayMark = res.reveal === true || !exam;
        if (mayMark && typeof res.correct === 'boolean' && res.markSelection !== false && picked != null)
          cards[picked].classList.add(res.correct ? 'is-correct' : 'is-wrong');
        if (res.reveal === true) {
          cards[q.a].classList.add('is-answer');
          cards.forEach(c => { const cap = c.querySelector('.mv-choice-label'); if (cap) cap.hidden = false; });
          transcript.hidden = false;
          transcript.textContent = (q.audio && q.audio.transcript) || '';
        }
        paint();
      },
      lock() { locked = true; cards.forEach(c => { c.disabled = true; }); paint(); },
      unlock() { locked = false; cards.forEach(c => { c.disabled = false; }); paint(); },
      restore(packed) {
        if (packed && isIndex(packed.choice, q.choices.length)) {
          picked = packed.choice;
          cards.forEach((c, j) => c.classList.toggle('is-picked', j === picked));
          onChange(true);
        }
      },
      destroy() { MoversAudio.stop(); playing = false; host.innerHTML = ''; }
    };
  }

  const def = {
    readAloud: false,
    needsVoice: 'en',
    validateQuestion: H.validate,
    imagesReady(q) {
      const st = (q.choiceImageReview && q.choiceImageReview.status) || 'pending';
      if (st === 'ok') return true;
      return st === 'pending' && !!(window.API && API.pilotOn && API.pilotOn());
    },
    validateResponse: H.validateResponse,
    grade: H.grade,
    describeResponse: H.describeResponse,
    describeAnswer: H.describeAnswer,
    responseKey: H.responseKey,
    feedbackPolicy: H.feedbackPolicy,
    speakParts() { return null; },
    render
  };

  if (window.QTypes && QTypes.register) QTypes.register(TYPE, def);
  window.MoversP4 = Object.assign({ TYPE, def }, H);
})();

