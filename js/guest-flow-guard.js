// =============================================
// GUEST FLOW GUARD
// Giữ người dùng mới không bị kẹt khi chưa nhập tên.
// Load file này sau js/app.js trong index.html
// =============================================
(function () {
  function safeStorageLoad() {
    try {
      if (window.Storage && typeof window.Storage.load === 'function') {
        return window.Storage.load() || {};
      }
    } catch (e) {}
    return {};
  }

  function hasPlayer() {
    const data = safeStorageLoad();
    return Boolean(
      (window.App && App.playerName && String(App.playerName).trim().length >= 2) ||
      (data.playerName && String(data.playerName).trim().length >= 2)
    );
  }

  function ensureToastStyle() {
    if (document.getElementById('guestFlowGuardStyle')) return;
    const style = document.createElement('style');
    style.id = 'guestFlowGuardStyle';
    style.textContent = `
      .guest-flow-toast{
        position:fixed;
        left:50%;
        top:22px;
        transform:translateX(-50%) translateY(-12px);
        z-index:99999;
        background:#ffffff;
        color:#14324f;
        border:1px solid #d9eafd;
        border-radius:18px;
        padding:12px 18px;
        font-family:'Baloo 2','Nunito',sans-serif;
        font-weight:900;
        box-shadow:0 18px 44px rgba(31,122,245,.18);
        opacity:0;
        pointer-events:none;
        transition:opacity .22s ease, transform .22s ease;
        text-align:center;
      }
      .guest-flow-toast.show{
        opacity:1;
        transform:translateX(-50%) translateY(0);
      }
      @media(max-width:640px){
        .guest-flow-toast{width:calc(100% - 32px); top:14px; font-size:.95rem;}
      }
    `;
    document.head.appendChild(style);
  }

  let toastTimer = null;
  function showToast(message) {
    ensureToastStyle();
    let el = document.getElementById('guestFlowToast');
    if (!el) {
      el = document.createElement('div');
      el.id = 'guestFlowToast';
      el.className = 'guest-flow-toast';
      document.body.appendChild(el);
    }
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.classList.remove('show');
    }, 1800);
  }

  function goRegister() {
    const screen = document.getElementById('screenRegister');
    if (screen) {
      document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
      screen.classList.add('active');
      window.scrollTo(0, 0);
      const input = document.getElementById('nameInput');
      if (input) setTimeout(function () { input.focus(); }, 120);
    }
  }

  function install() {
    if (!window.App || App.__guestFlowGuardInstalled) return;
    App.__guestFlowGuardInstalled = true;

    const originalShowScreen = App.showScreen ? App.showScreen.bind(App) : null;
    const protectedScreens = new Set(['grade', 'subject', 'topic', 'quiz', 'result', 'shop']);

    App.showScreen = function (name) {
      if (!hasPlayer()) {
        if (name === 'register') {
          if (originalShowScreen) return originalShowScreen(name);
          return goRegister();
        }

        if (name === 'subject') {
          // Trang chủ khi chưa có bé đăng nhập thì quay về màn nhập tên.
          goRegister();
          return;
        }

        if (protectedScreens.has(name)) {
          showToast('Con nhập tên trước rồi mình vào học nhé 🐰');
          goRegister();
          return;
        }
      }

      if (originalShowScreen) return originalShowScreen(name);
    };

    // Góp ý và khu Bố Mẹ vẫn dùng được, nhưng các nút học/shop/grade sẽ được guard ở showScreen.
    document.addEventListener('click', function (e) {
      const nav = e.target.closest('[data-screen]');
      if (!nav) return;
      const target = nav.dataset.screen;
      if (!hasPlayer() && protectedScreens.has(target)) {
        e.preventDefault();
        e.stopPropagation();
        App.showScreen(target);
      }
    }, true);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(install, 0); });
  } else {
    setTimeout(install, 0);
  }
})();
