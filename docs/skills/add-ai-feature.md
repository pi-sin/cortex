# Add AI Feature

Create a new AI feature for: $ARGUMENTS

Determine if this is LOCAL or CLOUD:

# Skill: Add AI Feature

When adding an AI capability to Cortex, first determine if it's LOCAL or CLOUD.

## LOCAL Features (on-device, no data leaves machine)

- Place in `src/ai/local/`
- Use ONNX Runtime Node.js bindings
- Model files go in `assets/models/`
- Must work fully offline
- Examples: priority scoring, entity extraction, context linking

## CLOUD Features (calls Anthropic Claude API)

- Place in `src/ai/cloud/`
- ALL data MUST pass through `src/ai/privacy/pii-stripper.ts` before API call
- Strip names, emails, account IDs → replace with placeholder tokens
- Restore tokens locally after receiving response
- Log every API request in `src/ai/privacy/audit-log.ts`
- Use the client wrapper at `src/ai/cloud/anthropic-client.ts`
- Handle API errors gracefully — never crash if API is down
- Cache responses to avoid duplicate API calls
- Respect user's privacy tier (local-only / anonymized / full-context)
- Examples: summarization, smart replies, action item extraction

## Model Selection

- Default: claude-sonnet-4-20250514 (good balance of speed and quality)
- Fast/cheap tasks: claude-haiku-4-5-20251001
- Never use Opus for real-time features — too slow and expensive

## Privacy Tiers

- **Tier 1 (Local Only):** No data leaves machine. ONNX Runtime only.
- **Tier 2 (Anonymized):** PII stripped before cloud call. Default for most users.
- **Tier 3 (Full Context):** Raw data sent. Enterprise opt-in only with DPA.
