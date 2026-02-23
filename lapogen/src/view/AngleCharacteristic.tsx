import { useEffect, useRef, useState, type FC } from "react";
import { AngleGaugeChart } from "../components/AngleGaugeChart";
import { DataTable, type Column } from "../components/DataTable";
import { GaugeChart } from "../components/GaugeChart";
import { PolarChart } from "../components/PolarChart";
import { useLanguage } from "../context/LanguageContext";
import { useWebSerialContext } from "../context/useWebSerialContext";

export type AngleData = {
  angle: number;
  voltage: number; // peek value from device
  amplitude: number;
};

type AngleCharacteristicProps = {
  data: AngleData[];
  onDataChange: (data: AngleData[]) => void;
  isConnected: boolean;
};

//TODO: oddělat čáry z výsledného grafu
//TODO: nicetohave: čáry na grafu po 30 stupňích

export const AngleCharacteristic: FC<AngleCharacteristicProps> = ({
  data,
  onDataChange,
  isConnected,
}) => {
  const { setParameters, parsedData, measureAll } = useWebSerialContext();
  const { t } = useLanguage();
  const [amplitudeInput, setAmplitudeInput] = useState("");
  const intervalRef = useRef<number | null>(null);
  const debounceRef = useRef<number | null>(null);
  const lastAmplitudeRef = useRef<number | null>(null);
  const lastDataRef = useRef<{ angle: number; peek: number } | null>(null);
  const autoSaveTimeoutRef = useRef<number | null>(null);

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

    const amplitude = parseInt(amplitudeInput);
    if (
      !isNaN(amplitude) &&
      amplitude >= 0 &&
      amplitude <= 30000 &&
      isConnected
    ) {
      debounceRef.current = window.setTimeout(async () => {
        // For angle characteristic: freq=200 Hz, offset=50% of amplitude
        await setParameters(amplitude, 200, amplitude / 2);
        lastAmplitudeRef.current = amplitude;
        // Reset last data to wait for new measurements
        lastDataRef.current = null;
      }, 500); // 500ms debounce
    }

    return () => {
      if (debounceRef.current !== null) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [amplitudeInput, isConnected, setParameters]);

  // Auto-save data when angle changes (device moved to new position)
  useEffect(() => {
    if (
      !isConnected ||
      lastAmplitudeRef.current === null ||
      parsedData.angle === undefined ||
      parsedData.peek === undefined ||
      parsedData.peek <= 0
    ) {
      return;
    }

    const currentData = { angle: parsedData.angle, peek: parsedData.peek };

    // Only save if angle changed significantly (at least 1 degree)
    if (
      lastDataRef.current &&
      Math.abs(lastDataRef.current.angle - currentData.angle) < 1
    ) {
      return; // Angle hasn't changed enough, skip
    }

    // Clear any pending timeout
    if (autoSaveTimeoutRef.current !== null) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Wait a bit for measurement to stabilize before saving
    autoSaveTimeoutRef.current = window.setTimeout(() => {
      const amplitude = lastAmplitudeRef.current!;
      const newPoint: AngleData = {
        angle: currentData.angle,
        voltage: currentData.peek, // Use peek value
        amplitude,
      };

      // Check if this exact point already exists (same amplitude and similar angle/voltage)
      const currentDataList = [...data];
      const exists = currentDataList.some(
        (d) =>
          d.amplitude === amplitude &&
          Math.abs(d.angle - currentData.angle) < 1 &&
          Math.abs(d.voltage - currentData.peek) < 0.1
      );

      if (!exists) {
        onDataChange(
          [...currentDataList, newPoint].sort(
            (a, b) => a.amplitude - b.amplitude || a.angle - b.angle
          )
        );
      }

      lastDataRef.current = currentData;
    }, 800); // Wait 800ms for device to stabilize

    return () => {
      if (autoSaveTimeoutRef.current !== null) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parsedData.angle, parsedData.peek, isConnected]);

  const handleAddPoint = () => {
    // Manually save current measurement using current device values
    if (
      !isConnected ||
      parsedData.angle === undefined ||
      parsedData.peek === undefined ||
      parsedData.amp === undefined ||
      parsedData.amp <= 0
    ) {
      alert(t.angleAlertWaitForDevice);
      return;
    }

    // Use current amplitude from device
    const amplitude = parseInt(amplitudeInput);

    const newPoint: AngleData = {
      angle: parsedData.angle,
      voltage: parsedData.peek,
      amplitude,
    };

    // Check if this exact point already exists
    const exists = data.some(
      (d) =>
        d.amplitude === amplitude &&
        Math.abs(d.angle - parsedData.angle) < 1 &&
        Math.abs(d.voltage - parsedData.peek) < 0.1
    );

    if (!exists) {
      onDataChange(
        [...data, newPoint].sort(
          (a, b) => a.amplitude - b.amplitude || a.angle - b.angle
        )
      );
      lastDataRef.current = { angle: parsedData.angle, peek: parsedData.peek };
      lastAmplitudeRef.current = amplitude;
    }
  };

  const handleDelete = (index: number) => {
    onDataChange(data.filter((_, i) => i !== index));
  };

  const columns: Column<AngleData>[] = [
    {
      key: "amplitude",
      label: t.angleColumnAmplitude,
      render: (item) => item.amplitude.toFixed(0),
    },
    {
      key: "angle",
      label: t.angleColumnAngle,
      render: (item) => item.angle.toFixed(1),
    },
    {
      key: "voltage",
      label: t.angleColumnVoltage,
      render: (item) => item.voltage.toFixed(3),
    },
  ];

  const polarData = data.map((d) => ({
    angle: d.angle,
    value: d.voltage, // voltage contains peek value
    amplitude: d.amplitude,
  }));

  return (
    <main className="container py-6 space-y-6">
      <section className="card p-4">
        <h3 className="text-slate-900 font-medium mb-3">{t.angleTitle}</h3>
        <p className="text-slate-700 text-sm mb-4">
          {t.angleDescription}
        </p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              {t.angleSetAmplitudeLabel}
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
              placeholder={t.angleInputPlaceholder}
            />
            {/* {isConnected &&
              parsedData.amp !== undefined &&
              parsedData.amp > 0 && (
                <p className="text-xs text-slate-500 mt-1">
                  Amplituda: {parsedData.amp.toFixed(0)} uA
                </p>
              )} */}
          </div>
          <button
            onClick={handleAddPoint}
            disabled={
              !isConnected ||
              parsedData.angle === undefined ||
              parsedData.peek === undefined ||
              parsedData.amp === undefined ||
              parsedData.amp <= 0
            }
            className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white"
          >
            {t.angleAddPoint}
          </button>
        </div>
      </section>

      <section className="card p-4">
        <h3 className="text-slate-900 font-medium mb-4">
          {t.angleCurrentValuesTitle}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AngleGaugeChart
            value={(() => {
              // Use parsedData.angle if available and connected
              if (isConnected && parsedData.angle !== undefined) {
                // Convert 0-360° to -180 to 180°
                return parsedData.angle > 180
                  ? parsedData.angle - 360
                  : parsedData.angle;
              }
              // Use last measurement if available
              if (data.length > 0) {
                const lastAngle = data[data.length - 1].angle;
                return lastAngle > 180 ? lastAngle - 360 : lastAngle;
              }
              return 0;
            })()}
            min={-{t.angleDetectorLabel}
            max={180}
            label="Úhel detektoru"
            unit="°"
          />
          <GaugeChart
            value={(() => {
              // Use parsedData if available and connected, otherwise use last measurement
              if (
                isConnected &&
                parsedData.peek !== undefined &&
                parsedData.peek > 0
              ) {
                return parsedData.peek; // Value is in mV
              }
              return 0;
            })()}
            min={0}
            max={3300}
            label={t.angleVoltageLabel}
            unit="V"
          />
        </div>
      </section>

      <section className="card p-4">
        <PolarChart title={t.anglePolarTitle} data={polarData} />
      </section>

      <section className="card p-4">
        <h3 className="text-slate-900 font-medium mb-3">
          {t.angleTableTitle}
        </h3>
        <DataTable
          columns={columns}
          data={data}
          onDelete={handleDelete}
          emptyMessage={t.angleEmptyMeasurements}
        />
      </section>
    </main>
  );
};
