import { isIP } from "node:net";

export const DEFAULT_LISTEN_IP = "127.0.0.1";
export const DEFAULT_PORT = 3000;

export type ListenEnv = {
  LISTEN_IP?: string;
  PORT?: string;
};

export type ListenConfig = {
  hostname: string;
  port: number;
};

export function resolveListenConfig(env: ListenEnv): ListenConfig {
  return {
    hostname: parseListenIp(env.LISTEN_IP),
    port: parseListenPort(env.PORT)
  };
}

export function formatListenUrl({ hostname, port }: ListenConfig) {
  const host = hostname.includes(":") ? `[${hostname}]` : hostname;

  return `http://${host}:${port}`;
}

function parseListenIp(value: string | undefined) {
  const candidate = value?.trim();

  if (!candidate || !isIP(candidate)) {
    return DEFAULT_LISTEN_IP;
  }

  return candidate;
}

function parseListenPort(value: string | undefined) {
  if (!value) return DEFAULT_PORT;

  const port = Number(value);
  return Number.isInteger(port) && port > 0 && port <= 65535 ? port : DEFAULT_PORT;
}
