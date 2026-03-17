import { useAppStore } from '../../stores/appStore';

export function TopBar() {
  const activeApp = useAppStore((s) => s.activeApp);

  const viewName = activeApp === 'dashboard' ? 'DASHBOARD' : activeApp.toUpperCase();

  return (
    <header
      className="titlebar-drag flex items-center justify-between px-6 bg-surface border-b border-border select-none"
      style={{ height: 56, minHeight: 56 }}
    >
      {/* Left: macOS traffic light spacing + view name */}
      <div className="flex items-center gap-4">
        {/* Spacer for traffic lights */}
        <div style={{ width: 60 }} />
        <h1
          className="font-mono font-bold text-xs tracking-widest text-text-primary"
          style={{ letterSpacing: '0.1em' }}
        >
          {viewName}
        </h1>
      </div>

      {/* Center: search bar */}
      <div className="titlebar-no-drag flex-1 max-w-md mx-8">
        <div className="flex items-center gap-2 px-3 py-2 bg-surface-elevated rounded-lg border border-border cursor-pointer hover:border-text-muted transition-colors">
          <span className="text-text-muted text-xs">⌘K</span>
          <span className="text-text-muted text-xs">Search across all apps...</span>
        </div>
      </div>

      {/* Right: meeting pill + notification bell */}
      <div className="titlebar-no-drag flex items-center gap-3">
        <MeetingPill />
        <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-elevated transition-colors text-text-secondary">
          <span style={{ fontSize: 16 }}>🔔</span>
        </button>
      </div>
    </header>
  );
}

function MeetingPill() {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-elevated border border-border">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#00897B' }} />
        <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: '#00897B' }} />
      </span>
      <span className="font-mono text-[10px] tracking-wide text-text-secondary">NO MEETINGS</span>
    </div>
  );
}
