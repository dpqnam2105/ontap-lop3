/* ═══════════════════════════════════════════════
   API.JS - v2: JSON tĩnh cho câu hỏi + Sheets cho BXH
   ═══════════════════════════════════════════════ */

const API = {
  GS_URL: 'https://script.google.com/macros/s/AKfycbxWlSEXYxlQGeh5nMFGOpPUxoEai3u5_UkIT0KkB9dvsKH9q6_lY4M3BM8NLp7bf1nu/exec',
  QUESTIONS_URL: 'data/questions.json',

  /** Lấy câu hỏi từ JSON tĩnh - cực nhanh */
  async getAllData() {
    try {
      const res = await fetch(this.QUESTIONS_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      console.log('✅ Loaded', data.subjects.length, 'subjects from JSON');
      return data;
    } catch (e) {
      console.error('❌ getAllData error:', e);
      return null;
    }
  },

  /** Lấy BXH từ Google Sheets */
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

  /** Lưu điểm vào Google Sheets */
  async saveScore(name, score, total) {
    try {
      await fetch(this.GS_URL, {
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
