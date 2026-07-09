import { isDeepSeekConfigured } from "@/lib/deepseek";
import { createAdminSupabase } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const checks = {
    app: true,
    supabase: false,
    deepseek: isDeepSeekConfigured()
  };
  let supabaseError: string | null = null;

  try {
    const supabase = createAdminSupabase();
    const { error } = await supabase.from("profiles").select("user_id", { count: "exact", head: true });
    if (error) throw error;
    checks.supabase = true;
  } catch (error) {
    supabaseError = error instanceof Error ? error.message : "Supabase check failed";
  }

  return Response.json(
    {
      ok: checks.app && checks.supabase && checks.deepseek,
      checks,
      diagnostics: {
        supabase: supabaseError,
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
