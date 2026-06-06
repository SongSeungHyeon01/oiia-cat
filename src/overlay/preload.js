const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  onKeypress: (cb) => ipcRenderer.on('keypress', () => cb()),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  onSettingsUpdated: (cb) => ipcRenderer.on('settings-updated', (_e, s) => cb(s)),
  moveWindow: (dx, dy) => ipcRenderer.send('move-window', dx, dy),
  setMouseIgnore: (ignore) => ipcRenderer.send('set-mouse-ignore', ignore)
});
