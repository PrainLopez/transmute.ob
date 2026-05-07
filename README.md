## Development
To start the development server run:
```bash
bun run dev
```

Open http://localhost:3000/ with your browser to see the result.

## Open
`Open` is the launch surface.
- `GET /` returns `ok`
- `GET /open?vault=...&file=...` opens Obsidian for allowlisted vaults
- `VAULT_ALLOWLIST` controls which vaults can receive launch links

## Transmute
`Transmute` is the browser-side reverse surface.
- `GET /transmute` accepts one pasted `obsidian://open?vault=...&file=...` URL
- It rewrites that URL in the browser to the matching local `http://.../open?vault=...&file=...` URL
- Copy, errors, and the back link stay client-side; there is no `POST /transmute`

## Env
Copy `.env.example` and set values if needed.

Defaults:
- `LISTEN_IP=127.0.0.1`
- `PORT=3000`
- `VAULT_ALLOWLIST=Personal-Vault,Work-Vault`

## Testing
Tests live in `test/`.

```bash
bun test
```
