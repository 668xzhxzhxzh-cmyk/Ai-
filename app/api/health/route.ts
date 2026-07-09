import { isDeepSeekConfigured } from "@/lib/deepseek";
import { createAdminSupabase } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

function cleanEnv(name: string) {
  return process.env[name]?.trim();
}

function getSupabaseUrlHost() {
  const value = cleanEnv("SUPABASE_URL") || cleanEnv("NEXT_PUBLIC_SUPABASE_URL");

  if (!value) return null;

  try {
    return new URL(value).host;
  } catch {
    return "invalid-url";
  }
}

function redact(value: unknown) {
  return String(value)
    .replace(/eyJ[A-Za-z0-9._-]+/g, "[redacted-jwt]")
    .replace(/sb_(?:publishable|secret|service_role)_[A-Za-z0-9._-]+/g, "[redacted-supabase-key]")
    .replace(/[A-Za-z0-9_-]{32,}/g, "[redacted-token]");
}

function describeError(error: unknown) {
  if (!error || typeof error !== "object") {
    return { message: redact(error || "Supabase check failed") };
  }

  const record = error as Record<string, unknown>;
  return {
    name: record.name ? redact(record.name) : undefined,
    code: record.code ? redact(record.code) : undefined,
    status: record.status ? redact(record.status) : undefined,
    message: record.message ? redact(record.message) : "Supabase check failed",
    details: record.details ? redact(record.details) : undefined,
    hint: record.hint ? redact(record.hint) : undefined
  };
}

export async function GET() {
  const startedAt = Date.now();
  const checks = {
    app: true,
    supabase: false,
    deepseek: isDeepSeekConfigured()
  };
  let supabaseError: ReturnType<typeof describeError> | null = null;

  try {
    const supabase = createAdminSupabase();
    const { error } = await supabase.from("profiles").select("user_id", { count: "exact", head: true });
    if (error) throw error;
    checks.supabase = true;
  } catch (error) {
    supabaseError = describeError(error);
  }

  return Response.json(
    {
      ok: checks.app && checks.supabase && checks.deepseek,
      checks,
      diagnostics: {
        supabase: supabaseError?.message ?? null,
        supabaseError,
        supabaseHost: getSupabaseUrlHost(),
        env: {
          SUPABASE_URL: Boolean(cleanEnv("SUPABASE_URL")),
          NEXT_PUBLIC_SUPABASE_URL: Boolean(cleanEnv("NEXT_PUBLIC_SUPABASE_URL")),
          SUPABASE_ANON_KEY: Boolean(cleanEnv("SUPABASE_ANON_KEY")),
          NEXT_PUBLIC_SUPABASE_ANON_KEY: Boolean(cleanEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")),
          SUPABASE_SERVICE_ROLE_KEY: Boolean(cleanEnv("SUPABASE_SERVICE_ROLE_KEY")),
          DEEPSEEK_API_KEY: Boolean(cleanEnv("DEEPSEEK_API_KEY"))
        },
        runtime: "nextjs",
        elapsedMs: Date.now() - startedAt
      }
    },
    {
      status: checks.app && checks.supabase && checks.deepseek ? 200 : 503,
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
