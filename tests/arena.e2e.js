// Kiểm thử trên trình duyệt thật: chọn bảng + nhóm dạng ở Đấu trường → bắt đầu Thử thách → kết quả ghi đúng phạm vi.
// Chạy: (cd <repo> && python3 -m http.server 8765) rồi  node tests/arena.e2e.js   (cần Playwright + Chromium)
const { chromium } = require('playwright');
const assert = require('assert');
const URL = process.env.BASE_URL || 'http://localhost:8765/';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(); const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  // Máy chủ giả: sao lưu → chưa có bản; các lệnh khác (bảng xếp hạng, nhật ký) → danh sách rỗng
  await ctx.route('https://script.google.com/**', r => r.fulfill({ contentType: 'application/json',
    body: /action=get&key=/.test(r.request().url()) ? '{"ok":true,"found":false,"ver":0}' : (r.request().method() === 'POST' ? '{"ok":true,"saved":true,"ver":1}' : '[]') }));
  await p.goto(URL); await p.waitForTimeout(1200);
  await p.fill('#nameInput', 'Test Arena'); await p.click('#btnStart'); await p.waitForTimeout(500);
  // Huy hiệu cũ ở mức Rùa (chưa có phạm vi)
  await p.evaluate(() => { const d = TableGen.getSpeed(); d.level.passed[1] = '2026-10-01'; d.level.unlocked = 2; TableGen.saveSpeed(d); });
  await p.evaluate(() => App.showScreen('arena')); await p.waitForTimeout(1200);
  // Chỉ chọn bảng 3, nhóm "Quan hệ phép nhân", mức Ốc sên
  const chips = await p.$$eval('#arenaBody .drill-chip', els => els.map(e => ({ t: +e.dataset.t, on: e.classList.contains('on') })));
  for (const c of chips) if ((c.t === 3) !== c.on) await p.click(`#arenaBody .drill-chip[data-t="${c.t}"]`);
  await p.click('#arenaBody .drill-group[data-g="rel"]');
  await p.click('#arenaBody .speed-lv[data-lv="0"]');
  await p.click('#arenaBody .speed-go'); await p.waitForTimeout(800);
  const scope = await p.evaluate(() => Quiz.speed && Quiz.speed.scope);
  assert.deepStrictEqual(scope, { t: [3], g: 'rel' }, 'Quiz nhận đúng bảng + nhóm dạng từ giao diện');
  const tables = await p.evaluate(() => [...new Set(Quiz.questions.map(q => q._table))]);
  assert.deepStrictEqual(tables, [3], 'câu hỏi đúng bảng đã chọn');
  // Giả lập đạt 17/20 rồi chốt kết quả
  const msg = await p.evaluate(() => { Quiz.speed.inTime = 17; return Quiz._speedFinishMsg(20); });
  assert.ok(msg.includes('bảng 3 · Quan hệ phép nhân'), 'màn kết quả ghi phạm vi');
  const saved = await p.evaluate(() => TableGen.scopesOf(0));
  assert.strictEqual(saved.length, 1); assert.deepStrictEqual(saved[0].t, [3]); assert.strictEqual(saved[0].g, 'rel');
  // Đấu trường + nhãn cạnh tên
  await p.evaluate(() => { App.showScreen('arena'); Arena.renderChip(); }); await p.waitForTimeout(800);
  const shelf = await p.$$eval('#arenaBody .arena-shelf-item', els => els.map(e => e.innerText.replace(/\s+/g, ' ').trim()));
  assert.ok(shelf[0].includes('bảng 3 · Quan hệ phép nhân'), 'huy hiệu Ốc sên hiện phạm vi: ' + shelf[0]);
  assert.ok(shelf[1].includes('chưa ghi nhận phạm vi'), 'huy hiệu cũ mức Rùa: ' + shelf[1]);
  if (process.env.SHOT) await p.locator('#arenaBody .arena-shelf').screenshot({ path: process.env.SHOT });
  assert.deepStrictEqual(errs, [], 'không lỗi JS');
  console.log('✔ chọn bảng/nhóm ở giao diện → Quiz → kết quả → Đấu trường: phạm vi đúng'); console.log('Tất cả đạt');
  await b.close();
})().catch(e => { console.log('✘', e.message); process.exit(1); });
