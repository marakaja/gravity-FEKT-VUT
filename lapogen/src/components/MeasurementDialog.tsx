import { type FC, useState, useEffect, useRef } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useLanguage } from "../context/LanguageContext";
import { useWebSerialContext } from "../context/useWebSerialContext";

type MeasurementDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (voltage: number) => void;
  title: string;
  showAngleWarning?: boolean;
  angleThreshold?: number;
};

export const MeasurementDialog: FC<MeasurementDialogProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  showAngleWarning = false,
  angleThreshold = 5,
}) => {
  const { parsedData, measureAll } = useWebSerialContext();
  const { t } = useLanguage();
  const [samples, setSamples] = useState<number[]>([]);
  const [isCollecting, setIsCollecting] = useState(false);
  const intervalRef = useRef<number | null>(null);

  // Start/stop periodic measurements when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setSamples([]);
      setIsCollecting(false);
      // Start polling measurements every 200ms
      intervalRef.current = window.setInterval(() => {
        measureAll();
      }, 200);
    } else {
      // Stop polling when dialog closes
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
  }, [isOpen, measureAll]);

  useEffect(() => {
    if (isCollecting && parsedData.voltage !== undefined) {
      setSamples((prev) => [...prev, parsedData.voltage].slice(-100));
    }
  }, [parsedData.voltage, isCollecting]);

  const average =
    samples.length > 0
      ? samples.reduce((a, b) => a + b, 0) / samples.length
      : 0;

  const isAngleOk =
    !showAngleWarning || Math.abs(parsedData.angle) <= angleThreshold;

  const handleSave = () => {
    if (samples.length === 0) {
      alert(t.measurementDialogStartFirst);
      return;
    }
    onSave(average);
    onClose();
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg shadow-xl p-6 w-full max-w-md z-50">
          <Dialog.Title className="text-xl font-semibold text-slate-900 mb-4">
            {title}
          </Dialog.Title>

          <div className="space-y-4">
            {showAngleWarning && (
              <div
                className={`p-3 rounded-md border ${
                  isAngleOk
                    ? "bg-green-50 border-green-200 text-green-700"
                    : "bg-amber-50 border-amber-200 text-amber-700"
                }`}
              >
                <div className="text-sm font-medium">
                  {isAngleOk
                    ? t.measurementDialogAngleOk
                    : t.measurementDialogAngleOutOfRange.replace(
                        "{threshold}",
                        String(angleThreshold)
                      )}
                </div>
                <div className="text-xs mt-1">
                  {t.measurementDialogCurrentAngle.replace(
                    "{angle}",
                    parsedData.angle.toFixed(1)
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 p-3 rounded-md">
                <div className="text-xs text-slate-600">
                  {t.measurementDialogCurrentVoltage}
                </div>
                <div className="text-2xl font-semibold text-slate-900">
                  {parsedData.voltage.toFixed(0)}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-md">
                <div className="text-xs text-slate-600">
                  {t.measurementDialogAverage.replace(
                    "{count}",
                    String(samples.length)
                  )}
                </div>
                <div className="text-2xl font-semibold text-slate-900">
                  {average.toFixed(1)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-2 rounded-md">
                <div className="text-xs text-slate-500">
                  {t.measurementDialogPeek}
                </div>
                <div className="font-semibold text-slate-900">
                  {parsedData.peek.toFixed(0)}
                </div>
              </div>
              <div className="bg-slate-50 p-2 rounded-md">
                <div className="text-xs text-slate-500">
                  {t.measurementDialogAngleLabel}
                </div>
                <div className="font-semibold text-slate-900">
                  {parsedData.angle.toFixed(1)}°
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {!isCollecting ? (
                <button
                  onClick={() => setIsCollecting(true)}
                  className="flex-1 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white"
                >
                  {t.measurementDialogStartCollect}
                </button>
              ) : (
                <button
                  onClick={() => setIsCollecting(false)}
                  className="flex-1 px-4 py-2 rounded-md bg-amber-600 hover:bg-amber-500 text-white"
                >
                  {t.measurementDialogStopCollect}
                </button>
              )}
              <button
                onClick={() => setSamples([])}
                className="px-4 py-2 rounded-md bg-slate-300 hover:bg-slate-200 text-slate-700"
              >
                {t.measurementDialogReset}
              </button>
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-200">
              <button
                onClick={handleSave}
                disabled={
                  samples.length === 0 || (showAngleWarning && !isAngleOk)
                }
                className="flex-1 px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white"
              >
                {t.measurementDialogSave}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md bg-slate-300 hover:bg-slate-200 text-slate-700"
              >
                {t.measurementDialogCancel}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
