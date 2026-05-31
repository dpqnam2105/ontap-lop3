// =============================================
// API.JS v5 - hỗ trợ data tách theo môn/lớp
// =============================================

const API = {
  GS_URL: 'https://script.google.com/macros/s/AKfycbxWlSEXYxlQGeh5nMFGOpPUxoEai3u5_UkIT0KkB9dvsKH9q6_lY4M3BM8NLp7bf1nu/exec',

  MANIFEST_URL: 'data/manifest.json',
  QUESTIONS_URL: 'data/questions.json', // fallback cũ

  // Cache manifest + từng file môn để không fetch lại
  _manifest: null,
  _subjectCache: {},

  // ─── Manifest ───────────────────────────────────────────

  async getManifest() {
    if (this._manifest) return this._manifest;
    try {
      const res = await fetch(this.MANIFEST_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      this._manifest = await res.json();
      return this._manifest;
    } catch (e) {
      console.warn('getManifest failed, sẽ dùng questions.json cũ:', e);
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
    const manifest = await this.getManifest();

    // Nếu không có manifest → fallback questions.json cũ
    if (!manifest) return this._getAllDataLegacy();

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
