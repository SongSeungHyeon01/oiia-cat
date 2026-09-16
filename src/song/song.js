const input  = document.getElementById('urlInput');
const status = document.getElementById('status');

function setStatus(msg, type) {
  status.textContent = msg;
  status.className = type || '';
}

window.songApi.onStatus((msg, type) => setStatus(msg, type));

document.getElementById('btnApply').addEventListener('click', async () => {
  const url = input.value.trim();
  if (!url) { setStatus('URL을 입력해주세요.', 'error'); return; }
  setStatus('Loading...', '');
  await window.songApi.applyUrl(url);
});

document.getElementById('btnReset').addEventListener('click', async () => {
  setStatus('Resetting...', '');
  await window.songApi.resetSong();
  input.value = '';
  setStatus('Reset to oiia song.', 'ok');
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btnApply').click();
});
