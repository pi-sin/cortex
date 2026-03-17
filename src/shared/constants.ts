export const APP_NAME = 'Cortex';
export const APP_VERSION = '1.0.0';

export const OAUTH_REDIRECT_PORT = 18247;

export const WINDOW_CONFIG = {
  DEFAULT_WIDTH: 1200,
  DEFAULT_HEIGHT: 800,
  MIN_WIDTH: 900,
  MIN_HEIGHT: 600,
} as const;

export const SIDEBAR_WIDTH = 68;
export const TOPBAR_HEIGHT = 56;
export const RIGHT_PANEL_WIDTH = 320;

export const COLORS = {
  background: '#0D0D0F',
  surface: '#131316',
  surfaceElevated: '#1A1A1E',
  border: '#1E1E23',
  textPrimary: '#E8E8ED',
  textSecondary: '#8E8E93',
  textTertiary: '#636366',
  textMuted: '#46464A',
  accent: '#E8FF47',
  accentSecondary: '#7BF5A5',
} as const;

export const APP_COLORS = {
  gmail: '#EA4335',
  slack: '#4A154B',
  slackBadge: '#E01E5A',
  googleMeet: '#00897B',
  jira: '#0052CC',
  drive: '#FBBC04',
  whatsapp: '#25D366',
  calendar: '#4285F4',
  ai: '#A855F7',
} as const;

export const IPC_CHANNELS = {
  APP_QUIT: 'app:quit',
  APP_MINIMIZE: 'app:minimize',
  APP_MAXIMIZE: 'app:maximize',
  WINDOW_READY: 'window:ready',
} as const;
