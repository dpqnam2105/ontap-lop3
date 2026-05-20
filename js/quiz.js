// =============================================
// QUIZ.JS v5 - chia 20 câu/lần, smart selection
// =============================================

const Quiz = {
  questions: [],         // 20 câu của lần hiện tại
  curIdx: 0,
  score: 0,
  canEarnPoint: true,
  currentTopic: null,
  currentTopicId: null,
  sessionInfo: null,     // {current: 1, total: 3, learnedBefore: 0, totalInTopic: 64}

  // Số câu mục tiêu mỗi lần (sẽ tự điều chỉnh dựa trên tổng câu)
  TARGET_PER_SESSION: 20,

  start(topic) {
    this.currentTopic = topic;
    // ID duy nhất cho topic = subject_topic (để track progress riêng)
    this.currentTopicId = (topic.id || topic.name).toString();
    
    // Lấy progress hôm nay
    const progress = Storage.getTopicProgress(this.currentTopicId);
    const totalInTopic = topic.questions.length;
    
    // Tính cách chia: 20 câu/lần đều nhau
    const numSessions = Math.max(1, Math.ceil(totalInTopic / this.TARGET_PER_SESSION));
    const sessionSize = Math.ceil(totalInTopic / numSessions);
    
    // Lấy danh sách index câu chưa làm hôm nay
    const allIndices = topic.questions.map((_, i) => i);
    const notLearned = allIndices.filter(i => !progress.learned.includes(i));
    
    let selectedIndices;
    let currentSession;
    let isAllDone = false;
    
    if (notLearned.length === 0) {
      // Đã làm hết hôm nay → cho ôn lại câu sai trước, rồi random
      isAllDone = true;
      if (progress.wrong.length > 0) {
        // Ưu tiên câu sai
        selectedIndices = this._shuffle(progress.wrong).slice(0, sessionSize);
      } else {
        // Hết câu sai → random từ đầu
        selectedIndices = this._shuffle(allIndices).slice(0, sessionSize);
      }
      currentSession = numSessions; // Hiển thị "Đã hoàn thành"
    } else if (notLearned.length <= sessionSize) {
      // Còn ít hơn 1 session → lấy hết
      selectedIndices = this._shuffle(notLearned);
      currentSession = numSessions;
    } else {
      // Lấy random từ câu chưa làm
      selectedIndices = this._shuffle(notLearned).slice(0, sessionSize);
      currentSession = Math.floor(progress.learned.length / sessionSize) + 1;
    }
    
    this.questions = selectedIndices.map(i => ({ ...topic.questions[i], _idx: i }));
    this.curIdx = 0;
    this.score = 0;
    
    this.sessionInfo = {
      current: currentSession,
      total: numSessions,
      isAllDone: isAllDone,
      learnedBefore: progress.learned.length,
      totalInTopic: totalInTopic
    };
    
    App.showScreen('quiz');
    this.render();
  },

  render() {
    this.canEarnPoint = true;
    const q = this.questions[this.curIdx];
    const total = this.questions.length;
    const info = this.sessionInfo;

    // Tiêu đề: "Chủ đề · Câu X/Y · Lần A/B"
    let titleText = this.currentTopic.name + ' · Câu ' + (this.curIdx + 1) + '/' + total;
    if (info.total > 1) {
      if (info.isAllDone) {
        titleText += ' · Ôn lại 🔄';
      } else {
        titleText += ' · Lần ' + info.current + '/' + info.total;
      }
    }
    document.getElementById('quizTopicName').textContent = titleText;
    
    document.getElementById('qText').textContent = q.q;
    document.getElementById('scoreDisp').textContent = this.score;
    document.getElementById('progFill').style.width =
      (this.curIdx / total * 100) + '%';

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

  checkAnswer(btn, selected, correct) {
    const q = this.questions[this.curIdx];
    const fb = document.getElementById('feedback');
    const fbText = document.getElementById('fbText');
    const fbAns = document.getElementById('fbAns');

    if (selected === correct) {
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
      
      // Nút next: chỉ ghi "Câu tiếp theo →" hoặc "Xem kết quả 🎉"
      const btnNext = document.getElementById('btnNext');
      btnNext.classList.remove('hidden');
      btnNext.textContent = this.curIdx + 1 >= this.questions.length 
        ? 'Xem kết quả 🎉' 
        : 'Câu tiếp theo →';
    } else {
      Sound.play('wrong');
      btn.classList.add('wrong');
      btn.disabled = true;
      this.canEarnPoint = false;

      fb.className = 'feedback wrong';
      fbText.textContent = 'Chưa đúng rồi, thử lại nhé!';
      fbAns.textContent = q.hint
        ? '💡 Gợi ý: ' + q.hint
        : 'Hãy xem lại câu hỏi một chút con nhé.';
    }
  },

  next() {
    // Lưu progress: câu hiện tại đã làm xong
    const q = this.questions[this.curIdx];
    this._markLearned(q._idx, this.canEarnPoint);
    
    this.curIdx++;
    if (this.curIdx >= this.questions.length) {
      this._finish();
    } else {
      this.render();
    }
  },

  /** Đánh dấu câu đã làm (canEarnPoint = đúng từ đầu, không cần ôn) */
  _markLearned(qIdx, wasCorrect) {
    const progress = Storage.getTopicProgress(this.currentTopicId);
    
    // Thêm vào learned nếu chưa có
    if (!progress.learned.includes(qIdx)) {
      progress.learned.push(qIdx);
    }
    
    // Nếu trả lời sai → đánh dấu cần ôn lại
    if (!wasCorrect && !progress.wrong.includes(qIdx)) {
      progress.wrong.push(qIdx);
    } else if (wasCorrect && progress.wrong.includes(qIdx)) {
      // Trả lời đúng câu đã từng sai → bỏ khỏi danh sách ôn
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
      
      // Hiển thị thông tin tiến độ trong ngày
      let progressMsg = '';
      const newLearnedTotal = info.learnedBefore + total;
      
      if (newLearnedTotal >= info.totalInTopic) {
        progressMsg = '🎉 Con đã làm hết bài này hôm nay! Mai quay lại nhé 🌙';
      } else {
        const remaining = info.totalInTopic - newLearnedTotal;
        progressMsg = '📚 Còn ' + remaining + ' câu nữa trong chủ đề này. Tiếp tục lần sau nhé!';
      }
      
      let praiseMsg = '';
      if (ratio >= 0.9) praiseMsg = 'Xuất sắc! Con thật giỏi! 🌟';
      else if (ratio >= 0.7) praiseMsg = 'Rất tốt! Con đã chăm chỉ lắm! 👏';
      else if (ratio >= 0.5) praiseMsg = 'Khá tốt! Tiếp tục cố gắng nhé! 💪';
      else praiseMsg = 'Con đã hoàn thành rồi! Lần sau sẽ tốt hơn nhé! 🌱';
      
      resultMsg.innerHTML = praiseMsg + '<br><br><span style="font-size:0.9rem;font-weight:600">' + progressMsg + '</span>';
    }
    
    if (ratio >= 0.8) {
      this._confettiBurst();
    }
    
    API.saveScore(App.playerName, this.score, total)
      .then(() => App.loadLeaderboard());
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

// =============================================
// SOUND - Web Audio API
// =============================================

const Sound = {
  ctx: null,
  _getCtx() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) { console.warn('Audio not supported'); }
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
      const freq = note[0];
      const delay = note[1];
      const dur = note[2] || 0.15;
      setTimeout(function() { self._tone(freq, dur, 'triangle'); }, delay);
    });
  },
  play(type) {
    switch (type) {
      case 'correct':
        this._melody([[523.25, 0], [659.25, 80], [783.99, 160]]);
        break;
      case 'wrong':
        this._tone(220, 0.2, 'square', 0.08);
        const self = this;
        setTimeout(function() { self._tone(196, 0.2, 'square', 0.08); }, 150);
        break;
      case 'win':
        this._melody([[523.25, 0], [659.25, 100], [783.99, 200], [1046.50, 300], [1046.50, 500]]);
        break;
    }
  }
};

// =============================================
// REWARDS - sao, sticker, huy hiệu
// =============================================

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
