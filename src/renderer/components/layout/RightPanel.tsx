export function RightPanel() {
  return (
    <aside
      className="h-full bg-surface border-l border-border flex flex-col"
      style={{ width: 320, minWidth: 320 }}
    >
      {/* AI Chat section */}
      <div className="flex-1 p-4 border-b border-border">
        <h2 className="font-mono text-[10px] font-bold tracking-widest text-text-muted uppercase mb-3">
          AI ASSISTANT
        </h2>
        <div className="flex items-center justify-center h-32 rounded-lg border border-dashed border-border">
          <p className="text-text-muted text-xs">AI chat coming soon</p>
        </div>
      </div>

      {/* Sticky Notes section */}
      <div className="flex-1 p-4">
        <h2 className="font-mono text-[10px] font-bold tracking-widest text-text-muted uppercase mb-3">
          STICKY NOTES
        </h2>
        <div className="flex items-center justify-center h-32 rounded-lg border border-dashed border-border">
          <p className="text-text-muted text-xs">Notes coming soon</p>
        </div>
      </div>
    </aside>
  );
}
