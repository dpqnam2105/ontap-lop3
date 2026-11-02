// =============================================
// SPEAK.JS — nút 🔊 đọc to câu hỏi và các đáp án (giọng có sẵn của máy)
// Tiếng Việt: đọc dấu phép tính, đơn vị đo, phân số thành chữ.
// Tiếng Anh: chọn giọng tiếng Anh.
// =============================================

const Speak = {
  supported: typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
  _voices: [],
  _speaking: false,
  _current: null,

  init() {
    if (!this.supported) return;
    const load = () => { this._voices = window.speechSynthesis.getVoices() || []; this.refreshButton(); };
    load();
    if (typeof window.speechSynthesis.addEventListener === 'function') window.speechSynthesis.addEventListener('voiceschanged', load);
    else window.speechSynthesis.onvoiceschanged = load;
  },

  /** Giọng tốt nhất cho 'vi' hoặc 'en'. */
  voiceFor(lang) {
    const vs = this._voices.filter(v => (v.lang || '').toLowerCase().replace('_', '-').startsWith(lang));
    if (!vs.length) return null;
    const score = v => {
      const n = (v.name || '').toLowerCase();
      let s = 0;
      if (/natural|online|neural|google|premium|enhanced/.test(n)) s += 3;
      if (lang === 'en' && /en-us|en-gb/i.test(v.lang)) s += 2;
      if (v.localService === false) s += 1;
      return s;
    };
    return vs.sort((a, b) => score(b) - score(a))[0];
  },

  hasVoice(lang) { return !!this.voiceFor(lang); },

  VI_RE: /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i,

  /** Đoán ngôn ngữ của một đoạn chữ. Môn tiếng Anh (hint 'en'): đoạn không dấu Việt luôn là 'en', kể cả một từ (camped, began). */
  detect(text, hint) {
    const t = String(text || '');
    if (this.VI_RE.test(t)) return 'vi';
    if (hint === 'en' && /[A-Za-z]/.test(t)) return 'en';
    const words = (t.match(/[A-Za-z]{2,}/g) || []).length;
    if (words >= 2) return 'en';
    return hint || 'vi';
  },

  /**
   * Tách chuỗi trộn Việt–Anh thành các đoạn [{text, lang}] theo từng từ (chỉ dùng cho môn tiếng Anh).
   * Từ có dấu Việt → vi; từ Latin không dấu → en, trừ khi nằm kẹp giữa các từ Việt (vd "con", "Kim" trong câu Việt).
   * Số, dấu câu đi theo đoạn đang đọc. Môn khác: giữ nguyên một đoạn như cũ.
   */
  segments(text, hint) {
    const t = String(text || '');
    if (hint !== 'en') return t.trim() ? [{ text: t, lang: this.detect(t, hint) }] : [];
    if (!this.VI_RE.test(t)) return /[A-Za-z0-9]/.test(t) ? [{ text: t, lang: 'en' }] : [];
    const toks = t.split(/(\s+)/).filter(x => x !== '');
    const kind = toks.map(w => (/^\s+$/.test(w) ? 'sp' : this.VI_RE.test(w) ? 'vi' : /[A-Za-z]/.test(w) ? 'en' : 'neu'));
    const near = (i, step) => { for (let j = i + step; j >= 0 && j < toks.length; j += step) if (kind[j] === 'vi' || kind[j] === 'en') return kind[j]; return null; };
    const lang = kind.map((k, i) => {
      if (k !== 'en') return k;
      const l = near(i, -1), r = near(i, 1);
      return (l === 'vi' || l === null) && (r === 'vi' || r === null) && (l || r) ? 'vi' : 'en';
    });
    const out = [];
    let cur = null;
    toks.forEach((w, i) => {
      const k = lang[i];
      if (k === 'sp' || k === 'neu') { if (cur) cur.text += w; else out.pending = (out.pending || '') + w; return; }
      if (!cur || cur.lang !== k) { cur = { text: (out.pending || '') + w, lang: k }; out.pending = ''; out.push(cur); }
      else cur.text += w;
    });
    return out.map(p => ({ text: p.text.trim(), lang: p.lang })).filter(p => /[A-Za-zÀ-ỹ0-9]/.test(p.text));
  },

  UNITS_VI: { mm: 'mi-li-mét', cm: 'xăng-ti-mét', dm: 'đề-xi-mét', km: 'ki-lô-mét', m: 'mét', kg: 'ki-lô-gam', g: 'gam', ml: 'mi-li-lít', l: 'lít' },

  /** Đổi ký hiệu thành chữ để giọng đọc đọc đúng. */
  normalize(text, lang) {
    let t = String(text || '');
    t = t.replace(/[«»"“”]/g, ' ');
    t = t.replace(/(\d)[   .](?=\d{3}\b)/g, '$1'); // 25 014 → 25014
    if (lang === 'vi') {
      t = t.replace(/(\d+)\s*\/\s*(\d+)/g, '$1 phần $2');
      const NL = '(?![A-Za-zÀ-ỹ])';
      t = t.replace(new RegExp('(mm|cm|dm|km|m)²', 'g'), (m, u) => this.UNITS_VI[u] + ' vuông');
      t = t.replace(new RegExp('(\\d)\\s*(mm|cm|dm|km|kg|ml|m|g|l)' + NL, 'g'), (m, d, u) => d + ' ' + this.UNITS_VI[u]);
      t = t.replace(new RegExp('(^|[\\s(])(mm|cm|dm|km|kg|ml|m|g|l)(?=$|[\\s.,;:?!)])', 'g'), (m, a, u) => a + this.UNITS_VI[u]);
      t = t.replace(/÷/g, ' chia ').replace(/[×✕]/g, ' nhân ').replace(/(\d|\?|□)\s*:\s*(?=\d|\?|□)/g, '$1 chia ');
      t = t.replace(/(\d|\?|□|\))\s*[−–-]\s*(?=\d|\?|□|\()/g, '$1 trừ ');
      t = t.replace(/\+/g, ' cộng ').replace(/=/g, ' bằng ');
      t = t.replace(/</g, ' bé hơn ').replace(/>/g, ' lớn hơn ');
      t = t.replace(/bằng\s*\?/g, 'bằng mấy').replace(/[□…]|_{2,}|\.{3,}/g, ' chỗ trống ');
      t = t.replace(/\?\s*(?=[\d(])/g, ' số nào ');
      t = t.replace(/(\d+)\s*đ\b/g, '$1 đồng');
    } else {
      t = t.replace(/_{2,}|…|\.{3,}/g, ' blank ');
      t = t.replace(/=\s*\?/g, ' equals what').replace(/÷/g, ' divided by ').replace(/[×✕]/g, ' times ').replace(/(\d)\s*:\s*(?=\d)/g, '$1 divided by ');
      t = t.replace(/(\d)\s*[−–-]\s*(?=\d)/g, '$1 minus ').replace(/\+/g, ' plus ').replace(/=/g, ' equals ');
      t = t.replace(/\s[–—]\s/g, '. ');
    }
    return t.replace(/\s+/g, ' ').trim();
  },

  _utter(text, lang, rate) {
    const u = new SpeechSynthesisUtterance(this.normalize(text, lang));
    const v = this.voiceFor(lang);
    if (v) u.voice = v;
    u.lang = v ? v.lang : (lang === 'vi' ? 'vi-VN' : 'en-US');
    u.rate = typeof rate === 'number' ? rate : (lang === 'vi' ? 0.95 : 0.85);
    return u;
  },

  /** Đọc lần lượt nhiều đoạn [{text, lang}]. */
  speakParts(parts, onDone) {
    if (!this.supported) return;
    this.stop();
    // Đoạn chưa ghi lang → tách theo ngôn ngữ; đoạn Việt chỉ đọc khi máy có giọng Việt (không ép giọng Anh đọc tiếng Việt)
    const list = [];
    parts.forEach(p => {
      if (!p || !String(p.text || '').trim()) return;
      const segs = p.lang ? [p] : this.segments(p.text, this._hint).map(s => ({ ...s, rate: p.rate }));
      segs.forEach(s => { if (!(this._hint === 'en' && s.lang === 'vi' && !this.hasVoice('vi'))) list.push(s); });
    });
    if (!list.length) return;
    this._speaking = true;
    this._setBtnState(true);
    const token = {};
    this._current = token;
    list.forEach((p, i) => {
      const u = this._utter(p.text, p.lang, p.rate);
      if (i === list.length - 1) {
        u.onend = u.onerror = () => {
          if (this._current !== token) return;
          this._speaking = false;
          this._setBtnState(false);
          if (onDone) onDone();
        };
      }
      window.speechSynthesis.speak(u);
    });
  },

  stop() {
    if (!this.supported) return;
    this._current = null;
    this._speaking = false;
    try { window.speechSynthesis.cancel(); } catch (e) { /* bỏ qua */ }
    this._setBtnState(false);
  },

  // ─── Nút trên màn làm bài ───────────────────────────
  // Chỉ bật cho các môn này (Toán, Tiếng Việt: bé tự đọc đề)
  ENABLED_SUBJECTS: ['tieng-anh'],
  _q: null,
  _subject: '',
  _hint: 'vi',

  attach(q, subjectId) {
    this.stop();
    this._q = q;
    this._subject = subjectId || '';
    this._hint = (subjectId === 'tieng-anh' || subjectId === 'toan-tieng-anh') ? 'en' : 'vi';
    this.refreshButton();
  },

  /** Dạng bài của câu đang hiện (registry js/qtypes). Không có registry → trắc nghiệm. */
  _type() { return (window.QTypes && this._q) ? QTypes.forQuestion(this._q) : null; },

  _parts() {
    const q = this._q;
    if (!q || q._spNoHelp) return [];
    // Dạng mới: tự quyết đọc gì (vd. sắp xếp câu chỉ đọc đề; nghe-chọn-tranh không dùng nút này)
    const T = this._type();
    if (T && !T.legacy) return T.readAloud === false || !T.speakParts ? [] : T.speakParts(q);
    // Đề đọc theo từng đoạn ngôn ngữ; đáp án đọc đúng thứ tự nút đang hiện (đã đảo), không đọc gợi ý / giải thích / chú nghĩa
    const parts = this.segments(q.q, this._hint);
    const btns = Array.from(document.querySelectorAll('#ansGrid .ans-btn'));
    const choices = btns.length ? btns.map(b => b.textContent) : (q.choices || []);
    if (choices.length) {
      const lead = this._hint === 'en' ? 'en' : (parts[0] ? parts[0].lang : this._hint);
      parts.push({ text: lead === 'en' ? 'The answers are:' : 'Các đáp án là:', lang: lead });
      choices.forEach(c => this.segments(c, this._hint).forEach(s => parts.push(s)));
    }
    return parts;
  },

  refreshButton() {
    const card = document.querySelector('#screenQuiz .question-card');
    if (!card) return;
    let btn = document.getElementById('btnSpeak');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'btnSpeak';
      btn.type = 'button';
      btn.className = 'speak-btn';
      btn.setAttribute('aria-label', 'Đọc to câu hỏi');
      btn.innerHTML = '<span class="speak-ic">🔊</span><span class="speak-lbl">Đọc to</span>';
      btn.addEventListener('click', () => {
        if (this._speaking) { this.stop(); return; }
        this.speakParts(this._parts());
      });
      card.insertBefore(btn, card.firstChild);
    }
    // Môn tiếng Anh: cần giọng Anh (đoạn Việt chỉ đọc nếu máy có giọng Việt). Môn khác giữ cách cũ.
    const lang = this._hint === 'en' ? 'en' : (this._q ? this.detect(this._q.q, this._hint) : this._hint);
    const T = this._type();
    const ok = !(this._q && this._q._spNoHelp) && this.supported && this.ENABLED_SUBJECTS.includes(this._subject) && this.hasVoice(lang) && !(T && T.readAloud === false);
    btn.classList.toggle('hidden', !ok);
    this._setBtnState(this._speaking);
  },

  _setBtnState(on) {
    const btn = document.getElementById('btnSpeak');
    if (!btn) return;
    btn.classList.toggle('speaking', !!on);
    const lbl = btn.querySelector('.speak-lbl');
    if (lbl) lbl.textContent = on ? 'Dừng' : 'Đọc to';
  }
};

window.Speak = Speak;
