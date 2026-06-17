import { createClient } from "@supabase/supabase-js";

/**
 * Sanitize text for PostgreSQL (prevents "unsupported Unicode escape sequence")
 * This is critical when RFP text contains literal backslashes (\u, \x) 
 * which PostgreSQL might try to interpret as escapes.
 */
export const sanitizeForDb = (text) => {
  if (!text) return "";
  return String(text)
    .replace(/\x00/g, "") // Remove null bytes (forbidden in Postgres text/jsonb)
    .replace(/\\/g, "\\\\"); // Escape ALL backslashes to ensure they are treated as literals
};



const getEnv = (name) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
};

const createServerClient = (apiKey) =>
  createClient(getEnv("NEXT_PUBLIC_SUPABASE_URL"), apiKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

const getServerAuthApiKey = () =>
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_AUTH_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY;

export const getSupabaseClient = () =>
  createServerClient(getServerAuthApiKey() || getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"));

export const createSupabaseAuthenticatedClient = (accessToken) =>
  createClient(getEnv("NEXT_PUBLIC_SUPABASE_URL"), getServerAuthApiKey() || getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  });

export const getSupabaseAdmin = () =>
  createServerClient(getEnv("SUPABASE_SERVICE_ROLE_KEY"));

export const getSupabaseAdminOrNull = () => {
  try {
    return getSupabaseAdmin();
  } catch {
    return null;
  }
};

export default getSupabaseClient;
