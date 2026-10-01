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

  /** Đoán ngôn ngữ của một đoạn chữ. */
  detect(text, hint) {
    const t = String(text || '');
    if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(t)) return 'vi';
    const words = (t.match(/[A-Za-z]{2,}/g) || []).length;
    if (words >= 1 && (hint === 'en' || words >= 2)) return 'en';
    return hint || 'vi';
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

  _utter(text, lang) {
    const u = new SpeechSynthesisUtterance(this.normalize(text, lang));
    const v = this.voiceFor(lang);
    if (v) u.voice = v;
    u.lang = v ? v.lang : (lang === 'vi' ? 'vi-VN' : 'en-US');
    u.rate = lang === 'vi' ? 0.95 : 0.85;
    return u;
  },

  /** Đọc lần lượt nhiều đoạn [{text, lang}]. */
  speakParts(parts, onDone) {
    if (!this.supported) return;
    this.stop();
    const list = parts.filter(p => p && String(p.text || '').trim());
    if (!list.length) return;
    this._speaking = true;
    this._setBtnState(true);
    const token = {};
    this._current = token;
    list.forEach((p, i) => {
      const u = this._utter(p.text, p.lang);
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
  _q: null,
  _hint: 'vi',

  attach(q, subjectId) {
    this.stop();
    this._q = q;
    this._hint = (subjectId === 'tieng-anh' || subjectId === 'toan-tieng-anh') ? 'en' : 'vi';
    this.refreshButton();
  },

  _parts() {
    const q = this._q;
    if (!q) return [];
    const qLang = this.detect(q.q, this._hint);
    const parts = [{ text: q.q, lang: qLang }];
    const btns = Array.from(document.querySelectorAll('#ansGrid .ans-btn'));
    const choices = btns.length ? btns.map(b => b.textContent) : (q.choices || []);
    if (choices.length) {
      parts.push({ text: qLang === 'en' ? 'The answers are:' : 'Các đáp án là:', lang: qLang });
      choices.forEach(c => parts.push({ text: c, lang: this.detect(c, qLang) }));
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
    const lang = this._q ? this.detect(this._q.q, this._hint) : this._hint;
    const ok = this.supported && this.hasVoice(lang);
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
