import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useUnifiedFeed } from '../../hooks/useUnifiedFeed';
import { FilterBar } from './FilterBar';
import { InboxItem } from './InboxItem';

export function UnifiedInbox() {
  const { items, counts, isLoading, isError, isEmpty, refetch } = useUnifiedFeed();
  const queryClient = useQueryClient();

  const markReadMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      await window.cortex.connector.executeAction(item.sourceApp, `markRead:${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-feed'] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (itemId: string) => {
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      await window.cortex.connector.executeAction(item.sourceApp, `archive:${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unified-feed'] });
    },
  });

  // Empty state — no connectors authenticated
  if (isEmpty && !isLoading) {
    return <EmptyState type="no-connectors" />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pb-4">
        <FilterBar counts={counts} />
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="font-mono text-[10px] tracking-wider text-text-muted hover:text-text-secondary transition-colors disabled:opacity-40"
        >
          {isLoading ? 'SYNCING…' : 'REFRESH'}
        </button>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto">
        {isLoading && items.length === 0 && <LoadingSkeleton />}

        {isError && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <span className="text-text-muted text-sm">Failed to load feed</span>
            <button
              onClick={() => refetch()}
              className="font-mono text-[10px] tracking-wider text-accent hover:underline"
            >
              RETRY
            </button>
          </div>
        )}

        {!isLoading && !isError && items.length === 0 && (
          <EmptyState type="no-items" />
        )}

        {items.map((item) => (
          <InboxItem
            key={`${item.sourceApp}-${item.id}`}
            item={item}
            onMarkRead={(id) => markReadMutation.mutate(id)}
            onArchive={(id) => archiveMutation.mutate(id)}
          />
        ))}
      </div>
    </div>
  );
}

function EmptyState({ type }: { type: 'no-connectors' | 'no-items' }) {
  if (type === 'no-connectors') {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3">
        <div className="w-12 h-12 rounded-2xl bg-surface-elevated flex items-center justify-center">
          <span className="text-xl text-text-muted">✉</span>
        </div>
        <h3 className="font-mono text-xs font-bold tracking-widest text-text-secondary uppercase">
          NO INTEGRATIONS CONNECTED
        </h3>
        <p className="text-text-muted text-xs max-w-xs text-center leading-relaxed">
          Connect Gmail, Slack, or other apps from the sidebar to see your unified feed here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-2">
      <span className="text-text-muted text-sm">No messages match this filter</span>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 px-4 py-3 border-b border-border animate-pulse">
          <div className="w-1 h-8 rounded-full bg-surface-elevated" />
          <div className="w-8 h-8 rounded-lg bg-surface-elevated" />
          <div className="flex-1 space-y-2">
            <div className="flex gap-2">
              <div className="w-12 h-3 rounded bg-surface-elevated" />
              <div className="w-24 h-3 rounded bg-surface-elevated" />
            </div>
            <div className="w-3/4 h-3 rounded bg-surface-elevated" />
            <div className="w-1/2 h-2.5 rounded bg-surface-elevated" />
          </div>
        </div>
      ))}
    </div>
  );
}
