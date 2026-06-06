// --- 상수 ---
const SPEED_CONSTANT = 360;   // deg/s @ rate=1
const COAST_DECAY    = 0.92;  // per frame
const COAST_MS       = 1500;  // 마지막 키입력 후 감속 시작
const STOP_RATE      = 0.05;  // 이 이하면 IDLE

// --- 상태 ---
let rotation    = 0;
let currentRate = 0;
let state       = 'IDLE';   // IDLE | SPINNING | COASTING
let lastKeyTime = 0;
const timestamps = [];
let settings = { volume: 70, catSize: 80, sensitivity: 'medium' };

const catEl = document.getElementById('cat');

// --- KPS 계산 (speed.js와 동일 로직, renderer 컨텍스트용 인라인) ---
function calcKps(now) {
  const cutoff = now - 2000;
  const recent = timestamps.filter(t => t >= cutoff);
  return recent.length / 2;
}

function kpsToRate(kps) {
  const divisors = { low: 6, medium: 4, high: 2.5 };
  const d = divisors[settings.sensitivity] ?? 4;
  return Math.min(Math.max(kps / d, 0), 3.0);
}

// --- rAF 루프 ---
let lastTs = null;

function tick(now) {
  const dt = lastTs ? (now - lastTs) / 1000 : 0;
  lastTs = now;

  if (state === 'SPINNING') {
    currentRate = kpsToRate(calcKps(now));
    if (now - lastKeyTime > COAST_MS) state = 'COASTING';
  } else if (state === 'COASTING') {
    currentRate *= COAST_DECAY;
    if (currentRate < STOP_RATE) {
      currentRate = 0;
      state = 'IDLE';
    }
  }

  if (state !== 'IDLE') {
    rotation += currentRate * SPEED_CONSTANT * dt;
    catEl.style.transform = `rotate(${rotation}deg)`;
  }

  requestAnimationFrame(tick);
}

// --- IPC 이벤트 ---
window.api.onKeypress(() => {
  const now = performance.now();
  timestamps.push(now);
  // 오래된 타임스탬프 정리
  const cutoff = now - 2100;
  while (timestamps.length && timestamps[0] < cutoff) timestamps.shift();
  lastKeyTime = now;

  if (state === 'IDLE' || state === 'COASTING') state = 'SPINNING';
});

window.api.onSettingsUpdated((s) => {
  settings = s;
  catEl.style.width  = `${s.catSize}px`;
  catEl.style.height = `${s.catSize}px`;
});

// --- 초기화 ---
async function init() {
  settings = await window.api.getSettings();
  catEl.style.width  = `${settings.catSize}px`;
  catEl.style.height = `${settings.catSize}px`;
  requestAnimationFrame(tick);
}

init();
