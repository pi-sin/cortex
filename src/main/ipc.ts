import { ipcMain, BrowserWindow, app } from 'electron';
import log from 'electron-log';
import { connectorRegistry } from '../integrations/registry';
import type { FetchOptions, SearchOptions } from '../shared/types';

export function registerIpcHandlers(): void {
  // ── App ───────────────────────────────────────────────────
  ipcMain.on('app:quit', () => {
    log.info('Quit requested via IPC');
    app.quit();
  });

  ipcMain.on('app:minimize', () => {
    const win = BrowserWindow.getFocusedWindow();
    win?.minimize();
  });

  ipcMain.on('app:maximize', () => {
    const win = BrowserWindow.getFocusedWindow();
    if (win) {
      win.isMaximized() ? win.unmaximize() : win.maximize();
    }
  });

  ipcMain.handle('app:version', () => {
    return app.getVersion();
  });

  // ── Connector: Auth ───────────────────────────────────────
  ipcMain.handle('connector:authenticate', async (_event, connectorId: string) => {
    const connector = connectorRegistry.get(connectorId);
    if (!connector) {
      return { success: false, error: `Connector "${connectorId}" not found` };
    }
    return connector.authenticate();
  });

  ipcMain.handle('connector:authStatus', (_event, connectorId: string) => {
    const connector = connectorRegistry.get(connectorId);
    if (!connector) return 'unauthenticated';
    return connector.getAuthStatus();
  });

  ipcMain.handle('connector:revoke', async (_event, connectorId: string) => {
    const connector = connectorRegistry.get(connectorId);
    if (!connector) return;
    await connector.revokeAccess();
  });

  // ── Connector: Data ───────────────────────────────────────
  ipcMain.handle('connector:fetchItems', async (_event, connectorId: string, options: FetchOptions) => {
    const connector = connectorRegistry.get(connectorId);
    if (!connector) {
      throw new Error(`Connector "${connectorId}" not found`);
    }
    return connector.fetchItems(options);
  });

  ipcMain.handle('connector:search', async (_event, connectorId: string, query: string, options?: SearchOptions) => {
    const connector = connectorRegistry.get(connectorId);
    if (!connector) {
      throw new Error(`Connector "${connectorId}" not found`);
    }
    return connector.search(query, options);
  });

  // ── Connector: Actions ────────────────────────────────────
  ipcMain.handle('connector:executeAction', async (_event, connectorId: string, actionId: string) => {
    const connector = connectorRegistry.get(connectorId);
    if (!connector) {
      return { success: false, error: `Connector "${connectorId}" not found` };
    }
    return connector.executeAction({ id: actionId, label: '' });
  });

  ipcMain.handle('connector:supportedActions', (_event, connectorId: string) => {
    const connector = connectorRegistry.get(connectorId);
    if (!connector) return [];
    return connector.getSupportedActions();
  });

  // ── Connector: Health ─────────────────────────────────────
  ipcMain.handle('connector:health', async (_event, connectorId: string) => {
    return connectorRegistry.checkHealth(connectorId);
  });

  ipcMain.handle('connector:list', () => {
    return connectorRegistry.getAll().map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
      authStatus: c.getAuthStatus(),
    }));
  });

  log.info('IPC handlers registered');
}
