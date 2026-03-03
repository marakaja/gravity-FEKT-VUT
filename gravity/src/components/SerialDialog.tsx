import type { Dispatch, SetStateAction } from "react";
import { useEffect, useState } from "react";
import { useLanguage } from "../context/LanguageContext";
import { useWebSerialContext } from "../context/useWebSerialContext";
import { Modal, ModalActions, ModalContent, ModalHeader } from "./Modal";

type Props = {
  inputValueA: string;
  isOpen: boolean;
  onClose: () => void;
  setInputValueA: Dispatch<SetStateAction<string>>;
  measurementChannel: "A" | "B";
  setMeasurementChannel: Dispatch<SetStateAction<"A" | "B">>;
  onSave: (average: number) => void;
};

export function SerialDialog(props: Props) {
  const {
    inputValueA,
    isOpen,
    onClose,
    setInputValueA,
    measurementChannel,
    setMeasurementChannel,
    onSave,
  } = props;

  const { t } = useLanguage();

  const { lastLine, lastLineSeq } = useWebSerialContext();
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
        if (next.length >= 20) {
          setMeasurementActive(false);
          return next.slice(-20);
        }
        return next;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastLine, lastLineSeq, measurementActive]);

  function start() {
    setMeasurementSamples([]);
    setMeasurementActive(true);
  }

  function stop() {
    setMeasurementActive(false);
  }

  function removeSample(index: number) {
    setMeasurementSamples((prev) => prev.filter((_, i) => i !== index));
  }

  function handleSave() {
    if (measurementSamples.length < 5) return;
    const avg =
      measurementSamples.reduce((s, v) => s + v, 0) / measurementSamples.length;
    onSave(avg);
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} modal size="md">
      <ModalHeader title={t.serialDialogTitle} onClose={onClose} />
      <ModalContent className="bg-white p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-600">
              {t.serialDialogDistanceLabel}
            </span>
            <input
              type="number"
              value={inputValueA}
              onChange={(e) => {
                const value = e.target.value;
                setInputValueA(value);
              }}
              className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-300"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-600">
              {t.serialDialogChannelLabel}
            </span>
            <select
              className="px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-300"
              value={measurementChannel}
              onChange={(e) =>
                setMeasurementChannel(e.target.value as "A" | "B")
              }
            >
              <option value="A">{t.serialDialogChannelTop}</option>
              <option value="B">{t.serialDialogChannelBottom}</option>
            </select>
          </label>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={start}
            disabled={measurementActive}
            className="px-3 py-2 rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white shadow-sm"
          >
            {t.serialDialogStart20}
          </button>
          <button
            onClick={stop}
            disabled={!measurementActive}
            className="px-3 py-2 rounded-md bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white shadow-sm"
          >
            {t.serialDialogStop}
          </button>
          <button
            onClick={handleSave}
            disabled={measurementSamples.length < 5 || !inputValueA}
            className="ml-auto px-3 py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-sm"
          >
            {t.serialDialogContinue} {/* (průměr {measurementSamples.length}) */}
          </button>
        </div>
        <div className="text-sm text-slate-700 mb-2 flex items-center gap-2">
          <span>{t.serialDialogLastValues}</span>
          <span className="ml-auto text-slate-600">
            {t.serialDialogAveragePeriod}{" "}
            <b>
              {" "}
              {measurementSamples.length > 0
                ? (
                    measurementSamples.reduce((s, v) => s + v, 0) /
                    measurementSamples.length
                  ).toFixed(0)
                : "-"}{" "}
              ms
            </b>
          </span>
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
                <th className="text-right px-3 py-2 font-medium text-slate-700 w-16">
                  {t.serialDialogActionHeader}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {measurementSamples
                .map((v, i) => ({ v, i }))
                .reverse()
                .map(({ v, i }, displayIndex) => (
                  <tr key={i} className="odd:bg-white even:bg-slate-50 group">
                    <td className="px-3 py-2">{measurementSamples.length - displayIndex}</td>
                    <td className="px-3 py-2">{v}</td>
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={() => removeSample(i)}
                        className="text-slate-400 hover:text-rose-600 p-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                        title={t.serialDialogDelete}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={1.5}
                          stroke="currentColor"
                          className="w-5 h-5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </ModalContent>
      <ModalActions>
        {/* <button
          onClick={onClose}
          className="ml-auto px-3 py-2 rounded-md border border-slate-300 text-slate-700 hover:bg-slate-50 shadow-sm"
        >
          Zavřít
        </button> */}
      </ModalActions>
    </Modal>
  );
}
