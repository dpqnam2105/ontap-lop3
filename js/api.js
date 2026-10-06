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

      const wanted = (idx.topics || []).filter(t => t.count > 0 && t.file && !t.hidden);
      const loaded = await Promise.all(
        wanted.map(t => this._fetchJSON(base + (sub.dir ? sub.dir + '/' : '') + t.file))
      );

      const topics = loaded
        .map(d => d && d.topic)
        .filter(t => t && Array.isArray(t.questions) && t.questions.length > 0);

      if (!topics.length) return null;
      const out = { id: idx.id || sub.id, icon: idx.icon || sub.icon, name: idx.name || sub.name, topics };
      // Giai đoạn học (nếu môn có chia): danh sách giai đoạn + giai đoạn mặc định
      if (Array.isArray(idx.stages) && idx.stages.length) {
        out.stages = idx.stages;
        out.defaultStage = idx.defaultStage || idx.stages[0].id;
      }
      return out;
    }));

    const list = subjects.filter(Boolean);
    // Lớp 3: gắn câu bảng nhân chia tự sinh (js/table-gen.js)
    if (window.TableGen) {
      try { TableGen.augment(list, gradeId); } catch (e) { console.warn('TableGen.augment failed:', e); }
    }
    return {
      version: manifest.version,
      lastUpdated: manifest.lastUpdated,
      subjects: list
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

  // ─── Danh sách bé thật (bố mẹ chọn) ─────────────────────
  // Chỉ hiện các bé này trên bảng xếp hạng / Khu vực Bố Mẹ.
  // Tên phụ (gõ khác) được gộp điểm vào tên chính. Để trống KIDS = hiện tất cả như cũ.
  // grade = lớp của bé trong năm học bắt đầu từ năm `since` (tháng 9). Lớp tự tăng mỗi tháng 9.
  KIDS: [
    { name: 'coca', aliases: ['Coca'], grade: 2, since: 2026 },
    { name: 'Anh Thư', aliases: ['Anh thu japan'], grade: 3, since: 2026 },
    { name: 'Minh Trí', aliases: ['MINH TRÍ'], grade: 3, since: 2026 }
  ],

  /** Lớp hiện tại của bé (tự lên lớp từ 1/9 mỗi năm). null nếu không rõ. */
  gradeOf(name) {
    const main = this.kidOf(name);
    const kid = this.KIDS.find(x => x.name === main);
    if (!kid || !kid.grade) return null;
    const now = new Date();
    const schoolYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
    return Math.min(5, Math.max(1, kid.grade + (schoolYear - (kid.since || schoolYear))));
  },

  _kidKey(n) {
    return String(n || '').normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
  },

  /** Tên hiển thị chuẩn của 1 tên bất kỳ; null nếu không thuộc danh sách bé thật. */
  kidOf(name) {
    if (!this.KIDS.length) return String(name || '').trim();
    const k = this._kidKey(name);
    const kid = this.KIDS.find(x => [x.name].concat(x.aliases || []).some(a => this._kidKey(a) === k));
    return kid ? kid.name : null;
  },

  /** Mọi cách gõ của cùng 1 bé (để lấy đủ nhật ký). */
  namesOf(name) {
    const main = this.kidOf(name);
    const kid = this.KIDS.find(x => x.name === main);
    return kid ? [kid.name].concat(kid.aliases || []) : [name];
  },

  async getLeaderboard() {
    try {
      const res = await fetch(`${this.GS_URL}?action=getLeaderboard`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const raw = await res.json();
      if (!this.KIDS.length || !Array.isArray(raw)) return raw;
      const merged = new Map();
      raw.forEach(p => {
        const main = this.kidOf(p && p.name);
        if (!main) return;
        const cur = merged.get(main) || { ...p, name: main, grade: this.gradeOf(main), totalScore: 0, totalGames: 0 };
        cur.totalScore += Number(p.totalScore || 0);
        cur.totalGames += Number(p.totalGames || 0);
        merged.set(main, cur);
      });
      return Array.from(merged.values()).sort((a, b) => b.totalScore - a.totalScore);
    } catch (e) {
      console.error('getLeaderboard error:', e);
      return [];
    }
  },

  /** 00:00 thứ Hai của tuần chứa ngày d, theo giờ của máy (cùng cách tính ngày với nhật ký học trên máy). */
  weekStart(d) {
    const x = new Date(d || Date.now());
    const day = (x.getDay() + 6) % 7; // thứ Hai = 0
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - day);
    return x;
  },

  /** Điểm học của 1 bé trong tuần = tổng số câu đúng trong nhật ký làm bài từ thứ Hai (không phải số sao). */
  weekScoreFromLogs(logs, ws) {
    const from = (ws || this.weekStart()).getTime();
    return (logs || []).reduce((sum, l) => {
      const t = new Date(l && l.time).getTime();
      if (!(t >= from)) return sum;
      return sum + Number((l.correct != null ? l.correct : l.score) || 0);
    }, 0);
  },

  /** Nhật ký của 1 bé (gồm mọi tên phụ), NÉM LỖI nếu bất kỳ tên nào tải không được — để không coi "lỗi" là "chưa học". */
  async getLogStrict(name, days) {
    const names = this.KIDS.length ? this.namesOf(name) : [name];
    const lists = await Promise.all(names.map(async n => {
      const res = await fetch(`${this.GS_URL}?action=getLog&name=${encodeURIComponent(n)}&days=${days}`);
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const out = await res.json();
      if (!Array.isArray(out)) throw new Error('bad log');
      return out;
    }));
    const seen = new Set();
    return lists.flat().filter(l => { const k = JSON.stringify(l); if (seen.has(k)) return false; seen.add(k); return true; });
  },

  /**
   * Bảng xếp hạng TUẦN: { ok: true, rows: [{ name, grade, week }] } xếp từ cao xuống, hoặc { ok: false } nếu
   * nhật ký của BẤT KỲ bé / tên phụ nào tải lỗi (không xếp hạng khi dữ liệu thiếu). Chỉ lưu tạm 5 phút kết quả đầy đủ.
   */
  async getWeekBoard() {
    if (this._weekCache && Date.now() - this._weekCache.at < 5 * 60 * 1000) return this._weekCache.board;
    const ws = this.weekStart();
    const kids = this.KIDS.length ? this.KIDS.map(k => k.name) : [];
    if (!kids.length) return { ok: false, error: 'no kids' };
    let rows;
    try {
      rows = await Promise.all(kids.map(async n => ({
        name: n, grade: this.gradeOf ? this.gradeOf(n) : null,
        week: this.weekScoreFromLogs(await this.getLogStrict(n, 8), ws)
      })));
    } catch (e) {
      console.warn('getWeekBoard', e);
      return { ok: false, error: String(e) };          // không cache kết quả lỗi
    }
    rows.sort((a, b) => b.week - a.week || a.name.localeCompare(b.name, 'vi'));
    const board = { ok: true, rows };
    this._weekCache = { at: Date.now(), board };
    return board;
  },

  /** Lưu điểm + log đầy đủ (subject, topic, duration) */
  async saveScore(name, score, total, subject, topic, durationSec) {
    const clean = (window.Storage && Storage.normalizeName) ? Storage.normalizeName(name) : String(name || '').trim();
    if (clean.length < 2) return false;
    try {
      await fetch(this.GS_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'saveScore',
          name: clean,
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
    const one = async (n) => {
      try {
        const url = `${this.GS_URL}?action=getLog&name=${encodeURIComponent(n)}&days=${days}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const out = await res.json();
        return Array.isArray(out) ? out : [];
      } catch (e) {
        console.error('getLog error:', e);
        return [];
      }
    };
    // Gộp nhật ký của mọi cách gõ tên (vd. "Anh thu japan" → Anh Thư)
    const names = this.KIDS.length ? this.namesOf(name) : [name];
    const lists = await Promise.all(names.map(one));
    const seen = new Set();
    return lists.flat().filter(l => {
      const k = JSON.stringify(l);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    }).sort((a, b) => new Date(b.time) - new Date(a.time));
  }
};

window.API = API;
