/* ═══════════════════════════════════════════════
   API.JS - Giao tiếp với Google Apps Script
   ═══════════════════════════════════════════════ */

const API = {
  URL: 'https://script.google.com/macros/s/AKfycbxWlSEXYxlQGeh5nMFGOpPUxoEai3u5_UkIT0KkB9dvsKH9q6_lY4M3BM8NLp7bf1nu/exec',

  /** Lấy toàn bộ dữ liệu môn + chủ đề + câu hỏi */
  async getAllData() {
    try {
      const res = await fetch(`${this.URL}?action=getAllData`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      console.error('getAllData error:', e);
      return null;
    }
  },

  /** Lấy bảng xếp hạng */
  async getLeaderboard() {
    try {
      const res = await fetch(`${this.URL}?action=getLeaderboard`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
    } catch (e) {
      console.error('getLeaderboard error:', e);
      return [];
    }
  },

  /** Lưu điểm sau khi hoàn thành quiz */
  async saveScore(name, score, total) {
    try {
      await fetch(this.URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveScore',
          name: name,
          score: score,
          total: total
        })
      });
      return true;
    } catch (e) {
      console.error('saveScore error:', e);
      return false;
    }
  }
};
