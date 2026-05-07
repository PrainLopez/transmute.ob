import { Elysia } from "elysia";
import {
  formatListenUrl,
  resolveListenConfig,
  type ListenConfig,
  type ListenEnv
} from "./listen-config";
import { validateOpenRequest } from "./request-validator";
import { renderOpenPage } from "./render-open-page";
import { renderTransmuteFormPage } from "./render-transmute-page";
import { resolveVaultAllowlist, type VaultAllowlistEnv } from "./vault-allowlist";

type ListenDeps = {
  env?: ListenEnv;
  logger?: (message: string) => void;
  start?: (config: ListenConfig) => unknown;
};

type AppDeps = {
  env?: VaultAllowlistEnv;
};

export function createApp(deps: AppDeps = {}) {
  const allowedVaults = new Set(resolveVaultAllowlist(deps.env));

  return new Elysia()
    .get("/", () => "ok")
    .get("/open", ({ request }) => handleOpenRequest(request, allowedVaults))
    .get("/transmute", handleTransmuteRequest);
}

export const app = createApp({ env: Bun.env });

function handleOpenRequest(request: Request, allowedVaults: ReadonlySet<string>) {
  const url = new URL(request.url);
  const validated = validateOpenRequest(url, allowedVaults);

  if (validated instanceof Response) {
    return validated;
  }

  const html = renderOpenPage(validated);

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

function handleTransmuteRequest({ request }: { request: Request }) {
  return new Response(renderTransmuteFormPage(), {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

export function listen(deps: ListenDeps = {}) {
  const config = resolveListenConfig(deps.env ?? Bun.env);
  const start = deps.start ?? ((resolvedConfig) => app.listen(resolvedConfig));
  const logger = deps.logger ?? console.log;
  const server = start(config);

  const listenTarget =
    server && typeof server === "object" && "hostname" in server && "port" in server
      ? {
          hostname: String(server.hostname),
          port: Number(server.port)
        }
      : config;

  logger(`Listening on ${formatListenUrl(listenTarget)}`);

  return server;
}
