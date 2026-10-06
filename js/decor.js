// =============================================
// DECOR.JS — Trang trí hồ sơ (kiểu Discord): khung avatar, bảng tên, hiệu ứng nền
// Mở khoá theo Level. Bé tự phối món từ các bộ đã mở. Lưu trong hồ sơ (được sao lưu).
// Toàn bộ vẽ bằng CSS (decor.css), không cần ảnh.
// =============================================

const Mascot = {
  BASE: 'images/mascot/',
  POSES: ['avatar', 'vay-tay', 'ngon-cai', 'co-vu', 'om-sao', 'dong-vien', 'doc-sach', 'ngu', 'an-mung'],
  src(pose) { return this.BASE + 'tho-' + (this.POSES.includes(pose) ? pose : 'vay-tay') + '.webp?v=1'; },
  img(pose, cls, alt) { return '<img class="' + (cls || 'mascot-img') + '" src="' + this.src(pose) + '" alt="' + (alt || 'Thỏ') + '" loading="lazy" decoding="async">'; }
};
window.Mascot = Mascot;

const Decor = {
  SETS: [
    {
      id: 'carrot', name: 'Vườn Cà Rốt', icon: '🥕', level: 1,
      desc: 'Bộ khởi đầu của mọi bạn thỏ',
      items: { frame: 'Khung lá cà rốt', plate: 'Bảng tên cam', fx: 'Lá bay nhẹ' }
    },
    {
      id: 'candy', name: 'Lâu Đài Kẹo Ngọt', icon: '🍭', level: 5,
      desc: 'Khung sọc kẹo, bong bóng hồng bay lên',
      items: { frame: 'Khung sọc kẹo', plate: 'Bảng tên hồng', fx: 'Bong bóng kẹo' }
    },
    {
      id: 'galaxy', name: 'Dải Ngân Hà', icon: '🪐', level: 10,
      desc: 'Hành tinh bay quanh khung, sao lấp lánh',
      items: { frame: 'Khung quỹ đạo', plate: 'Bảng tên trăng', fx: 'Trời sao' }
    }
  ],
  SLOTS: [
    { key: 'frame', label: 'Khung avatar' },
    { key: 'plate', label: 'Bảng tên' },
    { key: 'fx', label: 'Hiệu ứng nền' }
  ],
  PLATE_ICON: { carrot: '🥕', candy: '🍬', galaxy: '🌙' },

  _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },

  level() {
    try { return Number(Rewards._loadData().level || 1); } catch (e) { return 1; }
  },

  isUnlocked(setId, lv) {
    const s = this.SETS.find(x => x.id === setId);
    return !!s && (lv == null ? this.level() : lv) >= s.level;
  },

  /** Món đang dùng; món chưa mở (vd. dữ liệu lạ) thì quay về bộ khởi đầu. */
  equipped() {
    let e = {};
    try { e = Storage.get('decor') || {}; } catch (err) { e = {}; }
    const out = {};
    this.SLOTS.forEach(s => { out[s.key] = this.isUnlocked(e[s.key]) ? e[s.key] : 'carrot'; });
    out.face = this.faceUnlocked(e.face) ? e.face : 'mascot';
    return out;
  },

  // ─── Hình đại diện: Thỏ (mặc định) + 5 con vật của Đấu trường tính nhanh ───
  /** Có ảnh avatar riêng (images/arena/avatar-<id>.webp) thì bật true; chưa có dùng emoji trên nền màu. */
  AVATAR_IMAGES: false,
  faces() {
    const L = (window.TableGen && TableGen.LEVELS) || [];
    return [{ id: 'mascot', name: 'Thỏ Rabbit', icon: '🐰' }].concat(L.map((x, i) => ({ id: x.id, name: x.name, icon: x.icon, title: x.title, level: i, c: x.c })));
  },
  faceUnlocked(id) {
    if (!id || id === 'mascot') return true;
    const f = this.faces().find(x => x.id === id);
    if (!f || !window.TableGen) return false;
    try { return !!TableGen.getSpeed().level.passed[f.level]; } catch (e) { return false; }
  },
  equipFace(id) {
    if (!this.faceUnlocked(id)) return false;
    let e = {};
    try { e = Storage.get('decor') || {}; } catch (err) { e = {}; }
    e.face = id;
    Storage.set('decor', e);
    return true;
  },
  faceHTML(id) {
    const f = this.faces().find(x => x.id === id);
    if (!f || id === 'mascot') return Mascot.img('avatar', 'dc-face-img', '');
    if (this.AVATAR_IMAGES) return '<img class="dc-face-img" src="images/arena/avatar-' + f.id + '.webp" alt="">';
    return '<span class="dc-face-emoji" style="background:radial-gradient(circle at 35% 30%,#fff,' + f.c[0] + ' 55%,' + f.c[1] + ')">' + f.icon + '</span>';
  },

  equip(slot, setId) {
    if (!this.isUnlocked(setId)) return false;
    const e = Object.assign({}, this.equipped(), { [slot]: setId });
    Storage.set('decor', e);
    return true;
  },

  /** Các hạt của hiệu ứng nền. */
  _fx(fx) {
    const n = fx === 'galaxy' ? 14 : 7;
    const ch = { carrot: '🍃', candy: '', galaxy: '' }[fx] || '';
    let html = '<span class="dc-fx" aria-hidden="true">';
    for (let i = 0; i < n; i++) {
      const left = (i * 97 + 13) % 100;
      const delay = ((i * 37) % 50) / 10;
      const size = 0.7 + ((i * 53) % 6) / 10;
      const top = (i * 61 + 7) % 90 + 5;
      html += '<i style="top:' + top + '%;left:' + left + '%;animation-delay:-' + delay + 's;--s:' + size + '">' + ch + '</i>';
    }
    return html + '</span>';
  },

  /** Khối hồ sơ: hiệu ứng nền + avatar có khung + bảng tên. size: 'mini' | 'big' */
  render(opts) {
    const o = opts || {};
    const e = o.equip || this.equipped();
    const name = this._esc(o.name || (window.App && App.playerName) || 'Bạn thỏ');
    const ornament = { carrot: '🥕', candy: '🍭', galaxy: '' }[e.frame] || '';
    return '<div class="dc-card dc-' + (o.size || 'big') + ' dc-bg-' + e.fx + '">' +
      this._fx(e.fx) +
      '<div class="dc-avatar dc-frame-' + e.frame + '">' +
        '<span class="dc-ring"></span>' +
        (e.frame === 'galaxy' ? '<span class="dc-orbit"><i></i></span>' : '') +
        '<span class="dc-face">' + this.faceHTML(e.face) + '</span>' +
        (ornament ? '<span class="dc-orn">' + ornament + '</span>' : '') +
      '</div>' +
      '<div class="dc-info">' +
        '<span class="dc-plate dc-plate-' + e.plate + '">' + name + ' <i>' + (this.PLATE_ICON[e.plate] || '') + '</i></span>' +
        (o.sub ? '<span class="dc-sub">' + o.sub + '</span>' : '') +
      '</div>' +
    '</div>';
  },

  // ─── Màn Bộ sưu tập: mục "Trang trí hồ sơ" ─────────
  renderCollection() {
    const wrap = document.querySelector('#screenCollection .collection-wrap');
    if (!wrap) return;
    let card = document.getElementById('decorCard');
    if (!card) {
      card = document.createElement('div');
      card.id = 'decorCard';
      card.className = 'card decor-panel';
      const hero = wrap.querySelector('.collection-hero');
      wrap.insertBefore(card, hero || wrap.children[1] || null);
    }
    const lv = this.level();
    const e = this.equipped();
    const next = this.SETS.find(s => s.level > lv);
    const sub = 'Level ' + lv + (next ? ' · còn ' + (next.level - lv) + ' Level nữa mở ' + next.icon + ' ' + next.name : ' · đã mở hết các bộ!');
    let html = '<div class="decor-head"><div><div class="shop-kicker">🎨 Trang trí hồ sơ</div><h3>Phối đồ cho hồ sơ của con</h3></div></div>';
    html += '<div class="decor-preview">' + this.render({ size: 'big', sub: this._esc(sub) }) + '</div>';
    html += '<div class="decor-slot"><div class="decor-slot-label">Hình đại diện <small>(đạt danh hiệu ở ⏱️ Đấu trường tính nhanh để mở)</small></div><div class="decor-opts decor-faces">' +
      this.faces().map(f => {
        const open = this.faceUnlocked(f.id);
        const on = e.face === f.id;
        return '<button type="button" class="decor-opt decor-face' + (on ? ' on' : '') + (open ? '' : ' locked') + '" data-face="' + f.id + '"' + (open ? '' : ' disabled') + '>' +
          '<span class="decor-face-pic">' + (open ? this.faceHTML(f.id) : '<span class="dc-face-emoji dc-face-lock">' + f.icon + '</span>') + '</span>' +
          '<span class="decor-opt-name">' + this._esc(f.name) + '</span>' +
          '<span class="decor-opt-tag">' + (open ? (on ? '✓ Đang dùng' : 'Bấm để dùng') : '🔒 ' + this._esc(f.title || '')) + '</span></button>';
      }).join('') + '</div></div>';
    this.SLOTS.forEach(slot => {
      html += '<div class="decor-slot"><div class="decor-slot-label">' + slot.label + '</div><div class="decor-opts">';
      this.SETS.forEach(s => {
        const open = lv >= s.level;
        const on = e[slot.key] === s.id;
        html += '<button type="button" class="decor-opt' + (on ? ' on' : '') + (open ? '' : ' locked') + '" data-slot="' + slot.key + '" data-set="' + s.id + '"' + (open ? '' : ' disabled') + '>' +
          '<span class="decor-sw decor-sw-' + slot.key + ' decor-sw-' + s.id + '"></span>' +
          '<span class="decor-opt-name">' + this._esc(s.items[slot.key]) + '</span>' +
          '<span class="decor-opt-tag">' + (open ? (on ? '✓ Đang dùng' : s.icon + ' ' + this._esc(s.name)) : '🔒 Level ' + s.level) + '</span>' +
        '</button>';
      });
      html += '</div></div>';
    });
    html += '<div class="decor-sets">' + this.SETS.map(s => {
      const open = lv >= s.level;
      return '<button type="button" class="decor-set' + (open ? '' : ' locked') + '" data-wear="' + s.id + '"' + (open ? '' : ' disabled') + '>' +
        '<b>' + s.icon + ' ' + this._esc(s.name) + '</b><small>' + (open ? 'Mặc cả bộ' : '🔒 Mở ở Level ' + s.level) + '</small></button>';
    }).join('') + '</div>';
    html += '<p class="decor-note">Học để lên Level là mở thêm bộ mới. Đồ đã mở luôn là của con.</p>';
    card.innerHTML = html;

    card.querySelectorAll('.decor-face[data-face]').forEach(b => b.addEventListener('click', () => {
      if (this.equipFace(b.dataset.face)) { this.renderCollection(); this._refreshHome(); }
    }));
    card.querySelectorAll('.decor-opt[data-slot]').forEach(b => b.addEventListener('click', () => {
      if (this.equip(b.dataset.slot, b.dataset.set)) { this.renderCollection(); this._refreshHome(); }
    }));
    card.querySelectorAll('.decor-set[data-wear]').forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.wear;
      if (!this.isUnlocked(id)) return;
      Storage.set('decor', { frame: id, plate: id, fx: id });
      this.renderCollection(); this._refreshHome();
    }));
  },

  _refreshHome() { try { if (window.Today && Today.render) Today.render(); } catch (e) { /* bỏ qua */ } },

  /** Báo khi lên Level mở được bộ mới. */
  init() {
    if (!window.Rewards || !Rewards.addXP || Rewards._decorWrapped) return;
    const orig = Rewards.addXP.bind(Rewards);
    Rewards.addXP = (amount) => {
      const before = this.level();
      const r = orig(amount);
      const after = this.level();
      if (after > before) {
        const s = this.SETS.find(x => x.level > before && x.level <= after);
        if (s) setTimeout(() => Rewards._achievementPopup('🎨 Mở khoá bộ trang trí ' + s.icon + ' ' + s.name + '! Vào Bộ sưu tập để mặc thử nhé.'), 2600);
      }
      return r;
    };
    Rewards._decorWrapped = true;
  }
};

window.Decor = Decor;
