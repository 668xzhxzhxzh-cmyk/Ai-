import { apiError } from "@/lib/server-data";
import { requireAdmin } from "@/lib/supabase-admin";

export async function PATCH(request: Request) {
  try {
    const { supabase } = await requireAdmin(request.headers.get("authorization"));
    const { id, status } = await request.json();
    if (!id || !["open", "resolved"].includes(status)) throw new Error("Invalid task update.");

    const { data, error } = await supabase
      .from("admin_tasks")
      .update({
        status,
        resolved_at: status === "resolved" ? new Date().toISOString() : null
      })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return Response.json({ task: data });
  } catch (error) {
    return apiError(error);
  }
}
