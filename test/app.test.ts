import { describe, expect, test } from "bun:test";
import { createApp } from "../src/app";

const app = createApp({ env: { VAULT_ALLOWLIST: "Vault" } });

describe("GET /open", () => {
  test("returns handoff HTML for valid vault and file", async () => {
    const response = await app.handle(
      new Request("http://localhost/open?vault=Vault&file=Notes/Today.md")
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("cache-control")).toBe("no-store");

    const html = await response.text();

    expect(html).toContain("location.href");
    expect(html).toContain("obsidian://open?vault=Vault&file=Notes%2FToday.md");
    expect(html).toContain('<a href="obsidian://open?vault=Vault&file=Notes%2FToday.md">');
  });

  test("rejects request without file", async () => {
    const response = await app.handle(new Request("http://localhost/open?vault=Vault"));
    const body = await response.text();

    expect(response.status).toBe(400);
    expect(body).toBe("Bad Request");
    expect(body).not.toContain("obsidian://open");
  });

  test("rejects absolute file path", async () => {
    const response = await app.handle(
      new Request("http://localhost/open?vault=Vault&file=/Notes/Today.md")
    );

    expect(response.status).toBe(400);
  });

  test("rejects request without vault", async () => {
    const response = await app.handle(new Request("http://localhost/open?file=Notes/Today.md"));

    expect(response.status).toBe(400);
  });

  test("rejects empty file value", async () => {
    const response = await app.handle(new Request("http://localhost/open?vault=Vault&file="));

    expect(response.status).toBe(400);
  });

  test("rejects empty vault value", async () => {
    const response = await app.handle(new Request("http://localhost/open?vault=&file=Notes/Today.md"));

    expect(response.status).toBe(400);
  });

  test("rejects extra query params", async () => {
    const response = await app.handle(
      new Request("http://localhost/open?vault=Vault&file=Notes/Today.md&heading=Foo")
    );

    expect(response.status).toBe(400);
  });

  test("rejects duplicate file params", async () => {
    const response = await app.handle(
      new Request("http://localhost/open?vault=Vault&file=Notes/Today.md&file=Notes/Tomorrow.md")
    );

    expect(response.status).toBe(400);
  });
});

describe("GET /", () => {
  test("returns ok", async () => {
    const response = await app.handle(new Request("http://localhost/"));

    expect(response.status).toBe(200);
    expect(await response.text()).toBe("ok");
  });
});

describe("POST /open", () => {
  test("returns method not allowed", async () => {
    const response = await app.handle(
      new Request("http://localhost/open", { method: "POST" })
    );

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET");
  });
});

describe("POST /", () => {
  test("returns method not allowed", async () => {
    const response = await app.handle(new Request("http://localhost/", { method: "POST" }));

    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("GET");
  });
});
