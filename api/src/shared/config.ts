import { SecretClient } from "@azure/keyvault-secrets";
import { DefaultAzureCredential } from "@azure/identity";

let cached = new Map<string, { value: string, source: "keyvault" | "appsettings" }>();
let client: SecretClient | null = null;

function getClient(): SecretClient {
  const url = process.env.KEY_VAULT_URL;
  if (!url) throw new Error("Missing KEY_VAULT_URL app setting.");
  if (!client) client = new SecretClient(url, new DefaultAzureCredential());
  return client;
}

async function tryKeyVault(name: string) {
  const url = process.env.KEY_VAULT_URL;
  if (!url) return null;
  try {
    const s = await getClient().getSecret(name);
    if (s.value) return { value: s.value, source: "keyvault" as const };
  } catch (_err) {}
  return null;
}

function tryEnv(names: string[]) {
  for (const n of names) {
    const v = process.env[n];
    if (v && String(v).trim().length > 0) {
      return { value: String(v), source: "appsettings" as const };
    }
  }
  return null;
}

export async function getConfig(primaryName: string, envFallbacks: string[] = []) {
  const cacheKey = primaryName + "::" + envFallbacks.join(",");
  if (cached.has(cacheKey)) return cached.get(cacheKey)!;

  const kv = await tryKeyVault(primaryName);
  if (kv) { cached.set(cacheKey, kv); return kv; }

  const env = tryEnv([
    ...envFallbacks,
    primaryName,
    primaryName.replace(/-/g, "_")
  ]);
  if (env) { cached.set(cacheKey, env); return env; }

  throw new Error(`Missing config: ${primaryName} (and fallbacks: ${[...envFallbacks, primaryName, primaryName.replace(/-/g,"_")].join(", ")})`);
}