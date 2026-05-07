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
import { jsonError } from "./json-response";
import { buildTransmuteOpenUrl, parseTransmuteInput } from "./transmute";
import { renderTransmuteResultPage } from "./render-transmute-result-page";
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
    .all("/", handleRootRequest)
    .all("/open", ({ request }) => handleOpenRequest(request, allowedVaults))
    .all("/transmute", handleTransmuteRequest);
}

export const app = createApp({ env: Bun.env });

function handleRootRequest({ request }: { request: Request }) {
  return request.method === "GET" ? "ok" : methodNotAllowed(["GET"]);
}

function handleOpenRequest(request: Request, allowedVaults: ReadonlySet<string>) {
  if (request.method !== "GET") {
    return methodNotAllowed(["GET"]);
  }

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
  if (request.method === "GET") {
    return new Response(renderTransmuteFormPage(), {
      headers: {
        "Content-Type": "text/html; charset=utf-8"
      }
    });
  }

  if (request.method !== "POST") {
    return methodNotAllowed(["GET", "POST"]);
  }

  return request
    .formData()
    .then((formData) => {
      const value = formData.get("url");

      if (typeof value !== "string") {
        return jsonError(400, "invalid_url");
      }

      const parsed = parseTransmuteInput(value);

      if ("error" in parsed) {
        return jsonError(400, parsed.error);
      }

      const openUrl = buildTransmuteOpenUrl(request.url, parsed);

      return new Response(renderTransmuteResultPage({ openUrl }), {
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store"
        }
      });
    })
    .catch(() => jsonError(400, "invalid_url"));
}

function methodNotAllowed(allow: string[]) {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: {
      Allow: allow.join(", ")
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
