// Kiểm thử bộ sinh B1–B3 (js/gen-b1b3.js). Chạy: node tests/gen-b1b3.test.js
// Thứ tự kiểm tra: (1) bảng ví dụ viết tay độc lập, (2) ca biên, (3) id tái tạo + ảnh chụp cố định,
// (4) quét ngẫu nhiên seed cố định — chỉ là lớp bổ sung, không thay cho (1)–(3).
const path = require('path'), fs = require('fs'), assert = require('assert');
const G = require(path.join(__dirname, '..', 'js', 'gen-b1b3.js'));
const GOLDEN = path.join(__dirname, 'fixtures', 'gen-b1b3-golden.json');

const num = s => Number(String(s).replace(/ /g, ''));          // "1 000" → 1000
const B = id => { const q = G.build(id); assert.ok(q, 'build null: ' + id); return q; };
const ans = q => q.choices[q.a];

// (1a) Cách đọc số — viết tay, KHÔNG sinh từ hàm read(). Phủ: 0, một/mốt, bốn/tư, năm/lăm, linh, tròn chục, tròn trăm, biên.
//      Chữ số 4 hàng đơn vị: «tư» sau «mươi» và «linh», «bốn» sau «mười» (Nam chốt theo sách).
const READ = {
  0: 'không', 1: 'một', 5: 'năm', 9: 'chín',
  10: 'mười', 11: 'mười một', 14: 'mười bốn', 15: 'mười lăm', 19: 'mười chín',
  20: 'hai mươi', 21: 'hai mươi mốt', 25: 'hai mươi lăm', 30: 'ba mươi', 45: 'bốn mươi lăm', 51: 'năm mươi mốt',
  55: 'năm mươi lăm', 90: 'chín mươi', 99: 'chín mươi chín',
  100: 'một trăm', 101: 'một trăm linh một', 105: 'một trăm linh năm', 110: 'một trăm mười', 111: 'một trăm mười một',
  115: 'một trăm mười lăm', 120: 'một trăm hai mươi', 121: 'một trăm hai mươi mốt', 205: 'hai trăm linh năm',
  250: 'hai trăm năm mươi', 305: 'ba trăm linh năm', 405: 'bốn trăm linh năm', 450: 'bốn trăm năm mươi',
  500: 'năm trăm', 555: 'năm trăm năm mươi lăm', 701: 'bảy trăm linh một', 710: 'bảy trăm mười', 715: 'bảy trăm mười lăm',
  4: 'bốn', 24: 'hai mươi tư', 44: 'bốn mươi tư', 94: 'chín mươi tư', 104: 'một trăm linh tư', 114: 'một trăm mười bốn',
  124: 'một trăm hai mươi tư', 140: 'một trăm bốn mươi', 41: 'bốn mươi mốt', 404: 'bốn trăm linh tư', 994: 'chín trăm chín mươi tư',
  999: 'chín trăm chín mươi chín', 1000: 'một nghìn'
};
// (1b) Câu viết tay: id → đáp án đúng + (một số) nhiễu bắt buộc phải có, tính tay theo đúng lỗi.
const CASES = [
  ['toan_g13_cong_v1_367-258', '625', ['515']],                 // 515: quên nhớ cả hai hàng
  ['toan_g13_cong_v1_999-1', '1 000', ['990']],                 // tổng đúng bằng 1000
  ['toan_g13_cong_v1_352-24', '376', []],                       // không nhớ
  ['toan_g13_tru_v1_503-178', '325', ['475', '435']],           // 475: lấy số lớn trừ số bé từng hàng; 435: quên trả
  ['toan_g13_tru_v1_302-298', '4', []],                         // số trừ lớn, hiệu nhỏ
  ['toan_g13_tru_v1_1000-1', '999', []],
  ['toan_g13_timsh_v1_0-245-250', '5', ['495']],                // ? + 245 = 250, số chưa biết nhỏ; 495: nhầm phép cộng
  ['toan_g13_timsh_v1_1-300-720', '420', []],                   // 300 + ? = 720
  ['toan_g13_timsbt_v1_128-300', '428', ['172']],               // ? − 128 = 300
  ['toan_g13_timst_v1_700-456', '244', ['356']],                // 700 − ? = 456; 356: trừ số bé cho số lớn từng hàng
  ['toan_g13_sau_v1_999', '1 000', ['990']],
  ['toan_g13_sau_v1_0', '1', []],
  ['toan_g13_truoc_v1_1000', '999', []],
  ['toan_g13_truoc_v1_700', '699', []],
  ['toan_g13_gom_v1_706', '706', ['76', '760']],
  ['toan_g13_tong_v1_706', '700 + 6', ['7 + 0 + 6', '700 + 60']],
  ['toan_g13_gop_v1_532', '532', ['523']],
  ['toan_g13_viet_v1_405', '405', ['450', '45']],
  ['toan_g13_doc_v1_405', 'bốn trăm linh năm', ['bốn trăm năm mươi']],
  ['toan_g13_dau_v1_99-100', '<', []],
  ['toan_g13_dau_v1_340-340', '=', []],
  ['toan_g13_dau_v1_598-589', '>', []],
  ['toan_g13_max_v1_589-598-859-895', '895', []],
  ['toan_g13_min_v1_589-598-859-85', '85', []],
  ['toan_g13_xeptang_v1_589-598-85-895', '85; 589; 598; 895', ['895; 598; 589; 85']],
  ['toan_g13_xepgiam_v1_589-598-85-895', '895; 598; 589; 85', []],
];
// (1c) Khung lời văn → phép tính đúng (viết tay). Bẫy: "A ít hơn B" hỏi B → cộng.
const FRAME_OP = { them: '+', bot: '-', nhieu: '+', it: '-', aItB: '+', aNhieuB: '-' };
const ALLOWED_WORDS = /^(không|một|mốt|hai|ba|bốn|tư|năm|lăm|sáu|bảy|tám|chín|mười|mươi|trăm|linh|nghìn)( |$)/;

const tests = {
  'đọc số khớp bảng viết tay (0, mốt, lăm, linh, tròn chục/trăm, 1000)'() {
    for (const [n, w] of Object.entries(READ)) assert.strictEqual(G.read(Number(n)), w, n);
  },
  'đọc «tư»: câu đọc/viết số có 24, 104…; «bốn» ở vị trí đó không bao giờ là đáp án sai'() {
    for (const [n, w] of [[24, 'hai mươi tư'], [104, 'một trăm linh tư'], [504, 'năm trăm linh tư'], [994, 'chín trăm chín mươi tư']]) {
      assert.strictEqual(ans(B('toan_g13_doc_v1_' + n)), w);
      assert.ok(B('toan_g13_viet_v1_' + n).q.includes('«' + w + '»'), 'viet ' + n);
    }
    assert.strictEqual(ans(B('toan_g13_doc_v1_14')), 'mười bốn');
  },
  'ví dụ viết tay: đáp án đúng + nhiễu bắt buộc'() {
    for (const [id, a, must] of CASES) {
      const q = B(id);
      assert.strictEqual(ans(q), a, id);
      for (const m of must) assert.ok(q.choices.includes(m), id + ' thiếu nhiễu ' + m + ' — có ' + q.choices.join(' | '));
    }
  },
  'lời văn: mỗi khung ra đúng phép tính (kể cả bẫy đảo chiều)'() {
    G.FRAMES.forEach((F, f) => {
      const q = B('toan_g13_lv_v1_' + [f, 245, 38, 1, 0, 0, 1].join('-'));   // thư viện
      const expect = FRAME_OP[F.key] === '+' ? 283 : 207;
      assert.strictEqual(num(ans(q)), expect, F.key);
      assert.ok(q.choices.includes(String(FRAME_OP[F.key] === '+' ? 207 : 283)), F.key + ': thiếu nhiễu nhầm phép tính');
      assert.ok(!/\{[ABxyi]|\{add|\{sub/.test(q.q + q.hint), F.key + ': còn chỗ trống chưa thay');
      const small = B('toan_g13_lv_v1_' + [f, 45, 28, 0, 2, 0, 1].join('-'));   // đồ dùng của bé: số nhỏ
      assert.strictEqual(num(ans(small)), FRAME_OP[F.key] === '+' ? 73 : 17, F.key + ' (cá nhân)');
    });
  },
  'lời văn: số phải hợp bối cảnh (đồ dùng của bé thì số nhỏ; số lớn dùng thư viện, cửa hàng, trang trại)'() {
    assert.strictEqual(G.build('toan_g13_lv_v1_0-990-9-0-0-0-1'), null, 'Lan có 990 quyển vở');
    assert.strictEqual(G.build('toan_g13_lv_v1_0-95-60-0-0-0-1'), null, 'kết quả 155 > 150 với đồ dùng cá nhân');
    assert.strictEqual(G.build('toan_g13_lv_v1_0-60-5-1-0-0-1'), null, 'thư viện mà chỉ có 60 quyển sách ban đầu');
    assert.strictEqual(G.build('toan_g13_lv_v1_0-245-38-9-0-0-1'), null, 'bối cảnh không có');
    assert.strictEqual(G.build('toan_g13_lv_v1_0-245-38-1-5-0-1'), null, 'đồ vật không có trong bối cảnh');
    assert.strictEqual(G.build('toan_g13_lv_v1_0-245-38-1-0-1-1'), null, 'A trùng B');
    const P = G.pick('boi-canh', 600, { templates: ['lv'] });
    assert.ok(P.length === 600);
    const small = P.filter(q => G.parse(q.id).params[3] === 0), big = P.filter(q => G.parse(q.id).params[3] > 0);
    assert.ok(small.length > 100 && big.length > 200, small.length + '/' + big.length);
    for (const q of small) { const [, x, y] = G.parse(q.id).params; assert.ok(x <= 99 && y <= 60 && num(ans(q)) <= 150, q.id); }
    for (const q of big) assert.ok(G.parse(q.id).params[1] >= 100, q.id);
  },
  'id sai / ngoài phạm vi / sai phiên bản → null'() {
    const bad = ['', 'toan_g13_cong_v2_367-258', 'toan_g13_cong_v1_0367-258', 'toan_g13_cong_v1_999-2',
      'toan_g13_tru_v1_5-9', 'toan_g13_cong_v1_1-2-3', 'toan_g13_cong_v01_367-258', 'toan_g13_cong_v0_367-258',
      'toan_g13_constructor_v1_1', 'toan_g13_toString_v1_1', 'toan_g13___proto___v1_1', 'toan_g13_xyz_v1_1', 'toan_g13_doc_v1_7', 'toan_g13_tong_v1_700',
      'toan_g13_timsh_v1_2-1-5', 'toan_g13_lv_v1_9-245-38-1-0-0-1', 'toan_g13_lv_v1_1-1500-600-1-0-0-1', 'toan_g13_lv_v1_0-245-38-0-1',
      'toan_g13_max_v1_1-1-2-3', 'toan_g13_sau_v1_1000', 'toan_g13_truoc_v1_0'];
    for (const id of bad) assert.strictEqual(G.build(id), null, id);
  },
  'bộ chọn: danh sách mẫu rỗng / tên sai / lọc hết → [] (không lỗi); maxLesson 0 khác với không truyền'() {
    assert.deepStrictEqual(G.pick('t', 3, { templates: [] }), []);
    assert.deepStrictEqual(G.pick('t', 3, { templates: ['khongco', 'constructor', '__proto__', 'toString'] }), []);
    assert.deepStrictEqual(G.pick('t', 3, { templates: 'cong' }), [], 'không phải mảng → không mở gì');
    assert.deepStrictEqual(G.pick('t', 3, { maxLesson: 0 }), [], 'maxLesson 0 = chưa học bài nào');
    for (const bad of [null, -1, 1.5, '3', NaN, Infinity]) assert.deepStrictEqual(G.pick('t', 3, { maxLesson: bad }), [], 'maxLesson ' + bad);
    assert.deepStrictEqual(G.pick('t', 3, { templates: ['cong', 'tru'], maxLesson: 1 }), [], 'lọc hết (cộng, trừ là B2)');
    assert.deepStrictEqual(G.pick('t', 0), []); assert.deepStrictEqual(G.pick('t', -2), []);
    const mixed = G.pick('t', 20, { templates: ['khongco', 'cong'] });
    assert.ok(mixed.length === 20 && mixed.every(q => q.id.includes('_cong_')), 'tên sai bị bỏ, tên đúng vẫn dùng');
    const b1 = G.pick('t', 200, { maxLesson: 1 });
    assert.ok(b1.length === 200 && b1.every(q => q.lesson.no === 1), 'maxLesson 1 chỉ ra B1');
    assert.ok(G.pick('t', 200, { maxLesson: 3 }).some(q => q.lesson.no === 3));
    assert.strictEqual(G.pick('t', 50, { maxLesson: undefined }).length, 50, 'undefined = không lọc');
  },
  'tăng phiên bản: câu v1 đã lưu (lịch ôn) vẫn dựng lại y nguyên; câu mới ra v2'() {
    const gold = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
    const T2 = Object.assign({}, G.T, { cong: Object.assign({}, G.T.cong, {
      build(p) { const c = G.T.cong.build(p); return c && Object.assign(c, { hint: 'GỢI Ý MỚI v2' }); } }) });
    const G2 = Object.create(G, { VERSION: { value: 2 }, T_BY_VER: { value: { 1: G.T, 2: T2 } } });
    for (const q of gold) assert.deepStrictEqual(G2.build(q.id), q, 'v1 sau khi lên v2: ' + q.id);
    const fresh = G2.pick('v2', 40, { templates: ['cong'] });
    assert.ok(fresh.length === 40 && fresh.every(q => /_v2_/.test(q.id) && q.hint === 'GỢI Ý MỚI v2'));
    assert.strictEqual(G.build(fresh[0].id), null, 'bản v1 không dựng câu v2 (phiên bản tương lai)');
  },
  'cùng id → cùng câu (dựng lại để ôn câu sai); id trong câu = id đầu vào'() {
    const P = G.pick('tai-tao', 500);
    for (const q of P) {
      assert.strictEqual(q.id, G.id(G.parse(q.id).tpl, G.parse(q.id).params));
      assert.deepStrictEqual(G.build(q.id), q, q.id);
    }
    assert.deepStrictEqual(G.pick('tai-tao', 500).map(q => q.id), P.map(q => q.id), 'cùng seed → cùng danh sách');
  },
  'ảnh chụp cố định (tests/fixtures/gen-b1b3-golden.json) không đổi'() {
    if (process.argv.includes('--update-golden')) {
      const ids = G.pick('golden-v1', 60).map(q => q.id).concat(CASES.map(c => c[0]));
      fs.writeFileSync(GOLDEN, JSON.stringify(ids.map(id => G.build(id)), null, 1) + '\n');
    }
    const gold = JSON.parse(fs.readFileSync(GOLDEN, 'utf8'));
    for (const q of gold) assert.deepStrictEqual(G.build(q.id), q, 'đổi nội dung câu ' + q.id + ' → phải tăng VERSION');
  },
  'quét 4000 câu seed cố định: đáp án tính độc lập, lựa chọn khác nhau, trong 0–1000, đủ metadata'() {
    const P = G.pick('quet-1', 4000);
    assert.strictEqual(P.length, 4000);
    for (const q of P) {
      const { tpl, params: p } = G.parse(q.id);
      const n = q.choices.length;
      assert.strictEqual(n, tpl === 'dau' ? 3 : 4, q.id);
      assert.strictEqual(new Set(q.choices).size, n, 'trùng lựa chọn ' + q.id);
      assert.ok(q.a >= 0 && q.a < n, q.id);
      for (const k of ['skill', 'track', 'lesson', 'stage', 'source', 'hint', 'difficulty', 'review']) assert.ok(q[k] != null, q.id + ' thiếu ' + k);
      assert.ok(q.lesson.book === 'kntt-toan3' && q.lesson.vol === 1 && q.lesson.no >= 1 && q.lesson.no <= 3, q.id);
      // lựa chọn dạng số đều nằm trong 0–1000
      for (const c of q.choices) if (/^[\d ]+$/.test(c)) assert.ok(num(c) >= 0 && num(c) <= 1000, q.id + ' lựa chọn ' + c);
      // đáp án đúng tính lại bằng phép tính riêng của bài kiểm thử
      const A = num(ans(q));
      const expect = {
        cong: () => p[0] + p[1], tru: () => p[0] - p[1], timsh: () => p[2] - p[1], timsbt: () => p[0] + p[1], timst: () => p[0] - p[1],
        sau: () => p[0] + 1, truoc: () => p[0] - 1, gom: () => p[0], gop: () => p[0], viet: () => p[0],
        max: () => Math.max(...p), min: () => Math.min(...p),
        lv: () => p[1] + (FRAME_OP[G.FRAMES[p[0]].key] === '+' ? p[2] : -p[2])
      }[tpl];
      if (expect) assert.strictEqual(A, expect(), q.id);
      if (tpl === 'dau') assert.strictEqual(ans(q), p[0] > p[1] ? '>' : p[0] < p[1] ? '<' : '=', q.id);
      if (tpl === 'tong') assert.strictEqual(ans(q).split(' + ').reduce((s, x) => s + Number(x), 0), p[0], q.id);
      if (tpl === 'xeptang' || tpl === 'xepgiam') {
        const s = p.slice().sort((x, y) => tpl === 'xeptang' ? x - y : y - x).join('; ');
        assert.strictEqual(ans(q), s, q.id);
      }
      if (tpl === 'tong') for (const c of q.choices) if (c !== ans(q)) assert.notStrictEqual(c.split(' + ').reduce((s, x) => s + Number(x), 0), p[0], q.id + ' nhiễu có tổng bằng đáp án');
      if (tpl === 'doc') {
        for (const c of q.choices) {
          assert.ok(!/(lẻ|ngàn|nhăm|mười tư|mươi bốn|linh bốn)/.test(c), q.id + ' dùng biến thể / cách đọc không theo sách: ' + c);
          let rest = c; while (rest) { const m = ALLOWED_WORDS.exec(rest); assert.ok(m, q.id + ' từ lạ: ' + c); rest = rest.slice(m[0].length); }
        }
        assert.strictEqual(ans(q), G.read(p[0]));
      }
      if (tpl === 'viet') assert.ok(q.q.includes('«' + G.read(p[0]) + '»'), q.id);
    }
  },
  'phạm vi luyện: có số một, hai, ba chữ số, có 0 và 1000, có hiệu / số chưa biết nhỏ'() {
    const P = G.pick('pham-vi', 4000);
    const answers = P.filter(q => /^[\d ]+$/.test(ans(q))).map(q => num(ans(q)));
    assert.ok(answers.some(v => v < 10), 'có đáp án một chữ số');
    assert.ok(answers.some(v => v >= 10 && v < 100), 'có đáp án hai chữ số');
    assert.ok(answers.filter(v => v >= 100).length > answers.length * 0.5, 'đa số ba chữ số');
    assert.ok(answers.includes(1000), 'có 1000');
    assert.ok(answers.includes(0) || P.some(q => / 0( |$)/.test(q.q)), 'có số 0');
    assert.ok(P.some(q => q.id.includes('_tru_') && num(ans(q)) < 10), 'có phép trừ hiệu nhỏ');
    assert.ok(P.some(q => q.id.includes('_timsh_') && num(ans(q)) < 20), 'có số hạng chưa biết nhỏ');
    assert.ok(P.some(q => q.id.includes('_cong_') && num(ans(q)) === 1000), 'có tổng bằng 1000');
    for (const t of Object.keys(G.T)) assert.ok(P.some(q => q.id.includes('_' + t + '_')), 'thiếu mẫu ' + t);
  },
  'vị trí đáp án đúng chia đều (mỗi ô 20–30%)'() {
    const P = G.pick('vi-tri', 4000).filter(q => q.choices.length === 4);
    const c = [0, 0, 0, 0]; P.forEach(q => c[q.a]++);
    c.forEach((x, i) => assert.ok(x / P.length > 0.2 && x / P.length < 0.3, 'ô ' + i + ': ' + c.join('/')));
  },
  'kho web v1: 300 id đúng thứ tự như fixture (ánh xạ tiến độ cũ phụ thuộc seed, trọng số, cách sinh tham số)'() {
    const fx = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'gen-b1b3-bank-v1.json'), 'utf8'));
    assert.strictEqual(fx.length, 300);
    assert.deepStrictEqual(G.legacyBankIds(), fx, 'legacyBankIds đổi → dữ liệu tiến độ cũ sẽ chuyển sai');
    if (G.VERSION === 1) assert.deepStrictEqual(G.bank().map(q => q.id), fx, 'kho web v1 đổi');
  },
  'skill của mọi mẫu có trong data-lop3/skills.json'() {
    const L = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data-lop3', 'skills.json'), 'utf8')).labels.toan;
    for (const [t, T] of Object.entries(G.T)) assert.ok(L[T.skill], t + ': ' + T.skill);
  },
  'gợi ý không lộ đáp án: gợi ý không phụ thuộc số trong đề'() {
    const byTpl = {};
    for (const q of G.pick('goi-y', 3000)) {
      const t = G.parse(q.id).tpl;
      if (t === 'lv') { assert.ok(!/\d/.test(q.hint), q.id + ' gợi ý lời văn có số'); continue; }   // chỉ thay tên người/nơi
      (byTpl[t] = byTpl[t] || new Set()).add(q.hint);
    }
    for (const [t, hs] of Object.entries(byTpl)) assert.strictEqual(hs.size, 1, t + ': gợi ý đổi theo câu → có thể lộ đáp án');
  },
};

let fail = 0;
for (const [name, fn] of Object.entries(tests)) {
  try { fn(); console.log('✔', name); } catch (e) { fail++; console.log('✘', name, '\n   ', e.message); }
}
console.log(fail ? fail + ' lỗi' : 'Tất cả đạt');
process.exit(fail ? 1 : 0);
