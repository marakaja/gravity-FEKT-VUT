import QRCode from "qrcode";
import React, { useCallback, useEffect, useRef, useState } from "react";
import type { AppData, ColdResistanceRow, HotMeasurementRow } from "../App";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { XYChart } from "../components/XYChart";
import { useLanguage } from "../context/LanguageContext";
import { decodeBase64UrlToJson } from "../lib/localStorage";

interface CompressedExportData {
  cold?: number[][]; // [voltage, current]
  hot?: number[][];  // [voltage, current]
  d?: number;
  l?: number;
  t0?: number;
  // Legacy format support
  coldResistance?: ColdResistanceRow[];
  hotMeasurements?: HotMeasurementRow[];
  filamentDiameter?: number;
  filamentLength?: number;
  ambientTemp?: number;
  timestamp: string;
}

interface ExportData extends AppData {
  timestamp: string;
}

// Temperature of tungsten filament from resistance:
//   R_T = R_293 * [1 + a*(T - 273) + b*(T - 273)^2]
// Solving quadratic for x = (T - 273)

// Stefan-Boltzmann constant [W/(m²·K⁴)]
const SIGMA = 5.670374419e-8;
const A_COEFF = 4.636e-3;
const B_COEFF = 3.19e-7;

function computeResults(
  coldRows: ColdResistanceRow[],
  hotRows: HotMeasurementRow[],
  filamentDiameter: number,
  filamentLength: number,
  ambientTempC: number
) {
  const validCold = coldRows.filter((r) => r.voltage > 0 && r.current > 0);
  if (validCold.length === 0) return [];

  const R0 =
    validCold.reduce((sum, r) => sum + r.voltage / r.current, 0) /
    validCold.length;

  const T0 = ambientTempC + 273.15;

  const d_m = filamentDiameter / 1000;
  const l_m = filamentLength / 1000;
  const surfaceArea = Math.PI * d_m * l_m;

  return hotRows
    .filter((r) => r.voltage > 0 && r.current > 0)
    .map((r) => {
      const U = r.voltage;
      const I = r.current;
      const P = U * I;
      const R = U / I;
      const ratio = R / R0;
      const k = ratio;
      const discriminant = A_COEFF * A_COEFF - 4 * B_COEFF * (1 - k);
      const T_K =
        discriminant >= 0
          ? 273 + (-A_COEFF + Math.sqrt(discriminant)) / (2 * B_COEFF)
          : T0;
      const emissivity =
        surfaceArea > 0 && T_K > T0
          ? P / (SIGMA * surfaceArea * (Math.pow(T_K, 4) - Math.pow(T0, 4)))
          : null;

      return {
        voltage: U,
        current: I,
        power: P,
        resistance: R,
        ratio,
        temperatureK: T_K,
        emissivity,
      };
    });
}

export const ExportPage: React.FC = () => {
  const { t, language } = useLanguage();
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const hash = window.location.hash;
    const queryString = hash.includes("?") ? hash.split("?")[1] : "";
    const urlParams = new URLSearchParams(queryString);
    const dataParam = urlParams.get("data");

    if (!dataParam) {
      setError(t.exportPageMissingData);
      setIsLoading(false);
      return;
    }

    try {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const decompressData = (
    compressed: CompressedExportData
  ): ExportData | null => {
    try {
      const result: ExportData = {
        coldResistance: [],
        hotMeasurements: [],
        filamentDiameter: 0,
        filamentLength: 0,
        ambientTemp: 22,
        timestamp: compressed.timestamp,
      };

      if (compressed.cold || compressed.hot) {
        if (compressed.cold) {
          result.coldResistance = compressed.cold.map((item: number[]) => ({
            voltage: item[0],
            current: item[1],
          }));
        }
        if (compressed.hot) {
          result.hotMeasurements = compressed.hot.map((item: number[]) => ({
            voltage: item[0],
            current: item[1],
          }));
        }
        result.filamentDiameter = compressed.d ?? 0;
        result.filamentLength = compressed.l ?? 0;
        result.ambientTemp = compressed.t0 ?? 22;
      } else {
        result.coldResistance = compressed.coldResistance || [];
        result.hotMeasurements = compressed.hotMeasurements || [];
        result.filamentDiameter = compressed.filamentDiameter ?? 0;
        result.filamentLength = compressed.filamentLength ?? 0;
        result.ambientTemp = compressed.ambientTemp ?? 22;
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

  const generateQRCode = useCallback(async () => {
    if (!canvasRef.current || !exportData) return;
    try {
      const currentUrl = window.location.href;
      await QRCode.toCanvas(canvasRef.current, currentUrl, {
        width: 300,
        margin: 2,
        color: { dark: "#000000", light: "#FFFFFF" },
      });
    } catch (error) {
      console.error("Error generating QR code:", error);
    }
  }, [exportData]);

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

  // Computed values for display
  const validCold = exportData.coldResistance.filter(
    (r) => r.voltage > 0 && r.current > 0
  );
  const averageR0 =
    validCold.length > 0
      ? validCold.reduce((sum, r) => sum + r.voltage / r.current, 0) /
        validCold.length
      : 0;

  const results = computeResults(
    exportData.coldResistance,
    exportData.hotMeasurements,
    exportData.filamentDiameter,
    exportData.filamentLength,
    exportData.ambientTemp
  );

  const validPoints = results
    .filter((r) => r.power > 0 && r.temperatureK > 0)
    .map((r) => ({ x: r.power, y: r.temperatureK }))
    .sort((a, b) => a.x - b.x);

  let regressionLineSeries: { label: string; data: { x: number; y: number }[]; color: string; showLine: boolean } | null = null;
  let regressionCoeffs: { A: number; B: number } | null = null;

  if (validPoints.length >= 2) {
    const n = validPoints.length;
    const sumX = validPoints.reduce((sum, p) => sum + Math.log(p.x), 0);
    const sumY = validPoints.reduce((sum, p) => sum + Math.log(p.y), 0);
    const sumXY = validPoints.reduce((sum, p) => sum + Math.log(p.x) * Math.log(p.y), 0);
    const sumXX = validPoints.reduce((sum, p) => sum + Math.log(p.x) * Math.log(p.x), 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const A = Math.exp(intercept);
    const B = slope;
    regressionCoeffs = { A, B };

    const minP = validPoints[0].x;
    const maxP = validPoints[validPoints.length - 1].x;
    
    regressionLineSeries = {
      label: `Fit: T = ${A.toFixed(2)} * P^${B.toFixed(3)}`,
      data: [
        { x: minP, y: A * Math.pow(minP, B) },
        { x: maxP, y: A * Math.pow(maxP, B) },
      ],
      color: "#ef4444",
      showLine: true,
    };
  }

  const chartSeries = [
    {
      label: t.chartSeriesLabel,
      data: validPoints,
      color: "#3b82f6",
      showLine: false,
    },
    ...(regressionLineSeries ? [regressionLineSeries] : []),
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
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
              <LanguageSwitcher />
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
                {t.exportPageQrReload}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Cold Resistance */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {t.exportPageColdResTitle}
            </h2>
            {validCold.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-2 px-3 text-slate-600">#</th>
                        <th className="text-left py-2 px-3 text-slate-600">
                          {t.coldResVoltage}
                        </th>
                        <th className="text-left py-2 px-3 text-slate-600">
                          {t.coldResCurrent}
                        </th>
                        <th className="text-left py-2 px-3 text-slate-600">
                          {t.coldResResistance}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {validCold.map((item, index) => (
                        <tr key={index} className="border-b border-slate-100">
                          <td className="py-2 px-3">{index + 1}</td>
                          <td className="py-2 px-3">
                            {item.voltage.toFixed(3)}
                          </td>
                          <td className="py-2 px-3">
                            {item.current.toFixed(3)}
                          </td>
                          <td className="py-2 px-3">
                            {(item.voltage / item.current).toFixed(3)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 font-medium">
                      <tr>
                        <td className="py-2 px-3" colSpan={3}>
                          {t.coldResAverage}
                        </td>
                        <td className="py-2 px-3">{averageR0.toFixed(3)} Ω</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </>
            ) : (
              <p className="text-slate-500 italic">
                {t.exportPageNoMeasurements}
              </p>
            )}
          </div>

          {/* Filament Parameters */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {t.exportPageHotMeasTitle}
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4 text-sm">
              <div>
                <span className="text-slate-500">{t.exportPageFilamentDiameter}:</span>{" "}
                <span className="font-medium">{exportData.filamentDiameter} mm</span>
              </div>
              <div>
                <span className="text-slate-500">{t.exportPageFilamentLength}:</span>{" "}
                <span className="font-medium">{exportData.filamentLength} mm</span>
              </div>
              <div>
                <span className="text-slate-500">{t.exportPageAmbientTemp}:</span>{" "}
                <span className="font-medium">{exportData.ambientTemp} °C</span>
              </div>
            </div>
          </div>

          {/* Results Table */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              {t.exportPageResultsTitle}
            </h2>
            {results.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-2 px-3 text-slate-600">#</th>
                      <th className="text-left py-2 px-3 text-slate-600">
                        {t.resultsVoltage}
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600">
                        {t.resultsCurrent}
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600">
                        {t.resultsPower}
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600">
                        {t.resultsResistance}
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600">
                        {t.resultsRatio}
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600">
                        {t.resultsTemperature}
                      </th>
                      <th className="text-left py-2 px-3 text-slate-600">
                        {t.resultsEmissivity}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, index) => (
                      <tr key={index} className="border-b border-slate-100">
                        <td className="py-2 px-3">{index + 1}</td>
                        <td className="py-2 px-3 font-mono">
                          {r.voltage.toFixed(2)}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {r.current.toFixed(3)}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {r.power.toFixed(3)}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {r.resistance.toFixed(3)}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {r.ratio.toFixed(3)}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {r.temperatureK.toFixed(1)}
                        </td>
                        <td className="py-2 px-3 font-mono">
                          {r.emissivity !== null ? r.emissivity.toFixed(3) : "—"}
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

          {/* Chart */}
          {results.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-semibold text-slate-900 mb-4">
                {t.exportPageChartTitle}
              </h2>
              <XYChart
                title={t.chartTitle}
                xAxisLabel={t.chartXAxisLabel}
                yAxisLabel={t.chartYAxisLabel}
                series={chartSeries}
                logarithmicX={true}
                logarithmicY={true}
                showLine={false}
              />
              {regressionCoeffs && (
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 text-sm print:bg-white print:border-slate-300">
                  <p className="font-medium mb-1">{t.chartRegressionTitle}:</p>
                  <p className="font-mono">
                    T = {regressionCoeffs.A.toExponential(4)} · P<sup>{regressionCoeffs.B.toFixed(4)}</sup>
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    (Log-Log Linear Regression: ln(T) = {Math.log(regressionCoeffs.A).toFixed(4)} + {regressionCoeffs.B.toFixed(4)} · ln(P))
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
