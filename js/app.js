// =============================================
// APP.JS v6 - tách module ParentDashboard + DragonBall
// =============================================

const App = {
  allData: null,
  playerName: '',
  currentGrade: 'lop3', // lớp mặc định; nhớ lớp bé chọn lần trước (lastGrade)

  // Các lớp đã mở. Thêm 'lop4' vào đây khi có dữ liệu.
  OPEN_GRADES: ['lop2', 'lop3'],
  _dataByGrade: {},

  PIN_KEY: 'khoBaiTap_parentPin',
  DEFAULT_PIN: '',
  leaderboardGrade: 'lop2',

  // Dragon Ball keys giữ lại để các module con truy cập qua App
  DRAGONBALL_KEY: 'rabbit_dragonball_collection',
  DRAGON_REWARD_KEY: 'rabbit_shenron_unlocked',

  async init() {
    this._bindEvents();
    this._restoreSession();
    this._syncGradeUI();
    this.loadLeaderboard(this.currentGrade);
    DragonBall._renderHomeWidgets();
    await this._loadData();
    DragonBall._renderHomeWidgets();
    if (window.Today) Today.render();
    if (window.Cloud) Cloud.init();
    if (window.Speak) Speak.init();
    if (window.Decor) Decor.init();
    if (window.Achieve) Achieve.init();
  },

  _restoreSession() {
    const data = Storage.load();
    if (data.playerName) {
      this.playerName = data.playerName;
      document.getElementById('nameInput').value = data.playerName;
      document.getElementById('btnStart').disabled = false;
    }
    if (data.lastGrade && this.OPEN_GRADES.includes(data.lastGrade)) this.currentGrade = data.lastGrade;
    this._applyGradeLabel(this.currentGrade);
  },

  /** Đồng bộ các chỗ hiển thị lớp (thẻ chọn lớp, tiêu đề màn môn) với lớp đang học. */
  _syncGradeUI() {
    const names = { lop2: 'Lớp 2', lop3: 'Lớp 3', lop4: 'Lớp 4', lop5: 'Lớp 5' };
    document.querySelectorAll('.grade-card[data-grade]').forEach(c => c.classList.toggle('grade-active', c.dataset.grade === this.currentGrade));
    const lbl = document.getElementById('currentGradeLabel');
    if (lbl) lbl.textContent = '📚 ' + (names[this.currentGrade] || '') + ' - Học gì hôm nay?';
  },

  /** "Vào học": đi thẳng vào lớp đang học, không bắt chọn lại lớp. */
  goLearn() {
    if (!this.playerName) { this.showScreen('grade'); return; }
    this._chooseGrade(this.currentGrade);
  },

  _applyGradeLabel(gradeId) {
    const names = { lop2: 'Lớp 2', lop3: 'Lớp 3', lop4: 'Lớp 4', lop5: 'Lớp 5' };
    const el = document.querySelector('.brand-grade');
    if (el) el.textContent = names[gradeId] || 'Tiểu học';
  },

  _maskName(name) {
    const clean = Storage.normalizeName(name);
    const parts = clean.split(' ').filter(Boolean);
    if (!parts.length) return 'Bạn';
    if (parts.length === 1) return parts[0].charAt(0) + '.';
    return parts.slice(0, -1).join(' ') + ' ' + parts[parts.length - 1].charAt(0) + '.';
  },

  _mergeLeaderboard(rows) {
    const map = new Map();
    (rows || []).forEach(p => {
      const key = Storage.canonName(p.name || '');
      if (!key) return;
      const prev = map.get(key) || { name: Storage.normalizeName(p.name), totalScore: 0, totalGames: 0 };
      prev.totalScore += Number(p.totalScore || 0);
      prev.totalGames += Number(p.totalGames || 0);
      prev.name = Storage.normalizeName(p.name) || prev.name;
      map.set(key, prev);
    });
    return Array.from(map.values()).sort((a, b) => b.totalScore - a.totalScore);
  },

  async _loadData() {
    const g = this.currentGrade;
    this.allData = await API.getAllData(g);

    // BUG #5 FIX: normalize question bank để engine hoạt động đúng
    if (this.allData && window.LearningEngine && window.LearningEngine.normalizeQuestionBank) {
      try {
        this.allData = window.LearningEngine.normalizeQuestionBank(this.allData);
        console.log('✅ LearningEngine normalized:', window.LearningEngine.ENGINE_VERSION);
      } catch (e) {
        console.warn('LearningEngine.normalizeQuestionBank failed:', e);
      }
    }

    this._dataByGrade[g] = this.allData;

    if (this.playerName && this.allData) this._renderSubjects();
    if (this.playerName) this._showWelcome(this.playerName);
    DragonBall._renderHomeWidgets();
    // Lam tuoi toan bo UI thuong (sao, tui do, gian sticker) ngay khi tai trang.
    if (window.Rewards && Rewards.updateUI) Rewards.updateUI();
  },

  async loadLeaderboard(gradeId = 'lop2') {
    const lbDiv = document.getElementById('lbList');
    if (!lbDiv) return;
    this.leaderboardGrade = gradeId;
    document.querySelectorAll('.lb-grade-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.grade === gradeId);
    });

    // Một bảng chung cho mọi lớp; nhãn lớp đặt cạnh tên bé.
    const tabs = document.getElementById('lbGradeTabs');
    if (tabs) tabs.classList.add('hidden');

    lbDiv.innerHTML = '<div class="loading-text">Đang tải xếp hạng...</div>';
    const data = await API.getLeaderboard();

    if (!data || data.length === 0) {
      lbDiv.innerHTML = '<div class="loading-text">Chưa có điểm nào. Hãy là người đầu tiên! 🚀</div>';
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const rows = this._mergeLeaderboard(data).slice(0, 5).map((p, i) => {
      const icon = medals[i] || (i + 1);
      const g = API.gradeOf ? API.gradeOf(p.name) : null;
      const tag = g ? `<span class="lb-grade lb-grade-${g}">Lớp ${g}</span>` : '';
      return `<tr><td class="lb-rank">${icon}</td><td class="lb-name">${tag}<b>${this._escape(p.name)}</b></td><td class="lb-score"><b>${p.totalScore} ⭐</b></td></tr>`;
    }).join('');

    lbDiv.innerHTML = `<table class="lb-table">${rows}</table>`;
  },

  showScreen(name) {
    if (window.PetView) PetView.stop();
    if (window.Speak) Speak.stop();
    if (name !== 'quiz' && window.Quiz && Quiz._stopSpeedTimer) Quiz._stopSpeedTimer();
    if (name === 'register' && window.Achieve) Achieve.renderTicker();
    // Cần có tên trước khi vào khu học (grade/subject/topic). Nếu chưa, đưa về Trang chủ.
    const needsName = (name === 'grade' || name === 'subject' || name === 'topic' || name === 'arena' || name === 'pet');
    if (needsName && !this.playerName) {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById('screenRegister').classList.add('active');
      DragonBall._renderHomeWidgets();
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
    if (name === 'pet' && window.PetView) PetView.open();
    // Trang chủ có lời chào riêng → ẩn tiêu đề chung "Kho Bài Tập" (xem style.css: body.on-home.home-today)
    document.body.classList.toggle('on-home', name === 'register');
    const learnScreens = ['grade', 'subject', 'topic', 'quiz', 'result'];
    document.querySelectorAll('.side-rail .btn-nav').forEach(b => {
      const sc = b.dataset.screen;
      const fromArena = window.Quiz && Quiz.backScreen === 'arena' && (name === 'quiz' || name === 'result');
      b.classList.toggle('nav-active', fromArena ? sc === 'arena' : (sc === name || (sc === 'learn' && learnScreens.includes(name))));
    });
    if (name === 'register' || name === 'subject') DragonBall._renderHomeWidgets();
    if (name === 'register' && window.Today) Today.render();
    if (name === 'shop') {
      // Reset bo loc ve "Tat ca" moi lan VAO man Shop, vi trinh duyet co the
      // giu lai gia tri dropdown cu qua F5, khien pack bi loc mat hoan toan.
      const shopFilterEl = document.getElementById('shopFilter');
      if (shopFilterEl) shopFilterEl.value = 'all';
      DragonBall._renderDragonShop();
      if (window.Rewards && Rewards.renderShop) Rewards.renderShop();
      if (window.Rewards && Rewards.updateUI) Rewards.updateUI();
    }
    if (name === 'arena' && window.Arena) Arena.render();
    if (name === 'collection') {
      if (window.Arena) Arena.renderCollection();
      DragonBall._renderCollection();
      if (window.Rewards && Rewards.renderCollection) Rewards.renderCollection();
      if (window.Decor) Decor.renderCollection();
    }
    if (window.Arena) Arena.renderChip();
    window.scrollTo(0, 0);
  },

  _register() {
    const name = Storage.normalizeName(document.getElementById('nameInput').value);
    if (name.length < 2) return;

    const data = Storage.switchPlayer(name);
    this.playerName = data.playerName || name;
    document.getElementById('nameInput').value = this.playerName;

    document.getElementById('subName').textContent = 'Chào ' + this.playerName + '!';
    Rewards.updateUI();
    DragonBall._renderHomeWidgets();
    this._showWelcome(this.playerName);

    // Lưu tên xong → ở lại Trang chủ (sảnh chờ). Bé bấm "Vào học" ở menu để bắt đầu học.
    this.showScreen('register');
    this._achievementName(this.playerName);
    if (window.Cloud) Cloud.sync(this.playerName);
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

  /** Nạp (và nhớ) dữ liệu của 1 lớp */
  async _loadGradeData(gradeId) {
    if (this._dataByGrade[gradeId]) return this._dataByGrade[gradeId];
    let data = await API.getAllData(gradeId);
    if (data && window.LearningEngine && window.LearningEngine.normalizeQuestionBank) {
      try {
        data = window.LearningEngine.normalizeQuestionBank(data);
      } catch (e) {
        console.warn('normalizeQuestionBank failed cho ' + gradeId + ':', e);
      }
    }
    this._dataByGrade[gradeId] = data;
    return data;
  },

  /** Xử lý khi bấm chọn lớp */
  async _chooseGrade(gradeId) {
    const gradeNames = {
      'lop2': 'Lớp 2',
      'lop3': 'Lớp 3',
      'lop4': 'Lớp 4',
      'lop5': 'Lớp 5'
    };

    const gradeName = gradeNames[gradeId] || 'Lớp ?';

    // Lớp chưa mở → thông báo nghỉ hè
    if (this.OPEN_GRADES.indexOf(gradeId) === -1) {
      alert(
        '🌴 ' + gradeName + ' đang nghỉ hè!\n\n' +
        'Thầy cô giáo đang chuẩn bị bài tập cho ' + gradeName + '.\n' +
        'Hẹn gặp con sau nhé! 🐰'
      );
      return;
    }

    this.currentGrade = gradeId;
    Storage.set('lastGrade', gradeId);
    this._applyGradeLabel(gradeId);
    this._syncGradeUI();
    document.getElementById('currentGradeLabel').textContent = '📚 ' + gradeName + ' - Học gì hôm nay?';
    this.showScreen('subject');

    const listEl = document.getElementById('subjectList');
    const cached = this._dataByGrade[gradeId];
    if (cached) {
      this.allData = cached;
      this._renderSubjects();
      return;
    }

    listEl.innerHTML = '<div class="loading-text">Đang tải bài tập... ⏳</div>';
    const data = await this._loadGradeData(gradeId);

    // Bé đã bấm sang lớp khác trong lúc đang tải → bỏ qua kết quả cũ
    if (this.currentGrade !== gradeId) return;

    if (!data || !data.subjects || !data.subjects.length) {
      listEl.innerHTML =
        '<div class="loading-text">Chưa có bài tập cho ' + gradeName + ' con nhé 🐰</div>';
      return;
    }

    this.allData = data;
    this._renderSubjects();
  },

  _renderSubjects() {
    const el = document.getElementById('subjectList');
    el.innerHTML = '';

    // Banner "On cau sai": hien khi co cau sai chua sua trong wrong-history.
    try {
      if (window.Storage && Storage.getUnresolvedWrong && window.Quiz && Quiz.startWrongReview) {
        const pending = Storage.getUnresolvedWrong(40);
        if (pending.length > 0) {
          const bar = document.createElement('div');
          bar.className = 'wrong-review-bar';
          bar.innerHTML = `
            <span class="wrb-icon">🔁</span>
            <span class="wrb-text">
              <b>Ôn lại câu con hay sai</b>
              <small>${pending.length} câu đang chờ con chinh phục lại</small>
            </span>
            <span class="wrb-cta">Ôn ngay ▶</span>`;
          bar.addEventListener('click', () => Quiz.startWrongReview());
          el.appendChild(bar);
        }
      }
    } catch (e) { /* khong co du lieu thi bo qua */ }

    // Cac mon that (co du lieu) -- anh banner + overlay HTML (ten, tien do, nut vao hoc).
    this.allData.subjects.forEach((s, i) => {
      const visTopics = this._visibleTopics(s);
      const stSet = this.getStageSetting(s);
      const stageTag = stSet ? ' · ' + ((s.stages.find(x => x.id === stSet.stage) || {}).short || '') : '';
      // Tien do hom nay: so chu de da luyen it nhat 1 cau / tong so chu de.
      let doneToday = 0;
      try {
        if (window.Storage && Storage.getTopicProgress) {
          visTopics.forEach(t => {
            const p = Storage.getTopicProgress((t.id || t.name).toString());
            if (p && (p.learned || []).length > 0) doneToday++;
          });
        }
      } catch (e) { /* chua co tien do thi de 0 */ }
      const progChip = doneToday > 0
        ? `<span class="sub-ov-chip sub-ov-chip-done">⭐ Hôm nay: ${doneToday}/${visTopics.length}</span>`
        : `<span class="sub-ov-chip">🚀 Bắt đầu nào!</span>`;

      // Banner mon hoc: uu tien cau truc moi images/subjects/*.webp,
      // chua co thi lui ve anh cu images/subject-{id}.png, lui nua thi fallback card.
      const BANNER_MAP = { 'toan': 'math', 'tieng-viet': 'vietnamese', 'tieng-anh': 'english', 'toan-tieng-anh': 'math-english' };
      const slug = BANNER_MAP[s.id] || s.id;
      const webpSrc = `images/subjects/${slug}-banner.webp`;
      const pngSrc = `images/subjects/${slug}-banner.png`;
      const oldSrc = `images/subject-${s.id}.png`;

      const card = document.createElement('div');
      card.className = 'sub-card sub-card-img';
      card.innerHTML = `
        <img class="sub-banner" src="${webpSrc}" alt="${this._escape(s.name)}"
             onerror="if(!this.dataset.fb){this.dataset.fb='1';this.src='${pngSrc}';}else if(this.dataset.fb==='1'){this.dataset.fb='2';this.src='${oldSrc}';}else{this.style.display='none';this.parentElement.classList.add('sub-card-noimg');}">
        <div class="sub-overlay">
          <div class="sub-ov-icon">${s.icon}</div>
          <div class="sub-ov-text">
            <div class="sub-ov-name">${this._escape(s.name)}</div>
            <div class="sub-ov-meta">${visTopics.length} chủ đề ôn tập${stageTag}</div>
          </div>
          <div class="sub-ov-right">
            ${progChip}
            <span class="sub-ov-cta">Vào học ▶</span>
          </div>
        </div>
        <div class="sub-card-fallback">
          <div class="sub-icon">${s.icon}</div>
          <div class="sub-info">
            <div class="sub-name">${this._escape(s.name)}</div>
            <div class="sub-meta">${visTopics.length} chủ đề ôn tập${stageTag}</div>
          </div>
        </div>`;
      card.addEventListener('click', () => this._chooseSubject(i));
      el.appendChild(card);
    });

  },

  // Mô tả kỹ năng ngắn cho từng chủ đề (hiện trên card). Khớp theo id chủ đề trong questions.json.
  TOPIC_DESC: {
    // Toan -- topic cu
    toan_so: 'Dem, doc, viet so · So sanh so · So chan, so le',
    toan_cong: 'Cong trong pham vi 100 · Cong co nho · Cong nham',
    toan_g13: 'Đọc, viết, so sánh số đến 1000 · Cộng trừ có nhớ · Tìm số chưa biết · Bài toán một bước',
    toan_tru: 'Tru trong pham vi 100 · Tru co nho · Tru nham',
    toan_nhan: 'Bang nhan 2-5 · Nhan & chia tong hop SGK · Nhan nham',
    toan_chia: 'Bang chia 2-5 · Chia trong pham vi 100 · Chia nham',
    toan_dovi: 'Do dai (cm, m, km) · Khoi luong (kg, g) · Do do dai SGK',
    toan_hinh: 'Hinh vuong, chu nhat · Tam giac, hinh tron · Hinh hoc SGK',
    toan_loivan: 'Tim hieu de bai · Chon phep tinh · Bai toan co loi van SGK',
    toan_tuyduy: 'Tim quy luat · Dien so con thieu · Ren luyen tu duy',
    // Toan -- topic moi SGK bo sung
    toan_tien_viet_nam_sgk: 'Nhan biet tien · Doi tien · Tinh tien khi mua ban',
    toan_thoi_gian_sgk: 'Xem dong ho · Gio, phut · Cac buoi trong ngay',
    toan_thong_ke_xac_suat_sgk: 'Doc bang so lieu · Bieu do · Kha nang xay ra',
    // Tieng Viet
    tv_chinh: 'Nghe - viet · Nhin - viet · Viet dung chinh ta',
    tv_tuvung: 'Mo rong von tu · Tu theo chu diem · Tu trai nghia',
    tv_ngu: 'Tu chi su vat, hoat dong · Cau gioi thieu · Dau cau',
    tv_tutu: 'So sanh · Nhan hoa · Bien phap tu tu co ban',
    tv_dochieu: 'Doc dung, troi chay · Hieu noi dung · Tra loi cau hoi',
    tv_hsg: 'Bai nang cao · Cam thu van hoc · Luyen thi hoc sinh gioi',
    // Tieng Anh -- topic moi theo NIK/Cambridge
    en_school_days: 'School objects · Classroom · Daily routine',
    en_wild_animals: 'Wild animals · Habitats · What can it do?',
    en_weather: 'Weather · Seasons · What is the weather like?',
    en_big_cities: 'Cities · Places · Directions',
    en_celebrate: 'Festivals · Birthday · Special days',
    en_jobs: 'Jobs · What do you do? · Workplaces',
    en_sports: 'Sports · I can / cannot · Play & do',
    en_feel_good: 'Feelings · How do you feel? · Body parts',
    en_different: 'Opposites · Comparatives · Superlatives',
    en_solve_problems: 'Problems · Solutions · Think and act',
    en_outdoors: 'Nature · Outdoor activities · Environment',
    // Tieng Anh -- id cu giu lai fallback
    en_vocab: 'Family, School · Animals, Colors · Food, Toys, Clothes',
    en_numbers: 'Numbers 1-100 · Telling the time · Days & months',
    en_gram: 'This / That · He / She / They · I can ...',
    en_sent: 'Doc cau ngan · Hieu doan van · Tra loi cau hoi',
    en_start: 'On tap tong hop · Listening & Reading · Tu tin thi thu',
    // Toan Tieng Anh
    maen_numbers: 'Numbers & Counting · Compare · Number sequences',
    maen_add_sub: 'Addition & Subtraction · Missing numbers · True/False',
    maen_mul_div: 'Multiplication & Division tables 2-5 · Word problems',
    maen_measurement: 'cm/dm · kg/g · Litres · Convert units',
    maen_time_money: 'Clock reading · Calendar · Vietnamese Dong',
    maen_shapes: 'Shapes · Perimeter · Count triangles & quadrilaterals',
    maen_word_problems: 'Violympic style · 1-2-3 step problems',
  },

  // ─── Giai đoạn học (chia kiến thức theo học kì / giai đoạn) ─────────
  // Môn có "stages" trong index.json thì mỗi câu hỏi mang trường "stage".
  // Bé chọn "học đến giai đoạn X" (cộng dồn) hoặc "chỉ giai đoạn X".
  // Cài đặt lưu riêng theo từng bé, theo lớp + môn.
  STAGE_STORE_KEY: 'stageBySubject',

  _stageKey(s) { return this.currentGrade + ':' + s.id; },

  getStageSetting(s) {
    if (!s || !Array.isArray(s.stages) || !s.stages.length) return null;
    let all = {};
    try { all = Storage.get(this.STAGE_STORE_KEY) || {}; } catch (e) { all = {}; }
    const saved = all[this._stageKey(s)];
    const ids = s.stages.map(x => x.id);
    const stage = saved && ids.includes(saved.stage) ? saved.stage : (s.defaultStage || ids[0]);
    return { stage, only: !!(saved && saved.only), chosen: !!saved };
  },

  setStageSetting(s, stage, only) {
    let all = {};
    try { all = Storage.get(this.STAGE_STORE_KEY) || {}; } catch (e) { all = {}; }
    all[this._stageKey(s)] = { stage, only: !!only };
    Storage.set(this.STAGE_STORE_KEY, all);
  },

  // ─── Mốc bài đã học (theo môn + bộ sách + tập sách) ─────────
  // Chỉ lọc câu có trường lesson cùng bộ sách. Chưa chọn mốc → giữ nguyên hành vi theo giai đoạn.
  LESSON_STORE_KEY: 'lessonBySubject',

  getLessonSetting(s) {
    const lb = s && s.lessonBook;
    if (!lb || !Array.isArray(lb.titles)) return null;
    let all = {};
    try { all = Storage.get(this.LESSON_STORE_KEY) || {}; } catch (e) { all = {}; }
    const v = all[this._stageKey(s)];
    if (!v || v.book !== lb.book || v.vol !== lb.vol || !Number.isInteger(v.no) || v.no < 1 || v.no > lb.titles.length) return null;
    return { book: v.book, vol: v.vol, no: v.no };
  },

  setLessonSetting(s, no) {
    const lb = s && s.lessonBook;
    if (!lb) return;
    let all = {};
    try { all = Storage.get(this.LESSON_STORE_KEY) || {}; } catch (e) { all = {}; }
    const k = this._stageKey(s);
    if (Number.isInteger(no) && no >= 1 && no <= lb.titles.length) all[k] = { book: lb.book, vol: lb.vol, no };
    else delete all[k];
    Storage.set(this.LESSON_STORE_KEY, all);
  },

  /** Câu có mốc bài (cùng bộ sách) vượt bài đã học → ẩn. Câu không có mốc bài: không bị lọc. */
  _lessonOk(q, ls) {
    const l = q && q.lesson;
    if (!ls || !l || l.book !== ls.book) return true;
    if (l.vol !== ls.vol) return l.vol < ls.vol;
    return l.no <= ls.no;
  },

  // ─── Chia theo giáo trình (môn có "books" trong index.json — hiện là Tiếng Anh) ─────────
  // Mỗi chủ đề mang t.book; sách có scope "lesson" lọc câu theo q.bookLesson {book, unit, lesson}.
  // Cài đặt lưu theo bé + lớp + môn: { lesson: {bookId: {unit, lesson}}, mix: {bookId: bool} }.
  // "mix" CHỈ điều khiển đề trộn tuần (Ôn tổng hợp); không ảnh hưởng luyện từng chủ đề, kế hoạch hôm nay, thử thách cún.
  BOOK_STORE_KEY: 'bookScopeBySubject',

  /** Sách của chủ đề; chủ đề chưa gắn sách thuộc sách "fallback" (Kiến thức nền). */
  _bookOf(s, t) {
    const books = (s && s.books) || [];
    return books.find(b => b.id === t.book) || books.find(b => b.fallback) || null;
  },

  getBookScope(s) {
    if (!s || !Array.isArray(s.books) || !s.books.length) return null;
    let all = {};
    try { all = Storage.get(this.BOOK_STORE_KEY) || {}; } catch (e) { all = {}; }
    const saved = all[this._stageKey(s)] || {};
    const out = { lesson: {}, mix: {}, chosen: {} };
    s.books.forEach(b => {
      if (b.scope === 'lesson' && Array.isArray(b.lessons) && b.lessons.length) {
        const v = saved.lesson && saved.lesson[b.id];
        const ok = v && b.lessons.some(l => l.unit === v.unit && l.lesson === v.lesson);
        const def = b.defaultLesson || b.lessons[b.lessons.length - 1];
        out.lesson[b.id] = ok ? { unit: v.unit, lesson: v.lesson } : { unit: def.unit, lesson: def.lesson };
        out.chosen[b.id] = !!ok;
      }
      const m = saved.mix && saved.mix[b.id];
      out.mix[b.id] = typeof m === 'boolean' ? m : !!b.mixDefault;
    });
    return out;
  },

  /** patch: { lesson: {bookId: {unit, lesson}}, mix: {bookId: bool} } — chỉ ghi phần được đưa vào. */
  setBookScope(s, patch) {
    if (!s || !Array.isArray(s.books)) return;
    let all = {};
    try { all = Storage.get(this.BOOK_STORE_KEY) || {}; } catch (e) { all = {}; }
    const k = this._stageKey(s);
    const cur = all[k] || {};
    const next = { lesson: { ...(cur.lesson || {}) }, mix: { ...(cur.mix || {}) } };
    Object.entries((patch && patch.lesson) || {}).forEach(([id, v]) => { next.lesson[id] = { unit: v.unit, lesson: v.lesson }; });
    Object.entries((patch && patch.mix) || {}).forEach(([id, v]) => { next.mix[id] = !!v; });
    all[k] = next;
    Storage.set(this.BOOK_STORE_KEY, all);
  },

  /** Câu có mốc bài của sách chia theo bài (bookLesson) vượt bài đã học → ẩn. Câu không có mốc: không lọc. */
  _bookLessonOk(q, bs) {
    const bl = q && q.bookLesson;
    if (!bs || !bl) return true;
    const cur = bs.lesson[bl.book];
    if (!cur) return true;
    return bl.unit !== cur.unit ? bl.unit < cur.unit : bl.lesson <= cur.lesson;
  },

  /**
   * Câu đủ điều kiện vào Ôn tổng hợp (xét TỪNG CÂU, không theo cờ chủ đề):
   * - câu thuộc lô đã được duyệt nội dung (q.ref.contentReview), hoặc
   * - câu cũ có q.review.status ok/fixed thuộc lượt rà đã được xác nhận (s.reviewRounds[round].confirmed === true).
   * Chặn trước: câu có review.status khác ok/fixed (pending, rejected…) KHÔNG vào, kể cả câu lô đã duyệt
   * mà sau đó phát hiện lỗi. Câu chưa rà không vào.
   */
  _mixEligible(s, q) {
    if (!q) return false;
    const r = q.review;
    if (r && r.status !== 'ok' && r.status !== 'fixed') return false;
    if (q.ref && q.ref.contentReview) return true;
    if (!r) return false;
    const round = s && s.reviewRounds && s.reviewRounds[r.round];
    return !!(round && round.confirmed === true);
  },

  /** Chỉ số các câu trong chủ đề hợp với giai đoạn + bài đã học (null = môn không chia giai đoạn, không có mốc bài). */
  _allowedIndices(s, t) {
    const st = this.getStageSetting(s);
    const ls = this.getLessonSetting(s);
    const bs = this.getBookScope(s);
    if (!st && !ls && !bs) return null;
    const out = [];
    (t.questions || []).forEach((q, i) => {
      if (!this._lessonOk(q, ls)) return;
      if (!this._bookLessonOk(q, bs)) return;
      const qs = Number(q.stage || 0);
      if (!st || !qs) { out.push(i); return; }    // câu chưa gắn nhãn: luôn hiện
      if (st.only ? qs === st.stage : qs <= st.stage) out.push(i);
    });
    return out;
  },

  _visibleTopics(s) {
    return s.topics.filter(t => {
      if (t.drill) return false; // ở Đấu trường tính nhanh, không tính là chủ đề trong môn
      const a = this._allowedIndices(s, t);
      return a === null ? true : a.length > 0;
    });
  },

  _renderStageBar(s, subjectIdx) {
    const st = this.getStageSetting(s);
    if (!st) return null;
    const bar = document.createElement('div');
    bar.className = 'stage-bar';
    const cur = s.stages.find(x => x.id === st.stage) || s.stages[0];
    const terms = [];
    s.stages.forEach(x => { if (!terms.includes(x.term)) terms.push(x.term); });
    const chips = terms.map(term => `
      <div class="stage-term">
        <span class="stage-term-label">${this._escape(term === 'HK1' ? 'Học kì 1' : term === 'HK2' ? 'Học kì 2' : term)}</span>
        ${s.stages.filter(x => x.term === term).map(x => `
          <button class="stage-chip${x.id === st.stage ? ' active' : ''}${!st.only && x.id < st.stage ? ' included' : ''}" data-stage="${x.id}">
            ${this._escape(x.short || x.name)}
          </button>`).join('')}
      </div>`).join('');
    bar.innerHTML = `
      <div class="stage-bar-head">
        <span class="stage-bar-title">📍 Con đang học đến đâu?</span>
        <div class="stage-mode">
          <button class="stage-mode-btn${!st.only ? ' active' : ''}" data-only="0">Ôn cả phần trước</button>
          <button class="stage-mode-btn${st.only ? ' active' : ''}" data-only="1">Chỉ giai đoạn này</button>
        </div>
      </div>
      <div class="stage-chips">${chips}</div>
      <div class="stage-desc"><b>${this._escape(cur.name)}:</b> ${this._escape(cur.desc || '')}</div>
      ${st.chosen ? '' : '<div class="stage-nudge">👨‍👩‍👧 Bố mẹ chọn giúp con giai đoạn đang học trên lớp nhé.</div>'}
      ${this._lessonRowHTML(s)}`;
    bar.querySelectorAll('.stage-chip').forEach(b => b.addEventListener('click', () => {
      this.setStageSetting(s, Number(b.dataset.stage), st.only);
      this._chooseSubject(subjectIdx, true);
    }));
    bar.querySelectorAll('.stage-mode-btn').forEach(b => b.addEventListener('click', () => {
      this.setStageSetting(s, st.stage, b.dataset.only === '1');
      this._chooseSubject(subjectIdx, true);
    }));
    const sel = bar.querySelector('#lessonSelect');
    if (sel) sel.addEventListener('change', () => {
      this.setLessonSetting(s, sel.value ? Number(sel.value) : null);
      this._chooseSubject(subjectIdx, true);
    });
    return bar;
  },

  _lessonRowHTML(s) {
    const lb = s.lessonBook;
    if (!lb) return '';
    const cur = this.getLessonSetting(s);
    const opts = lb.titles.map((t, i) => `<option value="${i + 1}"${cur && cur.no === i + 1 ? ' selected' : ''}>Bài ${i + 1}. ${this._escape(t)}</option>`).join('');
    return `<div class="lesson-row"><label for="lessonSelect">📖 Trên lớp đã học đến:</label>
      <select id="lessonSelect" class="lesson-select"><option value=""${cur ? '' : ' selected'}>Chưa chọn (theo giai đoạn)</option>${opts}</select>
      <small>${this._escape(lb.label)} · lọc câu tự sinh và các câu đã ghi số bài; câu chưa ghi số bài vẫn lọc theo giai đoạn ở trên</small></div>`;
  },

  // ─── Đề trộn tuần này (interleaving) ─────────
  // Lấy khoảng 20 câu từ mọi chủ đề trong phạm vi giai đoạn đang chọn, xen kẽ các chủ đề.
  // Bộ câu cố định trong một tuần (theo tên bé + lớp + môn + giai đoạn) để làm lại được và so điểm.
  MIX_SIZE: 20,

  _weekStart(d) {
    const x = new Date(d || Date.now());
    const day = (x.getDay() + 6) % 7; // thứ Hai = 0
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - day);
    return x;
  },

  _seededRandom(seedStr) {
    let h = 2166136261;
    for (let i = 0; i < seedStr.length; i++) { h ^= seedStr.charCodeAt(i); h = Math.imul(h, 16777619); }
    return () => {
      h += 0x6D2B79F5; let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  _mixKey(s) {
    const ws = this._weekStart();
    const wk = ws.getFullYear() + '-' + String(ws.getMonth() + 1).padStart(2, '0') + '-' + String(ws.getDate()).padStart(2, '0');
    const st = this.getStageSetting(s);
    const stTag = st ? (st.only ? 'only' : 'upto') + st.stage : 'all';
    const bs = this.getBookScope(s);
    // Môn chia giáo trình: đổi nguồn vào đề trộn hoặc mốc bài → bộ đề mới (điểm cũ không lẫn)
    const bTag = bs ? '|b:' + s.books.filter(b => bs.mix[b.id]).map(b => b.id + (bs.lesson[b.id] ? '@' + bs.lesson[b.id].unit + '.' + bs.lesson[b.id].lesson : '')).join(',') : '';
    return wk + '|' + this.currentGrade + ':' + s.id + '|' + stTag + bTag;
  },

  /**
   * Đề trộn tuần cho môn chia giáo trình (Ôn tổng hợp):
   * nguồn = sách được chọn "vào Ôn tổng hợp" và có câu hợp lệ; chỉ câu đã rà (_mixEligible, xét từng câu);
   * vẫn trong phạm vi giai đoạn / bài đã học. Hạn mức chia đều N / số nguồn (phần dư chia lần lượt),
   * nguồn thiếu câu lấy hết rồi bù đều từ nguồn còn câu. Trong một nguồn xoay vòng theo chủ đề.
   * Không lặp ID. Tổng < N → đề ngắn đúng số câu có, không kéo câu ngoài phạm vi.
   */
  _buildBookMix(s, key, shuffle) {
    const bs = this.getBookScope(s);
    const sources = s.books.filter(b => bs.mix[b.id]).map(b => {
      const buckets = shuffle(s.topics.filter(t => !t.drill && this._bookOf(s, t) === b).map(t => {
        const allowed = this._allowedIndices(s, t);
        const idxs = (allowed === null ? (t.questions || []).map((_, i) => i) : allowed).filter(i => this._mixEligible(s, t.questions[i]));
        return { t, idxs: shuffle(idxs) };
      }).filter(x => x.idxs.length));
      return { b, buckets, avail: buckets.reduce((n, x) => n + x.idxs.length, 0) };
    }).filter(x => x.avail > 0);

    // Hạn mức: chia đều, phần dư cho các nguồn đầu (thứ tự đã xáo theo tuần); thiếu thì bù đều
    const order = shuffle(sources);
    const quota = new Map(order.map(x => [x, 0]));
    let left = Math.min(this.MIX_SIZE, order.reduce((n, x) => n + x.avail, 0));
    while (left > 0) {
      const open = order.filter(x => quota.get(x) < x.avail);
      const share = Math.max(1, Math.floor(left / open.length));
      for (const x of open) {
        if (left <= 0) break;
        const add = Math.min(share, x.avail - quota.get(x), left);
        quota.set(x, quota.get(x) + add);
        left -= add;
      }
    }

    const pool = [], seen = new Set(), used = [];
    for (const x of order) {
      const want = quota.get(x);
      let got = 0, round = 0;
      while (got < want && x.buckets.some(bk => bk.idxs.length > round)) {
        for (const bk of x.buckets) {
          if (got >= want) break;
          const i = bk.idxs[round];
          if (i == null) continue;
          const q = bk.t.questions[i];
          const topicId = (bk.t.id || bk.t.name).toString();
          const id = q.id || (topicId + '_' + i);
          if (seen.has(id)) continue;
          seen.add(id);
          pool.push({ ...q, _idx: i, subjectId: s.id, topicId, id, _subjectName: s.name, _topicName: bk.t.name });
          got++;
        }
        round++;
      }
      if (got) used.push({ id: x.b.id, icon: x.b.icon, name: x.b.name, n: got });
    }
    const topicCount = new Set(pool.map(q => q.topicId)).size;
    return { key, pool: shuffle(pool), topicCount, sources: used, short: pool.length < this.MIX_SIZE };
  },

  _buildWeeklyMix(s) {
    const key = this._mixKey(s);
    if (Array.isArray(s.books) && s.books.length) {
      const rand0 = this._seededRandom(key + '|' + Storage.canonName(this.playerName || ''));
      const shuffle0 = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand0() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
      return this._buildBookMix(s, key, shuffle0);
    }
    const rand = this._seededRandom(key + '|' + Storage.canonName(this.playerName || ''));
    const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const buckets = shuffle(s.topics.filter(t => !t.drill).map(t => {
      const allowed = this._allowedIndices(s, t);
      const idxs = allowed === null ? (t.questions || []).map((_, i) => i) : allowed;
      return { t, idxs: shuffle(idxs) };
    }).filter(b => b.idxs.length));
    const pool = [];
    let round = 0;
    while (pool.length < this.MIX_SIZE && buckets.some(b => b.idxs.length > round)) {
      for (const b of buckets) {
        if (pool.length >= this.MIX_SIZE) break;
        const i = b.idxs[round];
        if (i == null) continue;
        const q = b.t.questions[i];
        const topicId = (b.t.id || b.t.name).toString();
        pool.push({
          ...q,
          _idx: i,
          subjectId: s.id,
          topicId,
          id: q.id || (topicId + '_' + i),
          _subjectName: s.name,
          _topicName: b.t.name
        });
      }
      round++;
    }
    return { key, pool: shuffle(pool), topicCount: buckets.length };
  },

  _renderMixCard(s) {
    const { key, pool, topicCount, sources, short } = this._buildWeeklyMix(s);
    // Môn chia giáo trình: một chủ đề vẫn được (vd chỉ bật Ms Hoa) khi đủ ≥ 5 câu; môn khác giữ điều kiện cũ.
    if (pool.length < 5 || (!sources && topicCount < 2)) return null;
    // Môn chia giáo trình: 1 dòng ngắn nguồn câu + báo đề ngắn
    const srcLine = sources ? `<div class="mix-src">Lấy từ: ${sources.map(x => `${x.icon} ${this._escape(x.name)} (${x.n})`).join(' · ')}${short ? ` · đề ngắn ${pool.length} câu vì chưa đủ ${this.MIX_SIZE} câu đã rà` : ''}</div>` : '';
    let best = null;
    try { best = (Storage.get('weeklyMix') || {})[key] || null; } catch (e) { best = null; }
    const ws = this._weekStart();
    const card = document.createElement('div');
    card.className = 'mix-card';
    card.innerHTML = `
      <div class="mix-icon">🎲</div>
      <div class="mix-text">
        <div class="mix-title">${sources ? 'Ôn tổng hợp · đề trộn tuần' : 'Đề trộn tuần này'}</div>
        <div class="mix-sub">${pool.length} câu xen kẽ từ ${topicCount} chủ đề · tuần từ ${ws.getDate()}/${ws.getMonth() + 1}${best ? ` · <b>Điểm cao nhất: ${best.score}/${best.total}</b>` : ''}</div>
        <div class="mix-why">Trộn nhiều dạng giúp con tự nhận ra bài nào dùng cách nào — nhớ lâu hơn làm từng dạng riêng.</div>
        ${srcLine}
      </div>
      <button class="mix-btn">${best ? 'Làm lại ▶' : 'Làm đề ▶'}</button>`;
    card.querySelector('.mix-btn').addEventListener('click', e => {
      e.stopPropagation();
      Quiz.startMixed(pool, s.name, s.id, key);
    });
    return card;
  },

  _chooseSubject(idx, keepScroll) {
    const s = this.allData.subjects[idx];
    // Câu tự sinh trong lịch sử của bé mà kho chưa có → dựng lại trước khi vẽ thẻ chủ đề / tính tiến độ
    if (window.GenB13 && GenB13.ensureFromHistory(this.allData) && window.Today) Today._qIdxCache = null;
    document.getElementById('topicMenuTitle').textContent = s.name;

    const list = document.getElementById('topicList');
    list.innerHTML = '';

    const stageBar = this._renderStageBar(s, idx);
    const mixCard = this._renderMixCard(s);
    // Chủ đề đang có câu trong phạm vi (giai đoạn / bài đã học); phần tự sinh bảng nhân chia ở Đấu trường
    const shown = s.topics.map(t => ({ t, allowed: this._allowedIndices(s, t) }))
      .filter(x => !x.t.drill && !(x.allowed && !x.allowed.length));

    if (Array.isArray(s.books) && s.books.length) {
      // Môn chia giáo trình: Ôn tổng hợp (đề trộn tuần) ở đầu, rồi các mục sách; thanh giai đoạn nằm trong
      // mục sách chia giai đoạn (NIK). Bé không có bộ lọc nào khác — phạm vi sách khác do bố mẹ chỉnh.
      if (mixCard) list.appendChild(mixCard);
      s.books.forEach(b => {
        const items = shown.filter(x => this._bookOf(s, x.t) === b);
        const hasStage = b.scope === 'stage' && stageBar;
        if (!items.length && !hasStage) return;
        list.appendChild(this._bookHeader(s, b));
        if (hasStage) list.appendChild(stageBar);
        items.forEach(x => list.appendChild(this._topicCard(s, x.t, x.allowed)));
        if (hasStage && !items.length) {
          const empty = document.createElement('div');
          empty.className = 'stage-empty';
          empty.innerHTML = '🌱 Bài cho giai đoạn này đang được soạn thêm. Con chọn giai đoạn khác hoặc bấm <b>Ôn cả phần trước</b> nhé!';
          list.appendChild(empty);
        }
      });
      if (keepScroll) return;
      this.showScreen('topic');
      return;
    }

    if (stageBar) list.appendChild(stageBar);
    if (mixCard) list.appendChild(mixCard);
    shown.forEach(x => list.appendChild(this._topicCard(s, x.t, x.allowed)));

    if (stageBar && !list.querySelector('.topic-card')) {
      const empty = document.createElement('div');
      empty.className = 'stage-empty';
      empty.innerHTML = '🌱 Bài cho giai đoạn này đang được soạn thêm. Con chọn giai đoạn khác hoặc bấm <b>Ôn cả phần trước</b> nhé!';
      list.appendChild(empty);
    }

    if (keepScroll) return; // đổi giai đoạn: vẽ lại tại chỗ, không cuộn lên đầu
    this.showScreen('topic');
  },

  /** Thẻ một chủ đề (luyện / kiểm tra / ôn lỗi) — allowed: chỉ số câu trong phạm vi hoặc null. */
  _topicCard(s, t, allowed) {
    const allowedSet = allowed ? new Set(allowed) : null;
    const inScope = i => (allowedSet ? allowedSet.has(i) : i < (t.questions || []).length);

    const card = document.createElement('div');
    card.className = 'topic-card topic-card-with-modes';

    const topicId = (t.id || t.name).toString();
    const totalQ = allowed ? allowed.length : (t.questions || []).length;
    let learned = 0, wrong = 0, today = 0;
    try {
      // Tiến độ tích lũy: số câu đã từng làm đúng (không reset theo ngày).
      const tot = (window.Storage && Storage.getTotalProgress) ? Storage.getTotalProgress(topicId) : null;
      if (tot) learned = (tot.ok || []).filter(inScope).length;
      const prog = (window.Storage && Storage.getTopicProgress) ? Storage.getTopicProgress(topicId) : null;
      if (prog) {
        today = (prog.learned || []).filter(inScope).length;
        wrong = (prog.wrong || []).filter(inScope).length;
      }
    } catch (e) { /* chưa có tiến độ thì để 0 */ }
    let solid = 0;
    try {
      const rv = Storage.getReviewMap ? Storage.getReviewMap() : {};
      (t.questions || []).forEach((q, i) => { const r = q.id && rv[q.id]; if (r && r.box >= Storage.MASTER_BOX && inScope(i)) solid++; });
    } catch (e) { solid = 0; }
    const solidAll = totalQ > 0 && solid / totalQ >= 0.8;
    const pct = totalQ ? Math.round(learned / totalQ * 100) : 0;
    const st = solidAll ? { label: '🌟 Đã vững', color: '#16a34a' } : this._topicStatus(pct);
    const desc = this.TOPIC_DESC[topicId] || '';

    card.innerHTML = `
      <div class="topic-card-main">
        <div class="topic-icon">${t.icon}</div>
        <div class="topic-head-text">
          <div class="topic-name">${this._escape(t.name)}</div>
          <div class="topic-subline">${totalQ} câu hỏi${solid ? ` · <span class="solid-tag">⭐ ${solid} câu đã vững</span>` : ''}</div>
        </div>
      </div>
      ${desc ? `<div class="topic-desc">${this._escape(desc)}</div>` : ''}
      <div class="topic-progress-wrap">
        <div class="topic-prog-bar"><div class="topic-prog-fill" style="width:${pct}%;background:${st.color}"></div></div>
        <div class="topic-prog-meta">
          <span class="topic-status-tag" style="color:${st.color}">${st.label}</span>
          <span class="topic-pct">${learned}/${totalQ} câu đã đúng${today ? ' · hôm nay ' + today : ''}${wrong ? ' · ' + wrong + ' cần ôn' : ''}</span>
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
        Quiz.start(t, s.name, { mode: btn.dataset.mode, subjectId: s.id, allowed });
      });
    });

    return card;
  },

  /** Tiêu đề mục sách: biểu tượng, tên, nhãn phạm vi đang dùng (chỉ để xem). */
  _bookHeader(s, b) {
    const el = document.createElement('div');
    el.className = 'book-head';
    let tag = b.tag || '';
    if (b.scope === 'stage') {
      const st = this.getStageSetting(s);
      const cur = st && s.stages.find(x => x.id === st.stage);
      if (cur) tag = st.only ? 'Chỉ ' + (cur.short || cur.name) : (cur.short || cur.name) + ' · học cộng dồn';
    } else if (b.scope === 'lesson') {
      const bs = this.getBookScope(s);
      const cur = bs && bs.lesson[b.id];
      const l = cur && (b.lessons || []).find(x => x.unit === cur.unit && x.lesson === cur.lesson);
      if (l) tag = 'Đã học đến ' + (l.short || l.name);
    }
    el.innerHTML = `<span class="book-icon">${b.icon || '📚'}</span><span class="book-name">${this._escape(b.name)}</span>${tag ? `<span class="book-tag">${this._escape(tag)}</span>` : ''}`;
    return el;
  },

  /** Thẻ "⚡ Luyện bảng nhân chia (tự sinh)": chọn bảng + nhóm dạng, mỗi lượt bốc câu mới. */
  _renderDrillCard(s, t, allowed, opts) {
    opts = opts || {};
    const arena = !!opts.arena;
    const back = arena ? 'arena' : 'topic';
    const pref = TableGen.getPref();
    const stats = TableGen.tableStats(t);
    const card = document.createElement('div');
    card.className = 'topic-card topic-card-with-modes drill-card' + (arena ? ' arena-card' : '');
    const chips = TableGen.TABLES.map(n => {
      const st = stats[n] || { total: 0, solid: 0 };
      const pct = st.total ? Math.round(st.solid / st.total * 100) : 0;
      return `<button type="button" class="drill-chip${pref.tables.includes(n) ? ' on' : ''}" data-t="${n}" title="Đã vững ${st.solid}/${st.total} câu">
        <span class="drill-chip-n">${n}</span><span class="drill-chip-bar"><i style="width:${pct}%"></i></span></button>`;
    }).join('');
    const sp = TableGen.getSpeed();
    const unlocked = sp.level.unlocked || 0;
    const speedChips = TableGen.LEVELS.map((L, i) => {
      const open = i <= unlocked;
      const best = sp.level.best[i];
      return `<button type="button" class="speed-lv${open ? '' : ' locked'}" data-lv="${i}" ${open ? '' : 'disabled'}>
        <span class="sl-ic">${open ? L.icon : '🔒'}</span><span class="sl-name">${L.name}</span>
        <span class="sl-best" title="Kỉ lục mức này, tính mọi phạm vi">${open ? (sp.level.passed && sp.level.passed[i] ? '🏅 ' : '') + (best != null ? best + '/20' : 'chưa chơi') : 'khoá'}</span></button>`;
    }).join('');
    const slow = TableGen.slowFacts(sp, 6);
    const slowLine = slow.length ? `<div class="speed-slow">🐢 Phép con còn chậm hoặc sai: <b>${slow.map(x => TableGen.factLabel(x.fact)).join(', ')}</b> — Thỏ sẽ hỏi lại nhiều hơn.</div>` : '';
    const groups = [['all', 'Tất cả dạng'], ['calc', TableGen.GROUPS.calc.label], ['rel', TableGen.GROUPS.rel.label]]
      .map(([k, l]) => `<button type="button" class="drill-group${pref.group === k ? ' on' : ''}" data-g="${k}">${this._escape(l)}</button>`).join('');
    const head = arena ? '' : `
      <div class="topic-card-main">
        <div class="topic-icon">${t.icon}</div>
        <div class="topic-head-text">
          <div class="topic-name">${this._escape(t.name)}</div>
          <div class="topic-subline">Mỗi lượt 20 câu mới · ưu tiên phép con hay sai</div>
        </div>
      </div>`;
    const pickers = `
      <div class="drill-label">Chọn bảng <button type="button" class="drill-all">Chọn hết</button></div>
      <div class="drill-chips">${chips}</div>
      <div class="drill-label">Dạng bài</div>
      <div class="drill-groups">${groups}</div>
      <div class="drill-count"></div>`;
    const modeRow = `
      ${arena ? '<div class="drill-label arena-extra-label">Luyện thêm (không tính giờ)</div>' : ''}
      <div class="topic-mode-row">
        <button class="mode-btn practice" data-mode="practice">⚡ Luyện 20 câu</button>
        <button class="mode-btn test" data-mode="test">📝 Kiểm tra</button>
        <button class="mode-btn review" data-mode="review">🔁 Ôn lỗi sai</button>
      </div>`;
    const speedBox = `
      <div class="speed-box">
        <div class="drill-label">⏱️ ${arena ? 'Chọn mức' : 'Thử thách tốc độ'} <small>đúng & kịp giờ ${TableGen.PASS_SCORE}/20 câu để nhận danh hiệu và mở mức mới</small></div>
        <div class="speed-levels">${speedChips}</div>
        <div class="speed-info"></div>
        <button type="button" class="speed-go">⏱️ Bắt đầu thử thách</button>
        ${slowLine}
        ${arena ? '' : '<button type="button" class="speed-arena-link">🏟️ Mở Đấu trường tính nhanh (xem danh hiệu)</button>'}
      </div>`;
    card.innerHTML = arena ? pickers + speedBox + modeRow : head + pickers + modeRow + speedBox;
    const arenaLink = card.querySelector('.speed-arena-link');
    if (arenaLink) arenaLink.addEventListener('click', e => { e.stopPropagation(); this.showScreen('arena'); });
    const cur = { tables: pref.tables.slice(), group: pref.group, level: Math.min(pref.level != null ? pref.level : unlocked, unlocked) };
    const countEl = card.querySelector('.drill-count');
    const refresh = () => {
      card.querySelectorAll('.drill-chip').forEach(b => b.classList.toggle('on', cur.tables.includes(+b.dataset.t)));
      card.querySelectorAll('.drill-group').forEach(b => b.classList.toggle('on', b.dataset.g === cur.group));
      const n = TableGen.filterIndices(t, cur.tables, cur.group, allowed).length;
      countEl.textContent = cur.tables.length
        ? 'Bảng ' + cur.tables.slice().sort((a, b) => a - b).join(', ') + ' · kho ' + n + ' câu'
        : 'Con chọn ít nhất 1 bảng nhé';
      card.querySelectorAll('.speed-lv').forEach(b => b.classList.toggle('on', +b.dataset.lv === cur.level));
      const L = TableGen.LEVELS[cur.level];
      // Điểm đã đạt của ĐÚNG phạm vi đang chọn (không lấy kỉ lục của phạm vi khác làm mục tiêu)
      const curScope = cur.tables.length ? TableGen.scopeOf(t, TableGen.filterIndices(t, cur.tables, cur.group, allowed), cur.group) : null;
      const got = TableGen.findScope(cur.level, curScope);
      card.querySelector('.speed-info').textContent = L.icon + ' ' + L.name + ': tính ' + L.t.calc + ' giây · tìm số thiếu ' + L.t.miss + ' giây · quan hệ phép nhân ' + L.t.rel + ' giây mỗi câu' +
        (got ? ' · 🏅 Thử thách ' + TableGen.scopeText(curScope) + ' đã đạt ' + got.s + '/20' : '');
      TableGen.setPref(cur);
    };
    card.querySelectorAll('.speed-lv:not(.locked)').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); cur.level = +b.dataset.lv; refresh(); }));
    card.querySelector('.speed-go').addEventListener('click', e => {
      e.stopPropagation();
      if (!cur.tables.length) { Rewards._achievementPopup('🐰 Con chọn ít nhất 1 bảng nhé!'); return; }
      Quiz.start(t, s.name, { mode: 'test', subjectId: s.id, allowed, back, speed: cur.level, drill: { tables: cur.tables.slice(), group: cur.group, count: TableGen.DRILL_SIZE } });
    });
    card.querySelectorAll('.drill-chip').forEach(b => b.addEventListener('click', e => {
      e.stopPropagation();
      const n = +b.dataset.t;
      cur.tables = cur.tables.includes(n) ? cur.tables.filter(x => x !== n) : cur.tables.concat(n);
      refresh();
    }));
    card.querySelector('.drill-all').addEventListener('click', e => { e.stopPropagation(); cur.tables = TableGen.TABLES.slice(); refresh(); });
    card.querySelectorAll('.drill-group').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); cur.group = b.dataset.g; refresh(); }));
    card.querySelectorAll('.mode-btn').forEach(btn => btn.addEventListener('click', e => {
      e.stopPropagation();
      if (!cur.tables.length) { Rewards._achievementPopup('🐰 Con chọn ít nhất 1 bảng nhé!'); return; }
      Quiz.start(t, s.name, { mode: btn.dataset.mode, subjectId: s.id, allowed, back, drill: { tables: cur.tables.slice(), group: cur.group, count: TableGen.DRILL_SIZE } });
    }));
    refresh();
    return card;
  },

  /** Đổi % tiến độ thành nhãn + màu trạng thái cho card chủ đề. */
  _topicStatus(pct) {
    if (pct >= 90) return { label: 'Làm gần hết rồi', color: '#16a34a' };
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

  // --- Delegate sang ParentDashboard ---
  _openParentArea()              { ParentDashboard._openParentArea(); },
  _checkPin()                    { ParentDashboard._checkPin(); },
  _changePin()                   { ParentDashboard._changePin(); },
  async _openDashboard()         { return ParentDashboard._openDashboard(); },
  async _loadParentLog(name)     { return ParentDashboard._loadParentLog(name); },

  // --- Delegate sang DragonBall ---
  _renderHomeWidgets()           { DragonBall._renderHomeWidgets(); },
  _renderDragonShop()            { DragonBall._renderDragonShop(); },
  _renderCollection()            { DragonBall._renderCollection(); },

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

    // Grade selector
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

    // Bo loc gian sticker (Tat ca / Du sao / Da so huu): ve lai khi doi lua chon.
    const shopFilter = document.getElementById('shopFilter');
    if (shopFilter) {
      shopFilter.addEventListener('change', () => Rewards.renderShop());
    }

    document.querySelectorAll('.shop-btn-mini[data-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        Rewards.buyItem(btn.dataset.item, parseInt(btn.dataset.cost));
      });
    });

    document.getElementById('btnNext').addEventListener('click', () => Quiz.next());

    document.getElementById('btnContinue').addEventListener('click', () => {
      if (window.Quiz && Quiz.backScreen === 'arena') { this.showScreen('arena'); return; }
      this.goLearn();
      Rewards.updateUI();
    });

    document.querySelectorAll('.btn-nav[data-screen]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.dataset.screen === 'learn') this.goLearn();
        else this.showScreen(btn.dataset.screen);
      });
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

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
