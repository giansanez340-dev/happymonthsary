const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbyga0I-6tnf0X7YBSGRoot9nuqTI90rkGyUnzIXWtLkZI24URP_b5mVeYImLUB0TzkaZA/exec';
/* ════════════════════════════════
   DAY / NIGHT SYSTEM
════════════════════════════════ */
const badge = document.getElementById('themeBadge');
const loginIcon = document.getElementById('loginIcon');

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h >= 6 && h < 18) return 'day';
  return 'night';
}

/* ════════════════════════════════
   NIGHT SKY CANVAS
   Stars + shooting stars + moon
════════════════════════════════ */
const canvas = document.getElementById('nightSky');
const ctx = canvas.getContext('2d');
let stars = [], shooters = [], nightFrame, isNight = false, shooterInterval;

function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function applyTheme(mode) {
  if (mode === 'night') {
    document.body.classList.add('night');
    badge.textContent = '☾ nighttime';
    loginIcon.textContent = '🌙';
    startNightSky();
  } else {
    document.body.classList.remove('night');
    badge.textContent = '☀ daytime';
    loginIcon.textContent = '🌸';
    stopNightSky();
  }
}

applyTheme(getTimeOfDay());
setInterval(() => applyTheme(getTimeOfDay()), 60000);

function makeStars(n) {
  stars = [];
  for (let i = 0; i < n; i++) {
    stars.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.2,
      alpha: Math.random(),
      speed: Math.random() * 0.006 + 0.002,
      phase: Math.random() * Math.PI * 2,
      color: Math.random() < 0.15
        ? `hsl(${200 + Math.random()*60},80%,85%)`
        : Math.random() < 0.1
          ? `hsl(${20 + Math.random()*30},60%,90%)`
          : '#ffffff'
    });
  }
}

function spawnShooter() {
  shooters.push({
    x: Math.random() * canvas.width * 0.7,
    y: Math.random() * canvas.height * 0.4,
    len: 120 + Math.random() * 80,
    speed: 10 + Math.random() * 8,
    alpha: 1,
    angle: Math.PI / 5 + Math.random() * 0.2,
    progress: 0
  });
}

function drawMoon() {
  const mx = canvas.width * 0.82, my = canvas.height * 0.12;
  const r = 38;
  const grd = ctx.createRadialGradient(mx, my, r * 0.5, mx, my, r * 3.5);
  grd.addColorStop(0, 'rgba(220,210,255,0.18)');
  grd.addColorStop(0.4, 'rgba(180,160,240,0.07)');
  grd.addColorStop(1, 'transparent');
  ctx.beginPath(); ctx.arc(mx, my, r * 3.5, 0, Math.PI * 2);
  ctx.fillStyle = grd; ctx.fill();
  const mg = ctx.createRadialGradient(mx - r*0.3, my - r*0.3, r*0.1, mx, my, r);
  mg.addColorStop(0, '#f8f4ff');
  mg.addColorStop(0.5, '#e8e0f8');
  mg.addColorStop(1, '#c8b8e8');
  ctx.beginPath(); ctx.arc(mx, my, r, 0, Math.PI * 2);
  ctx.fillStyle = mg; ctx.fill();
  ctx.beginPath(); ctx.arc(mx + r * 0.35, my - r * 0.1, r * 0.88, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(7,9,26,0.82)'; ctx.fill();
  [[mx - 12, my + 8, 4], [mx - 4, my - 14, 3], [mx - 20, my - 2, 2.5]].forEach(([cx,cy,cr]) => {
    ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(180,160,220,0.25)'; ctx.fill();
  });
}

function nightLoop(t) {
  if (!isNight) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const time = t * 0.001;
  stars.forEach(s => {
    const a = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(time * s.speed * 6 + s.phase));
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
    ctx.fillStyle = s.color;
    ctx.globalAlpha = a;
    ctx.fill();
    if (s.r > 1.1) {
      ctx.globalAlpha = a * 0.4;
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(s.x - s.r * 2.5, s.y); ctx.lineTo(s.x + s.r * 2.5, s.y);
      ctx.moveTo(s.x, s.y - s.r * 2.5); ctx.lineTo(s.x, s.y + s.r * 2.5);
      ctx.stroke();
    }
  });
  ctx.globalAlpha = 1;
  shooters = shooters.filter(s => s.alpha > 0.01);
  shooters.forEach(s => {
    s.progress += s.speed;
    s.alpha -= 0.018;
    const ex = s.x + Math.cos(s.angle) * s.progress;
    const ey = s.y + Math.sin(s.angle) * s.progress;
    const sx = ex - Math.cos(s.angle) * s.len;
    const sy = ey - Math.sin(s.angle) * s.len;
    const grad = ctx.createLinearGradient(sx, sy, ex, ey);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.7, `rgba(220,210,255,${s.alpha * 0.5})`);
    grad.addColorStop(1, `rgba(255,255,255,${s.alpha})`);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey);
    ctx.strokeStyle = grad; ctx.lineWidth = 1.5; ctx.stroke();
  });
  drawMoon();
  nightFrame = requestAnimationFrame(nightLoop);
}

function startNightSky() {
  if (isNight) return;
  isNight = true;
  resizeCanvas();
  makeStars(280);
  nightFrame = requestAnimationFrame(nightLoop);
  shooterInterval = setInterval(() => {
    if (Math.random() < 0.5) spawnShooter();
  }, 4000);
  buildFireflies();
}
function stopNightSky() {
  isNight = false;
  cancelAnimationFrame(nightFrame);
  clearInterval(shooterInterval);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  document.getElementById('fireflies').innerHTML = '';
}

function buildFireflies() {
  const container = document.getElementById('fireflies');
  container.innerHTML = '';
  for (let i = 0; i < 18; i++) {
    const f = document.createElement('div');
    f.className = 'firefly';
    f.style.left = (Math.random() * 100) + 'vw';
    f.style.top  = (40 + Math.random() * 55) + 'vh';
    const fx = (Math.random() * 80 - 40) + 'px';
    const fy = (Math.random() * 80 - 40) + 'px';
    f.style.setProperty('--fx', fx);
    f.style.setProperty('--fy', fy);
    f.style.animationDuration = (8 + Math.random() * 12) + 's';
    f.style.animationDelay    = (Math.random() * -20) + 's';
    container.appendChild(f);
  }
}

/* ════════════════════════════════
   HEARTBEAT + PRESENCE (Sheets)
════════════════════════════════ */
const TOPI_KEY     = 'topi_last_visit';
const LUNA_KEY     = 'luna_last_visit';
const ONLINE_WINDOW = 90000;

window._presence = { topi: 0, luna: 0 };

function fmtDiff(ms) {
  const mins = ms / 60000;
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${Math.round(mins)} minute${Math.round(mins) === 1 ? '' : 's'} ago`;
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  if (h < 24)    return m > 0 ? `${h} hr ${m} min ago` : `${h} hour${h === 1 ? '' : 's'} ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'yesterday' : `${d} days ago`;
}

function isOnline(who) {
  return window._presence[who] && (Date.now() - window._presence[who]) < ONLINE_WINDOW;
}

async function pushPresence(who) {
  try {
    await fetch(`${SHEETS_URL}?who=${who}&ts=${Date.now()}`, {
      method: 'GET',
      mode: 'no-cors',
    });
  } catch(e) {}
}

async function fetchPresence() {
  try {
    const res  = await fetch(SHEETS_URL, {
      method: 'GET',
      redirect: 'follow',
    });
    const text = await res.text();
    const data = JSON.parse(text);
    if (data.topi) window._presence.topi = parseInt(data.topi);
    if (data.luna) window._presence.luna = parseInt(data.luna);
  } catch(e) {
    console.warn('fetchPresence failed:', e);
  }
  updateHeartbeat();
}
function renderPerson(who, isMe) {
  const name  = who === 'topi' ? 'Topi' : 'Luna';
  const ts    = window._presence[who] || 0;
  const el    = document.getElementById(who === 'topi' ? 'hbTimeTopi' : 'hbTimeLuna');
  const dot   = document.getElementById(who === 'topi' ? 'hbDotTopi'  : 'hbDotLuna');
  const msg   = document.getElementById(who === 'topi' ? 'hbMsgTopi'  : 'hbMsgLuna');
  if (!el) return;

  const color = who === 'luna' ? '#D4537E' : '#6495ED';

  if (!ts) {
    el.textContent  = `${name} hasn't visited yet`;
    dot.style.cssText = 'background:#888780;box-shadow:none';
    msg.textContent = '';
    return;
  }

  const online = isOnline(who);
  dot.style.cssText = online
    ? `background:${color};box-shadow:0 0 7px ${color}`
    : 'background:#888780;box-shadow:none';

  if (online) {
    el.textContent = isMe ? 'You are here ♥' : `${name} is here right now ♥`;
    msg.textContent = 'online now';
  } else {
    el.textContent  = `${name} was here ${fmtDiff(Date.now() - ts)}`;
    const mins = (Date.now() - ts) / 60000;
    msg.textContent = mins < 60 ? 'just dropped by ♥' : mins < 720 ? 'was here a while ago' : 'has been missed';
  }
}

function updateHeartbeat() {
  const me    = localStorage.getItem('current_visitor');
  const other = me === 'topi' ? 'luna' : 'topi';
  const otherName = other === 'topi' ? 'Topi' : 'Luna';

  renderPerson('topi', me === 'topi');
  renderPerson('luna', me === 'luna');

  const title = document.getElementById('moodTitle');
  if (title && me) {
    title.textContent = isOnline(other)
      ? `${otherName} is here`
      : `${otherName} was here`;
  }

  const sub = document.getElementById('moodSubtitle');
  if (sub && me) {
    const otherTs = window._presence[other] || 0;
    sub.textContent = !otherTs ? '' : isOnline(other) ? 'active right now' : `last active ${fmtDiff(Date.now() - otherTs)}`;
  }
}
/* ════════════════════════════════
   LOGIN
════════════════════════════════ */
const loginScreen = document.getElementById('loginScreen');
const loginBtn    = document.getElementById('loginBtn');
const loginError  = document.getElementById('loginError');
const mEl = document.getElementById('loginMonth');
const dEl = document.getElementById('loginDay');
const yEl = document.getElementById('loginYear');

function autoTab(el, next) {
  el.addEventListener('input', () => { if (el.value.length >= el.maxLength && next) next.focus(); });
}
autoTab(mEl, dEl); autoTab(dEl, yEl);

let selectedWho = 'topi';

function selectWho(who) {
  selectedWho = who;
  document.getElementById('whoTopi').classList.toggle('active', who === 'topi');
  document.getElementById('whoLuna').classList.toggle('active', who === 'luna');
}

function unlock(who) {
  localStorage.setItem('current_visitor', who);
  pushPresence(who);
  setInterval(() => pushPresence(who), 30000); // keep-alive ping

  loginScreen.classList.add('hide');
  loginError.classList.remove('show');
  setTimeout(() => {
    loginScreen.style.display = 'none';
    updateHeartbeat();
    buildAllMoods();
  }, 900);
}

function tryLogin() {
  const m = parseInt(mEl.value, 10);
  const d = parseInt(dEl.value, 10);
  const y = parseInt(yEl.value, 10);

  const topiDate = m === 4 && d === 17 && y === 2026;
  const lunaDate = m === 4 && d === 17 && y === 2026;

  if ((selectedWho === 'topi' && topiDate) || (selectedWho === 'luna' && lunaDate)) {
    unlock(selectedWho);
  } else {
    loginError.classList.add('show');
    mEl.value = ''; dEl.value = ''; yEl.value = '';
    mEl.focus();
    setTimeout(() => loginError.classList.remove('show'), 3200);
  }
}

loginBtn.addEventListener('click', tryLogin);
[mEl, dEl, yEl].forEach(el => {
  el.addEventListener('keydown', e => { if (e.key === 'Enter') tryLogin(); });
});

/* ════════════════════════════════
   COUNTDOWN
════════════════════════════════ */
const startDate = new Date('2026-04-17T23:18:00');
function updateCountdown() {
  const diff = Math.max(0, new Date() - startDate);
  const totalSecs = Math.floor(diff / 1000);
  const secs  = totalSecs % 60;
  const mins  = Math.floor(totalSecs / 60) % 60;
  const hours = Math.floor(totalSecs / 3600) % 24;
  const days  = Math.floor(totalSecs / 86400);
  function set(id, val) {
    const el = document.getElementById(id);
    const next = String(val).padStart(2, '0');
    if (el.textContent !== next) {
      el.textContent = next;
      el.classList.remove('tick'); void el.offsetWidth; el.classList.add('tick');
      setTimeout(() => el.classList.remove('tick'), 200);
    }
  }
  set('cd-days', days); set('cd-hours', hours); set('cd-mins', mins); set('cd-secs', secs);
}
updateCountdown();
setInterval(updateCountdown, 1000);

/* ════════════════════════════════
   FLOWERS
════════════════════════════════ */
const flowers = [
  { emoji:"🌹", name:"Red Rose",       msg:"Red roses are the ultimate universal symbol of romantic love, passion, and deep devotion" },
  { emoji:"🌷", name:"Tulip",          msg:"In the language of flowers, tulips generally symbolize deep, perfect, and unconditional love" },
  { emoji:"🌸", name:"Cherry Blossom", msg:"Cherry blossoms symbolize love, passion, and feminine beauty." },
  { emoji:"🌺", name:"Hibiscus",       msg:"In the language of flowers, the hibiscus generally represents delicate beauty, hospitality, and deep affection." },
  { emoji:"🪷", name:"Lotus",          msg:"The lotus flower in love symbolizes resilience, pure devotion, and a bond that thrives amidst adversity." },
  { emoji:"💐", name:"A Bouquet",      msg:"In the language of love, a bouquet symbolizes the sender's unsaid emotions, representing passion, care, and devotion." },
  { emoji:"🪻", name:"Hyacinth",       msg:"In love, hyacinths generally symbolize sincerity, deep emotional attachment, and constancy." },
  { emoji:"🌼", name:"Sunflower",      msg:"In love, sunflowers symbolize unwavering loyalty, deep adoration, and steadfast devotion." },
];
const poems = [
  { label:"Dear Babu,", text:"You still shine even when the sky turns cloudy. You always bloom even when the rain starts to pour. And you always keep people warm when the weather turns cold." },
  { label:"Dear Babu,", text:"You're like a fire that keeps on burning. The sun that keeps on glowing. A cup of coffee giving warmth to keep on going. All these things give off the same certainty and love that you give, even without me asking." },
  { label:"Dear Babu,", text:"You're always going to be the language I'll keep on learning. A math equation I'll keep on solving. A program I'll keep on coding. And the only person I'll keep on loving." },
  { label:"Dear Babu,", text:"A pen for both you and I. Co-authoring each other's life till π. For every page I've turned, you are the one I really yearned." },
];

const grid = document.getElementById('flowerGrid');
flowers.forEach((f, i) => {
  const btn = document.createElement('button');
  btn.className = 'flower-btn';
  btn.setAttribute('aria-label', 'Open message for ' + f.name);
  btn.innerHTML = '<span aria-hidden="true">' + f.emoji + '</span>';
  btn.addEventListener('click', () => openFlower(i));
  grid.appendChild(btn);
});

const fOverlay = document.getElementById('fOverlay');
const fClose   = document.getElementById('fClose');
function openFlower(i) {
  document.getElementById('fEmoji').textContent = flowers[i].emoji;
  document.getElementById('fName').textContent  = flowers[i].name;
  document.getElementById('fMsg').textContent   = flowers[i].msg;
  fOverlay.classList.add('open'); fClose.focus();
}
function closeFlower() { fOverlay.classList.remove('open'); }
fClose.addEventListener('click', closeFlower);
fOverlay.addEventListener('click', e => { if (e.target === fOverlay) closeFlower(); });

/* ════════════════════════════════
   ENVELOPES
════════════════════════════════ */
const pOverlay = document.getElementById('pOverlay');
const pClose   = document.getElementById('pClose');
for (let i = 0; i < 4; i++) {
  const env  = document.getElementById('env-' + i);
  const hint = document.getElementById('hint-' + i);
  function makeHandler(idx, el, hintEl) {
    return function() {
      if (!el.classList.contains('open')) {
        el.classList.add('open'); hintEl.style.opacity = '0';
        setTimeout(() => showPoem(idx), 680);
      } else { showPoem(idx); }
    };
  }
  const h = makeHandler(i, env, hint);
  env.addEventListener('click', h);
  env.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); h(); } });
}
function showPoem(i) {
  document.getElementById('pLabel').textContent = poems[i].label;
  document.getElementById('pText').textContent  = poems[i].text;
  pOverlay.classList.add('open'); pClose.focus();
}
function closePoem() { pOverlay.classList.remove('open'); }
pClose.addEventListener('click', closePoem);
pOverlay.addEventListener('click', e => { if (e.target === pOverlay) closePoem(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeFlower(); closePoem(); } });

/* ════════════════════════════════
   PETALS
════════════════════════════════ */
const petalContainer = document.getElementById('petals');
for (let i = 0; i < 22; i++) {
  const p = document.createElement('div');
  p.className = 'petal';
  p.style.left = (Math.random() * 100) + 'vw';
  const size = 7 + Math.random() * 13;
  p.style.width = size + 'px'; p.style.height = size + 'px';
  p.style.animationDuration = (12 + Math.random() * 16) + 's';
  p.style.animationDelay    = (Math.random() * -28) + 's';
  petalContainer.appendChild(p);
}

/* ════════════════════════════════
   SCROLL REVEAL
════════════════════════════════ */
const io = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('show'); io.unobserve(e.target); } });
}, { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));

/* ════════════════════════════════
   VINYL PLAYER
════════════════════════════════ */
(function() {
  const player = document.getElementById('vinylPlayer');
  const btn    = document.getElementById('vinylBtn');
  const icon   = document.getElementById('vinylPauseIcon');
  let ytReady  = false, playing = false, ytPlayer;

  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);

  window.onYouTubeIframeAPIReady = function() {
    ytPlayer = new YT.Player('ytFrame', {
      events: {
        onReady: () => { ytReady = true; },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.ENDED) {
            ytPlayer.seekTo(0); ytPlayer.playVideo();
          }
        }
      }
    });
  };

  btn.addEventListener('click', () => {
    if (!ytReady) return;
    if (playing) {
      ytPlayer.pauseVideo();
      player.classList.remove('playing');
      icon.textContent = '▶';
    } else {
      ytPlayer.playVideo();
      player.classList.add('playing');
      icon.textContent = '▐▐';
    }
    playing = !playing;
  });
})();

/* ════════════════════════════════
   INITIAL HEARTBEAT RENDER
   (no stamping here — stamping
   only happens inside unlock())
════════════════════════════════ */

fetchPresence();
setInterval(fetchPresence, 10000); // poll every 10s

/* ════════════════════════════════
   MOOD PILLS
════════════════════════════════ */
const MOODS = [
  { label: 'Happy'       },
  { label: 'Sad'         },
  { label: 'Grateful'    },
  { label: 'Content'     },
  { label: 'Romantic'    },
  { label: 'Flirtatious' },
  { label: 'Loving'      },
  { label: 'Sleepy'      },
  { label: 'Cuddly'      },
];

const MOOD_COLORS = {
  'Happy':       '#6495ED',
  'Sad':         '#D4537E',
  'Grateful':    '#f0a868',
  'Content':     '#88b4d4',
  'Romantic':    '#c8607c',
  'Flirtatious': '#d47ab0',
  'Loving':      '#e8547a',
  'Sleepy':      '#9080c0',
  'Cuddly':      '#d4907a',
};

const TOPI_MOOD_KEY = 'topi_mood';
const LUNA_MOOD_KEY = 'luna_mood';

function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function applyHeartColor(row, color) {
  const heartEl = row.querySelector('.hb-heart');
  const rings   = row.querySelector('.hb-pulse').querySelectorAll('.hb-ring');
  if (heartEl) heartEl.style.color = color;
  rings.forEach(ring => ring.style.setProperty('background', hexToRgba(color, 0.12), 'important'));
}

function buildMoodPills(containerId, storageKey, who) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';

  const saved = localStorage.getItem(storageKey);
  const defaultColor = who === 'luna' ? '#D4537E' : '#6495ED';

  // restore heart + ripple color on load
  if (saved && MOOD_COLORS[saved]) {
    setTimeout(() => {
      const row = document.getElementById(containerId)?.closest('.hb-row');
      if (row) applyHeartColor(row, MOOD_COLORS[saved]);
    }, 0);
  }

  const savedEl = document.createElement('p');
  savedEl.className = 'hb-mood-saved';
  savedEl.id = containerId + 'Status';

  MOODS.forEach(mood => {
    const pill = document.createElement('button');
    pill.className = 'mood-pill' + (saved === mood.label ? ' selected' : '');
    pill.textContent = mood.label;
    pill.setAttribute('aria-label', mood.label);

    const currentVisitor = localStorage.getItem('current_visitor');
    if (currentVisitor !== who) {
      pill.disabled = true;
      pill.style.opacity = saved === mood.label ? '1' : '0.35';
      pill.style.cursor = 'default';
    }

    pill.addEventListener('click', () => {
      if (localStorage.getItem('current_visitor') !== who) return;
      localStorage.setItem(storageKey, mood.label);
      container.querySelectorAll('.mood-pill').forEach(p => p.classList.remove('selected'));
      pill.classList.add('selected');

      const row = container.closest('.hb-row');
      applyHeartColor(row, MOOD_COLORS[mood.label] || defaultColor);

      savedEl.textContent = 'mood saved ✦';
      savedEl.classList.add('show');
      setTimeout(() => savedEl.classList.remove('show'), 2000);
    });

    container.appendChild(pill);
  });

  // clear button
  const clearBtn = document.createElement('button');
  clearBtn.className = 'mood-pill mood-pill-clear';
  clearBtn.textContent = 'Clear';

  const currentVisitor = localStorage.getItem('current_visitor');
  if (currentVisitor !== who) {
    clearBtn.disabled = true;
    clearBtn.style.opacity = '0.35';
    clearBtn.style.cursor = 'default';
  }

  clearBtn.addEventListener('click', () => {
    if (localStorage.getItem('current_visitor') !== who) return;
    localStorage.removeItem(storageKey);
    container.querySelectorAll('.mood-pill').forEach(p => p.classList.remove('selected'));

    const row = container.closest('.hb-row');
    applyHeartColor(row, defaultColor);

    savedEl.textContent = 'mood cleared ✦';
    savedEl.classList.add('show');
    setTimeout(() => savedEl.classList.remove('show'), 2000);
  });

  container.appendChild(clearBtn);
  container.appendChild(savedEl);
}

function buildAllMoods() {
  buildMoodPills('hbMoodsTopi', TOPI_MOOD_KEY, 'topi');
  buildMoodPills('hbMoodsLuna', LUNA_MOOD_KEY, 'luna');
}

buildAllMoods();
