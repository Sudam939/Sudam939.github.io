/* js/sound.js — mp3 sound manager for SudamOS
   Load AFTER main.js:  <script src="/js/sound.js" defer></script>
   Missing mp3 files fail silently, so you can add them one at a time. */
(function () {
  const BASE = '/sounds/';
  const FILES = {
    open:  { src: 'open.mp3',  vol: 0.35 },   // window opens
    close: { src: 'close.mp3', vol: 0.35 },   // window closes
    click: { src: 'click.mp3', vol: 0.30 },   // desktop icon / buttons
    start: { src: 'start.mp3', vol: 0.45 },   // snake starts
    eat:   { src: 'eat.mp3',   vol: 0.50 },   // snake eats a bug
    over:  { src: 'over.mp3',  vol: 0.55 },   // snake game over
    bgm:   { src: 'bgm.mp3',   vol: 0.18, loop: true } // background music (snake only)
  };

  let muted = false;
  try { muted = localStorage.getItem('sudamos_muted') === '1'; } catch (e) {}

  const cache = {};
  function get(name) {
    if (cache[name]) return cache[name];
    const f = FILES[name];
    if (!f) return null;
    const a = new Audio(BASE + f.src);
    a.preload = 'auto';
    a.volume = f.vol;
    a.loop = !!f.loop;
    a.addEventListener('error', () => { a.__broken = true; });
    cache[name] = a;
    return a;
  }

  function play(name) {
    if (muted) return;
    const base = get(name);
    if (!base || base.__broken) return;
    // clone so rapid sounds (eat, click) can overlap
    const a = base.cloneNode();
    a.volume = base.volume;
    const p = a.play();
    if (p && p.catch) p.catch(() => {});
  }

  let musicWanted = false;
  function music(action) {
    const a = get('bgm');
    if (!a || a.__broken) return;
    if (action === 'play') {
      musicWanted = true;
      if (!muted) { const p = a.play(); if (p && p.catch) p.catch(() => {}); }
    } else if (action === 'pause') {
      musicWanted = false; a.pause();
    } else if (action === 'stop') {
      musicWanted = false; a.pause(); a.currentTime = 0;
    }
  }

  function setMuted(v) {
    muted = !!v;
    try { localStorage.setItem('sudamos_muted', muted ? '1' : '0'); } catch (e) {}
    const a = cache.bgm;
    if (a) { if (muted) a.pause(); else if (musicWanted) a.play().catch(() => {}); }
    render();
  }

  window.SudamSound = { play, music, setMuted, toggle: () => setMuted(!muted), isMuted: () => muted };

  // ── wrap openWin / closeWin so every window gets sounds ──
  const _open = window.openWin, _close = window.closeWin;
  if (_open) window.openWin = function (id) {
    const w = document.getElementById('win-' + id);
    const wasOpen = w && w.classList.contains('open');
    const r = _open.apply(this, arguments);
    if (!wasOpen) play('open');
    return r;
  };
  if (_close) window.closeWin = function () { play('close'); return _close.apply(this, arguments); };

  // ── click sound on icons, taskbar and snake buttons ──
  document.addEventListener('click', e => {
    if (e.target.closest('.icon, .start-btn, .snake-btn, .ctx-item')) play('click');
  });

  // ── mute button in the taskbar ──
  const btn = document.createElement('button');
  btn.className = 'snd-btn';
  btn.setAttribute('aria-label', 'Toggle sound');
  btn.addEventListener('click', e => { e.stopPropagation(); window.SudamSound.toggle(); });
  const style = document.createElement('style');
  style.textContent = `.snd-btn{background:transparent;border:1px solid rgba(0,212,170,.2);color:var(--cyan);
    border-radius:6px;font-size:12px;width:28px;height:26px;cursor:pointer;touch-action:manipulation}
    .snd-btn:hover{background:rgba(0,212,170,.12)}`;
  document.head.appendChild(style);
  function render() { btn.textContent = muted ? '🔇' : '🔊'; btn.title = muted ? 'Sound off' : 'Sound on'; }
  render();
  const right = document.querySelector('.taskbar-right');
  if (right) right.insertBefore(btn, right.firstChild);
})();