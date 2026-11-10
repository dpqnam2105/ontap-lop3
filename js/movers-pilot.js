// Opt-in entry only. Normal visits load no Movers data, CSS, player or qtype.
(function () {
  if (!window.API || !API.pilotOn()) return;
  let loading, topic, dialog, example;
  function script(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script'); s.src = src;
      s.onload = resolve; s.onerror = () => { s.remove(); reject(new Error('Chưa tải được phần nghe.')); };
      document.head.appendChild(s);
    });
  }
  function load() {
    if (loading) return loading;
    loading = (async () => {
      if (!document.getElementById('moversStyle')) {
        const css = document.createElement('link'); css.id = 'moversStyle'; css.rel = 'stylesheet'; css.href = 'movers.css?v=20261110mv3'; document.head.appendChild(css);
      }
      if (!window.MoversAudio) await script('js/movers-audio.js?v=20261110mv3');
      if (!window.MoversP4) await script('js/qtypes/movers-listen-p4.js?v=20261110mv3');
      const r = await fetch('data/pilot/movers-listening-p4.json?v=20261110mv3');
      if (!r.ok) throw new Error('Chưa tải được câu hỏi.');
      const data = await r.json(), split = MoversP4.splitExample(data.topic.questions);
      if (split.example.length !== 1 || split.scored.length !== 5 || data.topic.questions.some(q => MoversP4.validate(q).length)) throw new Error('Bộ câu nghe chưa sẵn sàng.');
      topic = { ...data.topic, questions: split.scored };
      const deadline = Date.now() + 15000;
      while (!App.allData && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 100));
      if (!App.allData) throw new Error('Trang chưa khởi động xong.');
      return split.example[0];
    })().catch(e => { loading = null; throw e; });
    return loading;
  }
  async function open() {
    if (!API.pilotOn()) return;
    if (!dialog) {
      dialog = document.createElement('dialog'); dialog.className = 'mv-intro';
      dialog.innerHTML = '<button type="button" data-mv="close" class="mv-btn">Đóng</button><h2>🎧 Thử nghe Movers</h2><p>Giọng đọc tổng hợp · vùng thử riêng. Đây là bài tự soạn, không phải đề Cambridge chính thức.</p><p>Nghe hội thoại rồi chọn một trong ba tranh. Có thể nghe thấy cả ba đáp án; con chú ý điều bị phủ định và thời điểm được hỏi.</p><p data-mv="status" role="status">Đang tải…</p><section data-mv="example"></section><button type="button" class="mv-btn" data-mv="answer" disabled>Xem đáp án ví dụ</button><hr><p>Chọn cách thử, rồi chạm Bắt đầu. Nếu máy chưa phát tiếng, bấm Nghe trong câu hỏi.</p><label>Cách thử <select data-mv="mode"><option value="practice">Luyện tập — nghe lại thoải mái</option><option value="test">Mô phỏng — hai lượt nghe mỗi câu</option></select></label><p><button type="button" class="mv-btn mv-btn-play" data-mv="start" disabled>Bắt đầu phần nghe (5 câu)</button></p>';
      document.body.appendChild(dialog);
      dialog.querySelector('[data-mv="close"]').onclick = () => dialog.close();
      dialog.addEventListener('close', () => { if (example) example.destroy(); example = null; });
      dialog.querySelector('[data-mv="start"]').onclick = () => {
        if (!App.allData || !topic || !API.pilotOn()) return;
        const mode = dialog.querySelector('[data-mv="mode"]').value;
        // Destroy before Quiz starts; a queued dialog close event must not stop its new audio.
        if (example) example.destroy(); example = null;
        dialog.close();
        if (!App.playerName) { Storage.switchPlayer('Thử Movers'); App.playerName = 'Thử Movers'; }
        // Keep the first playback inside the tap handler; later autoplay still needs device verification.
        Quiz.start(topic, 'Tiếng Anh', { mode, subjectId: 'tieng-anh', back: 'register', count: 5 });
      };
    }
    if (dialog.open) return;
    dialog.showModal();
    const status = dialog.querySelector('[data-mv="status"]');
    try {
      const q = await load(); if (!dialog.open) return;
      if (example) example.destroy();
      example = MoversP4.def.render({ host: dialog.querySelector('[data-mv="example"]'), q, mode: 'practice', onChange() {} });
      const answer = dialog.querySelector('[data-mv="answer"]'); answer.disabled = false;
      answer.onclick = () => example && example.showResult({ reveal: true, markSelection: false });
      status.textContent = 'Nghe thử câu ví dụ bên dưới, hoặc bắt đầu năm câu luyện.';
      const start = dialog.querySelector('[data-mv="start"]');
      start.disabled = !App.allData;
      if (start.disabled) status.textContent = 'Trang đang khởi động. Đóng rồi mở lại sau một lát nhé.';
    } catch (e) { status.textContent = e.message + ' Đóng rồi mở lại để thử lại.'; }
  }
  document.addEventListener('DOMContentLoaded', () => {
    const b = document.createElement('button'); b.type = 'button'; b.id = 'btnMoversPilot'; b.textContent = '🎧 Thử nghe Movers';
    b.style.cssText = 'font:inherit;min-height:44px;margin:4px 8px;padding:8px 14px;border:2px solid #2466cc;border-radius:12px;background:white;color:#174fa5;cursor:pointer';
    b.onclick = open;
    (document.getElementById('pilotBanner') || document.body).appendChild(b);
    if (new URLSearchParams(location.search).get('movers') === '1') open();
  });
  window.MoversPilot = { open };
})();
