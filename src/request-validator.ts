export type OpenRequest = {
  vault: string;
  file: string;
};

export function validateOpenRequest(url: URL): OpenRequest | Response {
  const vault = url.searchParams.get("vault") ?? "";
  const file = url.searchParams.get("file") ?? "";
  const allowedKeys = ["vault", "file"];
  const seenKeys = new Set<string>();

  for (const key of url.searchParams.keys()) {
    if (!allowedKeys.includes(key)) {
      return new Response("Bad Request", { status: 400 });
    }

    if (seenKeys.has(key)) {
      return new Response("Bad Request", { status: 400 });
    }

    seenKeys.add(key);
  }

  if (!vault || !file || file.startsWith("/")) {
    return new Response("Bad Request", { status: 400 });
  }

  return { vault, file };
}
