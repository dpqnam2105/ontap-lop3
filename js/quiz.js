// =============================================
// QUIZ.JS v8 - learning modes + adaptive engine integration
// =============================================

const Quiz = {
  questions: [],
  curIdx: 0,
  score: 0,
  canEarnPoint: true,
  currentTopic: null,
  currentSubject: null,
  currentTopicId: null,
  currentSubjectId: 'toan',
  sessionInfo: null,
  sessionStartTime: null,
  questionStartedAt: null,
  questionUsedHint: false,
  questionAnswered: false,
  mode: 'practice',
  sessionGuard: null,
  sessionDetails: [],

  TARGET_PER_SESSION: 20,
  TEST_QUESTION_COUNT: 20,

  // Link Google Form để phụ huynh báo lỗi nội dung câu hỏi (dùng chung với form góp ý).
  REPORT_FORM_URL: 'https://forms.gle/hE3gV5Uy6UodzrZn7',

  start(topic, subjectName, options) {
    options = options || {};
    this.mode = options.mode || 'practice';
    this.currentTopic = topic;
    this.currentSubject = subjectName || '';
    this.currentTopicId = (topic.id || topic.name).toString();
    this.currentSubjectId = options.subjectId || this._subjectIdFromName(subjectName) || 'toan';
    this.sessionStartTime = Date.now();
    this.score = 0;
    this.curIdx = 0;
    this.sessionDetails = [];

    if (this.sessionGuard && this.sessionGuard.cleanup) this.sessionGuard.cleanup();
    this.sessionGuard = window.LearningEngine && window.LearningEngine.installSessionGuard
      ? window.LearningEngine.installSessionGuard()
      : null;

    const selection = this._selectQuestions(topic, this.mode);
    this.questions = selection.questions;
    this.sessionInfo = selection.info;

    if (!this.questions.length) {
      alert(this.mode === 'review'
        ? 'Chưa có câu sai để ôn lại. Con làm bài mới trước nhé! 🌱'
        : 'Chủ đề này chưa có câu hỏi.');
      return;
    }

    App.showScreen('quiz');
    this.render();
  },

  _selectQuestions(topic, mode) {
    const totalInTopic = topic.questions.length;
    const progress = Storage.getTopicProgress(this.currentTopicId);
    const allIndices = topic.questions.map((_, i) => i);

    if (mode === 'review') {
      const wrong = (progress.wrong || []).filter(i => topic.questions[i]);
      const indices = wrong.length ? this._shuffle(wrong).slice(0, this.TARGET_PER_SESSION) : [];
      return {
        questions: indices.map(i => this._prepareQuestion(topic.questions[i], i)),
        info: { mode, modeLabel: 'Ôn lỗi sai 🔁', current: 1, total: 1, isAllDone: true, learnedBefore: progress.learned.length, totalInTopic }
      };
    }

    if (mode === 'test') {
      const count = Math.min(this.TEST_QUESTION_COUNT, totalInTopic);
      const indices = this._selectAdaptiveIndices(topic, count, allIndices);
      return {
        questions: indices.map(i => this._prepareQuestion(topic.questions[i], i)),
        info: { mode, modeLabel: 'Kiểm tra 📝', current: 1, total: 1, isAllDone: false, learnedBefore: progress.learned.length, totalInTopic }
      };
    }

    // practice mode: keep old daily-session behavior, but use adaptive scoring when possible.
    const numSessions = Math.max(1, Math.ceil(totalInTopic / this.TARGET_PER_SESSION));
    const sessionSize = Math.ceil(totalInTopic / numSessions);
    const notLearned = allIndices.filter(i => !progress.learned.includes(i));
    let selectedIndices;
    let currentSession;
    let isAllDone = false;

    if (notLearned.length === 0) {
      isAllDone = true;
      if (progress.wrong.length > 0) selectedIndices = this._shuffle(progress.wrong).slice(0, sessionSize);
      else selectedIndices = this._selectAdaptiveIndices(topic, sessionSize, allIndices);
      currentSession = numSessions;
    } else if (notLearned.length <= sessionSize) {
      selectedIndices = this._selectAdaptiveIndices(topic, notLearned.length, notLearned);
      currentSession = numSessions;
    } else {
      selectedIndices = this._selectAdaptiveIndices(topic, sessionSize, notLearned);
      currentSession = Math.floor(progress.learned.length / sessionSize) + 1;
    }

    return {
      questions: selectedIndices.map(i => this._prepareQuestion(topic.questions[i], i)),
      info: { mode, modeLabel: 'Luyện tập 🧠', current: currentSession, total: numSessions, isAllDone, learnedBefore: progress.learned.length, totalInTopic }
    };
  },

  _prepareQuestion(q, idx) {
    return {
      ...q,
      _idx: idx,
      subjectId: this.currentSubjectId,
      topicId: this.currentTopicId,
      id: q.id || (window.LearningEngine && window.LearningEngine.stableQuestionId
        ? window.LearningEngine.stableQuestionId(this.currentSubjectId, this.currentTopicId, q, idx)
        : this.currentTopicId + '_' + idx)
    };
  },

  _selectAdaptiveIndices(topic, count, candidateIndices) {
    const candidateSet = new Set(candidateIndices);
    if (window.LearningEngine && window.LearningEngine.selectNextQuestion && App && App.allData) {
      try {
        const picked = window.LearningEngine.selectNextQuestion({
          db: App.allData,
          learnerId: this._learnerId(),
          subjectId: this.currentSubjectId,
          topicId: this.currentTopicId,
          count: Math.min(count, candidateIndices.length)
        });
        const arr = Array.isArray(picked) ? picked : [picked];
        const byId = new Map(topic.questions.map((q, i) => [q.id || this._prepareQuestion(q, i).id, i]));
        const indices = arr.map(q => byId.get(q.id)).filter(i => i != null && candidateSet.has(i));
        if (indices.length) {
          const missing = candidateIndices.filter(i => !indices.includes(i));
          return [...indices, ...this._shuffle(missing)].slice(0, count);
        }
      } catch (e) {
        console.warn('Adaptive selection fallback:', e);
      }
    }
    return this._shuffle(candidateIndices).slice(0, count);
  },

  render() {
    this.canEarnPoint = true;
    this.questionUsedHint = false;
    this.questionAnswered = false;
    this.questionStartedAt = Date.now();

    const q = this.questions[this.curIdx];
    const total = this.questions.length;
    const info = this.sessionInfo || {};

    let titleText = (info.modeLabel || 'Luyện tập 🧠') + ' · ' + this.currentTopic.name + ' · Câu ' + (this.curIdx + 1) + '/' + total;
    if (this.mode === 'practice' && info.total > 1) {
      titleText += info.isAllDone ? ' · Ôn lại 🔄' : ' · Lần ' + info.current + '/' + info.total;
    }
    if (this.mode === 'test') titleText += ' · Không dùng gợi ý';
    document.getElementById('quizTopicName').textContent = titleText;

    const imgContainer = document.getElementById('qImage');
    if (imgContainer) {
      if (q.image) {
        imgContainer.innerHTML = '<img src="' + q.image + '" alt="Hình minh hoạ câu hỏi" class="question-image" />';
        imgContainer.style.display = 'block';
      } else {
        imgContainer.innerHTML = '';
        imgContainer.style.display = 'none';
      }
    }

    document.getElementById('qText').textContent = q.q;
    document.getElementById('scoreDisp').textContent = this.score;
    document.getElementById('progFill').style.width = (this.curIdx / total * 100) + '%';

    document.getElementById('feedback').style.display = 'none';
    document.getElementById('btnNext').classList.add('hidden');

    const grid = document.getElementById('ansGrid');
    grid.innerHTML = '';
    q.choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.className = 'ans-btn';
      btn.textContent = choice;
      btn.addEventListener('click', () => this.checkAnswer(btn, i, q.a));
      grid.appendChild(btn);
    });

    this._renderReportButton(q);
  },

  /** Tạo (hoặc cập nhật) nút "Báo lỗi câu này" trên màn làm bài. */
  _renderReportButton(q) {
    let btn = document.getElementById('btnReportQuestion');
    if (!btn) {
      this._ensureReportStyles();
      btn = document.createElement('button');
      btn.id = 'btnReportQuestion';
      btn.type = 'button';
      btn.className = 'report-question-btn';
      btn.innerHTML = '⚠️ Báo lỗi câu này';
      // Đặt nút ngay dưới khu vực câu hỏi; nếu không tìm được thì gắn vào màn quiz.
      const anchor = document.getElementById('ansGrid');
      if (anchor && anchor.parentNode) anchor.parentNode.appendChild(btn);
      else document.getElementById('screenQuiz').appendChild(btn);
    }
    btn.onclick = () => this.reportQuestion(q);
  },

  _ensureReportStyles() {
    if (document.getElementById('reportBtnStyles')) return;
    const style = document.createElement('style');
    style.id = 'reportBtnStyles';
    style.textContent = `
      .report-question-btn{display:block;margin:18px auto 4px;border:1px solid #fed7aa;background:#fff7ed;color:#c2410c;
        border-radius:999px;padding:8px 16px;font-weight:700;font-size:.9rem;cursor:pointer;opacity:.85;transition:opacity .15s}
      .report-question-btn:hover{opacity:1}
    `;
    document.head.appendChild(style);
  },

  /**
   * Báo lỗi nội dung câu hỏi: gom thông tin câu, copy vào clipboard rồi mở Google Form.
   * Phụ huynh chỉ cần dán (Ctrl+V) vào form là có đủ thông tin để truy ngược câu lỗi.
   */
  reportQuestion(q) {
    q = q || this.questions[this.curIdx] || {};
    const info = [
      'BÁO LỖI CÂU HỎI',
      'Môn: ' + (this.currentSubject || ''),
      'Chủ đề: ' + (this.currentTopic && this.currentTopic.name ? this.currentTopic.name : ''),
      'Mã câu: ' + (q.id || ''),
      'Câu hỏi: ' + (q.q || ''),
      'Các đáp án: ' + (Array.isArray(q.choices) ? q.choices.join(' | ') : ''),
      'Đáp án app cho là đúng: ' + (Array.isArray(q.choices) && q.choices[q.a] != null ? q.choices[q.a] : q.a),
      '(Bé/phụ huynh mô tả lỗi ở đây: ...)'
    ].join('\n');

    const openForm = () => window.open(this.REPORT_FORM_URL, '_blank');

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(info).then(() => {
        alert('📋 Đã sao chép thông tin câu hỏi.\n\nMình sẽ mở form báo lỗi — bạn chỉ cần DÁN (Ctrl+V) vào ô mô tả và ghi rõ câu sai chỗ nào nhé!');
        openForm();
      }).catch(() => {
        this._reportFallback(info, openForm);
      });
    } else {
      this._reportFallback(info, openForm);
    }
  },

  _reportFallback(info, openForm) {
    // Trình duyệt không cho copy tự động → hiện prompt để người dùng tự copy.
    window.prompt('Sao chép nội dung dưới đây (Ctrl+C), rồi dán vào form báo lỗi:', info);
    openForm();
  },

  checkAnswer(btn, selected, correct) {
    if (this.questionAnswered && this.mode === 'test') return;

    const q = this.questions[this.curIdx];
    const fb = document.getElementById('feedback');
    const fbText = document.getElementById('fbText');
    const fbAns = document.getElementById('fbAns');
    const isCorrect = selected === correct;

    if (!this.questionAnswered) {
      this._recordLearningAnswer(q, selected);
      this._recordSessionDetail(q, selected, correct, isCorrect);
      this.questionAnswered = true;
    }

    if (isCorrect) {
      Sound.play('correct');
      btn.classList.add('correct');

      if (this.canEarnPoint) {
        this.score++;
        Rewards.addStar(1);
        if (Rewards.addXP) Rewards.addXP(this.mode === 'test' ? 12 : 8);
        document.getElementById('scoreDisp').textContent = this.score;
        this._flyStar(btn);
        const scoreBadge = document.getElementById('scoreDisp').parentElement;
        scoreBadge.classList.add('pop');
        setTimeout(() => scoreBadge.classList.remove('pop'), 500);
      }

      document.querySelectorAll('.ans-btn').forEach(b => b.disabled = true);
      fb.className = 'feedback correct';
      fbText.textContent = this.mode === 'test' ? 'Đã ghi nhận đáp án! ✅' : 'Chính xác! Con làm tốt lắm! 👏';
      fbAns.textContent = this.mode === 'test' ? '' : (q.explain || '');

      const btnNext = document.getElementById('btnNext');
      btnNext.classList.remove('hidden');
      btnNext.textContent = this.curIdx + 1 >= this.questions.length ? 'Xem kết quả 🎉' : 'Câu tiếp theo →';
    } else {
      Sound.play('wrong');
      btn.classList.add('wrong');
      btn.disabled = true;
      this.canEarnPoint = false;
      this.questionUsedHint = true;

      fb.className = 'feedback wrong';
      fbText.textContent = this.mode === 'test' ? 'Đã ghi nhận. Sang câu tiếp theo nhé!' : 'Chưa đúng rồi, thử lại nhé!';
      fbAns.textContent = this.mode === 'test'
        ? 'Chế độ kiểm tra không hiện gợi ý để điểm công bằng hơn.'
        : (q.hint ? '💡 Gợi ý: ' + q.hint : 'Hãy xem lại câu hỏi một chút con nhé.');

      if (this.mode === 'test') {
        document.querySelectorAll('.ans-btn').forEach(b => b.disabled = true);
        const btnNext = document.getElementById('btnNext');
        btnNext.classList.remove('hidden');
        btnNext.textContent = this.curIdx + 1 >= this.questions.length ? 'Xem kết quả 🎉' : 'Câu tiếp theo →';
      }
    }
  },

  _recordSessionDetail(q, selected, correct, isCorrect) {
    const choices = Array.isArray(q.choices) ? q.choices : [];
    const timeSpentSec = Math.max(0, Math.round((Date.now() - (this.questionStartedAt || Date.now())) / 1000));
    const questionId = q.id || (this.currentTopicId + '_' + (q._idx != null ? q._idx : this.curIdx));

    this.sessionDetails.push({
      questionId,
      questionIndex: q._idx != null ? q._idx : this.curIdx,
      question: q.q || '',
      image: q.image || '',
      choices: choices,
      selectedIndex: selected,
      correctIndex: correct,
      selectedAnswer: choices[selected] != null ? choices[selected] : String(selected),
      correctAnswer: choices[correct] != null ? choices[correct] : String(correct),
      isCorrect: !!isCorrect,
      timeSpentSec: timeSpentSec,
      usedHint: !!this.questionUsedHint,
      subject: this.currentSubject || '',
      subjectId: this.currentSubjectId || '',
      topic: this.currentTopic && this.currentTopic.name ? this.currentTopic.name : '',
      topicId: this.currentTopicId || '',
      mode: this.mode || 'practice',
      answeredAt: new Date().toISOString()
    });

    // Ghi vào wrong history tích lũy lâu dài
    Storage.recordAnswer({
      questionId,
      isCorrect: !!isCorrect,
      subjectId: this.currentSubjectId || '',
      topicId: this.currentTopicId || '',
      question: q.q || ''
    });
  },

  _recordLearningAnswer(q, selected) {
    if (!window.LearningEngine || !window.LearningEngine.recordAnswer) return;
    try {
      const guard = this.sessionGuard && this.sessionGuard.get ? this.sessionGuard.get() : { visibilityChanges: 0 };
      window.LearningEngine.recordAnswer({
        learnerId: this._learnerId(),
        question: q,
        selectedIndex: selected,
        startedAt: this.questionStartedAt,
        usedHint: this.questionUsedHint,
        visibilityChanges: guard.visibilityChanges || 0
      });
    } catch (e) {
      console.warn('LearningEngine.recordAnswer failed:', e);
    }
  },

  next() {
    const q = this.questions[this.curIdx];
    this._markLearned(q._idx, this.canEarnPoint);

    this.curIdx++;
    if (this.curIdx >= this.questions.length) this._finish();
    else this.render();
  },

  _markLearned(qIdx, wasCorrect) {
    const progress = Storage.getTopicProgress(this.currentTopicId);
    if (!progress.learned.includes(qIdx)) progress.learned.push(qIdx);
    if (!wasCorrect && !progress.wrong.includes(qIdx)) progress.wrong.push(qIdx);
    else if (wasCorrect && progress.wrong.includes(qIdx)) progress.wrong = progress.wrong.filter(i => i !== qIdx);
    Storage.saveTopicProgress(this.currentTopicId, progress.learned, progress.wrong);
  },

  _finish() {
    Sound.play('win');
    if (this.sessionGuard && this.sessionGuard.cleanup) this.sessionGuard.cleanup();

    if (Rewards.touchStreak) Rewards.touchStreak();

    App.showScreen('result');
    const total = this.questions.length;
    document.getElementById('resScore').textContent = this.score + '/' + total;

    const ratio = total ? this.score / total : 0;
    const resultMsg = document.querySelector('.result-msg');
    if (resultMsg) {
      const info = this.sessionInfo || {};
      let progressMsg = '';
      if (this.mode === 'test') {
        progressMsg = '📝 Đây là kết quả kiểm tra. Câu sai sẽ được đưa vào phần ôn lỗi sai.';
      } else if (this.mode === 'review') {
        progressMsg = '🔁 Con vừa ôn lại các câu từng làm sai. Rất tốt!';
      } else {
        const newLearnedTotal = info.learnedBefore + total;
        progressMsg = newLearnedTotal >= info.totalInTopic
          ? '🎉 Con đã làm hết bài này hôm nay! Mai quay lại nhé 🌙'
          : '📚 Còn ' + (info.totalInTopic - newLearnedTotal) + ' câu nữa trong chủ đề này.';
      }

      let praiseMsg = '';
      if (ratio >= 0.9) praiseMsg = 'Xuất sắc! Con thật giỏi! 🌟';
      else if (ratio >= 0.7) praiseMsg = 'Rất tốt! Con đã chăm chỉ lắm! 👏';
      else if (ratio >= 0.5) praiseMsg = 'Khá tốt! Tiếp tục cố gắng nhé! 💪';
      else praiseMsg = 'Con đã hoàn thành rồi! Lần sau sẽ tốt hơn nhé! 🌱';

      const analytics = this._analyticsText();
      resultMsg.innerHTML = praiseMsg + '<br><br><span style="font-size:0.9rem;font-weight:700">' + progressMsg + '</span>' + analytics;
    }

    if (ratio >= 0.8) this._confettiBurst();

    const durationSec = Math.round((Date.now() - this.sessionStartTime) / 1000);
    this._saveLocalSessionDetails(durationSec);
    API.saveScore(App.playerName, this.score, total, this.currentSubject, this.currentTopic.name + ' · ' + (this.sessionInfo.modeLabel || ''), durationSec)
      .then(() => App.loadLeaderboard());
  },

  _saveLocalSessionDetails(durationSec) {
    try {
      const key = 'rabbit_parent_session_details';
      const raw = localStorage.getItem(key);
      const list = raw ? JSON.parse(raw) : [];
      const arr = Array.isArray(list) ? list : [];
      const info = this.sessionInfo || {};
      arr.unshift({
        id: 'sess_' + Date.now() + '_' + Math.random().toString(16).slice(2),
        playerName: App && App.playerName ? App.playerName : this._learnerId(),
        time: new Date().toISOString(),
        subject: this.currentSubject || '',
        topic: (this.currentTopic && this.currentTopic.name ? this.currentTopic.name : '') + (info.modeLabel ? ' · ' + info.modeLabel : ''),
        topicName: this.currentTopic && this.currentTopic.name ? this.currentTopic.name : '',
        mode: this.mode || 'practice',
        modeLabel: info.modeLabel || '',
        duration: Number(durationSec || 0),
        correct: Number(this.score || 0),
        total: Number(this.questions.length || 0),
        details: Array.isArray(this.sessionDetails) ? this.sessionDetails : []
      });
      localStorage.setItem(key, JSON.stringify(arr.slice(0, 300)));
    } catch (e) {
      console.warn('Save parent session details failed:', e);
    }
  },

  _analyticsText() {
    if (!window.LearningEngine || !window.LearningEngine.getAnalyticsSummary) return '';
    try {
      const summary = window.LearningEngine.getAnalyticsSummary(this._learnerId());
      const topic = (summary.topics || []).find(t => t.topicId === this.currentTopicId);
      if (!topic) return '';
      return '<br><br><span class="result-analytics">📈 Thành thạo chủ đề: <b>' + topic.mastery + '%</b> · Độ chính xác: <b>' + topic.accuracy + '%</b></span>';
    } catch { return ''; }
  },

  _learnerId() {
    return (App && App.playerName ? App.playerName : Storage.get('playerName') || 'default').trim().toLowerCase();
  },

  _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  },

  _flyStar(fromEl) {
    const rect = fromEl.getBoundingClientRect();
    const star = document.createElement('div');
    star.className = 'flying-star';
    star.textContent = '⭐';
    star.style.left = (rect.left + rect.width / 2) + 'px';
    star.style.top = rect.top + 'px';
    document.body.appendChild(star);
    setTimeout(() => star.remove(), 1300);
  },

  _confettiBurst() {
    const emojis = ['🎉', '⭐', '✨', '🌟', '🎊'];
    for (let i = 0; i < 12; i++) {
      setTimeout(() => {
        const star = document.createElement('div');
        star.className = 'flying-star';
        star.textContent = emojis[Math.floor(Math.random() * emojis.length)];
        star.style.left = (50 + (Math.random() - 0.5) * 80) + '%';
        star.style.top = '60%';
        star.style.fontSize = (1.5 + Math.random()) + 'rem';
        document.body.appendChild(star);
        setTimeout(() => star.remove(), 1300);
      }, i * 80);
    }
  }
};

const Sound = {
  ctx: null,
  _getCtx() {
    if (!this.ctx) {
      try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { console.warn('Audio not supported'); }
    }
    return this.ctx;
  },
  _tone(freq, duration, type, volume) {
    type = type || 'sine';
    volume = volume || 0.15;
    const ctx = this._getCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  },
  _melody(notes) {
    const self = this;
    notes.forEach(function(note) {
      setTimeout(function() { self._tone(note[0], note[2] || 0.15, 'triangle'); }, note[1]);
    });
  },
  play(type) {
    switch (type) {
      case 'correct': this._melody([[523.25, 0], [659.25, 80], [783.99, 160]]); break;
      case 'wrong':
        this._tone(220, 0.2, 'square', 0.08);
        const self = this;
        setTimeout(function() { self._tone(196, 0.2, 'square', 0.08); }, 150);
        break;
      case 'win': this._melody([[523.25, 0], [659.25, 100], [783.99, 200], [1046.50, 300], [1046.50, 500]]); break;
    }
  }
};

const Rewards = {
  SHOP_ITEMS: [
    { id: 'star', name: 'Ngôi sao', icon: '⭐', file: 'sticker_star.png', cost: 10 },
    { id: 'smile', name: 'Mặt cười', icon: '😊', file: 'sticker_smile.png', cost: 20 },
    { id: 'cat', name: 'Con mèo', icon: '🐱', file: 'sticker_bird.png', cost: 30 },
    { id: 'rabbit', name: 'Thỏ trắng', icon: '🐰', file: 'sticker_rabbit.png', cost: 40 },
    { id: 'rocket', name: 'Tên lửa', icon: '🚀', file: 'sticker_rocket.png', cost: 50 },
    { id: 'flower', name: 'Bông hoa', icon: '🌸', file: 'sticker_flower.png', cost: 60 },
    { id: 'book', name: 'Sách hay', icon: '📚', file: 'sticker_book.png', cost: 70 },
    { id: 'rainbow', name: 'Cầu vồng', icon: '🌈', file: 'sticker_rainbow.png', cost: 80 },
    { id: 'trophy', name: 'Cúp vàng', icon: '🏆', file: 'sticker_trophy.png', cost: 100 },
    { id: 'crown', name: 'Vương miện', icon: '👑', file: 'sticker_crown.png', cost: 150 }
  ],

  _defaultData() {
    return {
      playerName: '', stars: 0, totalCorrect: 0, inventory: [], currentBadge: null,
      xp: 0, level: 1, streak: 0, lastStudyDate: null
    };
  },

  _normalizeData(data) {
    data = data && typeof data === 'object' ? data : {};
    return {
      ...this._defaultData(), ...data,
      stars: Number(data.stars || 0),
      totalCorrect: Number(data.totalCorrect || 0),
      inventory: Array.isArray(data.inventory) ? data.inventory : [],
      currentBadge: data.currentBadge || null,
      xp: Number(data.xp || 0),
      level: Number(data.level || 1),
      streak: Number(data.streak || 0),
      lastStudyDate: data.lastStudyDate || null
    };
  },

  _loadData() {
    try {
      if (typeof Storage !== 'undefined' && Storage && typeof Storage.load === 'function') {
        return this._normalizeData(Storage.load());
      }
    } catch (e) { console.warn('Rewards: Storage.load failed', e); }
    return this._defaultData();
  },

  _saveData(data) {
    const normalized = this._normalizeData(data);
    if (typeof Storage !== 'undefined' && Storage && typeof Storage.save === 'function') Storage.save(normalized);
    return true;
  },

  addStar(count) {
    const data = this._loadData();
    const oldTitle = this._calcTitle(data.totalCorrect);
    data.stars += Number(count || 0);
    data.totalCorrect += Number(count || 0);
    this._saveData(data);
    const newTitle = this._calcTitle(data.totalCorrect);
    this.updateUI();
    if (oldTitle !== newTitle) this._titleUpgradeAnimation();
  },

  addXP(amount) {
    const data = this._loadData();
    amount = Number(amount || 0);
    data.xp += amount;
    let needed = this._xpForNextLevel(data.level);
    let leveled = false;
    while (data.xp >= needed) {
      data.xp -= needed;
      data.level += 1;
      data.stars += 5;
      leveled = true;
      needed = this._xpForNextLevel(data.level);
    }
    this._saveData(data);
    this.updateUI();
    if (leveled) this._achievementPopup('🎉 Lên Level ' + data.level + '! Thưởng 5 sao!');
  },

  touchStreak() {
    const data = this._loadData();
    const today = this._todayKey();
    if (data.lastStudyDate === today) return;
    const yesterday = this._dateKeyOffset(-1);
    data.streak = data.lastStudyDate === yesterday ? Number(data.streak || 0) + 1 : 1;
    data.lastStudyDate = today;
    this._saveData(data);
    this.updateUI();
    if (data.streak > 1) this._achievementPopup('🔥 Học liên tiếp ' + data.streak + ' ngày!');
  },

  buyItem(item, cost) {
    const data = this._loadData();
    cost = Number(cost || 0);
    if (data.stars < cost) {
      alert('Chưa đủ sao để mua Sticker này rồi!');
      return;
    }
    if (!data.inventory.includes(item)) data.inventory.push(item);
    data.stars -= cost;
    this._saveData(data);
    this.updateUI();
    this._achievementPopup('🎁 Đã đổi phần thưởng!');
  },

  renderShop() {
    const el = document.getElementById('shopItems');
    if (!el) return;
    const data = this._loadData();
    const filterEl = document.getElementById('shopFilter');
    const filter = filterEl ? filterEl.value : 'all';
    const owned = new Set(data.inventory || []);
    const items = this.SHOP_ITEMS.filter(item => {
      if (filter === 'affordable') return data.stars >= item.cost && !owned.has(item.file);
      if (filter === 'owned') return owned.has(item.file);
      return true;
    });
    if (!items.length) {
      el.innerHTML = '<div class="shop-empty">Chưa có phần thưởng phù hợp bộ lọc này.</div>';
      return;
    }
    el.innerHTML = items.map(item => {
      const isOwned = owned.has(item.file);
      const canBuy = data.stars >= item.cost && !isOwned;
      return '<div class="reward-card ' + (isOwned ? 'owned' : '') + '">' +
        '<div class="reward-icon">' + item.icon + '</div>' +
        '<div class="reward-name">' + item.name + '</div>' +
        '<div class="reward-cost">' + item.cost + ' ⭐</div>' +
        '<button class="reward-buy-btn" data-item="' + item.file + '" data-cost="' + item.cost + '" ' + (canBuy ? '' : 'disabled') + '>' + (isOwned ? 'Đã có' : 'Đổi') + '</button>' +
      '</div>';
    }).join('');
    el.querySelectorAll('.reward-buy-btn[data-item]').forEach(btn => {
      btn.addEventListener('click', () => this.buyItem(btn.dataset.item, parseInt(btn.dataset.cost, 10)));
    });
  },

  redeemBadge() {
    const data = this._loadData();
    const rank = { bronze: 1, silver: 2, gold: 3 };
    const currentRank = rank[data.currentBadge] || 0;
    let badge = null, cost = 0;
    if (currentRank >= 3) { alert('Con đã có huy hiệu Vàng rồi! Tuyệt vời quá! 🥇'); return; }
    if (currentRank < 3 && data.stars >= 30) { badge = 'gold'; cost = 30; }
    else if (currentRank < 2 && data.stars >= 20) { badge = 'silver'; cost = 20; }
    else if (currentRank < 1 && data.stars >= 10) { badge = 'bronze'; cost = 10; }
    else {
      const nextNeed = currentRank === 0 ? 10 : (currentRank === 1 ? 20 : 30);
      const nextName = currentRank === 0 ? 'Đồng' : (currentRank === 1 ? 'Bạc' : 'Vàng');
      alert('Con cần ' + nextNeed + ' sao để đổi huy hiệu ' + nextName + ' nhé!');
      return;
    }
    data.stars -= cost;
    data.currentBadge = badge;
    data.badgeUpdatedAt = new Date().toISOString();
    this._saveData(data);
    this.updateUI();
    const meta = this._badgeMeta(badge);
    this._achievementPopup('🏅 Đổi thành công ' + (meta ? meta.label : 'huy hiệu') + '!');
  },

  _badgeMeta(badge) {
    const map = {
      bronze: { icon: '🥉', label: 'Huy hiệu Đồng', file: 'sticker_bronze.png' },
      silver: { icon: '🥈', label: 'Huy hiệu Bạc', file: 'sticker_silver.png' },
      gold: { icon: '🥇', label: 'Huy hiệu Vàng', file: 'sticker_gold.png' }
    };
    return map[badge] || null;
  },

  _xpForNextLevel(level) { return 80 + Math.max(0, Number(level || 1) - 1) * 30; },
  _todayKey() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },
  _dateKeyOffset(days) {
    const d = new Date(); d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  _renderProgressWidgets(data) {
    const needed = this._xpForNextLevel(data.level);
    const pct = Math.min(100, Math.round((data.xp / needed) * 100));
    const profile = document.querySelector('.profile-card') || document.querySelector('.subject-sidebar .card-compact') || (document.getElementById('title-area') ? document.getElementById('title-area').closest('.card') : null);
    if (profile && !document.getElementById('learningStatsWidget')) {
      const box = document.createElement('div');
      box.id = 'learningStatsWidget';
      box.className = 'learning-stats-widget';
      const stars = profile.querySelector('.profile-stars') || profile.querySelector('.star-area') || document.getElementById('title-area');
      if (stars && stars.parentNode) stars.parentNode.insertBefore(box, stars.nextSibling);
      else profile.appendChild(box);
    }
    const widget = document.getElementById('learningStatsWidget');
    if (widget) {
      widget.innerHTML = '<div class="level-row"><span>⚡ Level ' + data.level + '</span><b>' + data.xp + '/' + needed + ' XP</b></div>' +
        '<div class="xp-track"><div class="xp-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="streak-row">🔥 ' + (data.streak || 0) + ' ngày học liên tiếp</div>';
    }
  },

  _achievementPopup(text) {
    const pop = document.createElement('div');
    pop.className = 'achievement-toast';
    pop.textContent = text;
    document.body.appendChild(pop);
    setTimeout(() => pop.classList.add('show'), 30);
    setTimeout(() => { pop.classList.remove('show'); setTimeout(() => pop.remove(), 300); }, 2400);
  },

  _calcTitle(totalCorrect) {
    totalCorrect = Number(totalCorrect || 0);
    if (totalCorrect >= 100) return '👑 Siêu sao học tập!';
    if (totalCorrect >= 50) return '🌟 Ngôi sao chăm chỉ!';
    if (totalCorrect >= 20) return '✨ Bé tiến bộ!';
    return '🌱 Người mới bắt đầu';
  },

  _titleUpgradeAnimation() {
    const titleEl = document.getElementById('title-area');
    if (titleEl) {
      titleEl.classList.add('upgraded');
      setTimeout(() => titleEl.classList.remove('upgraded'), 1000);
    }
    Sound.play('win');
  },

  updateUI() {
    const data = this._loadData();
    const starEl = document.getElementById('star-count');
    if (starEl) starEl.textContent = data.stars;
    const profileMirror = document.getElementById('profileStarMirror');
    if (profileMirror) profileMirror.textContent = data.stars;
    const shopStar = document.getElementById('shopStarCount');
    if (shopStar) shopStar.textContent = data.stars;

    this._renderProgressWidgets(data);

    const titleEl = document.getElementById('title-area');
    if (titleEl) titleEl.textContent = this._calcTitle(data.totalCorrect);

    const meta = this._badgeMeta(data.currentBadge);
    const badgeArea = document.getElementById('badge-area');
    if (badgeArea) {
      badgeArea.innerHTML = meta
        ? '<div class="badge-display"><img src="images/' + meta.file + '" class="reward-img" alt="' + meta.label + '" width="60" onerror="this.outerHTML=\'<div class=\\\'badge-fallback\\\' style=\\\'font-size:48px;line-height:60px\\\'>' + meta.icon + '</div>\'"><div style="font-size:0.78rem;font-weight:800;margin-top:4px;color:#E67E22">' + meta.label + '</div></div>'
        : '';
    }
    const shopBadge = document.getElementById('shopBadgePreview');
    if (shopBadge) {
      if (meta) {
        shopBadge.className = 'badge-preview-owned';
        shopBadge.innerHTML = '<div class="badge-display"><img src="images/' + meta.file + '" class="reward-img" alt="' + meta.label + '" width="96"><div class="badge-label">' + meta.label + '</div></div>';
      } else {
        shopBadge.className = 'badge-preview-empty';
        shopBadge.textContent = 'Chưa có huy hiệu';
      }
    }

    this.renderShop();

    const invArea = document.getElementById('inventory-area');
    if (invArea) {
      const inventory = Array.isArray(data.inventory) ? data.inventory : [];
      const shopMeta = {};
      (this.SHOP_ITEMS || []).forEach(item => {
        shopMeta[item.file] = item;
      });

      if (inventory.length > 0) {
        invArea.innerHTML =
          '<div class="inventory-summary">' +
            '<span>🎒 Bộ sưu tập</span>' +
            '<b>' + inventory.length + '/' + (this.SHOP_ITEMS || []).length + '</b>' +
          '</div>' +
          '<div class="inventory-grid">' +
            inventory.map(function(file) {
              const meta = shopMeta[file] || {};
              const name = meta.name || file.replace(/^sticker_/, '').replace(/\.png$/i, '').replace(/[_-]/g, ' ');
              const icon = meta.icon || '🎁';
              return '' +
                '<div class="inventory-item" title="' + name + '">' +
                  '<div class="inventory-item-glow"></div>' +
                  '<img src="images/' + file + '" class="inventory-item-img" alt="' + name + '" ' +
                    'onerror="this.outerHTML=&amp;quot;<div class=\&amp;quot;inventory-item-emoji\&amp;quot;&amp;gt;' + icon + '&amp;lt;/div&amp;quot;">' +
                  '<div class="inventory-item-name">' + name + '</div>' +
                '</div>';
            }).join('') +
          '</div>';
      } else {
        invArea.innerHTML = '<div class="empty-inventory inventory-empty-card">🎒 Túi đồ trống.<br><span>Hãy tích sao để mua sticker nhé! 🌟</span></div>';
      }
    }
  }
};

window.RewardsApp = Rewards;
