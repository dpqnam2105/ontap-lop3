// Dữ liệu pilot sửa chính tả. Chạy: node tests/pilot-spell-fix.test.js
const fs = require('fs'), path = require('path'), assert = require('assert');
const DIR = path.join(__dirname, '..', 'data-lop3', 'tieng-anh');
const T = JSON.parse(fs.readFileSync(path.join(DIR, 'pilot-spell-fix.json'), 'utf8')).topic;
const norm = w => w.toLowerCase().replace(/[’‘]/g, "'").trim();
const apply = (w, e) => e.op === 'delete' ? w.slice(0, e.index) + w.slice(e.index + 1) : w.slice(0, e.index) + e.letter + w.slice(e.index);
let n = 0; const ok = (c, m) => { assert.ok(c, m); n++; };

// toàn bộ câu trong kho tiếng Anh (để tra checkId, chống trùng id)
const bank = {};
for (const f of fs.readdirSync(DIR).filter(x => x.endsWith('.json') && x !== 'index.json')) {
  const t = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')).topic;
  for (const q of t.questions) { ok(!bank[q.id], 'id trùng: ' + q.id); bank[q.id] = q; }
}
const P = T.questions.filter(q => q.type === 'spell-fix'), K = T.questions.filter(q => q.pilotCheck);
ok(P.length === 13 && K.length === 3 && T.questions.length === 16, 'đủ 13 mục luyện + 3 câu kiểm tra');
const targets = [...new Set(P.map(q => q.targetId))];
ok(targets.length === 12 && T.pilot.targets.length === 12, '12 từ đích');
const words = P.map(q => q.target);
const cnt = s => P.filter(q => q.errorSource === s).length;
ok(cnt('that') === 6 && cnt('phieu') === 3 && cnt('tk') === 4, 'nguồn: thật 6 / phiếu 3 / tự thiết kế 4');

for (const q of P) {
  const id = q.id;
  ok(norm(q.wrong) !== norm(q.target), id + ': từ sai khác từ đích');
  ok(['delete', 'insert'].includes(q.op), id + ': thao tác');
  // mọi cách sửa một bước → tập cách ra đúng từ đích phải trùng acceptEdits (không thiếu, không thừa)
  const all = q.op === 'delete' ? [...q.wrong].map((_, i) => ({ op: 'delete', index: i }))
    : [...Array(q.wrong.length + 1).keys()].flatMap(i => q.letters.map(c => ({ op: 'insert', index: i, letter: c })));
  const good = all.filter(e => norm(apply(q.wrong, e)) === norm(q.target));
  ok(JSON.stringify(good) === JSON.stringify(q.acceptEdits), id + ': acceptEdits = mọi vị trí tạo ra từ đích');
  // responseKey theo từ đã chuẩn hoá: các vị trí đúng cho cùng một khoá
  ok(new Set(q.acceptEdits.map(e => norm(apply(q.wrong, e)))).size === 1, id + ': mọi vị trí đúng cùng một khoá');
  if (q.op === 'insert') ok(q.letters.length === 3 && new Set(q.letters).size === 3, id + ': 3 chữ cho chọn, khác nhau');
  // ngữ cảnh: đúng 1 chỗ trống, không lộ bất kỳ từ đích nào, không chứa sẵn từ sai
  ok(q.sentence.split('___').length === 2, id + ': một chỗ trống');
  for (const w of words) ok(!new RegExp("(^|[^a-z'])" + w.replace(/'/g, "'") + "([^a-z']|$)", 'i').test(q.sentence), id + ': ngữ cảnh lộ từ đích ' + w);
  ok(!q.sentence.toLowerCase().includes(q.wrong), id + ': ngữ cảnh không chứa từ sai');
  ok(q.meaning && q.hint && q.explain && q.errorSourceNote, id + ': có nghĩa / gợi ý / giải thích / ghi chú nguồn');
  // câu kiểm tra: có trong kho, đáp án đúng = từ đích, đề không chứa từ sai
  const c = bank[q.checkId];
  ok(c && Array.isArray(c.choices) && norm(c.choices[c.a]) === norm(q.target), id + ': checkId ' + q.checkId + ' có đáp án ' + q.target);
  ok(!norm(c.q).includes(norm(q.wrong)), id + ': đề câu kiểm tra không chứa từ sai');
}
const din = P.filter(q => q.targetId === 'dinner');
ok(din.length === 2 && din.every(q => q.variantGroup === 'dinner') && din[0].checkId === din[1].checkId, 'hai biến thể dinner: cùng nhóm, cùng checkId');
ok(P.filter(q => q.variantGroup).length === 2, 'chỉ dinner có variantGroup');

for (const q of K) {
  ok(q.noHint === true && !('hint' in q), q.id + ': câu kiểm tra không có gợi ý');
  ok(new Set(q.choices.map(norm)).size === 4, q.id + ': 4 lựa chọn khác nhau');
  ok(q.choices.filter(c => norm(c) === q.targetId).length === 1 && norm(q.choices[q.a]) === q.targetId, q.id + ': đúng một đáp án');
}
for (const t of T.pilot.targets) ok(bank[t.checkId] && t.practiceIds.every(id => bank[id]), 'bảng targets trỏ đúng id: ' + t.targetId);
// pilot chưa được liệt kê trong index.json (chỉ mở sau khi tích hợp ?pilot=1)
const idx = JSON.parse(fs.readFileSync(path.join(DIR, 'index.json'), 'utf8'));
const item=idx.topics.find(t=>t.id===T.id);ok(item && item.pilot===true && item.manualOnly===true && item.count===16,'index: pilot + manualOnly + count');
console.log('✔ pilot sửa chính tả: ' + n + ' kiểm tra đạt');
