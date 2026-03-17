import { app, BrowserWindow, nativeTheme } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import log from 'electron-log';
import { createTray } from './tray';
import { registerIpcHandlers } from './ipc';
import { startOAuthServer, stopOAuthServer, registerOAuthHandler, getOAuthRedirectUri } from './oauth-server';
import { GmailConnector } from '../integrations/gmail/connector';
import { connectorRegistry } from '../integrations/registry';

log.initialize();

let mainWindow: BrowserWindow | null = null;

// Use dev server only if VITE_DEV_SERVER_URL is set (via npm run dev)
const isDev = !!process.env.VITE_DEV_SERVER_URL;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 18 },
    backgroundColor: '#0D0D0F',
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  nativeTheme.themeSource = 'dark';

  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL ?? 'http://localhost:5173';
    mainWindow.loadURL(devUrl);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    log.info('Cortex window ready');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  createWindow();
  createTray();
  registerIpcHandlers();

  // Start OAuth callback server
  startOAuthServer();

  // Register Gmail connector
  const gmail = new GmailConnector();
  connectorRegistry.register(gmail);

  registerOAuthHandler('gmail', async (code: string) => {
    await gmail.handleOAuthCallback(code);
  });

  // Initialize all connectors
  await connectorRegistry.initializeAll({
    oauthRedirectUri: getOAuthRedirectUri(),
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  log.info('Cortex started');
});

app.on('window-all-closed', () => {
  // On macOS, keep app alive in tray
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', async () => {
  await connectorRegistry.disconnectAll();
  stopOAuthServer();
});
