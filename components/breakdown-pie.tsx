"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = [
  "hsl(190 95% 45%)",  // primary cyan
  "hsl(265 80% 58%)",  // accent purple
  "hsl(190 95% 65%)",  // lighter cyan
  "hsl(265 80% 40%)",  // darker purple
  "hsl(215 30% 52%)",  // muted blue
];

interface BreakdownPieProps {
  items: { name: string; count: number }[];
}

export function BreakdownPie({ items }: BreakdownPieProps) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No data yet.</p>;
  }

  const data = items.map((item) => ({ name: item.name, value: item.count }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [value, name]}
          contentStyle={{
            background: "hsl(var(--popover))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            fontSize: 12,
          }}
        />
        <Legend
          formatter={(value) => (
            <span style={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
