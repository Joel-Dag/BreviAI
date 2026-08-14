const requiredPublicEnv = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

export function getPublicEnvStatus() {
  return requiredPublicEnv.map((key) => ({
    key,
    configured: Boolean(process.env[key]),
  }));
}

export function isSupabaseConfigured() {
  return getPublicEnvStatus().every((item) => item.configured);
}
