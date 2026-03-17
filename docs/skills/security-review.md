# Skill: Security Review

Before any release or after adding a new integration, verify all items:

## Authentication & Tokens

- [ ] All OAuth tokens in macOS Keychain via Keytar (never files, env, or SQLite)
- [ ] Token refresh implemented with retry logic
- [ ] Tokens scoped to minimum required permissions
- [ ] Revocation works cleanly (user can disconnect integration)
- [ ] No tokens in logs, error messages, or crash reports

## Data Privacy

- [ ] PII stripper runs before ANY cloud AI API call
- [ ] Audit log captures every cloud API request
- [ ] Local cache auto-purges data older than retention window (default 7 days)
- [ ] No user data in analytics/telemetry
- [ ] User can export and delete all local data

## Electron Security

- [ ] nodeIntegration DISABLED in all renderer windows
- [ ] contextIsolation ENABLED
- [ ] webSecurity ENABLED
- [ ] Content Security Policy headers set
- [ ] No eval() or Function constructor
- [ ] Webviews use partition for session isolation
- [ ] preload scripts use contextBridge for safe IPC

## Network

- [ ] All API calls use HTTPS
- [ ] OAuth redirect server binds to localhost only
- [ ] No sensitive data in URL parameters

## Supply Chain

- [ ] `npm audit` shows zero critical/high vulnerabilities
- [ ] Lock file committed
- [ ] Electron version current (no known CVEs)

Flag failures as CRITICAL (blocks release) or WARNING (fix soon).
