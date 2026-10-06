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
    const sh = _sheet(SHEET);
    const row = _findRow(sh, key);
    if (row < 0) return _out({ ok: true, found: false });
    const r = _readRow(sh, row);
    let snap = null;
    try { snap = JSON.parse(r.data); } catch (err) { return _out({ ok: false, error: 'bad data' }); }
    return _out({ ok: true, found: true, meta: r.meta, snapshot: snap });
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
    const sh = _sheet(SHEET);
    let row = _findRow(sh, key);
    if (row > 0) {
      const old = _readRow(sh, row);
      // Chống mất dữ liệu: máy mới (tiến độ thấp hơn) không được ghi đè bản tốt hơn, trừ khi bố mẹ chủ động.
      if (!body.force && Number(meta.p || 0) < old.meta.p) {
        return _out({ ok: false, reason: 'older', meta: old.meta });
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
    return _out({ ok: true, saved: true, at: Number(meta.at) || Date.now() });
  } finally {
    lock.releaseLock();
  }
}
