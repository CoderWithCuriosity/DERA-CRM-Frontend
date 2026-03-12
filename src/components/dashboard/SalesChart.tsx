import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface SalesChartProps {
  data: {
    labels: string[];
    won_deals: number[];
    lost_deals: number[];
  };
}

export function SalesChart({ data }: SalesChartProps) {
  const chartData = data.labels.map((label, index) => ({
    name: label,
    Won: data.won_deals[index],
    Lost: data.lost_deals[index],
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />
        <XAxis dataKey="name" stroke="#6B7280" />
        <YAxis stroke="#6B7280" />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E0E7FF',
            borderRadius: '8px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          }}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="Won"
          stroke="#0066FF"
          strokeWidth={2}
          dot={{ fill: '#0066FF', strokeWidth: 2 }}
          activeDot={{ r: 8 }}
        />
        <Line
          type="monotone"
          dataKey="Lost"
          stroke="#EF4444"
          strokeWidth={2}
          dot={{ fill: '#EF4444', strokeWidth: 2 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}