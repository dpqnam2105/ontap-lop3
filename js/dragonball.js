// =============================================
// DRAGONBALL.JS
// Tách từ app.js - Dragon Ball + Homepage Widgets
// =============================================

const DragonBall = {

  DRAGONBALL_KEY: 'rabbit_dragonball_collection',
  DRAGON_REWARD_KEY: 'rabbit_shenron_unlocked',


  _getDragonCollection() {
    try {
      const raw = localStorage.getItem(this.DRAGONBALL_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.map(Number).filter(n => n >= 1 && n <= 7) : [];
    } catch (e) {
      return [];
    }
  },

  _saveDragonCollection(list) {
    const unique = [...new Set(list.map(Number).filter(n => n >= 1 && n <= 7))].sort((a, b) => a - b);
    localStorage.setItem(this.DRAGONBALL_KEY, JSON.stringify(unique));
    this._checkDragonReward(unique);
    this._renderHomeWidgets();
    this._renderCollection();
    this._renderDragonShop();
  },

  _getStars() {
    const candidates = ['stars', 'score', 'totalStars', 'profileStars'];
    for (const key of candidates) {
      const n = parseInt(Storage.get ? Storage.get(key, 0) : localStorage.getItem(key), 10);
      if (!Number.isNaN(n) && n > 0) return n;
    }
    const mirror = document.getElementById('profileStarMirror');
    const fromDom = mirror ? parseInt(mirror.textContent, 10) : 0;
    return Number.isNaN(fromDom) ? 0 : fromDom;
  },

  _setStars(value) {
    const next = Math.max(0, parseInt(value, 10) || 0);
    if (Storage.set) Storage.set('stars', next);
    else localStorage.setItem('stars', String(next));
    const ids = ['profileStarMirror', 'shopStarCount'];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = next;
    });
    if (window.Rewards && Rewards.updateUI) Rewards.updateUI();
  },

  _dragonPrices() {
    return { 1: 50, 2: 70, 3: 90, 4: 120, 5: 160, 6: 220, 7: 300 };
  },

  _dragonName(n) {
    return 'Ngọc rồng ' + n + ' sao';
  },

  _dragonImg(n) {
    return 'images/dragonball_' + n + '.png';
  },

  _renderDragonBallIcon(n, owned) {
    return `<div class="dragon-ball-icon ${owned ? 'owned' : 'locked'}" title="${this._dragonName(n)}">
      <img src="${this._dragonImg(n)}" alt="${this._dragonName(n)}" onerror="this.style.display='none';this.parentNode.querySelector('.dragon-fallback').style.display='grid';">
      <span class="dragon-fallback" style="display:none">${'★'.repeat(n)}</span>
    </div>`;
  },

  _renderHomeWidgets() {
    const missionList = document.getElementById('dailyMissionList');
    const progressGrid = document.getElementById('learningProgressGrid');
    const dragonRow = document.getElementById('homeDragonBalls');
    const dragonProgress = document.getElementById('dragonProgressText');
    if (!missionList || !progressGrid || !dragonRow) return;

    const stars = this._getStars();
    const collection = this._getDragonCollection();
    const unlocked = localStorage.getItem(this.DRAGON_REWARD_KEY) === '1';

    const profile = (typeof Storage !== 'undefined' && Storage.load) ? Storage.load() : {};
    const streak = Number(profile.streak || 0);
    const totalCorrect = Number(profile.totalCorrect || 0);

    missionList.innerHTML = `
      <div class="mission-line"><span>✅ Làm 5 câu đúng</span><b>+5 ⭐</b></div>
      <div class="mission-line"><span>🔥 Học 1 lượt bất kỳ</span><b>+XP</b></div>
      <div class="mission-line"><span>🐉 Sưu tập ngọc rồng</span><button type="button" class="text-link-btn" data-open-shop="1">Shop</button></div>`;

    progressGrid.innerHTML = `
      <div class="progress-mini"><b>${streak}</b><span>🔥 Chuỗi ngày</span></div>
      <div class="progress-mini"><b>${stars}</b><span>⭐ Tổng sao</span></div>
      <div class="progress-mini"><b>${totalCorrect}</b><span>🧠 Câu đúng</span></div>
      <div class="progress-mini"><b>${collection.length}/7</b><span>🐉 Ngọc rồng</span></div>`;

    if (dragonProgress) dragonProgress.textContent = collection.length + '/7 viên';
    dragonRow.innerHTML = [1, 2, 3, 4, 5, 6, 7].map(n => this._renderDragonBallIcon(n, collection.includes(n))).join('');
    const hint = document.getElementById('dragonHint');
    if (hint) hint.textContent = unlocked ? 'Đã mở khóa Sticker Rồng Thần! 🐉' : 'Thu thập đủ 7 viên để nhận Sticker Rồng Thần.';

    document.querySelectorAll('[data-open-shop="1"]').forEach(btn => {
      btn.onclick = () => App.showScreen('shop');
    });
  },

  _renderDragonShop() {
    const shopItems = document.getElementById('shopItems');
    if (!shopItems) return;

    const oldDragonSection = document.getElementById('dragonShopSection');
    if (oldDragonSection) oldDragonSection.remove();

    const collection = this._getDragonCollection();
    const prices = this._dragonPrices();
    const stars = this._getStars();
    const section = document.createElement('div');
    section.id = 'dragonShopSection';
    section.className = 'dragon-shop-section';
    section.innerHTML = `
      <div class="dragon-shop-head">
        <div>
          <h3>🐉 Shop 7 viên ngọc rồng</h3>
          <p>Mua đủ bộ để nhận Sticker Rồng Thần.</p>
        </div>
        <div class="dragon-shop-wallet">⭐ ${stars}</div>
      </div>
      <div class="dragon-shop-grid">
        ${[1, 2, 3, 4, 5, 6, 7].map(n => {
          const owned = collection.includes(n);
          const canBuy = stars >= prices[n] && !owned;
          return `<div class="dragon-shop-card ${owned ? 'owned' : ''}">
            ${this._renderDragonBallIcon(n, true)}
            <div class="dragon-shop-name">${this._dragonName(n)}</div>
            <div class="dragon-shop-price">${owned ? 'Đã có' : prices[n] + ' ⭐'}</div>
            <button type="button" class="reward-buy-btn dragon-buy-btn" data-dragon="${n}" ${owned || !canBuy ? 'disabled' : ''}>${owned ? 'Đã mua' : 'Mua'}</button>
          </div>`;
        }).join('')}
      </div>`;

    shopItems.parentNode.insertBefore(section, shopItems);
    section.querySelectorAll('.dragon-buy-btn[data-dragon]').forEach(btn => {
      btn.addEventListener('click', () => this._buyDragonBall(parseInt(btn.dataset.dragon, 10)));
    });

    const shopStar = document.getElementById('shopStarCount');
    if (shopStar) shopStar.textContent = stars;
  },

  _buyDragonBall(n) {
    const collection = this._getDragonCollection();
    if (collection.includes(n)) return;
    const price = this._dragonPrices()[n];
    const stars = this._getStars();
    if (stars < price) {
      alert('Con chưa đủ sao để mua viên này. Học thêm để tích sao nhé! ⭐');
      return;
    }
    this._setStars(stars - price);
    collection.push(n);
    this._saveDragonCollection(collection);
    alert('Đã mua ' + this._dragonName(n) + '! 🐉');
    this._renderHomeWidgets();
    this._renderDragonShop();
    this._renderCollection();
  },

  _checkDragonReward(collection) {
    const hasAll = collection.length >= 7;
    const unlocked = localStorage.getItem(this.DRAGON_REWARD_KEY) === '1';
    if (hasAll && !unlocked) {
      localStorage.setItem(this.DRAGON_REWARD_KEY, '1');
      this._addShenronToInventory();
      setTimeout(() => alert('🐉 Rồng Thần xuất hiện! Con đã nhận Sticker Rồng Thần!'), 100);
    }
  },

  _addShenronToInventory() {
    try {
      const key = 'inventory';
      const raw = Storage.get ? Storage.get(key, []) : JSON.parse(localStorage.getItem(key) || '[]');
      const inventory = Array.isArray(raw) ? raw : [];
      if (!inventory.includes('sticker_shenron')) inventory.push('sticker_shenron');
      if (Storage.set) Storage.set(key, inventory);
      else localStorage.setItem(key, JSON.stringify(inventory));
    } catch (e) {
      localStorage.setItem('rabbit_shenron_inventory_fallback', '1');
    }
  },

  _renderCollection() {
    const grid = document.getElementById('collectionDragonGrid');
    if (!grid) return;
    const collection = this._getDragonCollection();
    const unlocked = localStorage.getItem(this.DRAGON_REWARD_KEY) === '1';
    grid.innerHTML = [1, 2, 3, 4, 5, 6, 7].map(n => {
      const owned = collection.includes(n);
      return `<div class="collection-dragon-card ${owned ? 'owned' : 'locked'}">
        ${this._renderDragonBallIcon(n, owned)}
        <h3>${this._dragonName(n)}</h3>
        <p>${owned ? 'Đã thu thập' : 'Chưa có'}</p>
      </div>`;
    }).join('');
    const reward = document.getElementById('collectionRewardBadge');
    if (reward) reward.innerHTML = unlocked ? '🐉<span>Đã nhận Rồng Thần</span>' : collection.length + '/7<span>Đang sưu tập</span>';
  },

  _escape(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
};
