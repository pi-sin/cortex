import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('cortex', {
  // App
  quit: () => ipcRenderer.send('app:quit'),
  minimize: () => ipcRenderer.send('app:minimize'),
  maximize: () => ipcRenderer.send('app:maximize'),
  getVersion: () => ipcRenderer.invoke('app:version'),

  // Connectors
  connector: {
    authenticate: (id: string) => ipcRenderer.invoke('connector:authenticate', id),
    authStatus: (id: string) => ipcRenderer.invoke('connector:authStatus', id),
    revoke: (id: string) => ipcRenderer.invoke('connector:revoke', id),
    fetchItems: (id: string, options: Record<string, unknown>) =>
      ipcRenderer.invoke('connector:fetchItems', id, options),
    search: (id: string, query: string, options?: Record<string, unknown>) =>
      ipcRenderer.invoke('connector:search', id, query, options),
    executeAction: (id: string, actionId: string) =>
      ipcRenderer.invoke('connector:executeAction', id, actionId),
    supportedActions: (id: string) => ipcRenderer.invoke('connector:supportedActions', id),
    health: (id: string) => ipcRenderer.invoke('connector:health', id),
    list: () => ipcRenderer.invoke('connector:list'),
  },
});
