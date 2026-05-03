# AGENTS.md

Keep this file current. Any change to routes, env vars, startup log, test layout, commands, or observable behavior must update `AGENTS.md` in the same change.

## Entry points
- Main entry: `src/index.ts`
- App/bootstrap: `src/app.ts`
- Deep modules: `src/listen-config.ts`, `src/request-validator.ts`, `src/render-open-page.ts`, `src/obsidian-link.ts`

## Commands
- Dev: `bun run dev` or `bun run --watch src/index.ts`
- Tests: `bun test`
- Focused test: `bun test test/<file>.test.ts`

## Contract
- Public route: `GET /open?vault=...&file=...`
- Only `vault` and `file`; reject missing, empty, duplicate, extra, or leading `/` in `file`
- `GET /` returns plain `ok`
- Other methods on `/` or `/open` return `405` + `Allow: GET`
- Success response: minimal HTML, `location.href` to `obsidian://open?...`, visible fallback `<a>`, `Cache-Control: no-store`
- Do not use `302` or `meta refresh`

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
