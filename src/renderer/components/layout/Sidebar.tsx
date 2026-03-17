import { useAppStore } from '../../stores/appStore';
import type { AppId, AppDefinition } from '../../../shared/types';

const apps: AppDefinition[] = [
  { id: 'dashboard', name: 'Dashboard', icon: '⊞', color: '#E8FF47', available: true },
  { id: 'inbox', name: 'Inbox', icon: '✉', color: '#E8E8ED', available: true },
  { id: 'gmail', name: 'Gmail', icon: 'M', color: '#EA4335', available: false },
  { id: 'calendar', name: 'Calendar', icon: '▦', color: '#4285F4', available: false },
  { id: 'slack', name: 'Slack', icon: '#', color: '#4A154B', available: false },
  { id: 'jira', name: 'Jira', icon: '◈', color: '#0052CC', available: false },
  { id: 'drive', name: 'Drive', icon: '△', color: '#FBBC04', available: false },
  { id: 'whatsapp', name: 'WhatsApp', icon: '☎', color: '#25D366', available: false },
];

export function Sidebar() {
  const { activeApp, setActiveApp, toggleRightPanel } = useAppStore();

  return (
    <aside className="flex flex-col items-center h-full bg-surface py-4 select-none"
      style={{ width: 68, minWidth: 68 }}
    >
      {/* Logo */}
      <div className="mb-6 flex items-center justify-center" style={{ width: 38, height: 38 }}>
        <div
          className="w-full h-full rounded-lg flex items-center justify-center font-mono font-bold text-sm text-bg"
          style={{ background: 'linear-gradient(135deg, #E8FF47, #7BF5A5)' }}
        >
          C
        </div>
      </div>

      {/* App icons */}
      <nav className="flex flex-col items-center gap-2 flex-1">
        {apps.map((appDef) => (
          <SidebarIcon
            key={appDef.id}
            app={appDef}
            isActive={activeApp === appDef.id}
            onClick={() => setActiveApp(appDef.id)}
          />
        ))}
      </nav>

      {/* Bottom toggles */}
      <div className="flex flex-col items-center gap-2 mt-auto">
        <button
          onClick={toggleRightPanel}
          className="w-11 h-11 rounded-xl flex items-center justify-center text-text-secondary hover:bg-surface-elevated transition-colors"
          title="AI Panel"
        >
          <span style={{ fontSize: 18 }}>✦</span>
        </button>
      </div>
    </aside>
  );
}

function SidebarIcon({ app, isActive, onClick }: {
  app: AppDefinition;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`
        w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150
        ${isActive
          ? 'bg-surface-elevated ring-1 ring-border'
          : 'hover:bg-surface-elevated opacity-60 hover:opacity-100'
        }
        ${!app.available && app.id !== 'dashboard' && app.id !== 'inbox' ? 'opacity-30 cursor-not-allowed' : ''}
      `}
      title={app.name}
      disabled={!app.available}
      style={{
        color: isActive ? app.color : undefined,
        borderRadius: 12,
      }}
    >
      <span className="font-mono font-bold text-sm">{app.icon}</span>
    </button>
  );
}
