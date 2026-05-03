export function renderTransmuteFormPage() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Transmute URL</title>
  </head>
  <body>
    <form method="post" action="/transmute">
      <label>
        Obsidian URL
        <input name="url" type="url" autocomplete="off" />
      </label>
      <button type="submit">Transmute</button>
    </form>
  </body>
</html>`;
}
