const COAST_DECAY = 0.97;
const COAST_MS    = 2000;
const STOP_RATE   = 0.05;
const GRAVITY     = 1600;  // px/s²
const BOUNCE_KICK = -180;  // px/s (위로)

let currentRate = 0;
let state       = 'IDLE';
let lastKeyTime = 0;
let paused    = false;
let bounceY   = 0;
let bounceVel = 0;
const timestamps = [];
let settings = { volume: 70, catSize: 140, sensitivity: 'medium' };

const catEl = document.getElementById('cat');
const ctx   = catEl.getContext('2d');

// canvas 크기 설정 (고정 내부 해상도, CSS로 표시 크기 조정)
catEl.width  = 480;
catEl.height = 270;

let idleImg  = null;
let frames   = [];   // HTMLImageElement[]
let frameDelays = []; // ms per frame at 1x speed
let frameIndex  = 0;
let frameAccum  = 0;  // ms accumulated

// --- 이미지 로딩 ---
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// --- 캔버스 그리기 ---
function drawImg(img) {
  ctx.clearRect(0, 0, catEl.width, catEl.height);
  const scale = Math.min(catEl.width / img.naturalWidth, catEl.height / img.naturalHeight);
  const dw = img.naturalWidth  * scale;
  const dh = img.naturalHeight * scale;
  ctx.drawImage(img, (catEl.width - dw) / 2, (catEl.height - dh) / 2, dw, dh);
}

// --- 오디오 ---
const audioEl = document.createElement('audio');
audioEl.src  = '../../assets/oiia.mp3';
audioEl.loop = true;
let audioPlaying = false;
let audioStopTimer = null;

function startAudio() {
  if (audioPlaying) return;
  audioEl.volume = (settings.volume / 100) * 0.6;
  audioEl.play().catch(() => {});
  audioPlaying = true;
}

function stopAudio() {
  if (!audioPlaying) return;
  audioEl.pause();
  audioPlaying = false;
}

// --- KPS 계산 ---
function calcKps(now) {
  const cutoff = now - 1000;
  return timestamps.filter(t => t >= cutoff).length;
}

function kpsToRate(kps) {
  const divisors = { low: 6, medium: 4, high: 2.5 };
  const d = divisors[settings.sensitivity] ?? 4;
  return Math.min(Math.max(kps / d, 0), 3.0);
}

// --- rAF 루프 ---
let lastTs = null;

function tick(now) {
  const dt = lastTs ? now - lastTs : 0;
  lastTs = now;

  if (paused) { requestAnimationFrame(tick); return; }

  if (state === 'SPINNING') {
    currentRate = kpsToRate(calcKps(now));
    const targetRate = Math.max(0.8, Math.min(0.8 + currentRate * 0.25, 1.6));
    audioEl.playbackRate += (targetRate - audioEl.playbackRate) * 0.10;
    if (now - lastKeyTime > COAST_MS) state = 'COASTING';
  } else if (state === 'COASTING') {
    currentRate *= COAST_DECAY;
    const targetRate = Math.max(0.8, Math.min(0.8 + currentRate * 0.25, 1.6));
    audioEl.playbackRate += (targetRate - audioEl.playbackRate) * 0.10;
    if (currentRate < STOP_RATE) {
      currentRate = 0;
      frameIndex  = 0;
      frameAccum  = 0;
      bounceY     = 0;
      bounceVel   = 0;
      state = 'IDLE';
      catEl.style.transform = '';
      if (idleImg) drawImg(idleImg);
    }
  }

  if (state !== 'IDLE' && frames.length) {
    // GIF 프레임 진행
    frameAccum += dt;
    const speed    = Math.max(0.3, currentRate);
    const frameDur = (frameDelays[frameIndex] ?? 70) / speed;
    while (frameAccum >= frameDur) {
      frameAccum -= frameDur;
      frameIndex  = (frameIndex + 1) % frames.length;
    }
    drawImg(frames[frameIndex]);

    // 물리 기반 바운스 (키 누를 때마다 kick → 중력으로 복귀)
    const sec = dt / 1000;
    bounceVel += GRAVITY * sec;
    bounceY   += bounceVel * sec;
    if (bounceY >= 0) { bounceY = 0; bounceVel = 0; }

    const squash = bounceY < -1 ? 1 + bounceY * 0.002 : 1;
    catEl.style.transform = `translateY(${bounceY}px) scaleX(${2 - squash}) scaleY(${squash})`;
  }

  requestAnimationFrame(tick);
}

// --- IPC 이벤트 ---
window.api.onKeypress(() => {
  if (paused) return;
  const now = performance.now();
  timestamps.push(now);
  const cutoff = now - 1100;
  while (timestamps.length && timestamps[0] < cutoff) timestamps.shift();
  lastKeyTime = now;

  if (state === 'IDLE' || state === 'COASTING') {
    state = 'SPINNING';
    currentRate = Math.max(currentRate, 0.8);
    startAudio();
  }
  if (bounceY >= -6) bounceVel = BOUNCE_KICK;

  if (audioStopTimer) clearTimeout(audioStopTimer);
  audioStopTimer = setTimeout(() => { stopAudio(); audioStopTimer = null; }, 2000);
});

window.api.onSettingsUpdated((s) => {
  settings = s;
  const size = s.catSize;
  catEl.style.width  = `${size}px`;
  catEl.style.height = `${Math.round(size * 270 / 480)}px`;
  audioEl.volume = (s.volume / 100) * 0.6;
});

// --- 드래그 ---
let dragging   = false;
let dragStartX = 0;
let dragStartY = 0;

catEl.addEventListener('mouseenter', () => window.api.setMouseIgnore(false));
catEl.addEventListener('mouseleave', () => { if (!dragging) window.api.setMouseIgnore(true); });

catEl.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  window.api.showCatMenu(paused);
});

window.api.onSetPaused((val) => {
  paused = val;
  if (paused) {
    audioEl.pause();
  } else {
    if (audioPlaying) audioEl.play().catch(() => {});
    catEl.style.opacity = '1';
    lastTs = null;
  }
});

catEl.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  dragging = true;
  dragStartX = e.screenX;
  dragStartY = e.screenY;
  e.preventDefault();
});

document.addEventListener('mouseup', () => {
  if (dragging) { dragging = false; window.api.setMouseIgnore(true); }
});

document.addEventListener('mousemove', (e) => {
  if (!dragging) return;
  const dx = e.screenX - dragStartX;
  const dy = e.screenY - dragStartY;
  dragStartX = e.screenX;
  dragStartY = e.screenY;
  window.api.moveWindow(dx, dy);
});

// --- 초기화 ---
async function init() {
  settings = await window.api.getSettings();

  const size = settings.catSize;
  catEl.style.width  = `${size}px`;
  catEl.style.height = `${Math.round(size * 270 / 480)}px`;

  // 아이들 이미지 먼저 표시
  idleImg = await loadImage('../../assets/cat-idle.png');
  drawImg(idleImg);

  requestAnimationFrame(tick);
  window.api.notifyReady();

  // 프레임 딜레이 로드
  try {
    const resp = await fetch('../../assets/frames/delays.json');
    frameDelays = await resp.json();
  } catch (_) {
    frameDelays = new Array(76).fill(70);
  }

  // 모든 프레임 이미지 비동기 로드
  const total = 76;
  frames = new Array(total).fill(null);
  const promises = [];
  for (let i = 0; i < total; i++) {
    const idx = i;
    promises.push(
      loadImage(`../../assets/frames/frame-${String(idx).padStart(3, '0')}.png`)
        .then(img => { frames[idx] = img; })
        .catch(() => {})
    );
  }
  await Promise.all(promises);
  // null 빈칸 제거 (로드 실패한 프레임)
  frames = frames.filter(f => f !== null);
  console.log(`Loaded ${frames.length} animation frames`);
}

init();
