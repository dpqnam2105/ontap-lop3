/* ═══════════════════════════════════════════════
   APP.JS v2 - Khởi tạo & điều phối
   ═══════════════════════════════════════════════ */

const App = {
  allData: null,
  playerName: '',

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
    if (this.playerName && this.allData) {
      this._renderSubjects();
    }
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
      return `
        <tr>
          <td class="lb-rank">${icon}</td>
          <td class="lb-name"><b>${this._escape(p.name)}</b></td>
          <td class="lb-score"><b>${p.totalScore} ⭐</b></td>
        </tr>`;
    }).join('');

    lbDiv.innerHTML = `<table class="lb-table">${rows}</table>`;
  },

  showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const id = 'screen' + name.charAt(0).toUpperCase() + name.slice(1);
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
  },

  _register() {
    const name = document.getElementById('nameInput').value.trim();
    if (name.length < 2) return;

    this.playerName = name;
    Storage.set('playerName', name);

    document.getElementById('subName').textContent = 'Chào con: ' + name;
    Rewards.updateUI();
    this.showScreen('subject');

    if (this.allData) {
      this._renderSubjects();
    } else {
      // Nếu data chưa load xong, hiện loading
      document.getElementById('subjectList').innerHTML = 
        '<div class="loading-text">Đang tải bài tập... ⏳</div>';
      // Đợi data load xong rồi render
      const checkData = setInterval(() => {
        if (this.allData) {
          clearInterval(checkData);
          this._renderSubjects();
        }
      }, 200);
    }
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
          <div class="sub-meta">${s.topics.length} bài ôn tập</div>
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

    document.getElementById('btnFeedback').addEventListener('click', () => {
      window.open('https://forms.gle/hE3gV5Uy6UodzrZn7');
    });

    document.getElementById('btnRedeemBadge').addEventListener('click', () => {
      Rewards.redeemBadge();
    });

    document.querySelectorAll('.shop-btn[data-item]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.dataset.item;
        const cost = parseInt(btn.dataset.cost);
        Rewards.buyItem(item, cost);
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

    // Footer: Giới thiệu
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
