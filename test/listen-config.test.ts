import { describe, expect, test } from "bun:test";
import {
  DEFAULT_LISTEN_IP,
  DEFAULT_PORT,
  formatListenUrl,
  resolveListenConfig
} from "../src/listen-config";

describe("resolveListenConfig", () => {
  test("defaults to 127.0.0.1:3000", () => {
    expect(resolveListenConfig({})).toEqual({
      hostname: DEFAULT_LISTEN_IP,
      port: DEFAULT_PORT
    });
  });

  test("uses valid env values", () => {
    expect(resolveListenConfig({ LISTEN_IP: "0.0.0.0", PORT: "8080" })).toEqual({
      hostname: "0.0.0.0",
      port: 8080
    });
  });

  test("falls back on invalid env values", () => {
    expect(resolveListenConfig({ LISTEN_IP: "bad-ip", PORT: "99999" })).toEqual({
      hostname: DEFAULT_LISTEN_IP,
      port: DEFAULT_PORT
    });
  });
});

describe("formatListenUrl", () => {
  test("renders actual listen url", () => {
    expect(formatListenUrl({ hostname: "127.0.0.1", port: 3000 })).toBe(
      "http://127.0.0.1:3000"
    );
  });

  test("wraps ipv6 host in brackets", () => {
    expect(formatListenUrl({ hostname: "::1", port: 3000 })).toBe("http://[::1]:3000");
  });
});
