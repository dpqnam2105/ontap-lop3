/* ═══════════════════════════════════════════════
   STORAGE.JS - Lưu trữ dữ liệu vào localStorage
   Để Thỏ không mất sao/sticker khi tắt trình duyệt
   ═══════════════════════════════════════════════ */

const Storage = {
  KEY: 'khoBaiTap_v1',

  /** Đọc toàn bộ data của Thỏ */
  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return this._default();
      const data = JSON.parse(raw);
      // Merge với default để tránh thiếu field khi nâng cấp
      return { ...this._default(), ...data };
    } catch (e) {
      console.error('Storage load error:', e);
      return this._default();
    }
  },

  /** Lưu toàn bộ data */
  save(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  },

  /** Lưu 1 field cụ thể */
  set(key, value) {
    const data = this.load();
    data[key] = value;
    this.save(data);
  },

  /** Đọc 1 field */
  get(key) {
    return this.load()[key];
  },

  /** Xóa toàn bộ (reset) */
  clear() {
    localStorage.removeItem(this.KEY);
  },

  /** Cấu trúc mặc định */
  _default() {
    return {
      playerName: '',
      stars: 0,
      inventory: [],   // Danh sách sticker đã mua: ['sticker_star.png', ...]
      currentBadge: '', // 'gold' | 'silver' | 'bronze' | ''
      title: '🌱 Danh hiệu: Người mới bắt đầu',
      totalCorrect: 0, // Tổng số câu đúng (cho thống kê sau này)
      lastPlayed: null
    };
  }
};
