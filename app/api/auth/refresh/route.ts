import { z } from "zod";
import { createServerAuthFallbackSupabase, createServerAuthSupabase } from "@/lib/supabase-admin";
import { apiError } from "@/lib/server-data";

const schema = z.object({
  refresh_token: z.string().min(1)
});

function isInvalidApiKeyError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = (error as Record<string, unknown>).message;
  return typeof message === "string" && /invalid api key|missing supabase auth environment variables/i.test(message);
}

function serializeSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") {
    return {
      name: "RefreshSessionError",
      message: "Please log in first.",
      status: null
    };
  }

  const record = error as Record<string, unknown>;
  return {
    name: typeof record.name === "string" ? record.name : "RefreshSessionError",
    message: typeof record.message === "string" ? record.message : "Please log in first.",
    status: typeof record.status === "number" || typeof record.status === "string" ? String(record.status) : null
  };
}

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    let data = null;
    let error: unknown = null;

    try {
      const supabase = createServerAuthSupabase();
      const result = await supabase.auth.refreshSession({
        refresh_token: payload.refresh_token
      });
      data = result.data;
      error = result.error;
    } catch (authError) {
      error = authError;
    }

    if (error && isInvalidApiKeyError(error)) {
      const fallbackSupabase = createServerAuthFallbackSupabase();
      const fallbackResult = await fallbackSupabase.auth.refreshSession({
        refresh_token: payload.refresh_token
      });
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error || !data?.session) {
      const details = serializeSupabaseError(error);
      return Response.json(
        {
          error: details.message,
          details
        },
        { status: details.status ? Number(details.status) || 401 : 401 }
      );
    }

    return Response.json({
      session: {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
        expires_at: data.session.expires_at,
        token_type: data.session.token_type
      }
    });
  } catch (error) {
    return apiError(error);
  }
}
