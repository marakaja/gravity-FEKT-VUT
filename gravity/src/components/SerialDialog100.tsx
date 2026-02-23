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

  const { lastLine } = useWebSerialContext();
  const [measurementActive, setMeasurementActive] = useState<boolean>(false);
  const [measurementSamples, setMeasurementSamples] = useState<number[]>([]);
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
        const next = [...prev, val];
        if (next.length >= 100) {
          setMeasurementActive(false);
          return next.slice(-100);
        }
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastLine, measurementActive]);

  function start() {
    setMeasurementSamples([]);
    setMeasurementActive(true);
    setSkippedFirstSample(false);
  }

  function stop() {
    setMeasurementActive(false);
  }

  function handleSave() {
    if (measurementSamples.length < 90) return;
    const lastNinety = measurementSamples.slice(-90);
    const sums: number[] = [];
    for (let i = 0; i < 90; i += 10) {
      const block = lastNinety.slice(i, i + 10);
      const s = block.reduce((acc, v) => acc + v, 0);
      sums.push(s);
    }
    onSave(sums);
  }

  // Výpočet varování pro odlehlé kmity - vždy aktuální při změně vzorků
  const outlierWarning = useMemo(() => {
    const lastNinety = measurementSamples.slice(-90);
    if (lastNinety.length === 90) {
      const avg = lastNinety.reduce((acc, v) => acc + v, 0) / 90;
      const outliers = lastNinety
        .map((v, i) => ({ v, i }))
        .filter(({ v }) => Math.abs(v - avg) > 0.1 * avg);
      if (outliers.length > 0) {
        const warningText = t.serialDialog100OutlierWarning.replace(
          "{avg}",
          avg.toFixed(2)
        );
        return (
          <div className="mb-4 p-3 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
            {warningText}
            <br />
            {/* Indexy: {outliers.map(({ i }) => i + 1).join(", ")} */}
          </div>
        );
      }
    }
    return null;
  }, [measurementSamples]);

  const count = measurementSamples.length;
  const canSave = count >= 90;

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
            {count} / 100
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
                const highlightStart = Math.max(0, slice.length - 90);
                return slice.reverse().map((v, i) => {
                  const isFaded = i < highlightStart;
                  return (
                    <tr
                      key={i}
                      className={`odd:bg-white even:bg-slate-50 ${
                        isFaded ? "text-slate-400" : ""
                      }`}
                    >
                      <td className="px-3 py-2">{i + 1}</td>
                      <td className="px-3 py-2">{v}</td>
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
        {(() => {
          const slice = measurementSamples.slice(-100);
          const highlightStart = Math.max(0, slice.length - 90);

          // Rozdělení bodů na faded a aktivní
          const fadedPoints = slice.slice(0, highlightStart).map((v, i) => ({
            x: i + 1,
            y: v,
          }));
          const activePoints = slice.slice(highlightStart).map((v, i) => ({
            x: highlightStart + i + 1,
            y: v,
          }));

          // Plugin pro šedé pozadí pod faded body
          const fadedBgPlugin = {
            id: "fadedBgPlugin",
            beforeDatasetsDraw: (chart: ChartJS) => {
              const { ctx, chartArea } = chart;
              if (!chartArea) return;
              if (highlightStart > 0) {
                const xAxis = chart.scales.x;
                const xStart = xAxis.getPixelForValue(1);
                const xEnd = xAxis.getPixelForValue(highlightStart);
                ctx.save();
                ctx.fillStyle = "rgba(148,163,184,0.15)"; // slate-400, light
                ctx.fillRect(
                  xStart,
                  chartArea.top,
                  xEnd - xStart,
                  chartArea.bottom - chartArea.top
                );
                ctx.restore();
              }
            },
          };

          return (
            <div className="mt-4 bg-white rounded-xl border border-slate-200 p-4">
              <div className="h-72">
                <Line
                  data={{
                    datasets: [
                      ...(fadedPoints.length > 0
                        ? [
                            {
                              data: fadedPoints,
                              showLine: true,
                              pointRadius: 2,
                              pointBackgroundColor: "rgba(148,163,184,0.3)", // slate-400 faded
                              pointBorderColor: "rgba(148,163,184,0.3)",
                              borderColor: "rgba(148,163,184,0.7)", // faded line
                              backgroundColor: "rgba(148,163,184,0.1)",
                              spanGaps: true,
                              order: 1,
                            },
                          ]
                        : []),
                      ...(activePoints.length > 0
                        ? [
                            {
                              data: activePoints,
                              showLine: true,
                              pointRadius: 2,
                              pointBackgroundColor: "#16a34a", // green-600
                              pointBorderColor: "#16a34a",
                              borderColor: "#16a34a", // green line
                              backgroundColor: "rgba(22,163,74,0.1)",
                              spanGaps: true,
                              order: 2,
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
                      legend: { display: false },
                      title: { display: false },
                    },
                  }}
                  plugins={[fadedBgPlugin]}
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
