// Promise lifetime belongs to this player, not to Speak (whose cancellation suppresses callbacks).
(function () {
  const mp3Cache = new Map();
  let token = null;
  const noop = () => {};
  const lines = q => {
    const a = (q && q.audio) || {};
    return Array.isArray(a.lines) && a.lines.length ? a.lines.map(l => l.text) : a.fallback && a.fallback.text ? [a.fallback.text] : [];
  };
  function parts(q, slow) {
    const f = (q.audio && q.audio.fallback) || {};
    return lines(q).map(text => ({ text, lang: f.lang || 'en', rate: slow ? (f.rateSlow || 0.6) : (f.rateNormal || 0.85) }));
  }
  function kill(t) {
    if (!t || !t.alive) return;
    t.alive = false;
    if (t.abort) t.abort.abort();
    if (t.timer != null) clearTimeout(t.timer);
    if (t.el) { try { t.el.pause(); } catch (e) {} t.el = null; }
    [...t.waiters].forEach(cancel => cancel());
  }
  function stop() {
    kill(token); token = null;
    if (window.Speak && Speak.stop) Speak.stop();
  }
  function newToken() {
    stop();
    return token = { alive: true, el: null, timer: null, waiters: new Set(), abort: typeof AbortController === 'function' ? new AbortController() : null };
  }
  function waiting(t, start) {
    if (!t.alive) return Promise.resolve('cancelled');
    return new Promise(resolve => {
      let settled = false;
      const cancel = () => finish('cancelled');
      const finish = status => { if (settled) return; settled = true; t.waiters.delete(cancel); resolve(status); };
      t.waiters.add(cancel);
      try { start(finish); } catch (e) { finish(t.alive ? 'error' : 'cancelled'); }
    });
  }
  function canPlayMp3(src, t) {
    if (!src || typeof fetch !== 'function') return Promise.resolve(false);
    if (mp3Cache.get(src) === true) return Promise.resolve(true);
    return fetch(src, { method: 'HEAD', ...(t && t.abort ? { signal: t.abort.signal } : {}) })
      .then(r => { const ok = !!(r && r.ok); if (ok && (!t || t.alive)) mp3Cache.set(src, true); return ok; })
      .catch(() => false); // A temporary failure must not poison future attempts.
  }
  function runPass(q, opts, t) {
    return waiting(t, finish => {
      const speak = () => {
        if (!t.alive) return;
        if (!window.Speak || !Speak.speakParts || Speak.supported === false || (Speak.hasVoice && !Speak.hasVoice('en'))) { finish('error'); return; }
        const ps = parts(q, !!opts.slow);
        if (!ps.length) { finish('error'); return; }
        try { Speak.speakParts(ps, () => finish(t.alive ? 'ended' : 'cancelled'), () => finish(t.alive ? 'error' : 'cancelled')); }
        catch (e) { finish('error'); }
      };
      const src = q.audio && q.audio.src;
      if (!src) { speak(); return; }
      canPlayMp3(src, t).then(ok => {
        if (!t.alive) return;
        if (!ok) { speak(); return; }
        const el = new Audio(src);
        t.el = el; el.playbackRate = opts.slow ? 0.75 : 1;
        let closed = false;
        const close = () => { if (closed) return false; closed = true; if (t.el === el) t.el = null; return true; };
        el.addEventListener('ended', () => { if (close()) finish(t.alive ? 'ended' : 'cancelled'); });
        el.addEventListener('error', () => { if (!close() || !t.alive) return; el.pause(); speak(); });
        const played = el.play();
        if (played && played.catch) played.catch(() => { if (close()) finish(t.alive ? 'error' : 'cancelled'); });
      }).catch(() => finish(t.alive ? 'error' : 'cancelled'));
    });
  }
  function play(q, opts = {}) {
    const t = newToken();
    return runPass(q, opts, t).then(status => {
      if (t.alive && status === 'ended') (opts.onPass || noop)(1, status);
      if (t.alive) (opts.onEnded || noop)(status);
      return status;
    });
  }
  async function playTwice(q, opts = {}) {
    const t = newToken();
    let status = await runPass(q, opts, t);
    if (!t.alive) return 'cancelled';
    if (status === 'ended') {
      (opts.onPass || noop)(1, status);
      const gap = await waiting(t, finish => { t.timer = setTimeout(() => { t.timer = null; finish('ready'); }, opts.gapMs == null ? 1000 : opts.gapMs); });
      if (gap === 'cancelled' || !t.alive) return 'cancelled';
      status = await runPass(q, opts, t);
      if (!t.alive) return 'cancelled';
      if (status === 'ended') (opts.onPass || noop)(2, status);
    }
    if (t.alive) (opts.onEnded || noop)(status);
    return status;
  }
  window.MoversAudio = { play, playTwice, stop, canPlayMp3, _parts: parts, _lines: lines };
})();
