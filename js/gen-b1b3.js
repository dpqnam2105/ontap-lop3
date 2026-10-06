// =============================================
// GEN-B1B3.JS — Bộ sinh câu nền Toán 3, Bài 1–3 (KNTT tập 1), phạm vi 0–1000
// TRẠNG THÁI: THỬ NGHIỆM — chưa nạp trong index.html, chưa vào kế hoạch học.
//   Chờ Codex rà code + câu mẫu (docs/mau-sinh-b1b3.md) rồi mới tích hợp.
//
// Nguyên tắc (đã chốt với Codex):
// - Câu TÁI TẠO ĐƯỢC: id = "toan_g13_<mẫu>_v<phiên bản>_<tham số>". Cùng id → cùng đề,
//   đáp án, gợi ý, thứ tự lựa chọn. GenB13.build(id) dựng lại đúng câu đã gặp (ôn câu sai).
//   PHIÊN BẢN: bảng mẫu của mỗi phiên bản được GIỮ NGUYÊN mãi (T_BY_VER). Muốn sửa một mẫu:
//   tạo bảng mới (vd T2 = Object.assign({}, T, { cong: congMoi })), thêm vào T_BY_VER, tăng VERSION.
//   Câu luyện mới dùng VERSION mới; id v1 đã nằm trong lịch ôn vẫn dựng lại đúng câu cũ.
//   Ảnh chụp cố định (tests/fixtures/gen-b1b3-golden.json) báo đỏ nếu lỡ đổi nội dung một phiên bản đã phát hành.
// - Phạm vi toán học: số 0–1000 (một, hai, ba chữ số, 0 và 1000). Khi luyện ưu tiên số
//   ba chữ số nhưng KHÔNG loại số nhỏ: hiệu nhỏ (302 − 298), số chưa biết nhỏ (? + 245 = 250),
//   tổng bằng 1000 đều có.
// - Đáp án nhiễu = mô phỏng lỗi có quy tắc (quên nhớ, trừ số bé cho số lớn từng hàng, nhầm
//   phép tính, đặt tính lệch hàng, chép số đã cho…). Mọi lựa chọn số nằm trong 0–1000.
//   Không đủ 3 nhiễu hợp lệ → mẫu từ chối bộ tham số đó (build trả null), bộ chọn câu sinh lại.
// - Đọc số: dùng cách đọc chuẩn "linh", "mốt", "lăm", "một nghìn". Nhiễu là cách đọc chuẩn
//   của MỘT SỐ KHÁC (do lỗi viết số), nên biến thể hợp lệ (lẻ, ngàn, nhăm…) không bao giờ là
//   đáp án sai. Số có cách đọc chưa chốt (… mươi tư/bốn, linh tư/bốn) chưa đưa vào câu đọc/viết.
// =============================================

const GenB13 = {
  VERSION: 1,
  PREFIX: 'toan_g13',
  MAX: 1000,
  SOURCE: 'gen-b1b3-v1',
  BOOK: 'kntt-toan3',

  // ---------- tiện ích (cùng thuật toán với TableGen) ----------
  _hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  },
  _rng(seedStr) {
    let h = this._hash(String(seedStr));
    return () => {
      h += 0x6D2B79F5; let t = h;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },
  _int(r, lo, hi) { return lo + Math.floor(r() * (hi - lo + 1)); },
  _ok(v) { return Number.isInteger(v) && v >= 0 && v <= this.MAX; },
  /** Hiển thị số như sách: 1000 viết "1 000". */
  fmt(n) { return n >= 1000 ? String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : String(n); },
  _dig(n) { return String(n).split('').reverse().map(Number); },   // [đơn vị, chục, trăm, nghìn]
  _num(ds) { let v = 0; for (let i = ds.length - 1; i >= 0; i--) v = v * 10 + ds[i]; return v; },

  // ---------- đọc số ----------
  UNITS: ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'],
  read(n) {
    if (!this._ok(n)) throw new Error('read: ngoài phạm vi ' + n);
    if (n === 1000) return 'một nghìn';
    if (n < 10) return this.UNITS[n];
    const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, u = n % 10, U = this.UNITS;
    let two;
    if (t === 0) two = u === 0 ? '' : 'linh ' + U[u];
    else if (t === 1) two = 'mười' + (u === 0 ? '' : ' ' + (u === 5 ? 'lăm' : U[u]));
    else two = U[t] + ' mươi' + (u === 0 ? '' : ' ' + (u === 1 ? 'mốt' : u === 5 ? 'lăm' : U[u]));
    return h === 0 ? two : U[h] + ' trăm' + (two ? ' ' + two : '');
  },
  /** Cách đọc chưa chốt theo sách (tư/bốn): không dùng trong câu đọc/viết số cho tới khi Nam đối chiếu. */
  uncertainReading(n) {
    if (n >= 1000 || n < 10) return false;
    const h = Math.floor(n / 100), t = Math.floor(n / 10) % 10, u = n % 10;
    return u === 4 && (t >= 2 || (t === 0 && h >= 1));
  },

  // ---------- mô phỏng lỗi (trả số hoặc null) ----------
  ERR: {
    // lỗi viết / đọc số
    swapTU(n) { const d = GenB13._dig(n); if (d.length < 2) return null; [d[0], d[1]] = [d[1], d[0]]; return GenB13._num(d); },
    swapHT(n) { const d = GenB13._dig(n); if (d.length !== 3) return null; [d[1], d[2]] = [d[2], d[1]]; return d[2] === 0 ? null : GenB13._num(d); },
    reverse(n) { const s = String(n); if (s.length < 2) return null; return Number(s.split('').reverse().join('')); },
    dropZero(n) { const s = String(n); const i = s.indexOf('0', 1); return i < 0 ? null : Number(s.slice(0, i) + s.slice(i + 1)); },
    insertZero(n) { const s = String(n); return s.length === 2 ? Number(s[0] + '0' + s[1]) : null; },
    // lỗi cộng
    addNoCarry(a, b) {   // cộng từng hàng, bỏ nhớ
      const x = GenB13._dig(a), y = GenB13._dig(b), L = Math.max(x.length, y.length), out = [];
      for (let i = 0; i < L; i++) out.push(((x[i] || 0) + (y[i] || 0)) % 10);
      return GenB13._num(out);
    },
    addDropCarryAt(a, b, k) {   // cộng đúng, chỉ quên nhớ ở hàng k (k = 0 đơn vị, 1 chục, 2 trăm)
      const x = GenB13._dig(a), y = GenB13._dig(b), L = Math.max(x.length, y.length), out = [];
      let c = 0, hit = false;
      for (let i = 0; i < L; i++) {
        const s = (x[i] || 0) + (y[i] || 0) + c;
        out.push(s % 10); c = s >= 10 ? 1 : 0;
        if (i === k && c) { c = 0; hit = true; }
      }
      if (c) out.push(c);
      return hit ? GenB13._num(out) : null;
    },
    addExtraCarry(a, b) { // nhớ thừa 1 vào hàng kế bên của hàng thấp nhất KHÔNG có nhớ
      const x = GenB13._dig(a), y = GenB13._dig(b), L = Math.max(x.length, y.length);
      let c = 0;
      for (let i = 0; i < L - 1; i++) {
        const s = (x[i] || 0) + (y[i] || 0) + c;
        if (s < 10) return a + b + Math.pow(10, i + 1);
        c = 1;
      }
      return null;
    },
    addMisalign(a, b) {   // đặt số ngắn lệch sang trái một hàng
      const lo = Math.min(a, b), hi = Math.max(a, b);
      if (lo < 1 || String(lo).length >= String(hi).length) return null;
      return hi + lo * 10;
    },
    // lỗi trừ
    subAbsDigits(a, b) {  // mỗi hàng lấy số lớn trừ số bé
      const x = GenB13._dig(a), y = GenB13._dig(b), out = [];
      for (let i = 0; i < x.length; i++) out.push(Math.abs(x[i] - (y[i] || 0)));
      return GenB13._num(out);
    },
    subNoRepay(a, b) {    // có mượn 10 nhưng quên trả 1 ở hàng bên trái
      const x = GenB13._dig(a), y = GenB13._dig(b), out = [];
      for (let i = 0; i < x.length; i++) out.push((x[i] - (y[i] || 0) + 10) % 10);
      return GenB13._num(out);
    },
    subNoRepayAt(a, b, k) {     // trừ đúng, chỉ quên trả ở hàng bên trái của hàng k
      const x = GenB13._dig(a), y = GenB13._dig(b), out = [];
      let br = 0, hit = false;
      for (let i = 0; i < x.length; i++) {
        let d = x[i] - (y[i] || 0) - br;
        br = d < 0 ? 1 : 0; if (d < 0) d += 10;
        out.push(d);
        if (i === k && br) { br = 0; hit = true; }
      }
      return hit ? GenB13._num(out) : null;
    },
    subExtraBorrow(a, b) { // trả 1 thừa ở hàng kế bên của hàng thấp nhất KHÔNG mượn
      const x = GenB13._dig(a), y = GenB13._dig(b);
      let br = 0;
      for (let i = 0; i < x.length - 1; i++) {
        const d = x[i] - (y[i] || 0) - br;
        if (d >= 0) { const v = a - b - Math.pow(10, i + 1); return v >= 0 ? v : null; }
        br = 1;
      }
      return null;
    },
    subMisalign(a, b) {   // số trừ ngắn hơn bị đặt lệch sang trái một hàng
      if (b < 1 || String(b).length >= String(a).length) return null;
      const v = a - b * 10; return v >= 0 ? v : null;
    }
  },
  carries(a, b) {
    const x = this._dig(a), y = this._dig(b); let c = 0, n = 0;
    for (let i = 0; i < Math.max(x.length, y.length); i++) { c = ((x[i] || 0) + (y[i] || 0) + c) >= 10 ? 1 : 0; n += c; }
    return n;
  },
  borrows(a, b) {
    const x = this._dig(a), y = this._dig(b); let br = 0, n = 0;
    for (let i = 0; i < x.length; i++) { br = (x[i] - (y[i] || 0) - br) < 0 ? 1 : 0; n += br; }
    return n;
  },

  /** Lấy 3 nhiễu đầu tiên hợp lệ theo thứ tự ưu tiên. cands: [[giá trị, tên lỗi], ...] */
  _pick3(ans, cands, valid) {
    const out = [], why = [];
    for (const [v, name] of cands) {
      if (v == null || v === ans || out.includes(v)) continue;
      if (valid ? !valid(v) : !this._ok(v)) continue;
      out.push(v); why.push(name);
      if (out.length === 3) break;
    }
    this._lastWhy = why;                 // chỉ để explain() in tên lỗi cho người rà, không vào câu hỏi
    return out.length === 3 ? out : null;
  },
  /** Lỗi cộng theo thứ tự ưu tiên; quên nhớ sang hàng nghìn để cuối cùng. */
  _addErrs(a, b) {
    const E = this.ERR, L = Math.max(String(a).length, String(b).length);
    const out = [[E.addNoCarry(a, b), 'quên nhớ']];
    for (let k = 0; k < L - 1; k++) out.push([E.addDropCarryAt(a, b, k), 'quên nhớ ở một hàng']);
    out.push([E.addExtraCarry(a, b), 'nhớ thừa'], [E.addMisalign(a, b), 'đặt tính lệch hàng'], [Math.abs(a - b), 'nhầm phép trừ'],
             [E.addDropCarryAt(a, b, L - 1), 'quên viết chữ số nhớ ở hàng cao nhất']);
    return out.concat(this._offByPlace(a + b));
  },
  _subErrs(a, b) {
    const E = this.ERR, out = [[E.subAbsDigits(a, b), 'trừ số bé cho số lớn từng hàng'], [E.subNoRepay(a, b), 'quên trả khi mượn']];
    for (let k = 0; k < String(a).length - 1; k++) out.push([E.subNoRepayAt(a, b, k), 'quên trả ở một hàng']);
    out.push([E.subExtraBorrow(a, b), 'trả thừa'], [a + b, 'nhầm phép cộng'], [E.subMisalign(a, b), 'đặt tính lệch hàng']);
    return out.concat(this._offByPlace(a - b));
  },
  /** Dự phòng cuối cùng (ưu tiên thấp nhất): tính sai đúng 1 ở hàng chục hoặc hàng trăm. */
  _offByPlace(v) { return [[v - 10, 'sai 1 ở hàng chục'], [v + 10, 'sai 1 ở hàng chục'], [v - 100, 'sai 1 ở hàng trăm'], [v + 100, 'sai 1 ở hàng trăm']]; },
  _numErrs(n) {
    const E = this.ERR;
    return [[E.swapTU(n), 'đảo hàng chục – đơn vị'], [E.dropZero(n), 'bỏ sót chữ số 0'], [E.reverse(n), 'viết ngược'],
            [E.insertZero(n), 'viết thừa chữ số 0'], [E.swapHT(n), 'đảo hàng trăm – chục'], [n * 10, 'thừa một hàng'],
            [n >= 100 ? Math.floor(n / 10) : null, 'thiếu chữ số cuối']];
  },
  _decomp(n) {
    const d = this._dig(n), parts = [];
    for (let i = d.length - 1; i >= 0; i--) if (d[i]) parts.push(String(d[i] * Math.pow(10, i)));
    return parts;
  },

  // ---------- các mẫu ----------
  // gen(r): sinh bộ tham số; build(p): dựng câu hoặc null. lesson: số bài SGK.
  T: {
    // B1 — đọc số
    doc: {
      skill: 'read-1000', lesson: 1, n: 1,
      gen(r) { return [GenB13._pickNum(r, 10, 1000)]; },
      build([n]) {
        if (n < 10 || GenB13.uncertainReading(n)) return null;
        const ds = GenB13._pick3(n, GenB13._numErrs(n), v => GenB13._ok(v) && v >= 10 && !GenB13.uncertainReading(v));
        if (!ds) return null;
        return { q: 'Số ' + GenB13.fmt(n) + ' đọc là:', ans: GenB13.read(n), wrong: ds.map(v => GenB13.read(v)),
          hint: 'Đọc lần lượt hàng trăm, hàng chục, hàng đơn vị. Hàng chục là 0 thì đọc «linh».',
          difficulty: n < 100 ? 1 : (String(n).includes('0') ? 3 : 2) };
      }
    },
    // B1 — viết số từ cách đọc
    viet: {
      skill: 'write-1000', lesson: 1, n: 1,
      gen(r) { return [GenB13._pickNum(r, 10, 1000)]; },
      build([n]) {
        if (n < 10 || GenB13.uncertainReading(n)) return null;
        const ds = GenB13._pick3(n, GenB13._numErrs(n), v => GenB13._ok(v) && v >= 10);
        if (!ds) return null;
        return { q: 'Số «' + GenB13.read(n) + '» viết là:', ans: GenB13.fmt(n), wrong: ds.map(v => GenB13.fmt(v)),
          hint: 'Viết từ hàng trăm đến hàng đơn vị. «linh» nghĩa là hàng chục là chữ số 0.',
          difficulty: n < 100 ? 1 : (String(n).includes('0') ? 3 : 2) };
      }
    },
    // B1 — cấu tạo số: "Số gồm 7 trăm, 0 chục và 6 đơn vị"
    gom: {
      skill: 'place-value-1000', lesson: 1, n: 1,
      gen(r) { return [GenB13._pickNum(r, 10, 999)]; },
      build([n]) {
        if (n < 10 || n > 999) return null;
        const d = GenB13._dig(n);
        const txt = d.length === 3 ? d[2] + ' trăm, ' + d[1] + ' chục và ' + d[0] + ' đơn vị' : d[1] + ' chục và ' + d[0] + ' đơn vị';
        const ds = GenB13._pick3(n, GenB13._numErrs(n));
        if (!ds) return null;
        return { q: 'Số gồm ' + txt + ' là:', ans: GenB13.fmt(n), wrong: ds.map(v => GenB13.fmt(v)),
          hint: 'Viết chữ số hàng trăm, rồi hàng chục, rồi hàng đơn vị. Hàng nào có 0 thì viết chữ số 0.',
          difficulty: n < 100 ? 1 : (d.includes(0) ? 3 : 2) };
      }
    },
    // B1 — viết số thành tổng
    tong: {
      skill: 'place-value-1000', lesson: 1, n: 1,
      gen(r) { return [GenB13._pickNum(r, 10, 999)]; },
      build([n]) {
        if (n < 10 || n > 999) return null;
        const parts = GenB13._decomp(n);
        if (parts.length < 2) return null;                 // 700, 40: chỉ một số hạng, không cần tách
        const ans = parts.join(' + ');
        const cand = [];
        GenB13._numErrs(n).forEach(([v]) => { if (v != null && GenB13._ok(v) && v <= 999 && GenB13._decomp(v).length >= 2) cand.push(GenB13._decomp(v).join(' + ')); });
        cand.splice(1, 0, String(n).split('').join(' + '));  // chỉ cộng các chữ số (bỏ giá trị hàng)
        const wrong = [];
        cand.forEach(s => { if (s !== ans && !wrong.includes(s) && wrong.length < 3) wrong.push(s); });
        if (wrong.length < 3) return null;
        return { q: 'Viết số ' + GenB13.fmt(n) + ' thành tổng các trăm, chục, đơn vị:', ans, wrong,
          hint: 'Mỗi chữ số có giá trị theo hàng: chữ số hàng trăm có giá trị mấy trăm, hàng chục mấy chục.',
          difficulty: n < 100 ? 1 : 2 };
      }
    },
    // B1 — gộp tổng thành số: "500 + 30 + 2 = ?"
    gop: {
      skill: 'place-value-1000', lesson: 1, n: 1,
      gen(r) { return [GenB13._pickNum(r, 10, 999)]; },
      build([n]) {
        if (n < 10 || n > 999) return null;
        const parts = GenB13._decomp(n);
        if (parts.length < 2) return null;
        const ds = GenB13._pick3(n, GenB13._numErrs(n));
        if (!ds) return null;
        return { q: parts.join(' + ') + ' = ?', ans: GenB13.fmt(n), wrong: ds.map(v => GenB13.fmt(v)),
          hint: 'Mấy trăm, mấy chục, mấy đơn vị? Viết lần lượt từng chữ số, hàng nào không có thì viết 0.',
          difficulty: GenB13._dig(n).includes(0) ? 2 : 1 };
      }
    },
    // B1 — điền dấu
    dau: {
      skill: 'compare-1000', lesson: 1, n: 2, keepOrder: true,
      gen(r) { return GenB13._pickPair(r); },
      build([a, b]) {
        const ans = a > b ? '>' : a < b ? '<' : '=';
        return { q: 'Điền dấu thích hợp: ' + GenB13.fmt(a) + ' … ' + GenB13.fmt(b), ans, wrong: ['>', '<', '='].filter(x => x !== ans),
          fixed: ['>', '<', '='],
          hint: 'Số nào nhiều chữ số hơn thì lớn hơn. Cùng số chữ số thì so sánh từ hàng trăm.',
          difficulty: String(a).length !== String(b).length ? 1 : (a === b ? 2 : (String(a)[0] === String(b)[0] ? 3 : 2)) };
      }
    },
    // B1 — số lớn nhất / bé nhất trong 4 số
    max: {
      skill: 'compare-1000', lesson: 1, n: 4,
      gen(r) { return GenB13._pickFour(r); },
      build(p) { return GenB13._extreme(p, true); }
    },
    min: {
      skill: 'compare-1000', lesson: 1, n: 4,
      gen(r) { return GenB13._pickFour(r); },
      build(p) { return GenB13._extreme(p, false); }
    },
    // B1 — sắp xếp
    xeptang: {
      skill: 'compare-1000', lesson: 1, n: 4,
      gen(r) { return GenB13._pickFour(r); },
      build(p) { return GenB13._order(p, true); }
    },
    xepgiam: {
      skill: 'compare-1000', lesson: 1, n: 4,
      gen(r) { return GenB13._pickFour(r); },
      build(p) { return GenB13._order(p, false); }
    },
    // B1 — liền sau / liền trước
    sau: {
      skill: 'sequence-1000', lesson: 1, n: 1,
      gen(r) { return [r() < 0.25 ? GenB13._edge(r, [0, 9, 99, 199, 299, 499, 699, 999, 109, 590]) : GenB13._pickNum(r, 0, 999)]; },
      build([n]) {
        if (n > 999) return null;
        const ans = n + 1, E = GenB13.ERR;
        const ds = GenB13._pick3(ans, [[n - 1, 'nhầm liền trước'], [E.addNoCarry(n, 1), 'quên nhớ'], [n + 10, 'nhầm hàng chục'], [n + 100, 'nhầm hàng trăm'], [n, 'chép số đã cho']]);
        if (!ds) return null;
        return { q: 'Số liền sau của ' + GenB13.fmt(n) + ' là:', ans: GenB13.fmt(ans), wrong: ds.map(v => GenB13.fmt(v)),
          hint: 'Số liền sau hơn số đã cho 1 đơn vị.', difficulty: n % 10 === 9 ? 2 : 1 };
      }
    },
    truoc: {
      skill: 'sequence-1000', lesson: 1, n: 1,
      gen(r) { return [r() < 0.25 ? GenB13._edge(r, [1, 10, 100, 200, 500, 700, 1000, 110, 301, 910]) : GenB13._pickNum(r, 1, 1000)]; },
      build([n]) {
        if (n < 1) return null;
        const ans = n - 1, E = GenB13.ERR;
        const ds = GenB13._pick3(ans, [[n + 1, 'nhầm liền sau'], [E.subNoRepay(n, 1), 'quên trả khi mượn'], [n - 10, 'nhầm hàng chục'], [n - 100, 'nhầm hàng trăm'], [n, 'chép số đã cho']]);
        if (!ds) return null;
        return { q: 'Số liền trước của ' + GenB13.fmt(n) + ' là:', ans: GenB13.fmt(ans), wrong: ds.map(v => GenB13.fmt(v)),
          hint: 'Số liền trước kém số đã cho 1 đơn vị.', difficulty: n % 10 === 0 ? 2 : 1 };
      }
    },
    // B2 — cộng
    cong: {
      skill: 'add-1000', lesson: 2, n: 2,
      gen(r) {
        const a = GenB13._pickNum(r, 0, 1000);
        if (a >= 1000) { const x = GenB13._int(r, 1, 999); return [x, 1000 - x]; }       // tổng đúng bằng 1000
        const b = GenB13._pickNum(r, 0, 1000 - a);
        return r() < 0.5 ? [a, b] : [b, a];
      },
      build([a, b]) {
        const ans = a + b, E = GenB13.ERR;
        if (!GenB13._ok(ans)) return null;
        const ds = GenB13._pick3(ans, GenB13._addErrs(a, b));
        if (!ds) return null;
        const c = GenB13.carries(a, b);
        return { q: GenB13.fmt(a) + ' + ' + GenB13.fmt(b) + ' = ?', ans: GenB13.fmt(ans), wrong: ds.map(v => GenB13.fmt(v)),
          hint: 'Đặt tính thẳng hàng (đơn vị dưới đơn vị). Cộng từ hàng đơn vị; được 10 trở lên thì nhớ 1 sang hàng bên trái.',
          difficulty: c === 0 ? 1 : c === 1 ? 2 : 3 };
      }
    },
    // B2 — trừ
    tru: {
      skill: 'sub-1000', lesson: 2, n: 2,
      gen(r) {
        const a = GenB13._pickNum(r, 1, 1000);
        if (r() < 0.25) { const d = r() < 0.5 ? GenB13._int(r, 1, 9) : GenB13._int(r, 10, 60); return [a, Math.max(0, a - d)]; }  // hiệu nhỏ: 302 − 298
        return [a, GenB13._pickNum(r, 0, a)];
      },
      build([a, b]) {
        if (b > a || a > 1000) return null;
        const ans = a - b, E = GenB13.ERR;
        const ds = GenB13._pick3(ans, GenB13._subErrs(a, b));
        if (!ds) return null;
        const k = GenB13.borrows(a, b), zero = GenB13._dig(a).slice(0, -1).includes(0) && k > 0;
        return { q: GenB13.fmt(a) + ' − ' + GenB13.fmt(b) + ' = ?', ans: GenB13.fmt(ans), wrong: ds.map(v => GenB13.fmt(v)),
          hint: 'Đặt tính thẳng hàng rồi trừ từ hàng đơn vị. Chữ số trên bé hơn thì mượn 1 chục (hoặc 1 trăm) và nhớ trả ở hàng bên trái.',
          difficulty: k === 0 ? 1 : (k >= 2 || zero) ? 3 : 2 };
      }
    },
    // B3 — tìm số hạng: "? + b = c" (f=0) hoặc "a + ? = c" (f=1)
    timsh: {
      skill: 'find-addend', lesson: 3, n: 3,
      gen(r) {
        const c = GenB13._pickNum(r, 1, 1000);
        const x = r() < 0.3 ? GenB13._int(r, 0, Math.min(c, 20)) : GenB13._pickNum(r, 0, c);   // số chưa biết có thể nhỏ
        return [r() < 0.5 ? 0 : 1, c - x, c];
      },
      build([f, k, c]) {
        if (f > 1 || k > c || c > 1000) return null;
        const ans = c - k, E = GenB13.ERR;
        const ds = GenB13._pick3(ans, [[c + k, 'nhầm phép cộng']].concat(GenB13._subErrs(c, k).filter(e => e[1] !== 'nhầm phép cộng'), [[c, 'chép tổng'], [k, 'chép số hạng đã biết']]));
        if (!ds) return null;
        const q = f === 0 ? '? + ' + GenB13.fmt(k) + ' = ' + GenB13.fmt(c) : GenB13.fmt(k) + ' + ? = ' + GenB13.fmt(c);
        return { q: 'Tìm số thích hợp: ' + q, ans: GenB13.fmt(ans), wrong: ds.map(v => GenB13.fmt(v)),
          hint: 'Muốn tìm số hạng chưa biết, ta lấy tổng trừ đi số hạng đã biết.', difficulty: GenB13.borrows(c, k) ? 2 : 1 };
      }
    },
    // B3 — tìm số bị trừ: "? − b = c"
    timsbt: {
      skill: 'find-minuend', lesson: 3, n: 2,
      gen(r) {
        const s = GenB13._pickNum(r, 1, 1000);          // số bị trừ (đáp án)
        const b = r() < 0.3 ? GenB13._int(r, 0, Math.min(s, 20)) : GenB13._pickNum(r, 0, s);
        return [b, s - b];
      },
      build([b, c]) {
        const ans = b + c, E = GenB13.ERR;
        if (!GenB13._ok(ans)) return null;
        const ds = GenB13._pick3(ans, [[Math.abs(c - b), 'nhầm phép trừ']].concat(GenB13._addErrs(c, b).filter(e => e[1] !== 'nhầm phép trừ'), [[c, 'chép hiệu'], [b, 'chép số trừ']]));
        if (!ds) return null;
        return { q: 'Tìm số thích hợp: ? − ' + GenB13.fmt(b) + ' = ' + GenB13.fmt(c), ans: GenB13.fmt(ans), wrong: ds.map(v => GenB13.fmt(v)),
          hint: 'Muốn tìm số bị trừ, ta lấy hiệu cộng với số trừ.', difficulty: GenB13.carries(c, b) ? 2 : 1 };
      }
    },
    // B3 — tìm số trừ: "a − ? = c"
    timst: {
      skill: 'find-subtrahend', lesson: 3, n: 2,
      gen(r) {
        const a = GenB13._pickNum(r, 1, 1000);
        const x = r() < 0.3 ? GenB13._int(r, 0, Math.min(a, 20)) : GenB13._pickNum(r, 0, a);
        return [a, a - x];
      },
      build([a, c]) {
        if (c > a || a > 1000) return null;
        const ans = a - c, E = GenB13.ERR;
        const ds = GenB13._pick3(ans, [[a + c, 'nhầm phép cộng']].concat(GenB13._subErrs(a, c).filter(e => e[1] !== 'nhầm phép cộng'), [[c, 'chép hiệu'], [a, 'chép số bị trừ']]));
        if (!ds) return null;
        return { q: 'Tìm số thích hợp: ' + GenB13.fmt(a) + ' − ? = ' + GenB13.fmt(c), ans: GenB13.fmt(ans), wrong: ds.map(v => GenB13.fmt(v)),
          hint: 'Muốn tìm số trừ, ta lấy số bị trừ trừ đi hiệu.', difficulty: GenB13.borrows(a, c) ? 2 : 1 };
      }
    },
    // B2 — bài toán một bước (cộng, trừ). Tham số: [khung, x, y, bối cảnh, đồ vật, bên A, bên B]
    // Phạm vi số theo bối cảnh: đồ dùng của một bé thì số nhỏ; số ba chữ số dùng thư viện, cửa hàng, trang trại.
    // Ca biên thuần tính (999 + 1, 1000 − 1, hiệu rất nhỏ) để ở mẫu cong / tru, không ép vào lời văn.
    lv: {
      skill: 'word-1step-addsub', lesson: 2, n: 7,
      gen(r) {
        const f = GenB13._int(r, 0, GenB13.FRAMES.length - 1), op = GenB13.FRAMES[f].op;
        const s = r() < 0.4 ? 0 : GenB13._int(r, 1, GenB13.SCENES.length - 1), S = GenB13.SCENES[s];
        let x, y;
        if (S.small) {
          x = GenB13._int(r, 10, S.xMax);
          y = op > 0 ? GenB13._int(r, 1, Math.min(S.yMax, S.ansMax - x)) : GenB13._int(r, 1, Math.min(S.yMax, x - 1));
        } else if (op > 0) { x = GenB13._int(r, 100, 950); y = GenB13._pickNum(r, 1, 1000 - x); }
        else { x = GenB13._pickNum(r, 101, 1000); y = GenB13._pickNum(r, 1, x - 1); }
        const A = GenB13._int(r, 0, S.parties.length - 1);
        let B = GenB13._int(r, 0, S.parties.length - 2); if (B >= A) B++;
        return [f, x, y, s, GenB13._int(r, 0, S.items.length - 1), A, B];
      },
      build([f, x, y, s, it, A, B]) {
        const F = GenB13.FRAMES[f], S = GenB13.SCENES[s];
        if (!F || !S || it >= S.items.length || A >= S.parties.length || B >= S.parties.length || A === B || x < 1 || y < 1) return null;
        const ans = x + F.op * y, E = GenB13.ERR;
        if (ans < 1 || ans > 1000) return null;
        if (S.small ? (x > S.xMax || y > S.yMax || ans > S.ansMax) : x < 100) return null;   // số phải hợp bối cảnh
        // nhiễu đầu tiên: dùng phép tính ngược lại (lỗi hay gặp nhất ở bài có lời văn)
        const errs = F.op > 0
          ? [[x - y, 'nhầm phép trừ']].concat(GenB13._addErrs(x, y))
          : [[x + y, 'nhầm phép cộng']].concat(GenB13._subErrs(x, y));
        const ds = GenB13._pick3(ans, errs);
        if (!ds) return null;
        const fill = t => t.replace(/\{A\}/g, S.parties[A]).replace(/\{B\}/g, S.parties[B]).replace(/\{x\}/g, GenB13.fmt(x))
          .replace(/\{y\}/g, GenB13.fmt(y)).replace(/\{i\}/g, S.items[it]).replace(/\{add\}/g, S.add).replace(/\{sub\}/g, S.sub);
        return { q: fill(F.text), ans: GenB13.fmt(ans), wrong: ds.map(v => GenB13.fmt(v)), hint: fill(F.hint), difficulty: F.trap ? 3 : 2 };
      }
    }
  },

  // Khung lời văn: op +1 cộng, −1 trừ. trap: câu "A ít hơn B" mà hỏi B (bẫy đảo chiều).
  FRAMES: [
    { key: 'them', op: 1, text: '{A} có {x} {i}. {A} {add} {y} {i}. Hỏi {A} có tất cả bao nhiêu {i}?',
      hint: 'Có thêm thì số lượng nhiều lên hay ít đi? Chọn phép tính phù hợp.' },
    { key: 'bot', op: -1, text: '{A} có {x} {i}. {A} {sub} {y} {i}. Hỏi {A} còn lại bao nhiêu {i}?',
      hint: 'Bớt đi thì số lượng nhiều lên hay ít đi? Chọn phép tính phù hợp.' },
    { key: 'nhieu', op: 1, text: '{A} có {x} {i}. {B} có nhiều hơn {A} {y} {i}. Hỏi {B} có bao nhiêu {i}?',
      hint: 'Ai có nhiều hơn? Số của {B} lớn hơn hay bé hơn số của {A}?' },
    { key: 'it', op: -1, text: '{A} có {x} {i}. {B} có ít hơn {A} {y} {i}. Hỏi {B} có bao nhiêu {i}?',
      hint: 'Ai có ít hơn? Số của {B} lớn hơn hay bé hơn số của {A}?' },
    { key: 'aItB', op: 1, trap: true, text: '{A} có {x} {i}, {A} có ít hơn {B} {y} {i}. Hỏi {B} có bao nhiêu {i}?',
      hint: 'Đọc kĩ: {A} ít hơn {B}, vậy {B} có nhiều hơn hay ít hơn {A}?' },
    { key: 'aNhieuB', op: -1, trap: true, text: '{A} có {x} {i}, {A} có nhiều hơn {B} {y} {i}. Hỏi {B} có bao nhiêu {i}?',
      hint: 'Đọc kĩ: {A} nhiều hơn {B}, vậy {B} có nhiều hơn hay ít hơn {A}?' }
  ],
  // Bối cảnh: small = đồ dùng của một bé (x ≤ 99, thêm/bớt ≤ 60, kết quả ≤ 150); còn lại số bị trừ / số ban đầu ≥ 100.
  SCENES: [
    { key: 'ca-nhan', small: true, xMax: 99, yMax: 60, ansMax: 150,
      parties: ['Lan', 'Mai', 'Hoa', 'Nam', 'Minh', 'An', 'Bình', 'Hà'],
      items: ['quyển vở', 'nhãn vở', 'viên bi', 'bông hoa', 'que tính', 'tờ giấy màu', 'hạt cườm'],
      add: 'được mẹ cho thêm', sub: 'cho bạn' },
    { key: 'thu-vien', parties: ['Thư viện Hoa Sen', 'Thư viện Hoa Mai'], items: ['quyển sách', 'quyển truyện'],
      add: 'mua thêm', sub: 'cho mượn' },
    { key: 'cua-hang', parties: ['Cửa hàng Bình An', 'Cửa hàng Hòa Bình'], items: ['ki-lô-gam gạo', 'quả trứng'],
      add: 'nhập thêm', sub: 'đã bán' },
    { key: 'trang-trai', parties: ['Trang trại nhà Tú', 'Trang trại nhà Hùng'], items: ['con gà', 'con vịt'],
      add: 'mua thêm', sub: 'đã bán' }
  ],

  // Tỉ trọng khi bốc câu: cộng, trừ, lời văn gấp đôi; bốn mẫu so sánh nhiều số chia nhau một suất.
  WEIGHT: { cong: 2, tru: 2, lv: 2, max: 0.5, min: 0.5, xeptang: 0.5, xepgiam: 0.5 },

  // ---------- chọn số khi luyện (ưu tiên ba chữ số, vẫn có số nhỏ và biên) ----------
  _pickNum(r, lo, hi) {
    if (hi <= lo) return lo;
    const x = r();
    let v;
    if (x < 0.08) {                                      // biên
      const edges = [0, 1, 9, 10, 99, 100, 101, 110, 500, 909, 990, 999, 1000].filter(e => e >= lo && e <= hi);
      v = edges.length ? edges[Math.floor(r() * edges.length)] : this._int(r, lo, hi);
    } else if (x < 0.13) v = this._int(r, Math.max(lo, 0), Math.min(hi, 9));          // một chữ số
    else if (x < 0.30) v = this._int(r, Math.max(lo, 10), Math.min(hi, 99));         // hai chữ số
    else {                                               // ba chữ số; 30% có chữ số 0
      v = this._int(r, Math.max(lo, 100), Math.min(hi, 999));
      if (v >= 100 && r() < 0.3) { const s = String(v).split(''); s[r() < 0.5 ? 1 : 2] = '0'; v = Number(s.join('')); }
    }
    return Math.min(hi, Math.max(lo, v));
  },
  _edge(r, list) { return list[Math.floor(r() * list.length)]; },
  _pickPair(r) {
    const k = r();
    const a = this._pickNum(r, 10, 1000);
    if (k < 0.12) return [a, a];                                           // bằng nhau
    if (k < 0.40 && a >= 100 && a < 1000) { const v = this.ERR.swapTU(a); if (v !== a && this._ok(v)) return r() < 0.5 ? [a, v] : [v, a]; }  // cùng chữ số
    if (k < 0.60) { const b = Math.max(0, Math.floor(a / 10)) + (r() < 0.5 ? 0 : this._int(r, 0, 9)); return r() < 0.5 ? [a, b] : [b, a]; }   // khác số chữ số
    const b = Math.min(1000, a + (r() < 0.5 ? -1 : 1) * [1, 10, 100][this._int(r, 0, 2)]);
    return r() < 0.5 ? [a, Math.max(0, b)] : [Math.max(0, b), a];          // hơn kém nhau ở một hàng
  },
  _pickFour(r) {
    const base = this._int(r, 102, 987);
    const d = String(base).split('');
    const set = new Set();
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    for (const p of this._shuf(perms, r)) { const v = Number(p.map(i => d[i]).join('')); if (v >= 100) set.add(v); }
    if (r() < 0.4) set.add(Number(d[1] + d[2]));                         // thêm một số hai chữ số
    let k = 1; while (set.size < 4) { set.add(Math.min(999, base + k * 10)); k++; }
    return this._shuf([...set], r).slice(0, 4);
  },
  _shuf(arr, r) { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },

  _extreme(p, isMax) {
    if (new Set(p).size !== 4) return null;
    const ans = isMax ? Math.max(...p) : Math.min(...p);
    return { q: 'Số ' + (isMax ? 'lớn nhất' : 'bé nhất') + ' trong các số ' + p.map(v => this.fmt(v)).join('; ') + ' là:',
      ans: this.fmt(ans), wrong: p.filter(v => v !== ans).map(v => this.fmt(v)),
      hint: 'So sánh số chữ số trước, rồi so sánh từ hàng trăm đến hàng đơn vị.', difficulty: p.every(v => v >= 100) ? 2 : 1 };
  },
  _order(p, asc) {
    if (new Set(p).size !== 4) return null;
    const show = arr => arr.map(v => this.fmt(v)).join('; ');
    const cmp = asc ? (x, y) => x - y : (x, y) => y - x;
    const right = p.slice().sort(cmp);
    const units = (x, y) => (x % 10) - (y % 10) || (Math.floor(x / 10) % 10) - (Math.floor(y / 10) % 10) || x - y;
    const cands = [
      p.slice().sort((x, y) => -cmp(x, y)),                                        // đảo chiều
      p.slice().sort((x, y) => asc ? units(x, y) : units(y, x)),                   // so từ hàng đơn vị
      p.slice().sort((x, y) => asc ? (String(x) < String(y) ? -1 : 1) : (String(x) < String(y) ? 1 : -1)),  // chỉ nhìn chữ số đầu
    ];
    // đổi chỗ hai số liền nhau khó phân biệt nhất (hơn kém ít nhất)
    let bi = 0; for (let i = 1; i < 3; i++) if (Math.abs(right[i + 1] - right[i]) < Math.abs(right[bi + 1] - right[bi])) bi = i;
    const sw = right.slice(); [sw[bi], sw[bi + 1]] = [sw[bi + 1], sw[bi]]; cands.push(sw);
    const ans = show(right), wrong = [];
    cands.map(show).forEach(s => { if (s !== ans && !wrong.includes(s) && wrong.length < 3) wrong.push(s); });
    if (wrong.length < 3) return null;
    return { q: 'Các số ' + show(p) + ' xếp theo thứ tự từ ' + (asc ? 'bé đến lớn' : 'lớn đến bé') + ' là:', ans, wrong,
      hint: 'Tìm số bé nhất (hoặc lớn nhất) trước, rồi tìm tiếp trong các số còn lại.', difficulty: 2 };
  },

  // ---------- id ----------
  id(tpl, params) { return this.PREFIX + '_' + tpl + '_v' + this.VERSION + '_' + params.join('-'); },
  /** Bảng mẫu theo phiên bản. KHÔNG sửa bảng của phiên bản đã phát hành — thêm phiên bản mới. */
  get T_BY_VER() { return { 1: this.T }; },
  parse(id) {
    const m = /^toan_g13_([a-zA-Z]+)_v([1-9]\d*)_(\d+(?:-\d+)*)$/.exec(String(id || ''));   // v01 bị từ chối
    if (!m) return null;
    const params = m[3].split('-').map(Number);
    if (m[3].split('-').some(s => s.length > 1 && s[0] === '0')) return null;   // không nhận số 0 đứng đầu: mỗi câu đúng một id
    return { tpl: m[1], ver: Number(m[2]), params };
  },

  /** Dựng lại câu từ id. Id sai, sai phiên bản, tham số ngoài phạm vi, không đủ nhiễu → null. */
  build(id) {
    const p = this.parse(id);
    const table = p && this.T_BY_VER[p.ver];
    if (!table || p.ver > this.VERSION) return null;
    const T = Object.prototype.hasOwnProperty.call(table, p.tpl) ? table[p.tpl] : null;
    if (!T || p.params.length !== T.n || !p.params.every(v => this._ok(v))) return null;
    this._lastWhy = null;
    const core = T.build.call(T, p.params);
    if (!core) return null;
    let choices, a;
    if (core.fixed) { choices = core.fixed.slice(); a = choices.indexOf(core.ans); }
    else {
      a = Math.floor(this._rng(id + '|a')() * 4);
      choices = core.wrong.slice(); choices.splice(a, 0, core.ans);
    }
    const q = {
      id, q: core.q, choices, a, hint: core.hint, difficulty: core.difficulty,
      skill: T.skill, track: 'core', stage: 1,
      lesson: { book: this.BOOK, vol: 1, no: T.lesson },
      source: this.SOURCE, unit: 'toan_g13',
      review: [{ by: 'claude', status: 'mau-kiem-thu', note: 'mẫu ' + p.tpl + ' v' + p.ver + ' qua tests/gen-b1b3.test.js; chưa ai rà câu cụ thể' }]
    };
    if (T.keepOrder) q.keepOrder = true;
    return q;
  },

  /** Cho người rà: câu + tên lỗi sinh ra từng nhiễu. CHỈ để rà mẫu — không dùng để kết luận bé mắc lỗi gì
   *  từ một lần chọn sai (một số nhiễu có thể do nhiều lỗi khác nhau sinh ra). */
  explain(id) {
    const q = this.build(id);
    if (!q) return null;
    const why = this._lastWhy;
    const wrong = q.choices.filter((_, i) => i !== q.a);
    return { q, why: why && why.length === 3 ? wrong.map(w => why[this._wrongOrder(q, w)]) : null };
  },
  _wrongOrder(q, w) {   // vị trí của nhiễu w trong danh sách nhiễu gốc (core.wrong)
    const core = q.choices.slice(); core.splice(q.a, 1); return core.indexOf(w);
  },

  /**
   * Chọn n câu (id khác nhau) theo seed cố định, luôn dùng VERSION hiện tại. Cùng seed → cùng danh sách.
   * opts.templates: chỉ lấy các tên mẫu CÓ THẬT trong danh sách (tên sai bị bỏ qua).
   * opts.maxLesson: không truyền (undefined) = không lọc; số nguyên ≥ 0 = chỉ mẫu có lesson ≤ maxLesson;
   *   giá trị khác (null, âm, số lẻ, chuỗi…) = không mở gì.
   * Không còn mẫu nào → trả [] để bên gọi dùng câu tĩnh.
   */
  pick(seed, n, opts) {
    opts = opts || {};
    if (!Number.isInteger(n) || n <= 0) return [];
    const r = this._rng('pick|' + seed);
    const TT = this.T_BY_VER[this.VERSION];                // câu mới luôn sinh theo phiên bản hiện tại
    const has = t => typeof t === 'string' && Object.prototype.hasOwnProperty.call(TT, t);
    let tpls = opts.templates === undefined ? Object.keys(TT) : (Array.isArray(opts.templates) ? opts.templates : []);
    tpls = [...new Set(tpls.filter(has))];
    if (opts.maxLesson !== undefined) {
      if (!Number.isInteger(opts.maxLesson) || opts.maxLesson < 0) return [];
      tpls = tpls.filter(t => TT[t].lesson <= opts.maxLesson);
    }
    if (!tpls.length) return [];
    const W = tpls.map(t => this.WEIGHT[t] || 1), sumW = W.reduce((x, y) => x + y, 0);
    const out = [], seen = new Set();
    let guard = 0;
    while (out.length < n && guard++ < n * 5) {
      let x = r() * sumW, k = 0; while (x >= W[k]) { x -= W[k]; k++; }
      const tpl = tpls[k], T = TT[tpl];
      for (let tries = 0; tries < 40; tries++) {          // giữ đúng mẫu đã chọn, chỉ sinh lại tham số
        const id = this.id(tpl, T.gen.call(T, r));
        if (seen.has(id)) continue;
        const q = this.build(id);
        if (!q) continue;
        seen.add(id); out.push(q); break;
      }
    }
    return out;
  }
};

if (typeof window !== 'undefined') window.GenB13 = GenB13;
if (typeof module !== 'undefined') module.exports = GenB13;
