import { shell } from 'electron';
import * as keytar from 'keytar';
import log from 'electron-log';
import type { AuthResult, AuthStatus } from '../types';
import type { GmailTokens, GmailTokenResponse } from './types';
import { GMAIL_SCOPES, GMAIL_API } from './types';

const KEYCHAIN_SERVICE = 'com.cortex.gmail';
const KEYCHAIN_ACCOUNT = 'oauth-tokens';

function getClientId(): string {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id) throw new Error('GOOGLE_CLIENT_ID environment variable is not set');
  return id;
}

function getClientSecret(): string {
  const secret = process.env.GOOGLE_CLIENT_SECRET;
  if (!secret) throw new Error('GOOGLE_CLIENT_SECRET environment variable is not set');
  return secret;
}

export class GmailAuth {
  private tokens: GmailTokens | null = null;
  private redirectUri = '';

  setRedirectUri(uri: string): void {
    this.redirectUri = uri;
  }

  /** Load tokens from macOS Keychain into memory */
  async loadStoredTokens(): Promise<boolean> {
    try {
      const stored = await keytar.getPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT);
      if (!stored) {
        log.info('Gmail: No stored tokens found in Keychain');
        return false;
      }
      this.tokens = JSON.parse(stored) as GmailTokens;

      if (this.isExpired()) {
        log.info('Gmail: Stored tokens expired, will need refresh');
      }
      return true;
    } catch (err) {
      log.error('Gmail: Failed to load tokens from Keychain', err);
      return false;
    }
  }

  /** Build the Google OAuth consent URL and open it in the default browser */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: getClientId(),
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: GMAIL_SCOPES.join(' '),
      access_type: 'offline',
      prompt: 'consent',
    });
    return `${GMAIL_API.AUTH}?${params.toString()}`;
  }

  async openAuthWindow(): Promise<void> {
    const url = this.getAuthUrl();
    log.info('Gmail: Opening OAuth consent URL');
    await shell.openExternal(url);
  }

  /** Exchange the authorization code for tokens */
  async exchangeCode(code: string): Promise<AuthResult> {
    try {
      const body = new URLSearchParams({
        code,
        client_id: getClientId(),
        client_secret: getClientSecret(),
        redirect_uri: this.redirectUri,
        grant_type: 'authorization_code',
      });

      const response = await fetch(GMAIL_API.TOKEN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) {
        const errText = await response.text();
        log.error('Gmail: Token exchange failed', errText);
        return { success: false, error: `Token exchange failed: ${response.status}` };
      }

      const data = (await response.json()) as GmailTokenResponse;

      this.tokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? '',
        expiresAt: Date.now() + data.expires_in * 1000,
      };

      await this.saveTokens();
      log.info('Gmail: OAuth tokens obtained and stored');
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error during code exchange';
      log.error('Gmail: Code exchange error', err);
      return { success: false, error: message };
    }
  }

  /** Refresh the access token using the stored refresh token */
  async refresh(): Promise<AuthResult> {
    if (!this.tokens?.refreshToken) {
      log.error('Gmail: No refresh token available');
      return { success: false, error: 'No refresh token available' };
    }

    try {
      const body = new URLSearchParams({
        client_id: getClientId(),
        client_secret: getClientSecret(),
        refresh_token: this.tokens.refreshToken,
        grant_type: 'refresh_token',
      });

      const response = await fetch(GMAIL_API.TOKEN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      });

      if (!response.ok) {
        const errText = await response.text();
        log.error('Gmail: Token refresh failed', errText);
        return { success: false, error: `Token refresh failed: ${response.status}` };
      }

      const data = (await response.json()) as GmailTokenResponse;

      this.tokens = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? this.tokens.refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000,
      };

      await this.saveTokens();
      log.info('Gmail: Access token refreshed');
      return { success: true };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error during token refresh';
      log.error('Gmail: Token refresh error', err);
      return { success: false, error: message };
    }
  }

  /** Revoke tokens with Google and delete from Keychain */
  async revoke(): Promise<void> {
    if (this.tokens?.accessToken) {
      try {
        await fetch(`${GMAIL_API.REVOKE}?token=${this.tokens.accessToken}`, {
          method: 'POST',
        });
        log.info('Gmail: Token revoked with Google');
      } catch (err) {
        log.error('Gmail: Failed to revoke token with Google', err);
      }
    }

    await keytar.deletePassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT);
    this.tokens = null;
    log.info('Gmail: Tokens cleared from Keychain');
  }

  /** Get a valid access token, refreshing if needed */
  async getAccessToken(): Promise<string> {
    if (!this.tokens) {
      throw new Error('Gmail: Not authenticated');
    }

    if (this.isExpired()) {
      const result = await this.refresh();
      if (!result.success) {
        throw new Error(`Gmail: Token refresh failed — ${result.error}`);
      }
    }

    return this.tokens.accessToken;
  }

  getStatus(): AuthStatus {
    if (!this.tokens) return 'unauthenticated';
    if (this.isExpired() && !this.tokens.refreshToken) return 'expired';
    return 'authenticated';
  }

  private isExpired(): boolean {
    if (!this.tokens) return true;
    // Treat as expired 5 minutes before actual expiry
    return Date.now() >= this.tokens.expiresAt - 5 * 60 * 1000;
  }

  private async saveTokens(): Promise<void> {
    if (!this.tokens) return;
    try {
      await keytar.setPassword(KEYCHAIN_SERVICE, KEYCHAIN_ACCOUNT, JSON.stringify(this.tokens));
    } catch (err) {
      log.error('Gmail: Failed to save tokens to Keychain', err);
      throw err;
    }
  }
}
