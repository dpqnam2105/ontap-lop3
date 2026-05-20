// =============================================
// QUIZ.JS v7 - saveScore tích hợp log
// =============================================

const Quiz = {
  questions: [],
  curIdx: 0,
  score: 0,
  canEarnPoint: true,
  currentTopic: null,
  currentSubject: null,
  currentTopicId: null,
  sessionInfo: null,
  sessionStartTime: null,
  questionStartedAt: null,
  questionGuard: null,
  usedHintThisQuestion: false,

  TARGET_PER_SESSION: 20,

  start(topic, subjectName) {
    this.currentTopic = topic;
    this.currentSubject = subjectName || '';
    this.currentTopicId = (topic.id || topic.name).toString();
    this.sessionStartTime = Date.now();

    const totalInTopic = topic.questions.length;
    const progress = Storage.getTopicProgress(this.currentTopicId);
    const sessionSize = Math.min(this.TARGET_PER_SESSION, Math.max(1, totalInTopic));

    // Adaptive mode: chọn câu theo mastery + spaced repetition + câu yếu.
    if (window.LearningEngine && App.allData) {
      const selected = window.LearningEngine.selectNextQuestion({
        db: App.allData,
        learnerId: App.playerName || 'guest',
        subjectId: null,
        topicId: this.currentTopicId,
        count: sessionSize
      }) || [];

      this.questions = Array.isArray(selected) ? selected : [selected];

      // Nếu kho câu trong topic chưa đủ hoặc đã bị lọc recent quá nhiều, sinh thêm câu rule-based an toàn.
      while (this.questions.length < sessionSize) {
        this.questions.push(window.LearningEngine.generateQuestion({
          topicId: this.currentTopicId,
          difficulty: Math.min(3, 1 + Math.floor(this.questions.length / 7)),
          seed: Date.now() + this.questions.length
        }));
      }

      this.questions = this.questions.slice(0, sessionSize).map((q, i) => ({
        ...q,
        _idx: typeof q._idx === 'number' ? q._idx : i
      }));

      this.sessionInfo = {
        current: 1,
        total: 1,
        isAllDone: progress.learned.length >= totalInTopic,
        learnedBefore: progress.learned.length,
        totalInTopic: totalInTopic,
        adaptive: true
      };
    } else {
      // Fallback giữ logic cũ nếu LearningEngine chưa load.
      const numSessions = Math.max(1, Math.ceil(totalInTopic / this.TARGET_PER_SESSION));
      const fallbackSessionSize = Math.ceil(totalInTopic / numSessions);
      const allIndices = topic.questions.map((_, i) => i);
      const notLearned = allIndices.filter(i => !progress.learned.includes(i));

      let selectedIndices;
      let currentSession;
      let isAllDone = false;

      if (notLearned.length === 0) {
        isAllDone = true;
        if (progress.wrong.length > 0) {
          selectedIndices = this._shuffle(progress.wrong).slice(0, fallbackSessionSize);
        } else {
          selectedIndices = this._shuffle(allIndices).slice(0, fallbackSessionSize);
        }
        currentSession = numSessions;
      } else if (notLearned.length <= fallbackSessionSize) {
        selectedIndices = this._shuffle(notLearned);
        currentSession = numSessions;
      } else {
        selectedIndices = this._shuffle(notLearned).slice(0, fallbackSessionSize);
        currentSession = Math.floor(progress.learned.length / fallbackSessionSize) + 1;
      }

      this.questions = selectedIndices.map(i => ({ ...topic.questions[i], _idx: i }));
      this.sessionInfo = {
        current: currentSession,
        total: numSessions,
        isAllDone: isAllDone,
        learnedBefore: progress.learned.length,
        totalInTopic: totalInTopic
      };
    }

    this.curIdx = 0;
    this.score = 0;

    App.showScreen('quiz');
    this.render();
  },

  render() {
    this.canEarnPoint = true;
    const q = this.questions[this.curIdx];
    const total = this.questions.length;
    const info = this.sessionInfo;

    this.questionStartedAt = Date.now();
    this.usedHintThisQuestion = false;
    if (this.questionGuard && this.questionGuard.cleanup) this.questionGuard.cleanup();
    this.questionGuard = window.LearningEngine ? window.LearningEngine.installSessionGuard() : null;

    let titleText = this.currentTopic.name + ' · Câu ' + (this.curIdx + 1) + '/' + total;
    if (info.total > 1) {
      if (info.isAllDone) {
        titleText += ' · Ôn lại 🔄';
      } else {
        titleText += ' · Lần ' + info.current + '/' + info.total;
      }
    }
    if (info.adaptive) titleText += ' · Adaptive 🧠';
    document.getElementById('quizTopicName').textContent = titleText;
    
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
  },

  _recordAdaptiveAnswer(q, selectedIndex) {
    if (!window.LearningEngine || !q) return;
    const guardData = this.questionGuard ? this.questionGuard.get() : { visibilityChanges: 0 };
    window.LearningEngine.recordAnswer({
      learnerId: App.playerName || 'guest',
      question: q,
      selectedIndex: selectedIndex,
      startedAt: this.questionStartedAt,
      usedHint: this.usedHintThisQuestion,
      visibilityChanges: guardData.visibilityChanges || 0
    });
  },

  checkAnswer(btn, selected, correct) {
    const q = this.questions[this.curIdx];
    const fb = document.getElementById('feedback');
    const fbText = document.getElementById('fbText');
    const fbAns = document.getElementById('fbAns');

    if (selected === correct) {
      this._recordAdaptiveAnswer(q, selected);
      Sound.play('correct');
      btn.classList.add('correct');

      if (this.canEarnPoint) {
        this.score++;
        Rewards.addStar(1);
        document.getElementById('scoreDisp').textContent = this.score;
        this._flyStar(btn);
        const scoreBadge = document.getElementById('scoreDisp').parentElement;
        scoreBadge.classList.add('pop');
        setTimeout(() => scoreBadge.classList.remove('pop'), 500);
      }

      document.querySelectorAll('.ans-btn').forEach(b => b.disabled = true);
      fb.className = 'feedback correct';
      fbText.textContent = 'Chính xác! Con làm tốt lắm! 👏';
      fbAns.textContent = q.explain || '';
      
      const btnNext = document.getElementById('btnNext');
      btnNext.classList.remove('hidden');
      btnNext.textContent = this.curIdx + 1 >= this.questions.length 
        ? 'Xem kết quả 🎉' 
        : 'Câu tiếp theo →';
    } else {
      this.usedHintThisQuestion = true;
      this._recordAdaptiveAnswer(q, selected);
      Sound.play('wrong');
      btn.classList.add('wrong');
      btn.disabled = true;
      this.canEarnPoint = false;

      fb.className = 'feedback wrong';
      fbText.textContent = 'Chưa đúng rồi, thử lại nhé!';
      fbAns.textContent = q.hint ? '💡 Gợi ý: ' + q.hint : 'Hãy xem lại câu hỏi một chút con nhé.';
    }
  },

  next() {
    const q = this.questions[this.curIdx];
    if (this.questionGuard && this.questionGuard.cleanup) this.questionGuard.cleanup();
    this._markLearned(q._idx, this.canEarnPoint);
    
    this.curIdx++;
    if (this.curIdx >= this.questions.length) {
      this._finish();
    } else {
      this.render();
    }
  },

  _markLearned(qIdx, wasCorrect) {
    if (typeof qIdx !== 'number') return;
    const progress = Storage.getTopicProgress(this.currentTopicId);
    if (!progress.learned.includes(qIdx)) {
      progress.learned.push(qIdx);
    }
    if (!wasCorrect && !progress.wrong.includes(qIdx)) {
      progress.wrong.push(qIdx);
    } else if (wasCorrect && progress.wrong.includes(qIdx)) {
      progress.wrong = progress.wrong.filter(i => i !== qIdx);
    }
    Storage.saveTopicProgress(this.currentTopicId, progress.learned, progress.wrong);
  },

  _finish() {
    Sound.play('win');
    App.showScreen('result');
    const total = this.questions.length;
    document.getElementById('resScore').textContent = this.score + '/' + total;
    
    const ratio = this.score / total;
    const resultMsg = document.querySelector('.result-msg');
    if (resultMsg) {
      const info = this.sessionInfo;
      let progressMsg = '';
      const newLearnedTotal = info.learnedBefore + total;
      
      if (newLearnedTotal >= info.totalInTopic) {
        progressMsg = '🎉 Con đã làm hết bài này hôm nay! Mai quay lại nhé 🌙';
      } else {
        const remaining = info.totalInTopic - newLearnedTotal;
        progressMsg = '📚 Còn ' + remaining + ' câu nữa trong chủ đề này.';
      }
      
      let praiseMsg = '';
      if (ratio >= 0.9) praiseMsg = 'Xuất sắc! Con thật giỏi! 🌟';
      else if (ratio >= 0.7) praiseMsg = 'Rất tốt! Con đã chăm chỉ lắm! 👏';
      else if (ratio >= 0.5) praiseMsg = 'Khá tốt! Tiếp tục cố gắng nhé! 💪';
      else praiseMsg = 'Con đã hoàn thành rồi! Lần sau sẽ tốt hơn nhé! 🌱';
      
      resultMsg.innerHTML = praiseMsg + '<br><br><span style="font-size:0.9rem;font-weight:600">' + progressMsg + '</span>';
    }
    
    if (ratio >= 0.8) this._confettiBurst();
    
    // Tính thời gian học (giây) - 1 lần lưu cho cả điểm + log
    const durationSec = Math.round((Date.now() - this.sessionStartTime) / 1000);
    
    API.saveScore(
      App.playerName, 
      this.score, 
      total,
      this.currentSubject,
      this.currentTopic.name,
      durationSec
    ).then(() => App.loadLeaderboard());
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
  addStar(count) {
    const data = Storage.load();
    const oldTitle = this._calcTitle(data.totalCorrect);
    data.stars += count;
    data.totalCorrect += count;
    Storage.save(data);
    const newTitle = this._calcTitle(data.totalCorrect);
    this.updateUI();
    if (oldTitle !== newTitle) this._titleUpgradeAnimation();
  },

  buyItem(item, cost) {
    const data = Storage.load();
    if (data.stars < cost) {
      alert('Chưa đủ sao để mua Sticker này rồi!');
      return;
    }
    data.stars -= cost;
    data.inventory.push(item);
    Storage.save(data);
    this.updateUI();
    if (typeof App !== 'undefined' && App._switchMiniTab) {
      setTimeout(() => App._switchMiniTab('inventory'), 300);
    }
  },

  redeemBadge() {
    const data = Storage.load();
    let badge = null;
    let cost = 0;
    if (data.stars >= 50) { badge = 'gold'; cost = 50; }
    else if (data.stars >= 30) { badge = 'silver'; cost = 30; }
    else if (data.stars >= 10) { badge = 'bronze'; cost = 10; }
    else {
      alert('Con cần tích thêm sao mới đổi được huy hiệu nhé!');
      return;
    }
    data.stars -= cost;
    data.currentBadge = badge;
    Storage.save(data);
    this.updateUI();
  },

  _calcTitle(totalCorrect) {
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
    const data = Storage.load();
    const starEl = document.getElementById('star-count');
    if (starEl) starEl.textContent = data.stars;
    const titleEl = document.getElementById('title-area');
    if (titleEl) titleEl.textContent = this._calcTitle(data.totalCorrect);
    const badgeArea = document.getElementById('badge-area');
    if (badgeArea) {
      badgeArea.innerHTML = data.currentBadge
        ? '<img src="images/sticker_' + data.currentBadge + '.png" class="reward-img" alt="Huy hiệu" width="60">'
        : '';
    }
    const invArea = document.getElementById('inventory-area');
    if (invArea) {
      invArea.innerHTML = data.inventory.length > 0
        ? data.inventory.map(function(item) {
            return '<img src="images/' + item + '" class="reward-img" alt="sticker" width="50">';
          }).join(' ')
        : '<div class="empty-inventory">Túi đồ trống. Hãy tích sao để mua sticker nhé! 🌟</div>';
    }
  }
};
