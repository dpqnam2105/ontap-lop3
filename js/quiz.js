/* ═══════════════════════════════════════════════
   QUIZ.JS v2 - với animation và sound vui
   ═══════════════════════════════════════════════ */

const Quiz = {
  questions: [],
  curIdx: 0,
  score: 0,
  canEarnPoint: true,
  currentTopic: null,

  start(topic) {
    this.currentTopic = topic;
    this.questions = [...topic.questions]
      .sort(() => 0.5 - Math.random())
      .slice(0, 10);
    this.curIdx = 0;
    this.score = 0;
    document.getElementById('quizTopicName').textContent = 'Chủ đề: ' + topic.name;
    App.showScreen('quiz');
    this.render();
  },

  render() {
    this.canEarnPoint = true;
    const q = this.questions[this.curIdx];

    document.getElementById('qText').textContent = q.q;
    document.getElementById('scoreDisp').textContent = this.score;
    document.getElementById('progFill').style.width =
      (this.curIdx / this.questions.length * 100) + '%';

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
        
        // Animation: sao bay lên + badge pop
        this._flyStar(btn);
        const scoreBadge = document.getElementById('scoreDisp').parentElement;
        scoreBadge.classList.add('pop');
        setTimeout(() => scoreBadge.classList.remove('pop'), 500);
      }

      document.querySelectorAll('.ans-btn').forEach(b => b.disabled = true);
      fb.className = 'feedback correct';
      fbText.textContent = 'Chính xác! Con làm tốt lắm! 👏';
      fbAns.textContent = q.explain || '';
      document.getElementById('btnNext').classList.remove('hidden');
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
    this.curIdx++;
    if (this.curIdx >= this.questions.length) {
      this._finish();
    } else {
      this.render();
    }
  },

  _finish() {
    Sound.play('win');
    App.showScreen('result');
    document.getElementById('resScore').textContent =
      `${this.score}/${this.questions.length}`;
    
    // Confetti nhẹ nếu được điểm cao
    if (this.score >= 8) {
      this._confettiBurst();
    }
    
    API.saveScore(App.playerName, this.score, this.questions.length)
      .then(() => App.loadLeaderboard());
  },

  /** Animation: sao bay từ vị trí nút lên góc score */
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

  /** Confetti nhẹ khi điểm cao */
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

/* ═══════════════════════════════════════════════
   SOUND - âm thanh vui hơn
   Dùng Web Audio API tạo tone đơn giản
   ═══════════════════════════════════════════════ */

const Sound = {
  ctx: null,

  _getCtx() {
    if (!this.ctx) {
      try {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (e) {
        console.warn('Audio not supported');
      }
    }
    return this.ctx;
  },

  /** Phát 1 tone đơn giản */
  _tone(freq, duration, type = 'sine', volume = 0.15) {
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

  /** Chơi melody nhiều note liên tiếp */
  _melody(notes) {
    const ctx = this._getCtx();
    if (!ctx) return;
    
    notes.forEach(([freq, delay, dur = 0.15], i) => {
      setTimeout(() => this._tone(freq, dur, 'triangle'), delay);
    });
  },

  play(type) {
    switch (type) {
      case 'correct':
        // Ding ding! - C5 → E5 → G5 (hợp âm Đô trưởng đi lên)
        this._melody([
          [523.25, 0],    // C5
          [659.25, 80],   // E5
          [783.99, 160],  // G5
        ]);
        break;
        
      case 'wrong':
        // Buzz nhẹ - A3 chậm
        this._tone(220, 0.2, 'square', 0.08);
        setTimeout(() => this._tone(196, 0.2, 'square', 0.08), 150);
        break;
        
      case 'win':
        // Fanfare - C5 → E5 → G5 → C6 (hợp âm thắng cuộc)
        this._melody([
          [523.25, 0],
          [659.25, 100],
          [783.99, 200],
          [1046.50, 300],
          [1046.50, 500],
        ]);
        break;
    }
  }
};

/* ═══════════════════════════════════════════════
   REWARDS - sao, sticker, huy hiệu
   ═══════════════════════════════════════════════ */

const Rewards = {
  addStar(count) {
    const data = Storage.load();
    const oldTitle = this._calcTitle(data.totalCorrect);
    
    data.stars += count;
    data.totalCorrect += count;
    Storage.save(data);
    
    const newTitle = this._calcTitle(data.totalCorrect);
    this.updateUI();
    
    // Nếu danh hiệu vừa lên cấp → animation đặc biệt
    if (oldTitle !== newTitle) {
      this._titleUpgradeAnimation();
    }
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
    if (totalCorrect >= 100) return '👑 Danh hiệu: Siêu sao học tập!';
    if (totalCorrect >= 50) return '🌟 Danh hiệu: Ngôi sao chăm chỉ!';
    if (totalCorrect >= 20) return '✨ Danh hiệu: Bé tiến bộ!';
    return '🌱 Danh hiệu: Người mới bắt đầu';
  },

  _titleUpgradeAnimation() {
    const titleEl = document.getElementById('title-area');
    titleEl.classList.add('upgraded');
    setTimeout(() => titleEl.classList.remove('upgraded'), 1000);
    Sound.play('win');
  },

  updateUI() {
    const data = Storage.load();

    document.getElementById('star-count').textContent = data.stars;
    document.getElementById('title-area').textContent =
      this._calcTitle(data.totalCorrect);

    const badgeArea = document.getElementById('badge-area');
    if (data.currentBadge) {
      badgeArea.innerHTML =
        `<img src="images/sticker_${data.currentBadge}.png" class="reward-img" alt="Huy hiệu" width="70">`;
    } else {
      badgeArea.innerHTML = '';
    }

    const invCard = document.getElementById('inventory-card');
    const invArea = document.getElementById('inventory-area');
    if (data.inventory.length > 0) {
      invCard.classList.remove('hidden');
      invArea.innerHTML = data.inventory
        .map(item => `<img src="images/${item}" class="reward-img" alt="sticker" width="60">`)
        .join(' ');
    } else {
      invCard.classList.add('hidden');
    }
  }
};
