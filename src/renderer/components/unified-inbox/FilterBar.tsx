import { useNotificationStore, type InboxFilter } from '../../stores/notificationStore';

interface FilterBarProps {
  counts: { all: number; unread: number; priority: number };
}

const filters: Array<{ id: InboxFilter; label: string; countKey: keyof FilterBarProps['counts'] }> = [
  { id: 'all', label: 'ALL', countKey: 'all' },
  { id: 'unread', label: 'UNREAD', countKey: 'unread' },
  { id: 'priority', label: 'PRIORITY', countKey: 'priority' },
];

export function FilterBar({ counts }: FilterBarProps) {
  const { filter, setFilter } = useNotificationStore();

  return (
    <div className="flex items-center gap-1 px-1">
      {filters.map(({ id, label, countKey }) => {
        const isActive = filter === id;
        const count = counts[countKey];

        return (
          <button
            key={id}
            onClick={() => setFilter(id)}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[10px] font-bold
              tracking-widest uppercase transition-colors duration-150
              ${isActive
                ? 'bg-surface-elevated text-text-primary'
                : 'text-text-muted hover:text-text-secondary hover:bg-surface-elevated/50'
              }
            `}
          >
            {label}
            {count > 0 && (
              <span
                className={`
                  min-w-[18px] h-[18px] px-1 rounded-full text-[9px] font-bold
                  flex items-center justify-center
                  ${isActive
                    ? 'bg-accent text-bg'
                    : 'bg-border text-text-tertiary'
                  }
                `}
              >
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
