// Dragon Ball + Grade Leaderboard + Home Dashboard Upgrade
// Drop this file into js/ and include it AFTER quiz.js and app.js.
(function () {
  'use strict';

  const CFG = {
    grades: [
      { id: 'lop2', label: 'Lớp 2', open: true },
      { id: 'lop3', label: 'Lớp 3', open: false },
      { id: 'lop4', label: 'Lớp 4', open: false },
      { id: 'lop5', label: 'Lớp 5', open: false }
    ],
    imagePath: 'images/',
    balls: [1,2,3,4,5,6,7].map(n => ({
      id: 'dragonball_' + n,
      name: 'Ngọc rồng ' + n + ' sao',
      icon: '🟠',
      file: 'dragonball_' + n + '.png',
      cost: 40 + n * 20
    })),
    shenron: {
      id: 'shenron_sticker',
      name: 'Sticker Rồng Thần',
      icon: '🐉',
      file: 'sticker_shenron.png',
      cost: 0
    }
  };

  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));

  function loadData() {
    try { return window.Storage ? Storage.load() : JSON.parse(localStorage.getItem('khoBaiTap_v1') || '{}'); }
    catch { return {}; }
  }

  function saveData(data) {
    if (window.Storage && Storage.save) Storage.save(data);
    else localStorage.setItem('khoBaiTap_v1', JSON.stringify(data));
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
  }

  function hasItem(data, file) {
    return Array.isArray(data.inventory) && data.inventory.includes(file);
  }

  function ownCountBalls(data) {
    return CFG.balls.filter(b => hasItem(data, b.file)).length;
  }

  function unlockShenronIfReady(showPopup) {
    const data = loadData();
    data.inventory = Array.isArray(data.inventory) ? data.inventory : [];
    const full = CFG.balls.every(b => data.inventory.includes(b.file));
    if (full && !data.inventory.includes(CFG.shenron.file)) {
      data.inventory.push(CFG.shenron.file);
      saveData(data);
      if (window.Rewards && Rewards.updateUI) Rewards.updateUI();
      if (showPopup && window.Rewards && Rewards._achievementPopup) {
        Rewards._achievementPopup('🐉 Đủ 7 viên ngọc! Nhận Sticker Rồng Thần!');
      } else if (showPopup) {
        alert('🐉 Đủ 7 viên ngọc! Con nhận Sticker Rồng Thần!');
      }
      renderDragonCollection();
      return true;
    }
    return false;
  }

  function enhanceRewardsShop() {
    if (!window.Rewards || !Array.isArray(Rewards.SHOP_ITEMS)) return;
    const existing = new Set(Rewards.SHOP_ITEMS.map(i => i.file || i.id));
    CFG.balls.forEach(item => {
      if (!existing.has(item.file)) Rewards.SHOP_ITEMS.push(item);
    });
    if (!existing.has(CFG.shenron.file)) {
      Rewards.SHOP_ITEMS.push({ ...CFG.shenron, cost: 999999, locked: true });
    }

    const oldBuy = Rewards.buyItem && Rewards.buyItem.bind(Rewards);
    if (oldBuy && !Rewards._dragonballBuyPatched) {
      Rewards.buyItem = function(item, cost) {
        const before = loadData();
        const beforeOwned = hasItem(before, item);
        oldBuy(item, cost);
        const after = loadData();
        if (!beforeOwned && hasItem(after, item)) unlockShenronIfReady(true);
        renderDragonCollection();
      };
      Rewards._dragonballBuyPatched = true;
    }

    const oldRender = Rewards.renderShop && Rewards.renderShop.bind(Rewards);
    if (oldRender && !Rewards._dragonballRenderPatched) {
      Rewards.renderShop = function() {
        oldRender();
        markShenronCard();
      };
      Rewards._dragonballRenderPatched = true;
    }
  }

  function markShenronCard() {
    const data = loadData();
    $$('.reward-card').forEach(card => {
      if (card.textContent.includes('Sticker Rồng Thần')) {
        const unlocked = hasItem(data, CFG.shenron.file);
        const btn = $('.reward-buy-btn', card);
        if (btn) {
          btn.disabled = true;
          btn.textContent = unlocked ? 'Đã mở khóa' : 'Cần đủ 7 viên';
        }
        card.classList.add(unlocked ? 'shenron-unlocked' : 'shenron-locked');
      }
    });
  }

  function renderDragonCollection() {
    const wrap = $('#dragonBallCollection');
    if (!wrap) return;
    const data = loadData();
    const count = ownCountBalls(data);
    const unlocked = hasItem(data, CFG.shenron.file);
    wrap.innerHTML = `
      <div class="dragon-title-row">
        <div><b>🐉 Bộ sưu tập ngọc rồng</b><span>${count}/7 viên</span></div>
        <button class="tiny-shop-btn" type="button" id="openShopFromDragon">Mở shop</button>
      </div>
      <div class="dragon-balls-row">
        ${CFG.balls.map(b => {
          const owned = hasItem(data, b.file);
          return `<div class="dragon-ball ${owned ? 'owned' : 'missing'}" title="${esc(b.name)}">
            <img src="${CFG.imagePath + b.file}" alt="${esc(b.name)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
            <span style="display:none">${b.icon}</span>
            <small>${b.id.split('_')[1]}★</small>
          </div>`;
        }).join('')}
      </div>
      <div class="shenron-status ${unlocked ? 'done' : ''}">
        ${unlocked ? '🐉 Đã mở khóa Sticker Rồng Thần!' : 'Thu thập đủ 7 viên để nhận Sticker Rồng Thần.'}
      </div>`;
    const btn = $('#openShopFromDragon');
    if (btn) btn.onclick = () => { if (window.App) App.showScreen('shop'); if (window.Rewards) Rewards.renderShop(); };
  }

  function injectHomeWidgets() {
    if ($('#homeFunDashboard')) return;
    const screenHome = $('#screenHome') || $('.screen.active') || document.body;
    const welcome = $('.welcome-grid', screenHome) || $('.main', screenHome) || screenHome;
    const box = document.createElement('section');
    box.id = 'homeFunDashboard';
    box.className = 'home-fun-dashboard';
    box.innerHTML = `
      <div class="fun-card mission-card">
        <h3>🎯 Nhiệm vụ hôm nay</h3>
        <div class="mission-row"><span>✅ Làm 5 câu đúng</span><b>+5 ⭐</b></div>
        <div class="mission-row"><span>🔥 Học 1 lượt bất kỳ</span><b>+XP</b></div>
        <div class="mission-row"><span>🐉 Sưu tập ngọc rồng</span><b>Shop</b></div>
      </div>
      <div class="fun-card progress-card">
        <h3>📈 Tiến bộ học tập</h3>
        <div class="mini-stats" id="homeMiniStats"></div>
      </div>
      <div class="fun-card dragon-card" id="dragonBallCollection"></div>`;
    welcome.insertAdjacentElement('afterend', box);
    renderMiniStats();
    renderDragonCollection();
  }

  function renderMiniStats() {
    const el = $('#homeMiniStats');
    if (!el) return;
    const data = loadData();
    el.innerHTML = `
      <div><b>${Number(data.streak || 0)}</b><span>🔥 Chuỗi ngày</span></div>
      <div><b>${Number(data.stars || 0)}</b><span>⭐ Tổng sao</span></div>
      <div><b>${Number(data.totalCorrect || 0)}</b><span>🧠 Câu đúng</span></div>
      <div><b>#1</b><span>🏆 Lớp 2</span></div>`;
  }

  function patchLeaderboard() {
    if (!window.App || App._gradeLeaderboardPatched) return;
    const oldLoad = App.loadLeaderboard && App.loadLeaderboard.bind(App);
    App.loadLeaderboard = async function(gradeId) {
      gradeId = gradeId || this.currentGrade || 'lop2';
      const lbDiv = $('#lbList');
      if (!lbDiv) return oldLoad ? oldLoad() : null;
      ensureLeaderboardTabs(gradeId);
      if (gradeId !== 'lop2') {
        lbDiv.innerHTML = `<div class="empty-rank"><b>🔒 ${gradeLabel(gradeId)} sắp mở</b><br>Hiện tại mình mới mở bảng xếp hạng Lớp 2.</div>`;
        return;
      }
      if (oldLoad) await oldLoad();
      ensureLeaderboardTabs('lop2');
    };
    App._gradeLeaderboardPatched = true;
  }

  function gradeLabel(id) {
    return (CFG.grades.find(g => g.id === id) || {}).label || id;
  }

  function ensureLeaderboardTabs(active) {
    const lbDiv = $('#lbList');
    if (!lbDiv) return;
    let tabs = $('#gradeRankTabs');
    if (!tabs) {
      tabs = document.createElement('div');
      tabs.id = 'gradeRankTabs';
      tabs.className = 'grade-rank-tabs';
      lbDiv.parentElement.insertBefore(tabs, lbDiv);
    }
    tabs.innerHTML = CFG.grades.map(g => `
      <button type="button" class="rank-tab ${g.id === active ? 'active' : ''} ${g.open ? '' : 'locked'}" data-grade="${g.id}">
        ${g.label}${g.open ? '' : ' 🔒'}
      </button>`).join('');
    $$('.rank-tab', tabs).forEach(btn => btn.onclick = () => App.loadLeaderboard(btn.dataset.grade));
  }

  function addSidebarLinks() {
    const rail = $('.side-rail');
    if (!rail || $('#railShopLink')) return;
    const parent = $('.rail-parent-link', rail) || $('.rail-mascot', rail);
    const shop = document.createElement('button');
    shop.id = 'railShopLink';
    shop.className = 'rail-btn rail-shop-link';
    shop.type = 'button';
    shop.innerHTML = '🛍️ <span>Shop</span>';
    shop.onclick = () => { if (window.App) App.showScreen('shop'); if (window.Rewards) Rewards.renderShop(); };
    const bag = document.createElement('button');
    bag.id = 'railCollectionLink';
    bag.className = 'rail-btn rail-collection-link';
    bag.type = 'button';
    bag.innerHTML = '🎒 <span>Bộ sưu tập</span>';
    bag.onclick = () => { if (window.App) App.showScreen('home'); setTimeout(() => $('#dragonBallCollection')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80); };
    rail.insertBefore(shop, parent || null);
    rail.insertBefore(bag, parent || null);
  }

  function patchRewardUIRefresh() {
    if (!window.Rewards || Rewards._dragonballUIPatched) return;
    const old = Rewards.updateUI && Rewards.updateUI.bind(Rewards);
    if (old) {
      Rewards.updateUI = function() {
        old();
        renderMiniStats();
        renderDragonCollection();
        unlockShenronIfReady(false);
      };
      Rewards._dragonballUIPatched = true;
    }
  }

  function boot() {
    enhanceRewardsShop();
    patchRewardUIRefresh();
    patchLeaderboard();
    injectHomeWidgets();
    addSidebarLinks();
    renderMiniStats();
    renderDragonCollection();
    unlockShenronIfReady(false);
    if (window.App && App.loadLeaderboard) App.loadLeaderboard(App.currentGrade || 'lop2');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => setTimeout(boot, 80));
  else setTimeout(boot, 80);
})();
