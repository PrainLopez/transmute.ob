import { jsonError } from "./json-response";

export type OpenRequest = {
  vault: string;
  file: string;
};

export function validateOpenRequest(
  url: URL,
  allowedVaults: ReadonlySet<string>
): OpenRequest | Response {
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

  if (!vault || !file) {
    return new Response("Bad Request", { status: 400 });
  }

  if (!allowedVaults.size || !allowedVaults.has(vault)) {
    return jsonError(403, "forbidden_vault");
  }

  if (file.startsWith("/")) {
    return new Response("Bad Request", { status: 400 });
  }

  return { vault, file };
}
