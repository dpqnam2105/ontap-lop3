// Kiểm tra dữ liệu Tiếng Anh lớp 3. Chạy: node tests/en-data.test.js
// Phần 1 — quy tắc chung cho mọi câu (và câu có nhãn mới book/track/ref).
// Phần 2 — quy tắc riêng từng lô, nhận diện bằng source.
// Giới hạn: kiểm "gợi ý không chứa nguyên văn đáp án" chỉ bắt trùng chữ; KHÔNG chứng minh được
// gợi ý không tiết lộ đáp án theo cách khác (diễn đạt lại, loại trừ…). Phần đó vẫn cần người rà.
const fs = require('fs'), path = require('path'), assert = require('assert');
const DIR = path.join(__dirname, '..', 'data-lop3', 'tieng-anh');
const TRACKS = new Set(['core', 'foundation', 'enrich']);
const BOOKS = new Set(['nik3', 'gs3', 'none']);
// Cơ sở nguồn: toc = theo mục lục; school-weekly = lịch/nội dung tuần của trường; page = đã đối chiếu trang sách thật.
const BASES = new Set(['toc', 'school-weekly', 'page']);

// Quy tắc riêng từng lô (thêm lô mới vào đây).
const BATCH_RULES = {
  'claude-nik3-lo1-20261008': { count: 34, passages: ['en-lo1-A', 'en-lo1-B', 'en-lo1-C'], check(q, err) {
    if (q.ref.basis !== 'toc') err('lô 1 phải basis toc');
    if ('page' in q.ref || /tr\.\s?\d/.test(q.ref.note || '')) err('lô 1 không ghi trang');
    if (!/chưa xác nhận khớp/.test(q.ref.note || '')) err('lô 1 phải ghi mục lục chưa xác nhận khớp sách trường');
  } }
};

const errs = [], ids = new Set(), passages = {}, bySource = {};
let tagged = 0;
for (const f of fs.readdirSync(DIR).filter(x => x.endsWith('.json') && x !== 'index.json')) {
  const t = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')).topic;
  for (const q of t.questions) {
    const err = m => errs.push(q.id + ': ' + m);
    // ── Chung cho mọi câu
    if (ids.has(q.id)) err('trùng id'); ids.add(q.id);
    if (!Array.isArray(q.choices) || q.choices.length !== 4 || new Set(q.choices).size !== 4) err('cần 4 lựa chọn khác nhau');
    if (!Number.isInteger(q.a) || q.a < 0 || q.a >= (q.choices || []).length) err('a hỏng');
    if (q.track === undefined && q.book === undefined && q.ref === undefined) continue;
    // ── Chung cho câu có nhãn mới
    tagged++;
    if (!TRACKS.has(q.track)) err('track lạ ' + q.track);
    if (!BOOKS.has(q.book)) err('book lạ ' + q.book);
    const r = q.ref;
    if (!r || !BASES.has(r.basis) || !r.note || !Array.isArray(r.toc) || !Array.isArray(r.extraWords) || !r.by || !r.date) err('ref thiếu trường / basis lạ');
    if (r && r.basis === 'page' && !Number.isInteger(r.page) && !/tr\.\s?\d/.test(r.note || '')) err('basis page phải có số trang');
    if (r && /approvedBy/.test(JSON.stringify(r))) err('không dùng approvedBy');
    if (!q.hint || !q.explain) err('thiếu hint/explain');
    if (q.hint && q.choices && q.choices[q.a] && q.hint.includes(q.choices[q.a])) err('gợi ý chứa nguyên văn đáp án');
    if (q.passage) {
      const m = /^Read: "(.+?)" /.exec(q.q);
      if (!m) err('câu đọc phải chứa đoạn trong q');
      else if (passages[q.passage] !== undefined && passages[q.passage] !== m[1]) err('đoạn ' + q.passage + ' lệch chữ');
      else passages[q.passage] = m[1];
    }
    // ── Riêng từng lô
    (bySource[q.source] = bySource[q.source] || []).push(q);
    const rule = BATCH_RULES[q.source];
    if (rule && r) rule.check(q, err);
  }
}
for (const [src, rule] of Object.entries(BATCH_RULES)) {
  const qs = bySource[src] || [];
  if (qs.length !== rule.count) errs.push(src + ': cần ' + rule.count + ' câu, có ' + qs.length);
  const ps = [...new Set(qs.map(q => q.passage).filter(Boolean))].sort();
  if (JSON.stringify(ps) !== JSON.stringify(rule.passages)) errs.push(src + ': đoạn đọc ' + ps.join(','));
}
assert.deepStrictEqual(errs, []);
console.log('en-data OK —', tagged, 'câu có nhãn mới,', Object.keys(passages).length, 'đoạn đọc,', Object.keys(BATCH_RULES).length, 'lô có quy tắc riêng');
