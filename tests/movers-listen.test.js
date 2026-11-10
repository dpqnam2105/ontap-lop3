'use strict';
// node movers-listen.test.js — không cần thư viện. DOM và Speak đều là stub theo API thật của app:
//   Speak.speakParts(parts, callback)   Speak.stop()
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const HERE = __dirname;
const find = (...c) => { for (const x of c) if (fs.existsSync(path.join(HERE, x))) return path.join(HERE, x); throw new Error('thiếu ' + c.join('|')); };
const F_AUDIO = find('movers-audio.js', '../js/movers-audio.js');
const F_P4 = find('movers-listen-p4.js', '../js/qtypes/movers-listen-p4.js');
const F_DATA = find('movers-listening-p4.json', '../data/pilot/movers-listening-p4.json', '../data-lop3/tieng-anh/movers-listening-p4.json');
const DATA = JSON.parse(fs.readFileSync(F_DATA, 'utf8'));
const QS = DATA.topic.questions;

/* ---------------- DOM stub ---------------- */
function makeNode(tag) {
  const n = {
    tagName: String(tag).toUpperCase(), children: [], attrs: {}, _text: '',
    className: '', hidden: false, disabled: false, style: {}, listeners: {},
    classList: {
      add(c) { if (!n._cls().includes(c)) n.className = (n.className + ' ' + c).trim(); },
      remove(c) { n.className = n._cls().filter(x => x !== c).join(' '); },
      contains(c) { return n._cls().includes(c); },
      toggle(c, on) { on ? this.add(c) : this.remove(c); }
    },
    _cls() { return n.className.split(/\s+/).filter(Boolean); },
    get textContent() { return n._text; },
    set textContent(v) { n._text = String(v); },
    set innerHTML(v) { if (v === '') n.children = []; },
    appendChild(c) { n.children.push(c); return c; },
    setAttribute(k, v) { n.attrs[k] = v; },
    addEventListener(ev, fn) { (n.listeners[ev] = n.listeners[ev] || []).push(fn); },
    dispatch(ev) { (n.listeners[ev] || []).slice().forEach(f => f({ type: ev })); },
    click() { if (!n.disabled) n.dispatch('click'); },
    querySelector(sel) {
      const want = sel.replace('.', '');
      const walk = (x) => {
        for (const c of x.children) { if (c._cls().includes(want)) return c; const r = walk(c); if (r) return r; }
        return null;
      };
      return walk(n);
    },
    queryAll(cls) {
      const out = []; const walk = (x) => x.children.forEach(c => { if (c._cls().includes(cls)) out.push(c); walk(c); });
      walk(n); return out;
    }
  };
  return n;
}

/* ---------------- sandbox ---------------- */
function boot(opts) {
  opts = opts || {};
  const log = { spoken: [], speakStops: 0, audios: [] };
  let headResolvers = [];
  const sandbox = {
    console, setTimeout, clearTimeout, Promise,
    QTypes: {
      _reg: {},
      register(n, d) { this._reg[n] = d; },
      isIndex(v, len) { return Number.isInteger(v) && v >= 0 && v < len; }
    },
    Speak: {
      // API THẬT: callback vị trí thứ hai, Speak.stop()
      speakParts(parts, cb) {
        log.spoken.push(parts);
        const t = setTimeout(() => { if (typeof cb === 'function') cb(); }, 1);
        return t;
      },
      stop() { log.speakStops++; }
    },
    API: { pilotOn: () => !!opts.pilot },
    document: { createElement: makeNode },
    fetch: (url) => opts.headPending
      ? new Promise(res => headResolvers.push(() => res({ ok: true })))
      : Promise.resolve({ ok: !!opts.mp3Ok }),
    Audio: function (src) {
      const a = makeNode('audio');
      a.src = src; a.playbackRate = 1;
      a.play = () => { log.audios.push(a); return opts.playBlocked ? Promise.reject(new Error('blocked')) : Promise.resolve(); };
      a.pause = () => { a.paused = true; };
      return a;
    }
  };
  sandbox.window = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(F_AUDIO, 'utf8'), sandbox);
  vm.runInContext(fs.readFileSync(F_P4, 'utf8'), sandbox);
  return { sb: sandbox, log, def: sandbox.QTypes._reg['movers-listen-p4'], flushHead: () => { headResolvers.splice(0).forEach(f => f()); } };
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const same = (a, b, m) => assert.strictEqual(JSON.stringify(a), JSON.stringify(b), m);
let pass = 0, fail = 0;
const jobs = [];
const t = (name, fn) => jobs.push([name, fn]);

function mountQuestion(env, q, mode) {
  const host = makeNode('div');
  const changes = [];
  const inst = env.def.render({ host, q, mode, onChange: (v) => changes.push(v) });
  return { host, inst, changes, cards: host.queryAll('mv-choice'),
           btnPlay: host.queryAll('mv-btn-play')[0], btnStop: host.queryAll('mv-btn-stop')[0],
           btnSlow: host.queryAll('mv-btn-slow')[0], status: host.queryAll('mv-audio-status')[0] };
}

/* ---------------- dữ liệu ---------------- */
t('6 câu: 1 ví dụ + 5 câu tính điểm', () => {
  assert.strictEqual(QS.length, 6);
  assert.strictEqual(new Set(QS.map(q => q.id)).size, 6);
  const ex = QS.filter(q => q.example === true);
  assert.strictEqual(ex.length, 1);
  assert.strictEqual(ex[0].scored, false);
  assert.strictEqual(DATA.topic.count, 5);
});

t('mọi câu qua validateQuestion', () => {
  const { sb } = boot();
  for (const q of QS) {
    const errs = sb.MoversP4.validate(q);
    assert.strictEqual(errs.length, 0, q.id + ': ' + errs.join('; '));
  }
});

t('validate bắt lỗi dữ liệu, kể cả Part 4 phải đúng 3 lựa chọn', () => {
  const { sb } = boot();
  const base = QS[1];
  const bad = (mut, part) => {
    const q = JSON.parse(JSON.stringify(base)); mut(q);
    const errs = sb.MoversP4.validate(q);
    assert.ok(errs.some(e => e.includes(part)), 'không bắt: ' + part + ' → ' + errs.join('; '));
  };
  bad(q => { q.choices.pop(); q.choiceImages.pop(); }, 'đúng 3 lựa chọn');
  bad(q => { q.choices.push('extra'); q.choiceImages.push('x.svg'); }, 'đúng 3 lựa chọn');
  bad(q => { q.choices[1] = '  '; }, 'nhãn lựa chọn rỗng');
  bad(q => { q.choiceImages[2] = ''; }, 'đường dẫn ảnh rỗng');
  bad(q => { q.a = 9; }, 'a ngoài phạm vi');
  bad(q => { q.audio.fallback.text = 'Man: Hi.'; }, 'nhãn người nói');
  bad(q => { delete q.audio.transcript; }, 'transcript');
  bad(q => { q.example = true; }, 'scored: false');
});

t('đáp án đúng như đã duyệt', () => {
  const want = ['orange', 'swimming pool', 'played football', 'tiger', 'baseball cap', "five o'clock"];
  QS.forEach((q, i) => assert.strictEqual(q.choices[q.a], want[i], q.id));
});

t('fallback.text khớp audio.lines, transcript giữ nhãn', () => {
  for (const q of QS) {
    assert.strictEqual(q.audio.fallback.text, q.audio.lines.map(l => l.text).join(' '), q.id);
    assert.ok(!/\b(Girl|Boy|Man|Woman)\s*:/.test(q.audio.fallback.text), q.id);
    assert.ok(/\b(Girl|Boy|Man|Woman)\s*:/.test(q.audio.transcript), q.id);
  }
});

/* ---------------- chỉ số đáp án ---------------- */
t('chỉ số -1 / 3 / 99 bị từ chối ở cả validateResponse và grade', () => {
  const { sb, def } = boot();
  const q = QS[1];
  for (const bad of [-1, 3, 99, 1.5, '1', null, undefined]) {
    assert.strictEqual(def.validateResponse(q, { choice: bad }).ok, false, 'nhận nhầm ' + bad);
    same(sb.MoversP4.grade(q, { choice: bad }), { valid: false, correct: false }, 'grade nhận nhầm ' + bad);
    assert.strictEqual(sb.MoversP4.responseKey(q, { choice: bad }), '');
    assert.strictEqual(sb.MoversP4.describeResponse(q, { choice: bad }), '(chưa chọn)');
  }
  assert.strictEqual(def.validateResponse(q, { choice: 2 }).ok, true);
  same(sb.MoversP4.grade(q, { choice: q.a }), { valid: true, correct: true });
});

t('splitExample + grade câu ví dụ', () => {
  const { sb } = boot();
  const s = sb.MoversP4.splitExample(QS);
  assert.strictEqual(s.example.length, 1);
  assert.strictEqual(s.scored.length, 5);
  assert.strictEqual(sb.MoversP4.grade(QS[0], { choice: QS[0].a }).scored, false);
  assert.strictEqual(sb.MoversP4.grade(QS[1], { choice: QS[1].a }).scored, undefined);
});

/* ---------------- Speak API thật ---------------- */
t('TTS gọi đúng chữ ký speakParts(parts, callback) và chỉ đọc lời thoại', async () => {
  const { sb, log } = boot();
  const st = await sb.MoversAudio.play(QS[1], {});
  assert.strictEqual(st, 'ended', 'callback vị trí thứ hai không được gọi');
  same(log.spoken[0].map(p => p.text), QS[1].audio.lines.map(l => l.text));
});

t('stop() gọi Speak.stop()', async () => {
  const { sb, log } = boot();
  sb.MoversAudio.play(QS[1], {});
  sb.MoversAudio.stop();
  assert.ok(log.speakStops >= 1, 'không gọi Speak.stop()');
});

t('nghe chậm dùng rateSlow', async () => {
  const { sb, log } = boot();
  await sb.MoversAudio.play(QS[1], {});
  await sb.MoversAudio.play(QS[1], { slow: true });
  assert.strictEqual(log.spoken[0][0].rate, 0.85);
  assert.strictEqual(log.spoken[1][0].rate, 0.6);
});

t('playTwice: lượt hai chạy sau gap, onEnded gọi một lần', async () => {
  const { sb, log } = boot();
  let ended = 0, passes = [];
  const p = sb.MoversAudio.playTwice(QS[2], { gapMs: 10, onPass: (n) => passes.push(n), onEnded: () => ended++ });
  await sleep(5);
  assert.strictEqual(log.spoken.length, 1, 'lượt một');
  assert.strictEqual(ended, 0, 'chưa được kết thúc sau lượt một');
  const st = await p;
  assert.strictEqual(st, 'ended');
  assert.strictEqual(log.spoken.length, 2, 'lượt hai');
  same(passes, [1, 2]);
  assert.strictEqual(ended, 1);
});

t('stop() huỷ lượt hai đang chờ', async () => {
  const { sb, log } = boot();
  let ended = 0;
  sb.MoversAudio.playTwice(QS[2], { gapMs: 30, onEnded: () => ended++ });
  await sleep(5);
  sb.MoversAudio.stop();
  await sleep(60);
  assert.strictEqual(log.spoken.length, 1, 'đã dừng mà vẫn phát lượt hai');
  assert.strictEqual(ended, 0, 'không được gọi onEnded sau khi dừng');
});

/* ---------------- callback đến muộn ---------------- */
t('stop() trong lúc chờ HEAD thì MP3 cũ không được phát', async () => {
  const env = boot({ headPending: true });
  const q = JSON.parse(JSON.stringify(QS[1])); q.audio.src = 'audio/x.mp3';
  let ended = 0;
  env.sb.MoversAudio.play(q, { onEnded: () => ended++ });
  await sleep(5);
  env.sb.MoversAudio.stop();
  env.flushHead();
  await sleep(20);
  assert.strictEqual(env.log.audios.length, 0, 'MP3 cũ vẫn phát sau khi dừng');
  assert.strictEqual(ended, 0, 'callback muộn vẫn chạy');
});

t('chuyển câu khi audio chưa xong: lượt cũ bị vô hiệu', async () => {
  const env = boot();
  let endedA = 0;
  env.sb.MoversAudio.playTwice(QS[1], { gapMs: 30, onEnded: () => endedA++ });
  await sleep(5);
  const st = await env.sb.MoversAudio.play(QS[3], {});      // sang câu khác
  assert.strictEqual(st, 'ended');
  await sleep(50);
  assert.strictEqual(endedA, 0, 'câu cũ vẫn báo kết thúc');
});

t('MP3 lỗi giữa chừng thì rơi về TTS', async () => {
  const env = boot({ mp3Ok: true });
  const q = JSON.parse(JSON.stringify(QS[1])); q.audio.src = 'audio/x.mp3';
  const p = env.sb.MoversAudio.play(q, {});
  await sleep(5);
  assert.strictEqual(env.log.audios.length, 1, 'chưa thử MP3');
  env.log.audios[0].dispatch('error');
  const st = await p;
  assert.strictEqual(st, 'ended');
  assert.strictEqual(env.log.spoken.length, 1, 'không rơi về TTS');
});

t('trình duyệt chặn phát: trả về error, không treo', async () => {
  const env = boot({ mp3Ok: true, playBlocked: true });
  const q = JSON.parse(JSON.stringify(QS[1])); q.audio.src = 'audio/x.mp3';
  const st = await env.sb.MoversAudio.play(q, {});
  assert.strictEqual(st, 'error');
});

/* ---------------- giao diện ---------------- */
t('chọn tranh gọi onChange(true) để mở nút Kiểm tra', () => {
  const env = boot();
  const m = mountQuestion(env, QS[1], 'practice');
  m.cards[2].click();
  same(m.changes, [true], 'onChange phải nhận true');
  same(m.inst.getResponse(), { choice: 2 });
});

t('luyện: có nút Nghe chậm; mô phỏng: không có', () => {
  const env = boot();
  assert.ok(mountQuestion(env, QS[1], 'practice').btnSlow, 'luyện phải có nghe chậm');
  assert.ok(!mountQuestion(env, QS[1], 'test').btnSlow, 'mô phỏng không được có nghe chậm');
});

t('ctx.mode = "test" được map sang mô phỏng', () => {
  const { sb } = boot();
  assert.strictEqual(sb.MoversP4.modeOf({ mode: 'test' }), 'exam');
  assert.strictEqual(sb.MoversP4.modeOf({ mode: 'exam' }), 'exam');
  assert.strictEqual(sb.MoversP4.modeOf({ mode: 'practice' }), 'practice');
  assert.strictEqual(sb.MoversP4.modeOf({}), 'practice');
  assert.strictEqual(sb.MoversP4.feedbackPolicy({ mode: 'test' }), 'deferred');
  assert.strictEqual(sb.MoversP4.feedbackPolicy({ mode: 'practice' }), 'immediate');
});

t('mô phỏng: chỉ báo đủ lượt sau khi nghe xong thật', async () => {
  const env = boot();
  const m = mountQuestion(env, QS[1], 'test');
  assert.ok(/Đang phát/.test(m.status.textContent), 'lúc đầu phải là đang phát: ' + m.status.textContent);
  await sleep(1100);
  assert.ok(/Đã nghe đủ 2 lượt/.test(m.status.textContent), 'sau hai lượt: ' + m.status.textContent);
});

t('mô phỏng: bấm Dừng giữa chừng vẫn nghe lại được', async () => {
  const env = boot();
  const m = mountQuestion(env, QS[1], 'test');
  await sleep(5);
  m.btnStop.click();
  assert.strictEqual(m.btnPlay.disabled, false, 'dừng rồi phải bật lại nút Nghe');
  assert.ok(/Còn \d lượt nghe/.test(m.status.textContent), m.status.textContent);
  m.btnPlay.click();
  await sleep(5);
  assert.ok(env.log.spoken.length >= 2, 'không phát lại được');
});

t('mô phỏng: showResult không lộ đúng/sai khi chưa chữa', () => {
  const env = boot();
  const m = mountQuestion(env, QS[1], 'test');
  m.cards[0].click();
  m.inst.showResult({ correct: true });
  assert.ok(!m.cards[0].classList.contains('is-correct'), 'lộ đúng/sai trong mô phỏng');
  assert.ok(!m.cards[q_a(QS[1])].classList.contains('is-answer'), 'lộ đáp án');
  const tr = m.host.queryAll('mv-transcript')[0];
  assert.strictEqual(tr.hidden, true, 'lộ transcript');
});

t('mô phỏng: chữa cuối phần mới tô màu và hiện transcript', () => {
  const env = boot();
  const m = mountQuestion(env, QS[1], 'test');
  m.cards[0].click();
  m.inst.showResult({ correct: false, reveal: true });
  assert.ok(m.cards[0].classList.contains('is-wrong'));
  assert.ok(m.cards[q_a(QS[1])].classList.contains('is-answer'));
  assert.strictEqual(m.host.queryAll('mv-transcript')[0].hidden, false);
  assert.strictEqual(m.host.queryAll('mv-choice-label')[0].hidden, false, 'nhãn phải hiện khi chữa');
});

t('luyện: chữa ngay sau khi nộp', () => {
  const env = boot();
  const m = mountQuestion(env, QS[1], 'practice');
  m.cards[1].click();
  m.inst.showResult({ correct: true });
  assert.ok(m.cards[1].classList.contains('is-correct'));
});

t('nhãn lựa chọn và transcript ẩn lúc đầu, alt ảnh rỗng', () => {
  const env = boot();
  const m = mountQuestion(env, QS[1], 'practice');
  m.host.queryAll('mv-choice-label').forEach(c => assert.strictEqual(c.hidden, true));
  assert.strictEqual(m.host.queryAll('mv-transcript')[0].hidden, true);
});

t('restore khôi phục lựa chọn và mở lại nút Kiểm tra', () => {
  const env = boot();
  const m = mountQuestion(env, QS[1], 'practice');
  m.inst.restore({ choice: 2 });
  same(m.inst.getResponse(), { choice: 2 });
  same(m.changes, [true]);
  m.inst.restore({ choice: 99 });
  same(m.inst.getResponse(), { choice: 2 }, 'chỉ số rác không được ghi đè');
});

t('destroy dừng audio', async () => {
  const env = boot();
  const m = mountQuestion(env, QS[1], 'test');
  await sleep(5);
  m.inst.destroy();
  await sleep(60);
  assert.strictEqual(env.log.spoken.length, 1, 'destroy xong vẫn phát tiếp');
});

/* ---------------- hợp đồng ---------------- */
t('imagesReady: pending chỉ chạy trong chế độ thử', () => {
  const off = boot({ pilot: false }), on = boot({ pilot: true });
  const q = QS[1];
  assert.strictEqual(q.choiceImageReview.status, 'pending');
  assert.strictEqual(off.def.imagesReady(q), false);
  assert.strictEqual(on.def.imagesReady(q), true);
});

t('đăng ký đủ hàm, tắt nút đọc chung', () => {
  const { def } = boot();
  for (const k of ['validateQuestion', 'validateResponse', 'grade', 'describeResponse',
                   'describeAnswer', 'responseKey', 'render', 'imagesReady', 'feedbackPolicy'])
    assert.strictEqual(typeof def[k], 'function', 'thiếu ' + k);
  assert.strictEqual(def.readAloud, false);
  assert.strictEqual(def.speakParts({}), null);
});

function q_a(q) { return q.a; }

t('cancel resolves even when real Speak.stop suppresses its end callback', async () => {
  const env=boot(); env.sb.Speak.speakParts=()=>{};
  const pending=env.sb.MoversAudio.play(QS[1],{});env.sb.MoversAudio.stop();
  assert.strictEqual(await Promise.race([pending,sleep(60).then(()=> 'hung')]),'cancelled');
});
t('cancel during gap settles playTwice promise', async () => {
  const env=boot();let passes=0;
  const pending=env.sb.MoversAudio.playTwice(QS[1],{gapMs:1000,onPass(){passes++;}});
  await sleep(10);assert.strictEqual(passes,1);env.sb.MoversAudio.stop();
  assert.strictEqual(await Promise.race([pending,sleep(60).then(()=> 'hung')]),'cancelled');
});
t('cancel pending MP3 settles before HEAD responds', async () => {
  const env=boot({headPending:true});const q=JSON.parse(JSON.stringify(QS[1]));q.audio.src='test.mp3';
  const pending=env.sb.MoversAudio.play(q,{});env.sb.MoversAudio.stop();
  assert.strictEqual(await Promise.race([pending,sleep(60).then(()=> 'hung')]),'cancelled');
  env.flushHead();await sleep(5);assert.strictEqual(env.log.audios.length,0);
});
t('failed audio status survives paint and allows retry', async () => {
  const env=boot();env.sb.MoversAudio.playTwice=(q,o)=>{o.onEnded('error');return Promise.resolve('error');};
  const m=mountQuestion(env,QS[1],'test');assert.ok(m.status.textContent.includes('Chưa phát được'));assert.strictEqual(m.btnPlay.disabled,false);
});
t('malformed lines and lowercase speaker labels are rejected', () => {
  const env=boot(),q=JSON.parse(JSON.stringify(QS[1]));q.audio.lines=[null];assert.ok(env.sb.MoversP4.validate(q).length);
  q.audio.lines=[{text:'  girl: hello'}];assert.ok(env.sb.MoversP4.validate(q).some(e=>e.includes('nhãn')));
});
t('reveal-only does not mark a correct selected answer wrong', () => {
  const env=boot(),m=mountQuestion(env,QS[1],'test');m.cards[QS[1].a].click();m.inst.showResult({reveal:true});
  assert.ok(!m.cards[QS[1].a].classList.contains('is-wrong'));m.inst.destroy();
});

(async () => {
  for (const [name, fn] of jobs) {
    try { await fn(); pass++; }
    catch (e) { fail++; console.log('✗ ' + name + '\n   ' + e.message); }
  }
  console.log(`\n${pass} test đạt, ${fail} test hỏng`);
  process.exit(fail ? 1 : 0);
})();
