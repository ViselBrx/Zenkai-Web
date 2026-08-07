'use strict';

const { app, BrowserWindow, shell, Menu, Tray, nativeImage } = require('electron');
const path = require('path');

// ─── Configurações ────────────────────────────────────────────────────────────
const APP_URL    = 'https://animehouse-zeta.vercel.app';
const APP_NAME   = 'Anime House';
const ICON_PATH  = path.join(__dirname, 'build', 'icon.ico');

// ─── Variáveis globais ────────────────────────────────────────────────────────
let mainWindow  = null;
let splashWindow = null;
let tray        = null;

// ─── Cria a splash screen ─────────────────────────────────────────────────────
function createSplash() {
  splashWindow = new BrowserWindow({
    width: 480,
    height: 320,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    skipTaskbar: true,
    icon: ICON_PATH,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    }
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.center();
}

// ─── Cria a janela principal ──────────────────────────────────────────────────
function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,           // Esconde até carregar
    icon: ICON_PATH,
    title: APP_NAME,
    backgroundColor: '#0d0d0d',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Permite cookies e sessão persistente
      partition: 'persist:animehouse',
    }
  });

  // Remove a barra de menus
  Menu.setApplicationMenu(null);

  // Carrega a URL do site
  mainWindow.loadURL(APP_URL);

  // Abre links externos no navegador padrão (não no Electron)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  // Quando a página terminar de carregar, fecha a splash e mostra a janela
  mainWindow.webContents.once('did-finish-load', () => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.destroy();
      splashWindow = null;
    }
    mainWindow.show();
    mainWindow.focus();
  });

  // Se demorar muito para carregar (ex: sem internet), fecha a splash mesmo assim
  setTimeout(() => {
    if (splashWindow && !splashWindow.isDestroyed()) {
      splashWindow.destroy();
      splashWindow = null;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
    }
  }, 10000);

  // Minimiza para bandeja em vez de fechar (opcional)
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// ─── Cria o ícone na bandeja do sistema ──────────────────────────────────────
function createTray() {
  const iconImage = nativeImage.createFromPath(ICON_PATH);
  tray = new Tray(iconImage);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir Anime House',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Sair',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip(APP_NAME);
  tray.setContextMenu(contextMenu);

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ─── Evento: app pronto ───────────────────────────────────────────────────────
app.whenReady().then(() => {
  createSplash();
  createMainWindow();
  createTray();
});

// ─── Evento: todas as janelas fechadas ────────────────────────────────────────
app.on('window-all-closed', () => {
  // No macOS mantém o app aberto mesmo sem janelas
  if (process.platform !== 'darwin') {
    // Não encerra aqui pois temos a bandeja
  }
});

app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
});
