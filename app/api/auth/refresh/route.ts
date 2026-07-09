import { z } from "zod";
import { createServerAuthSupabase } from "@/lib/supabase-admin";
import { apiError } from "@/lib/server-data";

const schema = z.object({
  refresh_token: z.string().min(1)
});

export async function POST(request: Request) {
  try {
    const payload = schema.parse(await request.json());
    const supabase = createServerAuthSupabase();
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: payload.refresh_token
    });

    if (error || !data.session) {
      return Response.json(
        {
          error: error?.message || "Please log in first.",
          details: error
            ? {
                name: error.name || "RefreshSessionError",
                message: error.message,
                status: typeof error.status === "number" || typeof error.status === "string" ? String(error.status) : null
              }
            : null
        },
        { status: error?.status ? Number(error.status) || 401 : 401 }
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
