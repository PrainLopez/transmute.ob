# AGENTS.md

Keep this file current. Any change to routes, env vars, runtime, startup behavior, test layout, commands, or observable behavior must update `AGENTS.md` in the same change.

## Current Baseline

- The checked-in source still reflects the Bun/Elysia era implementation and its contract tests.
- The target rewrite is Cloudflare Workers + Hono.
- Treat Bun-specific runtime wiring as migration scaffolding, not the end state.

## Project Vocabulary

**Open**:
The Obsidian launch surface.
Avoid: Transmute, converter, transform page.

**Transmute**:
The browser-side URL-conversion surface where a user pastes one `obsidian://open?vault=...&file=...` URL and the page rewrites it into the matching `http://.../open?vault=...&file=...` URL in the browser.
Avoid: Converter, transform page.

## Relationships

- Open and Transmute are separate surfaces.
- Transmute accepts one pasted `obsidian://open?vault=...&file=...` URL and returns the matching local `http://.../open?vault=...&file=...` URL.
- Transmute uses `GET` to render a minimal browser-side page that converts input in the browser.
- Transmute uses the current request origin as the base for the returned `http` URL.
- Transmute keeps copy action, back link, copy-failure hint, and validation errors client-side; no `POST /transmute`.

## Public Contract

- `GET /` returns plain `ok`.
- `GET /open?vault=...&file=...` is the public Obsidian launch route.
- `GET /open` first requires exactly one `vault` and exactly one `file`, then rejects vaults outside `VAULT_ALLOWLIST`, then rejects a leading `/` in `file`.
- `GET /open` returns `403` with `{"error":"forbidden_vault"}` for vaults not in `VAULT_ALLOWLIST`.
- `GET /open` returns minimal HTML, uses `location.href` to open `obsidian://open?...`, keeps a visible `<a>` fallback, and sends `Cache-Control: no-store` on success.
- `GET /transmute` returns a minimal browser-side conversion page with `Cache-Control: no-store`.
- `GET /transmute` accepts one pasted `obsidian://open?vault=...&file=...` URL, trims input, validates it in the browser, and builds the matching local `http://.../open?vault=...&file=...` URL from the current request origin.
- The Transmute page shows copy action, return link, inline copy-failure feedback, and validation errors using fixed codes `invalid_url`, `unsupported_protocol`, `missing_vault`, `missing_file`, and `invalid_query`.
- Undeclared methods on `/` or `/open` fall through to the framework default response.
- Do not use `302` or `meta refresh`.

## Workers Rewrite Decisions

- The deployment target is Cloudflare Workers.
- Use Hono as the HTTP adapter/router.
- Expose a Worker-style `fetch` entry point.
- Keep an app factory so tests can inject request-scoped bindings.
- Read `VAULT_ALLOWLIST` from request bindings on each request.
- Keep `VAULT_ALLOWLIST` as the only runtime configuration.
- Do not keep `LISTEN_IP`, `PORT`, or a local bind/startup log in the target architecture.
- Do not keep Bun as the runtime or test runner in the target architecture.
- Use `vitest` with `@cloudflare/vitest-pool-workers` for tests.
- Keep the Open validator and Transmute browser parser as separate implementations.
- Keep page rendering as string templates, not JSX.
- Keep core logic in deep modules with small, testable interfaces.

## Entry Points

- Main Worker entry: `src/index.ts`
- App/bootstrap: `src/app.ts`
- Deep modules: `src/request-validator.ts`, `src/transmute.ts`, `src/obsidian-link.ts`, `src/vault-allowlist.ts`, `src/json-response.ts`, `src/render-open-page.ts`, `src/render-transmute-page.ts`, `src/render-transmute-result-page.ts`
- Legacy-only runtime helper to remove during the rewrite: `src/listen-config.ts` and any Bun startup wiring

## Commands

- Target dev: `wrangler dev`
- Target tests: `vitest`
- Keep `README.md` and `package.json` in sync with any command changes.

## Testing Decisions

- Good tests cover external behavior only: status codes, headers, bodies, route fallthrough, and generated URLs.
- Good tests do not assert Hono internals or private helper control flow.
- Test the worker entry point and route behavior under a Workers-native test environment.
- Test Open request validation as a contract: valid requests, missing/empty/duplicate/extra parameters, allowlist rejection, and file-path rejection.
- Test Transmute page output and browser-side conversion behavior as observable HTML and generated URLs.
- Test the deep modules that encode business rules: allowlist parsing, request validation, Obsidian URL construction, and HTML rendering.
- Keep the existing contract tests as prior art, but port them to the Workers-native test stack.
- Add smoke coverage for default method fallthrough on `/` and `/open`.
- Add coverage for current-origin URL construction used by Transmute.

## Workflow

- Prefer executable sources of truth over prose.
- Update this file whenever routes, env vars, startup behavior, commands, or observable behavior change.
- If you add or change commands, update `README.md` and `package.json` together.

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
- 决策: Reject missing, empty, duplicate, or extra params with `400 Bad Request`; `GET /` returns `ok`; undeclared methods on `/` or `/open` use the framework default response.
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
- 状态: Superseded
- 日期: 2026-05-01
- 背景: The service originally targeted a local Bun server.
- 决策: This runtime model is replaced by the Workers-first rewrite.
- 备选方案: Keep `LISTEN_IP` and `PORT` with a Bun server.
- 决策原因: Cloudflare Workers is now the deployment target.
- 后果: Do not extend this runtime model; remove it during the rewrite.

### ADR-007: Separate inverse transmute surface
- 状态: Accepted
- 日期: 2026-05-03
- 背景: Need a reverse flow that turns Obsidian copy links back into reusable local HTTP links without changing the stable `/open` surface.
- 决策: Add a dedicated `GET /transmute` page instead of overloading `/open`.
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
- 状态: Superseded
- 日期: 2026-05-06
- 背景: The reverse surface needs stable machine-readable failures without forcing the UI or tests to parse prose.
- 决策: `POST /transmute` returned HTTP `400` for all conversion failures and emitted only `{ "error": "..." }` using the fixed codes `invalid_url`, `unsupported_protocol`, `missing_vault`, `missing_file`, and `invalid_query`.
- 备选方案: Use `422` for semantic failures, include human-readable messages, or expose richer error payloads.
- 决策原因: Kept the browser flow simple and made failures easy to assert in tests and UIs.
- 后果: Historical note only; current `/transmute` is GET-only and does not use this POST contract.

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

### ADR-012: Separate parser implementations
- 状态: Accepted
- 日期: 2026-05-07
- 背景: `Open` validation and `Transmute` browser parsing live on opposite sides of the request boundary and serve different execution environments.
- 决策: Keep the server-side validator and the browser-side parser as separate implementations; do not factor them into a shared parser module or bundle.
- 备选方案: Share one parser across server and browser to keep both paths identical.
- 决策原因: Each surface can stay small and native to its runtime, and the two implementations can evolve independently as long as their observable contracts stay aligned.
- 后果: Some drift is acceptable if tests and docs continue to pin the public behavior.

### ADR-013: Workers-first runtime on Hono
- 状态: Accepted
- 日期: 2026-05-14
- 背景: The app must deploy on Cloudflare Workers while keeping the HTTP contract frozen.
- 决策: Use Hono as the Workers router, expose a Worker-style `fetch` entry point, inject request-scoped bindings through the app factory, and move testing to `vitest` plus `@cloudflare/vitest-pool-workers`.
- 备选方案: Keep the Bun/Elysia runtime or retain Bun as the test runner.
- 决策原因: This aligns the implementation, deployment, and tests with the target runtime.
- 后果: Bun-specific runtime wiring should be removed during the rewrite.

### ADR-014: String-template rendering only
- 状态: Accepted
- 日期: 2026-05-14
- 背景: The pages are small and the contract is already pinned by HTML output.
- 决策: Keep page rendering as string templates instead of introducing JSX or a component layer.
- 备选方案: Add `hono/jsx` components for page fragments.
- 决策原因: This minimizes rewrite churn and keeps the observable HTML easy to preserve.
- 后果: Reuse should come from deep helpers, not from a component hierarchy.

### ADR-015: Request-scoped allowlist
- 状态: Accepted
- 日期: 2026-05-14
- 背景: The allowlist should vary cleanly per request and per test case in Workers.
- 决策: Resolve `VAULT_ALLOWLIST` from `c.env` on each request instead of caching it globally.
- 备选方案: Parse and cache the allowlist once at module load.
- 决策原因: Request-scoped resolution matches Workers bindings and keeps tests isolated.
- 后果: The app factory stays simple and environment-driven.
