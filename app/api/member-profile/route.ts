import { z } from "zod";
import { requireUser } from "@/lib/supabase-admin";
import { apiError } from "@/lib/server-data";
import { createAdminTask, detectProfileRisk } from "@/lib/risk";

const schema = z.object({
  name: z.string().min(1),
  language: z.enum(["zh", "en"]).default("zh"),
  age: z.coerce.number().min(1).max(120),
  gender: z.string().min(1),
  height: z.coerce.number().min(80).max(250),
  weight: z.coerce.number().min(20).max(300),
  target_weight: z.coerce.number().min(20).max(300),
  goal: z.string().min(1),
  experience: z.string().min(1),
  training_days_per_week: z.coerce.number().min(1).max(7),
  training_time_per_session: z.coerce.number().min(10).max(240),
  equipment: z.string().min(1),
  diet_preference: z.string().optional().default(""),
  food_restrictions: z.string().optional().default(""),
  schedule: z.string().optional().default(""),
  has_injury: z.coerce.boolean().default(false),
  injury_area: z.string().optional().default(""),
  pain_level: z.coerce.number().min(0).max(10),
  discomfort: z.string().optional().default(""),
  notes: z.string().optional().default("")
});

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUser(request.headers.get("authorization"));
    const payload = schema.parse(await request.json());
    const { name, language, ...memberProfile } = payload;

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        user_id: user.id,
        name,
        language
      },
      { onConflict: "user_id" }
    );
    if (profileError) throw profileError;

    const risk = detectProfileRisk({ name, ...memberProfile });
    const { data, error } = await supabase
      .from("member_profiles")
      .upsert({ user_id: user.id, ...memberProfile }, { onConflict: "user_id" })
      .select()
      .single();
    if (error) throw error;

    if (risk.need_human_review) {
      await createAdminTask(
        supabase,
        user.id,
        "profile_risk",
        "会员资料风险提醒",
        risk.review_reason || "Profile requires human review."
      );
    }

    return Response.json({ memberProfile: data, risk });
  } catch (error) {
    return apiError(error);
  }
}
