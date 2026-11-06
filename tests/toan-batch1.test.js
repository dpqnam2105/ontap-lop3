'use strict';
const assert = require('assert');
const G = require('../js/toan-batch1.js');
const FIXTURE = require('./fixtures/toan-batch1-v1.json');

let pass = 0, fail = 0;
function t(name, fn) {
  try { fn(); pass++; }
  catch (e) { fail++; console.log('✗ ' + name + '\n   ' + e.message); }
}

const ALL = G.generateAll();

/* --- cấu trúc chung --- */
t('mọi câu có đủ trường và 4 lựa chọn khác nhau', () => {
  for (const q of ALL) {
    for (const f of ['id', 'q', 'choices', 'a', 'hint', 'explain', 'difficulty', 'skill', 'unit', 'source'])
      assert.ok(q[f] !== undefined, 'thiếu trường ' + f + ' ở ' + q.id);
    assert.strictEqual(q.choices.length, 4, 'không đủ 4 lựa chọn: ' + q.id);
    assert.strictEqual(new Set(q.choices).size, 4, 'lựa chọn trùng nhau: ' + q.id + ' → ' + q.choices.join(' | '));
    assert.ok(q.a >= 0 && q.a < 4, 'chỉ số đáp án sai: ' + q.id);
  }
});

t('ID là duy nhất', () => {
  const ids = ALL.map((q) => q.id);
  assert.strictEqual(new Set(ids).size, ids.length, 'có ID trùng');
});

t('dựng lại nguyên câu CHỈ TỪ ID — toàn kho', () => {
  for (const q of ALL) {
    const lai = G.generateFromId(q.id);
    assert.ok(lai, 'generateFromId trả về null: ' + q.id);
    assert.deepStrictEqual(lai, q, 'dựng lại từ ID khác câu gốc: ' + q.id);
  }
});

t('parseId: tách đúng mẫu và tham số', () => {
  assert.deepStrictEqual(G.parseId('toan_dung-het_bo-tro-v1_d6_q8_r0_c1'),
    { template: 'dung-het', version: 'bo-tro-v1', params: { d: 6, q: 8, r: 0, ctx: 1 } });
  assert.deepStrictEqual(G.parseId('toan_so-hang-thu-n_bo-tro-v1_sbn2_kc3_n10'),
    { template: 'so-hang-thu-n', version: 'bo-tro-v1', params: { sbn: 2, kc: 3, n: 10 } });
});

t('parseId: chặn ID sai cấu trúc, sai phiên bản, tham số ngoài phạm vi', () => {
  assert.throws(() => G.parseId('abc'), /sai cấu trúc/);
  assert.throws(() => G.parseId(''), /không hợp lệ/);
  assert.throws(() => G.parseId(null), /không hợp lệ/);
  assert.throws(() => G.parseId('toan_chia-co-du_bo-tro-v9_d6_q8_r5'), /sai phiên bản/);
  assert.throws(() => G.parseId('toan_khong-co-mau_bo-tro-v1_d6_q8'), /sai cấu trúc/);
  assert.throws(() => G.generateFromId('toan_chia-co-du_bo-tro-v1_d6_q8_r9'), /ngoài phạm vi/);
  assert.throws(() => G.generateFromId('toan_so-so-hang_bo-tro-v1_sbn2_kc7_ssh10'), /ngoài phạm vi/);
});

t('chặn sai kiểu dữ liệu và số thập phân', () => {
  assert.throws(() => G.generate('chia-co-du', { d: 6, q: 8, r: '5' }), /không hợp lệ/);
  assert.throws(() => G.generate('chia-co-du', { d: '6', q: 8, r: 5 }), /không hợp lệ/);
  assert.throws(() => G.generate('chia-co-du', { d: 6, q: 8, r: null }), /không hợp lệ/);
  assert.throws(() => G.generate('chia-co-du', { d: 6, q: 8, r: NaN }), /không hợp lệ/);
  assert.throws(() => G.generate('so-so-hang', { sbn: 2, kc: 3, ssh: 4.5 }), /không hợp lệ/);
  assert.throws(() => G.generate('so-hang-thu-n', { sbn: 2, kc: 3, n: 2.5 }), /không hợp lệ/);
  assert.throws(() => G.generate('so-hang-thu-n', { sbn: 2, kc: 3, n: 5, ssh: 10.5 }), /không hợp lệ/);
  assert.throws(() => G.generate('dung-het', { d: 6, q: 8, r: 0, ctx: -1 }), /không âm/);
  assert.throws(() => G.generate('dung-het', { d: 6, q: 8, r: 0, ctx: 1.5 }), /không âm/);
  assert.throws(() => G.generate('nhan-dien-chia-het', { d: 6, q: 8, variant: -2 }), /không âm/);
  // ssh tùy chọn: chỉ bỏ qua khi KHÔNG được cung cấp
  assert.ok(G.generate('so-hang-thu-n', { sbn: 2, kc: 3, n: 5 }));
  assert.ok(G.generate('so-hang-thu-n', { sbn: 2, kc: 3, n: 5, ssh: undefined }));
});

t('fixture v1: lời văn, ngữ cảnh, nhiễu và xáo trộn không đổi', () => {
  assert.ok(FIXTURE.length >= 20, 'fixture quá ít câu');
  for (const mau of FIXTURE) {
    const lai = G.generateFromId(mau.id);
    assert.ok(lai, 'fixture không dựng lại được: ' + mau.id);
    assert.deepStrictEqual(lai, mau, 'câu v1 đã đổi so với fixture: ' + mau.id);
  }
  const phu = new Set(FIXTURE.map((x) => x.skill));
  for (const s of ['chia-co-du', 'chia-het', 'chia-du-con-thua', 'dung-het', 'so-so-hang', 'so-hang-thu-n'])
    assert.ok(phu.has(s), 'fixture thiếu dạng ' + s);
  assert.ok(FIXTURE.some((x) => /_r0_/.test(x.id)), 'fixture thiếu nhánh đựng hết chia hết');
  for (const c of ['_c0', '_c1', '_c2', '_c3', '_c4', '_c5'])
    assert.ok(FIXTURE.some((x) => x.id.endsWith(c)), 'fixture thiếu ngữ cảnh ' + c);
  for (const sk of ['chia-du-con-thua', 'dung-het'])
    assert.ok(FIXTURE.some((x) => x.skill === sk && Number(x.id.match(/_c(\d+)$/)[1]) >= 3),
      'fixture thiếu ctx ≥ 3 cho ' + sk);
});

t('ngữ cảnh v1: ctx xoay vòng theo CTX_MOD_V1 = 3, không theo độ dài bảng', () => {
  assert.strictEqual(G.CTX_MOD_V1, 3);
  for (const tpl of ['chia-du-con-thua', 'dung-het']) {
    const p = tpl === 'dung-het' ? { d: 6, q: 7, r: 4 } : { d: 4, q: 5, r: 3 };
    for (let c = 0; c < 3; c++) {
      const g1 = G.generate(tpl, Object.assign({}, p, { ctx: c }));
      const g2 = G.generate(tpl, Object.assign({}, p, { ctx: c + 3 }));
      const g3 = G.generate(tpl, Object.assign({}, p, { ctx: c + 300 }));
      assert.strictEqual(g2.q, g1.q, `ctx ${c + 3} phải cùng lời văn với ctx ${c}`);
      assert.strictEqual(g3.q, g1.q, `ctx ${c + 300} phải cùng lời văn với ctx ${c}`);
    }
  }
});

t('ctx / variant: chặn số nguyên không an toàn', () => {
  assert.throws(() => G.generate('dung-het', { d: 6, q: 8, r: 0, ctx: 1e21 }), /an toàn/);
  assert.throws(() => G.generate('nhan-dien-chia-het', { d: 6, q: 8, variant: 2 ** 53 }), /an toàn/);
});

t('parseId: chặn ID không chuẩn (số có số 0 ở đầu)', () => {
  assert.throws(() => G.parseId('toan_chia-co-du_bo-tro-v1_d06_q8_r5'), /không chuẩn/);
  assert.throws(() => G.parseId('toan_dung-het_bo-tro-v1_d6_q8_r0_c007'), /không chuẩn/);
  assert.throws(() => G.parseId('toan_so-so-hang_bo-tro-v1_sbn04_kc4_ssh12'), /không chuẩn/);
});

t('cùng tham số sinh hai lần cho kết quả giống nhau', () => {
  const cases = [
    ['chia-co-du', { d: 6, q: 8, r: 5 }],
    ['nhan-dien-chia-het', { d: 8, q: 6 }],
    ['chia-du-con-thua', { d: 3, q: 9, r: 2, ctx: 0 }],
    ['dung-het', { d: 6, q: 7, r: 4, ctx: 0 }],
    ['dung-het', { d: 6, q: 8, r: 0, ctx: 1 }],
    ['so-so-hang', { sbn: 4, kc: 4, ssh: 12 }],
    ['so-hang-thu-n', { sbn: 2, kc: 3, n: 10 }]
  ];
  for (const [tpl, p] of cases) {
    const a = G.generate(tpl, p), b = G.generate(tpl, p);
    assert.deepStrictEqual(a, b, 'không dựng lại được: ' + tpl);
    assert.strictEqual(a.id, b.id);
  }
});

t('giải thích không nhắc nhãn A/B/C/D', () => {
  for (const q of ALL)
    assert.ok(!/\b(đáp án|phương án|ý)\s*[ABCD]\b/.test(q.explain + q.hint), 'nhắc nhãn lựa chọn: ' + q.id);
});

/* --- chia có dư --- */
t('chia có dư: d × q + r = N, số dư bé hơn số chia, đáp án đúng', () => {
  for (let d = 2; d <= 9; d++) for (let q = 2; q <= 9; q++) for (let r = 1; r < d; r++) {
    const item = G.generate('chia-co-du', { d, q, r });
    if (!item) continue;
    const N = d * q + r;
    assert.ok(r < d);
    assert.strictEqual(d * q + r, N);
    assert.strictEqual(item.q, `${N} : ${d} = ?`);
    assert.strictEqual(item.choices[item.a], `${q} (dư ${r})`, 'đáp án sai ở ' + item.id);
    for (const c of item.choices) {
      const m = c.match(/^(\d+) \(dư (\d+)\)$/);
      assert.ok(m, 'định dạng lựa chọn lạ: ' + c);
      const [, tq, tr] = m.map(Number);
      const laDung = Number(tq) === q && Number(tr) === r;
      assert.ok(laDung || Number(tq) * d + Number(tr) !== N || Number(tr) >= d,
        'nhiễu cũng là lời giải hợp lệ: ' + item.id + ' → ' + c);
    }
  }
});

t('chia có dư: giữ nguyên trường hợp biên r = d − 1', () => {
  const item = G.generate('chia-co-du', { d: 5, q: 7, r: 4 });
  assert.ok(item, 'không được bỏ bộ tham số r = d − 1');
  assert.strictEqual(item.choices[item.a], '7 (dư 4)');
  assert.ok(item.choices.includes('7 (dư 5)'), 'thiếu nhiễu số dư bằng số chia');
});

/* --- nhận diện chia hết --- */
t('nhận diện chia hết: đúng một lựa chọn chia hết', () => {
  for (let d = 2; d <= 9; d++) for (let q = 2; q <= 9; q++) {
    const item = G.generate('nhan-dien-chia-het', { d, q });
    if (!item) continue;
    const chiaHet = item.choices.filter((c) => {
      const [n, dd] = c.split(' : ').map(Number);
      return n % dd === 0;
    });
    assert.strictEqual(chiaHet.length, 1, 'nhiều hơn một phép chia hết: ' + item.id);
    assert.strictEqual(item.choices[item.a], chiaHet[0]);
  }
});

/* --- còn thừa / đựng hết --- */
t('còn thừa: đáp án là thương, phần thừa là số dư', () => {
  for (let d = 3; d <= 9; d++) for (let q = 2; q <= 9; q++) for (let r = 1; r < d; r++) {
    const item = G.generate('chia-du-con-thua', { d, q, r, ctx: 0 });
    if (!item) continue;
    assert.ok(item.choices[item.a].startsWith(String(q) + ' '), 'đáp án không phải thương: ' + item.id);
    assert.ok(item.choices[item.a].includes('thừa ' + r + ' '), 'phần thừa sai: ' + item.id);
  }
});

t('đựng hết: hai nhánh — chia hết lấy q, có dư lấy q + 1', () => {
  for (let d = 2; d <= 9; d++) for (let q = 2; q <= 9; q++) for (let r = 0; r < d; r++) {
    const item = G.generate('dung-het', { d, q, r, ctx: 0 });
    if (!item) continue;
    const dap = Number(item.choices[item.a].split(' ')[0]);
    assert.strictEqual(dap, r === 0 ? q : q + 1, 'sai nhánh: ' + item.id);
  }
});

t('đựng hết: có đủ cả hai nhánh trong kho', () => {
  const ds = ALL.filter((x) => x.skill === 'dung-het');
  assert.ok(ds.some((x) => /_r0_/.test(x.id)), 'thiếu nhánh chia hết');
  assert.ok(ds.some((x) => /_r[1-9]_/.test(x.id)), 'thiếu nhánh có dư');
});

/* --- dãy số: đối chiếu bằng mảng thực --- */
function dungDay(sbn, kc, ssh) {
  const a = [];
  for (let i = 0; i < ssh; i++) a.push(sbn + i * kc);
  return a;
}

t('số số hạng: khớp với mảng dãy dựng thực', () => {
  for (const kc of G.KC_SET) for (let sbn = 1; sbn <= 10; sbn++) for (let ssh = 4; ssh <= 25; ssh++) {
    const item = G.generate('so-so-hang', { sbn, kc, ssh });
    if (!item) continue;
    const day = dungDay(sbn, kc, ssh);
    assert.strictEqual(Number(item.choices[item.a]), day.length, 'sai số số hạng: ' + item.id);
    assert.ok(item.q.includes('; ' + day[day.length - 1] + ' có'), 'số lớn nhất trong đề sai: ' + item.id);
    assert.ok(item.q.startsWith(`Dãy số ${day[0]}; ${day[1]}; ${day[2]};`), 'ba số đầu sai: ' + item.id);
  }
});

t('số hạng thứ n: khớp với phần tử thứ n của mảng', () => {
  for (const kc of G.KC_SET) for (let sbn = 1; sbn <= 10; sbn++) for (let n = 2; n <= 25; n++) {
    const item = G.generate('so-hang-thu-n', { sbn, kc, n });
    if (!item) continue;
    const day = dungDay(sbn, kc, n);
    assert.strictEqual(Number(item.choices[item.a]), day[n - 1], 'sai số hạng thứ n: ' + item.id);
  }
});

t('số hạng thứ n: dãy quen thuộc SBN = KC vẫn sinh được (4; 8; 12; …)', () => {
  const item = G.generate('so-hang-thu-n', { sbn: 4, kc: 4, n: 7 });
  assert.ok(item, 'bộ tham số SBN = KC bị bỏ');
  assert.strictEqual(Number(item.choices[item.a]), 28);
});

t('số hạng thứ n: dãy hữu hạn phải có n ≤ SSH', () => {
  assert.throws(() => G.generate('so-hang-thu-n', { sbn: 2, kc: 3, n: 12, ssh: 10 }));
  assert.ok(G.generate('so-hang-thu-n', { sbn: 2, kc: 3, n: 9, ssh: 10 }));
});

t('tham số ngoài phạm vi bị chặn', () => {
  assert.throws(() => G.generate('chia-co-du', { d: 6, q: 8, r: 6 }), /ngoài phạm vi/);
  assert.throws(() => G.generate('so-so-hang', { sbn: 11, kc: 3, ssh: 10 }), /ngoài phạm vi/);
  assert.throws(() => G.generate('so-so-hang', { sbn: 2, kc: 7, ssh: 10 }), /ngoài phạm vi/);
});

/* --- phân bố vị trí đáp án --- */
t('vị trí đáp án phân bố đều (mỗi vị trí 20–30%)', () => {
  const c = [0, 0, 0, 0];
  ALL.forEach((q) => c[q.a]++);
  const ti = c.map((x) => (x * 100) / ALL.length);
  ti.forEach((p, i) => assert.ok(p >= 20 && p <= 30, 'vị trí ' + i + ' chiếm ' + p.toFixed(1) + '%'));
});

console.log(`\n${pass} test đạt, ${fail} test hỏng — tổng kho ${ALL.length} câu`);
const c = [0, 0, 0, 0]; ALL.forEach((q) => c[q.a]++);
console.log('phân bố vị trí đáp án:', c.map((x) => (x * 100 / ALL.length).toFixed(1) + '%').join(' / '));
const by = {}; ALL.forEach((q) => by[q.skill] = (by[q.skill] || 0) + 1); console.log('theo dạng:', by);
process.exit(fail ? 1 : 0);
