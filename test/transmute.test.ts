import { describe, expect, test } from "bun:test";
import { app } from "../src/app";

describe("GET /transmute", () => {
  test("returns minimal paste form", async () => {
    const response = await app.handle(new Request("http://localhost/transmute"));

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");

    const html = await response.text();

    expect(html).toContain('<form method="post" action="/transmute">');
    expect(html).toContain('name="url"');
  });
});

describe("POST /transmute", () => {
  test("returns copyable local open link for valid obsidian url", async () => {
    const response = await app.handle(
      new Request("http://127.0.0.1:4321/transmute", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          url: "obsidian://open?vault=My Vault&file=Notes/Today.md"
        })
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("cache-control")).toBe("no-store");

    const html = await response.text();

    expect(html).toContain('navigator.clipboard.writeText');
    expect(html).toContain('id="copy"');
    expect(html).toContain('data-url="http://127.0.0.1:4321/open?vault=My%20Vault&amp;file=Notes%2FToday.md"');
    expect(html).toContain('href="http://127.0.0.1:4321/open?vault=My%20Vault&amp;file=Notes%2FToday.md"');
    expect(html).toContain('http://127.0.0.1:4321/open?vault=My%20Vault&amp;file=Notes%2FToday.md');
    expect(html).toContain('<a href="/transmute">Back</a>');
    expect(html).toContain('id="copy-failure"');
    expect(html).toContain('hint.hidden = false');
    expect(html).not.toContain("location.href");
  });

  test("returns stable json errors for invalid input", async () => {
    const cases = [
      { url: "   ", error: "invalid_url" },
      { url: "http://example.com/open?vault=Vault&file=Notes/Today.md", error: "unsupported_protocol" },
      { url: "obsidian://open?file=Notes/Today.md", error: "missing_vault" },
      { url: "obsidian://open?vault=Vault", error: "missing_file" },
      { url: "obsidian://open?vault=Vault&file=/Notes/Today.md", error: "invalid_query" },
      {
        url: "obsidian://open/path?vault=Vault&file=Notes/Today.md",
        error: "invalid_query"
      },
      {
        url: "obsidian://open?vault=Vault&file=Notes/Today.md&heading=Foo",
        error: "invalid_query"
      },
      {
        url: "obsidian://open?vault=Vault&file=Notes/Today.md&file=Notes/Tomorrow.md",
        error: "invalid_query"
      }
    ];

    for (const { url, error } of cases) {
      const response = await app.handle(
        new Request("http://localhost/transmute", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ url })
        })
      );

      expect(response.status).toBe(400);
      expect(response.headers.get("content-type")).toContain("application/json");
      expect(await response.json()).toEqual({ error });
    }
  });

  test("rejects non form encoded input with invalid_url", async () => {
    const response = await app.handle(
      new Request("http://localhost/transmute", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "obsidian://open?vault=Vault&file=Notes/Today.md"
      })
    );

    expect(response.status).toBe(400);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ error: "invalid_url" });
  });
});

describe("PUT /transmute", () => {
  test("returns method not allowed", async () => {
    const response = await app.handle(new Request("http://localhost/transmute", { method: "PUT" }));

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET, POST");
  });
});
