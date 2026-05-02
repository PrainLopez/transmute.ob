import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { listen } from "../src/app";

afterEach(() => {
  spyOn(console, "log").mockRestore?.();
});

describe("listen", () => {
  test("logs actual listen url", () => {
    const logger = spyOn(console, "log").mockImplementation(() => undefined);

    const result = listen({
      env: { LISTEN_IP: "0.0.0.0", PORT: "8080" },
      logger,
      start: () => ({ hostname: "127.0.0.1", port: 3000 })
    });

    expect(result).toEqual({ hostname: "127.0.0.1", port: 3000 });
    expect(logger).toHaveBeenCalledWith("Listening on http://127.0.0.1:3000");
  });
});
