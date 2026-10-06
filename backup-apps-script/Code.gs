/**
 * Vương Quốc Thỏ — SAO LƯU sao, sticker, ngọc rồng, tiến độ.
 *
 * Cài đặt (làm 1 lần):
 * 1. Tạo Google Sheet mới, đặt tên "Thỏ - sao lưu".
 * 2. Tiện ích mở rộng → Apps Script. Xoá hết code mẫu, dán toàn bộ file này, bấm Lưu.
 * 3. Triển khai → Tùy chọn triển khai mới → loại "Ứng dụng web".
 *    Thực thi với tư cách: Tôi. Người có quyền truy cập: Bất kỳ ai.
 * 4. Cấp quyền, rồi sao chép "URL ứng dụng web" (…/exec) gửi cho Claude.
 *
 * Mỗi bé 1 dòng ở trang "SaoLuu". Bản cũ trước mỗi lần ghi đè được chép sang trang "LichSu".
 *
 * Số phiên bản (ver): mỗi lần lưu thành công ver tăng 1 (lưu trong Thuộc tính tập lệnh, khoá "ver::<tên>").
 * Máy gửi kèm baseVer = phiên bản nó biết gần nhất. Nếu bản trên mạng đã đổi (ver khác baseVer) thì
 * từ chối với reason 'conflict' — kiểm tra NGAY TRONG ScriptLock nên không có kẽ hở giữa lúc đọc và lúc ghi.
 * GET cũng đọc dữ liệu + phiên bản trong ScriptLock, nên bản trả về và số phiên bản luôn khớp nhau.
 * Máy dùng bản web cũ (không gửi baseVer) vẫn theo luật cũ: không cho bản ít XP hơn ghi đè.
 *
 * MÃ GIA ĐÌNH — chỉ bảo vệ việc GHI ĐÈ (force). CHƯA phải đăng nhập: ai có URL …/exec vẫn ĐỌC được
 * và GHI THƯỜNG được (ghi thường vẫn bị chặn nếu bản trên mạng đã đổi — xem số phiên bản ở trên).
 *   Cài (1 lần): ⚙️ Cài đặt dự án → Thuộc tính tập lệnh → Thêm thuộc tính: tên FAMILY_CODE, giá trị = mã bố mẹ tự đặt
 *   (≥ 6 ký tự, khó đoán). Rồi nhập đúng mã đó ở web: Khu vực Bố Mẹ → Sao lưu → 🔑 Mã gia đình (mỗi máy 1 lần).
 *   - Chưa cài FAMILY_CODE → mọi lệnh ghi đè bị từ chối ('family-code-unset').
 *   - Sai mã → từ chối ('family-code-wrong'); sai 10 lần trong 1 giờ → khoá ghi đè 1 giờ ('family-code-locked').
 *   - Mã không bao giờ bị ghi vào Sheet, lịch sử hay log.
 *
 * SAU KHI SỬA FILE NÀY: Triển khai → Quản lý các bản triển khai → ✏️ → Phiên bản: "Phiên bản mới" → Triển khai
 * (giữ nguyên URL …/exec, không tạo bản triển khai mới).
 */
const SHEET = 'SaoLuu';
const HIST = 'LichSu';
const CHUNK = 45000;         // giới hạn 1 ô Google Sheet là 50 000 ký tự
const MAX_CHUNKS = 30;
const HIST_KEEP = 500;
const HEAD = ['key', 'tên', 'cập nhật', 'tiến độ', 'sao', 'sticker', 'ngọc rồng', 'dung lượng'];
const FIXED = HEAD.length;

function _sheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    sh.appendRow(HEAD.concat(['dữ liệu…']));
    sh.setFrozenRows(1);
  }
  return sh;
}

function _out(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function _key(k) {
  return String(k || '').trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 60);
}

function _findRow(sh, key) {
  const last = sh.getLastRow();
  if (last < 2) return -1;
  const keys = sh.getRange(2, 1, last - 1, 1).getValues();
  for (let i = 0; i < keys.length; i++) if (String(keys[i][0]) === key) return i + 2;
  return -1;
}

function _props() { return PropertiesService.getScriptProperties(); }

/** Phiên bản hiện tại. Dòng có từ trước khi có số phiên bản → coi là 1. */
function _getVer(key, rowExists) {
  const v = Number(_props().getProperty('ver::' + key));
  return v > 0 ? v : (rowExists ? 1 : 0);
}

function _setVer(key, v) { _props().setProperty('ver::' + key, String(v)); }

const FC_MAX_FAIL = 10;            // sai quá số lần này trong 1 giờ → khoá ghi đè
const FC_WINDOW_MS = 3600000;

/** Kiểm tra mã gia đình cho lệnh ghi đè. Gọi TRONG ScriptLock. Trả về '' nếu hợp lệ, hoặc lý do từ chối. */
function _checkFamilyCode(given) {
  const props = _props();
  const want = String(props.getProperty('FAMILY_CODE') || '');
  if (!want) return 'family-code-unset';
  const now = Date.now();
  let f = {};
  try { f = JSON.parse(props.getProperty('fc_fail') || '{}') || {}; } catch (err) { f = {}; }
  if (!f.since || now - f.since > FC_WINDOW_MS) f = { n: 0, since: now };
  if (f.n >= FC_MAX_FAIL) return 'family-code-locked';
  const g = String(given == null ? '' : given);
  // so sánh không dừng sớm theo ký tự
  let diff = g.length ^ want.length;
  for (let i = 0; i < Math.max(g.length, want.length); i++) diff |= (g.charCodeAt(i) || 0) ^ (want.charCodeAt(i) || 0);
  if (diff !== 0) {
    f.n++;
    props.setProperty('fc_fail', JSON.stringify(f));
    return f.n >= FC_MAX_FAIL ? 'family-code-locked' : 'family-code-wrong';
  }
  return '';
}

function _readRow(sh, row) {
  const width = Math.max(sh.getLastColumn(), FIXED + 1);
  const v = sh.getRange(row, 1, 1, width).getValues()[0];
  const data = v.slice(FIXED).filter(x => x !== '' && x !== null).map(x => String(x).slice(1)).join('');
  return {
    meta: { name: v[1], at: Number(new Date(v[2]).getTime()) || 0, p: Number(v[3]) || 0, stars: v[4], stickers: v[5], balls: v[6] },
    raw: v,
    data: data
  };
}

function doGet(e) {
  const p = (e && e.parameter) || {};
  if (p.action === 'ping') return _out({ ok: true, service: 'tho-backup' });
  if (p.action === 'get') {
    const key = _key(p.key);
    if (!key) return _out({ ok: false, error: 'no key' });
    // Đọc dữ liệu VÀ phiên bản trong cùng ScriptLock với lúc ghi: không bao giờ trả bản cũ kèm số phiên bản mới.
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
      const sh = _sheet(SHEET);
      const row = _findRow(sh, key);
      if (row < 0) return _out({ ok: true, found: false, ver: _getVer(key, false) });
      const r = _readRow(sh, row);
      const ver = _getVer(key, true);
      let snap = null;
      try { snap = JSON.parse(r.data); } catch (err) { return _out({ ok: false, error: 'bad data' }); }
      return _out({ ok: true, found: true, meta: r.meta, snapshot: snap, ver: ver });
    } finally {
      lock.releaseLock();
    }
  }
  return _out({ ok: false, error: 'unknown action' });
}

function doPost(e) {
  let body;
  try { body = JSON.parse(e.postData.contents); } catch (err) { return _out({ ok: false, error: 'bad json' }); }
  if (body.action !== 'save') return _out({ ok: false, error: 'unknown action' });

  const key = _key(body.key);
  const snap = body.snapshot;
  const meta = body.meta || {};
  if (!key || !snap) return _out({ ok: false, error: 'missing' });

  const text = JSON.stringify(snap);
  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK) chunks.push('~' + text.slice(i, i + CHUNK)); // '~' để Sheet không hiểu nhầm thành số/công thức
  if (chunks.length > MAX_CHUNKS) return _out({ ok: false, error: 'too big' });

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    // Ghi đè (force) phải có đúng mã gia đình — kiểm tra trước mọi thao tác ghi
    if (body.force) {
      const why = _checkFamilyCode(body.familyCode);
      if (why) return _out({ ok: false, reason: why });
    }
    const sh = _sheet(SHEET);
    let row = _findRow(sh, key);
    const cur = _getVer(key, row > 0);
    const hasBase = body.baseVer !== undefined && body.baseVer !== null;
    // Máy mới: bản trên mạng đã đổi kể từ lúc máy đọc → không ghi, để máy hỏi bố mẹ (trừ khi bố mẹ chủ động ghi đè)
    if (!body.force && hasBase && Number(body.baseVer) !== cur) {
      return _out({ ok: false, reason: 'conflict', ver: cur, meta: row > 0 ? _readRow(sh, row).meta : null });
    }
    if (row > 0) {
      const old = _readRow(sh, row);
      // Máy dùng bản web cũ (không có baseVer): bản ít XP hơn không được ghi đè bản tốt hơn, trừ khi bố mẹ chủ động.
      if (!body.force && !hasBase && Number(meta.p || 0) < old.meta.p) {
        return _out({ ok: false, reason: 'older', meta: old.meta, ver: cur });
      }
      const hs = _sheet(HIST);
      hs.appendRow(old.raw.filter((x, i) => i < FIXED || (x !== '' && x !== null)));
      const extra = hs.getLastRow() - 1 - HIST_KEEP;
      if (extra > 0) hs.deleteRows(2, extra);
      sh.getRange(row, 1, 1, sh.getLastColumn()).clearContent();
    } else {
      row = sh.getLastRow() + 1;
    }
    const values = [key, String(meta.name || ''), new Date(Number(meta.at) || Date.now()), Number(meta.p || 0),
      Number(meta.stars || 0), Number(meta.stickers || 0), Number(meta.balls || 0), text.length].concat(chunks);
    sh.getRange(row, 1, 1, values.length).setValues([values]);
    SpreadsheetApp.flush();      // ghi Sheet xong hẳn rồi mới tăng phiên bản và nhả khoá
    const ver = cur + 1;
    _setVer(key, ver);
    return _out({ ok: true, saved: true, at: Number(meta.at) || Date.now(), ver: ver });
  } finally {
    lock.releaseLock();
  }
}
