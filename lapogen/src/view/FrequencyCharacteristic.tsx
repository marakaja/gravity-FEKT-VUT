import { useCallback, useEffect, useMemo, useState, type FC } from "react";
import { DataTable, type Column } from "../components/DataTable";
import { XYChart } from "../components/XYChart";
import { useLanguage } from "../context/LanguageContext";
import { useWebSerialContext } from "../context/useWebSerialContext";

export type FrequencyData = {
  id: string;
  frequency: number;
  voltage: number;
  amplitude: number;
};

type FrequencyCharacteristicProps = {
  data: FrequencyData[];
  onDataChange: (data: FrequencyData[]) => void;
  isConnected: boolean;
};

export const FrequencyCharacteristic: FC<FrequencyCharacteristicProps> = ({
  data,
  onDataChange,
  isConnected,
}) => {
  const { setParameters, parsedData, measureAll } = useWebSerialContext();
  const { t } = useLanguage();
  const [amplitudeInput, setAmplitudeInput] = useState("");
  const [frequencyInput, setFrequencyInput] = useState("");
  const [logarithmicY, setLogarithmicY] = useState(false);

  const getColorForAmplitude = useCallback((amplitude: number) => {
    // Normalize amplitude to 0-1 range, where 0 maps to 0 and 30000 maps to 1
    // This ensures even color distribution in the full range 0-30000
    const normalized = Math.max(0, Math.min(1, amplitude / 30000));
    // Create gradient from blue (0) to red (1)
    // Hues: 240 (blue) -> 0 (red) going through green and yellow
    const hue = 240 * (1 - normalized);
    const saturation = 70 + normalized * 30; // 70-100%
    const lightness = 50;
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  }, []);

  useEffect(() => {
    if (!isConnected) return;
    const intervalId = window.setInterval(() => {
      measureAll();
    }, 200);
    return () => {
      clearInterval(intervalId);
    };
  }, [isConnected, measureAll]);

  const handleAddPoint = async () => {
    const amplitude = parseFloat(amplitudeInput);
    const frequency = parseFloat(frequencyInput);

    if (isNaN(amplitude) || amplitude < 0 || amplitude > 30000) {
      alert(t.frequencyAlertInvalidAmplitude);
      return;
    }
    if (isNaN(frequency) || frequency < 1 || frequency > 200000) {
      alert(t.frequencyAlertInvalidFrequency);
      return;
    }

    // Check angle before opening dialog - arm must be at 0° with ±5° tolerance
    if (parsedData.angle === undefined || Math.abs(parsedData.angle) > 5) {
      alert(
        t.frequencyAlertAngleNotZero.replace(
          "{angle}",
          parsedData.angle?.toFixed(1) ?? "N/A"
        )
      );
      return;
    }

    // Check if point with same amplitude and frequency already exists
    const exists = data.some(
      (d) => d.amplitude === amplitude && d.frequency === frequency
    );
    if (exists) {
      alert(
        t.frequencyAlertDuplicatePoint
          .replace("{amplitude}", amplitude.toString())
          .replace("{frequency}", frequency.toString())
      );
      return;
    }

    await setParameters(amplitude, frequency, amplitude / 2);
    await measureAll();
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Generate unique ID
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const newPoint: FrequencyData = {
      id,
      frequency,
      voltage: parsedData.peek,
      amplitude,
    };

    onDataChange([...data, newPoint].sort((a, b) => a.frequency - b.frequency));
    setFrequencyInput("");
  };

  const handleDelete = (index: number) => {
    onDataChange(data.filter((_, i) => i !== index));
  };

  const columns: Column<FrequencyData>[] = [
    {
      key: "amplitude",
      label: t.frequencyColumnAmplitude,
      render: (item) => item.amplitude.toFixed(0),
    },
    {
      key: "frequency",
      label: t.frequencyColumnFrequency,
      render: (item) => item.frequency.toFixed(1),
    },
    {
      key: "voltage",
      label: t.frequencyColumnVoltage,
      render: (item) => item.voltage.toFixed(3),
    },
  ];

  // Group data by amplitude for different colored series
  const amplitudeGroups = useMemo(() => {
    const groups = new Map<number, FrequencyData[]>();
    data.forEach((point) => {
      if (!groups.has(point.amplitude)) {
        groups.set(point.amplitude, []);
      }
      groups.get(point.amplitude)!.push(point);
    });
    return groups;
  }, [data]);

  const chartSeries = Array.from(amplitudeGroups.entries())
    .sort(([a], [b]) => a - b)
    .map(([amplitude, points]) => ({
      label: `${amplitude} uA`,
      data: points
        .sort((a, b) => a.frequency - b.frequency)
        .map((d) => ({ x: d.frequency, y: d.voltage })),
      color: getColorForAmplitude(amplitude),
    }));

  return (
    <main className="container py-6 space-y-6">
      <section className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-slate-900 font-medium">
            {t.frequencyTitle}
          </h3>
        </div>
        <p className="text-slate-700 text-sm mb-4">
          {t.frequencyDescription}
        </p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.frequencyAmplitudeLabel}
            </label>
            <input
              type="number"
              min="0"
              max="30000"
              step="1"
              value={amplitudeInput}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow numbers and empty string
                if (value === "" || /^\d+$/.test(value)) {
                  setAmplitudeInput(value);
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.frequencyAmplitudePlaceholder}
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.frequencyFrequencyLabel}
            </label>
            <input
              type="number"
              min="1"
              max="200000"
              step="0.1"
              value={frequencyInput}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow numbers and empty string
                if (value === "" || /^\d+$/.test(value)) {
                  setFrequencyInput(value);
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={t.frequencyFrequencyPlaceholder}
            />
          </div>
          <button
            onClick={handleAddPoint}
            disabled={!isConnected || !amplitudeInput || !frequencyInput}
            className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white"
          >
            {t.frequencyAddPoint}
          </button>
        </div>
      </section>

      <section className="card p-4">
        {" "}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-slate-900 font-medium">
            {t.frequencyChartTitle}
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-slate-700">{t.frequencyLogarithmicY}</span>
            <input
              type="checkbox"
              checked={logarithmicY}
              onChange={(e) => setLogarithmicY(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
        <XYChart
          title=""
          xAxisLabel={t.frequencyXAxisLabel}
          yAxisLabel={t.frequencyYAxisLabel}
          series={chartSeries}
          logarithmicX={true}
          logarithmicY={logarithmicY}
          showLine={false}
          yMin={0}
          yMax={2000}
          xMin={100}
          xMax={200000}
        />
      </section>

      <section className="card p-4">
        <h3 className="text-slate-900 font-medium mb-3">{t.frequencyTableTitle}</h3>

        <DataTable
          columns={columns}
          data={data}
          onDelete={handleDelete}
          emptyMessage={t.frequencyEmptyMeasurements}
        />
      </section>
    </main>
  );
};
