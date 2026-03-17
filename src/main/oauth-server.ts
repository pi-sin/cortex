import * as http from 'http';
import * as url from 'url';
import log from 'electron-log';
import { OAUTH_REDIRECT_PORT } from '../shared/constants';

type OAuthCallbackHandler = (code: string) => Promise<void>;

let server: http.Server | null = null;
const callbackHandlers = new Map<string, OAuthCallbackHandler>();

const SUCCESS_HTML = `
<!DOCTYPE html>
<html>
<head><title>Cortex</title><style>
  body { font-family: -apple-system, sans-serif; background: #0D0D0F; color: #E8E8ED;
    display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
  .card { text-align: center; padding: 40px; border-radius: 16px; background: #131316; border: 1px solid #1E1E23; }
  h1 { font-size: 18px; margin-bottom: 8px; }
  p { color: #8E8E93; font-size: 14px; }
  .logo { font-size: 32px; margin-bottom: 16px; }
</style></head>
<body>
  <div class="card">
    <div class="logo">&#x2713;</div>
    <h1>Connected to Cortex</h1>
    <p>You can close this tab and return to the app.</p>
  </div>
</body>
</html>
`;

const ERROR_HTML = (message: string) => `
<!DOCTYPE html>
<html>
<head><title>Cortex — Error</title><style>
  body { font-family: -apple-system, sans-serif; background: #0D0D0F; color: #E8E8ED;
    display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
  .card { text-align: center; padding: 40px; border-radius: 16px; background: #131316; border: 1px solid #1E1E23; }
  h1 { font-size: 18px; margin-bottom: 8px; color: #EA4335; }
  p { color: #8E8E93; font-size: 14px; }
</style></head>
<body>
  <div class="card">
    <h1>Authentication Failed</h1>
    <p>${message}</p>
  </div>
</body>
</html>
`;

/** Register a handler for a specific connector's OAuth callback */
export function registerOAuthHandler(connectorId: string, handler: OAuthCallbackHandler): void {
  callbackHandlers.set(connectorId, handler);
  log.info(`OAuth: Handler registered for "${connectorId}"`);
}

/** Remove a handler */
export function unregisterOAuthHandler(connectorId: string): void {
  callbackHandlers.delete(connectorId);
}

/** Start the localhost OAuth callback server */
export function startOAuthServer(): void {
  if (server) {
    log.warn('OAuth: Server already running');
    return;
  }

  server = http.createServer(async (req, res) => {
    if (!req.url) {
      res.writeHead(400);
      res.end('Bad request');
      return;
    }

    const parsed = url.parse(req.url, true);

    if (parsed.pathname !== '/callback') {
      res.writeHead(404);
      res.end('Not found');
      return;
    }

    const code = parsed.query.code;
    const error = parsed.query.error;
    const state = parsed.query.state;

    if (error) {
      log.error(`OAuth: Error from provider: ${String(error)}`);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(ERROR_HTML(String(error)));
      return;
    }

    if (typeof code !== 'string' || !code) {
      log.error('OAuth: Missing authorization code');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(ERROR_HTML('No authorization code received'));
      return;
    }

    // Determine which connector to route to. The `state` param contains the connector ID.
    const connectorId = typeof state === 'string' && state ? state : 'gmail';
    const handler = callbackHandlers.get(connectorId);

    if (!handler) {
      log.error(`OAuth: No handler registered for connector "${connectorId}"`);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(ERROR_HTML(`No handler for "${connectorId}"`));
      return;
    }

    try {
      await handler(code);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(SUCCESS_HTML);
      log.info(`OAuth: Callback handled for "${connectorId}"`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      log.error(`OAuth: Callback handling failed for "${connectorId}"`, err);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(ERROR_HTML(message));
    }
  });

  server.listen(OAUTH_REDIRECT_PORT, '127.0.0.1', () => {
    log.info(`OAuth: Callback server listening on http://127.0.0.1:${OAUTH_REDIRECT_PORT}`);
  });

  server.on('error', (err) => {
    log.error('OAuth: Server error', err);
  });
}

/** Stop the OAuth callback server */
export function stopOAuthServer(): void {
  if (server) {
    server.close();
    server = null;
    log.info('OAuth: Callback server stopped');
  }
}

/** Get the redirect URI for OAuth flows */
export function getOAuthRedirectUri(): string {
  return `http://127.0.0.1:${OAUTH_REDIRECT_PORT}/callback`;
}
