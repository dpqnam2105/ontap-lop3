// =============================================
// STORAGE.JS v3 - thêm wrong history tích lũy lâu dài
// =============================================

const Storage = {
  KEY: 'khoBaiTap_v1',
  ACTIVE_KEY: 'khoBaiTap_active_v1',
  PROGRESS_KEY: 'khoBaiTap_progress_v1',
  WRONG_HISTORY_KEY: 'khoBaiTap_wrong_history_v1',
  MIGRATED_KEY: 'khoBaiTap_migrated_v2',

  normalizeName(raw) {
    let s = String(raw || '').replace(/\s+/g, ' ').trim().slice(0, 20);
    if (!s) return '';
    const lower = s.toLocaleLowerCase('vi');
    const upper = s.toLocaleUpperCase('vi');
    if (s === lower || s === upper) {
      s = lower.split(' ').map(function (w) {
        return w ? w.charAt(0).toLocaleUpperCase('vi') + w.slice(1) : w;
      }).join(' ');
    }
    return s;
  },

  canonName(raw) {
    return this.normalizeName(raw).toLocaleLowerCase('vi');
  },

  profileKey(name) {
    return 'khoBaiTap_profile_' + this.canonName(name);
  },

  getActiveName() {
    try { return localStorage.getItem(this.ACTIVE_KEY) || ''; }
    catch (e) { return ''; }
  },

  _scoped(base, name) {
    const n = this.canonName(name || this.getActiveName() || 'guest') || 'guest';
    return base + '::' + n;
  },

  _migrateLegacyOnce() {
    try {
      if (localStorage.getItem(this.MIGRATED_KEY)) return;
      const raw = localStorage.getItem(this.KEY);
      if (raw) {
        const data = JSON.parse(raw);
        const name = this.normalizeName(data.playerName || '');
        if (name) {
          data.playerName = name;
          const pk = this.profileKey(name);
          if (!localStorage.getItem(pk)) localStorage.setItem(pk, JSON.stringify(data));
          localStorage.setItem(this.ACTIVE_KEY, name);
          const copyIfMissing = function (from, to) {
            const v = localStorage.getItem(from);
            if (v && !localStorage.getItem(to)) localStorage.setItem(to, v);
          };
          copyIfMissing(this.PROGRESS_KEY, this._scoped(this.PROGRESS_KEY, name));
          copyIfMissing(this.WRONG_HISTORY_KEY, this._scoped(this.WRONG_HISTORY_KEY, name));
          copyIfMissing('rabbit_dragonball_collection', 'rabbit_dragonball_collection::' + this.canonName(name));
          copyIfMissing('rabbit_shenron_unlocked', 'rabbit_shenron_unlocked::' + this.canonName(name));
        }
      }
      localStorage.setItem(this.MIGRATED_KEY, '1');
    } catch (e) {
      console.warn('migrate profile failed', e);
    }
  },

  switchPlayer(name) {
    this._migrateLegacyOnce();
    const clean = this.normalizeName(name);
    if (clean.length < 2) return this._default();
    localStorage.setItem(this.ACTIVE_KEY, clean);
    const pk = this.profileKey(clean);
    if (!localStorage.getItem(pk)) {
      const fresh = this._default();
      fresh.playerName = clean;
      localStorage.setItem(pk, JSON.stringify(fresh));
    }
    return this.load();
  },

  // ─── Profile ────────────────────────────────

  load() {
    this._migrateLegacyOnce();
    try {
      const active = this.getActiveName();
      const key = active ? this.profileKey(active) : this.KEY;
      const raw = localStorage.getItem(key) || (!active ? null : localStorage.getItem(this.KEY));
      if (!raw) return this._default();
      const data = { ...this._default(), ...JSON.parse(raw) };
      if (active) data.playerName = this.normalizeName(data.playerName || active);
      return data;
    } catch (e) {
      console.error('Storage load error:', e);
      return this._default();
    }
  },

  save(data) {
    this._migrateLegacyOnce();
    try {
      const name = this.normalizeName((data && data.playerName) || this.getActiveName());
      if (name) {
        data.playerName = name;
        localStorage.setItem(this.ACTIVE_KEY, name);
        localStorage.setItem(this.profileKey(name), JSON.stringify(data));
      } else {
        localStorage.setItem(this.KEY, JSON.stringify(data));
      }
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
    const name = this.getActiveName();
    if (name) {
      localStorage.removeItem(this.profileKey(name));
      localStorage.removeItem(this._scoped(this.PROGRESS_KEY, name));
      localStorage.removeItem(this._scoped(this.WRONG_HISTORY_KEY, name));
    }
    localStorage.removeItem(this.KEY);
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
      lastStudyDate: null,
      lastGrade: ''
    };
  },

  // ─── Chủ đề lưu tiến độ THEO ID CÂU (câu tự sinh) ──
  // Câu tự sinh có thể được dựng lại / gắn thêm vào chủ đề theo thứ tự khác nhau giữa các lần tải,
  // hoặc đổi cả kho khi lên phiên bản mẫu → không được lưu tiến độ theo vị trí (chỉ số) trong mảng.
  // Với các chủ đề này: bộ nhớ giữ ID; hàm get/save/mark vẫn nhận/trả chỉ số theo mảng HIỆN TẠI
  // (chuyển đổi qua resolver do GenB13 đăng ký), nên phần còn lại của web không phải đổi.
  // ID đã lưu mà không có trong mảng hiện tại được GIỮ NGUYÊN khi lưu lại (không mất dữ liệu).
  ID_PROGRESS_TOPICS: ['toan_g13'],
  _idTopics: {},

  /** questions(): mảng câu hiện tại của chủ đề; legacyIds(): (tuỳ chọn) id theo chỉ số của dữ liệu cũ lưu theo vị trí. */
  registerIdTopic(topicId, questions, legacyIds) {
    this._idTopics[topicId] = { questions, legacyIds: legacyIds || (() => []) };
    if (!this.ID_PROGRESS_TOPICS.includes(topicId)) this.ID_PROGRESS_TOPICS.push(topicId);
  },
  _isIdTopic(topicId) { return this.ID_PROGRESS_TOPICS.includes(topicId); },
  /** { ids: id theo chỉ số hiện tại, pos: Map id → chỉ số } hoặc null nếu chủ đề chưa nạp. */
  _idView(topicId) {
    const r = this._idTopics[topicId];
    if (!r) return null;
    const ids = (r.questions() || []).map(q => q && q.id);
    const pos = new Map(); ids.forEach((id, i) => { if (id && !pos.has(id)) pos.set(id, i); });
    return { ids, pos, legacy: r.legacyIds() || [] };
  },
  /** Bản ghi cũ (chỉ số, trước khi đổi sang ID) → ID theo kho cũ; chỉ số ngoài kho cũ bị bỏ. */
  _legacyToIds(arr, v) { return (arr || []).filter(i => Number.isInteger(i) && i >= 0 && i < v.legacy.length).map(i => v.legacy[i]); },
  _idsToIdx(ids, v) { return [...new Set((ids || []).map(id => v.pos.get(id)).filter(i => i != null))]; },
  _idxToIds(idx, v) { return [...new Set((idx || []).map(i => v.ids[i]).filter(Boolean))]; },
  /** Giữ các ID đã lưu mà chủ đề hiện tại không có (vd câu chưa được dựng lại) khi ghi đè. */
  _keepUnknown(storedIds, v) { return (storedIds || []).filter(id => !v.pos.has(id)); },

  // ─── Daily topic progress (reset mỗi ngày) ──

  /** Lấy progress của 1 chủ đề trong ngày hôm nay (chỉ số theo mảng câu hiện tại). */
  getTopicProgress(topicId) {
    const empty = { learned: [], wrong: [], date: this._getToday() };
    try {
      const raw = localStorage.getItem(this._scoped(this.PROGRESS_KEY));
      const all = raw ? JSON.parse(raw) : {};
      const today = this._getToday();
      if (all._date !== today) return empty;
      const p = all[topicId];
      if (!this._isIdTopic(topicId)) return p || empty;
      const v = this._idView(topicId);
      if (!v || !p) return empty;
      const learnedIds = p.learnedIds || this._legacyToIds(p.learned, v);
      const wrongIds = p.wrongIds || this._legacyToIds(p.wrong, v);
      return { learned: this._idsToIdx(learnedIds, v), wrong: this._idsToIdx(wrongIds, v), date: today };
    } catch (e) {
      return empty;
    }
  },

  /** Lưu progress của 1 chủ đề */
  saveTopicProgress(topicId, learned, wrong) {
    try {
      const raw = localStorage.getItem(this._scoped(this.PROGRESS_KEY));
      let all = raw ? JSON.parse(raw) : {};
      const today = this._getToday();
      if (all._date !== today) all = { _date: today };
      if (this._isIdTopic(topicId)) {
        const v = this._idView(topicId);
        if (!v) return;                                  // chủ đề chưa nạp: không ghi theo chỉ số
        const old = all[topicId] || {};
        const oldL = old.learnedIds || this._legacyToIds(old.learned, v), oldW = old.wrongIds || this._legacyToIds(old.wrong, v);
        all[topicId] = { learnedIds: this._keepUnknown(oldL, v).concat(this._idxToIds(learned, v)),
          wrongIds: this._keepUnknown(oldW, v).concat(this._idxToIds(wrong, v)), date: today };
      } else {
        all[topicId] = { learned, wrong, date: today };
      }
      localStorage.setItem(this._scoped(this.PROGRESS_KEY), JSON.stringify(all));
    } catch (e) {
      console.error('saveTopicProgress error:', e);
    }
  },

  // ─── Tiến độ tích lũy (không reset theo ngày) ───────
  // { [topicId]: { seen: [idx...], ok: [idx...] } } — ok = câu đã từng làm đúng ngay lần đầu chọn.
  // Chủ đề theo ID: { seenIds: [id...], okIds: [id...] }; get trả chỉ số theo mảng hiện tại.
  PROGRESS_TOTAL_KEY: 'khoBaiTap_progress_total_v1',

  getTotalProgress(topicId) {
    try {
      const raw = localStorage.getItem(this._scoped(this.PROGRESS_TOTAL_KEY));
      const all = raw ? JSON.parse(raw) : {};
      const p = all[topicId] || {};
      if (!this._isIdTopic(topicId)) return { seen: p.seen || [], ok: p.ok || [] };
      const v = this._idView(topicId);
      if (!v) return { seen: [], ok: [] };
      return { seen: this._idsToIdx(p.seenIds || this._legacyToIds(p.seen, v), v), ok: this._idsToIdx(p.okIds || this._legacyToIds(p.ok, v), v) };
    } catch (e) {
      return { seen: [], ok: [] };
    }
  },

  markTotalProgress(topicId, idx, correct) {
    if (!topicId || idx == null || idx < 0) return;
    try {
      const key = this._scoped(this.PROGRESS_TOTAL_KEY);
      const raw = localStorage.getItem(key);
      const all = raw ? JSON.parse(raw) : {};
      if (this._isIdTopic(topicId)) {
        const v = this._idView(topicId);
        const id = v && v.ids[idx];
        if (!id) return;                                 // chủ đề chưa nạp / chỉ số lạ: không ghi bừa
        const old = all[topicId] || {};
        const p = { seenIds: old.seenIds || this._legacyToIds(old.seen, v), okIds: old.okIds || this._legacyToIds(old.ok, v) };
        if (!p.seenIds.includes(id)) p.seenIds.push(id);
        if (correct && !p.okIds.includes(id)) p.okIds.push(id);
        all[topicId] = p;
      } else {
        const p = all[topicId] || { seen: [], ok: [] };
        if (!p.seen.includes(idx)) p.seen.push(idx);
        if (correct && !p.ok.includes(idx)) p.ok.push(idx);
        all[topicId] = p;
      }
      localStorage.setItem(key, JSON.stringify(all));
    } catch (e) {
      console.warn('markTotalProgress error:', e);
    }
  },

  // ─── Nhật ký học theo ngày: { 'YYYY-MM-DD': số câu đúng } (giữ 60 ngày gần nhất) ───
  STUDY_LOG_KEY: 'khoBaiTap_study_log_v1',

  getStudyLog() {
    try { return JSON.parse(localStorage.getItem(this._scoped(this.STUDY_LOG_KEY)) || '{}'); }
    catch (e) { return {}; }
  },

  addStudyLog(correct) {
    try {
      const log = this.getStudyLog();
      const d = new Date();
      const k = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      log[k] = (log[k] || 0) + (correct || 0);
      const keys = Object.keys(log).sort();
      keys.slice(0, Math.max(0, keys.length - 60)).forEach(x => delete log[x]);
      localStorage.setItem(this._scoped(this.STUDY_LOG_KEY), JSON.stringify(log));
    } catch (e) { /* bỏ qua */ }
  },

  // ─── Hộp ôn tập theo câu (kiểu Leitner) ─────────
  // { [questionId]: { box, due, last, subjectId, topicId, idx } }
  //  box 0: vừa sai → ôn lại hôm sau · box 1 → 3 ngày · box 2 ("Đã vững") → 7 ngày · box 3 → 14 ngày
  //  Chỉ lên hộp khi làm đúng ở MỘT NGÀY KHÁC lần lên hộp trước (đúng 2 lần cùng ngày không tính).
  REVIEW_KEY: 'khoBaiTap_review_v1',
  REVIEW_DAYS: [1, 3, 7, 14],
  MASTER_BOX: 2,

  _dayStr(ts) {
    const d = new Date(ts || Date.now());
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  },

  getReviewMap() {
    try { return JSON.parse(localStorage.getItem(this._scoped(this.REVIEW_KEY)) || '{}'); }
    catch (e) { return {}; }
  },

  recordReview(qid, correct, info) {
    if (!qid) return;
    try {
      const map = this.getReviewMap();
      const now = Date.now();
      const today = this._dayStr(now);
      const r = map[qid] || { box: -1, due: 0, last: '' };
      const dayMs = 24 * 60 * 60 * 1000;
      if (!correct) {
        r.box = 0;
        r.due = now + dayMs * this.REVIEW_DAYS[0] - 2 * 60 * 60 * 1000; // sáng hôm sau là đến hạn
        r.last = today;
      } else if (r.box < 0) {
        // Lần đầu gặp mà đúng ngay: vào hộp 1, ôn lại sau 3 ngày
        r.box = 1; r.due = now + dayMs * this.REVIEW_DAYS[1]; r.last = today;
      } else if (r.last !== today) {
        r.box = Math.min(3, r.box + 1);
        r.due = now + dayMs * this.REVIEW_DAYS[r.box];
        r.last = today;
      }
      r.n = (r.n || 0) + 1;
      if (correct) r.ok = (r.ok || 0) + 1;
      if (info) { r.subjectId = info.subjectId || r.subjectId; r.topicId = info.topicId || r.topicId; if (info.idx != null) r.idx = info.idx; }
      map[qid] = r;
      localStorage.setItem(this._scoped(this.REVIEW_KEY), JSON.stringify(map));
    } catch (e) { console.warn('recordReview error', e); }
  },

  /** Câu đã gặp và đến hạn ôn (sắp quên), quá hạn lâu nhất trước. Không gồm câu đang sai (đã có Ôn câu sai). */
  getDueReviews(limit) {
    const map = this.getReviewMap();
    const now = Date.now();
    return Object.entries(map)
      .filter(([, r]) => r.box >= 1 && r.due && r.due <= now)
      .sort((a, b) => a[1].due - b[1].due)
      .slice(0, limit || 50)
      .map(([questionId, r]) => ({ questionId, ...r }));
  },

  // ─── Wrong history (tích lũy lâu dài) ───────

  /**
   * Lấy toàn bộ wrong history.
   * Cấu trúc: { [questionId]: { wrongCount, lastWrong, lastCorrect, subjectId, topicId, question } }
   */
  getWrongHistory() {
    try {
      const raw = localStorage.getItem(this._scoped(this.WRONG_HISTORY_KEY));
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
      localStorage.setItem(this._scoped(this.WRONG_HISTORY_KEY), JSON.stringify(history));
    } catch (e) {
      // localStorage đầy → thử prune rồi save lại
      console.warn('WrongHistory save failed, pruning...', e);
      this.pruneHistory(14);
      try {
        localStorage.setItem(this._scoped(this.WRONG_HISTORY_KEY), JSON.stringify(history));
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
