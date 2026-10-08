// Kiểm tra dữ liệu Tiếng Anh lớp 3. Chạy: node tests/en-data.test.js
// Phần 1 — quy tắc chung cho mọi câu (và câu có nhãn mới book/track/ref).
// Phần 2 — quy tắc riêng từng lô, nhận diện bằng source.
// Giới hạn: kiểm "gợi ý không chứa nguyên văn đáp án" chỉ bắt trùng chữ; KHÔNG chứng minh được
// gợi ý không tiết lộ đáp án theo cách khác (diễn đạt lại, loại trừ…). Phần đó vẫn cần người rà.
const fs = require('fs'), path = require('path'), assert = require('assert');
const DIR = path.join(__dirname, '..', 'data-lop3', 'tieng-anh');
const TRACKS = new Set(['core', 'foundation', 'enrich']);
const BOOKS = new Set(['nik3', 'gs3', 'mshoa-explorer2', 'none']);
// Cơ sở nguồn: toc = theo mục lục; school-weekly = lịch/nội dung tuần của trường; page = đã đối chiếu trang sách thật.
const BASES = new Set(['toc', 'school-weekly', 'page']);

// Quy tắc riêng từng lô (thêm lô mới vào đây).
const LO2_WORDS = ['campsite', 'blanket', 'sleeping bag', 'camping stove', 'flashlight', 'compass', 'set up a tent', 'make a fire', 'clean up', 'get lost'];
// Bộ lựa chọn Codex đã chốt cho 3 câu cụm động từ Ms Hoa (đáp án đứng đầu).
const MSHOA_LOCKED = {
  'en_mshoa-e2-u6_q003': ['eat', 'read', 'write', 'play'],
  'en_mshoa-e2-u6_q004': ['take', 'eat', 'read', 'play'],
  'en_mshoa-e2-u6_q005': ['do', 'eat', 'drink', 'sleep'],
};
const BATCH_RULES = {
  'claude-mshoa-e2u6-l12-20261010': { count: 23, passages: ['en-mshoa-E'], check(q, err) {
    const bl = q.bookLesson || {};
    if (q.unit !== 'e2-u6' || q.book !== 'mshoa-explorer2') err('Ms Hoa phải unit e2-u6, book mshoa-explorer2');
    if (bl.book !== 'mshoa-explorer2' || bl.unit !== 6 || ![1, 2].includes(bl.lesson)) err('bookLesson hỏng (chỉ L1–L2)');
    if ('stage' in q) err('Ms Hoa không mang stage (không phụ thuộc thiết lập giai đoạn NIK)');
    if ('lesson' in q) err('không dùng trường lesson (dành cho mốc bài Toán)');
    if (q.ref.basis !== 'page' || !Number.isInteger(q.ref.page) || q.ref.page < 117 || q.ref.page > 128) err('ref.page phải là trang L1–L2 (117–128)');
    if (!/tự biên soạn/.test(q.ref.note) || !/tr\.\d/.test(q.ref.note)) err('note phải ghi tự biên soạn + trang');
    if (bl.lesson === 1 && q.ref.page > 122) err('câu L1 dẫn trang L2');
    if (q.passage && (bl.lesson !== 2 || !/tự biên soạn/.test(q.passageNote || ''))) err('đoạn E: lesson 2 + ghi tự biên soạn');
    if (q.passage && !/căn cứ L1/.test(q.ref.note) || q.passage && !/chỉ mở sau L2/.test(q.ref.note)) err('đoạn E: note tách căn cứ L1 và lý do mở sau L2');
    if (!q.passage && !new RegExp('Lesson ' + bl.lesson + '\\b').test(q.ref.note)) err('note phải ghi đúng Lesson của câu');
    // q003–q005: khoá bộ lựa chọn đã chốt (bỏ nhiễu get vì get breakfast / get my homework vẫn có nghĩa hợp lệ).
    // Không cấm get chung: get up, get dressed là cụm đúng của bài.
    const locked = MSHOA_LOCKED[q.id];
    if (locked && (q.choices[q.a] !== locked[0] || JSON.stringify([...q.choices].sort()) !== JSON.stringify([...locked].sort()))) err('bộ lựa chọn đã chốt bị đổi');
    if (/\bdoes\b/i.test(q.q)) err('đề không dùng does (ngôi 3 chưa học)');
    if (/\b(late|early)\b/i.test(q.q + ' ' + q.choices.join(' '))) err('late/early thuộc L3');
  }, after(qs, errs) {
    // Phạm vi theo bài: học đến L1 → chỉ câu L1, không có đoạn E; học đến L2 → đủ 23 câu.
    const upTo = n => qs.filter(q => q.bookLesson.lesson <= n);
    const l1 = upTo(1);
    if (l1.length !== 12 || l1.some(q => q.passage || q.ref.page > 122)) errs.push('Ms Hoa: phạm vi L1 lẫn câu L2/đoạn E');
    if (upTo(2).length !== 23) errs.push('Ms Hoa: phạm vi L2 phải đủ 23 câu');
    if (qs.filter(q => q.skill === 'spelling').length > 2) errs.push('Ms Hoa: tối đa 2 câu chính tả');
    const pos = [0, 0, 0, 0]; qs.forEach(q => pos[q.a]++);
    if (Math.min(...pos) < 5) errs.push('Ms Hoa: đáp án lệch vị trí ' + pos.join('/'));
  } },
  'claude-nik3-lo2-u3v1-20261009': { count: 23, passages: ['en-lo2-D'], check(q, err) {
    if (q.ref.basis !== 'school-weekly' || q.ref.scheduledPages !== '38–39') err('lô 2 phải school-weekly, scheduledPages 38–39');
    if (q.stage !== 2 || q.unit !== 'nik3-unit3') err('lô 2 phải stage 2, unit nik3-unit3');
    if (q.passage && !/tự biên soạn/.test(q.passageNote || '')) err('đoạn D phải ghi tự biên soạn');
    if (/please\s+(___\s+)?get lost/i.test(q.q + ' ' + q.choices.join(' '))) err('không dùng "Please get lost"');
    q.ref.schoolWords.forEach(w => { if (!LO2_WORDS.includes(w)) err('schoolWords lạ: ' + w); });
  }, after(qs, errs) {
    // Kiểm tra SƠ BỘ độ phủ 10 từ/cụm của trường, chỉ đếm chữ bé nhìn thấy (đề + lựa chọn), KHÔNG đếm metadata (ref.schoolWords).
    // "Trọng tâm" = từ nằm trong đề hoặc đáp án đúng, ≥ 2 câu; "xuất hiện" = đề hoặc bất kỳ lựa chọn, ≥ 2 câu.
    // Giới hạn: từ nằm trong đoạn đọc chưa chắc là kỹ năng câu hỏi đang kiểm — việc đó vẫn cần người rà.
    const has = (txt, w) => txt.toLowerCase().includes(w) || (w === 'set up a tent' && /setting up a tent/i.test(txt));
    for (const w of LO2_WORDS) {
      const focus = qs.filter(q => has(q.q + ' ' + q.choices[q.a], w)).length;
      const seen = qs.filter(q => has(q.q + ' ' + q.choices.join(' '), w)).length;
      if (focus < 2 || seen < 2) errs.push('lô 2: "' + w + '" trọng tâm ' + focus + ', xuất hiện ' + seen);
    }
  } },
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
    if (r && r.basis === 'school-weekly') {
      if (!r.scheduledPages || !Array.isArray(r.schoolWords) || !r.schoolWords.length) err('school-weekly cần scheduledPages + schoolWords');
      if ('page' in r) err('school-weekly không ghi page (trang chỉ là trang lịch trường chỉ định)');
    }
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
  if (rule.after) rule.after(qs, errs);
}
assert.deepStrictEqual(errs, []);
console.log('en-data OK —', tagged, 'câu có nhãn mới,', Object.keys(passages).length, 'đoạn đọc,', Object.keys(BATCH_RULES).length, 'lô có quy tắc riêng');
