'use strict';
const assert = require('assert');
const A = require('../js/toan-batch1-adapter.js');
const GEN = require('../js/toan-batch1.js');

let pass = 0, fail = 0;
const t = (name, fn) => { try { fn(); pass++; } catch (e) { fail++; console.log('✗ ' + name + '\n   ' + e.message); } };
const fakeSubjects = () => ([{ id: 'tieng-viet', topics: [] }, { id: 'toan', topics: [{ id: 'bang-nhan-chia', questions: [{ id: 'cu_001' }] }] }]);
const topicOf = (s, id) => s.find((x) => x.id === 'toan').topics.find((t) => t.id === id);

t('augment nạp đúng 2 chủ đề, 60 câu mỗi chủ đề', () => {
  const s = fakeSubjects();
  const res = A.augment(s, 'lop3');
  assert.strictEqual(res.added, 120, 'số câu thêm: ' + res.added);
  assert.strictEqual(topicOf(s, 'toan-chia-het-co-du').questions.length, 60);
  assert.strictEqual(topicOf(s, 'toan-day-so-cach-deu').questions.length, 60);
  assert.strictEqual(topicOf(s, 'bang-nhan-chia').questions.length, 1, 'không được đụng chủ đề cũ');
});

t('augment gọi hai lần không thêm trùng', () => {
  const s = fakeSubjects();
  A.augment(s, 'lop3');
  const lan2 = A.augment(s, 'lop3');
  assert.strictEqual(lan2.added, 0);
  assert.strictEqual(topicOf(s, 'toan-chia-het-co-du').questions.length, 60);
});

t('augment bỏ qua lớp khác và môn không có', () => {
  const s = fakeSubjects();
  assert.strictEqual(A.augment(s, 'lop4').added, 0);
  assert.strictEqual(A.augment([{ id: 'tieng-anh', topics: [] }], 'lop3').added, 0);
});

t('mọi câu trong kho mẫu đều hợp lệ và đủ nhánh', () => {
  const s = fakeSubjects(); A.augment(s, 'lop3');
  const chia = topicOf(s, 'toan-chia-het-co-du').questions;
  const day = topicOf(s, 'toan-day-so-cach-deu').questions;
  for (const q of chia.concat(day)) {
    assert.strictEqual(q.choices.length, 4);
    assert.ok(q.a >= 0 && q.a < 4);
    assert.ok(q.hint && q.explain);
  }
  const dem = (arr, sk) => arr.filter((q) => q.skill === sk).length;
  assert.strictEqual(dem(chia, 'chia-co-du'), 15);
  assert.strictEqual(dem(chia, 'chia-het'), 15);
  assert.strictEqual(dem(chia, 'chia-du-con-thua'), 15);
  assert.strictEqual(dem(chia, 'dung-het'), 15);
  const dungHet = chia.filter((q) => q.skill === 'dung-het');
  assert.ok(dungHet.some((q) => /_r0_/.test(q.id)), 'đựng hết thiếu nhánh chia hết');
  assert.ok(dungHet.some((q) => !/_r0_/.test(q.id)), 'đựng hết thiếu nhánh có dư');
  assert.strictEqual(dem(day, 'so-so-hang'), 30);
  assert.strictEqual(dem(day, 'so-hang-thu-n'), 30);
});

t('ensureFromHistory dựng lại câu lịch sử KHÔNG nằm trong kho mẫu', () => {
  const s = fakeSubjects(); A.augment(s, 'lop3');
  const laId = 'toan_so-hang-thu-n_bo-tro-v1_sbn9_kc5_n23';
  assert.ok(!topicOf(s, 'toan-day-so-cach-deu').questions.some((q) => q.id === laId), 'ID này phải nằm ngoài kho mẫu');
  const res = A.ensureFromHistory(s, [{ id: laId, lan: 2 }], { [laId]: { due: 1 } });
  assert.strictEqual(res.added, 1);
  assert.strictEqual(res.unresolvedIds.length, 0);
  const q = topicOf(s, 'toan-day-so-cach-deu').questions.find((x) => x.id === laId);
  assert.deepStrictEqual(q, GEN.generateFromId(laId));
});

t('ensureFromHistory gọi hai lần: lần sau added = 0 nhưng present = 1', () => {
  const s = fakeSubjects(); A.augment(s, 'lop3');
  const h = ['toan_chia-co-du_bo-tro-v1_d7_q6_r5'];
  const l1 = A.ensureFromHistory(s, h, null);
  const l2 = A.ensureFromHistory(s, h, null);
  assert.strictEqual(l1.added, 1);
  assert.strictEqual(l2.added, 0);
  assert.strictEqual(l2.present, 1, 'phải phân biệt "đã có" với "không dựng được"');
  assert.strictEqual(l2.unresolvedIds.length, 0);
});

t('ID hỏng: không thêm câu rác nhưng phải báo unresolvedIds', () => {
  const s = fakeSubjects(); A.augment(s, 'lop3');
  const truoc = topicOf(s, 'toan-chia-het-co-du').questions.length + topicOf(s, 'toan-day-so-cach-deu').questions.length;
  const hong = [
    'toan_chia-co-du_bo-tro-v9_d6_q8_r5',   // sai phiên bản
    'toan_chia-co-du_bo-tro-v1_d06_q8_r5',  // ID không chuẩn
    'toan_chia-co-du_bo-tro-v1_d6_q8_r9',   // tham số ngoài phạm vi
    'toan_dung-het_bo-tro-v1_d5_q6_r0_c2'   // bộ tham số trả null (thiếu nhiễu)
  ];
  const res = A.ensureFromHistory(s, hong, null);
  assert.strictEqual(res.added, 0);
  assert.deepStrictEqual(res.unresolvedIds.sort(), hong.slice().sort(), 'phải liệt kê đủ ID không dựng được');
  const sau = topicOf(s, 'toan-chia-het-co-du').questions.length + topicOf(s, 'toan-day-so-cach-deu').questions.length;
  assert.strictEqual(sau, truoc, 'không được thêm câu rác');
});

t('ID của kho khác không bị tính là unresolved', () => {
  const s = fakeSubjects(); A.augment(s, 'lop3');
  const res = A.ensureFromHistory(s, ['cu_001', '', null, 42, { id: 'en_u3_q07' }, { id: 'genb13_x1' }], null);
  assert.strictEqual(res.added, 0);
  assert.strictEqual(res.unresolvedIds.length, 0, 'ID của kho khác không phải việc của adapter này');
});

t('idsFromHistory lấy từ đúng hai nguồn, nhiều kiểu dữ liệu', () => {
  const id = 'toan_so-so-hang_bo-tro-v1_sbn6_kc3_ssh19';
  const cap = [
    [[id], null],
    [[{ id }], null],
    [[{ qid: id }], null],
    [[{ questionId: id }], null],
    [null, { [id]: { sai: 2 } }],
    [{ [id]: { lan: 1 } }, null]
  ];
  for (const [wrong, review] of cap) {
    assert.deepStrictEqual(A.idsFromHistory(wrong, review), [id], 'không nhận dạng: ' + JSON.stringify(wrong || review).slice(0, 50));
    const s = fakeSubjects(); A.augment(s, 'lop3');
    assert.strictEqual(A.ensureFromHistory(s, wrong, review).added, 1);
  }
  assert.deepStrictEqual(A.idsFromHistory(null, null), []);
});

t('không quét sâu vào dữ liệu lồng của hồ sơ khác', () => {
  const idKhac = 'toan_chia-co-du_bo-tro-v1_d4_q4_r3';
  const caCuc = { profiles: { be2: { wrong: [idKhac] } } };
  assert.deepStrictEqual(A.idsFromHistory(caCuc, null), [], 'không được lấy ID từ nhánh hồ sơ khác');
});

t('opts.normalize được áp cho câu khôi phục', () => {
  const s = fakeSubjects(); A.augment(s, 'lop3');
  const id = 'toan_chia-du-con-thua_bo-tro-v1_d6_q7_r5_c1';
  A.ensureIds(s, [id], { normalize: (q) => Object.assign({}, q, { normalized: true }) });
  const q = topicOf(s, 'toan-chia-het-co-du').questions.find((x) => x.id === id);
  assert.strictEqual(q.normalized, true, 'chưa áp bước chuẩn hóa');
});

t('normalize làm hỏng câu thì tính là unresolved, không thêm vào kho', () => {
  const id = 'toan_chia-du-con-thua_bo-tro-v1_d6_q7_r4_c2';
  const hong = [
    ['trả null', () => null],
    ['chỉ còn ID', (q) => ({ id: q.id })],
    ['mất đề', (q) => Object.assign({}, q, { q: '' })],
    ['mất lựa chọn', (q) => Object.assign({}, q, { choices: [] })],
    ['lựa chọn trùng nhau', (q) => Object.assign({}, q, { choices: ['1', '1', '2', '3'] })],
    ['đáp án ngoài mảng', (q) => Object.assign({}, q, { a: 9 })],
    ['đáp án không phải số nguyên', (q) => Object.assign({}, q, { a: 1.5 })],
    ['đổi mất ID', (q) => Object.assign({}, q, { id: 'khac' })],
    ['ném lỗi', () => { throw new Error('normalize vỡ'); }]
  ];
  for (const [ten, normalize] of hong) {
    const s = fakeSubjects(); A.augment(s, 'lop3');
    const topic = topicOf(s, 'toan-chia-het-co-du');
    const truoc = topic.questions.length;
    let res;
    assert.doesNotThrow(() => { res = A.ensureIds(s, [id], { normalize }); }, 'lỗi thoát ra ngoài adapter: ' + ten);
    assert.strictEqual(res.added, 0, ten);
    assert.deepStrictEqual(res.unresolvedIds, [id], ten);
    assert.strictEqual(topic.questions.length, truoc, 'đã chèn câu hỏng: ' + ten);
  }
});

t('một ID lỗi xen giữa không chặn các ID hợp lệ còn lại', () => {
  const s = fakeSubjects(); A.augment(s, 'lop3');
  const ok1 = 'toan_chia-co-du_bo-tro-v1_d7_q6_r5';
  const xau = 'toan_chia-co-du_bo-tro-v1_d8_q7_r6';
  const ok2 = 'toan_so-so-hang_bo-tro-v1_sbn6_kc3_ssh19';
  const res = A.ensureIds(s, [ok1, xau, ok2], {
    normalize: (q) => { if (q.id === xau) throw new Error('vỡ'); return q; }
  });
  assert.strictEqual(res.added, 2);
  assert.deepStrictEqual(res.unresolvedIds, [xau]);
  assert.ok(topicOf(s, 'toan-chia-het-co-du').questions.some((q) => q.id === ok1));
  assert.ok(topicOf(s, 'toan-day-so-cach-deu').questions.some((q) => q.id === ok2));
});

t('hai chủ đề mới có tên hiển thị (topic.name)', () => {
  const s = fakeSubjects(); A.augment(s, 'lop3');
  assert.strictEqual(topicOf(s, 'toan-chia-het-co-du').name, 'Chia hết – chia có dư');
  assert.strictEqual(topicOf(s, 'toan-day-so-cach-deu').name, 'Dãy số cách đều');
  for (const id of ['toan-chia-het-co-du', 'toan-day-so-cach-deu']) {
    const tp = topicOf(s, id);
    assert.ok(typeof tp.name === 'string' && tp.name.trim() !== '', 'thiếu name: ' + id);
    assert.strictEqual(tp.title, tp.name, 'title và name phải khớp');
  }
});

t('ensureIds gắn câu vào đúng chủ đề theo unit', () => {
  const s = fakeSubjects(); A.augment(s, 'lop3');
  A.ensureIds(s, ['toan_dung-het_bo-tro-v1_d9_q9_r8_c0', 'toan_so-hang-thu-n_bo-tro-v1_sbn3_kc10_n21']);
  assert.ok(topicOf(s, 'toan-chia-het-co-du').questions.some((q) => q.id === 'toan_dung-het_bo-tro-v1_d9_q9_r8_c0'));
  assert.ok(topicOf(s, 'toan-day-so-cach-deu').questions.some((q) => q.id === 'toan_so-hang-thu-n_bo-tro-v1_sbn3_kc10_n21'));
});

t('tiến độ theo ID, không theo vị trí: đảo thứ tự mảng vẫn tìm đúng câu', () => {
  const s = fakeSubjects(); A.augment(s, 'lop3');
  const topic = topicOf(s, 'toan-chia-het-co-du');
  const id = topic.questions[7].id;
  topic.questions.reverse();
  const q = topic.questions.find((x) => x.id === id);
  assert.deepStrictEqual(q, GEN.generateFromId(id));
});

t('độ dài hiển thị: chặn cứng ở mức phi lý, còn lại chỉ cảnh báo biên tập', () => {
  // Ngưỡng 130 / 25 KHÔNG chứng minh layout 390 px — phải xem thật trên máy.
  const s = fakeSubjects(); A.augment(s, 'lop3');
  const all = topicOf(s, 'toan-chia-het-co-du').questions.concat(topicOf(s, 'toan-day-so-cach-deu').questions);
  const canhBao = [];
  for (const q of all) {
    assert.ok(q.q.length <= 220, 'đề dài phi lý (' + q.q.length + '): ' + q.id);
    for (const c of q.choices) assert.ok(c.length <= 40, 'lựa chọn dài phi lý: ' + c);
    if (q.q.length > 130) canhBao.push('đề ' + q.q.length + ' ký tự: ' + q.id);
    for (const c of q.choices) if (c.length > 25) canhBao.push('lựa chọn ' + c.length + ' ký tự: ' + c);
  }
  if (canhBao.length) console.log('  ⚠ cảnh báo biên tập (' + canhBao.length + '): ' + canhBao.slice(0, 3).join(' | '));
});

console.log(`\n${pass} test đạt, ${fail} test hỏng`);
process.exit(fail ? 1 : 0);