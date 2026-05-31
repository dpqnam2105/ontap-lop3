// =============================================
// STORAGE.JS v3 - thêm wrong history tích lũy lâu dài
// =============================================

const Storage = {
  KEY: 'khoBaiTap_v1',
  PROGRESS_KEY: 'khoBaiTap_progress_v1',
  WRONG_HISTORY_KEY: 'khoBaiTap_wrong_history_v1',

  // ─── Profile ────────────────────────────────

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return this._default();
      return { ...this._default(), ...JSON.parse(raw) };
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
    localStorage.removeItem(this.WRONG_HISTORY_KEY);
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

  // ─── Daily topic progress (reset mỗi ngày) ──

  /** Lấy progress của 1 chủ đề trong ngày hôm nay */
  getTopicProgress(topicId) {
    try {
      const raw = localStorage.getItem(this.PROGRESS_KEY);
      const all = raw ? JSON.parse(raw) : {};
      const today = this._getToday();
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
      if (all._date !== today) all = { _date: today };
      all[topicId] = { learned, wrong, date: today };
      localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(all));
    } catch (e) {
      console.error('saveTopicProgress error:', e);
    }
  },

  // ─── Wrong history (tích lũy lâu dài) ───────

  /**
   * Lấy toàn bộ wrong history.
   * Cấu trúc: { [questionId]: { wrongCount, lastWrong, lastCorrect, subjectId, topicId, question } }
   */
  getWrongHistory() {
    try {
      const raw = localStorage.getItem(this.WRONG_HISTORY_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  },

  /**
   * Ghi nhận kết quả 1 câu hỏi vào wrong history.
   * Gọi từ quiz.js sau mỗi câu trả lời.
   */
  recordAnswer({ questionId, isCorrect, subjectId, topicId, question }) {
    if (!questionId) return;
    try {
      const history = this.getWrongHistory();
      const today = this._getToday();
      const existing = history[questionId] || {
        wrongCount: 0,
        lastWrong: null,
        lastCorrect: null,
        subjectId: subjectId || '',
        topicId: topicId || '',
        question: question || ''
      };

      if (isCorrect) {
        existing.lastCorrect = today;
      } else {
        existing.wrongCount = (existing.wrongCount || 0) + 1;
        existing.lastWrong = today;
      }

      // Cập nhật meta phòng khi thiếu
      if (subjectId) existing.subjectId = subjectId;
      if (topicId) existing.topicId = topicId;
      if (question) existing.question = question;

      history[questionId] = existing;
      this._saveWrongHistory(history);
    } catch (e) {
      console.error('recordAnswer error:', e);
    }
  },

  /**
   * Lấy danh sách câu sai nhiều nhất.
   * @param {number} limit - số câu tối đa trả về
   * @returns {Array} mảng { questionId, wrongCount, lastWrong, lastCorrect, subjectId, topicId, question }
   */
  getMostWrong(limit = 20) {
    const history = this.getWrongHistory();
    return Object.entries(history)
      .filter(([, v]) => v.wrongCount > 0)
      .map(([questionId, v]) => ({ questionId, ...v }))
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, limit);
  },

  /**
   * Lấy danh sách câu sai rồi nhưng chưa làm lại đúng.
   * lastWrong có, lastCorrect null hoặc lastCorrect < lastWrong
   */
  getUnresolvedWrong(limit = 50) {
    const history = this.getWrongHistory();
    return Object.entries(history)
      .filter(([, v]) => {
        if (!v.lastWrong) return false;
        if (!v.lastCorrect) return true;
        return v.lastCorrect < v.lastWrong;
      })
      .map(([questionId, v]) => ({ questionId, ...v }))
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, limit);
  },

  /**
   * Lấy câu sai theo môn — dùng cho dashboard "môn nào yếu nhất"
   * @returns {Object} { subjectId: { wrongCount, questionCount } }
   */
  getWrongBySubject() {
    const history = this.getWrongHistory();
    const result = {};
    Object.values(history).forEach(v => {
      if (!v.wrongCount || !v.subjectId) return;
      if (!result[v.subjectId]) result[v.subjectId] = { wrongCount: 0, questionCount: 0 };
      result[v.subjectId].wrongCount += v.wrongCount;
      result[v.subjectId].questionCount += 1;
    });
    return result;
  },

  /**
   * Lấy câu sai theo topic — dùng cho dashboard "chủ đề nào yếu nhất"
   * @returns {Array} mảng { topicId, subjectId, wrongCount, questionCount } sort theo wrongCount desc
   */
  getWrongByTopic(limit = 10) {
    const history = this.getWrongHistory();
    const map = {};
    Object.values(history).forEach(v => {
      if (!v.wrongCount || !v.topicId) return;
      const key = v.topicId;
      if (!map[key]) map[key] = { topicId: v.topicId, subjectId: v.subjectId, wrongCount: 0, questionCount: 0 };
      map[key].wrongCount += v.wrongCount;
      map[key].questionCount += 1;
    });
    return Object.values(map).sort((a, b) => b.wrongCount - a.wrongCount).slice(0, limit);
  },

  /**
   * Câu sai trong N ngày gần đây (dùng cho dashboard "tuần này bé sai gì")
   * @param {number} days
   */
  getRecentWrong(days = 7, limit = 30) {
    const history = this.getWrongHistory();
    const cutoff = this._dateOffset(-days);
    return Object.entries(history)
      .filter(([, v]) => v.lastWrong && v.lastWrong >= cutoff)
      .map(([questionId, v]) => ({ questionId, ...v }))
      .sort((a, b) => b.lastWrong.localeCompare(a.lastWrong))
      .slice(0, limit);
  },

  /**
   * Xóa history của 1 câu (dùng khi câu đó bị xóa khỏi question bank)
   */
  clearQuestionHistory(questionId) {
    const history = this.getWrongHistory();
    delete history[questionId];
    this._saveWrongHistory(history);
  },

  /**
   * Dọn dẹp history — xóa các câu đúng hoàn toàn và không sai lại trong 30 ngày
   * Gọi định kỳ để tránh đầy localStorage
   */
  pruneHistory(keepDays = 30) {
    const history = this.getWrongHistory();
    const cutoff = this._dateOffset(-keepDays);
    let pruned = 0;
    Object.keys(history).forEach(qId => {
      const v = history[qId];
      const resolved = v.lastCorrect && (!v.lastWrong || v.lastCorrect >= v.lastWrong);
      const stale = v.lastWrong && v.lastWrong < cutoff;
      if (resolved && stale) {
        delete history[qId];
        pruned++;
      }
    });
    if (pruned > 0) this._saveWrongHistory(history);
    return pruned;
  },

  _saveWrongHistory(history) {
    try {
      localStorage.setItem(this.WRONG_HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      // localStorage đầy → thử prune rồi save lại
      console.warn('WrongHistory save failed, pruning...', e);
      this.pruneHistory(14);
      try {
        localStorage.setItem(this.WRONG_HISTORY_KEY, JSON.stringify(history));
      } catch (e2) {
        console.error('WrongHistory save failed after prune:', e2);
      }
    }
  },

  // ─── Helpers ────────────────────────────────

  _getToday() {
    const now = new Date();
    return now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');
  },

  _dateOffset(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }
};
