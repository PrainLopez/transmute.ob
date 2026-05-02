import { Elysia } from "elysia";
import {
  formatListenUrl,
  resolveListenConfig,
  type ListenConfig,
  type ListenEnv
} from "./listen-config";
import { validateOpenRequest } from "./request-validator";
import { renderOpenPage } from "./render-open-page";

type ListenDeps = {
  env?: ListenEnv;
  logger?: (message: string) => void;
  start?: (config: ListenConfig) => unknown;
};

export const app = new Elysia().all("/", handleRootRequest).all("/open", handleOpenRequest);

function handleRootRequest({ request }: { request: Request }) {
  return request.method === "GET" ? "ok" : methodNotAllowed();
}

function handleOpenRequest({ request }: { request: Request }) {
  if (request.method !== "GET") {
    return methodNotAllowed();
  }

  const url = new URL(request.url);
  const validated = validateOpenRequest(url);

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

function methodNotAllowed() {
  return new Response("Method Not Allowed", {
    status: 405,
    headers: {
      Allow: "GET"
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
