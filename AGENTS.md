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
The URL-conversion surface where a user pastes one `obsidian://open?vault=...&file=...` URL and the page rewrites it into the matching `http://.../open?vault=...&file=...` URL in browser.
_Avoid_: Converter, transform page

## Relationships

- **Open** and **Transmute** are separate surfaces
- **Transmute** accepts one pasted `obsidian://open?vault=...&file=...` URL and returns the matching `http://.../open?vault=...&file=...` URL
- **Transmute** uses `GET` to render a minimal browser-side page that converts input in browser
- **Transmute** uses the current request origin as the base for the returned `http` URL
- **Transmute** keeps copy action, back link, and validation errors client-side; no `POST /transmute`

## Example dialogue

> **Dev:** "Does **Transmute** also open Obsidian?"
> **Domain expert:** "No. **Open** is for Obsidian; **Transmute** only converts URLs."

## Flagged ambiguities

- "URL content" means one pasted `obsidian://open?vault=...&file=...` URL, not arbitrary text.

## Feature
- **Core /open handoff (#2)**: `GET /open?vault=...&file=...` first checks for exactly one `vault` and exactly one `file`, then rejects vaults outside `VAULT_ALLOWLIST`, then validates the vault-relative note path, and returns a minimal HTML handoff that opens Obsidian.
- **Open request guardrails (#3)**: `GET /` is a plain health check, and `/open` rejects missing, empty, duplicate, extra, forbidden vault, or absolute `file` values instead of guessing.
- **Runtime bind and health check (#4)**: the server binds from `LISTEN_IP` and `PORT` with safe defaults, `VAULT_ALLOWLIST` fails closed when empty or missing, and startup logs the exact listen URL.
- **Transmute URL conversion (#6)**: `GET /transmute` shows a minimal browser-side conversion page; the browser trims one pasted `obsidian://open?vault=...&file=...` URL, validates it with the same strict contract, and returns the matching local `http://.../open?...` URL with a copy button, a return link, and inline errors.

## Contract
- Public route: `GET /open?vault=...&file=...`
- Only `vault` and `file`; first reject missing, empty, duplicate, or extra params by requiring exactly one `vault` and exactly one `file`, then reject forbidden vaults, then reject leading `/` in `file`
- `VAULT_ALLOWLIST` is a comma-separated env var; trim entries, drop empties, dedupe, and fail closed when missing or empty
- `/open` returns `403` with `{"error":"forbidden_vault"}` for vaults not in `VAULT_ALLOWLIST`
- `GET /` returns plain `ok`
- Other methods on `/` or `/open` return `405` + `Allow: GET`
- Success response: minimal HTML, `location.href` to `obsidian://open?...`, visible fallback `<a>`, `Cache-Control: no-store`
- Do not use `302` or `meta refresh`
- Public route: `GET /transmute`
- `GET /transmute` returns a minimal browser-side conversion page with `Cache-Control: no-store`
- The page accepts one pasted `obsidian://open?vault=...&file=...` URL, trims input, validates it in browser, and builds the matching local `http://.../open?vault=...&file=...` URL from the current request origin
- The page shows copy action, return link, and inline errors using fixed codes `invalid_url`, `unsupported_protocol`, `missing_vault`, `missing_file`, and `invalid_query`
- Other methods on `/transmute` return `405` + `Allow: GET`

## Runtime
- `LISTEN_IP` default `127.0.0.1`
- `PORT` default `3000`
- `VAULT_ALLOWLIST` comma-separated; trim entries, drop empties, dedupe, and empty/missing means no vaults allowed
- Invalid `LISTEN_IP` or `PORT` values fall back to defaults
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

### ADR-010: Vault allowlist gate
- 状态: Accepted
- 日期: 2026-05-07
- 背景: `Open` needs a hard boundary so only approved vaults can receive local launch links.
- 决策: Read `VAULT_ALLOWLIST` as a comma-separated list, trim entries, drop empties, dedupe, match vaults exactly and case-sensitively, fail closed when empty or missing, and return `403 {"error":"forbidden_vault"}` for disallowed vaults. This check runs after exact `vault`/`file` shape validation and before `file` syntax validation.
- 备选方案: Normalize vault names, infer allowlist from current vault, or allow empty env.
- 决策原因: Explicit allowlist is safer than guessing and keeps `/open` narrow.
- 后果: Deploys must configure allowed vaults before launch links work.

### ADR-011: Browser-side transmute page
- 状态: Accepted
- 日期: 2026-05-07
- 背景: The reverse surface should stay a single GET page without a server conversion POST or shared parser bundle.
- 决策: Serve `GET /transmute` as a minimal browser-side page that parses one pasted Obsidian URL with native browser APIs, builds the local `http://.../open?...` link from the current page origin, and handles copy/error UI client-side.
- 备选方案: Keep `POST /transmute`, or share parser code between server and browser.
- 决策原因: Fewer round trips, smaller surface, and no shared parser in the browser bundle.
- 后果: `/transmute` is GET-only, and all conversion feedback lives in the page.
