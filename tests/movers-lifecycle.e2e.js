// Real app + Speak; controlled browser speech events, no real MP3/voice claim.
const { chromium } = require('playwright');
const assert = require('assert');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:8773/';
function speechStub() {
  let generation = 0;
  window.__speechCount = 0; window.__failAt = -1;
  class U { constructor(text) { this.text = text; } }
  const synth = {
    getVoices: () => [{ name: 'Controlled English', lang: 'en-US', localService: true }],
    addEventListener() {}, cancel() { generation++; },
    speak(u) {
      const g = generation, n = ++window.__speechCount;
      setTimeout(() => {
        if (g !== generation) return;
        const cb = n === window.__failAt ? u.onerror : u.onend;
        if (cb) cb({ error: 'synthesis-failed' });
      }, 10);
    }
  };
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: U, configurable: true });
  Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
}
const raw = state => state.origins.map(o => ({ origin: o.origin, localStorage: o.localStorage.slice().sort((a,b) => a.name.localeCompare(b.name)) })).sort((a,b) => a.origin.localeCompare(b.origin));
(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
  let checks = 0;
  const ok = (v, m) => { assert.ok(v, m); checks++; };
  try {
    for (const width of [390, 1280]) {
      const ctx = await browser.newContext({ viewport: { width, height: 844 } });
      await ctx.addInitScript(speechStub);
      let posts = 0;
      await ctx.route('https://script.google.com/**', r => { if (r.request().method() === 'POST') posts++; return r.fulfill({ body: '[]', contentType: 'application/json' }); });
      const p = await ctx.newPage(), errors = [];
      p.on('pageerror', e => errors.push(e.message));
      await p.goto(BASE + '?pilot=1');
      await p.fill('#nameInput', 'Movers lifecycle'); await p.click('#btnStart');
      await p.waitForFunction(() => window.App && App.allData);
      await p.addStyleTag({ url: BASE + 'movers.css' });
      await p.addScriptTag({ url: BASE + 'js/movers-audio.js' });
      await p.addScriptTag({ url: BASE + 'js/qtypes/movers-listen-p4.js' });
      await p.evaluate(async () => {
        const t = (await (await fetch('tests/fixtures/movers-listening-p4.json')).json()).topic;
        window.__topic = { ...t, questions: MoversP4.splitExample(t.questions).scored };
        // Fail first utterance of pass TWO: pass one must remain counted.
        Quiz.start(__topic, 'Tiếng Anh', { mode: 'test', subjectId: 'tieng-anh' });
        // Speak queues all utterances of pass one synchronously during render.
        window.__failAt = window.__speechCount + 1;
      });
      await p.waitForFunction(() => document.querySelector('.mv-audio-status').textContent.includes('Chưa phát được'));
      ok(await p.locator('.mv-btn-play').isEnabled(), 'real Speak error enables retry');
      await p.click('.mv-btn-stop');
      const speechBeforeRetry = await p.evaluate(() => { window.__failAt = -1; return window.__speechCount; });
      await p.click('.mv-btn-play');
      await p.waitForFunction(() => document.querySelector('.mv-audio-status').textContent.includes('Đã nghe đủ 2'));
      ok(await p.evaluate(n => window.__speechCount - n === Quiz.questions[Quiz.curIdx].audio.lines.length, speechBeforeRetry), 'retry plays exactly one remaining pass after second-pass error');
      ok(await p.locator('.mv-btn-play').isDisabled(), 'retry completes exactly remaining pass');
      const callback = await p.evaluate(() => new Promise(resolve => {
        window.__failAt = window.__speechCount + 1;
        Speak.speakParts([{ text: 'Legacy callback', lang: 'en' }], () => resolve('done'));
      }));
      ok(callback === 'done', 'legacy two-argument Speak callback still runs on final error');
      // Snapshot AFTER ordinary app/profile initialization, BEFORE any answer.
      // Compare every raw key/value, including pilot keys, after actual tab close.
      const before = raw(await ctx.storageState());
      for (let i = 0; i < 2; i++) {
        await p.evaluate(i => { const q = Quiz.questions[Quiz.curIdx]; Quiz._qt.restore({ choice: i ? q.a : (q.a + 1) % 3 }); Quiz.submit(); Quiz.next(); }, i);
      }
      ok(await p.evaluate(() => Quiz.curIdx === 2 && Quiz.sessionDetails.length === 0 && Quiz.score === 0), 'two submissions stay in RAM');
      assert.deepStrictEqual(raw(await ctx.storageState()), before); checks++;
      await p.close({ runBeforeUnload: true });
      assert.deepStrictEqual(raw(await ctx.storageState()), before); checks++;
      const probe = await ctx.newPage(); await probe.goto(BASE + 'tests/fixtures/movers-listening-p4.json');
      assert.deepStrictEqual(raw(await ctx.storageState()), before); checks++;
      ok(errors.length === 0, 'no page exceptions: ' + errors.join(';'));
      ok(posts === 0, 'unfinished exam sends no remote POST');
      await ctx.close(); console.log('lifecycle OK ' + width + 'px');
    }
    console.log('movers lifecycle e2e OK — ' + checks + ' checks');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
