# Skill: Performance Audit

When auditing performance, check these areas in order:

## 1. Electron Memory

- Active BrowserViews should be ≤3 at any time
- Background webviews must be hibernated (about:blank)
- Check `process.memoryUsage()` in main process
- Target: <400MB idle, <800MB with 3 integrations active

## 2. React Rendering

- Check for unnecessary re-renders (React DevTools Profiler)
- Memoize expensive computations (useMemo/useCallback)
- Widget grid should NOT re-render on every feed update
- Virtualize lists with 50+ items (@tanstack/react-virtual)

## 3. API & Network

- Check React Query staleTime/cacheTime — are we over-fetching?
- WebSocket connections need heartbeat/keepalive
- Batch API requests where possible
- Detect duplicate requests to same endpoint

## 4. SQLite

- Run `EXPLAIN QUERY PLAN` on slow queries
- WAL mode must be enabled for concurrent reads
- Batch inserts with transactions

## 5. Bundle Size

- Target: <150MB app bundle (before ONNX models)
- Tree-shake unused dependencies
- Compress ONNX models

For each issue: describe the problem with evidence, provide the fix with code, estimate expected improvement.
