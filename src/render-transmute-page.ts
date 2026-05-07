export function renderTransmuteFormPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Transmute URL</title>
  </head>
  <body>
    <main>
      <form id="transmute-form">
        <label for="paste">Obsidian URL</label>
        <textarea id="paste" name="url" rows="4" autocomplete="off" spellcheck="false"></textarea>
        <button id="convert" type="submit">Convert</button>
      </form>
      <section aria-live="polite">
        <p id="source"></p>
        <p id="result" hidden></p>
        <button id="copy" type="button" hidden>Copy</button>
        <p id="copy-failure" hidden>Copy failed.</p>
        <p><a href="/transmute">Back</a></p>
        <p id="error" hidden></p>
      </section>
    </main>
    <script>
      const form = document.getElementById("transmute-form");
      const paste = document.getElementById("paste");
      const source = document.getElementById("source");
      const result = document.getElementById("result");
      const copy = document.getElementById("copy");
      const copyFailure = document.getElementById("copy-failure");
      const error = document.getElementById("error");

      const codes = ["invalid_url", "unsupported_protocol", "missing_vault", "missing_file", "invalid_query"];

      function clearStatus() {
        if (error) error.hidden = true;
        if (result) result.hidden = true;
        if (copy) copy.hidden = true;
        if (copyFailure) copyFailure.hidden = true;
      }

      function showError(code) {
        if (!error) return;
        error.hidden = false;
        error.textContent = code;
      }

      function buildOpenUrl(raw) {
        const trimmed = raw.trim();

        if (!trimmed) return ["invalid_url"];

        let url;

        try {
          url = new URL(trimmed);
        } catch {
          return ["invalid_url"];
        }

        if (url.protocol !== "obsidian:" || url.host !== "open") return ["unsupported_protocol"];
        if (url.pathname !== "" || url.hash !== "" || url.username !== "" || url.password !== "") return ["invalid_query"];

        const seen = new Set();
        let vault = "";
        let file = "";

        for (const [key, value] of url.searchParams.entries()) {
          if (key !== "vault" && key !== "file") return ["invalid_query"];
          if (seen.has(key)) return ["invalid_query"];

          seen.add(key);

          if (key === "vault") vault = value;
          if (key === "file") file = value;
        }

        if (!vault) return ["missing_vault"];
        if (!file) return ["missing_file"];
        if (file.startsWith("/")) return ["invalid_query"];

        const openUrl = window.location.origin + "/open?vault=" + encodeURIComponent(vault) + "&file=" + encodeURIComponent(file);
        return [null, openUrl];
      }

      form?.addEventListener("submit", (event) => {
        event.preventDefault();
        clearStatus();

        const [code, openUrl] = buildOpenUrl(paste?.value ?? "");

        if (code) {
          showError(code);
          return;
        }

        if (source) source.textContent = paste.value.trim();
        if (result) {
          result.hidden = false;
          result.innerHTML = '<a href="' + openUrl + '">' + openUrl + '</a>';
        }
        if (copy) {
          copy.hidden = false;
          copy.dataset.url = openUrl;
        }

        if (paste) paste.value = "";
      });

      copy?.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(copy.dataset.url ?? "");
        } catch {
          if (copyFailure) copyFailure.hidden = false;
        }
      });

      void codes;
    </script>
  </body>
</html>`;
}
