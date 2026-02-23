import { useState, type Dispatch, type FC, type SetStateAction } from "react";
import { SerialDialog100 } from "../components/SerialDialog100";
import type { Pendulum2Data } from "../App";
import { useLanguage } from "../context/LanguageContext";

type Channel = "nahoře" | "dole";

type Pendulum2Props = {
  setPendulum2Data: Dispatch<SetStateAction<Pendulum2Data>>;
  pendulum2Data: Pendulum2Data;
  intersection: { distance: number; time: number };
};

export const Pendulum2: FC<Pendulum2Props> = ({
  setPendulum2Data,
  pendulum2Data,
  intersection,
}) => {
  const { t } = useLanguage();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [measurementChannel, setMeasurementChannel] =
    useState<Channel>("nahoře");

  function openDialogFor(channel: Channel) {
    setMeasurementChannel(channel);
    setDialogOpen(true);
  }

  function handleSave(tenValueSums: number[]) {
    if (measurementChannel === "nahoře") {
      setPendulum2Data((prev: Pendulum2Data) => ({
        ...prev,
        measureA: tenValueSums,
      }));
    } else {
      setPendulum2Data((prev: Pendulum2Data) => ({
        ...prev,
        measureB: tenValueSums,
      }));
    }
    setDialogOpen(false);
  }

  const descriptionLabels = [10, 20, 30, 40, 50, 60, 70, 80, 90].map((count) =>
    t.pendulum2OscillationTimeLabel.replace("{count}", String(count))
  );

  return (
    <div className="container p-4 space-y-4">
      <div className="flex gap-2 mb-4">
        <button
          className="px-3 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-white shadow-sm"
          onClick={() => openDialogFor("nahoře")}
        >
          {t.pendulum2OpenTop}
        </button>
        <button
          className="px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm"
          onClick={() => openDialogFor("dole")}
        >
          {t.pendulum2OpenBottom}
        </button>
      </div>

      <section className="card p-4">
        <h3 className="text-slate-900 font-medium mb-3">
          {t.pendulum2ComputedSummary
            .replace("{distance}", intersection.distance.toFixed(2))
            .replace("{time}", intersection.time.toFixed(0))}
        </h3>
      </section>

      <div className="overflow-auto rounded-md border border-slate-200 shadow-sm">
        <table className="min-w-full text-sm text-slate-900">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-slate-700">
                {t.pendulum2TableDescription}
              </th>
              <th className="text-left px-3 py-2 font-medium text-slate-700">
                {t.pendulum2TableTop}
              </th>
              <th className="text-left px-3 py-2 font-medium text-slate-700">
                {t.pendulum2TableBottom}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {descriptionLabels.map((label, idx) => (
              <tr key={idx} className="odd:bg-white even:bg-slate-50">
                <td className="px-3 py-2">{label}</td>
                <td className="px-3 py-2">
                  {pendulum2Data.measureA[idx]?.toFixed(1) ?? "-"}
                </td>
                <td className="px-3 py-2">
                  {pendulum2Data.measureB[idx]?.toFixed(1) ?? "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <SerialDialog100
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        measurementChannel={measurementChannel}
        onSave={handleSave}
      />
    </div>
  );
};
