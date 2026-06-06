const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store({
  defaults: {
    volume: 70,
    catSize: 80,
    sensitivity: 'medium',
    position: { x: null, y: null }
  }
});

let overlayWin = null;
let settingsWin = null;

function getDefaultPosition(catSize) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const winSize = catSize + 40;
  return { x: width - winSize - 20, y: height - winSize - 20 };
}

function createOverlayWindow() {
  const catSize = store.get('catSize');
  const winSize = catSize + 40;
  let pos = store.get('position');
  if (!pos.x || !pos.y) pos = getDefaultPosition(catSize);

  overlayWin = new BrowserWindow({
    width: winSize,
    height: winSize,
    x: pos.x,
    y: pos.y,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      autoplayPolicy: 'no-user-gesture-required',
      preload: path.join(__dirname, 'overlay', 'preload.js')
    }
  });

  overlayWin.loadFile(path.join(__dirname, 'overlay', 'index.html'));
  overlayWin.setIgnoreMouseEvents(true, { forward: true });
}

app.whenReady().then(() => {
  createOverlayWindow();
});

app.on('window-all-closed', (e) => e.preventDefault());
