import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { NormalizedItem } from '../../shared/types';
import { useNotificationStore, type InboxFilter } from '../stores/notificationStore';

/**
 * Fetches the list of authenticated connectors, then fetches items from each.
 * Merges all NormalizedItems into a single chronological feed, sorted newest first.
 * Applies client-side filtering based on the current inbox filter.
 */
export function useUnifiedFeed() {
  const filter = useNotificationStore((s) => s.filter);

  const connectorsQuery = useQuery({
    queryKey: ['connectors', 'list'],
    queryFn: () => window.cortex.connector.list(),
    staleTime: 30_000,
  });

  const authenticatedIds = useMemo(() => {
    if (!connectorsQuery.data) return [];
    return connectorsQuery.data
      .filter((c) => c.authStatus === 'authenticated')
      .map((c) => c.id);
  }, [connectorsQuery.data]);

  const itemsQuery = useQuery({
    queryKey: ['unified-feed', 'items', authenticatedIds],
    queryFn: async () => {
      if (authenticatedIds.length === 0) return [];

      const results = await Promise.allSettled(
        authenticatedIds.map((id) =>
          window.cortex.connector.fetchItems(id, { limit: 50 })
        )
      );

      const allItems: NormalizedItem[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allItems.push(...result.value);
        }
      }

      // Sort newest first
      allItems.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      return allItems;
    },
    enabled: authenticatedIds.length > 0,
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  const items = itemsQuery.data ?? [];

  const filtered = useMemo(() => applyFilter(items, filter), [items, filter]);

  const counts = useMemo(
    () => ({
      all: items.length,
      unread: items.filter((i) => i.unread).length,
      priority: items.filter((i) => i.priority === 'high').length,
    }),
    [items]
  );

  return {
    items: filtered,
    counts,
    isLoading: connectorsQuery.isLoading || itemsQuery.isLoading,
    isError: connectorsQuery.isError || itemsQuery.isError,
    isEmpty: authenticatedIds.length === 0,
    refetch: itemsQuery.refetch,
  };
}

function applyFilter(items: NormalizedItem[], filter: InboxFilter): NormalizedItem[] {
  switch (filter) {
    case 'unread':
      return items.filter((i) => i.unread);
    case 'priority':
      return items.filter((i) => i.priority === 'high');
    default:
      return items;
  }
}
