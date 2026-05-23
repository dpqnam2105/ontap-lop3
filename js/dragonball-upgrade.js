// Dragonball Upgrade v3 - Rabbit Academy
// Fix: shop/sidebar buttons + collection screen + leaderboard grade tabs
(function () {
  'use strict';

  const DB_KEY = 'rabbit_dragonball_v3';
  const STORAGE_KEY = 'khoBaiTap_v1';
  const balls = [1,2,3,4,5,6,7].map(n => ({
    id: 'dragonball_' + n,
    n,
    name: 'Ngọc rồng ' + n + ' sao',
    price: 30 + n * 10,
    icon: ballIcon(n)
  }));
  const shenron = { id: 'shenron_sticker', name: 'Sticker Rồng Thần', price: 0, icon: '🐉' };

  function ballIcon(n) {
    return '<span class="db-ball-inner">' + '★'.repeat(n) + '</span>';
  }

  function loadBase() {
    try { return { stars:0, inventory:[], totalCorrect:0, streak:0, level:1, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
    catch(e) { return { stars:0, inventory:[], totalCorrect:0, streak:0, level:1 }; }
  }
  function saveBase(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch(e) {}
  }
  function loadDB() {
    try { return { owned:[], ...JSON.parse(localStorage.getItem(DB_KEY) || '{}') }; }
    catch(e) { return { owned:[] }; }
  }
  function saveDB(db) { localStorage.setItem(DB_KEY, JSON.stringify(db)); }
  function owns(id) { return loadDB().owned.includes(id); }
  function ownedBalls() { return balls.filter(b => owns(b.id)); }
  function hasAllBalls() { return ownedBalls().length === 7; }
  function maybeUnlockShenron() {
    const db = loadDB();
    if (hasAllBalls() && !db.owned.includes(shenron.id)) {
      db.owned.push(shenron.id);
      saveDB(db);
      toast('🐉 Đủ 7 viên ngọc! Con đã nhận Sticker Rồng Thần!');
    }
  }

  function toast(msg) {
    let t = document.querySelector('.db-toast');
    if (!t) { t = document.createElement('div'); t.className = 'db-toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2600);
  }

  function refreshAll() {
    maybeUnlockShenron();
    injectHomeCards();
    upgradeLeaderboard();
    bindButtons();
  }

  function findCardByText(text) {
    const candidates = Array.from(document.querySelectorAll('section, article, .card, .panel, .leaderboard-card, div'));
    return candidates.find(el => el.textContent && el.textContent.includes(text));
  }

  function injectHomeCards() {
    if (document.getElementById('db-home-upgrade')) { updateHomeCards(); return; }
    const leaderboard = findCardByText('Bảng Xếp Hạng');
    const parent = leaderboard && leaderboard.parentElement;
    if (!parent) return;
    const wrap = document.createElement('div');
    wrap.id = 'db-home-upgrade';
    wrap.className = 'db-home-upgrade';
    wrap.innerHTML = homeCardsHTML();
    parent.insertAdjacentElement('afterend', wrap);
    updateHomeCards();
  }

  function homeCardsHTML() {
    return '<div class="db-mini-card">' +
      '<h3>🎯 Nhiệm vụ hôm nay</h3>' +
      '<p>✅ Làm 5 câu đúng <b>+5 ⭐</b></p>' +
      '<p>🔥 Học 1 lượt bất kỳ <b>+XP</b></p>' +
      '<p>🐉 Sưu tập ngọc rồng <button class="db-link-btn" data-db-open="shop">Shop</button></p>' +
      '</div>' +
      '<div class="db-mini-card db-progress-card"><h3>📈 Tiến bộ học tập</h3><div class="db-stat-grid">' +
      '<div><b data-db-streak>0</b><span>🔥 Chuỗi ngày</span></div>' +
      '<div><b data-db-stars>0</b><span>⭐ Tổng sao</span></div>' +
      '<div><b data-db-correct>0</b><span>🧠 Câu đúng</span></div>' +
      '<div><b>#1</b><span>🏆 Lớp 2</span></div>' +
      '</div></div>' +
      '<div class="db-mini-card"><div class="db-card-head"><h3>🐉 Bộ sưu tập ngọc rồng</h3><button class="db-green-btn" data-db-open="shop">Mở shop</button></div>' +
      '<div class="db-owned-count" data-db-count>0/7 viên</div><div class="db-ball-row" data-db-balls></div>' +
      '<div class="db-shenron-note" data-db-note>Thu thập đủ 7 viên để nhận Sticker Rồng Thần.</div></div>';
  }

  function updateHomeCards() {
    const base = loadBase();
    const set = (sel, val) => { const el = document.querySelector(sel); if (el) el.textContent = val; };
    set('[data-db-streak]', base.streak || 0);
    set('[data-db-stars]', base.stars || 0);
    set('[data-db-correct]', base.totalCorrect || 0);
    const count = ownedBalls().length;
    set('[data-db-count]', count + '/7 viên');
    const row = document.querySelector('[data-db-balls]');
    if (row) row.innerHTML = balls.map(b => '<div class="db-ball ' + (owns(b.id) ? 'owned' : '') + '">' + b.icon + '</div>').join('');
    const note = document.querySelector('[data-db-note]');
    if (note) note.textContent = hasAllBalls() ? '🐉 Đã mở khóa Sticker Rồng Thần!' : 'Thu thập đủ 7 viên để nhận Sticker Rồng Thần.';
  }

  function upgradeLeaderboard() {
    const card = findCardByText('Bảng Xếp Hạng');
    if (!card || card.dataset.dbLeaderboardDone) return;
    card.dataset.dbLeaderboardDone = '1';
    const original = Array.from(card.querySelectorAll('tr, li, p, div')).slice(0, 12).map(x => x.outerHTML).join('');
    card.innerHTML = '<div class="db-leader-head"><h3>🏆 Bảng Xếp Hạng</h3></div>' +
      '<div class="db-grade-tabs">' + [2,3,4,5].map(g => '<button class="' + (g===2?'active':'locked') + '" data-grade="' + g + '">Lớp ' + g + (g===2?'':' 🔒') + '</button>').join('') + '</div>' +
      '<div class="db-leader-body" data-db-leader-body>' + (original || '<p>Đang tải xếp hạng...</p>') + '</div>';
    card.addEventListener('click', function(e){
      const btn = e.target.closest('[data-grade]'); if (!btn) return;
      card.querySelectorAll('[data-grade]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const body = card.querySelector('[data-db-leader-body]');
      if (btn.dataset.grade === '2') body.innerHTML = original || '<p>Đang tải xếp hạng...</p>';
      else body.innerHTML = '<div class="db-coming-soon">🔒 Bảng xếp hạng Lớp ' + btn.dataset.grade + ' sắp mở.</div>';
    });
  }

  function bindButtons() {
    document.querySelectorAll('[data-db-open]').forEach(btn => {
      if (btn.dataset.dbBound) return; btn.dataset.dbBound = '1';
      btn.addEventListener('click', e => { e.preventDefault(); openScreen(btn.dataset.dbOpen); });
    });
    Array.from(document.querySelectorAll('button, a, .nav-item')).forEach(el => {
      if (el.dataset.dbSideBound) return;
      const txt = (el.textContent || '').trim().toLowerCase();
      if (txt.includes('shop') || txt.includes('cửa hàng') || txt.includes('mở shop')) {
        el.dataset.dbSideBound = '1'; el.addEventListener('click', e => { e.preventDefault(); openScreen('shop'); });
      }
      if (txt.includes('bộ sưu tập') || txt.includes('túi đồ')) {
        el.dataset.dbSideBound = '1'; el.addEventListener('click', e => { e.preventDefault(); openScreen('collection'); });
      }
    });
  }

  function openScreen(type) {
    let modal = document.getElementById('db-modal');
    if (!modal) {
      modal = document.createElement('div'); modal.id = 'db-modal'; modal.className = 'db-modal'; document.body.appendChild(modal);
      modal.addEventListener('click', e => { if (e.target.id === 'db-modal' || e.target.closest('[data-db-close]')) closeScreen(); });
    }
    modal.innerHTML = '<div class="db-screen"><button class="db-close" data-db-close>×</button>' + (type === 'collection' ? collectionHTML() : shopHTML()) + '</div>';
    modal.classList.add('show');
    modal.querySelectorAll('[data-buy]').forEach(btn => btn.addEventListener('click', () => buyItem(btn.dataset.buy)));
  }
  function closeScreen(){ const m = document.getElementById('db-modal'); if (m) m.classList.remove('show'); }

  function shopHTML() {
    const base = loadBase();
    return '<h2>🛍 Shop Ngọc Rồng</h2><p class="db-sub">Dùng sao để mua sticker/ngọc rồng. Đủ 7 viên sẽ nhận Rồng Thần.</p>' +
      '<div class="db-wallet">⭐ Sao hiện có: <b>' + (base.stars || 0) + '</b></div>' +
      '<div class="db-shop-grid">' + balls.map(b => itemCard(b, base.stars || 0)).join('') + '</div>' +
      '<h3>🎁 Phần thưởng đặc biệt</h3>' + itemCard(shenron, base.stars || 0, true);
  }
  function itemCard(item, stars, special) {
    const owned = owns(item.id);
    const locked = special && !hasAllBalls();
    const canBuy = !owned && !locked && stars >= item.price;
    return '<div class="db-shop-item ' + (owned?'owned':'') + (locked?' locked':'') + '">' +
      '<div class="db-item-icon">' + item.icon + '</div><b>' + item.name + '</b>' +
      '<span>' + (special ? (locked ? 'Cần đủ 7 viên ngọc' : 'Đã mở khóa') : item.price + ' ⭐') + '</span>' +
      '<button data-buy="' + item.id + '" ' + (!canBuy ? 'disabled' : '') + '>' + (owned ? 'Đã sở hữu' : (locked ? 'Chưa mở' : 'Mua')) + '</button>' +
      '</div>';
  }
  function collectionHTML() {
    return '<h2>🎒 Bộ sưu tập của con</h2><p class="db-sub">Ngọc rồng đã sưu tập và sticker đặc biệt.</p>' +
      '<div class="db-collection-big">' + balls.map(b => '<div class="db-collection-item ' + (owns(b.id)?'owned':'') + '"><div class="db-ball big">' + b.icon + '</div><b>' + b.name + '</b><span>' + (owns(b.id)?'Đã có':'Chưa có') + '</span></div>').join('') + '</div>' +
      '<div class="db-shenron-card ' + (owns(shenron.id)?'owned':'locked') + '"><div>🐉</div><b>Sticker Rồng Thần</b><span>' + (owns(shenron.id)?'Đã nhận':'Thu thập đủ 7 viên để nhận') + '</span></div>';
  }

  function buyItem(id) {
    const item = balls.find(b => b.id === id) || shenron;
    const base = loadBase();
    const db = loadDB();
    if (db.owned.includes(id)) return toast('Con đã có món này rồi.');
    if (id === shenron.id && !hasAllBalls()) return toast('Cần đủ 7 viên ngọc trước nhé.');
    if ((base.stars || 0) < item.price) return toast('Chưa đủ sao để mua món này.');
    base.stars = Math.max(0, (base.stars || 0) - item.price);
    db.owned.push(id);
    saveBase(base); saveDB(db); maybeUnlockShenron(); toast('Đã mua ' + item.name + '!');
    openScreen('shop'); refreshAll();
    document.dispatchEvent(new Event('rabbit-storage-updated'));
  }

  document.addEventListener('DOMContentLoaded', function(){ setTimeout(refreshAll, 500); setTimeout(refreshAll, 1500); });
  document.addEventListener('click', function(){ setTimeout(refreshAll, 200); }, true);
  window.RabbitDragonballUpgrade = { refresh: refreshAll, openShop: () => openScreen('shop'), openCollection: () => openScreen('collection') };
})();
