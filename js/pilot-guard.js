// =============================================
// PILOT-GUARD.JS — chế độ thử (?pilot=1) dùng VÙNG LƯU RIÊNG
// Nạp TRƯỚC mọi script khác. Khi bật, thay localStorage của trang bằng một lớp bọc:
// mọi khoá được ghi/đọc dưới tiền tố "pilot::" → hồ sơ, sao, tiến độ, câu sai, nhật ký học,
// chi tiết phiên… của chế độ thử KHÔNG đụng dữ liệu thật trên máy (kể cả trùng tên bé).
// Tắt: mở ?pilot=0 (dữ liệu thử vẫn nằm riêng dưới "pilot::", dữ liệu thật nguyên vẹn).
// Cloud/Sheets bị chặn riêng ở cloud.js / api.js (API.pilotOn).
// =============================================
(function () {
  var KEY = 'rabbit_pilot', PREFIX = 'pilot::';
  var on = false;
  try {
    var v = new URLSearchParams(location.search).get('pilot');
    if (v === '1') sessionStorage.setItem(KEY, '1');
    else if (v === '0') sessionStorage.removeItem(KEY);
    on = sessionStorage.getItem(KEY) === '1';
  } catch (e) { on = false; }
  window.__PILOT__ = on;
  if (!on) return;

  var real;
  try { real = window.localStorage; } catch (e) { real = null; }
  var mem = {};                                   // dự phòng khi máy chặn localStorage
  function ownKeys() {
    var out = [];
    if (!real) return Object.keys(mem);
    for (var i = 0; i < real.length; i++) { var k = real.key(i); if (k && k.indexOf(PREFIX) === 0) out.push(k.slice(PREFIX.length)); }
    return out;
  }
  var shim = {
    getItem: function (k) { k = String(k); if (!real) return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; return real.getItem(PREFIX + k); },
    setItem: function (k, v) { k = String(k); if (!real) { mem[k] = String(v); return; } real.setItem(PREFIX + k, String(v)); },
    removeItem: function (k) { k = String(k); if (!real) { delete mem[k]; return; } real.removeItem(PREFIX + k); },
    clear: function () { ownKeys().forEach(function (k) { shim.removeItem(k); }); },
    key: function (i) { var ks = ownKeys(); return i >= 0 && i < ks.length ? ks[i] : null; }
  };
  Object.defineProperty(shim, 'length', { get: function () { return ownKeys().length; } });
  try {
    Object.defineProperty(window, 'localStorage', { value: shim, configurable: true, enumerable: true, writable: false });
    window.__PILOT_STORE__ = PREFIX;
  } catch (e) {
    // Không thay được kho lưu → không chạy chế độ thử (tránh ghi vào dữ liệu thật)
    try { sessionStorage.removeItem(KEY); } catch (e2) { /* bỏ qua */ }
    window.__PILOT__ = false;
  }
})();
