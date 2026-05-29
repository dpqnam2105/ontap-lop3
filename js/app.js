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
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const id = 'screen' + name.charAt(0).toUpperCase() + name.slice(1);
    const screen = document.getElementById(id);
    if (!screen) { console.warn('Screen not found:', id); return; }
    screen.classList.add('active');
    if (name === 'register' || name === 'subject') this._renderHomeWidgets();
    if (name === 'shop') this._renderDragonShop();
    if (name === 'collection') this._renderCollection();
    if (name === 'knowledge') this._renderKnowledgeMap();
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
    
    // MỚI: Sau khi đăng ký → vào màn chọn lớp
    this.showScreen('grade');
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
    this.allData.subjects.forEach((s, i) => {
      const card = document.createElement('div');
      card.className = 'sub-card';
      card.innerHTML = `
        <div class="sub-icon">${s.icon}</div>
        <div class="sub-info">
          <div class="sub-name">${this._escape(s.name)}</div>
          <div class="sub-meta">${s.topics.length} chủ đề ôn tập</div>
        </div>`;
      card.addEventListener('click', () => this._chooseSubject(i));
      el.appendChild(card);
    });
  },

  _chooseSubject(idx) {
    const s = this.allData.subjects[idx];
    document.getElementById('topicMenuTitle').textContent = s.name;

    const list = document.getElementById('topicList');
    list.innerHTML = '';

    s.topics.forEach((t) => {
      const card = document.createElement('div');
      card.className = 'topic-card topic-card-with-modes';
      card.innerHTML = `
        <div class="topic-card-main">
          <div class="topic-icon">${t.icon}</div>
          <div>
            <div class="topic-name">${this._escape(t.name)}</div>
            <div class="topic-subline">${(t.questions || []).length} câu · chọn chế độ học</div>
          </div>
        </div>
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

      card.addEventListener('click', () => Quiz.start(t, s.name, { mode: 'practice', subjectId: s.id }));
      list.appendChild(card);
    });

    this.showScreen('topic');
  },


  // KNOWLEDGE MAP
  _knowledgeMapData() {
    return {
      'toan': {
        title: 'Hành Trình Chinh Phục Vương Quốc Toán',
        intro: 'Mỗi nhóm là một kỹ năng quan trọng của Toán lớp 2.',
        overall: '56%',
        items: [
          ['🔢','Đọc viết số',['Đếm, đọc, viết số','So sánh số','Số chẵn, số lẻ'],90,'Đã vững','#16a34a',['đọc viết số','số học','số']],
          ['➕','Phép cộng',['Cộng trong phạm vi 100','Cộng có nhớ','Cộng nhẩm'],75,'Đang tốt','#22c55e',['phép cộng','cộng']],
          ['➖','Phép trừ',['Trừ trong phạm vi 100','Trừ có nhớ','Trừ nhẩm'],70,'Đang tốt','#14b8a6',['phép trừ','trừ']],
          ['✖️','Bảng nhân',['Bảng nhân 2, 3, 4, 5','Nhân trong phạm vi 100','Nhân nhẩm'],60,'Cần cố gắng','#a855f7',['bảng nhân','nhân']],
          ['➗','Bảng chia',['Bảng chia 2, 3, 4, 5','Chia trong phạm vi 100','Chia nhẩm'],58,'Cần cố gắng','#8b5cf6',['bảng chia','chia']],
          ['📏','Đơn vị đo',['Độ dài: cm, m','Khối lượng: kg, g','Dung tích: l, ml'],70,'Đang tốt','#0ea5e9',['đơn vị đo','đo lường','độ dài','khối lượng']],
          ['🔷','Hình học',['Hình vuông, chữ nhật','Hình tam giác, hình tròn','Đường thẳng, đường cong'],50,'Đang học','#f97316',['hình học','hình']],
          ['📝','Toán lời văn',['Tìm hiểu bài toán','Chọn phép tính','Trả lời và kiểm tra'],55,'Cần cố gắng','#ef4444',['toán lời văn','lời văn','giải toán']],
          ['🧩','Tư duy & dãy số',['Tìm quy luật','Điền số còn thiếu','Rèn luyện tư duy'],40,'Đang học','#84cc16',['tư duy','dãy số','quy luật']]
        ]
      },
      'tieng-viet': {
        title: 'Hành Trình Nhà Văn Nhí',
        intro: 'Cùng bé đọc hay, viết đúng, nói tốt và yêu Tiếng Việt.',
        overall: '48%',
        items: [
          ['📚','Đọc hiểu',['Đọc đúng, trôi chảy','Hiểu nội dung','Trả lời câu hỏi'],85,'Đã vững','#16a34a',['đọc hiểu']],
          ['✏️','Chính tả',['Nghe - viết','Nhìn - viết','Viết đúng chính tả'],70,'Đang tốt','#22c55e',['chính tả']],
          ['💬','Từ và câu',['Từ chỉ sự vật','Từ chỉ hoạt động','Câu giới thiệu'],65,'Đang học','#f59e0b',['từ và câu','luyện từ']],
          ['❗','Dấu câu',['Dấu chấm, dấu phẩy','Dấu hỏi, dấu than','Ngắt câu hợp lý'],60,'Cần cố gắng','#f97316',['dấu câu']],
          ['🌱','Luyện từ và câu',['Mở rộng vốn từ','Từ trái nghĩa','Từ theo chủ điểm'],45,'Đang học','#10b981',['luyện từ','vốn từ']],
          ['🧾','Tập làm văn',['Viết câu','Viết đoạn ngắn','Viết lời giới thiệu'],50,'Đang học','#0ea5e9',['tập làm văn','viết văn']],
          ['📖','Kể chuyện',['Kể lại câu chuyện','Kể theo tranh','Nêu ý nghĩa câu chuyện'],40,'Cần cố gắng','#8b5cf6',['kể chuyện']],
          ['🏆','Ôn tập tổng hợp',['Ôn đọc hiểu','Ôn chính tả','Ôn tập làm văn'],0,'Chưa bắt đầu','#94a3b8',['ôn tập']]
        ]
      },
      'tieng-anh': {
        title: 'Cuộc Phiêu Lưu Mở Cánh Cửa Thế Giới',
        intro: 'Cùng Rabbit học từ vựng, mẫu câu và giao tiếp Tiếng Anh thật vui.',
        overall: '42%',
        items: [
          ['👨‍👩‍👧','Family',['father, mother','brother, sister','grandpa, grandma'],90,'Đã vững','#16a34a',['family','gia đình']],
          ['🏫','School',['book, pen, pencil','ruler, eraser, bag','This is my...'],70,'Đang tốt','#22c55e',['school','trường học']],
          ['🐶','Animals',['cat, dog, bird','rabbit, fish, elephant','What is it?'],75,'Đang tốt','#0ea5e9',['animals','con vật']],
          ['🎨','Colors',['red, blue, green','yellow, pink, purple','What color is it?'],66,'Đang học','#f59e0b',['colors','màu sắc']],
          ['🔢','Numbers',['Numbers 1 - 100','How many?','Let\'s count!'],70,'Đang tốt','#8b5cf6',['numbers','số đếm']],
          ['🏃','Daily Activities',['get up, go to school','eat, drink, play','I can ...'],60,'Cần cố gắng','#f97316',['daily','activities','hoạt động']],
          ['🗣️','Communication',['Hello!','How are you?','My name is...'],35,'Cần luyện thêm','#ef4444',['communication','giao tiếp']],
          ['🌎','Listening & Reading',['Nghe từ đơn giản','Đọc câu ngắn','Hiểu nội dung cơ bản'],0,'Chưa bắt đầu','#94a3b8',['listening','reading','nghe','đọc']]
        ]
      }
    };
  },

  _renderKnowledgeMap(subjectId) {
    const data = this._knowledgeMapData();
    const selected = subjectId || this._activeKnowledgeSubject() || 'toan';
    const d = data[selected] || data.toan;
    const title = document.getElementById('kmTitle');
    const intro = document.getElementById('kmIntro');
    const overall = document.getElementById('kmOverall');
    const grid = document.getElementById('knowledgeGrid');
    if (!grid || !title || !intro || !overall) return;

    title.textContent = d.title;
    intro.textContent = d.intro;
    overall.textContent = d.overall;

    document.querySelectorAll('.km-tab[data-km-subject]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.kmSubject === selected);
      btn.onclick = () => this._renderKnowledgeMap(btn.dataset.kmSubject);
    });

    grid.innerHTML = d.items.map((item, idx) => {
      const locked = item[3] === 0;
      return `<article class="km-card ${locked ? 'km-locked' : ''}" style="color:${item[5]}" data-km-sub="${selected}" data-km-idx="${idx}">
        <div class="km-card-top">
          <div class="km-icon" style="background:${item[5]}">${item[0]}</div>
          <div><h3>${this._escape(item[1])}</h3><p>${locked ? 'Đang chuẩn bị' : '📚 Nhóm kỹ năng'}</p></div>
        </div>
        <ul>${item[2].map(x => `<li>${this._escape(x)}</li>`).join('')}</ul>
        <div class="km-progress"><div class="km-bar" style="width:${item[3]}%;background:${item[5]}"></div></div>
        <div class="km-status"><span>${item[3]}%</span><span>${this._escape(item[4])}</span></div>
      </article>`;
    }).join('');

    grid.querySelectorAll('.km-card').forEach(card => {
      card.addEventListener('click', () => this._openKnowledgeTopic(card.dataset.kmSub, Number(card.dataset.kmIdx)));
    });
  },

  _activeKnowledgeSubject() {
    const active = document.querySelector('.km-tab.active[data-km-subject]');
    return active ? active.dataset.kmSubject : 'toan';
  },

  _openKnowledgeTopic(kmSubject, idx) {
    const kmData = this._knowledgeMapData();
    const item = kmData[kmSubject] && kmData[kmSubject].items[idx];
    if (!item || item[3] === 0) {
      alert('Phần này đang được chuẩn bị. Bé học các phần khác trước nhé! 🐰');
      return;
    }
    if (!this.allData || !Array.isArray(this.allData.subjects)) {
      alert('Dữ liệu bài tập đang tải. Thử lại sau vài giây nhé!');
      return;
    }

    const subject = this._findKnowledgeSubject(kmSubject);
    if (!subject) {
      alert('Chưa tìm thấy môn học tương ứng trong kho câu hỏi.');
      return;
    }

    const topic = this._findKnowledgeTopic(subject, item[6]);
    if (topic) {
      Quiz.start(topic, subject.name, { mode: 'practice', subjectId: subject.id });
      return;
    }

    this._chooseSubject(this.allData.subjects.indexOf(subject));
  },

  _findKnowledgeSubject(kmSubject) {
    const aliases = {
      'toan': ['toan','toán','math'],
      'tieng-viet': ['tieng viet','tiếng việt','vietnamese'],
      'tieng-anh': ['tieng anh','tiếng anh','english']
    }[kmSubject] || [];
    return (this.allData.subjects || []).find(s => {
      const hay = ((s.id || '') + ' ' + (s.name || '')).toLowerCase();
      return aliases.some(a => hay.includes(a));
    });
  },

  _findKnowledgeTopic(subject, keywords) {
    const keys = (keywords || []).map(k => this._normalizeText(k));
    return (subject.topics || []).find(t => {
      const hay = this._normalizeText((t.id || '') + ' ' + (t.name || ''));
      return keys.some(k => hay.includes(k) || k.includes(hay));
    });
  },

  _normalizeText(s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd');
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
