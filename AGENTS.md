# AGENTS.md

Keep this file current. Any change to routes, env vars, startup log, test layout, commands, or observable behavior must update `AGENTS.md` in the same change.

## Entry points
- Main entry: `src/index.ts`
- App/bootstrap: `src/app.ts`
- Deep modules: `src/listen-config.ts`, `src/request-validator.ts`, `src/render-open-page.ts`, `src/obsidian-link.ts`
- Transmute modules: `src/transmute.ts`, `src/render-transmute-page.ts`, `src/render-transmute-result-page.ts`, `src/json-response.ts`

## Commands
- Dev: `bun run dev` or `bun run --watch src/index.ts`
- Tests: `bun test`
- Focused test: `bun test test/<file>.test.ts`

## Language

**Open**:
The Obsidian launch surface.
_Avoid_: Transmute

**Transmute**:
The URL-conversion surface where a user pastes one `obsidian://open?vault=...&file=...` URL and receives the matching `http://.../open?vault=...&file=...` URL.
_Avoid_: Converter, transform page

## Relationships

- **Open** and **Transmute** are separate surfaces
- **Transmute** accepts one pasted `obsidian://open?vault=...&file=...` URL and returns the matching `http://.../open?vault=...&file=...` URL
- **Transmute** uses `GET` to render a minimal form and `POST` with `application/x-www-form-urlencoded` to convert input
- **Transmute** uses the current request origin as the base for the returned `http` URL
- **Transmute** returns minimal HTML on success and JSON error responses on failure

## Example dialogue

> **Dev:** "Does **Transmute** also open Obsidian?"
> **Domain expert:** "No. **Open** is for Obsidian; **Transmute** only converts URLs."

## Flagged ambiguities

- "URL content" means one pasted `obsidian://open?vault=...&file=...` URL, not arbitrary text.

## Feature
- **Core /open handoff (#2)**: `GET /open?vault=...&file=...` validates a vault-relative note path and returns a minimal HTML handoff that opens Obsidian.
- **Open request guardrails (#3)**: `GET /` is a plain health check, and `/open` rejects missing, empty, duplicate, extra, or absolute `file` values instead of guessing.
- **Runtime bind and health check (#4)**: the server binds from `LISTEN_IP` and `PORT` with safe defaults, and startup logs the exact listen URL.
- **Transmute URL conversion (#6)**: `GET /transmute` shows a minimal paste form; `POST /transmute` trims one pasted `obsidian://open?vault=...&file=...` URL, validates it with the same strict contract, and returns the matching local `http://.../open?...` URL with a copy button, a return link, and JSON errors on failure.

## Contract
- Public route: `GET /open?vault=...&file=...`
- Only `vault` and `file`; reject missing, empty, duplicate, extra, or leading `/` in `file`
- `GET /` returns plain `ok`
- Other methods on `/` or `/open` return `405` + `Allow: GET`
- Success response: minimal HTML, `location.href` to `obsidian://open?...`, visible fallback `<a>`, `Cache-Control: no-store`
- Do not use `302` or `meta refresh`
- Public route: `GET /transmute` and `POST /transmute`
- `GET /transmute` returns minimal paste form
- `POST /transmute` accepts `application/x-www-form-urlencoded` field `url`
- `POST /transmute` trims input, accepts only `obsidian://open?vault=...&file=...`, and returns `400` JSON errors with `{ "error": "..." }`
- `POST /transmute` success returns minimal HTML with copy action, back link, `Cache-Control: no-store`, and the matching `http://.../open?vault=...&file=...` URL from the current request origin
- Other methods on `/transmute` return `405` + `Allow: GET, POST`

## Runtime
- `LISTEN_IP` default `127.0.0.1`
- `PORT` default `3000`
- Invalid env values fall back to defaults
- `.env.example` mirrors the default env contract
- Startup log must be exact: `Listening on http://IP:port`

## Workflow
- Tests live in `test/`
- Prefer executable sources of truth over prose
- If you add or change commands, update `README.md` and `package.json` together

## ADR

### ADR-001: Stable local jump surface
- 状态: Accepted
- 日期: 2026-05-01
- 背景: Need one reusable local `http` link that can open Obsidian without changing link shape later.
- 决策: Keep `GET /open?vault=...&file=...` as the public entry.
- 备选方案: `302` redirect to `obsidian://...`.
- 决策原因: HTML handoff is more stable for protocol links and still leaves room for a future web UI.
- 后果: Route stays fixed; future page layers can grow on top of the same link format.

### ADR-002: Small Obsidian-shaped query contract
- 状态: Accepted
- 日期: 2026-05-01
- 背景: Need link format close to Obsidian copy-link shape and easy to reuse.
- 决策: Accept only `vault` and `file`; treat `file` as raw relative vault path; reject leading `/`.
- 备选方案: Support extra Obsidian params or path normalization.
- 决策原因: Smaller contract, fewer ambiguities, less future churn.
- 后果: Phase 1 stays narrow and predictable.

### ADR-003: Strict validation and simple errors
- 状态: Accepted
- 日期: 2026-05-01
- 背景: Need broken links to fail fast and clearly.
- 决策: Reject missing, empty, duplicate, or extra params with `400 Bad Request`; `GET /` returns `ok`; other methods on `/` or `/open` return `405` with `Allow: GET`.
- 备选方案: Accept partial input or infer defaults.
- 决策原因: No guessing, no ambiguity, no hidden behavior.
- 后果: Callers must send exact input.

### ADR-004: HTML handoff over redirect
- 状态: Accepted
- 日期: 2026-05-01
- 背景: Browser handling of custom protocols is fragile when driven by server redirects.
- 决策: Success returns minimal HTML that uses `location.href` to open `obsidian://open?...` and keeps a visible `<a>` fallback.
- 备选方案: `302` or `meta refresh`.
- 决策原因: Client-side handoff is easier to control and easier to extend later.
- 后果: Page can later grow into a real web view without changing route shape.

### ADR-005: No cache for jump page
- 状态: Accepted
- 日期: 2026-05-01
- 背景: Jump page should always reflect current request and avoid stale reuse.
- 决策: Send `Cache-Control: no-store` on success.
- 备选方案: Default caching.
- 决策原因: Avoid stale protocol handoff behavior.
- 后果: Browser and intermediaries should not reuse the page.

### ADR-006: Local-only runtime contract
- 状态: Accepted
- 日期: 2026-05-01
- 背景: Service is for local Obsidian launches, not public hosting.
- 决策: Bind from `LISTEN_IP` and `PORT`, default `127.0.0.1:3000`; invalid env values fall back to defaults; startup log must be `Listening on http://IP:port`.
- 备选方案: Hardcode host/port or fail on invalid env.
- 决策原因: Easy local use, safe default bind, clear startup signal.
- 后果: Deployment can override env, but safe defaults stay local.

### ADR-007: Separate inverse transmute surface
- 状态: Accepted
- 日期: 2026-05-03
- 背景: Need a reverse flow that turns Obsidian copy links back into reusable local HTTP links without changing the stable `/open` surface.
- 决策: Add a dedicated `GET /transmute` + `POST /transmute` surface instead of overloading `/open`.
- 备选方案: Add a mode flag to `/open` or fold both directions into the same route.
- 决策原因: Keeps the launch surface stable, makes the inverse flow explicit, and avoids coupling the two contracts.
- 后果: `/open` and `/transmute` can evolve independently, and the transmute page can own its own copy button and error presentation.

### ADR-008: Use request origin for transmute output
- 状态: Accepted
- 日期: 2026-05-03
- 背景: A transmuted link should work from whichever local address or host the user actually reached the app through.
- 决策: Build the returned local `/open` URL from the current request origin, not from a separate configured base URL.
- 备选方案: Hardcode `LISTEN_IP:PORT` or add a distinct public base URL setting.
- 决策原因: The copied link matches the visible browser address and automatically follows proxies, host aliases, and non-default ports.
- 后果: The success page reflects the real access origin rather than a separate deployment setting.

### ADR-009: Terse transmute error contract
- 状态: Accepted
- 日期: 2026-05-06
- 背景: The reverse surface needs stable machine-readable failures without forcing the UI or tests to parse prose.
- 决策: `POST /transmute` returns HTTP `400` for all conversion failures and emits only `{ "error": "..." }` using the fixed codes `invalid_url`, `unsupported_protocol`, `missing_vault`, `missing_file`, and `invalid_query`.
- 备选方案: Use `422` for semantic failures, include human-readable messages, or expose richer error payloads.
- 决策原因: Keeps the browser flow simple and makes failures easy to assert in tests and UIs.
- 后果: Callers can branch on the error code alone, and the surface stays terse and predictable.
