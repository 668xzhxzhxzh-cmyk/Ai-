"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { EmptyState, SectionCard } from "@/components/ui";
import type { DailyCheckin } from "@/lib/types";

export function ProgressCharts({ checkins }: { checkins: DailyCheckin[] }) {
  const data = [...checkins]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      date: item.date.slice(5),
      weight: item.weight,
      training: item.training_completion_rate,
      diet: item.diet_completion_rate,
      sleep: item.sleep_hours,
      fatigue: item.fatigue_level,
      pain: item.pain_level
    }));

  if (!data.length) {
    return <EmptyState title="暂无打卡数据" description="提交每日打卡后，这里会显示趋势曲线。" />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Chart title="体重 / Weight" data={data} lines={[["weight", "#f7f7f4"]]} />
      <Chart title="执行率 / Completion" data={data} lines={[["training", "#bef264"], ["diet", "#7dd3fc"]]} />
      <Chart title="睡眠 / Sleep" data={data} lines={[["sleep", "#a5b4fc"]]} />
      <Chart title="疲劳与疼痛 / Fatigue & Pain" data={data} lines={[["fatigue", "#fcd34d"], ["pain", "#fb7185"]]} />
    </div>
  );
}

function Chart({ title, data, lines }: { title: string; data: unknown[]; lines: [string, string][] }) {
  return (
    <SectionCard className="bg-black/20">
      <h2 className="mb-3 text-sm font-semibold text-zinc-100">{title}</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: "#a1a1aa" }} />
            <YAxis tick={{ fontSize: 12, fill: "#a1a1aa" }} />
            <Tooltip contentStyle={{ background: "#08090a", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 16, color: "#fafafa", boxShadow: "0 18px 60px rgba(0,0,0,0.36)" }} />
            <Legend wrapperStyle={{ color: "#d4d4d8" }} />
            {lines.map(([key, color]) => (
              <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>
  );
}
