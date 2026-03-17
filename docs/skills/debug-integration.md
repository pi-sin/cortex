# Skill: Debug Integration

When troubleshooting an integration issue, follow this systematic ladder:

## Debug Steps (in order)

1. **Auth status:** Is the OAuth token valid? Check Keytar for stored token.
2. **Token expiry:** If expired, does refresh work? Log the refresh response.
3. **API response:** Log the raw HTTP response from the service API. Check status code.
4. **Rate limits:** Check X-RateLimit headers. Are we being throttled?
5. **Data normalization:** Is the raw response correctly mapped to NormalizedItem?
6. **IPC:** Is data flowing from main process to renderer? Log on both sides.
7. **React Query:** Is the query key correct? Check staleTime/cacheTime settings.
8. **WebSocket (if applicable):** Is the connection alive? Check heartbeat/ping frames.

## Logging Convention

Add temporary logs with `[DEBUG:<integration>]` prefix.
Remove ALL debug logging before committing.

## Common Issues by Service

- **Gmail:** Pub/Sub push channel expired (must renew every 7 days)
- **Slack:** WebSocket disconnects silently (implement reconnect with exponential backoff)
- **Calendar:** Timezone mismatch between API response (UTC) and local display
- **Jira:** 3LO token scope insufficient (re-check required scopes in Atlassian console)
- **Drive:** Changes API startPageToken lost after app restart (persist in SQLite)
- **WhatsApp:** Webview session expired (user must re-scan QR code)
