// =============================================
// APP.JS v5 - thêm màn chọn lớp
// =============================================

const App = {
  allData: null,
  playerName: '',
  currentGrade: 'lop2',

  PIN_KEY: 'khoBaiTap_parentPin',
  DEFAULT_PIN: '1234',

  async init() {
    this._bindEvents();
    this._restoreSession();
    this.loadLeaderboard();
    await this._loadData();
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
  },

  async loadLeaderboard() {
    const lbDiv = document.getElementById('lbList');
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
    window.scrollTo(0, 0);
  },

  _register() {
    const name = document.getElementById('nameInput').value.trim();
    if (name.length < 2) return;

    this.playerName = name;
    Storage.set('playerName', name);

    document.getElementById('subName').textContent = 'Chào ' + name + '!';
    Rewards.updateUI();
    
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

  _switchMiniTab(target) {
    document.querySelectorAll('.mini-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.mini-content').forEach(c => c.classList.remove('active'));
    document.querySelector(`.mini-tab[data-mini="${target}"]`).classList.add('active');
    document.getElementById('mini' + target.charAt(0).toUpperCase() + target.slice(1)).classList.add('active');
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
      html += `<div class="day-header ${isToday ? 'today' : ''}">${dateLabel}</div>`;
      
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
