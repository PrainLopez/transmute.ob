export type VaultAllowlistEnv = {
  VAULT_ALLOWLIST?: string;
};

export function resolveVaultAllowlist(env: VaultAllowlistEnv = {}) {
  const values = env.VAULT_ALLOWLIST?.split(",") ?? [];

  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
