// =============================================
// API.JS v5 - hỗ trợ data tách theo môn/lớp
// =============================================

const API = {
  GS_URL: 'https://script.google.com/macros/s/AKfycbxWlSEXYxlQGeh5nMFGOpPUxoEai3u5_UkIT0KkB9dvsKH9q6_lY4M3BM8NLp7bf1nu/exec',

  MANIFEST_URL: 'data/manifest.json',
  QUESTIONS_URL: 'data/questions.json', // fallback cũ

  // Lớp dùng cấu trúc v3 (mỗi môn 1 thư mục, mỗi chủ đề 1 file)
  GRADE_MANIFESTS: {
    lop3: 'data-lop3/manifest.json'
  },

  // Cache manifest + từng file môn để không fetch lại
  _manifest: null,
  _manifestCache: {},
  _subjectCache: {},
  _jsonCache: {},

  // ─── Manifest ───────────────────────────────────────────

  async getManifest(gradeId) {
    const url = (gradeId && this.GRADE_MANIFESTS[gradeId]) || this.MANIFEST_URL;
    if (this._manifestCache[url]) return this._manifestCache[url];
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      this._manifestCache[url] = data;
      if (url === this.MANIFEST_URL) this._manifest = data;
      return data;
    } catch (e) {
      console.warn('getManifest failed (' + url + '), sẽ dùng questions.json cũ:', e);
      return null;
    }
  },

  /** fetch + cache 1 file JSON bất kỳ theo đường dẫn đầy đủ */
  async _fetchJSON(path) {
    if (this._jsonCache[path]) return this._jsonCache[path];
    try {
      const res = await fetch(path);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      this._jsonCache[path] = data;
      return data;
    } catch (e) {
      console.error('_fetchJSON error:', path, e);
      return null;
    }
  },

  // ─── Load toàn bộ data (dùng cho App.init) ──────────────

  /**
   * getAllData(): load tất cả môn của 1 lớp, ghép lại thành
   * object { subjects: [...] } giống format questions.json cũ
   * → App.js không cần đổi gì.
   */
  async getAllData(gradeId = 'lop2') {
    const manifest = await this.getManifest(gradeId);

    // Nếu không có manifest → fallback questions.json cũ
    if (!manifest) return this._getAllDataLegacy();

    // Manifest kiểu v3: subjects[] có 'dir' + 'index', mỗi chủ đề 1 file riêng
    if (Array.isArray(manifest.subjects) && manifest.subjects.some(x => x.index)) {
      return this._getAllDataV3(manifest, gradeId);
    }

    if (!Array.isArray(manifest.grades)) return this._getAllDataLegacy();
    const grade = manifest.grades.find(g => g.id === gradeId);
    if (!grade) return this._getAllDataLegacy();

    // Chỉ load các môn available: true
    const available = grade.subjects.filter(s => s.available);
    const results = await Promise.all(available.map(s => this.getSubjectData(s.file)));

    const subjects = results
      .filter(Boolean)
      .map(d => d.subject);

    return {
      version: manifest.version,
      lastUpdated: manifest.lastUpdated,
      subjects
    };
  },

  // ─── Load data kiểu v3 (data-lop3/) ─────────────────────

  /**
   * Mỗi môn 1 thư mục, mỗi chủ đề 1 file JSON riêng.
   * CHỈ nạp chủ đề có count > 0 → chủ đề chưa soạn câu hỏi sẽ
   * không hiện ra cho bé, không phải khoá thủ công.
   */
  async _getAllDataV3(manifest, gradeId) {
    const base = (this.GRADE_MANIFESTS[gradeId] || '').replace(/manifest\.json$/, '');

    const subjects = await Promise.all((manifest.subjects || []).map(async sub => {
      const idx = await this._fetchJSON(base + sub.index);
      if (!idx) return null;

      const wanted = (idx.topics || []).filter(t => t.count > 0 && t.file);
      const loaded = await Promise.all(
        wanted.map(t => this._fetchJSON(base + (sub.dir ? sub.dir + '/' : '') + t.file))
      );

      const topics = loaded
        .map(d => d && d.topic)
        .filter(t => t && Array.isArray(t.questions) && t.questions.length > 0);

      if (!topics.length) return null;
      return { id: idx.id || sub.id, icon: idx.icon || sub.icon, name: idx.name || sub.name, topics };
    }));

    return {
      version: manifest.version,
      lastUpdated: manifest.lastUpdated,
      subjects: subjects.filter(Boolean)
    };
  },

  // ─── Load 1 môn theo file ───────────────────────────────

  /**
   * getSubjectData(file): fetch và cache 1 file môn.
   * file = 'toan-lop2.json' (chỉ tên file, không cần path đầy đủ)
   */
  async getSubjectData(file) {
    if (this._subjectCache[file]) return this._subjectCache[file];
    try {
      const res = await fetch('data/' + file);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      this._subjectCache[file] = data;
      return data;
    } catch (e) {
      console.error('getSubjectData error:', file, e);
      return null;
    }
  },

  // ─── Fallback: load questions.json cũ ───────────────────

  async _getAllDataLegacy() {
    try {
      const res = await fetch(this.QUESTIONS_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      console.error('getAllData legacy error:', e);
      return null;
    }
  },

  // ─── Google Sheets ──────────────────────────────────────

  async getLeaderboard() {
    try {
      const res = await fetch(`${this.GS_URL}?action=getLeaderboard`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      console.error('getLeaderboard error:', e);
      return [];
    }
  },

  /** Lưu điểm + log đầy đủ (subject, topic, duration) */
  async saveScore(name, score, total, subject, topic, durationSec) {
    try {
      await fetch(this.GS_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveScore',
          name,
          score,
          total,
          subject: subject || '',
          topic: topic || '',
          duration: durationSec || 0
        })
      });
      return true;
    } catch (e) {
      console.error('saveScore error:', e);
      return false;
    }
  },

  /** Lấy log của 1 bé trong N ngày */
  async getLog(name, days = 30) {
    try {
      const url = `${this.GS_URL}?action=getLog&name=${encodeURIComponent(name)}&days=${days}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      console.error('getLog error:', e);
      return [];
    }
  }
};

window.API = API;
