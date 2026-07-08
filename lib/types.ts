export type Language = "zh" | "en";
export type UserRole = "member" | "admin";

export type MemberProfileInput = {
  name?: string;
  age: number;
  gender: string;
  height: number;
  weight: number;
  target_weight: number;
  goal: string;
  experience: string;
  training_days_per_week: number;
  training_time_per_session: number;
  equipment: string;
  diet_preference?: string;
  food_restrictions?: string;
  schedule?: string;
  has_injury: boolean;
  injury_area?: string;
  pain_level: number;
  discomfort?: string;
  notes?: string;
};

export type DailyCheckinInput = {
  date: string;
  weight?: number;
  training_completed: boolean;
  training_completion_rate: number;
  diet_completion_rate: number;
  sleep_hours: number;
  fatigue_level: number;
  pain_level: number;
  mood?: string;
  notes?: string;
  image_urls?: string[];
};

export type RiskResult = {
  need_human_review: boolean;
  review_reason: string | null;
  matched_keywords: string[];
};

export type AppProfile = {
  id: string;
  user_id: string;
  role: UserRole;
  name: string | null;
  language: Language;
  created_at: string;
};

export type TrainingPlan = {
  id: string;
  user_id: string;
  plan_content: string;
  week_start: string | null;
  need_human_review: boolean;
  review_reason: string | null;
  created_at: string;
};

export type NutritionPlan = {
  id: string;
  user_id: string;
  plan_content: string;
  need_human_review: boolean;
  review_reason: string | null;
  created_at: string;
};

export type DailyCheckin = DailyCheckinInput & {
  id: string;
  user_id: string;
  created_at: string;
};

export type AiDailyReview = {
  id: string;
  user_id: string;
  checkin_id: string;
  review_content: string;
  need_human_review: boolean;
  review_reason: string | null;
  created_at: string;
};

export type AiChatMessage = {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  need_human_review: boolean;
  review_reason: string | null;
  created_at: string;
};

export type WeeklyReport = {
  id: string;
  user_id: string;
  week_start: string;
  week_end: string;
  report_content: string;
  need_human_review: boolean;
  review_reason: string | null;
  created_at: string;
};

export type AdminTask = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  description: string;
  status: "open" | "resolved";
  created_at: string;
  resolved_at: string | null;
};
