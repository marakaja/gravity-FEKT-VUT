import { useEffect, useRef, useState, type FC } from "react";
import { DataTable, type Column } from "../components/DataTable";
import { XYChart } from "../components/XYChart";
import { useLanguage } from "../context/LanguageContext";
import { useWebSerialContext } from "../context/useWebSerialContext";

export type LuxAmperData = {
  amplitude: number;
  voltage: number;
};

type LuxAmperProps = {
  data: LuxAmperData[];
  onDataChange: (data: LuxAmperData[]) => void;
  isConnected: boolean;
};

export const LuxAmper: FC<LuxAmperProps> = ({
  data,
  onDataChange,
  isConnected,
}) => {
  const { setParameters, parsedData, measureAll } = useWebSerialContext();
  const { t } = useLanguage();
  const [amplitudeInput, setAmplitudeInput] = useState("");
  const pendingMeasurementRef = useRef<{
    amplitude: number;
    timestamp: number;
  } | null>(null);
  const measurementTimeoutRef = useRef<number | null>(null);
  const stabilizationTimeoutRef = useRef<number | null>(null);
  const dataRef = useRef(data);
  const intervalRef = useRef<number | null>(null);
  const lastStablePeekRef = useRef<number | undefined>(undefined);
  const peekHistoryRef = useRef<number[]>([]);

  // Keep dataRef in sync with data prop
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Start/stop periodic measurements when connected
  useEffect(() => {
    if (isConnected) {
      // Start polling measurements every 200ms
      intervalRef.current = window.setInterval(() => {
        measureAll();
      }, 200);
    } else {
      // Stop polling when disconnected
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isConnected, measureAll]);

  // Handle measurement response - wait for stabilized peek value after parameter change
  useEffect(() => {
    if (pendingMeasurementRef.current === null) {
      // Track peek history when not waiting for measurement
      if (parsedData.peek !== undefined && parsedData.peek >= 0) {
        peekHistoryRef.current = [
          ...peekHistoryRef.current.slice(-4),
          parsedData.peek,
        ];
      }
      return;
    }

    const { amplitude, timestamp } = pendingMeasurementRef.current;

    // Only process if enough time has passed since parameter change
    if (Date.now() < timestamp + 500) {
      return; // Wait at least 500ms for device to settle
    }

    // Track peek values to detect stabilization
    if (parsedData.peek !== undefined && parsedData.peek >= 0) {
      peekHistoryRef.current = [
        ...peekHistoryRef.current.slice(-4),
        parsedData.peek,
      ];

      // Check if values have stabilized (last 3 values are similar within 1%)
      if (peekHistoryRef.current.length >= 3) {
        const recent = peekHistoryRef.current.slice(-3);
        const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
        const maxDiff = Math.max(...recent.map((v) => Math.abs(v - avg)));
        const tolerance = avg * 0.01; // 1% tolerance

        if (maxDiff <= tolerance) {
          // Values have stabilized, save the measurement
          if (measurementTimeoutRef.current !== null) {
            clearTimeout(measurementTimeoutRef.current);
            measurementTimeoutRef.current = null;
          }
          if (stabilizationTimeoutRef.current !== null) {
            clearTimeout(stabilizationTimeoutRef.current);
            stabilizationTimeoutRef.current = null;
          }

          const peak = avg; // Use average of stabilized values
          const newPoint: LuxAmperData = { amplitude, voltage: peak };
          onDataChange(
            [...dataRef.current, newPoint].sort(
              (a, b) => a.amplitude - b.amplitude
            )
          );
          setAmplitudeInput("");
          pendingMeasurementRef.current = null;
          peekHistoryRef.current = [];
          lastStablePeekRef.current = peak;
        }
      }
    }
  }, [parsedData.peek, onDataChange]);

  const handleAddPoint = async () => {
    const amplitude = parseFloat(amplitudeInput);

    if (isNaN(amplitude) || amplitude < 0 || amplitude > 30000) {
      alert(t.luxInvalidAmplitude);
      return;
    }

    // Check angle before opening dialog - arm must be at 0° with ±5° tolerance
    if (parsedData.angle === undefined || Math.abs(parsedData.angle) > 5) {
      alert(
        t.luxAngleOutOfRange.replace(
          "{angle}",
          parsedData.angle?.toFixed(1) ?? "N/A"
        )
      );
      return;
    }

    // For Lux-Amper: freq=1000 Hz, offset=50% of amplitude
    await setParameters(amplitude, 1000, amplitude / 2);

    // Clear any previous stabilization timeout
    if (stabilizationTimeoutRef.current !== null) {
      clearTimeout(stabilizationTimeoutRef.current);
    }
    if (measurementTimeoutRef.current !== null) {
      clearTimeout(measurementTimeoutRef.current);
    }

    // Reset peek history for new measurement
    peekHistoryRef.current = [];

    // Set pending measurement with timestamp so useEffect can handle the response
    const measurementTimestamp = Date.now();
    pendingMeasurementRef.current = {
      amplitude,
      timestamp: measurementTimestamp,
    };

    // Set timeout to handle case where measurement doesn't stabilize
    measurementTimeoutRef.current = window.setTimeout(() => {
      if (pendingMeasurementRef.current !== null) {
        // If we have some values, use the last one even if not fully stabilized
        if (peekHistoryRef.current.length > 0) {
          const peak =
            peekHistoryRef.current[peekHistoryRef.current.length - 1];
          const newPoint: LuxAmperData = { amplitude, voltage: peak };
          onDataChange(
            [...dataRef.current, newPoint].sort(
              (a, b) => a.amplitude - b.amplitude
            )
          );
          setAmplitudeInput("");
        } else {
          alert(t.luxPeakMissing);
        }
        pendingMeasurementRef.current = null;
        measurementTimeoutRef.current = null;
        peekHistoryRef.current = [];
      }
    }, 5000); // 5 second timeout - give device time to stabilize
  };

  const handleDelete = (index: number) => {
    onDataChange(data.filter((_, i) => i !== index));
  };

  const columns: Column<LuxAmperData>[] = [
    {
      key: "amplitude",
      label: t.luxAmplitudeLabel,
      render: (item) => item.amplitude.toFixed(0),
    },
    {
      key: "voltage",
      label: t.luxYAxisLabel,
      render: (item) => item.voltage.toFixed(3),
    },
  ];

  const chartSeries = [
    {
      label: t.luxChartTitle,
      data: data.map((d) => ({ x: d.amplitude, y: d.voltage })),
      color: "#10b981",
    },
  ];

  return (
    <main className="container py-6 space-y-6">
      <section className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-slate-900 font-medium">
            {t.luxTitle}
          </h3>
        </div>
        <p className="text-slate-700 text-sm mb-4">
          {t.luxDescription}
        </p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.luxAmplitudeLabel}
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
              placeholder={t.luxAmplitudeLabel}
            />
          </div>
          <button
            onClick={handleAddPoint}
            disabled={!isConnected || !amplitudeInput}
            className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white"
          >
            {t.luxAddPoint}
          </button>
        </div>
      </section>

      <section className="card p-4">
        <XYChart
          title={t.luxChartTitle}
          xAxisLabel={t.luxXAxisLabel}
          yAxisLabel={t.luxYAxisLabel}
          series={chartSeries}
          xMin={0}
          xMax={30000}
          yMin={0}
          yMax={2000}
        />
      </section>

      <section className="card p-4">
        <h3 className="text-slate-900 font-medium mb-3">{t.luxTableTitle}</h3>
        <DataTable
          columns={columns}
          data={data}
          onDelete={handleDelete}
          emptyMessage={t.luxEmptyMeasurements}
        />
      </section>
    </main>
  );
};
