import { z } from "zod";
import { createServerAuthFallbackSupabase, createServerAuthSupabase } from "@/lib/supabase-admin";
import { apiError } from "@/lib/server-data";

const loginSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(1, "请输入密码")
});

function serializeSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") {
    return {
      name: "UnknownError",
      message: "Unknown login error",
      status: null
    };
  }

  const record = error as Record<string, unknown>;
  return {
    name: typeof record.name === "string" ? record.name : error.constructor?.name || "SupabaseAuthError",
    message: typeof record.message === "string" ? record.message : "Supabase login failed",
    status: typeof record.status === "number" || typeof record.status === "string" ? String(record.status) : null
  };
}

function isInvalidApiKeyError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const message = (error as Record<string, unknown>).message;
  return typeof message === "string" && /invalid api key|missing supabase auth environment variables/i.test(message);
}

export async function POST(request: Request) {
  try {
    const payload = loginSchema.parse(await request.json());
    let data = null;
    let error: unknown = null;

    try {
      const supabase = createServerAuthSupabase();
      const result = await supabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password
      });
      data = result.data;
      error = result.error;
    } catch (authError) {
      error = authError;
    }

    if (error && isInvalidApiKeyError(error)) {
      const fallbackSupabase = createServerAuthFallbackSupabase();
      const fallbackResult = await fallbackSupabase.auth.signInWithPassword({
        email: payload.email,
        password: payload.password
      });
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      const details = serializeSupabaseError(error);
      return Response.json(
        {
          error: details.message,
          details
        },
        { status: details.status ? Number(details.status) || 400 : 400 }
      );
    }

    if (!data?.session) {
      return Response.json(
        {
          error: "Supabase did not return a session. Please confirm email settings and try again.",
          details: {
            name: "MissingSession",
            message: "No session returned",
            status: null
          }
        },
        { status: 400 }
      );
    }

    return Response.json({
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email
          }
        : null,
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
