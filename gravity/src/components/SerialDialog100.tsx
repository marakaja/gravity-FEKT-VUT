import {
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { useEffect, useMemo, useState } from "react";
import { Line } from "react-chartjs-2";
import { useLanguage } from "../context/LanguageContext";
import { useWebSerialContext } from "../context/useWebSerialContext";
import { Modal, ModalActions, ModalContent, ModalHeader } from "./Modal";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend
);

type Props = {
  isOpen: boolean;
  onClose: () => void;
  measurementChannel: "nahoře" | "dole";
  onSave: (tenValueSums: number[]) => void;
};

export function SerialDialog100(props: Props) {
  const { isOpen, onClose, measurementChannel, onSave } = props;

  const { t } = useLanguage();

  type Sample = { value: number; isOutlier: boolean };

  const { lastLine, lastLineSeq } = useWebSerialContext();
  const [measurementActive, setMeasurementActive] = useState<boolean>(false);
  const [measurementSamples, setMeasurementSamples] = useState<Sample[]>([]);
  const [skippedFirstSample, setSkippedFirstSample] = useState<boolean>(false);

  // Reset local dialog state when opened/closed
  useEffect(() => {
    if (isOpen) {
      setMeasurementActive(false);
      setMeasurementSamples([]);
      setSkippedFirstSample(false);
    }
  }, [isOpen]);

  // Collect samples from lastLine when measurement is active (kept only in dialog)
  useEffect(() => {
    if (!measurementActive || !lastLine) return;
    const numMatch = lastLine.match(/[+-]?\d+(?:\.\d+)?/);
    if (numMatch) {
      const val = parseFloat(numMatch[0]);
      if (!skippedFirstSample) {
        setSkippedFirstSample(true);
        return;
      }
      setMeasurementSamples((prev) => {
        const validSamples = prev.filter((s) => !s.isOutlier);
        const avg =
          validSamples.length >= 3
            ? validSamples.reduce((acc, s) => acc + s.value, 0) /
              validSamples.length
            : 0;
        const isOutlier =
          validSamples.length >= 3 && Math.abs(val - avg) > 0.1 * avg;
        const next = [...prev, { value: val, isOutlier }];
        if (next.length >= 100) {
          setMeasurementActive(false);
          return next.slice(-100);
        }
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastLine, lastLineSeq, measurementActive]);

  function start() {
    setMeasurementSamples([]);
    setMeasurementActive(true);
    setSkippedFirstSample(false);
  }

  function stop() {
    setMeasurementActive(false);
  }

  function handleSave() {
    const validSamples = measurementSamples.filter((s) => !s.isOutlier);
    if (validSamples.length < 90) return;
    const lastNinety = validSamples.slice(-90);
    const sums: number[] = [];
    let runningSum = 0;
    for (let i = 0; i < 90; i++) {
      runningSum += lastNinety[i].value;
      if ((i + 1) % 10 === 0) {
        sums.push(runningSum);
      }
    }
    onSave(sums);
  }

  // Počet vyřazených (outlier) vzorků
  const outlierCount = useMemo(
    () => measurementSamples.filter((s) => s.isOutlier).length,
    [measurementSamples]
  );

  // Informace o vyřazených vzorcích
  const outlierWarning = useMemo(() => {
    if (outlierCount === 0) return null;
    const validSamples = measurementSamples.filter((s) => !s.isOutlier);
    const avg =
      validSamples.length > 0
        ? validSamples.reduce((acc, s) => acc + s.value, 0) / validSamples.length
        : 0;
    return (
      <div className="mb-4 p-3 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
        {t.serialDialog100OutlierWarning.replace("{avg}", avg.toFixed(2))}
        {" "}
        <strong>{outlierCount}</strong> vyřazeno (odchylka &gt; 10 %).
      </div>
    );
  }, [measurementSamples, outlierCount]);

  const count = measurementSamples.length;
  const validCount = count - outlierCount;
  const canSave = validCount >= 90;

  return (
    <Modal isOpen={isOpen} onClose={onClose} modal size="own">
      <ModalHeader
        title={t.serialDialog100Title.replace(
          "{channel}",
          measurementChannel === "nahoře"
            ? t.serialDialogChannelTop
            : t.serialDialogChannelBottom
        )}
        onClose={onClose}
      />
      <ModalContent className="bg-white p-6">
        {outlierWarning}

        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={start}
            disabled={measurementActive}
            className="px-3 py-2 rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white shadow-sm"
          >
            {t.serialDialog100Start}
          </button>
          <button
            onClick={stop}
            disabled={!measurementActive}
            className="px-3 py-2 rounded-md bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white shadow-sm"
          >
            {t.serialDialog100Stop}
          </button>
          <div className="text-black text-xl font-bold ml-auto">
            {validCount}{outlierCount > 0 && <span className="text-rose-500 text-base"> (+{outlierCount} vyřazených)</span>} / 100
          </div>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className="ml-auto px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-sm"
          >
            {t.serialDialog100Save}
          </button>
        </div>

        <div className="overflow-auto rounded-md border border-slate-200 shadow-sm max-h-72">
          <table className="min-w-full text-sm text-slate-900">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-slate-700">
                  {t.serialDialogIndexHeader}
                </th>
                <th className="text-left px-3 py-2 font-medium text-slate-700">
                  {t.serialDialogPeriodHeader}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {(() => {
                const slice = measurementSamples.slice(-100);
                return [...slice].reverse().map((s, i) => {
                  const rowClass = s.isOutlier
                    ? "bg-rose-50 text-rose-500 line-through"
                    : "odd:bg-white even:bg-slate-50";
                  return (
                    <tr key={i} className={rowClass}>
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2">{s.value}{s.isOutlier ? " ✕" : ""}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
        {(() => {
          const slice = measurementSamples.slice(-100);

          // Rozdělení bodů na platné a outlier
          const validPoints = slice
            .map((s, i) => ({ x: i + 1, y: s.value, outlier: s.isOutlier }))
            .filter((p) => !p.outlier);
          const outlierPoints = slice
            .map((s, i) => ({ x: i + 1, y: s.value, outlier: s.isOutlier }))
            .filter((p) => p.outlier);

          // Dynamické limity Y-osy: ±15 % od průměru platných hodnot
          const validValues = validPoints.map((p) => p.y);
          const avg =
            validValues.length > 0
              ? validValues.reduce((a, b) => a + b, 0) / validValues.length
              : 2000;
          const yMin = avg * 0.85;
          const yMax = avg * 1.15;

          return (
            <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
              <div className="h-72">
                <Line
                  data={{
                    datasets: [
                      ...(validPoints.length > 0
                        ? [
                            {
                              label: "Platné",
                              data: validPoints,
                              showLine: true,
                              pointRadius: 2,
                              pointBackgroundColor: "#16a34a",
                              pointBorderColor: "#16a34a",
                              borderColor: "#16a34a",
                              backgroundColor: "rgba(22,163,74,0.1)",
                              spanGaps: true,
                              order: 2,
                            },
                          ]
                        : []),
                      ...(outlierPoints.length > 0
                        ? [
                            {
                              label: "Vyřazené (>10 %)",
                              data: outlierPoints,
                              showLine: false,
                              pointRadius: 5,
                              pointStyle: "crossRot" as const,
                              pointBackgroundColor: "#e11d48",
                              pointBorderColor: "#e11d48",
                              borderColor: "transparent",
                              backgroundColor: "rgba(225,29,72,0.1)",
                              order: 1,
                            },
                          ]
                        : []),
                    ],
                  }}
                  options={{
                    animation: false,
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      x: {
                        type: "linear",
                        title: {
                          display: true,
                          text: "Měření",
                          color: "#334155",
                        },
                        grid: { color: "#e2e8f0" },
                        ticks: { color: "#334155" },
                      },
                      y: {
                        type: "linear",
                        min: yMin,
                        max: yMax,
                        title: {
                          display: true,
                          text: "Perioda [ms]",
                          color: "#334155",
                        },
                        grid: { color: "#e2e8f0" },
                        ticks: { color: "#334155" },
                      },
                    },
                    plugins: {
                      legend: {
                        display: outlierPoints.length > 0,
                        labels: { usePointStyle: true },
                      },
                      title: { display: false },
                    },
                  }}
                />
              </div>
            </div>
          );
        })()}
      </ModalContent>
      <ModalActions>
        <button
          onClick={onClose}
          className="ml-auto px-3 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          Zavřít
        </button>
      </ModalActions>
    </Modal>
  );
}
