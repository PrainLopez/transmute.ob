import { describe, expect, test } from "bun:test";
import { buildObsidianLink } from "../src/obsidian-link";

describe("buildObsidianLink", () => {
  test("encodes vault and file into obsidian url", () => {
    expect(
      buildObsidianLink({ vault: "My Vault", file: "Notes/Today.md" })
    ).toBe("obsidian://open?vault=My%20Vault&file=Notes%2FToday.md");
  });
});
