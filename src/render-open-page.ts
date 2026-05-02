import { buildObsidianLink } from "./obsidian-link";

type OpenTarget = {
  vault: string;
  file: string;
};

export function renderOpenPage(target: OpenTarget) {
  const href = buildObsidianLink(target);

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Open Obsidian</title>
  </head>
  <body>
    <script>
      location.href = ${JSON.stringify(href)};
    </script>
    <p><a href="${href}">Open in Obsidian</a></p>
  </body>
</html>`;
}
