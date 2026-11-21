// Lô ôn thi cấp trường Toán (bổ trợ tuần 11–13, 21/11/2026): số câu, khu kiến thức, giai đoạn, lựa chọn, nối lý thuyết.
// Run: node tests/toan-onthi.test.js
const fs = require('fs'), path = require('path'), assert = require('assert');
const dir = path.join(__dirname, '..', 'data-lop3', 'toan');
const SRC = 'bo-tro-tuan11-13-20261121';
const WANT = { 'day-so-cach-deu': 10, 'nhan-chia-ngoai-bang': 13, 'giai-toan-co-loi-van': 5, 'do-luong': 6, 'tu-duy-so': 6 };
// Giai đoạn theo SGK KNTT: chia có dư / gấp giảm / toán hai bước = Chủ đề 4 (GĐ2); mm, g, ml = Chủ đề 5 (GĐ3);
// dãy số và bảng nhân (GĐ1, như các câu dãy số đã có); lượt chữ số học cùng tuần 11 (GĐ2); nhân 2 chữ số (GĐ2).
const STAGE = { 'luot-chu-so': 2, 'so-hang-thu-n': 1, 'tong-day': 1, 'so-du': 2, 'tim-so-bi-chia': 2, 'tim-so-chia': 2, 'chia-du-thuc-te': 2,
  'gap-giam-nguoc': 2, 'times-less': 2, 'word-2step-gap-giam': 2, 'convert': 3, 'tinh-don-vi': 3, 'compare': 3,
  'viet-thanh-tich': 1, 'quy-luat': 1, 'so-trong-khoang': 2, 'dien-chu-so': 2, 'suy-nguoc': 2 };
const idx = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
const theory = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'theory', 'lop3.json'), 'utf8'));
const theorySkills = new Set(theory.lessons.filter(l => l.subject === 'toan').flatMap(l => l.skills || []));
const theoryIds = new Set(theory.lessons.flatMap(l => l.questionIds || []));
let total = 0;
for (const [f, n] of Object.entries(WANT)) {
  const qs = JSON.parse(fs.readFileSync(path.join(dir, f + '.json'), 'utf8')).topic.questions;
  const t = idx.topics.find(x => x.file === f + '.json');
  assert.strictEqual(t.count, qs.length, f + ': count trong index lệch');
  assert.strictEqual(new Set(qs.map(q => q.id)).size, qs.length, f + ': trùng id');
  const mine = qs.filter(q => q.source === SRC);
  assert.strictEqual(mine.length, n, f + ': số câu lô mới');
  for (const q of mine) {
    const m = f + ' ' + q.id;
    assert.ok(q.id.startsWith('toan_' + f + '_q'), m + ': id sai khu');
    assert.strictEqual(q.choices.length, 4, m);
    assert.strictEqual(new Set(q.choices).size, 4, m + ': lựa chọn trùng');
    assert.ok(Number.isInteger(q.a) && q.a >= 0 && q.a < 4, m);
    assert.ok(q.hint && q.explain, m + ': thiếu gợi ý/giải thích');
    assert.ok(!q.hint.includes(q.choices[q.a]) || /^\d$/.test(q.choices[q.a]), m + ': gợi ý lộ đáp án');
    // Cần nhân/chia ngoài bảng (19 × 5, 13 × 6, 44 × 5) → GĐ2 dù cùng dạng với câu GĐ1 (Gemini rà 21/11)
    const OVERRIDE = { 'toan_day-so-cach-deu_q023': 2, 'toan_day-so-cach-deu_q024': 2, 'toan_day-so-cach-deu_q025': 2 };
    assert.strictEqual(q.stage, OVERRIDE[q.id] || STAGE[q.skill], m + ': giai đoạn');
    assert.ok(theorySkills.has(q.skill) || theoryIds.has(q.id) || ['viet-thanh-tich', 'quy-luat', 'so-trong-khoang', 'dien-chu-so', 'suy-nguoc'].includes(q.skill), m + ': chưa nối lý thuyết');
  }
  total += mine.length;
}
assert.strictEqual(total, 40);
console.log('toan-onthi OK — 40 câu, 5 khu, giai đoạn và nối lý thuyết đúng');
