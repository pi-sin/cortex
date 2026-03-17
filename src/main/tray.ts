import { Tray, Menu, app, nativeImage, BrowserWindow, NativeImage } from 'electron';
import * as path from 'path';
import log from 'electron-log';

let tray: Tray | null = null;

export function createTray(): void {
  // Use a simple 16x16 template image for the tray
  const iconPath = path.join(__dirname, '../../assets/tray/tray-icon.png');

  let trayIcon: NativeImage;
  try {
    trayIcon = nativeImage.createFromPath(iconPath);
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  } catch {
    // Fallback: create a tiny empty image if icon doesn't exist yet
    trayIcon = nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('Cortex');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Cortex',
      click: () => {
        const win = BrowserWindow.getAllWindows()[0];
        if (win) {
          win.show();
          win.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Quit Cortex',
      accelerator: 'CmdOrCtrl+Q',
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      win.isVisible() ? win.hide() : win.show();
    }
  });

  log.info('System tray created');
}
