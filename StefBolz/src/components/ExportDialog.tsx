import QRCode from "qrcode";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import type { AppData } from "../App";
import { useLanguage } from "../context/LanguageContext";
import { encodeJsonToBase64Url } from "../lib/localStorage";
import { Modal, ModalActions, ModalContent, ModalHeader } from "./Modal";

type ExportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  data: AppData;
};

export const ExportDialog: FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const { t } = useLanguage();

  const exportTimestamp = useMemo(() => {
    return new Date().toISOString();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const serializedData = useMemo(() => {
    const exportData = {
      // cold resistance: [voltage, current] x5
      cold: data.coldResistance.map((item) => [item.voltage, item.current]),
      // hot measurements: [voltage, current]
      hot: data.hotMeasurements.map((item) => [item.voltage, item.current]),
      // filament params
      d: data.filamentDiameter,
      l: data.filamentLength,
      t0: data.ambientTemp,
      timestamp: exportTimestamp,
    };
    return JSON.stringify(exportData);
  }, [data, exportTimestamp]);

  const generateExportUrl = useCallback(() => {
    const base64Data = encodeJsonToBase64Url(serializedData);
    const currentOrigin = window.location.href.split("#")[0];
    return `${currentOrigin}#/export?data=${base64Data}`;
  }, [serializedData]);

  const generateQRCode = useCallback(async () => {
    setIsGenerating(true);
    try {
      const exportUrl = generateExportUrl();
      const qrDataUrl = await QRCode.toDataURL(exportUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      setQrDataUrl(qrDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [generateExportUrl]);

  useEffect(() => {
    if (isOpen) {
      generateQRCode();
    }
  }, [isOpen, generateQRCode]);

  const downloadQRCode = () => {
    if (qrDataUrl) {
      const link = document.createElement("a");
      link.download = `stefbolz-data-${new Date().toISOString().split("T")[0]}.png`;
      link.href = qrDataUrl;
      link.click();
    }
  };

  const copyUrlToClipboard = async () => {
    try {
      const exportUrl = generateExportUrl();
      await navigator.clipboard.writeText(exportUrl);
      alert(t.exportDialogCopySuccess);
    } catch (error) {
      console.error("Error copying URL to clipboard:", error);
      alert(t.exportDialogCopyError);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader
        title={t.exportDialogTitle}
        subtitle={t.exportDialogSubtitle}
        onClose={onClose}
      />
      <ModalContent>
        <div className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <h3 className="text-lg font-medium text-slate-900">
              {t.exportDialogQrTitle}
            </h3>
            <div className="border-2 border-slate-200 rounded-lg p-4 bg-white">
              {isGenerating ? (
                <div className="w-[400px] h-[400px] flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
                </div>
              ) : qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={t.exportDialogQrAlt}
                  className="max-w-full h-auto"
                  style={{ width: "400px", height: "400px" }}
                />
              ) : (
                <div className="w-[400px] h-[400px] flex items-center justify-center text-slate-500">
                  {t.exportDialogQrGenerating}
                </div>
              )}
            </div>
            <p className="text-sm text-slate-600 text-center max-w-md">
              {t.exportDialogQrDescription}
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-medium text-slate-900">
              {t.exportDialogExportUrlTitle}
            </h3>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <div className="text-sm text-slate-700 break-all">
                {generateExportUrl()}
              </div>
            </div>
          </div>
        </div>
      </ModalContent>
      <ModalActions>
        <button
          onClick={copyUrlToClipboard}
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
        >
          {t.exportDialogCopyUrl}
        </button>
        <button
          onClick={downloadQRCode}
          disabled={!qrDataUrl || isGenerating}
          className="px-4 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-sm"
        >
          {t.exportDialogDownloadQr}
        </button>
      </ModalActions>
    </Modal>
  );
};
