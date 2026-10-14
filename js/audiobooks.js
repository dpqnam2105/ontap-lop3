// Approved school library catalog. Only the selected book loads audio.
(function () {
  const catalog = 'https://thdoanthidiem.thuvien.edu.vn/tai-lieu/sach-noi';
  let dialog, audio, status, resume, key, timer, lastSave = 0, opening = false, books = [], selectedId = null;
  const time = n => Math.floor(n / 60) + ':' + String(Math.floor(n % 60)).padStart(2, '0');
  function save() {
    if (!audio || !key || !Number.isFinite(audio.currentTime) || audio.currentTime < 1) return;
    try { localStorage.setItem(key, JSON.stringify({ time: audio.ended ? 0 : audio.currentTime, rate: audio.playbackRate })); } catch (_) {}
  }
  function close() {
    if (!dialog) return;
    save(); audio.pause(); clearTimeout(timer);
    if (dialog.open) dialog.close();
  }
  function valid(b) {
    try {
      const p = new URL(b.pageUrl), a = new URL(b.audioUrl);
      return b.id && b.title && p.protocol === 'https:' && p.hostname === 'thdoanthidiem.thuvien.edu.vn' && p.pathname.startsWith('/tai-lieu/sach-noi/') && a.protocol === 'https:' && a.hostname === 'media.thuvien.edu.vn';
    } catch (_) { return false; }
  }
  function chooseBook(b) {
    if (!b || !valid(b)) return;
    // Save the outgoing book before changing its storage key or audio source.
    save(); audio.pause(); key = null; clearTimeout(timer);
    audio.onloadedmetadata = null; resume.hidden = true;
    selectedId = b.id;
    dialog.querySelector('.ab-book').value = b.id;
    dialog.querySelector('h2').textContent = b.title;
    dialog.querySelector('.ab-original').href = b.pageUrl;
    const player = window.Storage && Storage.getActiveName ? Storage.getActiveName() : '';
    const nextKey = 'rabbit_audiobook_v1/' + encodeURIComponent(player || 'guest') + '/' + b.id;
    let stored = {};
    try { stored = JSON.parse(localStorage.getItem(nextKey) || '{}') || {}; } catch (_) {}
    const rate = [0.75, 1, 1.25, 1.5].includes(stored.rate) ? stored.rate : 1;
    dialog.querySelector('.ab-rate').value = String(rate);
    audio.onloadedmetadata = () => {
      if (selectedId !== b.id || !dialog.open) return;
      if (Number.isFinite(stored.time) && stored.time > 0 && stored.time < audio.duration - 2) {
        resume.hidden = false; resume.textContent = 'Nghe tiếp từ ' + time(stored.time);
        resume.onclick = async () => {
          if (selectedId !== b.id) return;
          audio.currentTime = stored.time;
          try { await audio.play(); resume.hidden = true; } catch (_) { status.textContent = 'Con bấm ▶ trên thanh nghe để tiếp tục nhé.'; }
        };
      }
    };
    audio.src = b.audioUrl; audio.playbackRate = rate; audio.load();
    key = nextKey;
    status.textContent = 'Con bấm ▶ để nghe nhé.';
  }
  async function open() {
    if (opening) return;
    if (dialog && dialog.open) return;
    opening = true;
    try {
      if (!dialog) {
        dialog = document.createElement('dialog'); dialog.className = 'audiobook-dialog';
        dialog.setAttribute('aria-labelledby', 'audiobook-title');
        dialog.innerHTML = '<button type="button" class="ab-close" aria-label="Đóng sách nói">✕</button><h2 id="audiobook-title">Sách nói</h2><label class="ab-book-label">Chọn sách <select class="ab-book" aria-label="Chọn sách" disabled></select></label><p class="ab-source">Nguồn: Thư viện TH Đoàn Thị Điểm</p><p class="ab-status" role="status" aria-live="polite"></p><audio controls preload="metadata" aria-label="Nghe sách nói"></audio><div class="ab-tools"><button type="button" data-ab="back">↶ 10 giây</button><button type="button" data-ab="forward">10 giây ↷</button><label>Tốc độ <select class="ab-rate" aria-label="Tốc độ nghe"><option value="0.75">0,75×</option><option value="1" selected>1×</option><option value="1.25">1,25×</option><option value="1.5">1,5×</option></select></label></div><button type="button" class="ab-resume" hidden></button><p><a class="ab-original" href="' + catalog + '" target="_blank" rel="noopener noreferrer">Mở ở thư viện trường</a></p>';
        document.body.appendChild(dialog);
        audio = dialog.querySelector('audio'); status = dialog.querySelector('.ab-status'); resume = dialog.querySelector('.ab-resume');
        dialog.querySelector('.ab-close').onclick = close;
        dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });
        dialog.addEventListener('close', () => { save(); audio.pause(); clearTimeout(timer); });
        dialog.querySelector('[data-ab="back"]').onclick = () => { if (Number.isFinite(audio.duration)) audio.currentTime = Math.max(0, audio.currentTime - 10); };
        dialog.querySelector('[data-ab="forward"]').onclick = () => { if (Number.isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, audio.currentTime + 10); };
        dialog.querySelector('.ab-rate').onchange = e => { audio.playbackRate = Number(e.target.value); save(); };
        dialog.querySelector('.ab-book').onchange = e => chooseBook(books.find(b => b.id === e.target.value));
        const waiting = () => {
          status.textContent = 'Đang tải âm thanh…'; clearTimeout(timer);
          timer = setTimeout(() => { status.textContent = 'Âm thanh tải lâu. Con thử phát lại hoặc mở ở thư viện trường nhé.'; }, 12000);
        };
        audio.addEventListener('waiting', waiting); audio.addEventListener('stalled', waiting);
        audio.addEventListener('playing', () => { clearTimeout(timer); status.textContent = 'Đang nghe'; });
        audio.addEventListener('canplay', () => { clearTimeout(timer); status.textContent = 'Sẵn sàng. Con bấm ▶ để nghe nhé.'; });
        audio.addEventListener('error', () => { clearTimeout(timer); status.textContent = 'Chưa nghe được sách này. Con mở ở thư viện trường nhé.'; });
        audio.addEventListener('pause', save); audio.addEventListener('ended', () => { save(); status.textContent = 'Con đã nghe hết sách.'; });
        audio.addEventListener('timeupdate', () => { if (Date.now() - lastSave > 5000) { lastSave = Date.now(); save(); } });
        window.addEventListener('pagehide', save);
      }
      dialog.showModal(); status.textContent = 'Đang tải sách…'; resume.hidden = true; dialog.querySelector('.ab-book').disabled = true;
      const response = await fetch('data/tai-nguyen/sach-noi.json?v=20261014catalog13');
      if (!response.ok) throw new Error('catalog');
      const rows = await response.json();
      if (!Array.isArray(rows) || !rows.length || rows.some(b => !valid(b)) || new Set(rows.map(b => b.id)).size !== rows.length) throw new Error('books');
      if (!dialog.open) return;
      books = rows;
      const select = dialog.querySelector('.ab-book');
      select.replaceChildren();
      const groups = new Map();
      books.forEach(b => {
        const group = b.group || 'Sách nói';
        if (!groups.has(group)) { const g = document.createElement('optgroup'); g.label = group; groups.set(group, g); select.appendChild(g); }
        const option = document.createElement('option'); option.value = b.id; option.textContent = b.title; groups.get(group).appendChild(option);
      });
      select.disabled = false;
      dialog.querySelector('.ab-book-label').firstChild.textContent = 'Chọn sách (' + books.length + ' cuốn) ';
      chooseBook(books.find(b => b.id === selectedId) || books[0]);
    } catch (_) {
      if (status) status.textContent = 'Chưa tải được sách. Con mở ở thư viện trường nhé.';
    } finally { opening = false; }
  }
  document.addEventListener('click', e => {
    const a = e.target.closest('a');
    if (!a || a.closest('.audiobook-dialog') || a.href !== catalog || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault(); open();
  });
  window.AudioBooks = { open, close, valid };
})();
