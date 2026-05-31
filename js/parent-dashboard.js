// =============================================
// PARENT-DASHBOARD.JS
// Tách từ app.js - quản lý khu vực phụ huynh
// =============================================

const ParentDashboard = {

  // Truy cập App để lấy playerName, PIN_KEY, DEFAULT_PIN, showScreen
  get _app() { return window.App; },

  _openParentArea() {
    document.getElementById('pinInput').value = '';
    document.getElementById('pinError').classList.add('hidden');

    const isDefault = !localStorage.getItem(this._app.PIN_KEY);
    const hint = document.getElementById('pinHint');
    if (isDefault) {
      hint.textContent = '💡 Lần đầu truy cập: PIN mặc định là 1234. Hãy đổi sau khi vào.';
    } else {
      hint.textContent = '';
    }

    this._app.showScreen('pin');
    setTimeout(() => document.getElementById('pinInput').focus(), 100);
  },

  _checkPin() {
    const input = document.getElementById('pinInput').value.trim();
    const savedPin = localStorage.getItem(this._app.PIN_KEY) || this._app.DEFAULT_PIN;

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

    const savedPin = localStorage.getItem(this._app.PIN_KEY) || this._app.DEFAULT_PIN;
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

    localStorage.setItem(this._app.PIN_KEY, newPin);
    alert('Đã đổi PIN thành công!');
  },

  async _openDashboard() {
    this._app.showScreen('parent');

    if (!localStorage.getItem(this._app.PIN_KEY)) {
      setTimeout(() => alert('🔒 Bạn đang dùng PIN mặc định (1234). Hãy bấm "Đổi PIN" để đặt mã riêng cho an toàn hơn.'), 200);
    }

    const select = document.getElementById('parentNameSelect');
    select.innerHTML = '<option>Đang tải...</option>';

    const leaderboard = await API.getLeaderboard();
    const names = leaderboard.map(p => p.name);

    if (this._app.playerName && !names.includes(this._app.playerName)) {
      names.unshift(this._app.playerName);
    }

    if (names.length === 0) {
      select.innerHTML = '<option>Chưa có bé nào</option>';
      document.getElementById('summaryContent').innerHTML = '<div class="no-log">Chưa có dữ liệu học tập</div>';
      document.getElementById('dailyContent').innerHTML = '';
      return;
    }

    select.innerHTML = names.map(n => `<option value="${this._escape(n)}">${this._escape(n)}</option>`).join('');

    if (this._app.playerName && names.includes(this._app.playerName)) {
      select.value = this._app.playerName;
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
    const selectedName = document.getElementById('parentNameSelect') ? document.getElementById('parentNameSelect').value : this._app.playerName;
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
      ? Object.entries(subjectMap).sort((a, b) => b[1] - a[1]).map(([subject, count]) => `
        <div class="detail-subject-row">
          <div><b>${this._escape(subject)}</b><span>${count} câu</span></div>
          <div class="detail-bar"><i style="width:${Math.round(count / maxSubject * 100)}%"></i></div>
        </div>`).join('')
      : '<div class="no-log">Chưa có dữ liệu môn học.</div>';

    const d = new Date(dateKey);
    const dateLabel = d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();
    let rabbitText = accuracy >= 95
      ? 'Hôm nay bé làm rất tốt, độ chính xác rất cao.'
      : (accuracy >= 80 ? 'Hôm nay bé học ổn, có một vài câu cần xem lại.' : 'Hôm nay có khá nhiều câu sai, nên xem kỹ lại nội dung bài.');
    const topSubject = Object.entries(subjectMap).sort((a, b) => b[1] - a[1])[0];
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
        </div>`).join('')
        : '<div class="success-box">🎉 Trong các lượt đã ghi nhận trên máy này, bé không có câu sai nào ngày này.</div>')
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

  _escape(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
};
