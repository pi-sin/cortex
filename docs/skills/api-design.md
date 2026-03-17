# Skill: API Design

When designing internal APIs, IPC contracts, or interface extensions:

## Principles

1. **Types first** — Write the TypeScript interface before any implementation. Types ARE documentation.
2. **Make illegal states unrepresentable** — Discriminated unions, not optional fields.
   ```typescript
   // BAD: { status?: string; data?: T; error?: E }
   // GOOD:
   type State<T, E> =
     | { status: "loading" }
     | { status: "ready"; data: T }
     | { status: "error"; error: E };
   ```
3. **Async by default** — Every method touching I/O returns a Promise. Never block main thread.
4. **Errors as values** — Return `Result<T, E>` for predictable failures. Throw only for unexpected errors.
5. **Versioned IPC** — All channel names include version: `cortex:v1:gmail:fetch`

## Naming

- Functions: verb + noun (`fetchInboxItems`, `updateTicketStatus`)
- Types: PascalCase noun (`GmailMessage`, `SlackChannel`)
- Constants: UPPER_SNAKE (`MAX_RETRY_COUNT`, `DEFAULT_POLL_INTERVAL`)
- Events: past tense (`itemsFetched`, `tokenRefreshed`)

## Output

Include JSDoc comments on every method, parameter, and return type. Add usage examples.
