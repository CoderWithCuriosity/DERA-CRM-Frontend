import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import type { PipelineChartData } from "../../types/dashboard";
import { formatCurrency } from "../../utils/formatters";
import type {
  ValueType,
  NameType,
} from "recharts/types/component/DefaultTooltipContent";

interface PipelineChartProps {
  data: PipelineChartData;
  currency: string
}

export function PipelineChart({ data, currency }: PipelineChartProps) {
  // Custom bar renderer
  const renderBar = (props: any) => {
    const { x, y, width, height, index } = props;

    const stage = data.stages?.[index] ?? { color: "#6366F1" };

    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={stage.color}
        rx={4}
        ry={4}
      />
    );
  };

  // Tooltip formatter
  const formatTooltipValue = (
    value: ValueType | undefined,
    _name: NameType
  ): [string, string] => {
    if (typeof value === "number") {
      return [formatCurrency(value, currency), "Value"];
    }

    if (Array.isArray(value)) {
      return [value.join(", "), "Value"];
    }

    if (value === undefined || value === null) {
      return ["-", "Value"];
    }

    return [String(value), "Value"];
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data.stages}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#E0E7FF" />

        <XAxis dataKey="name" stroke="#6B7280" />

        <YAxis
          stroke="#6B7280"
          tickFormatter={(value) => formatCurrency(value, currency)}
        />

        <Tooltip
          contentStyle={{
            backgroundColor: "white",
            border: "1px solid #E0E7FF",
            borderRadius: "8px",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
          }}
          formatter={formatTooltipValue as any}
          labelFormatter={(label) => `Stage: ${label}`}
        />

        <Bar
          dataKey="value"
          shape={renderBar}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}