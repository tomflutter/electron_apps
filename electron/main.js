const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

/**
 * Signage Device Client — Electron kiosk wrapper.
 * Membaca config.json (device_id, device_key, api base, ws host/port)
 * lalu membuka index.html fullscreen kiosk mode, tanpa frame/menu.
 */

function loadConfig() {
  // Dev mode (npm start): config.json ada satu folder di atas electron/
  // Packaged app (installer): config.json ikut ke resources/ lewat extraResources,
  // dibaca dari process.resourcesPath, bukan dari __dirname (yang ada di dalam app.asar)
  const configPath = app.isPackaged
    ? path.join(process.resourcesPath, 'config.json')
    : path.join(__dirname, '..', 'config.json');

  const defaults = {
    device_id: 'DEMO-DEVICE-ID',
    device_key: 'demo-key',
    api: 'https://pastidighosting.com/api',
    ws_host: 'pastidighosting.com',
    ws_port: '8080',
    ws_key: 'ghosting-key',
  };
  try {
    return { ...defaults, ...JSON.parse(fs.readFileSync(configPath, 'utf-8')) };
  } catch {
    return defaults;
  }
}

// Halaman player yang di-hosting di serv00 (subdomain electron.votm.biz.id)
const PLAYER_URL = 'https://ghostingpelamar.com/';

function createWindow() {
  const cfg = loadConfig();
  const query = new URLSearchParams(cfg).toString();
  const targetUrl = `${PLAYER_URL}?${query}`;

  const win = new BrowserWindow({
    fullscreen: true,
    kiosk: true,
    autoHideMenuBar: true,
    backgroundColor: '#0A0B0E',
    webPreferences: { contextIsolation: true },
  });

  win.setMenuBarVisibility(false);
  win.loadURL(targetUrl);

  // Auto-reload jika renderer crash (mis. karena error jaringan panjang)
  win.webContents.on('render-process-gone', () => {
    setTimeout(() => win.loadURL(targetUrl), 3000);
  });

  // Kalau gagal load (device belum ada internet saat boot), coba lagi tiap 5 detik
  win.webContents.on('did-fail-load', () => {
    setTimeout(() => win.loadURL(targetUrl), 5000);
  });
}

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });