const volumeEl     = document.getElementById('volume');
const volumeVal    = document.getElementById('volumeVal');
const sizeEl       = document.getElementById('catSize');
const sizeVal      = document.getElementById('sizeVal');
const sensitivityEl = document.getElementById('sensitivity');
const resetPosBtn  = document.getElementById('resetPos');

function save() {
  window.api.saveSettings({
    volume:      parseInt(volumeEl.value, 10),
    catSize:     parseInt(sizeEl.value, 10),
    sensitivity: sensitivityEl.value
  });
}

volumeEl.addEventListener('input', () => {
  volumeVal.textContent = `${volumeEl.value}%`;
  save();
});

sizeEl.addEventListener('input', () => {
  sizeVal.textContent = `${sizeEl.value}px`;
  save();
});

sensitivityEl.addEventListener('change', save);

resetPosBtn.addEventListener('click', () => window.api.resetPosition());

async function init() {
  const s = await window.api.getSettings();
  volumeEl.value        = s.volume;
  volumeVal.textContent = `${s.volume}%`;
  sizeEl.value          = s.catSize;
  sizeVal.textContent   = `${s.catSize}px`;
  sensitivityEl.value   = s.sensitivity;
}

init();
