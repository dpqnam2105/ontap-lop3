// =============================================
// APP.JS v6 - tách module ParentDashboard + DragonBall
// =============================================

const App = {
  allData: null,
  playerName: '',
  currentGrade: 'lop2',

  PIN_KEY: 'khoBaiTap_parentPin',
  DEFAULT_PIN: '1234',
  leaderboardGrade: 'lop2',

  // Dragon Ball keys giữ lại để các module con truy cập qua App
  DRAGONBALL_KEY: 'rabbit_dragonball_collection',
  DRAGON_REWARD_KEY: 'rabbit_shenron_unlocked',

  async init() {
    this._bindEvents();
    this._restoreSession();
    this.loadLeaderboard('lop2');
    DragonBall._renderHomeWidgets();
    await this._loadData();
    DragonBall._renderHomeWidgets();
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
    DragonBall._renderHomeWidgets();
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
    if (name === 'register' || name === 'subject') DragonBall._renderHomeWidgets();
    if (name === 'shop') DragonBall._renderDragonShop();
    if (name === 'collection') DragonBall._renderCollection();
    window.scrollTo(0, 0);
  },

  _register() {
    const name = document.getElementById('nameInput').value.trim();
    if (name.length < 2) return;

    this.playerName = name;
    Storage.set('playerName', name);

    document.getElementById('subName').textContent = 'Chào ' + name + '!';
    Rewards.updateUI();
    DragonBall._renderHomeWidgets();
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
      // Tien do hom nay: so chu de da luyen it nhat 1 cau / tong so chu de.
      let doneToday = 0;
      try {
        if (window.Storage && Storage.getTopicProgress) {
          s.topics.forEach(t => {
            const p = Storage.getTopicProgress((t.id || t.name).toString());
            if (p && (p.learned || []).length > 0) doneToday++;
          });
        }
      } catch (e) { /* chua co tien do thi de 0 */ }
      const progChip = doneToday > 0
        ? `<span class="sub-ov-chip sub-ov-chip-done">⭐ Hôm nay: ${doneToday}/${s.topics.length}</span>`
        : `<span class="sub-ov-chip">🚀 Bắt đầu nào!</span>`;

      const card = document.createElement('div');
      card.className = 'sub-card sub-card-img';
      card.innerHTML = `
        <img class="sub-banner" src="images/subject-${s.id}.png" alt="${this._escape(s.name)}"
             onerror="this.style.display='none';this.parentElement.classList.add('sub-card-noimg')">
        <div class="sub-overlay">
          <div class="sub-ov-icon">${s.icon}</div>
          <div class="sub-ov-text">
            <div class="sub-ov-name">${this._escape(s.name)}</div>
            <div class="sub-ov-meta">${s.topics.length} chủ đề ôn tập</div>
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
            <div class="sub-meta">${s.topics.length} chủ đề ôn tập</div>
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

  _chooseSubject(idx) {
    const s = this.allData.subjects[idx];
    document.getElementById('topicMenuTitle').textContent = s.name;

    const list = document.getElementById('topicList');
    list.innerHTML = '';

    s.topics.forEach((t) => {
      const card = document.createElement('div');
      card.className = 'topic-card topic-card-with-modes';

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

window.App = App;
document.addEventListener('DOMContentLoaded', () => App.init());
