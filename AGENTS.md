# AGENTS.md

This repo is a small Bun + Elysia service for local Obsidian jumps. It serves a stable `http` link, validates `vault` and `file`, then returns HTML that opens `obsidian://open?...` on same machine.

- Fresh `bun create elysia` repo.
- Main entry: `src/index.ts`.
- Dev: `bun run dev` / `bun run --watch src/index.ts`.
- No real test suite yet. `bun test` / `npm test` not useful product checks.
- Goal: local Obsidian jump service. Stable public link: `GET /open?vault=...&file=...`.
- Only `vault` + `file`. No extra Obsidian params in phase 1.
- `file` stay raw relative path. Reject missing, empty, dup, extra, or leading `/`.
- Success: minimal HTML, `location.href` auto-jump to `obsidian://open?...`, keep fallback `<a>`.
- Do not use `302` or `meta refresh` for protocol handoff.
- `GET /` = plain `ok` health check.
- `GET /open` only. Others `405` + `Allow: GET`.
- Success response `Cache-Control: no-store`.
- Bind via env: `LISTEN_IP` default `127.0.0.1`, `PORT` default `3000`.
- Invalid env values fall back to defaults.
- Startup log exact listen URL: `Listening on http://IP:port`.
- Deep modules: link builder, request validator, response renderer / route bootstrap.
- Tests should target external behavior, esp link builder + validator.
- If add/change commands, update `README.md` and `package.json` together.
