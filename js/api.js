// =============================================
// API.JS v4 - saveScore tích hợp log đầy đủ
// =============================================

const API = {
  GS_URL: 'https://script.google.com/macros/s/AKfycbxWlSEXYxlQGeh5nMFGOpPUxoEai3u5_UkIT0KkB9dvsKH9q6_lY4M3BM8NLp7bf1nu/exec',
  QUESTIONS_URL: 'data/questions.json', // fallback nếu chưa dùng data/questions.js

  async getAllData() {
    try {
      // Ưu tiên data/questions.js nếu đã nhúng trong index.html
      const globalData = window.QUESTIONS_DATA || window.questionsData || window.QUESTIONS || window.QuestionBank;
      if (globalData) {
        return window.LearningEngine
          ? window.LearningEngine.normalizeQuestionBank(globalData)
          : globalData;
      }

      // Fallback: vẫn hỗ trợ data/questions.json nếu bạn dùng JSON thuần
      const res = await fetch(this.QUESTIONS_URL);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      return window.LearningEngine
        ? window.LearningEngine.normalizeQuestionBank(data)
        : data;
    } catch (e) {
      console.error('getAllData error:', e);
      return null;
    }
  },

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
          name: name,
          score: score,
          total: total,
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
  async getLog(name, days) {
    days = days || 30;
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
