// Kiểm tra nhãn bài (lesson / lessonRef) trong dữ liệu lớp 3. Chạy: node tests/lesson-data.test.js
const fs = require('fs'), path = require('path'), assert = require('assert');
const DIR = path.join(__dirname, '..', 'data-lop3');
const BASIS = new Set(['muc-luc', 'suy-luan', 'trang-sach', 'nen']);
const TITLES = 44; // KNTT Toán 3 có 44 bài (tập một + tập hai)

function* walk(o) {
  if (Array.isArray(o)) { for (const v of o) yield* walk(v); return; }
  if (o && typeof o === 'object') {
    if (typeof o.q === 'string' && typeof o.id === 'string') yield o;
    for (const v of Object.values(o)) yield* walk(v);
  }
}

let n = 0, tagged = 0, nen = 0;
const errs = [];
for (const sub of fs.readdirSync(DIR)) {
  const d = path.join(DIR, sub);
  if (!fs.statSync(d).isDirectory()) continue;
  for (const f of fs.readdirSync(d).filter(x => x.endsWith('.json'))) {
    for (const q of walk(JSON.parse(fs.readFileSync(path.join(d, f), 'utf8')))) {
      n++;
      const l = q.lesson, r = q.lessonRef;
      if (l) {
        tagged++;
        if (l.book !== 'kntt-toan3' || ![1, 2].includes(l.vol) || !Number.isInteger(l.no) || l.no < 1 || l.no > TITLES) errs.push(q.id + ': lesson hỏng');
        if (!r) errs.push(q.id + ': có lesson mà thiếu lessonRef');
      }
      if (r) {
        if (!BASIS.has(r.basis)) errs.push(q.id + ': basis lạ ' + r.basis);
        if (!r.note || !r.by || !r.date) errs.push(q.id + ': lessonRef thiếu note/by/date');
        if (r.basis === 'nen') { nen++; if (l) errs.push(q.id + ': basis nen mà vẫn có lesson'); }
        else if (!l) errs.push(q.id + ': lessonRef ' + r.basis + ' mà không có lesson');
        if (r.basis === 'trang-sach' && !/tr\.\s?\d/.test(r.note)) errs.push(q.id + ': trang-sach phải dẫn số trang (tr.N)');
        if (r.upgradedFrom && !BASIS.has(r.upgradedFrom)) errs.push(q.id + ': upgradedFrom lạ');
      }
    }
  }
}
assert.deepStrictEqual(errs, []);
assert.ok(tagged >= 193, 'số câu đã gắn bài: ' + tagged);
console.log('✔ nhãn bài: ' + n + ' câu, ' + tagged + ' câu có lesson, ' + nen + ' câu ghi chú nền');
