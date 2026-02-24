import { useEffect, useRef, useState, type FC } from "react";
import { DataTable, type Column } from "../components/DataTable";
import { GaugeChart } from "../components/GaugeChart";
import { XYChart } from "../components/XYChart";
import { useLanguage } from "../context/LanguageContext";
import { useWebSerialContext } from "../context/useWebSerialContext";

export type VAData = {
  current: number;
  voltage: number;
};

type VACharacteristicProps = {
  data: VAData[];
  onDataChange: (data: VAData[]) => void;
  isConnected: boolean;
};

export const VACharacteristic: FC<VACharacteristicProps> = ({
  data,
  onDataChange,
  isConnected,
}) => {
  const { setParameters, parsedData, measureAll } = useWebSerialContext();
  const { t } = useLanguage();
  const [currentInput, setCurrentInput] = useState("");
  const [logarithmicX, setLogarithmicX] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const debounceRef = useRef<number | null>(null);

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

  // Debounced parameter setting
  useEffect(() => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }

    const current = parseFloat(currentInput);
    if (
      !isNaN(current) &&
      current > 0 &&
      current >= 1 &&
      current <= 30000 &&
      isConnected
    ) {
      debounceRef.current = window.setTimeout(async () => {
        // For VA characteristic: amp=0, offset=current, freq=1000 Hz (any non-zero)
        await setParameters(0, 1000, current);
      }, 500); // 500ms debounce
    }

    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [currentInput, isConnected, setParameters]);

  const handleSaveMeasurement = () => {
    if (parsedData.voltage === undefined || parsedData.voltage === 0) {
      alert(t.vaAlertMeasureVoltage);
      return;
    }
    const current = parseFloat(currentInput);
    if (isNaN(current) || current <= 0) {
      return;
    }
    const voltage = parsedData.voltage; // Convert from mV to V
    const newPoint: VAData = { current, voltage };

    // Always add new point, even for duplicate current values
    onDataChange([...data, newPoint]);
  };

  const handleDelete = (index: number) => {
    onDataChange(data.filter((_, i) => i !== index));
  };

  const columns: Column<VAData>[] = [
    {
      key: "current",
      label: t.vaCurrentLabel,
      render: (item) => item.current.toFixed(0),
    },
    {
      key: "voltage",
      label: t.vaYAxisLabel,
      render: (item) => item.voltage.toFixed(3),
    },
  ];

  const chartSeries = [
    {
      label: t.vaChartTitle,
      data: data
        .map((d) => ({ x: d.current, y: d.voltage }))
        .sort((a, b) => a.x - b.x),
      color: "#3b82f6",
    },
  ];

  return (
    <main className="container py-6 space-y-6">
      <section className="card p-4">
        <h3 className="text-slate-900 font-medium mb-3">
          {t.vaTitle}
        </h3>
        <p className="text-slate-700 text-sm mb-4">
          {t.vaDescription}
        </p>
        <div className="flex gap-4 items-center">
          <div className="flex-1 min-w-0">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.vaCurrentLabel}
            </label>
            <input
              type="number"
              min="1"
              max="30000"
              step="1"
              value={currentInput}
              onChange={(e) => {
                const value = e.target.value;
                // Only allow numbers and empty string
                if (value === "" || /^\d+$/.test(value)) {
                  setCurrentInput(value);
                }
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1-30000"
            />
            <p className="text-xs text-slate-500 mt-1">{t.vaCurrentRangeHint}</p>
            {(() => {
              const current = parseFloat(currentInput);
              const isValid = !isNaN(current) && current > 0;
              return (
                <div className="flex gap-2 w-full mt-4">
                  <button
                    onClick={handleSaveMeasurement}
                    disabled={
                      parsedData.voltage === undefined ||
                      parsedData.voltage === 0 ||
                      !isValid
                    }
                    className="w-full px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white"
                  >
                    {t.vaAddPoint}
                  </button>
                </div>
              );
            })()}
          </div>

          {isConnected && (
            <div className="flex-1 min-w-0 flex gap-4 items-start p-4 bg-slate-50 rounded-md border border-slate-200">
              <div className="flex-1 min-w-0">
                <GaugeChart
                  value={(() => {
                    const current = parseFloat(currentInput);
                    const isValid = !isNaN(current) && current > 0;
                    return isValid ? parsedData.voltage ?? 0 : 0;
                  })()}
                  min={0}
                  max={3300}
                  label="LED Voltage"
                  unit="mV"
                />
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-slate-900 font-medium">{t.vaChartTitle}</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-slate-700">{t.vaLogX}</span>
            <input
              type="checkbox"
              checked={logarithmicX}
              onChange={(e) => setLogarithmicX(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
        <XYChart
          title=""
          xAxisLabel={t.vaXAxisLabel}
          yAxisLabel={t.vaYAxisLabel}
          series={chartSeries}
          showLine={false}
          logarithmicX={logarithmicX}
          yMin={900}
          yMax={1500}
          xMin={0}
          xMax={30000}
        />
      </section>

      <section className="card p-4">
        <h3 className="text-slate-900 font-medium mb-3">
          {t.vaTableTitle}
        </h3>
        <DataTable
          columns={columns}
          data={data.sort((a, b) => a.current - b.current)}
          onDelete={handleDelete}
          emptyMessage={t.vaEmptyMeasurements}
        />
      </section>
    </main>
  );
};
