import type {
  NormalizedItem,
  FetchOptions,
  SearchOptions,
  ConnectorHealth,
  AuthResult,
  AuthStatus,
  ConnectorAction,
  ActionResult,
  Unsubscribe,
} from '../shared/types';

export type {
  NormalizedItem,
  FetchOptions,
  SearchOptions,
  ConnectorHealth,
  AuthResult,
  AuthStatus,
  ConnectorAction,
  ActionResult,
  Unsubscribe,
};

/**
 * Lifecycle events emitted by connectors.
 * The registry and UI layer subscribe to these to react to state changes.
 */
export type ConnectorEventType =
  | 'auth:success'
  | 'auth:expired'
  | 'auth:revoked'
  | 'data:updated'
  | 'health:changed'
  | 'error';

export interface ConnectorEvent {
  type: ConnectorEventType;
  connectorId: string;
  timestamp: Date;
  payload?: Record<string, unknown>;
}

export type ConnectorEventHandler = (event: ConnectorEvent) => void;

/**
 * Configuration passed to a connector on initialization.
 * Contains credentials references and user preferences — never raw secrets.
 */
export interface ConnectorConfig {
  /** OAuth redirect URI used during auth flows */
  oauthRedirectUri: string;
  /** Polling interval in ms for connectors that don't support push (0 = push only) */
  pollIntervalMs: number;
  /** Max items to fetch per request */
  defaultFetchLimit: number;
}

/**
 * Every integration must implement this interface.
 * This is the core abstraction in Cortex — all services are accessed through it.
 */
export interface CortexConnector {
  // ── Identity ──────────────────────────────────────────────
  readonly id: string;
  readonly name: string;
  readonly icon: string;
  readonly color: string;

  // ── Lifecycle ─────────────────────────────────────────────
  /** One-time setup: load cached state, verify tokens, start polling/websockets */
  initialize(config: ConnectorConfig): Promise<void>;
  /** Tear down connections, cancel timers, flush pending writes */
  disconnect(): Promise<void>;
  /** Quick liveness check — called periodically by the registry */
  healthCheck(): Promise<ConnectorHealth>;

  // ── Authentication ────────────────────────────────────────
  /** Kick off the OAuth 2.0 flow — opens browser/webview for consent */
  authenticate(): Promise<AuthResult>;
  /** Silently refresh an expired access token using the stored refresh token */
  refreshToken(): Promise<AuthResult>;
  /** Remove all stored tokens and sign the user out */
  revokeAccess(): Promise<void>;
  /** Synchronous check of current auth state */
  getAuthStatus(): AuthStatus;

  // ── Data ──────────────────────────────────────────────────
  /** Fetch a page of items (emails, messages, events, tickets, files) */
  fetchItems(options: FetchOptions): Promise<NormalizedItem[]>;
  /** Subscribe to real-time updates (push, websocket, or polling fallback) */
  subscribeToUpdates(callback: (items: NormalizedItem[]) => void): Unsubscribe;

  // ── Actions ───────────────────────────────────────────────
  /** Execute an action on an item (archive, reply, transition, etc.) */
  executeAction(action: ConnectorAction): Promise<ActionResult>;
  /** List all actions this connector supports */
  getSupportedActions(): ConnectorAction[];

  // ── Search ────────────────────────────────────────────────
  /** Full-text search within this service's data */
  search(query: string, options?: SearchOptions): Promise<NormalizedItem[]>;

  // ── Events ────────────────────────────────────────────────
  /** Register a handler for connector lifecycle events */
  on(handler: ConnectorEventHandler): Unsubscribe;
}
