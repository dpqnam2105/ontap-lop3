// Kiểm tra dữ liệu Tiếng Anh lớp 3 có nhãn mới (track/book/ref/passage). Chạy: node tests/en-data.test.js
const fs = require('fs'), path = require('path'), assert = require('assert');
const DIR = path.join(__dirname, '..', 'data-lop3', 'tieng-anh');
const TRACKS = new Set(['core', 'foundation', 'enrich']);
const BOOKS = new Set(['nik3', 'gs3', 'none']);
const errs = [], ids = new Set(), passages = {};
let tagged = 0, lo1 = 0;
for (const f of fs.readdirSync(DIR).filter(x => x.endsWith('.json') && x !== 'index.json')) {
  const t = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')).topic;
  for (const q of t.questions) {
    if (ids.has(q.id)) errs.push('trùng id ' + q.id); ids.add(q.id);
    if (!Array.isArray(q.choices) || q.choices.length !== 4 || new Set(q.choices).size !== 4) errs.push(q.id + ': cần 4 lựa chọn khác nhau');
    if (!Number.isInteger(q.a) || q.a < 0 || q.a >= q.choices.length) errs.push(q.id + ': a hỏng');
    if (q.track === undefined && q.book === undefined && q.ref === undefined) continue;
    tagged++;
    if (!TRACKS.has(q.track)) errs.push(q.id + ': track lạ ' + q.track);
    if (!BOOKS.has(q.book)) errs.push(q.id + ': book lạ ' + q.book);
    const r = q.ref;
    if (!r || r.basis !== 'toc' || !r.note || !Array.isArray(r.toc) || !Array.isArray(r.extraWords) || !r.by || !r.date) errs.push(q.id + ': ref thiếu trường');
    if (r && ('page' in r || /tr\.\s?\d/.test(r.note || ''))) errs.push(q.id + ': ref không được ghi trang khi chưa có tài liệu trường');
    if (r && /approvedBy/.test(JSON.stringify(r))) errs.push(q.id + ': không dùng approvedBy');
    if (r && !/chưa xác nhận khớp/.test(r.note)) errs.push(q.id + ': note phải nói mục lục chưa xác nhận khớp sách trường');
    if (!q.hint || !q.explain) errs.push(q.id + ': thiếu hint/explain');
    if (q.hint && q.choices[q.a] && q.hint.includes(q.choices[q.a])) errs.push(q.id + ': gợi ý lộ đáp án');
    if (q.source === 'claude-nik3-lo1-20261008') lo1++;
    if (q.passage) {
      const m = /^Read: "(.+?)" /.exec(q.q);
      if (!m) errs.push(q.id + ': câu đọc phải chứa đoạn trong q');
      else if (passages[q.passage] && passages[q.passage] !== m[1]) errs.push(q.id + ': đoạn ' + q.passage + ' lệch chữ');
      else passages[q.passage] = m && m[1];
    }
  }
}
assert.deepStrictEqual(errs, []);
assert.strictEqual(lo1, 34, 'lô 1 phải có 34 câu');
assert.deepStrictEqual(Object.keys(passages).sort(), ['en-lo1-A', 'en-lo1-B', 'en-lo1-C']);
console.log('en-data OK —', tagged, 'câu có nhãn mới,', lo1, 'câu lô 1,', Object.keys(passages).length, 'đoạn đọc');
