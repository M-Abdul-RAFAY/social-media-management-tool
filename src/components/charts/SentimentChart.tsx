"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface SentimentChartProps {
  data: {
    positive: number;
    negative: number;
    neutral: number;
  };
}

export function SentimentChart({ data }: SentimentChartProps) {
  const chartData = [
    { name: "Positive", value: data.positive, color: "#10b981" },
    { name: "Negative", value: data.negative, color: "#ef4444" },
    { name: "Neutral", value: data.neutral, color: "#6b7280" },
  ].filter((item) => item.value > 0); // Only show segments with data

  const total = data.positive + data.negative + data.neutral;

  const renderCustomizedLabel = (props: any) => {
    const { value } = props;
    const percentage = ((value / total) * 100).toFixed(1);
    return `${percentage}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
        Review Sentiment Analysis
      </h3>

      {total === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          No review data available
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value, "Reviews"]}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend
                verticalAlign="bottom"
                height={36}
                formatter={(value, entry: any) => (
                  <span style={{ color: entry.color }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-semibold text-green-600">
            {data.positive}
          </p>
          <p className="text-sm text-gray-500">Positive</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-gray-600">{data.neutral}</p>
          <p className="text-sm text-gray-500">Neutral</p>
        </div>
        <div>
          <p className="text-2xl font-semibold text-red-600">{data.negative}</p>
          <p className="text-sm text-gray-500">Negative</p>
        </div>
      </div>
    </div>
  );
}
