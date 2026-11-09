(function () {
'use strict';
/**
 * Bộ sinh câu hỏi Toán lớp 3 — batch 1
 * Phạm vi: chia có dư (nhận diện chia hết, "còn thừa", "đựng hết") và dãy số cách đều
 *          (số số hạng, số hạng thứ n).
 *
 * Nguyên tắc:
 *  - Mỗi câu dựng từ một bộ tham số. ID = mã dạng + phiên bản + tham số.
 *  - Cùng ID luôn dựng lại cùng đề, cùng lựa chọn, cùng vị trí đáp án (xáo trộn
 *    bằng PRNG gieo từ chính ID).
 *  - Nhiễu phải gắn với một lỗi cụ thể. Lọc trùng theo GIÁ TRỊ trước khi định dạng
 *    thành chữ. Không đủ 3 nhiễu hợp lệ thì trả về null (bỏ bộ tham số).
 */

const VERSION = 'bo-tro-v1';
const SOURCE = 'bo-tro-tuan9-11';
const KC_SET = [2, 3, 4, 5, 10];

/* ---------- tiện ích ---------- */

function hashString(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Xáo trộn xác định theo id: cùng id → cùng thứ tự. */
function shuffleByIdinternal(items, id) {
  const rnd = mulberry32(hashString(id));
  const arr = items.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Nhận đáp án đúng + danh sách nhiễu ứng viên (đã kèm key để lọc trùng),
 * trả về { choices, a } hoặc null nếu không đủ 3 nhiễu hợp lệ.
 */
function buildChoices(id, correct, candidates) {
  const seen = new Set([String(correct.key)]);
  const picked = [];
  for (const c of candidates) {
    if (c == null) continue;
    const k = String(c.key);
    if (seen.has(k)) continue;
    seen.add(k);
    picked.push(c);
    if (picked.length === 3) break;
  }
  if (picked.length < 3) return null;
  const all = shuffleByIdinternal([correct, ...picked], id);
  return { choices: all.map((c) => c.text), a: all.findIndex((c) => c === correct) };
}

function assertRange(cond, msg) {
  if (!cond) throw new Error('Tham số ngoài phạm vi: ' + msg);
}

/** Kiểm kiểu trước, kiểm khoảng sau. Chặn chuỗi, số thập phân, NaN, null. */
function int(name, v, lo, hi) {
  if (typeof v !== 'number' || !Number.isInteger(v))
    throw new Error(`Tham số không hợp lệ: ${name} phải là số nguyên (nhận ${JSON.stringify(v)})`);
  assertRange(v >= lo && v <= hi, `${name} ${lo}–${hi} (nhận ${v})`);
  return v;
}

/** ctx / variant: số nguyên an toàn, không âm (xoay vòng theo bảng ngữ cảnh của phiên bản). */
function idx(name, v) {
  if (typeof v !== 'number' || !Number.isSafeInteger(v) || v < 0)
    throw new Error(`Tham số không hợp lệ: ${name} phải là số nguyên an toàn không âm (nhận ${JSON.stringify(v)})`);
  return v;
}

/* ---------- 1. Chia có dư: tính thương và số dư ---------- */

function chiaCoDu({ d, q, r }) {
  int('d', d, 2, 9); int('q', q, 2, 9); int('r', r, 1, 9);
  assertRange(r > 0 && r < d, `0 < r < d (nhận r = ${r}, d = ${d})`);
  const N = d * q + r;
  const id = `toan_chia-co-du_${VERSION}_d${d}_q${q}_r${r}`;
  const fmt = (t, du) => ({ key: `${t}|${du}`, text: `${t} (dư ${du})` });
  const correct = fmt(q, r);
  const res = buildChoices(id, correct, [
    fmt(q + 1, d * (q + 1) - N),          // thương quá lớn + trừ ngược
    fmt(q, d),                            // số dư bằng số chia
    q - 1 >= 1 ? fmt(q - 1, r + d) : null // dựng lại đúng N nhưng dư chưa bé hơn số chia
  ]);
  if (!res) return null;
  return {
    id,
    q: `${N} : ${d} = ?`,
    choices: res.choices,
    a: res.a,
    hint: `Nhẩm bảng ${d} xem ${d} nhân với số nào thì gần ${N} nhất mà không vượt quá ${N}. Số dư phải bé hơn ${d}.`,
    explain: `${d} × ${q} = ${d * q}, lấy ${N} − ${d * q} = ${r} nên ${N} : ${d} = ${q} (dư ${r}). Thử lại: ${q} × ${d} + ${r} = ${N}.`,
    difficulty: 1,
    skill: 'chia-co-du',
    unit: 'chia-co-du',
    source: SOURCE
  };
}

/* ---------- 2. Nhận diện phép chia hết ---------- */

function nhanDienChiaHet({ d, q, variant = 0 }) {
  int('d', d, 2, 9); int('q', q, 2, 9); idx('variant', variant);
  const N = d * q;
  const id = `toan_nhan-dien-chia-het_${VERSION}_d${d}_q${q}_v${variant}`;
  const rnd = mulberry32(hashString(id + '|distractors'));
  const correct = { key: `${N}:${d}`, text: `${N} : ${d}` };
  const cands = [];
  let guard = 0;
  while (cands.length < 6 && guard++ < 200) {
    const dd = 2 + Math.floor(rnd() * 8);          // 2–9
    const qq = 2 + Math.floor(rnd() * 8);          // 2–9
    const rr = 1 + Math.floor(rnd() * (dd - 1));   // 1 … dd−1
    const nn = dd * qq + rr;
    cands.push({ key: `${nn}:${dd}`, text: `${nn} : ${dd}`, du: rr });
  }
  const res = buildChoices(id, correct, cands);
  if (!res) return null;
  const others = res.choices
    .filter((t) => t !== correct.text)
    .map((t) => {
      const [nn, dd] = t.split(' : ').map(Number);
      return `${t} dư ${nn % dd}`;
    });
  return {
    id,
    q: 'Phép chia nào dưới đây là phép chia hết?',
    choices: res.choices,
    a: res.a,
    hint: 'Phép chia hết là phép chia có số dư bằng 0. Nhẩm thử từng phép một.',
    explain: `${N} : ${d} = ${q}, không còn dư. Ba phép kia đều còn dư: ${others.join(', ')}.`,
    difficulty: 1,
    skill: 'chia-het',
    unit: 'chia-co-du',
    source: SOURCE
  };
}

/* ---------- 3. Bài toán "nhiều nhất … còn thừa" ---------- */

/* Bảng ngữ cảnh ĐÓNG BĂNG của phiên bản v1. ctx được chia dư cho CTX_MOD_V1 (= 3),
   KHÔNG chia dư cho độ dài mảng — nếu không, chỉ cần nối thêm một ngữ cảnh là mọi ID cũ
   có ctx ≥ 3 sẽ dựng lại ra lời văn khác.
   KHÔNG đổi thứ tự, KHÔNG chèn vào giữa, KHÔNG nối thêm vào hai bảng v1.
   Muốn thêm ngữ cảnh: tạo bảng mới + hằng CTX_MOD mới cho phiên bản mới, đồng thời GIỮ
   bảng v1 và nhánh dựng lại theo VERSION để các ID v1 cũ vẫn dùng được. */
const CTX_MOD_V1 = 3;
const NGU_CANH_THUA = Object.freeze([
  { tong: 'bông hoa', nhom: 'bó', donViNhom: 'bó', donViLe: 'bông',
    de: (N, d) => `Có ${N} bông hoa, mỗi bó gồm ${d} bông. Hỏi bó được nhiều nhất bao nhiêu bó và còn thừa mấy bông?` },
  { tong: 'quyển vở', nhom: 'chồng', donViNhom: 'chồng', donViLe: 'quyển',
    de: (N, d) => `Có ${N} quyển vở, xếp mỗi chồng ${d} quyển. Hỏi xếp được nhiều nhất bao nhiêu chồng và còn thừa mấy quyển?` },
  { tong: 'cái bánh', nhom: 'hộp', donViNhom: 'hộp', donViLe: 'cái',
    de: (N, d) => `Có ${N} cái bánh, mỗi hộp xếp được ${d} cái. Hỏi xếp được nhiều nhất bao nhiêu hộp đầy và còn thừa mấy cái bánh?` }
]);

function chiaDuConThua({ d, q, r, ctx = 0 }) {
  int('d', d, 2, 9); int('q', q, 2, 9); int('r', r, 1, 9); idx('ctx', ctx);
  assertRange(r > 0 && r < d, `0 < r < d (nhận r = ${r}, d = ${d})`);
  const c = NGU_CANH_THUA[ctx % CTX_MOD_V1];
  const N = d * q + r;
  const id = `toan_chia-du-con-thua_${VERSION}_d${d}_q${q}_r${r}_c${ctx}`;
  const fmt = (nhom, le) => ({ key: `${nhom}|${le}`, text: `${nhom} ${c.donViNhom}, thừa ${le} ${c.donViLe}` });
  const correct = fmt(q, r);
  const res = buildChoices(id, correct, [
    fmt(q + 1, r),  // cộng thêm 1 (cách làm của bài "đựng hết")
    fmt(q, d),      // phần thừa bằng số chia
    fmt(r, q)       // đảo thương với số dư
  ]);
  if (!res) return null;
  return {
    id,
    q: c.de(N, d),
    choices: res.choices,
    a: res.a,
    hint: `Tính ${N} : ${d} được thương mấy, dư mấy. Số ${c.donViNhom} đầy là thương hay là số dư?`,
    explain: `${N} : ${d} = ${q} (dư ${r}). Thương ${q} là số ${c.donViNhom} đầy, ${r} ${c.donViLe} còn lại không đủ một ${c.donViNhom} nên là phần thừa.`,
    difficulty: 1,
    skill: 'chia-du-con-thua',
    unit: 'chia-co-du',
    source: SOURCE
  };
}

/* ---------- 4. Bài toán "cần ít nhất … để đựng hết" ---------- */

/* Bảng ngữ cảnh ĐÓNG BĂNG của phiên bản v1 — xem ghi chú ở NGU_CANH_THUA. */
const NGU_CANH_DUNG = Object.freeze([
  { vat: 'mật ong', dv: 'l', vatChua: 'can',
    de: (N, d) => `Mẹ rót ${N} l mật ong vào các can, mỗi can đựng được nhiều nhất ${d} l. Hỏi mẹ cần ít nhất bao nhiêu can để đựng hết số mật ong đó?` },
  { vat: 'dầu', dv: 'l', vatChua: 'can',
    de: (N, d) => `Có ${N} l dầu, rót vào các can, mỗi can đựng được nhiều nhất ${d} l. Hỏi cần ít nhất bao nhiêu can để đựng hết số dầu đó?` },
  { vat: 'gạo', dv: 'kg', vatChua: 'túi',
    de: (N, d) => `Có ${N} kg gạo, mỗi túi đựng được nhiều nhất ${d} kg. Hỏi cần ít nhất bao nhiêu túi để đựng hết số gạo đó?` }
]);

function dungHet({ d, q, r, ctx = 0 }) {
  int('d', d, 2, 9); int('q', q, 2, 9); int('r', r, 0, 8); idx('ctx', ctx);
  assertRange(r >= 0 && r < d, `0 ≤ r < d (nhận r = ${r}, d = ${d})`);
  const c = NGU_CANH_DUNG[ctx % CTX_MOD_V1];
  const N = d * q + r;
  const dap = r === 0 ? q : q + 1;
  const id = `toan_dung-het_${VERSION}_d${d}_q${q}_r${r}_c${ctx}`;
  const fmt = (n) => ({ key: n, text: `${n} ${c.vatChua}` });
  const correct = fmt(dap);
  const cands = r === 0
    ? [fmt(q + 1), fmt(d), q - 1 >= 1 ? fmt(q - 1) : null]            // máy móc cộng 1 · lấy sức chứa làm số can · bớt 1
    : [fmt(q), fmt(r), fmt(q + 2)];                                   // bỏ phần dư · lấy số dư làm số can · cộng thừa
  const res = buildChoices(id, correct, cands);
  if (!res) return null;
  const explain = r === 0
    ? `${N} : ${d} = ${q}, chia hết nên ${q} ${c.vatChua} là vừa đủ. Chỉ khi còn dư mới phải thêm một ${c.vatChua}.`
    : `${q} ${c.vatChua} đầy chứa ${d * q} ${c.dv}, vẫn còn ${r} ${c.dv} nên phải thêm một ${c.vatChua} nữa: ${q} + 1 = ${q + 1} ${c.vatChua}.`;
  return {
    id,
    q: c.de(N, d),
    choices: res.choices,
    a: res.a,
    hint: r === 0
      ? `Tính ${N} : ${d} trước đã. Phép chia này có còn dư không?`
      : `${N} : ${d} = ${q} (dư ${r}). Chỗ ${c.vat} còn dư đó có bỏ đi được không?`,
    explain,
    difficulty: 2,
    skill: 'dung-het',
    unit: 'chia-co-du',
    source: SOURCE
  };
}

/* ---------- 5. Dãy số cách đều: số số hạng ---------- */

function kiemTraDay(sbn, kc, ssh) {
  int('sbn', sbn, 1, 10);
  int('kc', kc, 2, 10);
  assertRange(KC_SET.includes(kc), `KC ∈ {2,3,4,5,10} (nhận ${kc})`);
  int('ssh', ssh, 4, 25);
}

function dauDay(sbn, kc) {
  return `${sbn}; ${sbn + kc}; ${sbn + 2 * kc}`;
}

function soSoHang({ sbn, kc, ssh }) {
  kiemTraDay(sbn, kc, ssh);
  const sln = (ssh - 1) * kc + sbn;
  const id = `toan_so-so-hang_${VERSION}_sbn${sbn}_kc${kc}_ssh${ssh}`;
  const fmt = (n) => ({ key: n, text: String(n) });
  const correct = fmt(ssh);
  const res = buildChoices(id, correct, [
    fmt(ssh - 1),        // quên cộng 1
    fmt(ssh + 1),        // cộng 1 hai lần
    fmt(sln - sbn)       // dừng lại ở hiệu hai đầu
  ]);
  if (!res) return null;
  return {
    id,
    q: `Dãy số ${dauDay(sbn, kc)}; …; ${sln} có bao nhiêu số hạng?`,
    choices: res.choices,
    a: res.a,
    hint: `Số số hạng = (Số lớn nhất − Số bé nhất) : Khoảng cách + 1. Dãy này có khoảng cách là ${kc}.`,
    explain: `(${sln} − ${sbn}) : ${kc} + 1 = ${ssh - 1} + 1 = ${ssh} số hạng.`,
    difficulty: kc === 2 || kc === 10 ? 1 : 2,
    skill: 'so-so-hang',
    unit: 'day-so-cach-deu',
    source: SOURCE
  };
}

/* ---------- 6. Dãy số cách đều: số hạng thứ n ---------- */

function soHangThuN({ sbn, kc, n, ssh = null }) {
  int('sbn', sbn, 1, 10);
  int('kc', kc, 2, 10);
  assertRange(KC_SET.includes(kc), `KC ∈ {2,3,4,5,10} (nhận ${kc})`);
  int('n', n, 2, 25);
  if (ssh !== null && ssh !== undefined) {
    kiemTraDay(sbn, kc, ssh);
    assertRange(n <= ssh, 'n ≤ SSH với dãy hữu hạn');
  }
  const dap = (n - 1) * kc + sbn;
  const id = `toan_so-hang-thu-n_${VERSION}_sbn${sbn}_kc${kc}_n${n}`;
  const fmt = (v) => ({ key: v, text: String(v) });
  const correct = fmt(dap);
  const res = buildChoices(id, correct, [
    fmt(n * kc),                                  // quên trừ 1 và quên cộng SBN
    fmt((n - 1) * kc),                            // quên cộng SBN
    fmt(n * kc + sbn),                            // số hạng liền sau (quên trừ 1)
    n - 2 >= 1 ? fmt((n - 2) * kc + sbn) : null,  // số hạng liền trước
    n - 2 >= 1 ? fmt((n - 2) * kc) : null         // liền trước và quên cộng SBN (chỉ dùng khi SBN = KC)
  ]);
  if (!res) return null;
  const day = `${dauDay(sbn, kc)}; ${sbn + 3 * kc}; …`;
  return {
    id,
    q: `Cho dãy số ${day} Số hạng thứ ${n} là số nào?`,
    choices: res.choices,
    a: res.a,
    hint: 'Số hạng thứ n = (n − 1) × khoảng cách + số bé nhất của dãy.',
    explain: `Khoảng cách là ${kc}. (${n} − 1) × ${kc} + ${sbn} = ${(n - 1) * kc} + ${sbn} = ${dap}.`,
    difficulty: 2,
    skill: 'so-hang-thu-n',
    unit: 'day-so-cach-deu',
    source: SOURCE
  };
}

/* ---------- registry ---------- */

const TEMPLATES = {
  'chia-co-du': chiaCoDu,
  'nhan-dien-chia-het': nhanDienChiaHet,
  'chia-du-con-thua': chiaDuConThua,
  'dung-het': dungHet,
  'so-so-hang': soSoHang,
  'so-hang-thu-n': soHangThuN
};

/* ---------- dựng lại câu chỉ từ ID ---------- */

const ID_PATTERNS = [
  { template: 'chia-co-du',         re: /^toan_chia-co-du_([a-z0-9-]+)_d(\d+)_q(\d+)_r(\d+)$/,              keys: ['d', 'q', 'r'],
    build: (v, p) => `toan_chia-co-du_${v}_d${p.d}_q${p.q}_r${p.r}` },
  { template: 'nhan-dien-chia-het', re: /^toan_nhan-dien-chia-het_([a-z0-9-]+)_d(\d+)_q(\d+)_v(\d+)$/,      keys: ['d', 'q', 'variant'],
    build: (v, p) => `toan_nhan-dien-chia-het_${v}_d${p.d}_q${p.q}_v${p.variant}` },
  { template: 'chia-du-con-thua',   re: /^toan_chia-du-con-thua_([a-z0-9-]+)_d(\d+)_q(\d+)_r(\d+)_c(\d+)$/, keys: ['d', 'q', 'r', 'ctx'],
    build: (v, p) => `toan_chia-du-con-thua_${v}_d${p.d}_q${p.q}_r${p.r}_c${p.ctx}` },
  { template: 'dung-het',           re: /^toan_dung-het_([a-z0-9-]+)_d(\d+)_q(\d+)_r(\d+)_c(\d+)$/,         keys: ['d', 'q', 'r', 'ctx'],
    build: (v, p) => `toan_dung-het_${v}_d${p.d}_q${p.q}_r${p.r}_c${p.ctx}` },
  { template: 'so-so-hang',         re: /^toan_so-so-hang_([a-z0-9-]+)_sbn(\d+)_kc(\d+)_ssh(\d+)$/,         keys: ['sbn', 'kc', 'ssh'],
    build: (v, p) => `toan_so-so-hang_${v}_sbn${p.sbn}_kc${p.kc}_ssh${p.ssh}` },
  { template: 'so-hang-thu-n',      re: /^toan_so-hang-thu-n_([a-z0-9-]+)_sbn(\d+)_kc(\d+)_n(\d+)$/,        keys: ['sbn', 'kc', 'n'],
    build: (v, p) => `toan_so-hang-thu-n_${v}_sbn${p.sbn}_kc${p.kc}_n${p.n}` }
];

/** Tách ID thành { template, version, params }. Ném lỗi nếu ID sai cấu trúc hoặc sai phiên bản. */
function parseId(id) {
  if (typeof id !== 'string' || id.length === 0)
    throw new Error('ID không hợp lệ: phải là chuỗi khác rỗng');
  for (const p of ID_PATTERNS) {
    const m = id.match(p.re);
    if (!m) continue;
    const version = m[1];
    if (version !== VERSION)
      throw new Error(`ID sai phiên bản: ${version} (bộ sinh hiện tại là ${VERSION})`);
    const params = {};
    p.keys.forEach((k, i) => {
      const raw = m[i + 2];
      const val = Number(raw);
      if (!Number.isSafeInteger(val) || val < 0)
        throw new Error(`ID không hợp lệ: tham số ${k} = "${raw}" không phải số nguyên an toàn không âm`);
      params[k] = val;
    });
    // chặn ID không chuẩn (ví dụ _d06_ hay _c007_): ID dựng lại phải trùng khít ID đầu vào
    if (p.build(version, params) !== id)
      throw new Error(`ID không chuẩn: ${id} (dạng chuẩn là ${p.build(version, params)})`);
    return { template: p.template, version, params };
  }
  throw new Error('ID sai cấu trúc: ' + id);
}

/**
 * Dựng lại nguyên câu chỉ từ ID — dùng cho ôn câu sai và kiểm tra hồi quy.
 * Ném lỗi nếu ID sai cấu trúc / sai phiên bản / tham số ngoài phạm vi.
 * Trả về null nếu bộ tham số hợp lệ nhưng không đủ nhiễu (giống generate).
 */
function generateFromId(id) {
  const { template, params } = parseId(id);
  return generate(template, params);
}

/** Sinh một câu; trả về null nếu bộ tham số không đủ nhiễu hợp lệ. */
function generate(template, params) {
  const fn = TEMPLATES[template];
  if (!fn) throw new Error('Không có mẫu: ' + template);
  return fn(params);
}

/** Sinh toàn bộ kho batch 1 theo các bộ tham số hợp lệ (bỏ bộ nào thiếu nhiễu). */
function generateAll() {
  const out = [];
  const push = (t, p) => { const qn = generate(t, p); if (qn) out.push(qn); };

  for (let d = 2; d <= 9; d++)
    for (let q = 2; q <= 9; q++)
      for (let r = 1; r < d; r++) push('chia-co-du', { d, q, r });

  for (let d = 2; d <= 9; d++)
    for (let q = 2; q <= 9; q++) push('nhan-dien-chia-het', { d, q });

  let i = 0;
  for (let d = 3; d <= 9; d++)
    for (let q = 2; q <= 9; q++)
      for (let r = 1; r < d; r++) push('chia-du-con-thua', { d, q, r, ctx: i++ });

  i = 0;
  for (let d = 2; d <= 9; d++)
    for (let q = 2; q <= 9; q++)
      for (let r = 0; r < d; r++) push('dung-het', { d, q, r, ctx: i++ });

  for (const kc of KC_SET)
    for (let sbn = 1; sbn <= 10; sbn++)
      for (let ssh = 4; ssh <= 25; ssh++) push('so-so-hang', { sbn, kc, ssh });

  for (const kc of KC_SET)
    for (let sbn = 1; sbn <= 10; sbn++)
      for (let n = 2; n <= 25; n++) push('so-hang-thu-n', { sbn, kc, n });

  return out;
}

const exported = { generate, generateAll, generateFromId, parseId, TEMPLATES, VERSION, SOURCE, KC_SET, CTX_MOD_V1 };
if (typeof module !== 'undefined' && module.exports) module.exports = exported;
if (typeof window !== 'undefined') window.ToanBatch1 = exported;

})();
