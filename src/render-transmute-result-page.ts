type TransmuteResult = {
  openUrl: string;
};

export function renderTransmuteResultPage({ openUrl }: TransmuteResult) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Transmute Result</title>
  </head>
  <body>
    <main>
      <p><a id="result" href="${escapeHtml(openUrl)}">${escapeHtml(openUrl)}</a></p>
      <button id="copy" type="button" data-url="${escapeHtml(openUrl)}">Copy</button>
      <p id="copy-failure" hidden>Copy failed.</p>
      <p><a href="/transmute">Back</a></p>
    </main>
    <script>
      const button = document.getElementById("copy");
      const hint = document.getElementById("copy-failure");

      button?.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(button.dataset.url ?? "");
        } catch {
          if (hint) hint.hidden = false;
        }
      });
    </script>
  </body>
</html>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
