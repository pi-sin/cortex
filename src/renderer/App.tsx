import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { RightPanel } from './components/layout/RightPanel';
import { UnifiedInbox } from './components/unified-inbox/UnifiedInbox';
import { useAppStore } from './stores/appStore';
import type { AppId } from '../shared/types';

export function App() {
  const { activeApp, rightPanelOpen } = useAppStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg">
      {/* Left Sidebar */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top Bar */}
        <TopBar />

        {/* Content area */}
        <main className="flex-1 overflow-hidden p-6">
          <MainContent activeApp={activeApp} />
        </main>
      </div>

      {/* Right Panel (toggleable) */}
      {rightPanelOpen && <RightPanel />}
    </div>
  );
}

function MainContent({ activeApp }: { activeApp: AppId }) {
  if (activeApp === 'inbox') {
    return <UnifiedInbox />;
  }

  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #E8FF47, #7BF5A5)' }}
      >
        <span className="font-mono font-bold text-2xl text-bg">C</span>
      </div>
      <h2 className="font-mono text-sm font-bold tracking-widest text-text-primary uppercase">
        {activeApp === 'dashboard' ? 'WIDGET DASHBOARD' : activeApp.toUpperCase()}
      </h2>
      <p className="text-text-muted text-xs max-w-sm text-center">
        {activeApp === 'dashboard'
          ? 'Widget grid coming soon. Connect integrations to see your glanceable widgets here.'
          : 'This integration is not yet connected.'
        }
      </p>
    </div>
  );
}
