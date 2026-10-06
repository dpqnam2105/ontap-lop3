// Kiểm thử trang chủ trên trình duyệt thật (Chromium): thứ tự khối, nút Bắt đầu thấy ngay, trạng thái hoàn thành.
// Chạy: (cd <repo> && python3 -m http.server 8765) rồi  node tests/home.e2e.js   (cần Playwright + Chromium)
const { chromium } = require('playwright');
const assert = require('assert');
const URL = process.env.BASE_URL || 'http://localhost:8765/';

async function open(b, vp, mobile, name) {
  const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile });
  await ctx.route('https://script.google.com/**', r => {
    const u = new globalThis.URL(r.request().url()); const a = u.searchParams.get('action');
    const now = Date.now();
    let body = '[]';
    if (a === 'get') body = '{"ok":true,"found":false,"ver":0}';
    else if (a === 'getLog') body = JSON.stringify(u.searchParams.get('name') === 'coca' ? [{ time: new Date(now - 36e5).toISOString(), correct: 30, total: 30 }] : []);
    else if (a === 'getLeaderboard') body = '[]';
    else if (r.request().method() === 'POST') body = '{"ok":true,"saved":true,"ver":1}';
    r.fulfill({ contentType: 'application/json', body });
  });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(800);
  if (name) {
    await p.fill('#nameInput', name); await p.click('#btnStart'); await p.waitForTimeout(300);
    await p.evaluate(() => { const d = Storage.load(); Object.assign(d, { stars: 175, level: 12, xp: 40, streak: 4, lastStudyDate: Today._dateKey() }); Storage.save(d); });
    await p.goto(URL); await p.waitForTimeout(1500);
  }
  return { p, ctx, errs };
}
const visible = (p, sel) => p.evaluate(s => { const e = document.querySelector(s); if (!e) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden'; }, sel);

(async () => {
  const b = await chromium.launch();
  const ok = m => console.log('✔', m);
  try {
    // 1) Điện thoại 360/390/430: thứ tự khối + nút Bắt đầu nằm trong màn hình đầu, không cuộn ngang
    for (const w of [360, 390, 430]) {
      const { p, ctx, errs } = await open(b, { width: w, height: w === 360 ? 740 : 844 }, true, 'Anh Thư');
      const tops = await p.evaluate(() => ['#homeGreet', '#todayCard', '#homeProfile', '#weekCard', '#homeCollection', '#homeBoard', '#homeNews']
        .map(s => Math.round(document.querySelector(s).getBoundingClientRect().top)));
      assert.ok(tops.every((t, i) => i === 0 || t > tops[i - 1]), w + 'px thứ tự: ' + tops);
      const m = await p.evaluate(() => { const r = document.querySelector('#todayCard .today-go').getBoundingClientRect();
        return { bottom: r.bottom, vh: innerHeight, sw: document.documentElement.scrollWidth, cw: innerWidth,
          next: document.querySelector('#todayCard .tt-next').getBoundingClientRect().bottom }; });
      assert.ok(m.next < m.vh && m.bottom < m.vh, w + 'px: việc tiếp theo + nút Bắt đầu thấy ngay (' + Math.round(m.bottom) + '/' + m.vh + ')');
      assert.strictEqual(m.sw, m.cw, w + 'px: không cuộn ngang');
      assert.ok(await visible(p, '.hg-stars'), 'sao ở đầu trang (điện thoại)');
      assert.ok(!(await visible(p, '.hp-stars')), 'không lặp sao trong hồ sơ (điện thoại)');
      const titles = await p.evaluate(() => [...document.querySelectorAll('#screenRegister .dc-title')].filter(e => e.getBoundingClientRect().width > 0).length);
      assert.ok(titles <= 1, 'danh hiệu không lặp');
      assert.deepStrictEqual(errs, []);
      ok(w + 'px: thứ tự lời chào → kế hoạch → hồ sơ → tuần → bộ sưu tập → xếp hạng → tin vui; Bắt đầu thấy ngay');
      await ctx.close();
    }

    // 2) Máy tính: không có "Kho Bài Tập" ở trang chủ, logo không có lớp, không có "Mở shop", tin vui tĩnh, xếp hạng tuần
    {
      const { p, ctx, errs } = await open(b, { width: 1366, height: 768 }, false, 'Anh Thư');
      assert.ok(!(await visible(p, '.topbar h1')), 'ẩn "Kho Bài Tập" ở trang chủ');
      assert.strictEqual(await p.textContent('#homeGreet h1'), 'Hôm nay mình học gì, Anh Thư?');
      assert.ok(!(await p.textContent('.brand-block')).includes('Lớp'), 'logo không có lớp');
      assert.ok((await p.textContent('#homeProfile')).includes('Lớp 3'), 'lớp ở hồ sơ');
      const shopBtns = await p.evaluate(() => [...document.querySelectorAll('#screenRegister button')].filter(e => /Mở shop/.test(e.textContent) && e.getBoundingClientRect().width > 0).length);
      assert.strictEqual(shopBtns, 0, 'không có nút Mở shop ở trang chủ');
      assert.strictEqual(await p.evaluate(() => document.querySelectorAll('.nt-track').length), 0, 'tin vui không chạy chữ');
      assert.ok(await visible(p, '#homeNews .news-static'), 'tin vui nằm trong cột phải');
      const board = await p.evaluate(() => [...document.querySelectorAll('#homeBoard .hb-list .hb-row')].map(r => ({ me: r.classList.contains('hb-me'), t: r.textContent.replace(/\s+/g, ' ').trim() })));
      assert.ok(board[0].t.includes('coca') && board[0].t.includes('30 điểm'), 'xếp theo điểm tuần: ' + JSON.stringify(board));
      assert.ok(board.some(r => r.me && r.t.includes('Anh Thư')), 'tô sáng dòng của bé');
      await p.evaluate(() => App.showScreen('collection'));
      await p.waitForTimeout(300);
      assert.ok(await visible(p, '.topbar'), 'màn khác vẫn có thanh tiêu đề');
      assert.ok((await p.textContent('#topKicker')).includes('Anh Thư'), 'dòng phụ theo tên bé (không cố định "Anh Thư" cho mọi bé)');
      assert.deepStrictEqual(errs, []);
      ok('máy tính: lời chào thay "Kho Bài Tập", logo không có lớp, không có Mở shop, tin vui tĩnh, xếp hạng tuần tô sáng bé');
      await ctx.close();
    }

    // 3) Hoàn thành: chỉ hiện "nhận thêm 10 ⭐" khi đã ghi nhận thật; mở lại trang không chạy lại, không cộng
    {
      const { p, ctx, errs } = await open(b, { width: 390, height: 844 }, true, 'Anh Thư');
      // Xong hết nhưng CHƯA ghi nhận thưởng → không có dòng sao
      await p.evaluate(() => { const pl = Today.plan(); pl.tasks.forEach(t => { t.done = true; }); pl.rewarded = false; Today.save(pl); Today.render(); });
      assert.ok((await p.textContent('#todayCard')).includes('Con đã hoàn thành kế hoạch hôm nay!'));
      assert.ok(!(await p.textContent('#todayCard')).includes('nhận thêm'), 'chưa ghi nhận thì không báo đã nhận');
      // Ghi nhận thật
      await p.evaluate(() => { Today.grantReward(Today.plan()); Today.render(); });
      const txt = (await p.textContent('#todayCard')).replace(/\s+/g, ' ');
      assert.ok(txt.includes('Con nhận thêm 10 ⭐ · Túi sao hiện có 185 ⭐'), txt);
      assert.ok(await visible(p, '#todayCard [data-act="rewards"]'), 'Xem phần thưởng là nút chính');
      assert.strictEqual(await p.evaluate(() => document.querySelectorAll('#todayCard .today-go').length), 1, 'chỉ 1 nút lớn');
      assert.ok(txt.includes('Muốn chơi thêm? Đấu trường tính nhanh · Ôn thêm 5 phút'));
      // Mở lại trang
      await p.goto(URL); await p.waitForTimeout(2500);
      assert.strictEqual(await p.evaluate(() => Storage.load().stars), 185, 'không cộng thêm khi mở lại');
      assert.strictEqual(await p.evaluate(() => document.querySelectorAll('.achievement-toast').length), 0, 'không chạy lại thông báo nhận thưởng');
      assert.ok((await p.textContent('#todayCard')).includes('Con nhận thêm 10 ⭐'));
      await p.click('#todayCard [data-act="rewards"]'); await p.waitForTimeout(300);
      assert.ok(await p.evaluate(() => document.getElementById('screenCollection').classList.contains('active')), 'Xem phần thưởng → Bộ sưu tập');
      assert.deepStrictEqual(errs, []);
      ok('hoàn thành: chỉ báo sao khi đã ghi nhận; 1 nút chính "Xem phần thưởng"; mở lại không chạy lại, không cộng');
      await ctx.close();
    }

    // 4) Chưa nhập tên: giữ màn chào cũ (banner + ô nhập tên), không có lời chào mới
    {
      const { p, ctx, errs } = await open(b, { width: 390, height: 844 }, true, null);
      assert.ok(await visible(p, '#nameInput'));
      assert.ok(!(await visible(p, '#homeGreet')));
      assert.deepStrictEqual(errs, []);
      ok('chưa nhập tên: màn chào + ô nhập tên như cũ');
      await ctx.close();
    }
    console.log('Tất cả đạt');
  } catch (e) {
    console.log('✘', e.message);
    process.exitCode = 1;
  } finally {
    await b.close();
  }
})();
