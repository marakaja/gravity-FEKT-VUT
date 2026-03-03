import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  LogarithmicScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  LogarithmicScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

type Point = { x: number; y: number };

type DataSeries = {
  label: string;
  data: Point[];
  color: string;
  showLine?: boolean;
};

type XYChartProps = {
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  series: DataSeries[];
  logarithmicX?: boolean;
  logarithmicY?: boolean;
  showLine?: boolean;
  xMin?: number;
  xMax?: number;
  yMin?: number;
  yMax?: number;
};

const CHART_COLORS = [
  "#3b82f6",
  "#ef4444",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

export function XYChart({
  title,
  xAxisLabel,
  yAxisLabel,
  series,
  logarithmicX = false,
  logarithmicY = false,
  showLine = true,
  xMin,
  xMax,
  yMin,
  yMax,
}: XYChartProps) {
  const allXValues = series
    .flatMap((s) => s.data.map((p) => p.x))
    .filter((v) => !isNaN(v));
  const allYValues = series
    .flatMap((s) => s.data.map((p) => p.y))
    .filter((v) => !isNaN(v));

  const xAxisConfig: {
    type: string;
    title: { display: boolean; text: string; color: string };
    grid: { color: string };
    ticks: { color: string };
    min?: number;
    max?: number;
  } = {
    type: logarithmicX ? "logarithmic" : "linear",
    title: { display: true, text: xAxisLabel, color: "#334155" },
    grid: { color: "#e2e8f0" },
    ticks: { color: "#334155" },
  };

  const yAxisConfig: {
    type: string;
    title: { display: boolean; text: string; color: string };
    grid: { color: string };
    ticks: { color: string };
    min?: number;
    max?: number;
  } = {
    type: logarithmicY ? "logarithmic" : "linear",
    title: { display: true, text: yAxisLabel, color: "#334155" },
    grid: { color: "#e2e8f0" },
    ticks: { color: "#334155" },
  };

  if (xMin !== undefined) xAxisConfig.min = xMin;
  if (xMax !== undefined) xAxisConfig.max = xMax;

  if (allXValues.length > 0 && xMin === undefined && xMax === undefined) {
    const minX = Math.min(...allXValues);
    const maxX = Math.max(...allXValues);
    const xRange = maxX - minX;
    if (logarithmicX) {
      xAxisConfig.min = Math.min(minX * 0.8, 0.1); // Ensure we go low enough if data is small, but default to sensible min
      if (minX <= 0) xAxisConfig.min = 0.1; // Fallback if data is invalid for log
      else xAxisConfig.min = minX * 0.8;
      
      xAxisConfig.max = maxX * 1.2;
    } else {
      const xPadding = xRange * 0.05;
      xAxisConfig.min = minX - xPadding;
      xAxisConfig.max = maxX + xPadding;
    }
  }

  if (yMin !== undefined) yAxisConfig.min = yMin;
  if (yMax !== undefined) yAxisConfig.max = yMax;

  if (allYValues.length > 0 && yMin === undefined && yMax === undefined) {
    const minY = Math.min(...allYValues);
    const maxY = Math.max(...allYValues);
    const yRange = maxY - minY;
    if (logarithmicY) {
      yAxisConfig.min = Math.max(0.001, minY * 0.8);
      yAxisConfig.max = maxY * 1.2;
    } else {
      const yPadding = yRange * 0.05;
      yAxisConfig.min = minY - yPadding;
      yAxisConfig.max = maxY + yPadding;
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="text-slate-900 text-center font-medium mb-3">{title}</h3>
      <div className="h-80">
        <Line
          data={{
            datasets: series.map((s, idx) => ({
              label: s.label,
              data: s.data,
              borderColor: s.color || CHART_COLORS[idx % CHART_COLORS.length],
              backgroundColor:
                s.color || CHART_COLORS[idx % CHART_COLORS.length],
              showLine: s.showLine ?? showLine,
              pointRadius: (s.showLine ?? showLine) ? 0 : 4,
              borderWidth: (s.showLine ?? showLine) ? 2 : 0,
              parsing: false as const,
            })),
          }}
          options={{
            animation: false,
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              x: xAxisConfig as any,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              y: yAxisConfig as any,
            },
            plugins: {
              legend: { labels: { color: "#334155" } },
              title: { display: false },
            },
          }}
        />
      </div>
    </div>
  );
}
