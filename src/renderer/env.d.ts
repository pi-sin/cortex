/// <reference types="vite/client" />

import type { AuthResult, AuthStatus, NormalizedItem, ConnectorHealth, ConnectorAction } from '../shared/types';

interface ConnectorAPI {
  authenticate: (id: string) => Promise<AuthResult>;
  authStatus: (id: string) => Promise<AuthStatus>;
  revoke: (id: string) => Promise<void>;
  fetchItems: (id: string, options: Record<string, unknown>) => Promise<NormalizedItem[]>;
  search: (id: string, query: string, options?: Record<string, unknown>) => Promise<NormalizedItem[]>;
  executeAction: (id: string, actionId: string) => Promise<{ success: boolean; error?: string }>;
  supportedActions: (id: string) => Promise<ConnectorAction[]>;
  health: (id: string) => Promise<ConnectorHealth>;
  list: () => Promise<Array<{
    id: string;
    name: string;
    icon: string;
    color: string;
    authStatus: AuthStatus;
  }>>;
}

interface CortexAPI {
  quit: () => void;
  minimize: () => void;
  maximize: () => void;
  getVersion: () => Promise<string>;
  connector: ConnectorAPI;
}

declare global {
  interface Window {
    cortex: CortexAPI;
  }
}

export {};
