(function(){
  const bootBar = document.getElementById('bootBar');
  const bootScreen = document.getElementById('boot-screen');
  let prog = 0;
  const bootInterval = setInterval(() => {
    prog += Math.random() * 18 + 8;
    if (prog >= 100) { prog = 100; clearInterval(bootInterval); finishBoot(); }
    bootBar.style.width = prog + '%';
    bootScreen.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', Math.round(prog));
  }, 80);

  function finishBoot() {
    setTimeout(() => {
      bootScreen.classList.add('fade-out');
      setTimeout(() => { bootScreen.style.display = 'none'; openWin('about'); }, 650);
    }, 300);
  }

  const winstates = {};
  let zTop = 200;
  const WIN_IDS = ['about','skills','projects','experience','contact','terminal'];
  const WIN_LABELS = { about:'👤 about', skills:'⚡ skills', projects:'📂 projects', experience:'📋 exp', contact:'📬 contact', terminal:'🖥 term' };

  window.openWin = function(id) {
    const w = document.getElementById('win-' + id);
    if (!w) return;

    if (window.innerWidth < 768) {
      if (!w.style.left || w.style.left === '0px' || w.dataset.maximized === '1') {
        w.style.left = '5%';
        w.style.top = '10%';
        w.style.width = '90%';
        w.style.maxWidth = '500px';
        w.style.height = 'auto';
        w.style.maxHeight = '80%';
      }
    }

    if (window.innerWidth < 768 && w.dataset.maximized === '1') {
      w.dataset.maximized = '0';
      enableResize(id);
    }

    w.classList.add('open');
    w.style.display = 'flex';
    w.removeAttribute('aria-hidden');
    winstates[id] = { open: true, minimized: false };
    bringFront(id);
    updateTaskbar();
    if (id === 'skills') setTimeout(animateBars, 200);
    if (id === 'terminal') setTimeout(() => document.getElementById('termInput').focus(), 80);
  };

  window.closeWin = function(id) {
    const w = document.getElementById('win-' + id);
    w.classList.remove('open');
    w.style.display = 'none';
    w.setAttribute('aria-hidden', 'true');
    delete winstates[id];
    updateTaskbar();
  };

  window.minWin = function(id) {
    const w = document.getElementById('win-' + id);
    if (!winstates[id]) { winstates[id] = { open: true, minimized: false }; }
    winstates[id].minimized = !winstates[id].minimized;
    if (winstates[id].minimized) {
      w.style.display = 'none'; w.classList.remove('open'); w.setAttribute('aria-hidden','true');
    } else {
      w.style.display = 'flex'; w.classList.add('open'); w.removeAttribute('aria-hidden'); bringFront(id);
    }
    updateTaskbar();
  };

  const preMaxSize = {};
  window.maxWin = function(id) {
    const w = document.getElementById('win-' + id);
    if (!winstates[id]) { winstates[id] = { open: true, minimized: false }; }

    if (w.dataset.maximized === '1') {
      const s = preMaxSize[id];
      if (s) {
        w.style.width = s.w;
        w.style.height = s.h;
        w.style.left = s.l;
        w.style.top = s.t;
        w.style.maxWidth = s.mw || 'none';
        w.style.maxHeight = s.mh || 'none';
      }
      w.dataset.maximized = '0';
      enableResize(id);
    } else {
      const computedStyle = window.getComputedStyle(w);
      preMaxSize[id] = {
        w: w.style.width || computedStyle.width,
        h: w.style.height || computedStyle.height,
        l: w.style.left || computedStyle.left,
        t: w.style.top || computedStyle.top,
        mw: w.style.maxWidth,
        mh: w.style.maxHeight
      };
      w.style.left = '0';
      w.style.top = '0';
      w.style.width = window.innerWidth + 'px';
      w.style.height = (window.innerHeight - 48) + 'px';
      w.style.maxWidth = 'none';
      w.style.maxHeight = 'none';
      w.dataset.maximized = '1';
      disableResize(id);
    }
    bringFront(id);
  };

  function disableResize(id) {
    const w = document.getElementById('win-' + id);
    const rhandle = w.querySelector('.rhandle');
    if (rhandle) { rhandle.style.pointerEvents = 'none'; rhandle.style.opacity = '0.3'; }
  }

  function enableResize(id) {
    const w = document.getElementById('win-' + id);
    const rhandle = w.querySelector('.rhandle');
    if (rhandle) { rhandle.style.pointerEvents = 'auto'; rhandle.style.opacity = '1'; }
  }

  function bringFront(id) { zTop++; const w = document.getElementById('win-' + id); if (w) w.style.zIndex = zTop; }

  function updateTaskbar() {
    const ta = document.getElementById('taskbarApps');
    ta.innerHTML = '';
    for (const [id, state] of Object.entries(winstates)) {
      if (!state) continue;
      const btn = document.createElement('div');
      btn.className = 'tapp' + (!state.minimized ? ' active' : '');
      btn.setAttribute('role', 'listitem');
      btn.setAttribute('aria-label', WIN_LABELS[id] || id);
      btn.innerHTML = (WIN_LABELS[id] || id) + (!state.minimized ? '<span class="tdot" aria-hidden="true"></span>' : '');
      btn.onclick = () => minWin(id);
      ta.appendChild(btn);
    }
  }

  window.openAllWindows  = function() { WIN_IDS.forEach(id => openWin(id)); };
  window.closeAllWindows = function() {
    WIN_IDS.forEach(id => { const w = document.getElementById('win-'+id); if(w) { w.classList.remove('open'); w.style.display = 'none'; w.setAttribute('aria-hidden','true'); } });
    for(const k in winstates) delete winstates[k];
    updateTaskbar();
  };
  window.toggleAllWindows = function() { const anyOpen = Object.keys(winstates).length > 0; anyOpen ? closeAllWindows() : openWin('about'); };

  // Keyboard navigation for icons
  document.querySelectorAll('.icon').forEach(icon => {
    icon.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const id = icon.id.replace('icon-', '');
        openWin(id);
      }
    });
  });

  // Drag
  let drag = null;
  function startDrag(e, tb) {
    if (e.target.closest('.win-controls')) return;
    e.preventDefault();
    const w = tb.parentElement;
    const id = w.id.replace('win-', '');
    bringFront(id);
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    drag = { el: w, ox: clientX - w.offsetLeft, oy: clientY - w.offsetTop };
    w.style.transition = 'none';
  }
  function onDragMove(e) {
    if (!drag) return;
    e.preventDefault();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    let nx = clientX - drag.ox;
    let ny = clientY - drag.oy;
    nx = Math.max(0, Math.min(window.innerWidth - drag.el.offsetWidth, nx));
    ny = Math.max(0, Math.min(window.innerHeight - 48 - drag.el.offsetHeight, ny));
    drag.el.style.left = nx + 'px';
    drag.el.style.top  = ny + 'px';
  }
  function stopDrag() { drag = null; }
  document.querySelectorAll('.win-tb').forEach(tb => {
    tb.addEventListener('mousedown', e => startDrag(e, tb));
    tb.addEventListener('touchstart', e => startDrag(e, tb), {passive: false});
  });
  document.addEventListener('mousemove', onDragMove);
  document.addEventListener('touchmove', onDragMove, {passive: false});
  document.addEventListener('mouseup', stopDrag);
  document.addEventListener('touchend', stopDrag);

  // Resize
  let resz = null;
  function startResize(e, h) {
    e.stopPropagation(); e.preventDefault();
    const w = document.getElementById('win-' + h.dataset.win);
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    resz = { el: w, ox: clientX, oy: clientY, ow: w.offsetWidth, oh: w.offsetHeight };
  }
  function onResizeMove(e) {
    if (!resz) return;
    if (resz.el.dataset.maximized === '1') return;
    e.preventDefault();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const newWidth  = Math.max(260, resz.ow + (clientX - resz.ox));
    const newHeight = Math.max(180, resz.oh + (clientY - resz.oy));
    resz.el.style.width  = Math.min(newWidth,  window.innerWidth) + 'px';
    resz.el.style.height = Math.min(newHeight, window.innerHeight - 48) + 'px';
  }
  function stopResize() { resz = null; }
  document.querySelectorAll('.rhandle').forEach(h => {
    h.addEventListener('mousedown', e => startResize(e, h));
    h.addEventListener('touchstart', e => startResize(e, h), {passive: false});
  });
  document.addEventListener('mousemove', onResizeMove);
  document.addEventListener('touchmove', onResizeMove, {passive: false});
  document.addEventListener('mouseup', stopResize);
  document.addEventListener('touchend', stopResize);

  document.querySelectorAll('.window').forEach(w => {
    w.addEventListener('mousedown', () => bringFront(w.id.replace('win-', '')));
    w.addEventListener('touchstart', () => bringFront(w.id.replace('win-', '')), {passive: true});
  });

  function animateBars() {
    document.querySelectorAll('.skill-fill[data-val]').forEach(el => { el.style.width = el.dataset.val + '%'; });
  }

  window.selectIcon = function(id) {
    document.querySelectorAll('.icon').forEach(i => i.classList.remove('selected'));
    const ic = document.getElementById('icon-' + id);
    if (ic) ic.classList.add('selected');
  };
  document.getElementById('desktop').addEventListener('click', e => {
    if (!e.target.closest('.icon')) document.querySelectorAll('.icon').forEach(i => i.classList.remove('selected'));
  });

  // Context menu
  const ctx = document.getElementById('ctxMenu');
  document.getElementById('desktop').addEventListener('contextmenu', e => {
    e.preventDefault();
    ctx.style.left = Math.min(e.clientX, window.innerWidth - 160) + 'px';
    ctx.style.top  = Math.min(e.clientY, window.innerHeight - 180) + 'px';
    ctx.classList.add('show');
  });
  document.addEventListener('click', () => ctx.classList.remove('show'));
  document.addEventListener('touchstart', () => ctx.classList.remove('show'), {passive: true});

  // Clock
  function tick() { document.getElementById('tbClock').textContent = new Date().toLocaleTimeString('en-US',{hour:'2-digit',minute:'2-digit'}); }
  tick(); setInterval(tick, 1000);

  // Terminal
  const ESC = s => String(s).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  let isTyping = false;
  let typingInterval = null;
  let currentTypingElement = null;
  let currentTypingText = '';
  let currentTypingCursor = null;

  function stopTyping() {
    if (typingInterval) { clearInterval(typingInterval); typingInterval = null; }
    if (currentTypingElement) { currentTypingElement.innerHTML = currentTypingText; }
    if (currentTypingCursor) { currentTypingCursor.remove(); currentTypingCursor = null; }
    isTyping = false; currentTypingElement = null;
    termInput.disabled = false; termInput.focus();
  }

  function typeText(element, htmlContent, speed = 10) {
    stopTyping();
    isTyping = true; currentTypingElement = element; currentTypingText = htmlContent;
    termInput.disabled = true;
    element.innerHTML = '';
    currentTypingCursor = document.createElement('span');
    currentTypingCursor.className = 'typing-cursor';
    element.appendChild(currentTypingCursor);
    let charIndex = 0; let htmlString = htmlContent; let currentHTML = '';
    typingInterval = setInterval(() => {
      if (charIndex < htmlString.length) {
        if (htmlString[charIndex] === '<') {
          const closeIndex = htmlString.indexOf('>', charIndex);
          if (closeIndex !== -1) { currentHTML = htmlString.substring(0, closeIndex + 1); charIndex = closeIndex + 1; }
          else { currentHTML += htmlString[charIndex]; charIndex++; }
        } else { currentHTML += htmlString[charIndex]; charIndex++; }
        const cursor = currentTypingCursor;
        element.innerHTML = currentHTML;
        element.appendChild(cursor);
        const to = document.getElementById('termOut'); to.scrollTop = to.scrollHeight;
      } else {
        clearInterval(typingInterval); typingInterval = null;
        if (currentTypingCursor) { currentTypingCursor.remove(); currentTypingCursor = null; }
        isTyping = false; currentTypingElement = null;
        termInput.disabled = false; termInput.focus();
      }
    }, speed);
  }

const TCMDS = {
    help:       () => `<div style="font-size:9px;color:var(--text-mute);margin-bottom:6px;">// commands</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:3px 12px;font-size:9px;"><div><span style="color:var(--cyan)">about</span> <span style="color:var(--text-dim)">Bio</span></div><div><span style="color:var(--cyan)">skills</span> <span style="color:var(--text-dim)">Tech</span></div><div><span style="color:var(--cyan)">projects</span> <span style="color:var(--text-dim)">Work</span></div><div><span style="color:var(--cyan)">contact</span> <span style="color:var(--text-dim)">Info</span></div><div><span style="color:var(--cyan)">clear</span> <span style="color:var(--text-dim)">Clear</span></div><div><span style="color:var(--cyan)">open [x]</span> <span style="color:var(--text-dim)">Window</span></div></div>`,
    about:      () => `<span style="color:var(--cyan);font-size:12px;">Sudam Shrestha</span>\n<span style="color:var(--text-dim);">Senior Full Stack Developer & Python Instructor</span>\n\n<span style="color:var(--cyan);">▸</span> 6+ years Laravel, Vue, React, Node, Python\n<span style="color:var(--cyan);">▸</span> Tech Educator at CodeIT Nepal\n<span style="color:var(--cyan);">▸</span> Founder of SudamHub\n<span style="color:var(--cyan);">▸</span> 📍 Dharan, Nepal\n\n<span style="color:var(--cyan-dim);">Motto:</span> "Clean code, real impact."`,
    skills:     () => `<span style="color:var(--cyan);font-size:12px;">Tech Stack</span>\n\n<span style="color:var(--cyan);">▸</span> Laravel/Filament — 95%\n<span style="color:var(--cyan);">▸</span> Tailwind — 92%\n<span style="color:var(--cyan);">▸</span> Vue/Nuxt — 90%\n<span style="color:var(--cyan);">▸</span> Python — 90%\n<span style="color:var(--cyan);">▸</span> React/Next — 88%\n<span style="color:var(--cyan);">▸</span> MySQL/PG — 88%\n<span style="color:var(--cyan);">▸</span> Node.js — 85%`,
    projects:   () => `<span style="color:var(--cyan);font-size:12px;">Projects</span>\n\n<span style="color:var(--cyan);">📚</span> Student Portal API\n<span style="color:var(--cyan);">🎁</span> Koseli Express\n<span style="color:var(--cyan);">❓</span> Jawaaf Q&A\n<span style="color:var(--cyan);">🍛</span> Dharan Kitchen\n<span style="color:var(--cyan);">🏫</span> CodeIT Platform`,
    experience: () => `<span style="color:var(--cyan);font-size:12px;">Experience</span>\n\n<span style="color:var(--cyan);">▸</span> 2022-Present: Senior Dev @ CodeIT\n<span style="color:var(--cyan);">▸</span> 2020-2022: Full Stack @ CodeIT\n<span style="color:var(--cyan);">▸</span> 2019-2020: Intern @ CodeIT`,
    contact:    () => `<span style="color:var(--cyan);font-size:12px;">Contact</span>\n\n<span style="color:var(--cyan);">📧</span> sudamshrestha939@gmail.com\n<span style="color:var(--cyan);">📱</span> +977 9704508525\n<span style="color:var(--cyan);">📍</span> Dharan-11, Nepal`,
    whoami:     () => `<span style="color:var(--cyan);">sudam</span> — Senior Full Stack Developer & Python Instructor<br><span style="color:var(--text-mute);">CodeIT Nepal · SudamHub Founder</span>`,
    ls:         () => `<span style="color:var(--cyan);">~/sudam/</span>\n<span style="color:var(--blue);">drwx</span> <span style="color:var(--text);">📄 about.me</span>\n<span style="color:var(--blue);">drwx</span> <span style="color:var(--text);">📂 skills/</span>\n<span style="color:var(--blue);">drwx</span> <span style="color:var(--text);">📂 projects/</span>\n<span style="color:var(--blue);">drwx</span> <span style="color:var(--text);">📞 contact.info</span>`,
    pwd:        () => `<span style="color:var(--text-dim);">/home/sudam/portfolio</span>`,
    clear:      () => '',
    sudo:       () => `<span style="color:var(--orange);">[sudo] password: ••••••</span><br><span style="color:var(--green);">Access granted.</span> 🚀`,
  };

  const termOut   = document.getElementById('termOut');
  const termInput = document.getElementById('termInput');
  let tHistory = [], tIdx = 0;

  function termExec(raw) {
    if (isTyping) stopTyping();
    const val = raw.trim();
    if (!val) return;
    const echo = document.createElement('div');
    echo.className = 'cmd-echo';
    echo.innerHTML = `<span style="color:var(--green)">sudam</span><span style="color:var(--text-mute)">@sudamhub</span><span style="color:var(--cyan);">›</span> <span style="color:var(--text)">${ESC(val)}</span>`;
    termOut.appendChild(echo);
    tHistory.push(val); tIdx = tHistory.length;
    const parts = val.toLowerCase().split(/\s+/); const cmd = parts[0]; const arg = parts[1];
    if (cmd === 'clear') { termOut.innerHTML = '<div style="font-size:10px;color:var(--text-dim);">Cleared. Type <span style="color:var(--cyan)">help</span>.</div>'; return; }
    const blk = document.createElement('div'); blk.className = 'out-blk';
    if (cmd === 'open' && arg) {
      if (WIN_IDS.includes(arg)) { openWin(arg); blk.innerHTML = `<span style="color:var(--green)">✓ Opened ${arg}</span>`; }
      else { blk.innerHTML = `<span style="color:var(--red)">open: ${ESC(arg)} not found</span>`; blk.classList.add('err'); }
      termOut.appendChild(blk); termOut.scrollTop = termOut.scrollHeight;
    } else if (TCMDS[cmd]) {
      const output = TCMDS[cmd]();
      termOut.appendChild(blk); termOut.scrollTop = termOut.scrollHeight;
      if (output) typeText(blk, output, 8);
    } else {
      blk.innerHTML = `<span style="color:var(--red)">bash: ${ESC(cmd)} not found</span>`; blk.classList.add('err');
      termOut.appendChild(blk); termOut.scrollTop = termOut.scrollHeight;
    }
  }

  termInput.addEventListener('keydown', e => {
    if (isTyping) { e.preventDefault(); return; }
    if (e.key === 'Enter') { const v = termInput.value; termInput.value = ''; termExec(v); }
    else if (e.key === 'ArrowUp')   { e.preventDefault(); if (tIdx > 0) termInput.value = tHistory[--tIdx] || ''; }
    else if (e.key === 'ArrowDown') { e.preventDefault(); if (tIdx < tHistory.length - 1) termInput.value = tHistory[++tIdx]; else { tIdx = tHistory.length; termInput.value = ''; } }
  });

  document.getElementById('win-terminal').addEventListener('click', () => { if (!isTyping) termInput.focus(); });

  // Initialise all windows as aria-hidden
  WIN_IDS.forEach(id => {
    const w = document.getElementById('win-' + id);
    if (w) w.setAttribute('aria-hidden', 'true');
  });

  // ── FLOATING PARTICLES ──
  (function spawnParticles() {
    const wrap = document.getElementById('particleWrap');
    if (!wrap) return;
    const defs = [
      { b:'20%', l:'15%', dur:'9s',  del:'0s',   op:0.4,  dx:'8px',  color:'#00d4aa' },
      { b:'35%', l:'28%', dur:'11s', del:'2s',   op:0.3,  dx:'-5px', color:'#00d4aa' },
      { b:'55%', l:'12%', dur:'13s', del:'4s',   op:0.35, dx:'12px', color:'#4d9fff' },
      { b:'25%', l:'72%', dur:'8s',  del:'1s',   op:0.4,  dx:'-8px', color:'#00d4aa' },
      { b:'40%', l:'85%', dur:'10s', del:'3s',   op:0.3,  dx:'6px',  color:'#4d9fff' },
      { b:'60%', l:'90%', dur:'12s', del:'0.5s', op:0.25, dx:'-4px', color:'#00d4aa' },
      { b:'15%', l:'45%', dur:'7s',  del:'2.5s', op:0.35, dx:'10px', color:'#4d9fff' },
      { b:'70%', l:'60%', dur:'14s', del:'1.5s', op:0.2,  dx:'-6px', color:'#00d4aa' },
      { b:'80%', l:'33%', dur:'10s', del:'3.5s', op:0.25, dx:'7px',  color:'#4d9fff' },
      { b:'10%', l:'78%', dur:'16s', del:'1s',   op:0.2,  dx:'-9px', color:'#00d4aa' },
      { b:'50%', l:'5%',  dur:'9s',  del:'6s',   op:0.3,  dx:'5px',  color:'#4d9fff' },
      { b:'65%', l:'50%', dur:'12s', del:'4.5s', op:0.18, dx:'-3px', color:'#00d4aa' },
    ];
    defs.forEach(d => {
      const p = document.createElement('div');
      p.className = 'particle';
      p.style.cssText = `bottom:${d.b};left:${d.l};--dur:${d.dur};--del:${d.del};--op:${d.op};--dx:${d.dx};background:${d.color}`;
      wrap.appendChild(p);
    });
  })();

})();