# CLAUDE.md — Cortex: Unified Workspace for macOS

## What is Cortex?

Cortex is a native macOS desktop application (.dmg) that consolidates fragmented work tools — Gmail, Google Calendar, Google Meet, Slack, Jira, Google Drive, and WhatsApp — into a single AI-powered workspace. It is NOT a glorified browser. It differentiates through three core capabilities:

1. **Unified Inbox** — A single chronological feed of notifications and messages from all connected apps, with cross-app search and AI-powered priority ranking.
2. **Interactive Widget Dashboard** — iOS-style glanceable, actionable widgets (Calendar timeline, Mail inbox, Slack channels, Jira board, Drive files, Sticky Notes, Focus Timer, AI Insights, Daily Stats) arranged in a customizable grid.
3. **AI Layer** — Cross-app context intelligence that links related items across services, summarizes activity, drafts smart replies, extracts action items, and surfaces insights.

The app also includes a built-in Sticky Notes / Todos system and a Focus Timer.

---

## Target Platform

- **macOS only** (for now). Ship as a `.dmg` file.
- Minimum macOS version: 13 (Ventura)
- Support both Apple Silicon (arm64) and Intel (x64) via universal binary

---

## Tech Stack

| Layer            | Technology                           | Notes                                                                                                    |
| ---------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Desktop Shell    | **Electron 33+**                     | Multi-webview support for embedded apps; each app gets its own BrowserView with isolated session/cookies |
| UI Framework     | **React 19 + TypeScript**            | Strict TypeScript, no `any` types                                                                        |
| State Management | **Zustand + React Query (TanStack)** | Zustand for UI state, React Query for API data caching                                                   |
| Widget Grid      | **CSS Grid + @dnd-kit/core**         | Drag-and-drop widget reordering with grid snap                                                           |
| Styling          | **Tailwind CSS 4 + CSS Modules**     | Tailwind for utility classes, CSS Modules for widget encapsulation                                       |
| Local Database   | **SQLite via better-sqlite3**        | Widget layouts, user prefs, notification state, cached data                                              |
| Vector Store     | **sqlite-vss**                       | Semantic search across all apps using FAISS-backed vector index                                          |
| Local AI         | **ONNX Runtime (Node.js bindings)**  | Priority scoring, entity extraction — runs on-device, no cloud                                           |
| Cloud AI         | **Anthropic Claude API**             | Cross-app summarization, smart replies, action item extraction                                           |
| Auth & Secrets   | **Keytar (macOS Keychain)**          | All OAuth tokens encrypted at rest in the system keychain                                                |
| OAuth Server     | **Express on localhost**             | Handles OAuth callback redirects during auth flows                                                       |
| Build & Package  | **electron-builder**                 | `.dmg` output for macOS, code signing, notarization                                                      |
| Auto-Update      | **electron-updater**                 | Silent background updates with rollback                                                                  |
| Testing          | **Vitest + Playwright + MSW**        | Unit tests, E2E desktop tests, API mocking                                                               |
| Monorepo         | **Turborepo or npm workspaces**      | Packages: `app`, `integrations`, `widgets`, `ai`, `shared`                                               |

---

## Project Structure

```
cortex/
├── CLAUDE.md                    # This file
├── package.json
├── electron-builder.yml         # macOS build config (.dmg, universal binary)
├── tsconfig.json
├── tailwind.config.ts
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts             # App entry, window management, tray
│   │   ├── ipc.ts               # IPC handlers (main ↔ renderer)
│   │   ├── tray.ts              # System tray icon + menu
│   │   ├── updater.ts           # Auto-update logic
│   │   ├── oauth-server.ts      # Localhost Express for OAuth callbacks
│   │   └── webviews.ts          # BrowserView manager for embedded apps
│   │
│   ├── renderer/                # Electron renderer process (React app)
│   │   ├── App.tsx              # Root component
│   │   ├── index.html
│   │   ├── main.tsx             # React entry
│   │   │
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx          # Left rail app switcher (68px wide)
│   │   │   │   ├── TopBar.tsx           # Header with search, meeting pill, notifications
│   │   │   │   └── RightPanel.tsx       # AI chat + sticky notes panel
│   │   │   │
│   │   │   ├── unified-inbox/
│   │   │   │   ├── UnifiedInbox.tsx     # Cross-app message feed
│   │   │   │   ├── InboxItem.tsx        # Individual message/notification row
│   │   │   │   └── FilterBar.tsx        # All / Unread / Priority filters
│   │   │   │
│   │   │   ├── widgets/
│   │   │   │   ├── WidgetGrid.tsx       # CSS Grid container with dnd-kit
│   │   │   │   ├── WidgetShell.tsx      # Shared widget wrapper (header, icon, badge)
│   │   │   │   ├── CalendarWidget.tsx
│   │   │   │   ├── GmailWidget.tsx
│   │   │   │   ├── SlackWidget.tsx
│   │   │   │   ├── JiraWidget.tsx
│   │   │   │   ├── DriveWidget.tsx
│   │   │   │   ├── WhatsAppWidget.tsx
│   │   │   │   ├── AIInsightsWidget.tsx
│   │   │   │   ├── StickyNotesWidget.tsx
│   │   │   │   ├── FocusTimerWidget.tsx
│   │   │   │   └── DailyStatsWidget.tsx
│   │   │   │
│   │   │   ├── ai/
│   │   │   │   ├── AIChat.tsx           # Right-panel AI conversation
│   │   │   │   └── AIInsightCard.tsx    # Expandable insight with actions
│   │   │   │
│   │   │   └── common/
│   │   │       ├── Badge.tsx
│   │   │       ├── SearchBar.tsx        # Universal search (Cmd+K)
│   │   │       └── MeetingPill.tsx      # Upcoming meeting indicator
│   │   │
│   │   ├── hooks/
│   │   │   ├── useIntegration.ts        # Generic hook for any integration data
│   │   │   ├── useWidgetLayout.ts       # Persist/restore widget grid positions
│   │   │   ├── useUnifiedFeed.ts        # Merge + sort cross-app messages
│   │   │   └── useAI.ts                 # AI query/response management
│   │   │
│   │   ├── stores/
│   │   │   ├── appStore.ts              # Active app, sidebar state (Zustand)
│   │   │   ├── notificationStore.ts     # Unified notification state
│   │   │   └── settingsStore.ts         # User preferences
│   │   │
│   │   └── styles/
│   │       └── globals.css
│   │
│   ├── integrations/                    # Each integration is a plugin
│   │   ├── types.ts                     # CortextConnector interface definition
│   │   ├── gmail/
│   │   │   ├── connector.ts             # Implements CortexConnector
│   │   │   ├── auth.ts                  # Gmail OAuth 2.0 flow
│   │   │   ├── api.ts                   # Gmail API calls
│   │   │   └── types.ts                 # Gmail-specific types
│   │   ├── slack/
│   │   │   ├── connector.ts
│   │   │   ├── auth.ts
│   │   │   ├── websocket.ts             # Slack Socket Mode / RTM
│   │   │   ├── api.ts
│   │   │   └── types.ts
│   │   ├── google-calendar/
│   │   │   ├── connector.ts
│   │   │   ├── auth.ts                  # Shared Google OAuth (same as Gmail)
│   │   │   ├── api.ts
│   │   │   └── types.ts
│   │   ├── jira/
│   │   ├── google-drive/
│   │   └── whatsapp/                    # Phase 3: webview-only initially
│   │
│   ├── ai/
│   │   ├── local/
│   │   │   ├── priority-scorer.ts       # ONNX-based notification ranking
│   │   │   ├── entity-extractor.ts      # NER for ticket IDs, links, names
│   │   │   └── context-linker.ts        # Cross-app entity resolution
│   │   ├── cloud/
│   │   │   ├── anthropic-client.ts      # Claude API wrapper
│   │   │   ├── summarizer.ts            # Cross-app summarization
│   │   │   ├── smart-reply.ts           # Context-aware reply drafting
│   │   │   └── action-extractor.ts      # Extract todos from conversations
│   │   └── privacy/
│   │       ├── pii-stripper.ts          # Remove PII before cloud API calls
│   │       └── audit-log.ts             # Log all AI API requests locally
│   │
│   ├── db/
│   │   ├── database.ts                  # SQLite initialization + migrations
│   │   ├── schemas.ts                   # Table definitions
│   │   └── vector-store.ts              # sqlite-vss semantic search
│   │
│   └── shared/
│       ├── constants.ts
│       ├── types.ts                     # Shared types across all modules
│       └── utils.ts
│
├── assets/
│   ├── icons/                           # App icon (icns for macOS)
│   ├── tray/                            # Tray icon variants
│   └── models/                          # ONNX model files for local AI
│
├── scripts/
│   ├── notarize.ts                      # macOS notarization script
│   └── build-universal.ts               # Universal binary build helper
│
└── tests/
    ├── unit/
    ├── integration/
    └── e2e/
```

---

## CortexConnector Interface

Every integration must implement this interface. This is the most important abstraction in the codebase.

```typescript
interface CortexConnector {
  // Identity
  readonly id: string; // e.g., "gmail", "slack"
  readonly name: string; // e.g., "Gmail", "Slack"
  readonly icon: string; // Icon identifier
  readonly color: string; // Brand color hex

  // Lifecycle
  initialize(): Promise<void>;
  disconnect(): Promise<void>;
  healthCheck(): Promise<ConnectorHealth>;

  // Authentication
  authenticate(): Promise<AuthResult>;
  refreshToken(): Promise<AuthResult>;
  revokeAccess(): Promise<void>;
  getAuthStatus(): AuthStatus;

  // Data
  fetchItems(options: FetchOptions): Promise<NormalizedItem[]>;
  subscribeToUpdates(callback: (items: NormalizedItem[]) => void): Unsubscribe;

  // Actions
  executeAction(action: ConnectorAction): Promise<ActionResult>;
  getSupportedActions(): ConnectorAction[];

  // Search
  search(query: string, options?: SearchOptions): Promise<NormalizedItem[]>;
}

interface NormalizedItem {
  id: string;
  sourceApp: string;
  type: "message" | "notification" | "event" | "ticket" | "file";
  title: string;
  preview: string;
  timestamp: Date;
  unread: boolean;
  priority: "high" | "medium" | "low";
  sender?: { name: string; avatar?: string };
  metadata: Record<string, unknown>; // App-specific data
  deepLink: string; // URL to open in embedded webview
  entities: ExtractedEntity[]; // Ticket IDs, file links, etc.
}
```

---

## UI Design Specifications

### Color Palette (Dark Theme — default)

```
Background:        #0D0D0F
Surface:           #131316
Surface Elevated:  #1A1A1E
Border:            #1E1E23
Text Primary:      #E8E8ED
Text Secondary:    #8E8E93
Text Tertiary:     #636366
Text Muted:        #46464A
Accent (Cortex):   #E8FF47 (electric lime)
Accent Secondary:  #7BF5A5 (mint)
```

### App Brand Colors (for integration indicators)

```
Gmail:       #EA4335
Slack:       #4A154B (badge: #E01E5A)
Google Meet: #00897B
Jira:        #0052CC
Drive:       #FBBC04
WhatsApp:    #25D366
Calendar:    #4285F4
AI/Cortex:   #A855F7 (purple gradient to #6366F1)
```

### Layout

- **Left Sidebar:** 68px wide, dark (#131316). Contains: Cortex logo (38×38, lime-to-mint gradient), app icons (44×44, 12px border-radius), bottom toggles for AI panel and Notes panel.
- **Top Bar:** 56px tall. Contains: current view name (Space Mono, uppercase), universal search bar (Cmd+K), upcoming meeting pill (green pulse dot), notification bell.
- **Main Content:** Flexible. Either Unified Inbox feed, Widget Dashboard grid, or embedded app webview.
- **Right Panel (optional):** 320px wide. AI Chat on top, Sticky Notes on bottom. Toggleable.

### Typography

- **Headings / Labels:** Space Mono (monospace), uppercase, letter-spacing 0.05–0.1em
- **Body / Content:** DM Sans, 12–13px
- **Data / Timestamps:** Space Mono, 9–10px, muted color

### Widget Grid

- 3-column grid layout
- Widget sizes: Small (1×1), Medium (1×1 but taller content), Large (2×1 span)
- 16px gap between widgets
- Widgets have 16px padding, 16px border-radius, #141417 background, 1px #1E1E23 border
- Each widget has: icon badge (22×22, 6px radius) + uppercase app label + optional count badge
- Drag-and-drop reordering with "Customize Widgets" edit mode

---

## Phase 1 Scope (Build This First)

Phase 1 is months 1–4. The goal is a working app with 3 integrations and the unified inbox.

### Month 1: Shell + Gmail

- [ ] Electron app with window management, system tray, and Cmd+Q handling
- [ ] macOS .dmg build pipeline with electron-builder (universal binary)
- [ ] Auto-update with electron-updater
- [ ] SQLite database initialization with better-sqlite3
- [ ] OAuth server on localhost for callback handling
- [ ] Gmail OAuth 2.0 flow with token storage in macOS Keychain (Keytar)
- [ ] Gmail inbox fetch, push notifications (Google Pub/Sub), star/archive/reply actions
- [ ] Left sidebar with app switcher
- [ ] Top bar with search placeholder

### Month 2: Calendar + Slack start

- [ ] Google Calendar integration (shared Google OAuth)
- [ ] Calendar Timeline widget — today's events, join meeting button, reschedule
- [ ] Slack OAuth 2.0 + WebSocket connection (Socket Mode)
- [ ] Slack channel/DM feed, reply, react, mark read

### Month 3: Unified Inbox + Widget Dashboard

- [ ] Unified Inbox: cross-app chronological feed using NormalizedItem
- [ ] Filter bar: All / Unread / Priority
- [ ] Widget Dashboard with CSS Grid + dnd-kit
- [ ] Core widgets: Calendar, Gmail, Slack, Sticky Notes, Daily Stats
- [ ] Widget layout persistence in SQLite

### Month 4: Local AI + Beta

- [ ] ONNX Runtime integration for local AI
- [ ] Priority scoring model (rank notifications by urgency)
- [ ] Entity extraction (ticket IDs, file links, @mentions)
- [ ] Private beta release (.dmg) to 200 users

---

## Key Technical Decisions

1. **Each embedded app (full view) runs in its own Electron BrowserView** with isolated sessions. This prevents cookie/auth leakage between apps. Webviews are lazy-loaded — only the active app's webview is rendered. Background webviews are hibernated to save memory.

2. **OAuth tokens are NEVER stored in plaintext.** All tokens go to macOS Keychain via Keytar. The TokenVault service handles refresh, rotation, and revocation.

3. **The AI privacy pipeline strips PII before any cloud API call.** Names, emails, and account IDs are replaced with placeholder tokens, sent to the Claude API, and restored locally after response. All cloud AI calls are logged locally for user audit.

4. **Widgets communicate with integrations through React Query.** Each widget subscribes to a query key (e.g., `['gmail', 'inbox', { limit: 5 }]`). React Query handles caching, background refetching, and stale-while-revalidate.

5. **The unified feed merges NormalizedItems from all connectors**, sorts by timestamp, and applies the local AI priority scorer to rerank by urgency. This happens in the `useUnifiedFeed` hook.

6. **macOS-specific:** Use native window controls (traffic lights), support dark/light mode via `nativeTheme`, respect system Do Not Disturb for notifications, and register global shortcuts (Cmd+Shift+C to toggle Cortex).

---

## Code Style & Conventions

- **TypeScript strict mode** — no `any`, no implicit returns
- **Functional components only** — no class components
- **Named exports** — no default exports (except for React lazy loading)
- **File naming:** kebab-case for files, PascalCase for components
- **Error handling:** Every async function must have explicit error handling. Never silently swallow errors.
- **Logging:** Use a structured logger (e.g., electron-log) — never `console.log` in production code
- **IPC:** All main ↔ renderer communication goes through typed IPC channels defined in `src/shared/types.ts`
- **Tests:** Every connector must have unit tests for auth flow, data normalization, and action dispatch. Use MSW for API mocking.
- All OAuth tokens → macOS Keychain via Keytar. Never plaintext.
- All integrations implement CortexConnector interface in src/integrations/types.ts
- All cloud AI calls go through src/ai/privacy/pii-stripper.ts first
- Use electron-log for logging. Never console.log in production.
- macOS only. Build target: .dmg universal binary.

---

## Auto-Routing: Read the Right Skill

Before starting any task, check if it matches a category below.
If it does, read the corresponding file in `docs/skills/` BEFORE writing
any code or giving advice. Follow the instructions in that file.

| If the task involves...                             | Read this file first               |
| --------------------------------------------------- | ---------------------------------- |
| Adding a new integration (Gmail, Slack, etc.)       | `docs/skills/add-integration.md`   |
| Building a new widget                               | `docs/skills/add-widget.md`        |
| Adding an AI feature (local or cloud)               | `docs/skills/add-ai-feature.md`    |
| Building .dmg or preparing a release                | `docs/skills/build-dmg.md`         |
| Debugging an integration issue                      | `docs/skills/debug-integration.md` |
| Making a technology choice or architecture decision | `docs/skills/tech-decision.md`     |
| Designing an API, interface, or IPC contract        | `docs/skills/api-design.md`        |
| Performance issues or pre-release optimization      | `docs/skills/performance-audit.md` |
| Security review or handling user data               | `docs/skills/security-review.md`   |
| Speccing or planning a new feature                  | `docs/skills/product-spec.md`      |
| Processing user/beta feedback                       | `docs/skills/user-feedback.md`     |
| Deciding what to build next / prioritization        | `docs/skills/prioritize.md`        |
| Pricing, monetization, or tier design               | `docs/skills/pricing-analysis.md`  |
| Launch planning or growth strategy                  | `docs/skills/gtm-strategy.md`      |
| Fundraising, pitch deck, or investor prep           | `docs/skills/investor-prep.md`     |
| Competitor analysis or market monitoring            | `docs/skills/competitive-watch.md` |

Multiple skills can apply to a single task. Read all relevant ones.

If a task doesn't match any category, proceed normally using the rules above.

## Build & Distribution (macOS Only)

```yaml
# electron-builder.yml
appId: com.cortex.app
productName: Cortex
mac:
  category: public.app-category.productivity
  target:
    - target: dmg
      arch:
        - universal
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: entitlements.plist
  entitlementsInherit: entitlements.plist
dmg:
  sign: false
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications
afterSign: scripts/notarize.ts
```

Required entitlements:

- `com.apple.security.cs.allow-jit` (for ONNX Runtime)
- `com.apple.security.network.client` (for API calls)
- `com.apple.security.keychain-access-groups` (for Keytar)

---

## Environment Variables

```
GOOGLE_CLIENT_ID=           # Google OAuth client ID
GOOGLE_CLIENT_SECRET=       # Google OAuth client secret
SLACK_CLIENT_ID=            # Slack app client ID
SLACK_CLIENT_SECRET=        # Slack app client secret
ANTHROPIC_API_KEY=          # Claude API key for cloud AI features
JIRA_CLIENT_ID=             # Atlassian OAuth client ID (Phase 2)
JIRA_CLIENT_SECRET=         # Atlassian OAuth client secret (Phase 2)
OAUTH_REDIRECT_PORT=18247   # Localhost port for OAuth callbacks
```

Store these in a `.env` file (gitignored). In production, bundle them securely or prompt the user to enter their own API keys.

---

## Important Notes

- **WhatsApp has no official API for personal accounts.** In Phase 3, we'll embed WhatsApp Web as a simple webview — no deep integration. Do NOT attempt to reverse-engineer WhatsApp's protocol.
- **Google Meet has no standalone API.** Meeting data comes from Google Calendar events with `conferenceData`. The "Join Meeting" button simply opens the Meet URL.
- **Rate limits are real.** Gmail allows 250 quota units/second. Slack Tier 3–4 methods have per-minute caps. Always implement exponential backoff and request batching.
- **Memory management matters.** Each Electron BrowserView is a Chromium instance. Limit concurrent active webviews to 2–3. Hibernate background views by setting `webContents` to `about:blank` and restoring on focus.
