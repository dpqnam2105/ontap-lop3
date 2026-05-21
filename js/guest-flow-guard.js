// =============================================
// GUEST FLOW GUARD v2
// Chặn người mới đi vào luồng học/shop khi chưa nhập tên.
// Load sau js/app.js trong index.html.
// =============================================
(function () {
  function getNameInputValue() {
    var el = document.getElementById('nameInput');
    return el ? String(el.value || '').trim() : '';
  }

  function getStoredName() {
    try {
      if (window.Storage && typeof window.Storage.load === 'function') {
        var data = window.Storage.load();
        return data && data.playerName ? String(data.playerName).trim() : '';
      }
    } catch (e) {}
    return '';
  }

  function hasPlayer() {
    var appName = window.App && window.App.playerName ? String(window.App.playerName).trim() : '';
    var inputName = getNameInputValue();
    var storedName = getStoredName();
    return appName.length >= 2 || inputName.length >= 2 || storedName.length >= 2;
  }

  function goRegister(showNotice) {
    if (window.App && typeof window.App.showScreen === 'function') {
      window.App.showScreen('register');
    } else {
      document.querySelectorAll('.screen').forEach(function (s) { s.classList.remove('active'); });
      var reg = document.getElementById('screenRegister');
      if (reg) reg.classList.add('active');
    }

    var input = document.getElementById('nameInput');
    if (input) {
      setTimeout(function () {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 60);
    }

    if (showNotice) {
      showGuestNotice();
    }
  }

  function showGuestNotice() {
    var old = document.getElementById('guestFlowNotice');
    if (old) old.remove();

    var box = document.createElement('div');
    box.id = 'guestFlowNotice';
    box.textContent = '🐰 Con nhập tên trước để lưu sao, huy hiệu và tiến độ nhé!';
    box.style.position = 'fixed';
    box.style.left = '50%';
    box.style.top = '18px';
    box.style.transform = 'translateX(-50%)';
    box.style.zIndex = '99999';
    box.style.background = '#ffffff';
    box.style.color = '#0f4f9c';
    box.style.border = '2px solid #d9eafd';
    box.style.borderRadius = '999px';
    box.style.boxShadow = '0 16px 40px rgba(31,122,245,.18)';
    box.style.padding = '12px 18px';
    box.style.fontWeight = '900';
    box.style.fontFamily = 'Nunito, sans-serif';
    box.style.maxWidth = 'calc(100vw - 24px)';
    box.style.textAlign = 'center';
    document.body.appendChild(box);

    setTimeout(function () {
      box.style.transition = 'opacity .25s ease, transform .25s ease';
      box.style.opacity = '0';
      box.style.transform = 'translateX(-50%) translateY(-8px)';
      setTimeout(function () { box.remove(); }, 280);
    }, 2200);
  }

  function shouldBlockTarget(target) {
    if (!target || hasPlayer()) return false;

    // Cho phép các thao tác trong màn nhập tên.
    if (target.closest('#screenRegister')) return false;

    // Cho phép phụ huynh mở dashboard, nhưng khi quay lại sẽ về register.
    if (target.closest('#footerParent') || target.closest('#btnPinSubmit') || target.closest('#btnPinBack') || target.closest('#btnChangePin')) {
      return false;
    }

    // Chặn menu/lớp/shop/chủ đề/môn/câu trả lời khi chưa có tên.
    if (target.closest('.grade-card')) return true;
    if (target.closest('.sub-card')) return true;
    if (target.closest('.topic-card')) return true;
    if (target.closest('.ans-btn')) return true;
    if (target.closest('.reward-buy-btn')) return true;
    if (target.closest('#btnRedeemBadge')) return true;
    if (target.closest('#btnRedeemBadgeShop')) return true;

    var nav = target.closest('[data-screen]');
    if (nav) {
      var screen = nav.getAttribute('data-screen');
      if (screen === 'register') return false;
      if (screen === 'subject' || screen === 'grade' || screen === 'topic' || screen === 'quiz' || screen === 'shop') return true;
    }

    return false;
  }

  // Capture phase để chặn trước các handler cũ của app.
  document.addEventListener('click', function (e) {
    if (shouldBlockTarget(e.target)) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      goRegister(true);
    }
  }, true);

  // Override App.showScreen để code khác không tự chuyển qua màn học khi chưa nhập tên.
  function installShowScreenGuard() {
    if (!window.App || typeof window.App.showScreen !== 'function' || window.App.__guestGuardInstalled) return;

    var originalShowScreen = window.App.showScreen.bind(window.App);
    window.App.showScreen = function (name) {
      var blocked = ['grade', 'subject', 'topic', 'quiz', 'shop', 'result'];
      if (!hasPlayer() && blocked.indexOf(name) !== -1) {
        originalShowScreen('register');
        showGuestNotice();
        return;
      }
      return originalShowScreen(name);
    };
    window.App.__guestGuardInstalled = true;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', installShowScreenGuard);
  } else {
    installShowScreenGuard();
  }
  setTimeout(installShowScreenGuard, 200);
})();
