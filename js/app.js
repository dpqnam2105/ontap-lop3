// =============================================
// APP.JS v5 - thêm màn chọn lớp
// =============================================

const App = {
  allData: null,
  playerName: '',
  currentGrade: 'lop2',

  PIN_KEY: 'khoBaiTap_parentPin',
  DEFAULT_PIN: '1234',
  leaderboardGrade: 'lop2',
  DRAGONBALL_KEY: 'rabbit_dragonball_collection',
  DRAGON_REWARD_KEY: 'rabbit_shenron_unlocked',

  async init() {
    this._bindEvents();
    this._restoreSession();
    this.loadLeaderboard('lop2');
    this._renderHomeWidgets();
    await this._loadData();
    this._renderHomeWidgets();
  },

  _restoreSession() {
    const data = Storage.load();
    if (data.playerName) {
      this.playerName = data.playerName;
      document.getElementById('nameInput').value = data.playerName;
      document.getElementById('btnStart').disabled = false;
    }
  },

  async _loadData() {
    this.allData = await API.getAllData();
    
    // BUG #5 FIX: normalize question bank để engine hoạt động đúng
    // - Gắn ID ổn định cho mỗi câu (spaced repetition cần ID không đổi)
    // - Tính difficulty + skill cho câu chưa có
    // - Adaptive selection cần data đã normalize
    if (this.allData && window.LearningEngine && window.LearningEngine.normalizeQuestionBank) {
      try {
        this.allData = window.LearningEngine.normalizeQuestionBank(this.allData);
        console.log('✅ LearningEngine normalized:', window.LearningEngine.ENGINE_VERSION);
      } catch (e) {
        console.warn('LearningEngine.normalizeQuestionBank failed:', e);
      }
    }
    
    if (this.playerName && this.allData) this._renderSubjects();
    if (this.playerName) this._showWelcome(this.playerName);
    this._renderHomeWidgets();
  },

  async loadLeaderboard(gradeId = 'lop2') {
    const lbDiv = document.getElementById('lbList');
    if (!lbDiv) return;
    this.leaderboardGrade = gradeId;
    document.querySelectorAll('.lb-grade-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.grade === gradeId);
    });

    if (gradeId !== 'lop2') {
      const gradeLabel = gradeId.replace('lop', 'Lớp ');
      lbDiv.innerHTML = '<div class="leaderboard-locked"><div class="locked-big">🔒</div><b>' + gradeLabel + ' sắp mở</b><span>Hiện tại web đang ưu tiên lớp 2. Khi mở lớp mới, bảng xếp hạng sẽ hiện riêng tại đây.</span></div>';
      return;
    }

    lbDiv.innerHTML = '<div class="loading-text">Đang tải xếp hạng...</div>';
    const data = await API.getLeaderboard();

    if (!data || data.length === 0) {
      lbDiv.innerHTML = '<div class="loading-text">Chưa có điểm nào. Hãy là người đầu tiên! 🚀</div>';
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const rows = data.slice(0, 5).map((p, i) => {
      const icon = medals[i] || (i + 1);
      return `<tr><td class="lb-rank">${icon}</td><td class="lb-name"><b>${this._escape(p.name)}</b></td><td class="lb-score"><b>${p.totalScore} ⭐</b></td></tr>`;
    }).join('');

    lbDiv.innerHTML = `<table class="lb-table">${rows}</table>`;
  },

  showScreen(name) {
    // Cần có tên trước khi vào khu học (grade/subject/topic). Nếu chưa, đưa về Trang chủ.
    const needsName = (name === 'grade' || name === 'subject' || name === 'topic');
    if (needsName && !this.playerName) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('screenRegister').classList.add('active');
      this._renderHomeWidgets();
      const ni = document.getElementById('nameInput');
      if (ni) { ni.focus(); ni.classList.add('name-input-nudge'); setTimeout(() => ni.classList.remove('name-input-nudge'), 1200); }
      if (Rewards && Rewards._achievementPopup) Rewards._achievementPopup('✍️ Con nhập tên trước khi vào học nhé!');
      window.scrollTo(0, 0);
      return;
    }
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const id = 'screen' + name.charAt(0).toUpperCase() + name.slice(1);
    const screen = document.getElementById(id);
    if (!screen) { console.warn('Screen not found:', id); return; }
    screen.classList.add('active');
    if (name === 'register' || name === 'subject') this._renderHomeWidgets();
    if (name === 'shop') this._renderDragonShop();
    if (name === 'collection') this._renderCollection();
    window.scrollTo(0, 0);
  },

  _register() {
    const name = document.getElementById('nameInput').value.trim();
    if (name.length < 2) return;

    this.playerName = name;
    Storage.set('playerName', name);

    document.getElementById('subName').textContent = 'Chào ' + name + '!';
    Rewards.updateUI();
    this._renderHomeWidgets();
    this._showWelcome(name);

    // Lưu tên xong → ở lại Trang chủ (sảnh chờ). Bé bấm "Vào học" ở menu để bắt đầu học.
    this.showScreen('register');
    this._achievementName(name);
  },

  /** Đổi khung nhập tên thành lời chào sau khi đã có tên. */
  _showWelcome(name) {
    const reg = document.getElementById('heroRegister');
    const wel = document.getElementById('heroWelcome');
    const intro = document.getElementById('heroIntro');
    const welName = document.getElementById('heroWelcomeName');
    if (welName) welName.textContent = 'Xin chào ' + name + '!';
    if (reg) reg.classList.add('hidden');
    if (intro) intro.classList.add('hidden');
    if (wel) wel.classList.remove('hidden');
  },

  /** Báo nhỏ đã lưu tên + nhắc bấm Vào học. */
  _achievementName(name) {
    if (Rewards && Rewards._achievementPopup) {
      Rewards._achievementPopup('🐰 Chào ' + name + ', chúc con học tập vui vẻ!');
    }
  },

  /** Xử lý khi bấm chọn lớp */
  _chooseGrade(gradeId) {
    const gradeNames = {
      'lop2': 'Lớp 2',
      'lop3': 'Lớp 3',
      'lop4': 'Lớp 4',
      'lop5': 'Lớp 5'
    };
    
    const gradeName = gradeNames[gradeId] || 'Lớp ?';
    
    // Lớp 2 đang mở
    if (gradeId === 'lop2') {
      this.currentGrade = gradeId;
      document.getElementById('currentGradeLabel').textContent = '📚 ' + gradeName + ' - Học gì hôm nay?';
      this.showScreen('subject');
      
      if (this.allData) {
        this._renderSubjects();
      } else {
        document.getElementById('subjectList').innerHTML = 
          '<div class="loading-text">Đang tải bài tập... ⏳</div>';
        const checkData = setInterval(() => {
          if (this.allData) {
            clearInterval(checkData);
            this._renderSubjects();
          }
        }, 200);
      }
      return;
    }
    
    // Các lớp khác → thông báo nghỉ hè
    alert(
      '🌴 ' + gradeName + ' đang nghỉ hè!\n\n' +
      'Thầy cô giáo đang chuẩn bị bài tập cho ' + gradeName + '.\n' +
      'Hẹn gặp con vào năm học mới nhé! 🐰\n\n' +
      'Hiện tại con cứ học chăm chỉ Lớp 2 đã, ' + gradeName + ' sẽ mở sớm thôi! 💪'
    );
  },

  _renderSubjects() {
    const el = document.getElementById('subjectList');
    el.innerHTML = '';

    // Các môn thật (có dữ liệu) — dùng ảnh banner theo id.
    this.allData.subjects.forEach((s, i) => {
      const card = document.createElement('div');
      card.className = 'sub-card sub-card-img';
      card.innerHTML = `
        <img class="sub-banner" src="images/subject-${s.id}.png" alt="${this._escape(s.name)}"
             onerror="this.style.display='none';this.parentElement.classList.add('sub-card-noimg')">
        <div class="sub-card-fallback">
          <div class="sub-icon">${s.icon}</div>
          <div class="sub-info">
            <div class="sub-name">${this._escape(s.name)}</div>
            <div class="sub-meta">${s.topics.length} chủ đề ôn tập</div>
          </div>
        </div>`;
      card.addEventListener('click', () => this._chooseSubject(i));
      el.appendChild(card);
    });

    // Môn "Toán Tiếng Anh" — CHƯA có dữ liệu → thẻ Sắp ra mắt.
    const soon = document.createElement('div');
    soon.className = 'sub-card sub-card-img sub-card-soon';
    soon.innerHTML = `
      <img class="sub-banner" src="images/subject-toan-tieng-anh.png" alt="Toán Tiếng Anh"
           onerror="this.style.display='none';this.parentElement.classList.add('sub-card-noimg')">
      <div class="sub-soon-badge">🔒 Sắp ra mắt</div>
      <div class="sub-card-fallback">
        <div class="sub-icon">🧮</div>
        <div class="sub-info">
          <div class="sub-name">Toán Tiếng Anh</div>
          <div class="sub-meta">Sắp ra mắt</div>
        </div>
      </div>`;
    soon.addEventListener('click', () => {
      if (Rewards && Rewards._achievementPopup) Rewards._achievementPopup('🔒 Môn Toán Tiếng Anh sắp ra mắt, con chờ chút nhé!');
    });
    // ^ sau này có dữ liệu, đổi dòng trên thành: soon.addEventListener('click', () => this._chooseSubject(idxMoiCuaMon));
    el.appendChild(soon);
  },

  // Mô tả kỹ năng ngắn cho từng chủ đề (hiện trên card). Khớp theo id chủ đề trong questions.json.
  TOPIC_DESC: {
    // Toán
    toan_so: 'Đếm, đọc, viết số · So sánh số · Số chẵn, số lẻ',
    toan_cong: 'Cộng trong phạm vi 100 · Cộng có nhớ · Cộng nhẩm',
    toan_tru: 'Trừ trong phạm vi 100 · Trừ có nhớ · Trừ nhẩm',
    toan_nhan: 'Bảng nhân 2-5 · Nhân trong phạm vi 100 · Nhân nhẩm',
    toan_chia: 'Bảng chia 2-5 · Chia trong phạm vi 100 · Chia nhẩm',
    toan_dovi: 'Độ dài (cm, m) · Khối lượng (kg, g) · Dung tích (l, ml)',
    toan_hinh: 'Hình vuông, chữ nhật · Tam giác, hình tròn · Đường thẳng, cong',
    toan_loivan: 'Tìm hiểu đề bài · Chọn phép tính · Trả lời và kiểm tra',
    toan_tuyduy: 'Tìm quy luật · Điền số còn thiếu · Rèn luyện tư duy',
    // Tiếng Việt
    tv_chinh: 'Nghe - viết · Nhìn - viết · Viết đúng chính tả',
    tv_tuvung: 'Mở rộng vốn từ · Từ theo chủ điểm · Từ trái nghĩa',
    tv_ngu: 'Từ chỉ sự vật, hoạt động · Câu giới thiệu · Dấu câu',
    tv_tutu: 'So sánh · Nhân hóa · Biện pháp tu từ cơ bản',
    tv_dochieu: 'Đọc đúng, trôi chảy · Hiểu nội dung · Trả lời câu hỏi',
    tv_hsg: 'Bài nâng cao · Cảm thụ văn học · Luyện thi học sinh giỏi',
    // Tiếng Anh
    en_vocab: 'Family, School · Animals, Colors · Food, Toys, Clothes',
    en_numbers: 'Numbers 1-100 · Telling the time · Days & months',
    en_gram: 'This / That · He / She / They · I can ...',
    en_jobs: 'Jobs (doctor, teacher) · Sports · What does he do?',
    en_sent: 'Đọc câu ngắn · Hiểu đoạn văn · Trả lời câu hỏi',
    en_start: 'Ôn tập tổng hợp · Listening & Reading · Tự tin thi thử'
  },

  _chooseSubject(idx) {
    const s = this.allData.subjects[idx];
    document.getElementById('topicMenuTitle').textContent = s.name;

    const list = document.getElementById('topicList');
    list.innerHTML = '';

    s.topics.forEach((t) => {
      const card = document.createElement('div');
      card.className = 'topic-card topic-card-with-modes';

      // ----- Tiến độ thật: lấy từ Storage.getTopicProgress -----
      const topicId = (t.id || t.name).toString();
      const totalQ = (t.questions || []).length;
      let learned = 0, wrong = 0;
      try {
        const prog = (window.Storage && Storage.getTopicProgress) ? Storage.getTopicProgress(topicId) : null;
        if (prog) {
          learned = (prog.learned || []).filter(i => i < totalQ).length;
          wrong = (prog.wrong || []).filter(i => i < totalQ).length;
        }
      } catch (e) { /* chưa có tiến độ thì để 0 */ }
      const pct = totalQ ? Math.round(learned / totalQ * 100) : 0;
      const st = this._topicStatus(pct);
      const desc = this.TOPIC_DESC[topicId] || '';

      card.innerHTML = `
        <div class="topic-card-main">
          <div class="topic-icon">${t.icon}</div>
          <div class="topic-head-text">
            <div class="topic-name">${this._escape(t.name)}</div>
            <div class="topic-subline">${totalQ} câu hỏi</div>
          </div>
        </div>
        ${desc ? `<div class="topic-desc">${this._escape(desc)}</div>` : ''}
        <div class="topic-progress-wrap">
          <div class="topic-prog-bar"><div class="topic-prog-fill" style="width:${pct}%;background:${st.color}"></div></div>
          <div class="topic-prog-meta">
            <span class="topic-status-tag" style="color:${st.color}">${st.label}</span>
            <span class="topic-pct">${pct}%${wrong ? ' · ' + wrong + ' câu cần ôn' : ''}</span>
          </div>
        </div>
        <div class="topic-mode-hint">👇 Chọn cách học để bắt đầu</div>
        <div class="topic-mode-row">
          <button class="mode-btn practice" data-mode="practice">🧠 Luyện tập</button>
          <button class="mode-btn test" data-mode="test">📝 Kiểm tra</button>
          <button class="mode-btn review" data-mode="review">🔁 Ôn lỗi sai</button>
        </div>`;

      card.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          Quiz.start(t, s.name, { mode: btn.dataset.mode, subjectId: s.id });
        });
      });

      // Bỏ click thẳng vào card — bé PHẢI bấm đúng nút chế độ mới vào bài.
      list.appendChild(card);
    });

    this.showScreen('topic');
  },

  /** Đổi % tiến độ thành nhãn + màu trạng thái cho card chủ đề. */
  _topicStatus(pct) {
    if (pct >= 90) return { label: 'Đã vững', color: '#16a34a' };
    if (pct >= 70) return { label: 'Đang tốt', color: '#22c55e' };
    if (pct >= 40) return { label: 'Đang học', color: '#f59e0b' };
    if (pct > 0)   return { label: 'Cần cố gắng', color: '#f97316' };
    return { label: 'Chưa bắt đầu', color: '#94a3b8' };
  },

  _switchMiniTab(target) {
    document.querySelectorAll('.mini-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.mini-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`.mini-tab[data-mini="${target}"]`).classList.add('active');
    document.getElementById('mini' + target.charAt(0).toUpperCase() + target.slice(1)).classList.add('active');
  },


  // DRAGON BALL + HOMEPAGE WIDGETS
  _getDragonCollection() {
    try {
      const raw = localStorage.getItem(this.DRAGONBALL_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map(Number).filter(n => n >= 1 && n <= 7) : [];
    } catch (e) {
      return [];
    }
  },

  _saveDragonCollection(list) {
    const unique = [...new Set(list.map(Number).filter(n => n >= 1 && n <= 7))].sort((a, b) => a - b);
    localStorage.setItem(this.DRAGONBALL_KEY, JSON.stringify(unique));
    this._checkDragonReward(unique);
    this._renderHomeWidgets();
    this._renderCollection();
    this._renderDragonShop();
  },

  _getStars() {
    const candidates = ['stars', 'score', 'totalStars', 'profileStars'];
    for (const key of candidates) {
      const n = parseInt(Storage.get ? Storage.get(key, 0) : localStorage.getItem(key), 10);
      if (!Number.isNaN(n) && n > 0) return n;
    }
    const mirror = document.getElementById('profileStarMirror');
    const fromDom = mirror ? parseInt(mirror.textContent, 10) : 0;
    return Number.isNaN(fromDom) ? 0 : fromDom;
  },

  _setStars(value) {
    const next = Math.max(0, parseInt(value, 10) || 0);
    if (Storage.set) Storage.set('stars', next);
    else localStorage.setItem('stars', String(next));
    const ids = ['profileStarMirror', 'shopStarCount'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = next;
    });
    if (window.Rewards && Rewards.updateUI) Rewards.updateUI();
  },

  _dragonPrices() {
    return { 1: 50, 2: 70, 3: 90, 4: 120, 5: 160, 6: 220, 7: 300 };
  },

  _dragonName(n) {
    return 'Ngọc rồng ' + n + ' sao';
  },

  _dragonImg(n) {
    return 'images/dragonball_' + n + '.png';
  },

  _renderDragonBallIcon(n, owned) {
    return `<div class="dragon-ball-icon ${owned ? 'owned' : 'locked'}" title="${this._dragonName(n)}">
      <img src="${this._dragonImg(n)}" alt="${this._dragonName(n)}" onerror="this.style.display='none';this.parentNode.querySelector('.dragon-fallback').style.display='grid';">
      <span class="dragon-fallback" style="display:none">${'★'.repeat(n)}</span>
    </div>`;
  },

  _renderHomeWidgets() {
    const missionList = document.getElementById('dailyMissionList');
    const progressGrid = document.getElementById('learningProgressGrid');
    const dragonRow = document.getElementById('homeDragonBalls');
    const dragonProgress = document.getElementById('dragonProgressText');
    if (!missionList || !progressGrid || !dragonRow) return;

    const stars = this._getStars();
    const collection = this._getDragonCollection();
    const unlocked = localStorage.getItem(this.DRAGON_REWARD_KEY) === '1';

    // Đọc thống kê thật từ dữ liệu hồ sơ (streak / câu đúng nằm trong object Storage,
    // KHÔNG nằm ở các key rời 'khoBaiTap_*' — trước đây luôn hiển thị 1 và 0).
    const profile = (typeof Storage !== 'undefined' && Storage.load) ? Storage.load() : {};
    const streak = Number(profile.streak || 0);
    const totalCorrect = Number(profile.totalCorrect || 0);

    missionList.innerHTML = `
      <div class="mission-line"><span>✅ Làm 5 câu đúng</span><b>+5 ⭐</b></div>
      <div class="mission-line"><span>🔥 Học 1 lượt bất kỳ</span><b>+XP</b></div>
      <div class="mission-line"><span>🐉 Sưu tập ngọc rồng</span><button type="button" class="text-link-btn" data-open-shop="1">Shop</button></div>`;

    progressGrid.innerHTML = `
      <div class="progress-mini"><b>${streak}</b><span>🔥 Chuỗi ngày</span></div>
      <div class="progress-mini"><b>${stars}</b><span>⭐ Tổng sao</span></div>
      <div class="progress-mini"><b>${totalCorrect}</b><span>🧠 Câu đúng</span></div>
      <div class="progress-mini"><b>${collection.length}/7</b><span>🐉 Ngọc rồng</span></div>`;

    if (dragonProgress) dragonProgress.textContent = collection.length + '/7 viên';
    dragonRow.innerHTML = [1,2,3,4,5,6,7].map(n => this._renderDragonBallIcon(n, collection.includes(n))).join('');
    const hint = document.getElementById('dragonHint');
    if (hint) hint.textContent = unlocked ? 'Đã mở khóa Sticker Rồng Thần! 🐉' : 'Thu thập đủ 7 viên để nhận Sticker Rồng Thần.';

    document.querySelectorAll('[data-open-shop="1"]').forEach(btn => {
      btn.onclick = () => this.showScreen('shop');
    });
  },

  _renderDragonShop() {
    const shopItems = document.getElementById('shopItems');
    if (!shopItems) return;

    const oldDragonSection = document.getElementById('dragonShopSection');
    if (oldDragonSection) oldDragonSection.remove();

    const collection = this._getDragonCollection();
    const prices = this._dragonPrices();
    const stars = this._getStars();
    const section = document.createElement('div');
    section.id = 'dragonShopSection';
    section.className = 'dragon-shop-section';
    section.innerHTML = `
      <div class="dragon-shop-head">
        <div>
          <h3>🐉 Shop 7 viên ngọc rồng</h3>
          <p>Mua đủ bộ để nhận Sticker Rồng Thần.</p>
        </div>
        <div class="dragon-shop-wallet">⭐ ${stars}</div>
      </div>
      <div class="dragon-shop-grid">
        ${[1,2,3,4,5,6,7].map(n => {
          const owned = collection.includes(n);
          const canBuy = stars >= prices[n] && !owned;
          return `<div class="dragon-shop-card ${owned ? 'owned' : ''}">
            ${this._renderDragonBallIcon(n, true)}
            <div class="dragon-shop-name">${this._dragonName(n)}</div>
            <div class="dragon-shop-price">${owned ? 'Đã có' : prices[n] + ' ⭐'}</div>
            <button type="button" class="reward-buy-btn dragon-buy-btn" data-dragon="${n}" ${owned || !canBuy ? 'disabled' : ''}>${owned ? 'Đã mua' : 'Mua'}</button>
          </div>`;
        }).join('')}
      </div>`;

    shopItems.parentNode.insertBefore(section, shopItems);
    section.querySelectorAll('.dragon-buy-btn[data-dragon]').forEach(btn => {
      btn.addEventListener('click', () => this._buyDragonBall(parseInt(btn.dataset.dragon, 10)));
    });

    const shopStar = document.getElementById('shopStarCount');
    if (shopStar) shopStar.textContent = stars;
  },

  _buyDragonBall(n) {
    const collection = this._getDragonCollection();
    if (collection.includes(n)) return;
    const price = this._dragonPrices()[n];
    const stars = this._getStars();
    if (stars < price) {
      alert('Con chưa đủ sao để mua viên này. Học thêm để tích sao nhé! ⭐');
      return;
    }
    this._setStars(stars - price);
    collection.push(n);
    this._saveDragonCollection(collection);
    alert('Đã mua ' + this._dragonName(n) + '! 🐉');
    this._renderHomeWidgets();
    this._renderDragonShop();
    this._renderCollection();
  },

  _checkDragonReward(collection) {
    const hasAll = collection.length >= 7;
    const unlocked = localStorage.getItem(this.DRAGON_REWARD_KEY) === '1';
    if (hasAll && !unlocked) {
      localStorage.setItem(this.DRAGON_REWARD_KEY, '1');
      this._addShenronToInventory();
      setTimeout(() => alert('🐉 Rồng Thần xuất hiện! Con đã nhận Sticker Rồng Thần!'), 100);
    }
  },

  _addShenronToInventory() {
    try {
      const key = 'inventory';
      const raw = Storage.get ? Storage.get(key, []) : JSON.parse(localStorage.getItem(key) || '[]');
      const inventory = Array.isArray(raw) ? raw : [];
      if (!inventory.includes('sticker_shenron')) inventory.push('sticker_shenron');
      if (Storage.set) Storage.set(key, inventory);
      else localStorage.setItem(key, JSON.stringify(inventory));
    } catch (e) {
      localStorage.setItem('rabbit_shenron_inventory_fallback', '1');
    }
  },

  _renderCollection() {
    const grid = document.getElementById('collectionDragonGrid');
    if (!grid) return;
    const collection = this._getDragonCollection();
    const unlocked = localStorage.getItem(this.DRAGON_REWARD_KEY) === '1';
    grid.innerHTML = [1,2,3,4,5,6,7].map(n => {
      const owned = collection.includes(n);
      return `<div class="collection-dragon-card ${owned ? 'owned' : 'locked'}">
        ${this._renderDragonBallIcon(n, owned)}
        <h3>${this._dragonName(n)}</h3>
        <p>${owned ? 'Đã thu thập' : 'Chưa có'}</p>
      </div>`;
    }).join('');
    const reward = document.getElementById('collectionRewardBadge');
    if (reward) reward.innerHTML = unlocked ? '🐉<span>Đã nhận Rồng Thần</span>' : collection.length + '/7<span>Đang sưu tập</span>';
  },

  // PARENT DASHBOARD
  _openParentArea() {
    document.getElementById('pinInput').value = '';
    document.getElementById('pinError').classList.add('hidden');
    
    const isDefault = !localStorage.getItem(this.PIN_KEY);
    const hint = document.getElementById('pinHint');
    if (isDefault) {
      hint.textContent = '💡 Lần đầu truy cập: PIN mặc định là 1234. Hãy đổi sau khi vào.';
    } else {
      hint.textContent = '';
    }
    
    this.showScreen('pin');
    setTimeout(() => document.getElementById('pinInput').focus(), 100);
  },

  _checkPin() {
    const input = document.getElementById('pinInput').value.trim();
    const savedPin = localStorage.getItem(this.PIN_KEY) || this.DEFAULT_PIN;
    
    if (input === savedPin) {
      document.getElementById('pinError').classList.add('hidden');
      this._openDashboard();
    } else {
      document.getElementById('pinError').classList.remove('hidden');
      document.getElementById('pinInput').value = '';
      document.getElementById('pinInput').focus();
    }
  },

  _changePin() {
    const oldPin = prompt('Nhập PIN hiện tại:');
    if (oldPin === null) return;
    
    const savedPin = localStorage.getItem(this.PIN_KEY) || this.DEFAULT_PIN;
    if (oldPin !== savedPin) {
      alert('PIN hiện tại không đúng!');
      return;
    }
    
    const newPin = prompt('Nhập PIN mới (4 số):');
    if (newPin === null) return;
    
    if (!/^\d{4}$/.test(newPin)) {
      alert('PIN phải là 4 chữ số!');
      return;
    }
    
    localStorage.setItem(this.PIN_KEY, newPin);
    alert('Đã đổi PIN thành công!');
  },

  async _openDashboard() {
    this.showScreen('parent');

    // Nhắc đổi PIN nếu vẫn đang dùng PIN mặc định (chưa từng đặt PIN riêng).
    // PIN chỉ là rào cản nhẹ phía trình duyệt, không phải bảo mật thật.
    if (!localStorage.getItem(this.PIN_KEY)) {
      setTimeout(() => alert('🔒 Bạn đang dùng PIN mặc định (1234). Hãy bấm "Đổi PIN" để đặt mã riêng cho an toàn hơn.'), 200);
    }

    const select = document.getElementById('parentNameSelect');
    select.innerHTML = '<option>Đang tải...</option>';
    
    const leaderboard = await API.getLeaderboard();
    const names = leaderboard.map(p => p.name);
    
    if (this.playerName && !names.includes(this.playerName)) {
      names.unshift(this.playerName);
    }
    
    if (names.length === 0) {
      select.innerHTML = '<option>Chưa có bé nào</option>';
      document.getElementById('summaryContent').innerHTML = '<div class="no-log">Chưa có dữ liệu học tập</div>';
      document.getElementById('dailyContent').innerHTML = '';
      return;
    }
    
    select.innerHTML = names.map(n => `<option value="${this._escape(n)}">${this._escape(n)}</option>`).join('');
    
    if (this.playerName && names.includes(this.playerName)) {
      select.value = this.playerName;
    }
    
    await this._loadParentLog(select.value);
  },

  async _loadParentLog(name) {
    document.getElementById('summaryContent').innerHTML = '<div class="loading-text">Đang tải...</div>';
    document.getElementById('dailyContent').innerHTML = '<div class="loading-text">Đang tải...</div>';
    
    const logs = await API.getLog(name, 30);
    
    if (!logs || logs.length === 0) {
      document.getElementById('summaryContent').innerHTML = '<div class="no-log">Chưa có dữ liệu học tập trong 30 ngày qua</div>';
      document.getElementById('dailyContent').innerHTML = '';
      return;
    }
    
    this._renderSummary(logs);
    this._renderDailyLog(logs);
  },

  _renderSummary(logs) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recent = logs.filter(l => new Date(l.time) >= sevenDaysAgo);
    
    if (recent.length === 0) {
      document.getElementById('summaryContent').innerHTML = '<div class="no-log">Không có hoạt động học trong 7 ngày qua</div>';
      return;
    }
    
    const totalSessions = recent.length;
    const totalQ = recent.reduce((s, l) => s + (l.total || 0), 0);
    const totalCorrect = recent.reduce((s, l) => s + (l.correct || 0), 0);
    const totalSec = recent.reduce((s, l) => s + (l.duration || 0), 0);
    const accuracy = totalQ > 0 ? Math.round(totalCorrect / totalQ * 100) : 0;
    const totalMin = Math.round(totalSec / 60);
    
    document.getElementById('summaryContent').innerHTML = `
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-card-icon">📚</div>
          <div class="summary-card-value">${totalSessions}</div>
          <div class="summary-card-label">Lượt học</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-icon">⏱️</div>
          <div class="summary-card-value">${totalMin}</div>
          <div class="summary-card-label">Phút</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-icon">✅</div>
          <div class="summary-card-value">${totalCorrect}/${totalQ}</div>
          <div class="summary-card-label">Câu đúng</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-icon">🎯</div>
          <div class="summary-card-value">${accuracy}%</div>
          <div class="summary-card-label">Tỷ lệ đúng</div>
        </div>
      </div>
    `;
  },

  _renderDailyLog(logs) {
    const byDate = {};
    logs.forEach(log => {
      const d = new Date(log.time);
      const key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      if (!byDate[key]) byDate[key] = [];
      byDate[key].push(log);
    });
    
    const todayKey = (() => {
      const n = new Date();
      return n.getFullYear() + '-' + String(n.getMonth() + 1).padStart(2, '0') + '-' + String(n.getDate()).padStart(2, '0');
    })();
    
    const sortedDates = Object.keys(byDate).sort().reverse();
    let html = '';
    
    sortedDates.forEach(dateKey => {
      const isToday = dateKey === todayKey;
      const d = new Date(dateKey);
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const dateLabel = isToday 
        ? '📅 Hôm nay - ' + d.getDate() + '/' + (d.getMonth() + 1)
        : days[d.getDay()] + ', ' + d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
      
      html += `<div class="day-group">`;
      html += `<div class="day-header ${isToday ? 'today' : ''}"><span>${dateLabel}</span><button type="button" class="day-detail-btn" data-date="${dateKey}">🔎 Chi tiết</button></div>`;
      
      byDate[dateKey].forEach(log => {
        const ratio = log.total > 0 ? log.correct / log.total : 0;
        const ratioClass = ratio >= 0.8 ? 'good' : (ratio >= 0.5 ? 'warning' : 'bad');
        
        const time = new Date(log.time);
        const timeStr = String(time.getHours()).padStart(2, '0') + ':' + String(time.getMinutes()).padStart(2, '0');
        const durationMin = Math.round((log.duration || 0) / 60);
        const durStr = durationMin > 0 ? ' (' + durationMin + ' phút)' : '';
        
        html += `
          <div class="log-entry ${ratioClass}">
            <div class="log-time">${timeStr}${durStr}</div>
            <div class="log-subject">
              ${this._escape(log.subject)}
              <span class="topic">/ ${this._escape(log.topic)}</span>
            </div>
            <div class="log-score ${ratioClass}">${log.correct}/${log.total}</div>
          </div>`;
      });
      
      html += `</div>`;
    });
    
    document.getElementById('dailyContent').innerHTML = html;
    document.querySelectorAll('.day-detail-btn[data-date]').forEach(btn => {
      btn.addEventListener('click', () => this._showDayDetails(btn.dataset.date, byDate[btn.dataset.date] || []));
    });
  },

  _ensureParentDetailStyles() {
    if (document.getElementById('parentDetailStyles')) return;
    const style = document.createElement('style');
    style.id = 'parentDetailStyles';
    style.textContent = `
      .day-header{display:flex;align-items:center;justify-content:space-between;gap:12px}
      .day-detail-btn{border:0;background:#fff;color:#1769e0;border-radius:999px;padding:8px 12px;font-weight:800;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.08)}
      .day-detail-modal.hidden{display:none}.day-detail-modal{position:fixed;inset:0;z-index:9999}.day-detail-backdrop{position:absolute;inset:0;background:rgba(15,23,42,.38);backdrop-filter:blur(3px)}
      .day-detail-panel{position:relative;margin:32px auto;background:#fff;border-radius:24px;max-width:920px;max-height:calc(100vh - 64px);overflow:auto;padding:24px;box-shadow:0 20px 60px rgba(15,23,42,.25)}
      .day-detail-title{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}.day-detail-title h2{margin:0}.day-detail-title button{border:0;border-radius:12px;background:#eef4ff;padding:10px 14px;font-weight:900;cursor:pointer}
      .detail-kpi-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.detail-section{margin-top:16px;border:1px solid #dbeafe;border-radius:18px;padding:16px;background:#f8fbff}.rabbit-summary{background:#fff8db;border-color:#fde68a}
      .detail-subject-row{margin:10px 0}.detail-subject-row>div:first-child{display:flex;justify-content:space-between;margin-bottom:6px}.detail-bar{height:12px;background:#eaf2ff;border-radius:999px;overflow:hidden}.detail-bar i{display:block;height:100%;background:#1d72f3;border-radius:999px}
      .speed-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.speed-grid>div{background:#fff;border-radius:14px;padding:14px;text-align:center;border:1px solid #e5efff}.wrong-question-card{background:#fff;border-left:5px solid #ef4444;border-radius:14px;padding:14px;margin:12px 0;line-height:1.65}.wrong-question-head{font-weight:900;color:#b91c1c;margin-bottom:8px}.success-box{background:#ecfdf5;border:1px solid #bbf7d0;border-radius:14px;padding:14px;font-weight:800}
      @media(max-width:760px){.detail-kpi-grid,.speed-grid{grid-template-columns:1fr 1fr}.day-detail-panel{margin:12px;max-height:calc(100vh - 24px);padding:16px}}
    `;
    document.head.appendChild(style);
  },

  _getLocalSessionDetails(name) {
    try {
      const raw = localStorage.getItem('rabbit_parent_session_details');
      const list = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(list)) return [];
      return list.filter(s => !name || String(s.playerName || '').trim().toLowerCase() === String(name).trim().toLowerCase());
    } catch (e) {
      return [];
    }
  },

  _dayKeyFromTime(time) {
    const d = new Date(time);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  _formatSec(sec) {
    sec = Math.max(0, Number(sec || 0));
    if (sec < 60) return sec + ' giây';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return s ? (m + ' phút ' + s + ' giây') : (m + ' phút');
  },

  _showDayDetails(dateKey, dayLogs) {
    this._ensureParentDetailStyles();
    const selectedName = document.getElementById('parentNameSelect') ? document.getElementById('parentNameSelect').value : this.playerName;
    const localSessions = this._getLocalSessionDetails(selectedName).filter(s => this._dayKeyFromTime(s.time) === dateKey);
    const sourceSessions = localSessions.length ? localSessions : (dayLogs || []);

    const totalSessions = sourceSessions.length;
    const totalQ = sourceSessions.reduce((sum, s) => sum + Number(s.total || 0), 0);
    const totalCorrect = sourceSessions.reduce((sum, s) => sum + Number(s.correct || 0), 0);
    const totalSec = sourceSessions.reduce((sum, s) => sum + Number(s.duration || 0), 0);
    const accuracy = totalQ ? Math.round(totalCorrect / totalQ * 100) : 0;
    const avgSec = totalQ ? Math.round(totalSec / totalQ) : 0;

    const subjectMap = {};
    const timeBuckets = { fast: 0, normal: 0, slow: 0 };
    const wrongQuestions = [];

    localSessions.forEach(sess => {
      (sess.details || []).forEach(item => {
        const subject = item.subject || sess.subject || 'Khác';
        subjectMap[subject] = (subjectMap[subject] || 0) + 1;
        const t = Number(item.timeSpentSec || 0);
        if (t <= 10) timeBuckets.fast++;
        else if (t <= 30) timeBuckets.normal++;
        else timeBuckets.slow++;
        if (!item.isCorrect) wrongQuestions.push({ ...item, sessionTime: sess.time });
      });
    });

    if (!localSessions.length) {
      (dayLogs || []).forEach(log => {
        const subject = log.subject || 'Khác';
        subjectMap[subject] = (subjectMap[subject] || 0) + Number(log.total || 0);
      });
    }

    const maxSubject = Math.max(1, ...Object.values(subjectMap));
    const subjectHtml = Object.keys(subjectMap).length
      ? Object.entries(subjectMap).sort((a,b) => b[1]-a[1]).map(([subject, count]) => `
        <div class="detail-subject-row">
          <div><b>${this._escape(subject)}</b><span>${count} câu</span></div>
          <div class="detail-bar"><i style="width:${Math.round(count / maxSubject * 100)}%"></i></div>
        </div>`).join('')
      : '<div class="no-log">Chưa có dữ liệu môn học.</div>';

    const d = new Date(dateKey);
    const dateLabel = d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
    let rabbitText = accuracy >= 95 ? 'Hôm nay bé làm rất tốt, độ chính xác rất cao.' : (accuracy >= 80 ? 'Hôm nay bé học ổn, có một vài câu cần xem lại.' : 'Hôm nay có khá nhiều câu sai, nên xem kỹ lại nội dung bài.');
    const topSubject = Object.entries(subjectMap).sort((a,b) => b[1]-a[1])[0];
    if (topSubject) rabbitText += ' Bé học nhiều nhất là ' + topSubject[0] + '.';
    if (!localSessions.length) rabbitText += ' Lưu ý: chi tiết từng câu chỉ được lưu trên đúng máy/trình duyệt bé đã làm bài, nên ở đây chỉ xem được số liệu tổng quan.';

    const wrongHtml = localSessions.length
      ? (wrongQuestions.length ? wrongQuestions.map((w, i) => `
        <div class="wrong-question-card">
          <div class="wrong-question-head">❌ Câu sai ${i + 1} · ${this._escape(w.subject || '')} / ${this._escape(w.topic || '')}</div>
          <div><b>Câu hỏi:</b> ${this._escape(w.question || '')}</div>
          ${w.image ? `<div><b>Ảnh:</b> ${this._escape(w.image)}</div>` : ''}
          <div><b>Bé chọn:</b> ${this._escape(w.selectedAnswer || '')}</div>
          <div><b>Đáp án đúng:</b> ${this._escape(w.correctAnswer || '')}</div>
          <div><b>Thời gian:</b> ${this._formatSec(w.timeSpentSec || 0)} · <b>ID:</b> <code>${this._escape(w.questionId || '')}</code></div>
        </div>`).join('') : '<div class="success-box">🎉 Trong các lượt đã ghi nhận trên máy này, bé không có câu sai nào ngày này.</div>')
      : '<div class="no-log">Chưa có chi tiết từng câu cho ngày này trên máy/trình duyệt hiện tại. Chi tiết câu sai chỉ hiển thị nếu bé làm bài ngay trên thiết bị này (từ bản cập nhật có lưu chi tiết trở đi).</div>';

    let modal = document.getElementById('dayDetailModal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'dayDetailModal';
      modal.className = 'day-detail-modal hidden';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="day-detail-backdrop" data-close-detail="1"></div>
      <div class="day-detail-panel">
        <div class="day-detail-title">
          <h2>📅 Chi tiết ngày ${dateLabel}</h2>
          <button type="button" data-close-detail="1">✕</button>
        </div>

        <div class="detail-kpi-grid">
          <div class="summary-card"><div class="summary-card-icon">📚</div><div class="summary-card-value">${totalSessions}</div><div class="summary-card-label">Lượt học</div></div>
          <div class="summary-card"><div class="summary-card-icon">⏱️</div><div class="summary-card-value">${this._formatSec(totalSec)}</div><div class="summary-card-label">Thời gian</div></div>
          <div class="summary-card"><div class="summary-card-icon">✅</div><div class="summary-card-value">${totalCorrect}/${totalQ}</div><div class="summary-card-label">Câu đúng</div></div>
          <div class="summary-card"><div class="summary-card-icon">🧠</div><div class="summary-card-value">${avgSec}s</div><div class="summary-card-label">TB/câu</div></div>
        </div>

        <div class="detail-section rabbit-summary"><b>🐰 Rabbit nhận xét:</b><br>${this._escape(rabbitText)}</div>

        <div class="detail-section">
          <h3>📚 Bé học môn nào nhiều?</h3>
          ${subjectHtml}
        </div>

        <div class="detail-section">
          <h3>🧠 Tốc độ làm bài</h3>
          ${localSessions.length ? `
            <div class="speed-grid">
              <div>⚡ Nhanh<br><b>${timeBuckets.fast}</b> câu</div>
              <div>🤔 Bình thường<br><b>${timeBuckets.normal}</b> câu</div>
              <div>🐢 Suy nghĩ lâu<br><b>${timeBuckets.slow}</b> câu</div>
            </div>` : '<div class="no-log">Chưa có dữ liệu thời gian từng câu cho các lượt cũ.</div>'}
        </div>

        <div class="detail-section">
          <h3>🔎 Audit câu sai</h3>
          ${wrongHtml}
        </div>
      </div>`;

    modal.classList.remove('hidden');
    modal.querySelectorAll('[data-close-detail="1"]').forEach(el => {
      el.addEventListener('click', () => modal.classList.add('hidden'));
    });
  },

  _bindEvents() {
    const ni = document.getElementById('nameInput');
    const bs = document.getElementById('btnStart');
    
    ni.addEventListener('input', () => {
      bs.disabled = ni.value.trim().length < 2;
    });

    bs.addEventListener('click', () => this._register());

    ni.addEventListener('keypress', e => {
      if (e.key === 'Enter' && !bs.disabled) this._register();
    });

    // Leaderboard grade tabs
    document.querySelectorAll('.lb-grade-tab[data-grade]').forEach(tab => {
      tab.addEventListener('click', () => this.loadLeaderboard(tab.dataset.grade));
    });

    const openDragonShop = document.getElementById('btnOpenDragonShop');
    if (openDragonShop) openDragonShop.addEventListener('click', () => this.showScreen('shop'));

    const collectionShop = document.getElementById('btnCollectionShop');
    if (collectionShop) collectionShop.addEventListener('click', () => this.showScreen('shop'));

    // MỚI: Grade selector
    document.querySelectorAll('.grade-card[data-grade]').forEach(card => {
      card.addEventListener('click', () => this._chooseGrade(card.dataset.grade));
    });

    document.getElementById('btnFeedback').addEventListener('click', () => {
      window.open('https://forms.gle/hE3gV5Uy6UodzrZn7');
    });

    document.getElementById('btnRedeemBadge').addEventListener('click', () => {
      Rewards.redeemBadge();
    });

    const btnRedeemBadgeShop = document.getElementById('btnRedeemBadgeShop');
    if (btnRedeemBadgeShop) {
      btnRedeemBadgeShop.addEventListener('click', () => Rewards.redeemBadge());
    }

    document.querySelectorAll('.shop-btn-mini[data-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        Rewards.buyItem(btn.dataset.item, parseInt(btn.dataset.cost));
      });
    });

    document.getElementById('btnNext').addEventListener('click', () => Quiz.next());

    document.getElementById('btnContinue').addEventListener('click', () => {
      this.showScreen('subject');
      Rewards.updateUI();
    });

    document.querySelectorAll('.btn-nav[data-screen]').forEach(btn => {
      btn.addEventListener('click', () => this.showScreen(btn.dataset.screen));
    });

    document.querySelectorAll('.mini-tab[data-mini]').forEach(tab => {
      tab.addEventListener('click', () => this._switchMiniTab(tab.dataset.mini));
    });

    document.getElementById('footerParent').addEventListener('click', e => {
      e.preventDefault();
      this._openParentArea();
    });

    document.getElementById('btnPinSubmit').addEventListener('click', () => this._checkPin());
    document.getElementById('btnPinBack').addEventListener('click', () => {
      this.showScreen(this.playerName ? 'subject' : 'register');
    });
    
    document.getElementById('pinInput').addEventListener('keypress', e => {
      if (e.key === 'Enter') this._checkPin();
    });

    document.getElementById('btnChangePin').addEventListener('click', () => this._changePin());
    document.getElementById('parentNameSelect').addEventListener('change', e => {
      this._loadParentLog(e.target.value);
    });

    const aboutLink = document.getElementById('footerAbout');
    if (aboutLink) {
      aboutLink.addEventListener('click', (e) => {
        e.preventDefault();
        alert(
          '🐰 KHO BÀI TẬP\n\n' +
          'Trang web ôn tập kiến thức tiểu học, làm bởi 1 phụ huynh ' +
          'với tình yêu dành cho con gái Anh Thư.\n\n' +
          'Mục đích: Giúp các bé học vui, ba mẹ đỡ vất vả tìm bài tập.\n\n' +
          'Miễn phí cho mọi người. Mọi góp ý đều quý giá!\n\n' +
          '💖 Cảm ơn bạn đã ghé thăm.'
        );
      });
    }
  },

  _escape(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
};

document.addEventListener('DOMContentLoaded', () => App.init());
