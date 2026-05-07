import { describe, expect, test } from "bun:test";
import { resolveVaultAllowlist } from "../src/vault-allowlist";

describe("resolveVaultAllowlist", () => {
  test("returns no vaults when env is missing or empty", () => {
    expect(resolveVaultAllowlist()).toEqual([]);
    expect(resolveVaultAllowlist({ VAULT_ALLOWLIST: "" })).toEqual([]);
  });

  test("trims entries, drops empties, and dedupes in order", () => {
    expect(
      resolveVaultAllowlist({
        VAULT_ALLOWLIST: "  Vault , Other Vault, Vault,, ,Other Vault  "
      })
    ).toEqual(["Vault", "Other Vault"]);
  });
});
