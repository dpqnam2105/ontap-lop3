// =============================================
// QUIZ.JS v4.1 - lam het cau trong chu de
// (no special unicode in comments - safe for paste)
// =============================================

const Quiz = {
  questions: [],
  curIdx: 0,
  score: 0,
  canEarnPoint: true,
  currentTopic: null,

  start(topic) {
    this.currentTopic = topic;
    // Lay TOAN BO cau trong chu de, van xao tron de moi lan lam khac nhau
    this.questions = [...topic.questions].sort(() => 0.5 - Math.random());
    this.curIdx = 0;
    this.score = 0;
    document.getElementById('quizTopicName').textContent = 
      topic.name + ' . ' + this.questions.length + ' cau';
    App.showScreen('quiz');
    this.render();
  },

  render() {
    this.canEarnPoint = true;
    const q = this.questions[this.curIdx];
    const total = this.questions.length;

    document.getElementById('quizTopicName').textContent = 
      this.currentTopic.name + ' . Cau ' + (this.curIdx + 1) + '/' + total;
    
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
      fbText.textContent = 'Chinh xac! Con lam tot lam!';
      fbAns.textContent = q.explain || '';
      
      const btnNext = document.getElementById('btnNext');
      btnNext.classList.remove('hidden');
      btnNext.textContent = this.curIdx + 1 >= this.questions.length 
        ? 'Xem ket qua' 
        : 'Cau tiep theo (' + (this.curIdx + 2) + '/' + this.questions.length + ')';
    } else {
      Sound.play('wrong');
      btn.classList.add('wrong');
      btn.disabled = true;
      this.canEarnPoint = false;

      fb.className = 'feedback wrong';
      fbText.textContent = 'Chua dung roi, thu lai nhe!';
      fbAns.textContent = q.hint
        ? 'Goi y: ' + q.hint
        : 'Hay xem lai cau hoi mot chut con nhe.';
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
    const total = this.questions.length;
    document.getElementById('resScore').textContent = this.score + '/' + total;
    
    const ratio = this.score / total;
    const resultMsg = document.querySelector('.result-msg');
    if (resultMsg) {
      if (ratio >= 0.9) resultMsg.textContent = 'Xuat sac! Con that gioi!';
      else if (ratio >= 0.7) resultMsg.textContent = 'Rat tot! Con da cham chi lam!';
      else if (ratio >= 0.5) resultMsg.textContent = 'Kha tot! Tiep tuc co gang nhe!';
      else resultMsg.textContent = 'Con da hoan thanh roi! Lan sau se tot hon nhe!';
    }
    
    if (ratio >= 0.8) {
      this._confettiBurst();
    }
    
    API.saveScore(App.playerName, this.score, total)
      .then(() => App.loadLeaderboard());
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
// REWARDS - sao, sticker, huy hieu
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
      alert('Chua du sao de mua Sticker nay roi!');
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
      alert('Con can tich them sao moi doi duoc huy hieu nhe!');
      return;
    }
    data.stars -= cost;
    data.currentBadge = badge;
    Storage.save(data);
    this.updateUI();
  },

  _calcTitle(totalCorrect) {
    if (totalCorrect >= 100) return '👑 Sieu sao hoc tap!';
    if (totalCorrect >= 50) return '🌟 Ngoi sao cham chi!';
    if (totalCorrect >= 20) return '✨ Be tien bo!';
    return '🌱 Nguoi moi bat dau';
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
        ? '<img src="images/sticker_' + data.currentBadge + '.png" class="reward-img" alt="Huy hieu" width="60">'
        : '';
    }
    const invArea = document.getElementById('inventory-area');
    if (invArea) {
      invArea.innerHTML = data.inventory.length > 0
        ? data.inventory.map(function(item) {
            return '<img src="images/' + item + '" class="reward-img" alt="sticker" width="50">';
          }).join(' ')
        : '<div class="empty-inventory">Tui do trong. Hay tich sao de mua sticker nhe!</div>';
    }
  }
};
