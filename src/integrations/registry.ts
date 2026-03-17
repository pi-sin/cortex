import log from 'electron-log';
import type {
  CortexConnector,
  ConnectorConfig,
  ConnectorHealth,
  ConnectorEvent,
  ConnectorEventHandler,
  NormalizedItem,
  FetchOptions,
  SearchOptions,
  Unsubscribe,
} from './types';

const DEFAULT_CONFIG: ConnectorConfig = {
  oauthRedirectUri: `http://localhost:18247/callback`,
  pollIntervalMs: 60_000,
  defaultFetchLimit: 50,
};

/**
 * Central registry that manages all CortexConnector instances.
 *
 * Responsibilities:
 * - Register / unregister connectors
 * - Initialize and disconnect connectors as a group
 * - Periodic health checks
 * - Aggregate data and search across all active connectors
 * - Forward connector events to subscribers
 */
class ConnectorRegistry {
  private connectors = new Map<string, CortexConnector>();
  private healthCache = new Map<string, ConnectorHealth>();
  private eventHandlers = new Set<ConnectorEventHandler>();
  private healthIntervalId: ReturnType<typeof setInterval> | null = null;
  private connectorUnsubscribes = new Map<string, Unsubscribe>();

  // ── Registration ────────────────────────────────────────────

  register(connector: CortexConnector): void {
    if (this.connectors.has(connector.id)) {
      log.warn(`Connector "${connector.id}" is already registered — skipping`);
      return;
    }
    this.connectors.set(connector.id, connector);

    // Forward connector events to registry-level subscribers
    const unsub = connector.on((event) => {
      this.emitEvent(event);
    });
    this.connectorUnsubscribes.set(connector.id, unsub);

    log.info(`Connector registered: ${connector.id}`);
  }

  unregister(connectorId: string): void {
    const connector = this.connectors.get(connectorId);
    if (!connector) {
      log.warn(`Connector "${connectorId}" not found — cannot unregister`);
      return;
    }

    // Clean up event subscription
    const unsub = this.connectorUnsubscribes.get(connectorId);
    if (unsub) {
      unsub();
      this.connectorUnsubscribes.delete(connectorId);
    }

    this.connectors.delete(connectorId);
    this.healthCache.delete(connectorId);
    log.info(`Connector unregistered: ${connectorId}`);
  }

  get(connectorId: string): CortexConnector | undefined {
    return this.connectors.get(connectorId);
  }

  getAll(): CortexConnector[] {
    return Array.from(this.connectors.values());
  }

  getIds(): string[] {
    return Array.from(this.connectors.keys());
  }

  // ── Lifecycle ───────────────────────────────────────────────

  async initializeAll(config?: Partial<ConnectorConfig>): Promise<void> {
    const mergedConfig = { ...DEFAULT_CONFIG, ...config };
    const results = await Promise.allSettled(
      this.getAll().map(async (connector) => {
        try {
          await connector.initialize(mergedConfig);
          log.info(`Connector initialized: ${connector.id}`);
        } catch (err) {
          log.error(`Failed to initialize connector "${connector.id}":`, err);
          throw err;
        }
      })
    );

    const failures = results.filter((r) => r.status === 'rejected');
    if (failures.length > 0) {
      log.warn(`${failures.length}/${results.length} connectors failed to initialize`);
    }
  }

  async disconnectAll(): Promise<void> {
    this.stopHealthChecks();

    await Promise.allSettled(
      this.getAll().map(async (connector) => {
        try {
          await connector.disconnect();
          log.info(`Connector disconnected: ${connector.id}`);
        } catch (err) {
          log.error(`Error disconnecting connector "${connector.id}":`, err);
        }
      })
    );
  }

  // ── Health Checks ───────────────────────────────────────────

  async checkHealth(connectorId: string): Promise<ConnectorHealth> {
    const connector = this.connectors.get(connectorId);
    if (!connector) {
      return { status: 'disconnected', lastCheck: new Date(), message: 'Connector not found' };
    }

    try {
      const health = await connector.healthCheck();
      this.healthCache.set(connectorId, health);
      return health;
    } catch (err) {
      const health: ConnectorHealth = {
        status: 'disconnected',
        lastCheck: new Date(),
        message: err instanceof Error ? err.message : 'Health check failed',
      };
      this.healthCache.set(connectorId, health);
      return health;
    }
  }

  async checkAllHealth(): Promise<Map<string, ConnectorHealth>> {
    await Promise.allSettled(
      this.getIds().map((id) => this.checkHealth(id))
    );
    return new Map(this.healthCache);
  }

  getCachedHealth(connectorId: string): ConnectorHealth | undefined {
    return this.healthCache.get(connectorId);
  }

  startHealthChecks(intervalMs = 30_000): void {
    this.stopHealthChecks();
    this.healthIntervalId = setInterval(() => {
      this.checkAllHealth().catch((err) => {
        log.error('Periodic health check failed:', err);
      });
    }, intervalMs);
    log.info(`Health checks started (every ${intervalMs}ms)`);
  }

  stopHealthChecks(): void {
    if (this.healthIntervalId) {
      clearInterval(this.healthIntervalId);
      this.healthIntervalId = null;
      log.info('Health checks stopped');
    }
  }

  // ── Aggregated Data ─────────────────────────────────────────

  async fetchAllItems(options: FetchOptions): Promise<NormalizedItem[]> {
    const results = await Promise.allSettled(
      this.getAll()
        .filter((c) => c.getAuthStatus() === 'authenticated')
        .map((c) => c.fetchItems(options))
    );

    const items: NormalizedItem[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        items.push(...result.value);
      }
    }

    // Sort by timestamp descending (newest first)
    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return items;
  }

  async searchAll(query: string, options?: SearchOptions): Promise<NormalizedItem[]> {
    const targetConnectors = options?.sourceApps
      ? this.getAll().filter((c) => options.sourceApps!.includes(c.id))
      : this.getAll();

    const authenticated = targetConnectors.filter(
      (c) => c.getAuthStatus() === 'authenticated'
    );

    const results = await Promise.allSettled(
      authenticated.map((c) => c.search(query, options))
    );

    const items: NormalizedItem[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        items.push(...result.value);
      }
    }

    items.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return items;
  }

  // ── Events ──────────────────────────────────────────────────

  onEvent(handler: ConnectorEventHandler): Unsubscribe {
    this.eventHandlers.add(handler);
    return () => {
      this.eventHandlers.delete(handler);
    };
  }

  private emitEvent(event: ConnectorEvent): void {
    for (const handler of this.eventHandlers) {
      try {
        handler(event);
      } catch (err) {
        log.error('Error in connector event handler:', err);
      }
    }
  }
}

/** Singleton registry instance — import this from anywhere */
export const connectorRegistry = new ConnectorRegistry();
