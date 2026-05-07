import { describe, expect, test } from "bun:test";
import { app } from "../src/app";

describe("GET /transmute", () => {
  test("returns a browser-side conversion page", async () => {
    const response = await app.handle(new Request("http://localhost/transmute"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("cache-control")).toBe("no-store");

    const html = await response.text();

    expect(html).toContain("Obsidian URL");
    expect(html).toContain('id="paste"');
    expect(html).toContain('id="convert"');
    expect(html).toContain('id="source"');
    expect(html).toContain('id="result"');
    expect(html).toContain('id="copy"');
    expect(html).toContain('id="error"');
    expect(html).toContain('invalid_url');
    expect(html).toContain('unsupported_protocol');
    expect(html).toContain('missing_vault');
    expect(html).toContain('missing_file');
    expect(html).toContain('invalid_query');
    expect(html).toContain('window.location.origin + "/open?vault="');
    expect(html).toContain('navigator.clipboard.writeText');
    expect(html).toContain('copy.dataset.url = openUrl');
  });
});

describe("non-GET /transmute", () => {
  test("uses the framework default response", async () => {
    const response = await app.handle(new Request("http://localhost/transmute", { method: "POST" }));

    expect(response.status).not.toBe(405);
    expect(response.headers.get("allow")).toBeNull();
  });
});
