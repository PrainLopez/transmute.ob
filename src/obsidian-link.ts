type OpenTarget = {
  vault: string;
  file: string;
};

export function buildObsidianLink({ vault, file }: OpenTarget) {
  return `obsidian://open?vault=${encodeURIComponent(vault)}&file=${encodeURIComponent(file)}`;
}
