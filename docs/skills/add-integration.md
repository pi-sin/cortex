# Skill: Add Integration

When adding a new service integration to Cortex, follow these rules:

## File Structure

Create the folder at `src/integrations/<service-name>/` with these files:

- `connector.ts` — implements CortexConnector interface from `src/integrations/types.ts`
- `auth.ts` — OAuth 2.0 flow specific to this service
- `api.ts` — API client with typed request/response
- `types.ts` — service-specific TypeScript types

## Requirements

1. Every connector MUST implement the full CortexConnector interface
2. Auth: OAuth 2.0 with token storage via Keytar (macOS Keychain)
3. All API responses MUST be normalized into NormalizedItem format
4. Implement exponential backoff for rate-limited endpoints
5. Add unit tests in `tests/unit/integrations/<service-name>/`
6. Use MSW for API mocking in tests
7. Register the connector in `src/integrations/registry.ts`
8. Log all auth events and API errors via electron-log

## Do NOT

- Store tokens in plaintext or localStorage
- Use `any` types
- Skip error handling on async functions
- Hardcode API endpoints (use constants)
- Skip rate limit handling

## Service-Specific Notes

- **Gmail:** Push notifications require Google Cloud Pub/Sub setup. Renew push channel every 7 days.
- **Slack:** Use Socket Mode for WebSocket. Requires Slack App creation and review.
- **Google Calendar:** Shares OAuth with Gmail. Meeting data comes from `conferenceData` field.
- **Jira:** Atlassian 3-legged OAuth is complex. Webhook registration requires Jira admin access.
- **Google Drive:** Changes API requires startPageToken management. Store token in SQLite.
- **WhatsApp:** NO deep integration. Webview embed only. Do NOT reverse-engineer their protocol.
