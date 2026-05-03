export type TransmuteErrorCode =
  | "invalid_url"
  | "unsupported_protocol"
  | "missing_vault"
  | "missing_file"
  | "invalid_query";

export type TransmuteTarget = {
  vault: string;
  file: string;
};

export function parseTransmuteInput(input: string): TransmuteTarget | { error: TransmuteErrorCode } {
  const trimmed = input.trim();

  if (!trimmed) {
    return { error: "invalid_url" };
  }

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    return { error: "invalid_url" };
  }

  if (url.protocol !== "obsidian:" || url.host !== "open") {
    return { error: "unsupported_protocol" };
  }

  if (url.pathname !== "" || url.hash !== "" || url.username !== "" || url.password !== "") {
    return { error: "invalid_query" };
  }

  const seenKeys = new Set<string>();
  let vault = "";
  let file = "";

  for (const [key, value] of url.searchParams.entries()) {
    if (key !== "vault" && key !== "file") {
      return { error: "invalid_query" };
    }

    if (seenKeys.has(key)) {
      return { error: "invalid_query" };
    }

    seenKeys.add(key);

    if (key === "vault") {
      vault = value;
    } else {
      file = value;
    }
  }

  if (!vault) {
    return { error: "missing_vault" };
  }

  if (!file) {
    return { error: "missing_file" };
  }

  if (file.startsWith("/")) {
    return { error: "invalid_query" };
  }

  return { vault, file };
}

export function buildTransmuteOpenUrl(origin: string, target: TransmuteTarget) {
  const url = new URL("/open", origin);

  return `${url.origin}${url.pathname}?vault=${encodeURIComponent(target.vault)}&file=${encodeURIComponent(target.file)}`;
}
