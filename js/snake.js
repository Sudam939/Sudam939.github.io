/* js/snake.js — snake.exe for SudamOS */
(function () {
  const win = document.getElementById('win-snake');
  if (!win) return;

  const canvas = document.getElementById('snakeCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('snakeScore');
  const bestEl = document.getElementById('snakeBest');

  const N = 20;                       // grid size
  const CELL = canvas.width / N;
  const css = getComputedStyle(document.documentElement);
  const C = {
    bg: css.getPropertyValue('--bg').trim() || '#080b14',
    cyan: css.getPropertyValue('--cyan').trim() || '#00d4aa',
    blue: css.getPropertyValue('--blue').trim() || '#4d9fff',
    orange: css.getPropertyValue('--orange').trim() || '#ff9f45',
    green: css.getPropertyValue('--green').trim() || '#6bff8e',
    dim: css.getPropertyValue('--text-dim').trim() || '#6272a4',
    text: css.getPropertyValue('--text').trim() || '#cdd6f4'
  };

  const sfx = n => { if (window.SudamSound) SudamSound.play(n); };
  const mus = a => { if (window.SudamSound) SudamSound.music(a); };

  let snake, dir, queued, food, score, state = 'idle', timer = null, speed;
  let best = 0;
  try { best = parseInt(localStorage.getItem('sudamos_snake_best') || '0', 10) || 0; } catch (e) {}
  bestEl.textContent = best;

  const isOpen = () => win.classList.contains('open') && win.style.display !== 'none';

  function reset() {
    snake = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    dir = { x: 1, y: 0 };
    queued = [];
    score = 0;
    speed = 130;
    scoreEl.textContent = 0;
    placeFood();
  }

  function placeFood() {
    let p;
    do { p = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) }; }
    while (snake.some(s => s.x === p.x && s.y === p.y));
    food = p;
  }

  function setLoop() {
    clearInterval(timer);
    timer = setInterval(tick, speed);
  }

  function start() {
    reset();
    state = 'run';
    setLoop();
    sfx('start'); mus('stop'); mus('play');
    draw();
  }

  function pause() {
    if (state !== 'run') return;
    state = 'paused';
    clearInterval(timer);
    mus('pause');
    draw();
  }

  function resume() {
    if (state !== 'paused') return;
    state = 'run';
    setLoop();
    mus('play');
    draw();
  }

  function toggle() {
    if (state === 'idle' || state === 'over') start();
    else if (state === 'run') pause();
    else if (state === 'paused') resume();
  }

  function turn(dx, dy) {
    if (state === 'idle' || state === 'over') return;
    if (state === 'paused') resume();
    const last = queued.length ? queued[queued.length - 1] : dir;
    if (dx === -last.x && dy === -last.y) return;   // no 180° turns
    if (dx === last.x && dy === last.y) return;
    if (queued.length < 3) queued.push({ x: dx, y: dy });
  }

  function tick() {
    if (queued.length) dir = queued.shift();
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    const hitWall = head.x < 0 || head.y < 0 || head.x >= N || head.y >= N;
    const hitSelf = snake.some(s => s.x === head.x && s.y === head.y);
    if (hitWall || hitSelf) return gameOver();

    snake.unshift(head);
    if (head.x === food.x && head.y === food.y) {
      score++;
      sfx('eat');
      scoreEl.textContent = score;
      if (score % 5 === 0 && speed > 60) { speed -= 10; setLoop(); }
      placeFood();
    } else {
      snake.pop();
    }
    draw();
  }

  function gameOver() {
    state = 'over';
    clearInterval(timer);
    mus('stop'); sfx('over');
    if (score > best) {
      best = score;
      bestEl.textContent = best;
      try { localStorage.setItem('sudamos_snake_best', String(best)); } catch (e) {}
    }
    draw();
  }

  function overlay(title, sub) {
    ctx.fillStyle = 'rgba(8,11,20,0.78)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = C.cyan;
    ctx.font = '700 22px "JetBrains Mono", monospace';
    ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 6);
    ctx.fillStyle = C.dim;
    ctx.font = '400 11px "JetBrains Mono", monospace';
    ctx.fillText(sub, canvas.width / 2, canvas.height / 2 + 18);
  }

  function draw() {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // faint grid
    ctx.strokeStyle = 'rgba(0,212,170,0.05)';
    ctx.lineWidth = 1;
    for (let i = 1; i < N; i++) {
      ctx.beginPath(); ctx.moveTo(i * CELL, 0); ctx.lineTo(i * CELL, canvas.height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i * CELL); ctx.lineTo(canvas.width, i * CELL); ctx.stroke();
    }

    if (snake) {
      // food ("bug")
      ctx.shadowColor = C.orange;
      ctx.shadowBlur = 12;
      ctx.fillStyle = C.orange;
      ctx.beginPath();
      ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, CELL / 2 - 4, 0, Math.PI * 2);
      ctx.fill();

      // snake
      snake.forEach((s, i) => {
        ctx.shadowColor = C.cyan;
        ctx.shadowBlur = i === 0 ? 14 : 6;
        ctx.fillStyle = i === 0 ? C.green : (i % 2 ? C.cyan : C.blue);
        ctx.globalAlpha = Math.max(0.45, 1 - i * 0.025);
        ctx.fillRect(s.x * CELL + 2, s.y * CELL + 2, CELL - 4, CELL - 4);
      });
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;
    }

    if (state === 'idle') overlay('SNAKE.EXE', 'Press SPACE / tap START — eat the bugs 🐞');
    else if (state === 'paused') overlay('PAUSED', 'Press SPACE or any arrow to resume');
    else if (state === 'over') overlay('SEGFAULT', 'Score ' + score + ' — SPACE to retry');
  }

  // ── keyboard ──
  const KEYS = {
    ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0],
    w: [0, -1], s: [0, 1], a: [-1, 0], d: [1, 0],
    W: [0, -1], S: [0, 1], A: [-1, 0], D: [1, 0]
  };
  document.addEventListener('keydown', e => {
    if (!isOpen()) return;
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return;
    if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); toggle(); return; }
    const k = KEYS[e.key];
    if (k) { e.preventDefault(); turn(k[0], k[1]); }
  });

  // ── on-screen d-pad ──
  win.querySelectorAll('[data-dir]').forEach(btn => {
    const go = e => {
      e.preventDefault();
      const [dx, dy] = btn.dataset.dir.split(',').map(Number);
      turn(dx, dy);
    };
    btn.addEventListener('touchstart', go, { passive: false });
    btn.addEventListener('mousedown', go);
  });
  document.getElementById('snakeStart').addEventListener('click', toggle);

  // ── swipe on canvas ──
  let sx = 0, sy = 0;
  canvas.addEventListener('touchstart', e => {
    e.stopPropagation();
    sx = e.touches[0].clientX; sy = e.touches[0].clientY;
  }, { passive: true });
  canvas.addEventListener('touchend', e => {
    const t = e.changedTouches[0];
    const dx = t.clientX - sx, dy = t.clientY - sy;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) { toggle(); return; }
    if (Math.abs(dx) > Math.abs(dy)) turn(dx > 0 ? 1 : -1, 0);
    else turn(0, dy > 0 ? 1 : -1);
  }, { passive: true });

  // auto-pause when the window is closed/minimised
  setInterval(() => { if (state === 'run' && !isOpen()) pause(); }, 250);

  reset();
  state = 'idle';
  draw();
})();