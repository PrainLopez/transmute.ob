import { describe, expect, test } from "bun:test";
import { createApp } from "../src/app";

describe("GET /open vault allowlist", () => {
  test("rejects vaults not listed in VAULT_ALLOWLIST", async () => {
    const app = createApp({ env: { VAULT_ALLOWLIST: "Allowed Vault" } });

    const response = await app.handle(
      new Request("http://localhost/open?vault=Other Vault&file=Notes/Today.md")
    );

    expect(response.status).toBe(403);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(await response.json()).toEqual({ error: "forbidden_vault" });
  });

  test("rejects disallowed vaults before file syntax checks", async () => {
    const app = createApp({ env: { VAULT_ALLOWLIST: "Allowed Vault" } });

    const response = await app.handle(
      new Request("http://localhost/open?vault=Other Vault&file=/Notes/Today.md")
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "forbidden_vault" });
  });

  test("matches vault names exactly and case-sensitively", async () => {
    const app = createApp({ env: { VAULT_ALLOWLIST: "Vault" } });

    const response = await app.handle(
      new Request("http://localhost/open?vault=vault&file=Notes/Today.md")
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "forbidden_vault" });
  });

  test("fails closed when allowlist env is missing", async () => {
    const app = createApp();

    const response = await app.handle(
      new Request("http://localhost/open?vault=Vault&file=Notes/Today.md")
    );

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "forbidden_vault" });
  });
});
