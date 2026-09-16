const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('songApi', {
  applyUrl: (url) => ipcRenderer.invoke('song-apply-url', url),
  resetSong: () => ipcRenderer.invoke('song-reset'),
  onStatus: (cb) => ipcRenderer.on('song-status', (_e, msg, type) => cb(msg, type))
});
