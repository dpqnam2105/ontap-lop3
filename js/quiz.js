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

  TARGET_PER_SESSION: 20,

  start(topic, subjectName) {
    this.currentTopic = topic;
    this.currentSubject = subjectName || '';
    this.currentTopicId = (topic.id || topic.name).toString();
    this.sessionStartTime = Date.now();
    
    const progress = Storage.getTopicProgress(this.currentTopicId);
    const totalInTopic = topic.questions.length;
    
    const numSessions = Math.max(1, Math.ceil(totalInTopic / this.TARGET_PER_SESSION));
    const sessionSize = Math.ceil(totalInTopic / numSessions);
    
    const allIndices = topic.questions.map((_, i) => i);
    const notLearned = allIndices.filter(i => !progress.learned.includes(i));
    
    let selectedIndices;
    let currentSession;
    let isAllDone = false;
    
    if (notLearned.length === 0) {
      isAllDone = true;
      if (progress.wrong.length > 0) {
        selectedIndices = this._shuffle(progress.wrong).slice(0, sessionSize);
      } else {
        selectedIndices = this._shuffle(allIndices).slice(0, sessionSize);
      }
      currentSession = numSessions;
    } else if (notLearned.length <= sessionSize) {
      selectedIndices = this._shuffle(notLearned);
      currentSession = numSessions;
    } else {
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
      fbAns.textContent = q.hint ? '💡 Gợi ý: ' + q.hint : 'Hãy xem lại câu hỏi một chút con nhé.';
    }
  },

  next() {
    const q = this.questions[this.curIdx];
    this._markLearned(q._idx, this.canEarnPoint);
    
    this.curIdx++;
    if (this.curIdx >= this.questions.length) {
      this._finish();
    } else {
      this.render();
    }
  },

  _markLearned(qIdx, wasCorrect) {
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
  _fallbackStorageKey: 'khoBaiTapData',

  _defaultData() {
    return {
      playerName: '',
      stars: 0,
      totalCorrect: 0,
      inventory: [],
      currentBadge: null
    };
  },

  _normalizeData(data) {
    data = data && typeof data === 'object' ? data : {};
    return {
      ...this._defaultData(),
      ...data,
      stars: Number(data.stars || 0),
      totalCorrect: Number(data.totalCorrect || 0),
      inventory: Array.isArray(data.inventory) ? data.inventory : [],
      currentBadge: data.currentBadge || null
    };
  },

  _loadData() {
    // Ưu tiên dùng Storage object của app nếu có.
    // Lưu ý: trong Console, chữ Storage có thể trỏ tới Web Storage API của trình duyệt,
    // nên ở đây kiểm tra kỹ trước khi gọi Storage.load().
    try {
      if (typeof Storage !== 'undefined' && Storage && typeof Storage.load === 'function') {
        return this._normalizeData(Storage.load());
      }
    } catch (e) {
      console.warn('Rewards: Storage.load failed, fallback to localStorage', e);
    }

    // Fallback: tự tìm key localStorage có dữ liệu sao/huy hiệu.
    const possibleKeys = [
      'khoBaiTapData',
      'khoBaiTap_data',
      'khoBaiTap',
      'khoBaiTap_storage',
      'khoBaiTap_userData'
    ];

    for (const key of possibleKeys) {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && ('stars' in parsed || 'totalCorrect' in parsed || 'currentBadge' in parsed)) {
          this._fallbackStorageKey = key;
          return this._normalizeData(parsed);
        }
      } catch (e) {}
    }

    // Nếu chưa biết key, quét toàn bộ localStorage để tránh mất dữ liệu cũ.
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      try {
        const raw = localStorage.getItem(key);
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object' && ('stars' in parsed || 'totalCorrect' in parsed || 'currentBadge' in parsed)) {
          this._fallbackStorageKey = key;
          return this._normalizeData(parsed);
        }
      } catch (e) {}
    }

    return this._defaultData();
  },

  _saveData(data) {
    const normalized = this._normalizeData(data);

    try {
      if (typeof Storage !== 'undefined' && Storage && typeof Storage.save === 'function') {
        Storage.save(normalized);
        return true;
      }
    } catch (e) {
      console.warn('Rewards: Storage.save failed, fallback to localStorage', e);
    }

    localStorage.setItem(this._fallbackStorageKey, JSON.stringify(normalized));
    return true;
  },

  _badgeMeta(badge) {
    const map = {
      bronze: { icon: '🥉', label: 'Huy hiệu Đồng', file: 'sticker_bronze.png' },
      silver: { icon: '🥈', label: 'Huy hiệu Bạc', file: 'sticker_silver.png' },
      gold: { icon: '🥇', label: 'Huy hiệu Vàng', file: 'sticker_gold.png' }
    };
    return map[badge] || null;
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

  buyItem(item, cost) {
    const data = this._loadData();
    cost = Number(cost || 0);

    if (data.stars < cost) {
      alert('Chưa đủ sao để mua Sticker này rồi!');
      return;
    }

    data.stars -= cost;
    data.inventory.push(item);

    this._saveData(data);
    this.updateUI();

    if (typeof App !== 'undefined' && App._switchMiniTab) {
      setTimeout(() => App._switchMiniTab('inventory'), 300);
    }
  },


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

  renderShop(attachEvents) {
    const el = document.getElementById('shopItems');
    if (!el) return;
    const data = this._loadData();
    const filterEl = document.getElementById('shopFilter');
    const filter = filterEl ? filterEl.value : 'all';
    const owned = new Set(data.inventory || []);

    let items = this.SHOP_ITEMS.filter(item => {
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
        '<button class="reward-buy-btn" data-item="' + item.file + '" data-cost="' + item.cost + '" ' + (canBuy ? '' : 'disabled') + '>' +
          (isOwned ? 'Đã có' : 'Đổi') +
        '</button>' +
      '</div>';
    }).join('');

    el.querySelectorAll('.reward-buy-btn[data-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.buyItem(btn.dataset.item, parseInt(btn.dataset.cost, 10));
      });
    });
  },

  redeemBadge() {
    const data = this._loadData();

    const rank = { bronze: 1, silver: 2, gold: 3 };
    const currentRank = rank[data.currentBadge] || 0;

    // Nâng cấp theo bậc, không mua lại huy hiệu đã có.
    // Đồng: 10 sao, Bạc: 20 sao, Vàng: 30 sao.
    let badge = null;
    let cost = 0;

    if (currentRank >= 3) {
      alert('Con đã có huy hiệu Vàng rồi! Tuyệt vời quá! 🥇');
      return;
    }

    // Ưu tiên huy hiệu cao nhất mà bé đủ sao và cao hơn huy hiệu hiện tại.
    if (currentRank < 3 && data.stars >= 30) {
      badge = 'gold';
      cost = 30;
    } else if (currentRank < 2 && data.stars >= 20) {
      badge = 'silver';
      cost = 20;
    } else if (currentRank < 1 && data.stars >= 10) {
      badge = 'bronze';
      cost = 10;
    } else {
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
    alert('Đổi thành công ' + (meta ? meta.label : 'huy hiệu') + '! ' + (meta ? meta.icon : '🏅'));
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

    const titleEl = document.getElementById('title-area');
    if (titleEl) titleEl.textContent = this._calcTitle(data.totalCorrect);

    const badgeArea = document.getElementById('badge-area');
    if (badgeArea) {
      const meta = this._badgeMeta(data.currentBadge);
      if (meta) {
        const imgPath = 'images/' + meta.file;
        badgeArea.innerHTML =
          '<div class="badge-display" title="' + meta.label + '">' +
            '<img src="' + imgPath + '" class="reward-img" alt="' + meta.label + '" width="60" ' +
            'onerror="this.outerHTML=&quot;<div class=\\&quot;badge-fallback\\&quot; style=\\&quot;font-size:48px;line-height:60px\\&quot;>' + meta.icon + '</div>&quot;">' +
            '<div style="font-size:0.78rem;font-weight:800;margin-top:4px;color:#E67E22">' + meta.label + '</div>' +
          '</div>';
      } else {
        badgeArea.innerHTML = '';
      }
    }

    const shopBadge = document.getElementById('shopBadgePreview');
    if (shopBadge) {
      const meta = this._badgeMeta(data.currentBadge);
      if (meta) {
        shopBadge.className = 'badge-preview-owned';
        shopBadge.innerHTML =
          '<div class="badge-display">' +
            '<img src="images/' + meta.file + '" class="reward-img" alt="' + meta.label + '" width="96" ' +
            'onerror="this.outerHTML=&quot;<div class=\&quot;badge-fallback\&quot;>' + meta.icon + '</div>&quot;">' +
            '<div class="badge-label">' + meta.label + '</div>' +
          '</div>';
      } else {
        shopBadge.className = 'badge-preview-empty';
        shopBadge.textContent = 'Chưa có huy hiệu';
      }
    }

    if (typeof this.renderShop === 'function') this.renderShop(false);

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

// Cho phép debug dễ hơn trên Console nếu cần:
// window.RewardsApp.updateUI(), window.RewardsApp._loadData()
window.RewardsApp = Rewards;
