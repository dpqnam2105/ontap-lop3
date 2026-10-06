// =============================================
// ARENA.JS — ⏱️ Đấu trường tính nhanh (nút riêng ở thanh bên)
// Vào thẳng Thử thách tốc độ bảng nhân chia, xem 5 danh hiệu con vật đã đạt.
// Dùng dữ liệu Lớp 3 (chủ đề tự sinh của js/table-gen.js) cho mọi bé.
// =============================================

const Arena = {
  async _drill() {
    let data = App.allData;
    const has = d => d && d.subjects && d.subjects.some(s => s.id === 'toan' && s.topics.some(t => t.drill));
    if (!has(data)) data = await App._loadGradeData('lop3');
    const s = data && data.subjects.find(x => x.id === 'toan');
    const t = s && s.topics.find(x => x.drill);
    return t ? { s, t } : null;
  },

  async render() {
    const host = document.getElementById('arenaBody');
    if (!host) return;
    host.innerHTML = '<div class="loading-text">Đang tải...</div>';
    const pair = await this._drill();
    if (!pair) { host.innerHTML = '<div class="loading-text">Chưa tải được câu hỏi, con thử lại nhé.</div>'; return; }
    const d = TableGen.getSpeed();
    const rank = TableGen.rankOf(d);
    const L = TableGen.LEVELS;
    const nextI = Math.min(rank + 1, L.length - 1);
    const esc = x => App._escape(x);
    const name = esc(App.playerName || '');
    const hero = rank >= 0
      ? `<div class="arena-hero-badge">${TableGen.badgeHTML(rank, true, 'lg')}</div>
         <div><div class="arena-kicker">Danh hiệu của ${name}</div><h2>${L[rank].icon} ${esc(L[rank].title)}</h2>
         <div class="arena-scope">${esc(TableGen.levelScopeText(rank, d) ? 'Đạt với ' + TableGen.levelScopeText(rank, d) : '')}</div>
         <p>${rank < L.length - 1 ? 'Mục tiêu tiếp theo: <b>' + L[nextI].icon + ' ' + esc(L[nextI].title) + '</b> — đúng & kịp giờ ' + TableGen.PASS_SCORE + '/20 câu ở mức ' + esc(L[nextI].name) + '.' : '🏆 Con đã đạt danh hiệu cao nhất! Thử giữ kỉ lục 20/20 nhé.'}</p></div>`
      : `<div class="arena-hero-badge">${TableGen.badgeHTML(0, false, 'lg')}</div>
         <div><div class="arena-kicker">Chào ${name}!</div><h2>Đấu trường tính nhanh</h2>
         <p>Vượt mức <b>🐌 Ốc sên</b> (đúng & kịp giờ ${TableGen.PASS_SCORE}/20 câu) để nhận danh hiệu đầu tiên <b>Ốc Sên Kiên Trì</b>.</p></div>`;
    const face = window.Decor ? Decor.equipped().face : 'mascot';
    const shelf = L.map((x, i) => {
      const got = d.level.passed[i];
      const best = d.level.best[i];
      const avatarBtn = got && window.Decor
        ? (face === x.id ? '<span class="asi-av on">✓ Đang là avatar</span>' : '<button type="button" class="asi-av" data-face="' + x.id + '">Dùng làm avatar</button>')
        : '';
      return `<div class="arena-shelf-item${got ? ' got' : ''}">${TableGen.badgeHTML(i, !!got, 'md')}
        <div class="asi-title">${esc(x.title)}</div>
        <div class="asi-sub">${got ? '🏅 ' + got.split('-').reverse().join('/') : (i <= d.level.unlocked ? (best != null ? 'kỉ lục ' + best + '/20' : 'chưa chơi') : '🔒 chưa mở')}</div>${got ? this._scopeLines(i, d) : ''}${avatarBtn}</div>`;
    }).join('');
    host.innerHTML = `
      <div class="arena-hero card">${hero}</div>
      <div class="arena-shelf card"><div class="arena-sec-title">🏅 Bộ huy hiệu</div><div class="arena-shelf-row">${shelf}</div></div>
      <div class="arena-setup"></div>`;
    host.querySelector('.arena-setup').appendChild(App._renderDrillCard(pair.s, pair.t, null, { arena: true }));
    host.querySelectorAll('.asi-av[data-face]').forEach(b => b.addEventListener('click', () => {
      if (Decor.equipFace(b.dataset.face)) { this.render(); try { if (window.Today) Today.render(); } catch (e) { /* bỏ qua */ } }
    }));
  },

  /** Các phạm vi đã đạt của một mức (mỗi lượt đạt một dòng, không gộp). Huy hiệu cũ: "chưa ghi nhận phạm vi". */
  _scopeLines(i, d) {
    const esc = x => App._escape(x);
    const list = TableGen.scopesOf(i, d);
    if (!list.length) return '<div class="asi-scope old">chưa ghi nhận phạm vi</div>';
    const best = TableGen.bestScope(i, d);
    const rest = list.filter(x => x !== best).sort((a, b) => (b.t.length - a.t.length) || String(b.at).localeCompare(String(a.at)));
    return '<div class="asi-scope">' + esc(TableGen.scopeText(best)) + '</div>' +
      (rest.length ? '<div class="asi-scope more" title="' + esc(rest.map(x => TableGen.scopeText(x)).join(' | ')) + '">+ ' + rest.length + ' phạm vi khác</div>' : '');
  },

  /** Khu huy hiệu trong Bộ sưu tập. */
  renderCollection() {
    const area = document.getElementById('collectionStickerArea');
    if (!area || !window.TableGen) return;
    let box = document.getElementById('arenaCollection');
    if (!box) {
      box = document.createElement('div');
      box.id = 'arenaCollection';
      box.className = 'arena-shelf card';
      area.parentNode.insertBefore(box, area);
    }
    const d = TableGen.getSpeed();
    box.innerHTML = '<div class="arena-sec-title">⏱️ Huy hiệu Đấu trường tính nhanh</div><div class="arena-shelf-row">' +
      TableGen.LEVELS.map((x, i) => `<div class="arena-shelf-item${d.level.passed[i] ? ' got' : ''}">${TableGen.badgeHTML(i, !!d.level.passed[i], 'md')}<div class="asi-title">${App._escape(x.title)}</div>${d.level.passed[i] ? this._scopeLines(i, d) : ''}</div>`).join('') +
      '</div>';
  },

  /** Danh hiệu cao nhất hiện cạnh danh hiệu Level trong khung hồ sơ. */
  renderChip() {
    const t = document.getElementById('title-area');
    if (!t || !window.TableGen || !App.playerName) return;
    let chip = document.getElementById('arenaTitleChip');
    const rank = TableGen.rankOf();
    if (rank < 0) { if (chip) chip.remove(); return; }
    if (!chip) {
      chip = document.createElement('div');
      chip.id = 'arenaTitleChip';
      chip.className = 'arena-title-chip';
      chip.addEventListener('click', () => App.showScreen('arena'));
      t.parentNode.insertBefore(chip, t.nextSibling);
    }
    const L = TableGen.LEVELS[rank];
    const sc = TableGen.levelScopeText(rank, null, true);
    chip.textContent = L.icon + ' ' + L.title + (sc ? ' · ' + sc : '');
    chip.title = 'Danh hiệu Đấu trường' + (TableGen.levelScopeText(rank) ? ' — ' + TableGen.levelScopeText(rank) : '');
  }
};

window.Arena = Arena;
