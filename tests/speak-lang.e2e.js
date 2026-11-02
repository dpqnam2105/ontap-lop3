// Nút 🔊 trên trình duyệt thật: câu lô 4–6 đọc giọng en (đề + đáp án theo thứ tự nút đã đảo), chú nghĩa Việt hiện riêng và không bị đọc.
// Chạy: (cd <repo> && python3 -m http.server 8765) rồi node tests/speak-lang.e2e.js   (audit giọng đọc 02/11/2026)
const { chromium } = require('playwright');
const assert = require('assert');
const URL = process.env.BASE_URL || 'http://localhost:8765/';

const FAKE_SPEECH = langs => {
  window.__spoken = [];
  class U { constructor(t) { this.text = t; this.rate = 1; this.lang = ''; this.voice = null; } }
  const voices = (langs || ['en-US', 'vi-VN']).map(l => ({ lang: l, name: 'Test ' + l, localService: true }));
  const synth = {
    getVoices: () => voices, addEventListener() {}, cancel() {},
    speak(u) { window.__spoken.push({ text: u.text, lang: u.lang, voice: u.voice && u.voice.lang }); setTimeout(() => u.onend && u.onend(), 5); }
  };
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: U, configurable: true, writable: true });
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true, writable: true });
};

const MIXED = [
  ['en_nik3-unit3_q013', [['vi', 'đèn pin'], ['en', 'in English is:']]],
  ['en_nik3-unit1_q033', [['vi', 'Con đang đứng ở ngã tư. Muốn đến nhà hát'], ['en', '(theater),'], ['vi', 'con phải đi vào con đường bên tay trái.'], ['en', 'What do you say?']]],
];

(async () => {
  const b = await chromium.launch(process.env.PLAYWRIGHT_CHANNEL ? { channel: process.env.PLAYWRIGHT_CHANNEL } : {});
  let checks = 0;
  const ok = (v, m) => { assert.ok(v, m); checks++; };
  try {
    for (const [vp, mobile] of [[{ width: 390, height: 844 }, true], [{ width: 1280, height: 900 }, false]]) {
      const tag = vp.width + 'px';
      const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile });
      await ctx.route('https://script.google.com/**', r => r.fulfill({ contentType: 'application/json',
        body: new globalThis.URL(r.request().url()).searchParams.get('action') === 'get' ? '{"ok":true,"found":false,"ver":0}' : '[]' }));
      await ctx.addInitScript(FAKE_SPEECH);
      const p = await ctx.newPage();
      const errs = []; p.on('pageerror', e => errs.push(e.message));
      await p.goto(URL); await p.waitForTimeout(700);
      await p.fill('#nameInput', 'Thỏ'); await p.click('#btnStart'); await p.waitForTimeout(300);
      await p.waitForFunction(() => window.App && App.allData && App.allData.subjects && App.allData.subjects.length);
      const openQ = id => p.evaluate(id => {
        const s = App.allData.subjects.find(x => x.id === 'tieng-anh');
        const t = s.topics.find(x => x.questions.some(q => q.id === id));
        const i = t.questions.findIndex(q => q.id === id);
        Quiz.start(t, s.name, { subjectId: s.id, allowed: [i], mode: 'practice' });
        return t.questions[i];
      }, id);
      for (const id of ['en_nik3-past-irregular_q006', 'en_nik3-past-ed_q002', 'en_nik3-past-didnt_q015', 'en_nik3-past-irregular_q024']) {
        const q = await openQ(id);
        await p.waitForTimeout(150);
        ok(await p.isVisible('#btnSpeak'), tag + ' ' + id + ': có nút đọc');
        const gloss = await p.evaluate(() => { const g = document.getElementById('qGloss'); return g && !g.classList.contains('hidden') ? g.textContent : ''; });
        if (q.gloss) ok(gloss.includes(q.gloss), tag + ' ' + id + ': hiện chú nghĩa');
        else ok(!gloss, tag + ' ' + id + ': không có chú nghĩa thì ẩn');
        const shown = await p.$$eval('#ansGrid .ans-btn', bs => bs.map(x => x.textContent));
        await p.evaluate(() => { window.__spoken = []; });
        await p.click('#btnSpeak'); await p.waitForTimeout(200);
        const sp = await p.evaluate(() => window.__spoken);
        ok(sp.length === 2 + shown.length, tag + ' ' + id + ': đọc đề + câu dẫn + ' + shown.length + ' đáp án (' + sp.length + ')');
        ok(sp.every(u => /^en/.test(u.lang) && /^en/.test(u.voice || '')), tag + ' ' + id + ': mọi đoạn giọng en ' + JSON.stringify(sp));
        assert.deepStrictEqual(sp.slice(2).map(u => u.text), shown.map(t => t.replace(/\s+/g, ' ').trim())); checks++;
        const all = sp.map(u => u.text).join(' ');
        ok(!all.includes(q.hint.slice(0, 20)) && !all.includes(q.explain.slice(0, 20)), tag + ' ' + id + ': không đọc gợi ý/giải thích');
        ok(!q.gloss || !all.includes(q.gloss.split(':')[1].trim()), tag + ' ' + id + ': không đọc chú nghĩa');
      }
      // Đề cũ trộn Việt–Anh (q.speak khai báo): so đủ chữ + giọng từng câu đọc
      for (const [id, expQ] of MIXED) {
        const q = await openQ(id);
        await p.waitForTimeout(150);
        const shown = await p.$$eval('#ansGrid .ans-btn', bs => bs.map(x => x.textContent));
        await p.evaluate(() => { window.__spoken = []; });
        await p.click('#btnSpeak'); await p.waitForTimeout(200);
        const sp = await p.evaluate(() => window.__spoken.map(u => [u.lang.slice(0, 2), u.text, (u.voice || '').slice(0, 2)]));
        assert.deepStrictEqual(sp, [...expQ.map(([l, t]) => [l, t, l]), ['en', 'The answers are:', 'en'], ...shown.map(c => ['en', c, 'en'])], tag + ' ' + id); checks++;
      }
      ok(await p.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), tag + ': không tràn ngang');
      ok(!errs.length, tag + ': pageerror ' + errs.join(' | '));
      await ctx.close();
      console.log('✔', tag);
    }
    // Máy chỉ có giọng en: bỏ trọn cụm Việt, không sót "pin" / "con" đọc giọng Anh
    {
      const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
      await ctx.route('https://script.google.com/**', r => r.fulfill({ contentType: 'application/json',
        body: new globalThis.URL(r.request().url()).searchParams.get('action') === 'get' ? '{"ok":true,"found":false,"ver":0}' : '[]' }));
      await ctx.addInitScript(FAKE_SPEECH, ['en-US']);
      const p = await ctx.newPage();
      await p.goto(URL); await p.waitForTimeout(700);
      await p.fill('#nameInput', 'Thỏ'); await p.click('#btnStart'); await p.waitForTimeout(300);
      await p.waitForFunction(() => window.App && App.allData && App.allData.subjects && App.allData.subjects.length);
      for (const [id, expQ] of MIXED) {
        await p.evaluate(id => {
          const s = App.allData.subjects.find(x => x.id === 'tieng-anh');
          const t = s.topics.find(x => x.questions.some(q => q.id === id));
          Quiz.start(t, s.name, { subjectId: s.id, allowed: [t.questions.findIndex(q => q.id === id)], mode: 'practice' });
        }, id);
        await p.waitForTimeout(150);
        ok(await p.isVisible('#btnSpeak'), 'chỉ giọng en ' + id + ': vẫn có nút');
        const shown = await p.$$eval('#ansGrid .ans-btn', bs => bs.map(x => x.textContent));
        await p.evaluate(() => { window.__spoken = []; });
        await p.click('#btnSpeak'); await p.waitForTimeout(200);
        const sp = await p.evaluate(() => window.__spoken.map(u => [u.lang.slice(0, 2), u.text]));
        assert.deepStrictEqual(sp, [...expQ.filter(([l]) => l === 'en'), ['en', 'The answers are:'], ...shown.map(c => ['en', c])], 'chỉ giọng en ' + id); checks++;
      }
      await ctx.close();
      console.log('✔ chỉ giọng en');
    }
    console.log('speak-lang e2e OK —', checks, 'kiểm tra');
  } finally { await b.close(); }
})().catch(e => { console.error(e); process.exit(1); });
