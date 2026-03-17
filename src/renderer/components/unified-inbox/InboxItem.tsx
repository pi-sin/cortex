import type { NormalizedItem } from '../../../shared/types';
import { formatRelativeTime, truncate } from '../../../shared/utils';
import { APP_COLORS } from '../../../shared/constants';

interface InboxItemProps {
  item: NormalizedItem;
  onMarkRead?: (id: string) => void;
  onArchive?: (id: string) => void;
}

const appColorMap: Record<string, string> = {
  gmail: APP_COLORS.gmail,
  slack: APP_COLORS.slackBadge,
  calendar: APP_COLORS.calendar,
  jira: APP_COLORS.jira,
  drive: APP_COLORS.drive,
  whatsapp: APP_COLORS.whatsapp,
};

const appLabelMap: Record<string, string> = {
  gmail: 'GMAIL',
  slack: 'SLACK',
  calendar: 'CAL',
  jira: 'JIRA',
  drive: 'DRIVE',
  whatsapp: 'WA',
};

const priorityDotColor: Record<string, string> = {
  high: '#EA4335',
  medium: '#FBBC04',
  low: 'transparent',
};

export function InboxItem({ item, onMarkRead, onArchive }: InboxItemProps) {
  const appColor = appColorMap[item.sourceApp] ?? '#8E8E93';
  const appLabel = appLabelMap[item.sourceApp] ?? item.sourceApp.toUpperCase();
  const timestamp = typeof item.timestamp === 'string'
    ? new Date(item.timestamp)
    : item.timestamp;
  const senderInitial = item.sender?.name?.charAt(0)?.toUpperCase() ?? '?';

  return (
    <div
      className={`
        group flex items-start gap-3 px-4 py-3 border-b border-border
        transition-colors duration-100 cursor-pointer
        hover:bg-surface-elevated/60
        ${item.unread ? 'bg-surface' : ''}
      `}
    >
      {/* App color indicator bar */}
      <div className="flex flex-col items-center gap-1.5 pt-0.5 shrink-0">
        <div
          className="w-1 h-8 rounded-full"
          style={{ backgroundColor: appColor }}
        />
        {item.priority !== 'low' && (
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: priorityDotColor[item.priority] }}
          />
        )}
      </div>

      {/* Sender avatar */}
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: appColor + '22' }}
      >
        {item.sender?.avatar ? (
          <img
            src={item.sender.avatar}
            alt={item.sender.name}
            className="w-8 h-8 rounded-lg object-cover"
          />
        ) : (
          <span
            className="font-mono font-bold text-xs"
            style={{ color: appColor }}
          >
            {senderInitial}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {/* App badge */}
          <span
            className="font-mono text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded"
            style={{ backgroundColor: appColor + '1A', color: appColor }}
          >
            {appLabel}
          </span>

          {/* Sender name */}
          {item.sender?.name && (
            <span className={`text-xs truncate ${item.unread ? 'font-semibold text-text-primary' : 'text-text-secondary'}`}>
              {item.sender.name}
            </span>
          )}

          {/* Timestamp */}
          <span className="font-mono text-[9px] text-text-muted ml-auto shrink-0">
            {formatRelativeTime(timestamp)}
          </span>
        </div>

        {/* Title */}
        <p className={`text-[12.5px] leading-snug mb-0.5 truncate ${item.unread ? 'font-medium text-text-primary' : 'text-text-secondary'}`}>
          {item.title}
        </p>

        {/* Preview */}
        <p className="text-xs text-text-muted leading-snug truncate">
          {truncate(item.preview, 120)}
        </p>
      </div>

      {/* Hover actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-1">
        {item.unread && onMarkRead && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkRead(item.id); }}
            className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
            title="Mark as read"
          >
            <span className="text-xs">✓</span>
          </button>
        )}
        {onArchive && (
          <button
            onClick={(e) => { e.stopPropagation(); onArchive(item.id); }}
            className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
            title="Archive"
          >
            <span className="text-xs">⤓</span>
          </button>
        )}
      </div>
    </div>
  );
}
