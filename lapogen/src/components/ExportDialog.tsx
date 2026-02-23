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

  // Store timestamp when dialog opens to prevent QR code regeneration
  const exportTimestamp = useMemo(() => {
    return new Date().toISOString();
  }, [isOpen]);

  // Serialize data to JSON string with compressed format
  // Use useMemo to create stable serialized data that only changes when actual data content changes
  const serializedData = useMemo(() => {
    const exportData = {
      // ulohy1: VA Characteristic - [current, voltage]
      u1: data.vaCharacteristic.map((item) => [item.current, item.voltage]),
      // ulohy2: Angle Characteristic - [angle, voltage, amplitude]
      u2: data.angleCharacteristic.map((item) => [
        item.angle,
        item.voltage,
        item.amplitude,
      ]),
      // ulohy3: Frequency Characteristic - [frequency, voltage, amplitude]
      u3: data.frequencyCharacteristic.map((item) => [
        item.frequency,
        item.voltage,
        item.amplitude,
      ]),
      // ulohy4: Lux-Amper - [amplitude, voltage]
      u4: data.luxAmper.map((item) => [item.amplitude, item.voltage]),
      timestamp: exportTimestamp,
    };
    return JSON.stringify(exportData);
  }, [
    data.vaCharacteristic,
    data.angleCharacteristic,
    data.frequencyCharacteristic,
    data.luxAmper,
    exportTimestamp,
  ]);

  // Generate export URL with base64url encoded data
  const generateExportUrl = useCallback(() => {
    const base64Data = encodeJsonToBase64Url(serializedData);
    const currentOrigin = window.location.href.split("#")[0];
    return `${currentOrigin}#/export?data=${base64Data}`;
  }, [serializedData]);

  // Generate QR code
  const generateQRCode = useCallback(async () => {
    setIsGenerating(true);
    try {
      const exportUrl = generateExportUrl();
      console.log("Generating QR code for URL:", exportUrl);

      // Generate QR code as data URL
      const qrDataUrl = await QRCode.toDataURL(exportUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      console.log("QR code generated successfully");
      setQrDataUrl(qrDataUrl);
    } catch (error) {
      console.error("Error generating QR code:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [generateExportUrl]);

  // Generate QR code when dialog opens
  useEffect(() => {
    if (isOpen) {
      generateQRCode();
    }
  }, [isOpen, generateQRCode]);

  const downloadQRCode = () => {
    if (qrDataUrl) {
      const link = document.createElement("a");
      link.download = `lapogen-data-${
        new Date().toISOString().split("T")[0]
      }.png`;
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
          {/* QR Code Display */}
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

          {/* Export URL */}
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
