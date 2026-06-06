const { app, BrowserWindow, ipcMain, screen, Tray, Menu } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { UiohookKey, uIOhook } = require('uiohook-napi');

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

function createTray() {
  const iconPath = path.join(__dirname, '..', 'assets', 'cat-tray.png');
  const tray = new Tray(iconPath);
  tray.setToolTip('OIIA Cat');
  let visible = true;

  function buildMenu() {
    return Menu.buildFromTemplate([
      {
        label: visible ? '고양이 숨기기' : '고양이 보이기',
        click: () => {
          visible = !visible;
          visible ? overlayWin.show() : overlayWin.hide();
          tray.setContextMenu(buildMenu());
        }
      },
      {
        label: '설정',
        click: () => createSettingsWindow()
      },
      { type: 'separator' },
      {
        label: '종료',
        click: () => app.quit()
      }
    ]);
  }

  tray.setContextMenu(buildMenu());
}

function createSettingsWindow() {
  if (settingsWin) { settingsWin.focus(); return; }

  settingsWin = new BrowserWindow({
    width: 280,
    height: 320,
    resizable: false,
    title: 'OIIA Cat 설정',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'settings', 'preload.js')
    }
  });

  settingsWin.loadFile(path.join(__dirname, 'settings', 'index.html'));
  settingsWin.on('closed', () => { settingsWin = null; });
}

app.whenReady().then(() => {
  ipcMain.handle('get-settings', () => store.store);

  ipcMain.handle('save-settings', (_e, s) => {
    store.set('volume', s.volume);
    store.set('catSize', s.catSize);
    store.set('sensitivity', s.sensitivity);
    if (overlayWin && !overlayWin.isDestroyed()) {
      const winSize = s.catSize + 40;
      overlayWin.setSize(winSize, winSize);
      overlayWin.webContents.send('settings-updated', store.store);
    }
  });

  ipcMain.handle('reset-position', () => {
    const pos = getDefaultPosition(store.get('catSize'));
    store.set('position', pos);
    if (overlayWin) overlayWin.setPosition(pos.x, pos.y);
  });

  ipcMain.on('move-window', (_e, dx, dy) => {
    if (!overlayWin) return;
    const [x, y] = overlayWin.getPosition();
    const nx = x + dx;
    const ny = y + dy;
    overlayWin.setPosition(nx, ny);
    store.set('position', { x: nx, y: ny });
  });

  ipcMain.on('set-mouse-ignore', (_e, ignore) => {
    if (overlayWin) overlayWin.setIgnoreMouseEvents(ignore, { forward: true });
  });

  createOverlayWindow();
  createTray();

  let overlayReady = false;
  ipcMain.once('overlay-ready', () => { overlayReady = true; });

  uIOhook.on('keydown', () => {
    if (overlayReady && overlayWin && !overlayWin.isDestroyed()) {
      try { overlayWin.webContents.send('keypress'); } catch (_) {}
    }
  });

  uIOhook.start();
});

app.on('before-quit', () => {
  uIOhook.stop();
});

app.on('window-all-closed', (e) => e.preventDefault());
