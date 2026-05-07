import { describe, expect, test } from "bun:test";
import { renderTransmuteResultPage } from "../src/render-transmute-result-page";

describe("renderTransmuteResultPage", () => {
  test("renders a clickable result, copy button, and back link", () => {
    const html = renderTransmuteResultPage({
      openUrl: "http://127.0.0.1:4321/open?vault=Vault&file=Notes%2FToday.md"
    });

    expect(html).toContain('id="result"');
    expect(html).toContain('href="http://127.0.0.1:4321/open?vault=Vault&amp;file=Notes%2FToday.md"');
    expect(html).toContain('id="copy"');
    expect(html).toContain('data-url="http://127.0.0.1:4321/open?vault=Vault&amp;file=Notes%2FToday.md"');
    expect(html).toContain('<a href="/transmute">Back</a>');
    expect(html).toContain('id="copy-failure" hidden');
  });

  test("shows copy failure inline without hiding the result", () => {
    const html = renderTransmuteResultPage({
      openUrl: "http://127.0.0.1:4321/open?vault=Vault&file=Notes%2FToday.md"
    });

    expect(html).toContain('button?.addEventListener("click"');
    expect(html).toContain('hint.hidden = false');
    expect(html).toContain('result"');
    expect(html).toContain('copy-failure');
  });
});
