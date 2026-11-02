// Nút 🔊 đọc đúng giọng: môn tiếng Anh đọc phần tiếng Anh bằng giọng en (kể cả đáp án một từ),
// đoạn Việt tách riêng (chỉ đọc khi máy có giọng vi), đáp án đọc theo thứ tự nút đã đảo, không đọc gợi ý/giải thích/chú nghĩa.
// Chạy: node tests/speak-lang.test.js   (audit giọng đọc 02/11/2026)
const fs = require('fs'), vm = require('vm'), path = require('path'), assert = require('assert');
const REPO = path.join(__dirname, '..');
const VI_RE = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;

function boot({ voices = ['en-US', 'vi-VN'], buttons = null, lateVoices = false } = {}) {
  const spoken = [];
  const listeners = {};
  const mkVoices = () => voices.map(l => ({ lang: l, name: 'Voice ' + l, localService: true }));
  let voiceList = lateVoices ? [] : mkVoices();
  const btnEl = { id: 'btnSpeak', classList: { set: new Set(), toggle(c, on) { on ? this.set.add(c) : this.set.delete(c); }, contains(c) { return this.set.has(c); } },
    setAttribute() {}, addEventListener() {}, querySelector() { return { textContent: '' }; }, set innerHTML(v) {} };
  let created = false;
  const ctx = {
    console, JSON, Math, Object, String, Number, Array, Set, Map, Error,
    SpeechSynthesisUtterance: function (text) { this.text = text; },
    document: {
      querySelector: sel => (sel === '#screenQuiz .question-card' ? { firstChild: null, insertBefore() { created = true; } } : null),
      querySelectorAll: sel => (sel === '#ansGrid .ans-btn' && buttons ? buttons.map(t => ({ textContent: t })) : []),
      getElementById: id => (id === 'btnSpeak' && created ? btnEl : null),
      createElement: () => btnEl,
    },
  };
  ctx.window = ctx;
  ctx.speechSynthesis = { getVoices: () => voiceList, speak: u => spoken.push(u), cancel() {},
    addEventListener: (ev, fn) => { listeners[ev] = fn; } };
  vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(REPO, 'js', 'speak.js'), 'utf8'), ctx);
  const S = ctx.Speak;
  S.init();
  return { S, spoken, btn: btnEl, loadVoices: () => { voiceList = mkVoices(); listeners.voiceschanged && listeners.voiceschanged(); } };
}
const data = f => JSON.parse(fs.readFileSync(path.join(REPO, 'data-lop3', 'tieng-anh', f), 'utf8')).topic.questions;
const byId = id => ['nik3-past-ed.json', 'nik3-past-didnt.json', 'nik3-past-irregular.json', 'mshoa-e2-u6.json', 'nik3-unit1.json', 'nik3-unit3.json']
  .flatMap(data).find(q => q.id === id);

const tests = {
  'detect: môn tiếng Anh, đáp án một từ không dấu → en (camped, began)'() {
    const { S } = boot();
    for (const w of ['camped', 'began', 'didn\'t eat', 'went', 'I']) assert.strictEqual(S.detect(w, 'en'), 'en', w);
    // môn khác giữ nguyên hành vi cũ
    assert.strictEqual(S.detect('3 + 4 = ?', 'vi'), 'vi');
    assert.strictEqual(S.detect('cm', 'vi'), 'vi');
    assert.strictEqual(S.detect('Đọc số', 'vi'), 'vi');
  },
  'segments: đề trộn tách đúng đoạn, phần tiếng Anh không bị kéo sang vi'() {
    const { S } = boot();
    const seg = t => JSON.parse(JSON.stringify(S.segments(t, 'en').map(p => p.lang + ':' + p.text)));
    assert.deepStrictEqual(seg('"đi ngủ" in English is:'), ['vi:"đi ngủ"', 'en:in English is:']);
    assert.deepStrictEqual(seg('Bây giờ là 7 giờ tối. What time is it?'), ['vi:Bây giờ là 7 giờ tối.', 'en:What time is it?']);
    const s3 = seg('Biển báo vẽ NHIỀU con vật. Viết câu cho cả nhóm con vật: "Don\'t feed ___."');
    assert.strictEqual(s3.length, 2); assert.ok(s3[0].startsWith('vi:') && s3[1] === 'en:"Don\'t feed ___."', s3.join(' | '));
    assert.deepStrictEqual(seg('Which one describes an action? (action = hành động)'), ['en:Which one describes an action? (action =', 'vi:hành động)']);
    // Môn khác: một đoạn như cũ
    assert.strictEqual(S.segments('Tính 3 + 4', 'vi').length, 1);
  },
  'lô 4–6: đề + mọi đáp án đọc giọng en; không đọc gợi ý / giải thích / gloss'() {
    for (const id of ['en_nik3-past-ed_q002', 'en_nik3-past-irregular_q003', 'en_nik3-past-didnt_q003', 'en_nik3-past-irregular_q006', 'en_nik3-past-didnt_q015']) {
      const q = byId(id);
      const { S } = boot({ buttons: q.choices.slice().reverse() });
      S.attach(q, 'tieng-anh');
      const parts = S._parts();
      assert.ok(parts.length >= 6, id);
      assert.ok(parts.every(p => p.lang === 'en'), id + ': ' + JSON.stringify(parts));
      const text = parts.map(p => p.text).join(' ');
      assert.ok(!text.includes(q.hint) && !text.includes(q.explain), id + ': đọc lộ gợi ý/giải thích');
      if (q.gloss) assert.ok(!text.includes(q.gloss), id + ': đọc gloss');
    }
  },
  'đề còn đoạn Việt (kiểu cũ): đáp án một từ vẫn đọc giọng en (lỗi audit: camped, began bị đọc giọng Việt)'() {
    const q = { id: 'old', q: 'We ___ (camp: cắm trại) near the river last summer.', choices: ['camped', 'camp', 'campped', 'camping'], a: 0 };
    const { S } = boot({ buttons: q.choices });
    S.attach(q, 'tieng-anh');
    const parts = JSON.parse(JSON.stringify(S._parts()));
    const i = parts.findIndex(p => p.text === 'The answers are:');
    assert.ok(i > 0 && parts.slice(i).every(p => p.lang === 'en'), JSON.stringify(parts));
    assert.deepStrictEqual(parts.slice(0, i).map(p => p.lang), ['en', 'vi', 'en']);
  },
  'đề cũ trộn Việt–Anh dùng q.speak khai báo: "đèn pin", "nhà hát (theater), con phải…" — so đủ chữ + giọng từng câu đọc'() {
    const said = (id, voices) => {
      const q = byId(id);
      const r = boot({ voices, buttons: q.choices });
      r.S.attach(q, 'tieng-anh'); r.S.speakParts(r.S._parts());
      return JSON.parse(JSON.stringify(r.spoken.map(u => [String(u.lang).slice(0, 2), u.text, u.voice ? String(u.voice.lang).slice(0, 2) : null])));
    };
    const ans = id => byId(id).choices.map(c => ['en', c, 'en']);
    const lead = [['en', 'The answers are:', 'en']];
    // có cả giọng vi + en
    assert.deepStrictEqual(said('en_nik3-unit3_q013', ['en-US', 'vi-VN']), [['vi', 'đèn pin', 'vi'], ['en', 'in English is:', 'en'], ...lead, ...ans('en_nik3-unit3_q013')]);
    assert.deepStrictEqual(said('en_nik3-unit1_q033', ['en-US', 'vi-VN']), [
      ['vi', 'Con đang đứng ở ngã tư. Muốn đến nhà hát', 'vi'], ['en', '(theater),', 'en'],
      ['vi', 'con phải đi vào con đường bên tay trái.', 'vi'], ['en', 'What do you say?', 'en'], ...lead, ...ans('en_nik3-unit1_q033')]);
    // chỉ có giọng en: bỏ trọn cụm Việt — không sót "pin", "con" đọc giọng Anh
    assert.deepStrictEqual(said('en_nik3-unit3_q013', ['en-US']), [['en', 'in English is:', 'en'], ...lead, ...ans('en_nik3-unit3_q013')]);
    assert.deepStrictEqual(said('en_nik3-unit1_q033', ['en-US']), [['en', '(theater),', 'en'], ['en', 'What do you say?', 'en'], ...lead, ...ans('en_nik3-unit1_q033')]);
  },
  'đáp án tiếng Việt (câu hỏi nghĩa) đọc trọn giọng vi; đáp án không dấu đọc en'() {
    const { S } = boot();
    S.attach({ id: 'm', q: '"Extinct" means ___.', choices: ['rất to lớn', 'đã tuyệt chủng'] }, 'tieng-anh');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(S._parts().map(p => p.lang))), ['en', 'en', 'vi', 'vi']);
  },
  'đáp án đọc theo thứ tự nút đang hiện (sau khi đảo)'() {
    const q = byId('en_nik3-past-irregular_q006'); // câu "builded"
    const shown = [q.choices[2], q.choices[0], q.choices[3], q.choices[1]];
    const { S } = boot({ buttons: shown });
    S.attach(q, 'tieng-anh');
    const parts = S._parts();
    const i = parts.findIndex(p => p.text === 'The answers are:');
    assert.deepStrictEqual(JSON.parse(JSON.stringify(parts.slice(i + 1).map(p => p.text))), shown);
  },
  'speakParts: utterance mang giọng en cho phần Anh; chỉ có giọng en → bỏ đoạn Việt, không ép giọng en đọc tiếng Việt'() {
    const q = { id: 'x', q: 'Bây giờ là 7 giờ tối. What time is it?', choices: ['seven o\'clock', 'eight o\'clock'], a: 0 };
    const both = boot({ buttons: q.choices });
    both.S.attach(q, 'tieng-anh'); both.S.speakParts(both.S._parts());
    assert.deepStrictEqual(both.spoken.map(u => String(u.lang).slice(0, 2)), ['vi', 'en', 'en', 'en', 'en']);
    assert.ok(both.spoken.every(u => u.voice && u.voice.lang === u.lang));
    const enOnly = boot({ voices: ['en-GB'], buttons: q.choices });
    enOnly.S.attach(q, 'tieng-anh'); enOnly.S.speakParts(enOnly.S._parts());
    assert.ok(enOnly.spoken.length === 4 && enOnly.spoken.every(u => u.lang === 'en-GB'), JSON.stringify(enOnly.spoken.map(u => [u.lang, u.text])));
  },
  'nút 🔊: môn tiếng Anh chỉ cần giọng en (đề có đoạn Việt vẫn hiện nút); voice tải muộn qua voiceschanged'() {
    const q = byId('en_nik3-past-ed_q002');
    const a = boot({ voices: ['en-US'] });
    a.S.attach(q, 'tieng-anh');
    assert.strictEqual(a.btn.classList.contains('hidden'), false);
    const late = boot({ voices: ['en-US'], lateVoices: true });
    late.S.attach(q, 'tieng-anh');
    assert.strictEqual(late.btn.classList.contains('hidden'), true, 'chưa có giọng → ẩn');
    late.loadVoices();
    assert.strictEqual(late.btn.classList.contains('hidden'), false, 'voiceschanged → hiện');
    const none = boot({ voices: ['vi-VN'] });
    none.S.attach(q, 'tieng-anh');
    assert.strictEqual(none.btn.classList.contains('hidden'), true, 'không có giọng en → ẩn');
    const toan = boot({ voices: ['en-US', 'vi-VN'] });
    toan.S.attach({ id: 't', q: '3 + 4 = ?', choices: ['7'] }, 'toan');
    assert.strictEqual(toan.btn.classList.contains('hidden'), true, 'Toán: bé tự đọc');
  },
  'dữ liệu lô 4–6: không còn đề/lựa chọn có dấu Việt; chú nghĩa nằm ở gloss'() {
    let n = 0;
    for (const f of ['nik3-past-ed.json', 'nik3-past-didnt.json', 'nik3-past-irregular.json']) for (const q of data(f)) {
      assert.ok(!VI_RE.test(q.q) && !q.choices.some(c => VI_RE.test(c)), q.id);
      if (q.gloss) n++;
    }
    assert.ok(n >= 50, 'gloss ' + n);
  },
};

let fail = 0;
for (const [name, fn] of Object.entries(tests)) {
  try { fn(); console.log('✔', name); } catch (e) { fail++; console.log('✘', name, '\n  ', e.message); }
}
if (fail) { console.log(fail + ' test lỗi'); process.exit(1); }
console.log('speak-lang OK —', Object.keys(tests).length, 'test');
