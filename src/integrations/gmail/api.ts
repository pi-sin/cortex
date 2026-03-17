import log from 'electron-log';
import { GmailAuth } from './auth';
import type {
  GmailMessage,
  GmailMessageListResponse,
  GmailProfile,
  GmailSearchResponse,
  GmailModifyRequest,
  GmailModifyResponse,
} from './types';
import { GMAIL_API, GMAIL_LABELS } from './types';

const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;

export class GmailApiClient {
  constructor(private auth: GmailAuth) {}

  /** GET /users/me/profile */
  async getProfile(): Promise<GmailProfile> {
    return this.request<GmailProfile>('/users/me/profile');
  }

  /** GET /users/me/messages — list message IDs from inbox */
  async listMessages(options: {
    maxResults?: number;
    pageToken?: string;
    query?: string;
    labelIds?: string[];
  } = {}): Promise<GmailMessageListResponse> {
    const params = new URLSearchParams();
    if (options.maxResults) params.set('maxResults', String(options.maxResults));
    if (options.pageToken) params.set('pageToken', options.pageToken);
    if (options.query) params.set('q', options.query);
    if (options.labelIds) {
      for (const label of options.labelIds) {
        params.append('labelIds', label);
      }
    }

    const qs = params.toString();
    const path = `/users/me/messages${qs ? `?${qs}` : ''}`;
    return this.request<GmailMessageListResponse>(path);
  }

  /** GET /users/me/messages/{id} — full message with payload */
  async getMessage(messageId: string, format: 'full' | 'metadata' | 'minimal' = 'full'): Promise<GmailMessage> {
    return this.request<GmailMessage>(`/users/me/messages/${messageId}?format=${format}`);
  }

  /** Batch-fetch multiple messages */
  async getMessages(messageIds: string[], format: 'full' | 'metadata' | 'minimal' = 'metadata'): Promise<GmailMessage[]> {
    const results = await Promise.allSettled(
      messageIds.map((id) => this.getMessage(id, format))
    );

    const messages: GmailMessage[] = [];
    for (const result of results) {
      if (result.status === 'fulfilled') {
        messages.push(result.value);
      } else {
        log.warn('Gmail: Failed to fetch a message', result.reason);
      }
    }
    return messages;
  }

  /** POST /users/me/messages/{id}/modify — add/remove labels */
  async modifyMessage(messageId: string, modification: GmailModifyRequest): Promise<GmailModifyResponse> {
    return this.request<GmailModifyResponse>(
      `/users/me/messages/${messageId}/modify`,
      {
        method: 'POST',
        body: JSON.stringify(modification),
      }
    );
  }

  /** Mark message as read */
  async markAsRead(messageId: string): Promise<GmailModifyResponse> {
    return this.modifyMessage(messageId, {
      removeLabelIds: [GMAIL_LABELS.UNREAD],
    });
  }

  /** Archive message (remove INBOX label) */
  async archiveMessage(messageId: string): Promise<GmailModifyResponse> {
    return this.modifyMessage(messageId, {
      removeLabelIds: [GMAIL_LABELS.INBOX],
    });
  }

  /** Star a message */
  async starMessage(messageId: string): Promise<GmailModifyResponse> {
    return this.modifyMessage(messageId, {
      addLabelIds: [GMAIL_LABELS.STARRED],
    });
  }

  /** Search messages */
  async searchMessages(query: string, maxResults = 20): Promise<GmailSearchResponse> {
    const params = new URLSearchParams({
      q: query,
      maxResults: String(maxResults),
    });
    return this.request<GmailSearchResponse>(`/users/me/messages?${params.toString()}`);
  }

  /** Core HTTP request method with exponential backoff for rate limits */
  private async request<T>(path: string, init?: RequestInit, retryCount = 0): Promise<T> {
    const accessToken = await this.auth.getAccessToken();
    const url = `${GMAIL_API.BASE}${path}`;

    const response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        ...init?.headers,
      },
    });

    if (response.ok) {
      return (await response.json()) as T;
    }

    // Rate limit — retry with exponential backoff
    if (response.status === 429 && retryCount < MAX_RETRIES) {
      const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, retryCount);
      const jitter = Math.random() * backoffMs * 0.1;
      const waitMs = backoffMs + jitter;
      log.warn(`Gmail: Rate limited, retrying in ${Math.round(waitMs)}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);
      await sleep(waitMs);
      return this.request<T>(path, init, retryCount + 1);
    }

    // 401 — try refreshing token once, then retry
    if (response.status === 401 && retryCount === 0) {
      log.warn('Gmail: 401 received, attempting token refresh');
      const refreshResult = await this.auth.refresh();
      if (refreshResult.success) {
        return this.request<T>(path, init, retryCount + 1);
      }
    }

    // Server errors — retry with backoff
    if (response.status >= 500 && retryCount < MAX_RETRIES) {
      const backoffMs = INITIAL_BACKOFF_MS * Math.pow(2, retryCount);
      log.warn(`Gmail: Server error ${response.status}, retrying in ${backoffMs}ms`);
      await sleep(backoffMs);
      return this.request<T>(path, init, retryCount + 1);
    }

    const errorBody = await response.text();
    log.error(`Gmail API error: ${response.status} ${response.statusText}`, errorBody);
    throw new GmailApiError(response.status, `Gmail API ${response.status}: ${response.statusText}`, errorBody);
  }
}

export class GmailApiError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly responseBody: string
  ) {
    super(message);
    this.name = 'GmailApiError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
