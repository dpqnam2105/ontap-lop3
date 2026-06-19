// =============================================
// PARENT-DASHBOARD.JS
// Tách từ app.js - quản lý khu vực phụ huynh
// =============================================

const ParentDashboard = {

  // Truy cập App để lấy playerName, PIN_KEY, DEFAULT_PIN, showScreen

  _openParentArea() {
    document.getElementById('pinInput').value = '';
    document.getElementById('pinError').classList.add('hidden');

    const isDefault = !localStorage.getItem(App.PIN_KEY);
    const hint = document.getElementById('pinHint');
    if (isDefault) {
      hint.textContent = '💡 Lần đầu truy cập: PIN mặc định là 1234. Hãy đổi sau khi vào.';
    } else {
      hint.textContent = '';
    }

    App.showScreen('pin');
    setTimeout(() => document.getElementById('pinInput').focus(), 100);
  },

  _checkPin() {
    const input = document.getElementById('pinInput').value.trim();
    const savedPin = localStorage.getItem(App.PIN_KEY) || App.DEFAULT_PIN;

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

    const savedPin = localStorage.getItem(App.PIN_KEY) || App.DEFAULT_PIN;
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

    localStorage.setItem(App.PIN_KEY, newPin);
    alert('Đã đổi PIN thành công!');
  },

  async _openDashboard() {
    App.showScreen('parent');

    if (!localStorage.getItem(App.PIN_KEY)) {
      setTimeout(() => alert('🔒 Bạn đang dùng PIN mặc định (1234). Hãy bấm "Đổi PIN" để đặt mã riêng cho an toàn hơn.'), 200);
    }

    const select = document.getElementById('parentNameSelect');
    select.innerHTML = '<option>Đang tải...</option>';

    const leaderboard = await API.getLeaderboard();
    const names = leaderboard.map(p => p.name);

    if (App.playerName && !names.includes(App.playerName)) {
      names.unshift(App.playerName);
    }

    if (names.length === 0) {
      select.innerHTML = '<option>Chưa có bé nào</option>';
      document.getElementById('summaryContent').innerHTML = '<div class="no-log">Chưa có dữ liệu học tập</div>';
      document.getElementById('dailyContent').innerHTML = '';
      return;
    }

    select.innerHTML = names.map(n => `<option value="${this._escape(n)}">${this._escape(n)}</option>`).join('');

    if (App.playerName && names.includes(App.playerName)) {
      select.value = App.playerName;
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

  // Tra ten chu de that tu du lieu mon hoc; khong tim thay thi lam dep id
  _topicName(topicId) {
    try {
      if (window.App && App.allData && App.allData.subjects) {
        for (const s of App.allData.subjects) {
          const t = (s.topics || []).find(t => (t.id || t.name) === topicId);
          if (t) return t.name;
        }
      }
    } catch (e) { /* bo qua, dung fallback */ }
    return String(topicId).replace(/_/g, ' ');
  },

  // Map mon hoc -> icon + mau + ten chuan. Dung chung cho ca tom tat va nhat ky.
  // Uu tien doc icon that tu App.allData; khong co thi dung bang mac dinh.
  _subjectMeta(rawName) {
    const name = String(rawName || '').trim();
    const lower = name.toLowerCase();
    // Bang mac dinh theo id chuan cua 4 mon
    const table = {
      'toan-tieng-anh': { id: 'toan-tieng-anh', name: 'Toán Tiếng Anh', icon: '🧮', color: '#7c3aed' },
      'toan': { id: 'toan', name: 'Toán', icon: '🔢', color: '#1d72f3' },
      'tieng-viet': { id: 'tieng-viet', name: 'Tiếng Việt', icon: '📖', color: '#e8590c' },
      'tieng-anh': { id: 'tieng-anh', name: 'Tiếng Anh', icon: '🌍', color: '#16a34a' }
    };
    // Nhan dien id tu ten hien thi (luu y: kiem "toan tieng anh" TRUOC "toan")
    let key = null;
    if (lower.indexOf('toán tiếng anh') !== -1 || lower.indexOf('toan tieng anh') !== -1) key = 'toan-tieng-anh';
    else if (lower.indexOf('tiếng việt') !== -1 || lower.indexOf('tieng viet') !== -1) key = 'tieng-viet';
    else if (lower.indexOf('tiếng anh') !== -1 || lower.indexOf('tieng anh') !== -1) key = 'tieng-anh';
    else if (lower.indexOf('toán') !== -1 || lower.indexOf('toan') !== -1) key = 'toan';

    const base = key ? table[key] : { id: lower, name: name || 'Khác', icon: '📘', color: '#64748b' };
    // Neu App.allData co icon that thi dung icon do cho dung voi man hinh chinh
    try {
      if (window.App && App.allData && App.allData.subjects) {
        const s = App.allData.subjects.find(x => x.id === base.id || (x.name || '').trim() === name);
        if (s && s.icon) return { ...base, icon: s.icon, name: s.name || base.name };
      }
    } catch (e) { /* dung base */ }
    return base;
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

    // Wrong history insights
    const mostWrong = Storage.getRecentWrong(7, 5);
    const wrongBySubject = Storage.getWrongBySubject();
    const unresolved = Storage.getUnresolvedWrong(5);
    const wrongByTopic = Storage.getWrongByTopic(3);

    const subjectNames = { toan: 'Toán', 'tieng-viet': 'Tiếng Việt', 'tieng-anh': 'Tiếng Anh', 'toan-tieng-anh': 'Toán Tiếng Anh' };
    const weakestSubject = Object.entries(wrongBySubject)
      .sort((a, b) => b[1].wrongCount - a[1].wrongCount)[0];
    const repeatWrong = mostWrong.filter(q => q.wrongCount >= 2);

    // Cau tom tat bang loi - de phu huynh doc 1 cau la nam duoc
    const childName = (document.getElementById('parentNameSelect') && document.getElementById('parentNameSelect').value)
      ? document.getElementById('parentNameSelect').value
      : (App.playerName || 'Bé');
    const dayCount = new Set(recent.map(l => {
      const d = new Date(l.time);
      return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    })).size;
    let plain = `Tuần này, <b>${this._escape(childName)}</b> học <b>${dayCount}</b> ngày, tổng <b>${totalMin}</b> phút, làm đúng <b>${accuracy}%</b> số câu.`;
    if (weakestSubject) {
      plain += ` Môn cần chú ý: <b>${subjectNames[weakestSubject[0]] || weakestSubject[0]}</b>.`;
    } else if (totalQ > 0 && accuracy >= 90) {
      plain += ` Bé đang học rất đều, không có môn nào đáng lo. 👏`;
    }

    let html = `
      <div class="plain-summary">${plain}</div>
      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-card-icon">📚</div>
          <div class="summary-card-value">${totalSessions}</div>
          <div class="summary-card-label">Số buổi học</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-icon">⏱️</div>
          <div class="summary-card-value">${totalMin}</div>
          <div class="summary-card-label">Phút</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-icon">✅</div>
          <div class="summary-card-value">${totalCorrect}/${totalQ}</div>
          <div class="summary-card-label">Câu làm đúng</div>
        </div>
        <div class="summary-card">
          <div class="summary-card-icon">🎯</div>
          <div class="summary-card-value">${accuracy}%</div>
          <div class="summary-card-label">Làm đúng</div>
        </div>
      </div>`;

    if (weakestSubject) {
      const [sid, stat] = weakestSubject;
      html += `
      <div class="insight-box insight-warning">
        <div class="insight-title">⚠️ Môn cần chú ý tuần này</div>
        <div class="insight-body"><b>${subjectNames[sid] || sid}</b> — ${stat.wrongCount} lần sai trên ${stat.questionCount} câu khác nhau</div>
      </div>`;
    }

    if (wrongByTopic.length) {
      const topicLabels = wrongByTopic.map(t =>
        `<span class="topic-tag">${this._escape(this._topicName(t.topicId))} (${t.wrongCount}×)</span>`
      ).join(' ');
      html += `
      <div class="insight-box insight-info">
        <div class="insight-title">📌 Chủ đề cần ôn lại</div>
        <div class="insight-body">${topicLabels}</div>
      </div>`;
    }

    if (repeatWrong.length) {
      const shown = repeatWrong.slice(0, 3);
      const rest = repeatWrong.length - shown.length;
      html += `
      <div class="insight-box insight-danger">
        <div class="insight-title">🔁 Câu hay sai lại (${repeatWrong.length} câu)</div>
        <div class="insight-list">
          ${shown.map(q => `
            <div class="insight-item">
              <span class="wrong-badge">${q.wrongCount}×</span>
              <span class="wrong-q">${this._escape(q.question || q.questionId)}</span>
              ${q.lastCorrect && q.lastCorrect >= q.lastWrong
                ? '<span class="resolved-tag">✅ đã sửa</span>'
                : '<span class="unresolved-tag">❌ chưa sửa</span>'}
            </div>`).join('')}
          ${rest > 0 ? `<div class="insight-item insight-rest">… và ${rest} câu khác (xem trong nhật ký từng ngày)</div>` : ''}
        </div>
      </div>`;
    } else if (unresolved.length) {
      html += `
      <div class="insight-box insight-danger">
        <div class="insight-title">❌ Chưa sửa được (${unresolved.length} câu)</div>
        <div class="insight-list">
          ${unresolved.slice(0, 3).map(q => `
            <div class="insight-item">
              <span class="wrong-badge">${q.wrongCount}×</span>
              <span class="wrong-q">${this._escape(q.question || q.questionId)}</span>
            </div>`).join('')}
        </div>
      </div>`;
    }

    this._ensureInsightStyles();
    document.getElementById('summaryContent').innerHTML = html;
  },

  _ensureInsightStyles() {
    if (document.getElementById('insightStyles')) return;
    const style = document.createElement('style');
    style.id = 'insightStyles';
    style.textContent = `
      .insight-box{border-radius:14px;padding:12px 16px;margin-top:12px}
      .insight-warning{background:#fff7ed;border:1px solid #fed7aa}
      .insight-info{background:#eff6ff;border:1px solid #bfdbfe}
      .insight-danger{background:#fef2f2;border:1px solid #fecaca}
      .insight-title{font-weight:800;font-size:.9rem;margin-bottom:6px}
      .insight-body{font-size:.88rem;color:#374151;line-height:1.5}
      .insight-list{display:flex;flex-direction:column;gap:6px}
      .insight-item{display:flex;align-items:flex-start;gap:8px;font-size:.85rem}
      .wrong-badge{background:#ef4444;color:#fff;border-radius:999px;padding:1px 7px;font-weight:800;font-size:.78rem;white-space:nowrap;flex-shrink:0}
      .wrong-q{color:#374151;flex:1;line-height:1.4}
      .resolved-tag{color:#16a34a;font-weight:700;font-size:.78rem;white-space:nowrap;flex-shrink:0}
      .unresolved-tag{color:#dc2626;font-weight:700;font-size:.78rem;white-space:nowrap;flex-shrink:0}
      .topic-tag{display:inline-block;background:#dbeafe;color:#1e40af;border-radius:999px;padding:2px 10px;font-size:.82rem;margin:2px;font-weight:700}
      .plain-summary{background:#f0f9ff;border:1px solid #bae6fd;border-radius:14px;padding:14px 16px;margin-bottom:14px;font-size:.95rem;line-height:1.6;color:#0c4a6e}
      .plain-summary b{color:#075985}
      /* Nhom theo mon trong nhat ky */
      .subj-group{border:1px solid #e6eef9;border-radius:14px;margin:8px 0;overflow:hidden;background:#fff}
      .subj-head{display:flex;align-items:center;gap:10px;padding:13px 14px;cursor:pointer;border-left:5px solid var(--subj-color,#94a3b8);transition:background .12s;-webkit-tap-highlight-color:transparent;flex-wrap:wrap}
      .subj-head:hover,.subj-head:active{background:#f4f8ff}
      .subj-icon{font-size:1.4rem;flex-shrink:0}
      .subj-name{font-weight:800;color:#1e293b;flex-shrink:0}
      .subj-stat{color:#475569;font-size:.9rem;flex:1;min-width:120px}
      .subj-stat b{font-weight:800}
      .subj-expand{display:flex;align-items:center;gap:5px;background:#eef4ff;color:#1769e0;border-radius:999px;padding:7px 14px;font-weight:800;font-size:.84rem;white-space:nowrap;flex-shrink:0;margin-left:auto}
      .subj-caret{transition:transform .2s;display:inline-block}
      .subj-body{display:none;padding:0 14px 10px 14px}
      .subj-group.subj-open .subj-body{display:block}
      .subj-group.subj-open .subj-caret{transform:rotate(180deg)}
      .subj-group.subj-open .subj-expand-text::after{content:''}
      .good{color:#16a34a}.warning{color:#d97706}.bad{color:#dc2626}
    `;
    document.head.appendChild(style);
  },

  _renderDailyLog(logs) {
    this._ensureInsightStyles();
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
    const MAX_DAYS = 7;    // mac dinh chi hien 7 ngay gan nhat, ngay cu hon an sau nut

    sortedDates.forEach((dateKey, dayIdx) => {
      const isToday = dateKey === todayKey;
      const d = new Date(dateKey);
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      const dateLabel = isToday
        ? '📅 Hôm nay - ' + d.getDate() + '/' + (d.getMonth() + 1)
        : days[d.getDay()] + ', ' + d.getDate() + '/' + (d.getMonth() + 1) + '/' + d.getFullYear();

      // Tom tat ngay: so luot, tong dung/tong cau, tong phut
      const dayLogs = byDate[dateKey];
      const dQ = dayLogs.reduce((s, l) => s + (l.total || 0), 0);
      const dC = dayLogs.reduce((s, l) => s + (l.correct || 0), 0);
      const dMin = Math.round(dayLogs.reduce((s, l) => s + (l.duration || 0), 0) / 60);
      const dRatio = dQ > 0 ? dC / dQ : 0;
      const dClass = dRatio >= 0.8 ? 'good' : (dRatio >= 0.5 ? 'warning' : 'bad');
      const summary = `${dayLogs.length} lượt · <b class="${dClass}">${dC}/${dQ}</b> câu${dMin > 0 ? ' · ' + dMin + ' phút' : ''}`;

      // Chi co hom nay mo san, cac ngay khac gap lai; ngay cu hon 7 ngay an han
      const oldDay = dayIdx >= MAX_DAYS ? ' day-old hidden' : '';
      html += `<div class="day-group ${isToday ? '' : 'day-collapsed'}${oldDay}" data-day="${dateKey}">`;
      html += `<div class="day-header ${isToday ? 'today' : ''}" data-toggle="${dateKey}">
        <span class="day-caret">▾</span>
        <span class="day-title">${dateLabel}</span>
        <span class="day-summary">${summary}</span>
        <button type="button" class="day-detail-btn" data-date="${dateKey}">🔎 Chi tiết</button>
      </div>`;
      html += `<div class="day-body">`;

      // Gom cac luot trong ngay theo MON
      const bySubject = {};
      dayLogs.forEach(log => {
        const meta = this._subjectMeta(log.subject);
        if (!bySubject[meta.id]) bySubject[meta.id] = { meta, logs: [] };
        bySubject[meta.id].logs.push(log);
      });

      // Sap xep mon theo so cau lam nhieu nhat
      const subjectGroups = Object.values(bySubject).sort((a, b) => {
        const qa = a.logs.reduce((s, l) => s + (l.total || 0), 0);
        const qb = b.logs.reduce((s, l) => s + (l.total || 0), 0);
        return qb - qa;
      });

      subjectGroups.forEach((grp, gi) => {
        const sLogs = grp.logs;
        const sQ = sLogs.reduce((s, l) => s + (l.total || 0), 0);
        const sC = sLogs.reduce((s, l) => s + (l.correct || 0), 0);
        const sMin = Math.round(sLogs.reduce((s, l) => s + (l.duration || 0), 0) / 60);
        const sRatio = sQ > 0 ? sC / sQ : 0;
        const sClass = sRatio >= 0.8 ? 'good' : (sRatio >= 0.5 ? 'warning' : 'bad');
        const groupId = dateKey + '__' + grp.meta.id;
        const minStr = sMin > 0 ? ` · ${sMin} phút` : '';

        // Ca dong mon la 1 nut bam duoc; co chu "Xem N luot" + mui ten
        html += `
          <div class="subj-group" data-subjgroup="${groupId}">
            <div class="subj-head" data-subjtoggle="${groupId}" style="--subj-color:${grp.meta.color}">
              <span class="subj-icon">${grp.meta.icon}</span>
              <span class="subj-name">${this._escape(grp.meta.name)}</span>
              <span class="subj-stat"><b class="${sClass}">${sC}/${sQ}</b> câu${minStr}</span>
              <span class="subj-expand"><span class="subj-expand-text">Xem ${sLogs.length} lượt</span><span class="subj-caret">▾</span></span>
            </div>
            <div class="subj-body">`;

        sLogs.forEach(log => {
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
                <span class="topic">${this._escape(log.topic)}</span>
              </div>
              <div class="log-score ${ratioClass}">${log.correct}/${log.total}</div>
            </div>`;
        });

        html += `</div></div>`;
      });

      html += `</div></div>`;
    });

    if (sortedDates.length > MAX_DAYS) {
      html += `<button type="button" class="log-more-btn" id="moreDaysBtn">Xem ${sortedDates.length - MAX_DAYS} ngày trước đó ▾</button>`;
    }

    document.getElementById('dailyContent').innerHTML = html;
    const moreDays = document.getElementById('moreDaysBtn');
    if (moreDays) {
      moreDays.addEventListener('click', () => {
        document.querySelectorAll('.day-group.day-old').forEach(el => el.classList.remove('hidden'));
        moreDays.remove();
      });
    }
    document.querySelectorAll('.day-detail-btn[data-date]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this._showDayDetails(btn.dataset.date, byDate[btn.dataset.date] || []);
      });
    });
    // Bam vao header ngay de gap / mo
    document.querySelectorAll('.day-header[data-toggle]').forEach(h => {
      h.addEventListener('click', () => h.closest('.day-group').classList.toggle('day-collapsed'));
    });
    // Bam ca dong MON de xoe / thu gon cac luot ben trong
    document.querySelectorAll('.subj-head[data-subjtoggle]').forEach(head => {
      head.addEventListener('click', () => {
        head.closest('.subj-group').classList.toggle('subj-open');
      });
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
    const selectedName = document.getElementById('parentNameSelect') ? document.getElementById('parentNameSelect').value : App.playerName;
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
      ? Object.entries(subjectMap).sort((a, b) => b[1] - a[1]).map(([subject, count]) => {
        const meta = this._subjectMeta(subject);
        return `
        <div class="detail-subject-row">
          <div><b>${meta.icon} ${this._escape(meta.name)}</b><span>${count} câu</span></div>
          <div class="detail-bar"><i style="width:${Math.round(count / maxSubject * 100)}%;background:${meta.color}"></i></div>
        </div>`;
      }).join('')
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
          <div class="summary-card"><div class="summary-card-icon">📚</div><div class="summary-card-value">${totalSessions}</div><div class="summary-card-label">Số buổi học</div></div>
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
