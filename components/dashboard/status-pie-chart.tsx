"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS: Record<string, string> = {
  "Belum Dimulai": "#94a3b8",
  Berjalan: "#0ea5e9",
  Menunggu: "#f59e0b",
  Selesai: "#10b981",
  Terlambat: "#ef4444",
};

export function StatusPieChart({
  data,
}: {
  data: { belumDimulai: number; berjalan: number; menunggu: number; selesai: number; terlambat: number };
}) {
  const chartData = [
    { name: "Belum Dimulai", value: data.belumDimulai },
    { name: "Berjalan", value: data.berjalan },
    { name: "Menunggu", value: data.menunggu },
    { name: "Selesai", value: data.selesai },
    { name: "Terlambat", value: data.terlambat },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status Pekerjaan</CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">Belum ada data</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
