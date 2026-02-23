import React, { useEffect, useState, useRef, useCallback } from "react";
import QRCode from "qrcode";
import type { Pendulum1Data, Pendulum2Data } from "../App";
import { useLanguage } from "../context/LanguageContext";
import { decodeBase64UrlToJson } from "../lib/localStorage";

interface ExportData {
  pendulum1: Pendulum1Data;
  pendulum2: Pendulum2Data;
  timestamp: string;
  version: string;
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
      // Try new format: deflate + base64url
      const json = decodeBase64UrlToJson(dataParam);
      const parsedData = JSON.parse(json) as ExportData;
      setExportData(parsedData);
    } catch (primaryErr) {
      try {
        // Fallback to legacy: encodeURIComponent(JSON) -> btoa
        const legacyDecoded = decodeURIComponent(atob(dataParam));
        const parsedLegacy = JSON.parse(legacyDecoded) as ExportData;
        setExportData(parsedLegacy);
      } catch (legacyErr) {
        console.error("Error parsing export data:", primaryErr, legacyErr);
        setError(t.exportPageDecodeError);
      } finally {
        setIsLoading(false);
      }
      return;
    }
    setIsLoading(false);
  }, [t.exportPageDecodeError, t.exportPageMissingData]);

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

  // Check if pendulum1 table has <= 20 rows for single page optimization
  const isSinglePageOptimized =
    exportData && exportData.pendulum1.measure.length <= 20;

  return (
    <div
      className={`min-h-screen bg-slate-50 ${
        isSinglePageOptimized ? "print:single-page" : ""
      }`}
    >
      {/* Header - hidden when printing */}
      <header className="bg-white shadow-sm border-b border-slate-200 print:hidden">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {t.exportPageTitle}
              </h1>
              <p className="text-slate-600 mt-1">
                {t.exportPageDataFrom
                  .replace("{timestamp}", formatTimestamp(exportData.timestamp))
                  .replace("{version}", exportData.version)}
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
                {t.exportPageDataFrom
                  .replace("{timestamp}", formatTimestamp(exportData.timestamp))
                  .replace("{version}", exportData.version)}
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
                {t.exportPageQrReload}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Kyvadlo 1 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {t.exportPagePendulum1Title}
            </h2>

            {/* Měření */}
            <div>
              {exportData.pendulum1.measure.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 text-slate-600">
                          {t.exportPagePendulum1TableDistance}
                        </th>
                        <th className="text-left py-2 px-3 text-slate-600">
                          {t.exportPagePendulum1TableTop}
                        </th>
                        <th className="text-left py-2 px-3 text-slate-600">
                          {t.exportPagePendulum1TableBottom}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {exportData.pendulum1.measure.map((measure, index) => (
                        <tr key={index} className="border-b border-slate-100">
                          <td className="py-2 px-3">
                            {measure.valueA ?? "N/A"}
                          </td>
                          <td className="py-2 px-3">
                            {measure.measureA ?? "N/A"}
                          </td>
                          <td className="py-2 px-3">
                            {measure.measureB ?? "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500 italic">
                  {t.exportPageNoMeasurements}
                </p>
              )}
            </div>

            {/* Průsečík */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-slate-700 mb-3">
                {t.exportPagePendulum1ParamsTitle}
              </h3>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">
                    {t.exportPageDistanceLabel}{" "}
                  </span>
                  <span className="text-lg font-semibold text-slate-900">
                    {exportData.pendulum1.intersection.distance.toFixed(2)} mm
                  </span>
                  <span className="text-sm text-slate-600 ml-4">
                    {t.exportPageTimeLabel}{" "}
                  </span>
                  <span className="text-lg font-semibold text-slate-900">
                    {exportData.pendulum1.intersection.time.toFixed(1)} ms
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Kyvadlo 2 */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {t.exportPagePendulum2Title}
            </h2>

            {/* Měření */}
            <div>
              {exportData.pendulum2.measureA.length > 0 ||
              exportData.pendulum2.measureB.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 text-slate-600">
                          {t.exportPagePendulum2TableOrder}
                        </th>
                        <th className="text-left py-2 px-3 text-slate-600">
                          {t.exportPagePendulum2TableTop}
                        </th>
                        <th className="text-left py-2 px-3 text-slate-600">
                          {t.exportPagePendulum2TableBottom}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from(
                        {
                          length:
                            Math.max(
                              exportData.pendulum2.measureA.length,
                              exportData.pendulum2.measureB.length
                            ) + 1, // +1 for the 0 kmit row
                        },
                        (_, index) => {
                          const kmit = index * 10;

                          // Calculate cumulative sums
                          let t1 = 0;
                          let t2 = 0;

                          if (index > 0) {
                            // Sum all values from 0 to index-1
                            for (let i = 0; i < index; i++) {
                              t1 += exportData.pendulum2.measureA[i] ?? 0;
                              t2 += exportData.pendulum2.measureB[i] ?? 0;
                            }
                          }

                          return (
                            <tr
                              key={index}
                              className="border-b border-slate-100"
                            >
                              <td className="py-2 px-3">{kmit}</td>
                              <td className="py-2 px-3">{t1.toFixed(0)}</td>
                              <td className="py-2 px-3">{t2.toFixed(0)}</td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-500 italic">
                  {t.exportPageNoMeasurements}
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
