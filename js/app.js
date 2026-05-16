/* ═══════════════════════════════════════════════
   APP.JS - Khởi tạo & điều phối toàn bộ ứng dụng
   ═══════════════════════════════════════════════ */

const App = {
  allData: null,
  playerName: '',

  /** Khởi động */
  async init() {
    this._bindEvents();
    this._restoreSession();
    this.loadLeaderboard();
    await this._loadData();
  },

  /** Khôi phục session cũ nếu có */
  _restoreSession() {
    const data = Storage.load();
    if (data.playerName) {
      this.playerName = data.playerName;
      document.getElementById('nameInput').value = data.playerName;
      document.getElementById('btnStart').disabled = false;
    }
  },

  /** Tải data câu hỏi */
  async _loadData() {
    this.allData = await API.getAllData();
    if (this.playerName && this.allData) {
      this._renderSubjects();
    }
  },

  /** Tải BXH */
  async loadLeaderboard() {
    const lbDiv = document.getElementById('lbList');
    const data = await API.getLeaderboard();

    if (!data || data.length === 0) {
      lbDiv.innerHTML = '<div class="loading-text">Chưa có điểm nào.</div>';
      return;
    }

    const medals = ['🥇', '🥈', '🥉'];
    const rows = data.slice(0, 5).map((p, i) => {
      const icon = medals[i] || (i + 1);
      return `
        <tr>
          <td class="lb-rank">${icon}</td>
          <td class="lb-name"><b>${this._escape(p.name)}</b></td>
          <td class="lb-score"><b>${p.totalScore} ⭐</b></td>
        </tr>`;
    }).join('');

    lbDiv.innerHTML = `<table class="lb-table">${rows}</table>`;
  },

  /** Chuyển màn hình */
  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const id = 'screen' + name.charAt(0).toUpperCase() + name.slice(1);
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
  },

  /** Đăng ký tên + vào màn chính */
  _register() {
    const name = document.getElementById('nameInput').value.trim();
    if (name.length < 2) return;

    this.playerName = name;
    Storage.set('playerName', name);

    document.getElementById('subName').textContent = 'Chào con: ' + name;
    Rewards.updateUI();
    this.showScreen('subject');

    if (this.allData) this._renderSubjects();
  },

  /** Hiển thị danh sách môn */
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
          <div class="sub-meta">${s.topics.length} bài ôn tập</div>
        </div>`;
      card.addEventListener('click', () => this._chooseSubject(i));
      el.appendChild(card);
    });
  },

  /** Chọn môn → hiển thị chủ đề */
  _chooseSubject(idx) {
    const s = this.allData.subjects[idx];
    document.getElementById('topicMenuTitle').textContent = s.name;

    const list = document.getElementById('topicList');
    list.innerHTML = '';

    s.topics.forEach((t, tIdx) => {
      const card = document.createElement('div');
      card.className = 'topic-card';
      card.innerHTML = `
        <div class="topic-icon">${t.icon}</div>
        <div class="topic-name">${this._escape(t.name)}</div>`;
      card.addEventListener('click', () => Quiz.start(t));
      list.appendChild(card);
    });

    this.showScreen('topic');
  },

  /** Bind tất cả event listener */
  _bindEvents() {
    // Input tên
    const ni = document.getElementById('nameInput');
    const bs = document.getElementById('btnStart');
    ni.addEventListener('input', () => {
      bs.disabled = ni.value.trim().length < 2;
    });

    // Nút đăng ký
    bs.addEventListener('click', () => this._register());

    // Enter để submit
    ni.addEventListener('keypress', e => {
      if (e.key === 'Enter' && !bs.disabled) this._register();
    });

    // Nút Góp ý
    document.getElementById('btnFeedback').addEventListener('click', () => {
      window.open('https://forms.gle/hE3gV5Uy6UodzrZn7');
    });

    // Nút Đổi huy hiệu
    document.getElementById('btnRedeemBadge').addEventListener('click', () => {
      Rewards.redeemBadge();
    });

    // Nút Shop
    document.querySelectorAll('.shop-btn[data-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.dataset.item;
        const cost = parseInt(btn.dataset.cost);
        Rewards.buyItem(item, cost);
      });
    });

    // Nút Next câu hỏi
    document.getElementById('btnNext').addEventListener('click', () => Quiz.next());

    // Nút Tiếp tục (kết quả)
    document.getElementById('btnContinue').addEventListener('click', () => {
      this.showScreen('subject');
      Rewards.updateUI();
    });

    // Nút điều hướng
    document.querySelectorAll('.btn-nav[data-screen]').forEach(btn => {
      btn.addEventListener('click', () => this.showScreen(btn.dataset.screen));
    });
  },

  /** Chống XSS đơn giản */
  _escape(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
};

// Khởi động khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => App.init());
