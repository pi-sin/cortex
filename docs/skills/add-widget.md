# Skill: Add Widget

When building a new widget for the Cortex dashboard, follow these rules:

## File Location

Create at `src/renderer/components/widgets/<Name>Widget.tsx`

## Structure

1. Use WidgetShell as the wrapper component (provides header, icon, badge)
2. Must be a functional React component with TypeScript
3. Consume data via React Query hooks (useQuery/useMutation)
4. Register in `src/renderer/components/widgets/widget-registry.ts`
5. Add to default grid layout in `src/renderer/hooks/useWidgetLayout.ts`

## Size Variants

- **Small (1×1):** 3 items max, glanceable data (files, chats, stats)
- **Medium (1×1 tall):** 4-5 items, actionable list (emails, tickets, channels)
- **Large (2×1 span):** Timeline or expanded view (calendar, AI insights)

## Dark Theme Styling

- Background: #141417
- Border: 1px solid #1E1E23, border-radius: 16px
- Padding: 16px
- Text primary: #E8E8ED / Secondary: #8E8E93 / Muted: #46464A
- Headings: Space Mono, uppercase, letter-spacing 0.05-0.1em
- Body: DM Sans, 12-13px
- Timestamps: Space Mono, 9-10px, #46464A

## Interaction Rules

- All interactions work INLINE — users should NOT leave the dashboard
- Include loading skeleton and error states
- Clickable items need hover state (background: #18181B)
- Action buttons use the app's brand color as background

## Widget Shell Props

Each widget header has: icon (22×22, 6px radius) + uppercase app label + optional count badge

Widget size guidelines:

- Small: 3 items max, glanceable data (files, chats, stats)
- Medium: 4-5 items, actionable list (emails, tickets, channels)
- Large: timeline or expanded view (calendar, AI insights)
