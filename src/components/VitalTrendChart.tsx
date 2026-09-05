"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { VitalEntry } from "@/lib/types";
import { formatDate } from "@/lib/format";

interface Props {
  title: string;
  data: VitalEntry[];
  unit: string;
  secondaryLabel?: string;
  color?: string;
  secondaryColor?: string;
  emptyHint?: string;
}

export default function VitalTrendChart({
  title,
  data,
  unit,
  secondaryLabel,
  color = "#2c7264",
  secondaryColor = "#c2792a",
  emptyHint,
}: Props) {
  const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));
  const chartData = sorted.map((d) => ({
    date: formatDate(d.date),
    value: d.value,
    value2: d.value2,
  }));

  return (
    <div className="card">
      <h3 className="mb-2 text-sm font-medium text-stone-600">
        {title} {unit && <span className="text-stone-400">({unit})</span>}
      </h3>
      {chartData.length === 0 ? (
        <p className="py-8 text-center text-sm text-stone-400">
          {emptyHint || "Nessun dato disponibile."}
        </p>
      ) : (
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="value"
                name={secondaryLabel ? "Sistolica" : title}
                stroke={color}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              {secondaryLabel && (
                <Line
                  type="monotone"
                  dataKey="value2"
                  name={secondaryLabel}
                  stroke={secondaryColor}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
