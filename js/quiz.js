/* ═══════════════════════════════════════════════
   QUIZ.JS - Logic làm bài quiz
   ═══════════════════════════════════════════════ */

const Quiz = {
  questions: [],
  curIdx: 0,
  score: 0,
  canEarnPoint: true,
  currentTopic: null,

  /** Bắt đầu quiz với 10 câu random từ topic */
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

  /** Hiển thị câu hỏi hiện tại */
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

  /** Kiểm tra đáp án */
  checkAnswer(btn, selected, correct) {
    const q = this.questions[this.curIdx];
    const fb = document.getElementById('feedback');
    const fbText = document.getElementById('fbText');
    const fbAns = document.getElementById('fbAns');

    if (selected === correct) {
      this._playSound('sndCorrect');
      btn.classList.add('correct');

      if (this.canEarnPoint) {
        this.score++;
        Rewards.addStar(1);
        document.getElementById('scoreDisp').textContent = this.score;
      }

      document.querySelectorAll('.ans-btn').forEach(b => b.disabled = true);
      fb.className = 'feedback correct';
      fbText.textContent = 'Chính xác! Con làm tốt lắm! 👏';
      fbAns.textContent = q.explain || '';
      document.getElementById('btnNext').classList.remove('hidden');
    } else {
      this._playSound('sndWrong');
      btn.classList.add('wrong');
      btn.disabled = true;
      this.canEarnPoint = false;

      fb.className = 'feedback wrong';
      fbText.textContent = 'Chưa đúng rồi, thử lại nhé!';
      fbAns.textContent = q.hint
        ? 'Gợi ý: ' + q.hint
        : 'Hãy xem lại câu hỏi một chút con nhé.';
    }
  },

  /** Sang câu tiếp theo hoặc kết thúc */
  next() {
    this.curIdx++;
    if (this.curIdx >= this.questions.length) {
      this._finish();
    } else {
      this.render();
    }
  },

  /** Kết thúc quiz */
  _finish() {
    this._playSound('sndWin');
    App.showScreen('result');
    document.getElementById('resScore').textContent =
      `${this.score}/${this.questions.length}`;
    API.saveScore(App.playerName, this.score, this.questions.length)
      .then(() => App.loadLeaderboard());
  },

  _playSound(id) {
    const audio = document.getElementById(id);
    if (audio) audio.play().catch(() => {});
  }
};

/* ═══════════════════════════════════════════════
   REWARDS - Quản lý sao, sticker, huy hiệu
   ═══════════════════════════════════════════════ */

const Rewards = {
  /** Thêm sao và cập nhật UI + lưu */
  addStar(count) {
    const data = Storage.load();
    data.stars += count;
    data.totalCorrect += count;
    Storage.save(data);
    this.updateUI();
  },

  /** Mua sticker */
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

  /** Đổi huy hiệu */
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

  /** Tính danh hiệu dựa trên tổng câu đúng (không phải sao hiện tại) */
  _calcTitle(totalCorrect) {
    if (totalCorrect >= 100) return '👑 Danh hiệu: Siêu sao học tập!';
    if (totalCorrect >= 50) return '🌟 Danh hiệu: Ngôi sao chăm chỉ!';
    if (totalCorrect >= 20) return '✨ Danh hiệu: Bé tiến bộ!';
    return '🌱 Danh hiệu: Người mới bắt đầu';
  },

  /** Cập nhật toàn bộ UI từ storage */
  updateUI() {
    const data = Storage.load();

    // Sao
    document.getElementById('star-count').textContent = data.stars;

    // Danh hiệu (dựa trên totalCorrect, không bị mất khi đổi quà)
    document.getElementById('title-area').textContent =
      this._calcTitle(data.totalCorrect);

    // Huy hiệu
    const badgeArea = document.getElementById('badge-area');
    if (data.currentBadge) {
      badgeArea.innerHTML =
        `<img src="images/sticker_${data.currentBadge}.png" class="reward-img" alt="Huy hiệu" width="70">`;
    } else {
      badgeArea.innerHTML = '';
    }

    // Túi đồ
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
