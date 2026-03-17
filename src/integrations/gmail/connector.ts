import log from 'electron-log';
import { GmailAuth } from './auth';
import { GmailApiClient } from './api';
import type { GmailMessage, GmailMessagePart } from './types';
import { GMAIL_LABELS } from './types';
import type {
  CortexConnector,
  ConnectorConfig,
  ConnectorHealth,
  AuthResult,
  AuthStatus,
  NormalizedItem,
  FetchOptions,
  SearchOptions,
  ConnectorAction,
  ActionResult,
  ConnectorEventHandler,
  ConnectorEvent,
  Unsubscribe,
} from '../types';

export class GmailConnector implements CortexConnector {
  readonly id = 'gmail';
  readonly name = 'Gmail';
  readonly icon = 'M';
  readonly color = '#EA4335';

  private auth = new GmailAuth();
  private api = new GmailApiClient(this.auth);
  private eventHandlers = new Set<ConnectorEventHandler>();
  private pollIntervalId: ReturnType<typeof setInterval> | null = null;
  private updateCallbacks = new Set<(items: NormalizedItem[]) => void>();
  private config: ConnectorConfig | null = null;

  // ── Lifecycle ─────────────────────────────────────────────

  async initialize(config: ConnectorConfig): Promise<void> {
    this.config = config;
    this.auth.setRedirectUri(config.oauthRedirectUri);

    const hasTokens = await this.auth.loadStoredTokens();
    if (hasTokens) {
      log.info('Gmail: Loaded stored tokens, connector ready');

      // Verify tokens are still valid
      try {
        await this.api.getProfile();
        this.emit({ type: 'auth:success', connectorId: this.id, timestamp: new Date() });
      } catch {
        log.warn('Gmail: Stored tokens invalid, will need re-auth');
        this.emit({ type: 'auth:expired', connectorId: this.id, timestamp: new Date() });
      }
    } else {
      log.info('Gmail: No stored tokens, authentication required');
    }
  }

  async disconnect(): Promise<void> {
    this.stopPolling();
    this.updateCallbacks.clear();
    log.info('Gmail: Disconnected');
  }

  async healthCheck(): Promise<ConnectorHealth> {
    const status = this.auth.getStatus();
    if (status !== 'authenticated') {
      return {
        status: 'disconnected',
        lastCheck: new Date(),
        message: `Auth status: ${status}`,
      };
    }

    try {
      await this.api.getProfile();
      return { status: 'connected', lastCheck: new Date() };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Health check failed';
      return { status: 'degraded', lastCheck: new Date(), message };
    }
  }

  // ── Authentication ────────────────────────────────────────

  async authenticate(): Promise<AuthResult> {
    try {
      await this.auth.openAuthWindow();
      // The actual token exchange happens via the OAuth callback server
      // which calls handleOAuthCallback below
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to open auth window';
      log.error('Gmail: authenticate() failed', err);
      return { success: false, error: message };
    }
  }

  /** Called by the OAuth callback server when Google redirects back */
  async handleOAuthCallback(code: string): Promise<AuthResult> {
    const result = await this.auth.exchangeCode(code);
    if (result.success) {
      this.emit({ type: 'auth:success', connectorId: this.id, timestamp: new Date() });
      this.startPolling();
    }
    return result;
  }

  async refreshToken(): Promise<AuthResult> {
    const result = await this.auth.refresh();
    if (!result.success) {
      this.emit({ type: 'auth:expired', connectorId: this.id, timestamp: new Date() });
    }
    return result;
  }

  async revokeAccess(): Promise<void> {
    this.stopPolling();
    await this.auth.revoke();
    this.emit({ type: 'auth:revoked', connectorId: this.id, timestamp: new Date() });
  }

  getAuthStatus(): AuthStatus {
    return this.auth.getStatus();
  }

  // ── Data ──────────────────────────────────────────────────

  async fetchItems(options: FetchOptions): Promise<NormalizedItem[]> {
    const limit = options.limit ?? this.config?.defaultFetchLimit ?? 20;

    try {
      // Build Gmail query string from FetchOptions
      let query = '';
      if (options.since) {
        const epoch = Math.floor(options.since.getTime() / 1000);
        query = `after:${epoch}`;
      }
      if (options.filter) {
        query = query ? `${query} ${options.filter}` : options.filter;
      }

      const listResponse = await this.api.listMessages({
        maxResults: limit,
        labelIds: [GMAIL_LABELS.INBOX],
        query: query || undefined,
      });

      if (!listResponse.messages?.length) {
        return [];
      }

      const messages = await this.api.getMessages(
        listResponse.messages.map((m) => m.id),
        'metadata'
      );

      return messages.map((msg) => normalizeGmailMessage(msg));
    } catch (err) {
      log.error('Gmail: fetchItems failed', err);
      this.emit({
        type: 'error',
        connectorId: this.id,
        timestamp: new Date(),
        payload: { error: err instanceof Error ? err.message : 'fetchItems failed' },
      });
      throw err;
    }
  }

  subscribeToUpdates(callback: (items: NormalizedItem[]) => void): Unsubscribe {
    this.updateCallbacks.add(callback);

    // Start polling if not already running
    if (!this.pollIntervalId && this.auth.getStatus() === 'authenticated') {
      this.startPolling();
    }

    return () => {
      this.updateCallbacks.delete(callback);
      if (this.updateCallbacks.size === 0) {
        this.stopPolling();
      }
    };
  }

  // ── Actions ───────────────────────────────────────────────

  async executeAction(action: ConnectorAction): Promise<ActionResult> {
    const [actionType, messageId] = action.id.split(':');

    if (!messageId) {
      return { success: false, error: 'Missing message ID in action' };
    }

    try {
      switch (actionType) {
        case 'markRead':
          await this.api.markAsRead(messageId);
          break;
        case 'archive':
          await this.api.archiveMessage(messageId);
          break;
        case 'star':
          await this.api.starMessage(messageId);
          break;
        default:
          return { success: false, error: `Unknown action: ${actionType}` };
      }

      log.info(`Gmail: Action "${actionType}" executed on message ${messageId}`);
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Action failed';
      log.error(`Gmail: Action "${actionType}" failed`, err);
      return { success: false, error: message };
    }
  }

  getSupportedActions(): ConnectorAction[] {
    return [
      { id: 'markRead', label: 'Mark as Read' },
      { id: 'archive', label: 'Archive' },
      { id: 'star', label: 'Star' },
    ];
  }

  // ── Search ────────────────────────────────────────────────

  async search(query: string, options?: SearchOptions): Promise<NormalizedItem[]> {
    const limit = options?.limit ?? 20;

    try {
      const searchResponse = await this.api.searchMessages(query, limit);

      if (!searchResponse.messages?.length) {
        return [];
      }

      const messages = await this.api.getMessages(
        searchResponse.messages.map((m) => m.id),
        'metadata'
      );

      return messages.map((msg) => normalizeGmailMessage(msg));
    } catch (err) {
      log.error('Gmail: search failed', err);
      throw err;
    }
  }

  // ── Events ────────────────────────────────────────────────

  on(handler: ConnectorEventHandler): Unsubscribe {
    this.eventHandlers.add(handler);
    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  private emit(event: ConnectorEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (err) {
        log.error('Gmail: Error in event handler', err);
      }
    }
  }

  // ── Polling ───────────────────────────────────────────────

  private startPolling(): void {
    if (this.pollIntervalId) return;

    const intervalMs = this.config?.pollIntervalMs ?? 60_000;
    log.info(`Gmail: Starting poll (every ${intervalMs}ms)`);

    this.pollIntervalId = setInterval(() => {
      this.pollForUpdates().catch((err) => {
        log.error('Gmail: Poll cycle failed', err);
      });
    }, intervalMs);
  }

  private stopPolling(): void {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
      this.pollIntervalId = null;
      log.info('Gmail: Polling stopped');
    }
  }

  private async pollForUpdates(): Promise<void> {
    if (this.updateCallbacks.size === 0) return;

    try {
      const items = await this.fetchItems({ limit: 10 });
      this.emit({ type: 'data:updated', connectorId: this.id, timestamp: new Date() });
      for (const callback of this.updateCallbacks) {
        callback(items);
      }
    } catch {
      // fetchItems already logs and emits error events
    }
  }
}

// ── Normalization ─────────────────────────────────────────────

function normalizeGmailMessage(msg: GmailMessage): NormalizedItem {
  const headers = extractHeaders(msg.payload);
  const from = headers.from ?? 'Unknown';
  const senderName = parseEmailName(from);
  const subject = headers.subject ?? '(no subject)';
  const isUnread = msg.labelIds.includes(GMAIL_LABELS.UNREAD);
  const isImportant = msg.labelIds.includes(GMAIL_LABELS.IMPORTANT);
  const isStarred = msg.labelIds.includes(GMAIL_LABELS.STARRED);

  let priority: 'high' | 'medium' | 'low' = 'low';
  if (isImportant || isStarred) priority = 'high';
  else if (isUnread) priority = 'medium';

  return {
    id: `gmail:${msg.id}`,
    sourceApp: 'gmail',
    type: 'message',
    title: subject,
    preview: msg.snippet,
    timestamp: new Date(parseInt(msg.internalDate, 10)),
    unread: isUnread,
    priority,
    sender: { name: senderName },
    metadata: {
      threadId: msg.threadId,
      messageId: msg.id,
      labelIds: msg.labelIds,
      from: headers.from,
      to: headers.to,
      date: headers.date,
    },
    deepLink: `https://mail.google.com/mail/u/0/#inbox/${msg.threadId}`,
    entities: [],
  };
}

function extractHeaders(payload: GmailMessagePart): Record<string, string> {
  const result: Record<string, string> = {};
  if (!payload.headers) return result;

  for (const header of payload.headers) {
    result[header.name.toLowerCase()] = header.value;
  }
  return result;
}

function parseEmailName(from: string): string {
  // "John Doe <john@example.com>" → "John Doe"
  const match = from.match(/^"?(.+?)"?\s*<.+>$/);
  if (match) return match[1].trim();
  // "john@example.com" → "john"
  const emailMatch = from.match(/^([^@]+)@/);
  if (emailMatch) return emailMatch[1];
  return from;
}
