// =============================================
// STORAGE.JS v2 - localStorage + theo dõi câu đã làm
// =============================================

const Storage = {
  KEY: 'khoBaiTap_v1',
  PROGRESS_KEY: 'khoBaiTap_progress_v1',

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return this._default();
      const data = JSON.parse(raw);
      return { ...this._default(), ...data };
    } catch (e) {
      console.error('Storage load error:', e);
      return this._default();
    }
  },

  save(data) {
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Storage save error:', e);
    }
  },

  set(key, value) {
    const data = this.load();
    data[key] = value;
    this.save(data);
  },

  get(key) {
    return this.load()[key];
  },

  clear() {
    localStorage.removeItem(this.KEY);
    localStorage.removeItem(this.PROGRESS_KEY);
  },

  _default() {
    return {
      playerName: '',
      stars: 0,
      inventory: [],
      currentBadge: '',
      title: '🌱 Người mới bắt đầu',
      totalCorrect: 0,
      lastPlayed: null,
      xp: 0,
      level: 1,
      streak: 0,
      lastStudyDate: null
    };
  },

  // ============================================
  // THEO DÕI TIẾN ĐỘ HỌC THEO NGÀY VÀ CHỦ ĐỀ
  // ============================================

  /** Lấy progress của 1 chủ đề trong ngày hôm nay */
  getTopicProgress(topicId) {
    try {
      const raw = localStorage.getItem(this.PROGRESS_KEY);
      const all = raw ? JSON.parse(raw) : {};
      const today = this._getToday();
      
      // Nếu là ngày mới → reset tất cả
      if (all._date !== today) {
        return { learned: [], wrong: [], date: today };
      }
      
      return all[topicId] || { learned: [], wrong: [], date: today };
    } catch (e) {
      return { learned: [], wrong: [], date: this._getToday() };
    }
  },

  /** Lưu progress của 1 chủ đề */
  saveTopicProgress(topicId, learned, wrong) {
    try {
      const raw = localStorage.getItem(this.PROGRESS_KEY);
      let all = raw ? JSON.parse(raw) : {};
      const today = this._getToday();
      
      // Reset nếu sang ngày mới
      if (all._date !== today) {
        all = { _date: today };
      }
      
      all[topicId] = {
        learned: learned,
        wrong: wrong,
        date: today
      };
      
      localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('saveTopicProgress error:', e);
    }
  },

  _getToday() {
    const now = new Date();
    return now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
  }
};
