import QRCode from "qrcode";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { AppData } from "../App";
import { useLanguage } from "../context/LanguageContext";
import { decodeBase64UrlToJson } from "../lib/localStorage";
import type { AngleData } from "./AngleCharacteristic";
import type { FrequencyData } from "./FrequencyCharacteristic";
import type { LuxAmperData } from "./LuxAmper";
import type { VAData } from "./VACharacteristic";

interface CompressedExportData {
  u1?: number[][]; // [current, voltage]
  u2?: number[][]; // [angle, voltage, amplitude]
  u3?: number[][]; // [frequency, voltage, amplitude]
  u4?: number[][]; // [amplitude, voltage]
  // Legacy format support
  vaCharacteristic?: VAData[];
  angleCharacteristic?: AngleData[];
  frequencyCharacteristic?: FrequencyData[];
  luxAmper?: LuxAmperData[];
  timestamp: string;
}

interface ExportData extends AppData {
  timestamp: string;
}

export const ExportPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // For HashRouter, query params are in the hash, not search
    const hash = window.location.hash; // e.g., "#/export?data=xyz"
    const queryString = hash.includes("?") ? hash.split("?")[1] : "";
    const urlParams = new URLSearchParams(queryString);
    const dataParam = urlParams.get("data");
    console.log("dataParam", urlParams);

    if (!dataParam) {
      setError(t.exportPageMissingData);
      setIsLoading(false);
      return;
    }

    try {
      // Try new format: base64url
      const json = decodeBase64UrlToJson(dataParam);
      const parsedData = JSON.parse(json) as CompressedExportData;
      const decompressed = decompressData(parsedData);
      if (decompressed) {
        setExportData(decompressed);
      } else {
        setError(t.exportPageDecompressError);
      }
    } catch (primaryErr) {
      try {
        // Fallback to legacy: encodeURIComponent(JSON) -> btoa
        const legacyDecoded = decodeURIComponent(atob(dataParam));
        const parsedLegacy = JSON.parse(legacyDecoded) as CompressedExportData;
        const decompressed = decompressData(parsedLegacy);
        if (decompressed) {
          setExportData(decompressed);
        } else {
          setError(t.exportPageDecompressError);
        }
      } catch (legacyErr) {
        console.error("Error parsing export data:", primaryErr, legacyErr);
        setError(t.exportPageDecodeError);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    setIsLoading(false);
  }, []);

  // Decompress data from compressed format to AppData format
  const decompressData = (
    compressed: CompressedExportData
  ): ExportData | null => {
    try {
      const result: ExportData = {
        vaCharacteristic: [],
        angleCharacteristic: [],
        frequencyCharacteristic: [],
        luxAmper: [],
        timestamp: compressed.timestamp,
      };

      // Check if data is in new compressed format
      if (compressed.u1 || compressed.u2 || compressed.u3 || compressed.u4) {
        // Decompress u1: VA Characteristic - [current, voltage]
        if (compressed.u1) {
          result.vaCharacteristic = compressed.u1.map((item: number[]) => ({
            current: item[0],
            voltage: item[1],
          }));
        }

        // Decompress u2: Angle Characteristic - [angle, voltage, amplitude]
        if (compressed.u2) {
          result.angleCharacteristic = compressed.u2.map((item: number[]) => ({
            angle: item[0],
            voltage: item[1],
            amplitude: item[2],
          }));
        }

        // Decompress u3: Frequency Characteristic - [frequency, voltage, amplitude]
        if (compressed.u3) {
          result.frequencyCharacteristic = compressed.u3.map(
            (item: number[]) => ({
              id: `${item[0]}-${item[2]}-${Date.now()}-${Math.random()}`,
              frequency: item[0],
              voltage: item[1],
              amplitude: item[2],
            })
          );
        }

        // Decompress u4: Lux-Amper - [amplitude, voltage]
        if (compressed.u4) {
          result.luxAmper = compressed.u4.map((item: number[]) => ({
            amplitude: item[0],
            voltage: item[1],
          }));
        }
      } else {
        // Legacy format - use data as is
        result.vaCharacteristic = compressed.vaCharacteristic || [];
        result.angleCharacteristic = compressed.angleCharacteristic || [];
        result.frequencyCharacteristic =
          compressed.frequencyCharacteristic || [];
        result.luxAmper = compressed.luxAmper || [];
      }

      return result;
    } catch (error) {
      console.error("Error decompressing data:", error);
      return null;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const locale = language === "cs" ? "cs-CZ" : "en-US";
    return new Date(timestamp).toLocaleString(locale);
  };

  // Generate QR code for current export URL
  const generateQRCode = useCallback(async () => {
    if (!canvasRef.current || !exportData) return;

    try {
      const currentUrl = window.location.href;
      await QRCode.toCanvas(canvasRef.current, currentUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  }, [exportData]);

  // Generate QR code when data is loaded
  useEffect(() => {
    if (exportData) {
      generateQRCode();
    }
  }, [exportData, generateQRCode]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
          <p className="text-slate-600">{t.exportPageLoading}</p>
        </div>
      </div>
    );
  }

  if (error || !exportData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {t.exportPageErrorTitle}
          </h1>
          <p className="text-slate-600 mb-4">
            {error || t.exportPageNoDataFound}
          </p>
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md"
          >
            {t.exportPageBack}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - hidden when printing */}
      <header className="bg-white shadow-sm border-b border-slate-200 print:hidden">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {t.exportPageTitle}
              </h1>
              <p className="text-slate-600 mt-1">
                {t.exportPageDataFrom.replace(
                  "{timestamp}",
                  formatTimestamp(exportData.timestamp)
                )}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center gap-2"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                {t.exportPagePrint}
              </button>
              <button
                onClick={() => (window.location.href = "/")}
                className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-md"
              >
                {t.exportPageBack}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Print header with QR code */}
        <div className="hidden print:block mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {t.exportPageTitle}
              </h1>
              <p className="text-slate-600 text-lg">
                {t.exportPageDataFrom.replace(
                  "{timestamp}",
                  formatTimestamp(exportData.timestamp)
                )}
              </p>
            </div>
            <div className="text-center">
              <div className="border-2 border-slate-300 rounded-lg p-2 bg-white">
                <canvas
                  ref={canvasRef}
                  width={500}
                  height={500}
                  className="max-w-full h-auto"
                />
              </div>
              <p className="text-sm text-slate-600 mt-2">
                QR kód pro opětovné načtení dat
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* VA Characteristic */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {t.exportPageVaTitle}
            </h2>

            {exportData.vaCharacteristic.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-slate-600">
                        {t.exportPageVaTableCurrent}
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600">
                        {t.exportPageVaTableVoltage}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportData.vaCharacteristic
                      .sort((a, b) => a.current - b.current)
                      .map((item, index) => (
                        <tr key={index} className="border-b border-slate-100">
                          <td className="py-2 px-3">
                            {item.current.toFixed(0)}
                          </td>
                          <td className="py-2 px-3">
                            {item.voltage.toFixed(3)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 italic">{t.exportPageNoMeasurements}</p>
            )}
          </div>

          {/* Angle Characteristic */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {t.exportPageAngleTitle}
            </h2>

            {exportData.angleCharacteristic.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-slate-600">
                        {t.exportPageAngleTableAmplitude}
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600">
                        {t.exportPageAngleTableAngle}
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600">
                        {t.exportPageAngleTableVoltage}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportData.angleCharacteristic.map((item, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="py-2 px-3">
                          {item.amplitude.toFixed(0)}
                        </td>
                        <td className="py-2 px-3">{item.angle.toFixed(1)}</td>
                        <td className="py-2 px-3">{item.voltage.toFixed(3)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 italic">{t.exportPageNoMeasurements}</p>
            )}
          </div>

          {/* Frequency Characteristic */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {t.exportPageFrequencyTitle}
            </h2>

            {exportData.frequencyCharacteristic.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-slate-600">
                        {t.exportPageFrequencyTableAmplitude}
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600">
                        {t.exportPageFrequencyTableFrequency}
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600">
                        {t.exportPageFrequencyTableVoltage}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportData.frequencyCharacteristic
                      .sort((a, b) => a.frequency - b.frequency)
                      .map((item, index) => (
                        <tr key={index} className="border-b border-slate-100">
                          <td className="py-2 px-3">
                            {item.amplitude.toFixed(0)}
                          </td>
                          <td className="py-2 px-3">
                            {item.frequency.toFixed(1)}
                          </td>
                          <td className="py-2 px-3">
                            {item.voltage.toFixed(3)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 italic">{t.exportPageNoMeasurements}</p>
            )}
          </div>

          {/* Lux-Amper Characteristic */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {t.exportPageLuxTitle}
            </h2>

            {exportData.luxAmper.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-slate-600">
                        {t.exportPageLuxTableAmplitude}
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600">
                        {t.exportPageLuxTableVoltage}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportData.luxAmper
                      .sort((a, b) => a.amplitude - b.amplitude)
                      .map((item, index) => (
                        <tr key={index} className="border-b border-slate-100">
                          <td className="py-2 px-3">
                            {item.amplitude.toFixed(0)}
                          </td>
                          <td className="py-2 px-3">
                            {item.voltage.toFixed(3)}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 italic">{t.exportPageNoMeasurements}</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
