import type { DailyCheckinInput, Language, MemberProfileInput } from "./types";

const safety = `
Safety rules:
- Do not provide diagnosis, medication instructions, extreme dieting, risky supplements, high-impact or heavy-load advice for injured users.
- If pain, illness, dizziness, chest pain, fainting, vomiting, severe diarrhea, palpitations, extreme fatigue, injury, or extreme restriction appears, set need_human_review true and give conservative guidance.
- Prefer coach/doctor review for medical or injury topics.
- Return concise structured Markdown with clear sections.
`;

function langLine(language: Language) {
  return language === "en" ? "Write in English." : "请用中文输出。";
}

export function generateTrainingPlanPrompt(profile: MemberProfileInput, language: Language) {
  return `${langLine(language)}
You are DeepSeek powering AI邵峰健身, an AI + human-supervised fitness platform.
Create a personalized weekly training plan from this profile:
${JSON.stringify(profile, null, 2)}

Include weekly schedule, daily workouts, exercise names, sets, reps, rest, intensity, safety notes, substitutions.
For rehab or injury users, be conservative and avoid high-impact, heavy-load, or high-risk movements.
${safety}`;
}

export function generateNutritionPlanPrompt(profile: MemberProfileInput, language: Language) {
  return `${langLine(language)}
Create a nutrition recommendation for AI邵峰健身 member:
${JSON.stringify(profile, null, 2)}

Include daily calories, protein, carbs, fat, meal structure, sample menu, hydration, and execution tips.
No extreme low calories, long fasting, drug weight loss, unsafe supplements, or overtraining.
${safety}`;
}

export function analyzeDailyCheckinPrompt(
  profile: MemberProfileInput | null,
  checkin: DailyCheckinInput,
  language: Language
) {
  return `${langLine(language)}
Analyze today's member check-in for AI邵峰健身.
Profile: ${JSON.stringify(profile, null, 2)}
Check-in: ${JSON.stringify(checkin, null, 2)}

Cover execution quality, training adjustment, nutrition adjustment, recovery, risks, and tomorrow's advice.
${safety}`;
}

export function generateWeeklyReportPrompt(checkins: unknown[], language: Language) {
  return `${langLine(language)}
Generate a weekly report for AI邵峰健身 from these check-ins:
${JSON.stringify(checkins, null, 2)}

Include weight change, check-in days, training completion, diet execution, sleep, fatigue trend, pain trend, main issues, next week's training and nutrition adjustments, and human review flag.
${safety}`;
}

export function answerMemberQuestionPrompt(question: string, context: unknown, language: Language) {
  return `${langLine(language)}
Answer this AI邵峰健身 member question with practical coaching guidance.
Question: ${question}
Context: ${JSON.stringify(context, null, 2)}

If the question involves injury, pain, disease, medication, extreme dieting, chest pain, dizziness, fainting, vomiting, severe diarrhea, or palpitations, do not give definitive medical advice. Recommend human coach or doctor assessment.
${safety}`;
}

export function adjustNextWeekPlanPrompt(context: unknown, language: Language) {
  return `${langLine(language)}
Adjust next week's training and nutrition plan for AI邵峰健身 using this execution context:
${JSON.stringify(context, null, 2)}

Rules: increase intensity only slightly when completion and recovery are good; reduce intensity when fatigue or pain is high; make nutrition easier if adherence is poor; avoid drastic calorie cuts; rehab users prioritize safety and movement quality.
${safety}`;
}
