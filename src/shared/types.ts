export type AppId = 'inbox' | 'gmail' | 'calendar' | 'slack' | 'jira' | 'drive' | 'whatsapp' | 'dashboard';

export interface AppDefinition {
  id: AppId;
  name: string;
  icon: string;
  color: string;
  available: boolean;
}

export type ConnectorHealth = {
  status: 'connected' | 'degraded' | 'disconnected';
  lastCheck: Date;
  message?: string;
};

export type AuthStatus = 'authenticated' | 'expired' | 'unauthenticated';

export interface AuthResult {
  success: boolean;
  error?: string;
}

export interface NormalizedItem {
  id: string;
  sourceApp: string;
  type: 'message' | 'notification' | 'event' | 'ticket' | 'file';
  title: string;
  preview: string;
  timestamp: Date;
  unread: boolean;
  priority: 'high' | 'medium' | 'low';
  sender?: { name: string; avatar?: string };
  metadata: Record<string, unknown>;
  deepLink: string;
  entities: ExtractedEntity[];
}

export interface ExtractedEntity {
  type: 'ticket' | 'file' | 'person' | 'link';
  value: string;
  sourceApp: string;
}

export interface FetchOptions {
  limit?: number;
  offset?: number;
  since?: Date;
  filter?: string;
}

export interface SearchOptions {
  limit?: number;
  sourceApps?: string[];
}

export type Unsubscribe = () => void;

export interface ConnectorAction {
  id: string;
  label: string;
  icon?: string;
}

export interface ActionResult {
  success: boolean;
  error?: string;
}
