import { z } from "zod";
import { createAdminSupabase } from "@/lib/supabase-admin";
import { apiError } from "@/lib/server-data";

const signupSchema = z.object({
  email: z.string().email("邮箱格式不正确"),
  password: z.string().min(6, "密码至少需要 6 位")
});

function serializeSupabaseError(error: unknown) {
  if (!error || typeof error !== "object") {
    return {
      name: "UnknownError",
      message: "Unknown signup error",
      status: null
    };
  }

  const record = error as Record<string, unknown>;
  return {
    name: typeof record.name === "string" ? record.name : error.constructor?.name || "SupabaseAuthError",
    message: typeof record.message === "string" ? record.message : "Supabase signup failed",
    status: typeof record.status === "number" || typeof record.status === "string" ? String(record.status) : null
  };
}

export async function POST(request: Request) {
  try {
    const payload = signupSchema.parse(await request.json());
    const supabase = createAdminSupabase();

    const { data, error } = await supabase.auth.admin.createUser({
      email: payload.email,
      password: payload.password,
      email_confirm: true
    });

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

    return Response.json({
      user: data.user
        ? {
            id: data.user.id,
            email: data.user.email,
            created_at: data.user.created_at
          }
        : null,
      message: "注册成功。请在当前页面登录。"
    });
  } catch (error) {
    return apiError(error);
  }
}
