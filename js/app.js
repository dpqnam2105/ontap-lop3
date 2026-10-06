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
    if (window.Speak) Speak.stop();
    if (name === 'register' && window.Achieve) Achieve.renderTicker();
    // Cần có tên trước khi vào khu học (grade/subject/topic). Nếu chưa, đưa về Trang chủ.
    const needsName = (name === 'grade' || name === 'subject' || name === 'topic');
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
    const learnScreens = ['grade', 'subject', 'topic', 'quiz', 'result'];
    document.querySelectorAll('.side-rail .btn-nav').forEach(b => {
      const sc = b.dataset.screen;
      b.classList.toggle('nav-active', sc === name || (sc === 'learn' && learnScreens.includes(name)));
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
    if (name === 'collection') {
      DragonBall._renderCollection();
      if (window.Rewards && Rewards.renderCollection) Rewards.renderCollection();
      if (window.Decor) Decor.renderCollection();
    }
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

  /** Chỉ số các câu trong chủ đề hợp với giai đoạn đang chọn (null = môn không chia giai đoạn). */
  _allowedIndices(s, t) {
    const st = this.getStageSetting(s);
    if (!st) return null;
    const out = [];
    (t.questions || []).forEach((q, i) => {
      const qs = Number(q.stage || 0);
      if (!qs) { out.push(i); return; }           // câu chưa gắn nhãn: luôn hiện
      if (st.only ? qs === st.stage : qs <= st.stage) out.push(i);
    });
    return out;
  },

  _visibleTopics(s) {
    return s.topics.filter(t => {
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
      ${st.chosen ? '' : '<div class="stage-nudge">👨‍👩‍👧 Bố mẹ chọn giúp con giai đoạn đang học trên lớp nhé.</div>'}`;
    bar.querySelectorAll('.stage-chip').forEach(b => b.addEventListener('click', () => {
      this.setStageSetting(s, Number(b.dataset.stage), st.only);
      this._chooseSubject(subjectIdx, true);
    }));
    bar.querySelectorAll('.stage-mode-btn').forEach(b => b.addEventListener('click', () => {
      this.setStageSetting(s, st.stage, b.dataset.only === '1');
      this._chooseSubject(subjectIdx, true);
    }));
    return bar;
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
    return wk + '|' + this.currentGrade + ':' + s.id + '|' + stTag;
  },

  _buildWeeklyMix(s) {
    const key = this._mixKey(s);
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
    const { key, pool, topicCount } = this._buildWeeklyMix(s);
    if (pool.length < 5 || topicCount < 2) return null;
    let best = null;
    try { best = (Storage.get('weeklyMix') || {})[key] || null; } catch (e) { best = null; }
    const ws = this._weekStart();
    const card = document.createElement('div');
    card.className = 'mix-card';
    card.innerHTML = `
      <div class="mix-icon">🎲</div>
      <div class="mix-text">
        <div class="mix-title">Đề trộn tuần này</div>
        <div class="mix-sub">${pool.length} câu xen kẽ từ ${topicCount} chủ đề · tuần từ ${ws.getDate()}/${ws.getMonth() + 1}${best ? ` · <b>Điểm cao nhất: ${best.score}/${best.total}</b>` : ''}</div>
        <div class="mix-why">Trộn nhiều dạng giúp con tự nhận ra bài nào dùng cách nào — nhớ lâu hơn làm từng dạng riêng.</div>
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
    document.getElementById('topicMenuTitle').textContent = s.name;

    const list = document.getElementById('topicList');
    list.innerHTML = '';

    const stageBar = this._renderStageBar(s, idx);
    if (stageBar) list.appendChild(stageBar);
    const mixCard = this._renderMixCard(s);
    if (mixCard) list.appendChild(mixCard);

    s.topics.forEach((t) => {
      const allowed = this._allowedIndices(s, t);
      if (allowed && !allowed.length) return; // chủ đề chưa có câu trong giai đoạn đang chọn
      if (t.drill && window.TableGen) { list.appendChild(this._renderDrillCard(s, t, allowed)); return; }
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

      list.appendChild(card);
    });

    if (stageBar && !list.querySelector('.topic-card')) {
      const empty = document.createElement('div');
      empty.className = 'stage-empty';
      empty.innerHTML = '🌱 Bài cho giai đoạn này đang được soạn thêm. Con chọn giai đoạn khác hoặc bấm <b>Ôn cả phần trước</b> nhé!';
      list.appendChild(empty);
    }

    if (keepScroll) return; // đổi giai đoạn: vẽ lại tại chỗ, không cuộn lên đầu
    this.showScreen('topic');
  },

  /** Thẻ "⚡ Luyện bảng nhân chia (tự sinh)": chọn bảng + nhóm dạng, mỗi lượt bốc câu mới. */
  _renderDrillCard(s, t, allowed) {
    const pref = TableGen.getPref();
    const stats = TableGen.tableStats(t);
    const card = document.createElement('div');
    card.className = 'topic-card topic-card-with-modes drill-card';
    const chips = TableGen.TABLES.map(n => {
      const st = stats[n] || { total: 0, solid: 0 };
      const pct = st.total ? Math.round(st.solid / st.total * 100) : 0;
      return `<button type="button" class="drill-chip${pref.tables.includes(n) ? ' on' : ''}" data-t="${n}" title="Đã vững ${st.solid}/${st.total} câu">
        <span class="drill-chip-n">${n}</span><span class="drill-chip-bar"><i style="width:${pct}%"></i></span></button>`;
    }).join('');
    const groups = [['all', 'Tất cả dạng'], ['calc', TableGen.GROUPS.calc.label], ['rel', TableGen.GROUPS.rel.label]]
      .map(([k, l]) => `<button type="button" class="drill-group${pref.group === k ? ' on' : ''}" data-g="${k}">${this._escape(l)}</button>`).join('');
    card.innerHTML = `
      <div class="topic-card-main">
        <div class="topic-icon">${t.icon}</div>
        <div class="topic-head-text">
          <div class="topic-name">${this._escape(t.name)}</div>
          <div class="topic-subline">Mỗi lượt 20 câu mới · ưu tiên phép con hay sai</div>
        </div>
      </div>
      <div class="drill-label">Chọn bảng <button type="button" class="drill-all">Chọn hết</button></div>
      <div class="drill-chips">${chips}</div>
      <div class="drill-label">Dạng bài</div>
      <div class="drill-groups">${groups}</div>
      <div class="drill-count"></div>
      <div class="topic-mode-row">
        <button class="mode-btn practice" data-mode="practice">⚡ Luyện 20 câu</button>
        <button class="mode-btn test" data-mode="test">📝 Kiểm tra</button>
        <button class="mode-btn review" data-mode="review">🔁 Ôn lỗi sai</button>
      </div>`;
    const cur = { tables: pref.tables.slice(), group: pref.group };
    const countEl = card.querySelector('.drill-count');
    const refresh = () => {
      card.querySelectorAll('.drill-chip').forEach(b => b.classList.toggle('on', cur.tables.includes(+b.dataset.t)));
      card.querySelectorAll('.drill-group').forEach(b => b.classList.toggle('on', b.dataset.g === cur.group));
      const n = TableGen.filterIndices(t, cur.tables, cur.group, allowed).length;
      countEl.textContent = cur.tables.length
        ? 'Bảng ' + cur.tables.slice().sort((a, b) => a - b).join(', ') + ' · kho ' + n + ' câu'
        : 'Con chọn ít nhất 1 bảng nhé';
      TableGen.setPref(cur);
    };
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
      Quiz.start(t, s.name, { mode: btn.dataset.mode, subjectId: s.id, allowed, drill: { tables: cur.tables.slice(), group: cur.group, count: TableGen.DRILL_SIZE } });
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
