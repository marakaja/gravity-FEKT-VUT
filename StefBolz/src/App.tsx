import { useEffect, useState } from "react";
import { ExportDialog } from "./components/ExportDialog";
import { PdfDialog } from "./components/PdfDialog";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { XYChart } from "./components/XYChart";
import { useLanguage } from "./context/LanguageContext";
import {
  clearAppData,
  isLocalStorageAvailable,
  loadAppData,
  saveAppData,
} from "./lib/localStorage";

// --- Types ---

export type ColdResistanceRow = {
  voltage: number;
  current: number;
};

export type HotMeasurementRow = {
  voltage: number;
  current: number;
};

export type AppData = {
  coldResistance: ColdResistanceRow[];
  hotMeasurements: HotMeasurementRow[];
  filamentDiameter: number;
  filamentLength: number;
  ambientTemp: number;
};

// --- Physics helpers ---
// Temperature coefficient of tungsten resistance
// R(T) = R0 * (1 + alpha*(T - T0))  is a simplification;
// Temperature of tungsten filament from resistance:
//   R_T = R_293 * [1 + a*(T - 273) + b*(T - 273)^2]
//   where a = 4.636e-3 K^-1, b = 3.19e-7 K^-2, T in K
// Solving for T: quadratic in x = (T - 273)
//   b*x^2 + a*x + (1 - R/R_293) = 0
//   x = (-a + sqrt(a^2 - 4*b*(1 - R/R_293))) / (2*b)

// Stefan-Boltzmann constant [W/(m²·K⁴)]
const SIGMA = 5.670374419e-8;
// Tungsten R-T coefficients (reference 293 K = 20 °C)
const A_COEFF = 4.636e-3;
const B_COEFF = 3.19e-7;

function computeResults(
  coldRows: ColdResistanceRow[],
  hotRows: HotMeasurementRow[],
  filamentDiameter: number,
  filamentLength: number,
  ambientTempC: number
) {
  // Average cold resistance
  const validCold = coldRows.filter(
    (r) => r.voltage > 0 && r.current > 0
  );
  if (validCold.length === 0) return [];

  const R0 =
    validCold.reduce((sum, r) => sum + r.voltage / r.current, 0) /
    validCold.length;

  const T0 = ambientTempC + 273.15; // ambient in Kelvin

  // Surface area of cylindrical filament: S = π * d * l  (d, l in mm → convert to m)
  const d_m = filamentDiameter / 1000;
  const l_m = filamentLength / 1000;
  const surfaceArea = Math.PI * d_m * l_m; // [m²]

  return hotRows
    .filter((r) => r.voltage > 0 && r.current > 0)
    .map((r) => {
      const U = r.voltage;
      const I = r.current;
      const P = U * I;
      const R = U / I;
      const ratio = R / R0;
      // Solve R/R_293 = 1 + a*x + b*x^2  for x = T - 273
      const k = ratio; // R / R_293 (cold R measured near 20°C)
      const discriminant = A_COEFF * A_COEFF - 4 * B_COEFF * (1 - k);
      const T_K =
        discriminant >= 0
          ? 273 + (-A_COEFF + Math.sqrt(discriminant)) / (2 * B_COEFF)
          : T0; // fallback
      // Emissivity from Stefan-Boltzmann: P = α·σ·S·(T⁴ - T₀⁴)
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

// --- Default data ---

const defaultColdResistance: ColdResistanceRow[] = [
  { voltage: 0, current: 0 },
];

const defaultHotMeasurements: HotMeasurementRow[] = [
  { voltage: 0, current: 0 },
];

const defaultAppData: AppData = {
  coldResistance: defaultColdResistance,
  hotMeasurements: defaultHotMeasurements,
  filamentDiameter: 0,
  filamentLength: 0,
  ambientTemp: 22,
};

// --- App ---

function App() {
  const { t } = useLanguage();

  const [appData, setAppData] = useState<AppData>(() => {
    const saved = loadAppData();
    return saved || { ...defaultAppData };
  });

  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);

  // Auto-save
  useEffect(() => {
    if (isLocalStorageAvailable()) {
      saveAppData(appData);
    }
  }, [appData]);

  // Handle ?delete param
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("delete")) {
      if (isLocalStorageAvailable()) {
        clearAppData();
      }
      setAppData({ ...defaultAppData });
      urlParams.delete("delete");
      const newUrl =
        urlParams.toString() === ""
          ? window.location.pathname
          : `${window.location.pathname}?${urlParams.toString()}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  const reset = () => {
    if (window.confirm(t.resetConfirm)) {
      if (isLocalStorageAvailable()) {
        clearAppData();
      }
      setAppData({
        coldResistance: [{ voltage: 0, current: 0 }],
        hotMeasurements: [{ voltage: 0, current: 0 }],
        filamentDiameter: 0,
        filamentLength: 0,
        ambientTemp: 22,
      });
    }
  };

  // --- Computed values ---

  const coldResistances = appData.coldResistance
    .filter((r) => r.voltage > 0 && r.current > 0)
    .map((r) => r.voltage / r.current);

  const averageR0 =
    coldResistances.length > 0
      ? coldResistances.reduce((a, b) => a + b, 0) / coldResistances.length
      : 0;

  const results = computeResults(
    appData.coldResistance,
    appData.hotMeasurements,
    appData.filamentDiameter,
    appData.filamentLength,
    appData.ambientTemp
  );

  // Surface area for info display
  const surfaceArea =
    appData.filamentDiameter > 0 && appData.filamentLength > 0
      ? Math.PI *
        (appData.filamentDiameter / 1000) *
        (appData.filamentLength / 1000)
      : 0;

  // Chart data setup
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
    
    // T = A * P^B  => ln(T) = ln(A) + B * ln(P)
    // intercept = ln(A) => A = exp(intercept)
    // slope = B
    const A = Math.exp(intercept);
    const B = slope;
    regressionCoeffs = { A, B };

    const minP = validPoints[0].x;
    const maxP = validPoints[validPoints.length - 1].x;

    // Generate points for the line (2 points are enough for a straight line in log-log if the axis handles it,
    // but specific implementation of chartjs log scale might curve connection if points are far apart and not interpolated logarithmically?
    // Actually, a power law is a straight line on log-log axis. 
    // If I give two points (x1, y1) and (x2, y2) that satisfy y=A*x^B, chartjs will draw a straight line between them in pixel space? 
    // Yes, usually.
    
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

  // Chart data (log-log: power vs temperature)
  const chartSeries = [
    {
      label: t.chartSeriesLabel,
      data: validPoints,
      color: "#3b82f6",
      showLine: false, // Scatter plot
    },
    ...(regressionLineSeries ? [regressionLineSeries] : []),
  ];

  // --- Handlers ---

  const updateColdRow = (
    index: number,
    field: "voltage" | "current",
    value: number
  ) => {
    setAppData((prev) => {
      const rows = [...prev.coldResistance];
      rows[index] = { ...rows[index], [field]: value };
      // Auto-add new row when editing the last row
      if (index === rows.length - 1 && value > 0) {
        rows.push({ voltage: 0, current: 0 });
      }
      return { ...prev, coldResistance: rows };
    });
  };

  const removeColdRow = (index: number) => {
    setAppData((prev) => {
      if (prev.coldResistance.length <= 1) return prev;
      return {
        ...prev,
        coldResistance: prev.coldResistance.filter((_, i) => i !== index),
      };
    });
  };

  const updateHotRow = (
    index: number,
    field: "voltage" | "current",
    value: number
  ) => {
    setAppData((prev) => {
      const rows = [...prev.hotMeasurements];
      rows[index] = { ...rows[index], [field]: value };
      // Auto-add new row when editing the last row
      if (index === rows.length - 1 && value > 0) {
        rows.push({ voltage: 0, current: 0 });
      }
      return { ...prev, hotMeasurements: rows };
    });
  };

  const removeHotRow = (index: number) => {
    setAppData((prev) => {
      if (prev.hotMeasurements.length <= 1) return prev;
      return {
        ...prev,
        hotMeasurements: prev.hotMeasurements.filter((_, i) => i !== index),
      };
    });
  };

  return (
    <>
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex items-center justify-between py-4">
          <h1 className="text-xl font-semibold text-slate-900">{t.title}</h1>
          <div className="flex gap-2">
            <LanguageSwitcher />
            <button
              onClick={reset}
              className="px-3 py-2 rounded-md bg-slate-300 hover:bg-slate-200 text-slate-700 shadow-sm"
            >
              {t.reset}
            </button>
            <button
              onClick={() => setIsExportDialogOpen(true)}
              className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
            >
              {t.export}
            </button>
            <button
              onClick={() => setIsPdfDialogOpen(true)}
              className="px-3 py-2 rounded-md bg-yellow-200 hover:bg-yellow-300 text-black shadow-sm flex items-center justify-center"
              title={t.pdfButtonTitle}
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
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div
        className="flex-1 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 130px)" }}
      >
        <main className="container py-6 space-y-6">
          {/* ===== CELL 1: Cold Resistance Measurement ===== */}
          <section className="card p-4">
            <h3 className="text-slate-900 font-medium mb-2">
              {t.coldResTitle}
            </h3>
            <p className="text-slate-700 text-sm mb-4">
              {t.coldResDescription}
            </p>

            <div className="overflow-auto rounded-md border border-slate-200">
              <table className="min-w-full text-sm text-slate-900">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-slate-700">
                      #
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-slate-700">
                      {t.coldResVoltage}
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-slate-700">
                      {t.coldResCurrent}
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-slate-700">
                      {t.coldResResistance}
                    </th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {appData.coldResistance.map((row, idx) => {
                    const R =
                      row.voltage > 0 && row.current > 0
                        ? row.voltage / row.current
                        : 0;
                    return (
                      <tr
                        key={idx}
                        className="odd:bg-white even:bg-slate-50"
                      >
                        <td className="px-3 py-2 text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={row.voltage || ""}
                            onChange={(e) =>
                              updateColdRow(
                                idx,
                                "voltage",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-28 px-2 py-1 border border-slate-300 rounded-md text-sm"
                            placeholder="0.000"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number"
                            min="0"
                            step="0.001"
                            value={row.current || ""}
                            onChange={(e) =>
                              updateColdRow(
                                idx,
                                "current",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-28 px-2 py-1 border border-slate-300 rounded-md text-sm"
                            placeholder="0.000"
                          />
                        </td>
                        <td className="px-3 py-2 font-mono text-slate-600">
                          {R > 0 ? R.toFixed(3) : "—"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {appData.coldResistance.length > 1 && (
                            <button
                              onClick={() => removeColdRow(idx)}
                              className="text-red-400 hover:text-red-600 text-lg leading-none"
                              title="Remove"
                            >
                              ❌
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-medium">
                  <tr>
                    <td className="px-3 py-2" colSpan={3}>
                      {t.coldResAverage}
                    </td>
                    <td className="px-3 py-2 font-mono">
                      {averageR0 > 0 ? averageR0.toFixed(3) + " Ω" : "—"}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {averageR0 > 0 && (
              <p className="mt-3 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md px-3 py-2">
                {t.coldResAverageValue.replace(
                  "{value}",
                  averageR0.toFixed(3)
                )}
              </p>
            )}
          </section>

          {/* ===== CELL 2: Hot Measurements + Filament Params ===== */}
          <section className="card p-4">
            <h3 className="text-slate-900 font-medium mb-2">
              {t.hotMeasTitle}
            </h3>
            <p className="text-slate-700 text-sm mb-4">
              {t.hotMeasDescription}
            </p>

            <div className="overflow-auto rounded-md border border-slate-200 mb-4">
              <table className="min-w-full text-sm text-slate-900">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-slate-700">
                      #
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-slate-700">
                      {t.hotMeasVoltage}
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-slate-700">
                      {t.hotMeasCurrent}
                    </th>
                    <th className="px-3 py-2 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {appData.hotMeasurements.map((row, idx) => (
                    <tr
                      key={idx}
                      className="odd:bg-white even:bg-slate-50"
                    >
                      <td className="px-3 py-2 text-slate-500">{idx + 1}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={row.voltage || ""}
                          onChange={(e) =>
                            updateHotRow(
                              idx,
                              "voltage",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-28 px-2 py-1 border border-slate-300 rounded-md text-sm"
                          placeholder="0.00"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={row.current || ""}
                          onChange={(e) =>
                            updateHotRow(
                              idx,
                              "current",
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-28 px-2 py-1 border border-slate-300 rounded-md text-sm"
                          placeholder="0.000"
                        />
                      </td>
                      <td className="px-3 py-2 text-center">
                        {appData.hotMeasurements.length > 1 && (
                          <button
                            onClick={() => removeHotRow(idx)}
                            className="text-red-400 hover:text-red-600 text-lg leading-none"
                            title="Remove"
                          >
                            ❌
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Filament parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t.hotMeasFilamentDiameter}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.001"
                  value={appData.filamentDiameter || ""}
                  onChange={(e) =>
                    setAppData((prev) => ({
                      ...prev,
                      filamentDiameter: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="0.000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t.hotMeasFilamentLength}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={appData.filamentLength || ""}
                  onChange={(e) =>
                    setAppData((prev) => ({
                      ...prev,
                      filamentLength: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="0.0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {t.hotMeasAmbientTemp}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={appData.ambientTemp || ""}
                  onChange={(e) =>
                    setAppData((prev) => ({
                      ...prev,
                      ambientTemp: parseFloat(e.target.value) || 0,
                    }))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md"
                  placeholder="22.0"
                />
              </div>
            </div>

            {surfaceArea > 0 && (
              <p className="mt-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-md px-3 py-2">
                {t.surfaceAreaNote.replace(
                  "{value}",
                  surfaceArea.toExponential(4)
                )}
              </p>
            )}
          </section>
          {/* ===== CELL 3: Results Table ===== */}          <section className="card p-4">
            <h3 className="text-slate-900 font-medium mb-2">
              {t.resultsTitle}
            </h3>
            <p className="text-slate-700 text-sm mb-4">
              {t.resultsDescription}
            </p>

            {results.length > 0 ? (
              <div className="overflow-auto rounded-md border border-slate-200">
                <table className="min-w-full text-sm text-slate-900">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-3 py-2 font-medium text-slate-700">
                        #
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-slate-700">
                        {t.resultsVoltage}
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-slate-700">
                        {t.resultsCurrent}
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-slate-700">
                        {t.resultsPower}
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-slate-700">
                        {t.resultsResistance}
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-slate-700">
                        {t.resultsRatio}
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-slate-700">
                        {t.resultsTemperature}
                      </th>
                      <th className="text-left px-3 py-2 font-medium text-slate-700">
                        {t.resultsEmissivity}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {results.map((r, idx) => (
                      <tr
                        key={idx}
                        className="odd:bg-white even:bg-slate-50"
                      >
                        <td className="px-3 py-2 text-slate-500">
                          {idx + 1}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {r.voltage.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {r.current.toFixed(3)}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {r.power.toFixed(3)}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {r.resistance.toFixed(3)}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {r.ratio.toFixed(3)}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {r.temperatureK.toFixed(1)}
                        </td>
                        <td className="px-3 py-2 font-mono">
                          {r.emissivity !== null ? r.emissivity.toFixed(3) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 italic">{t.resultsNoData}</p>
            )}
          </section>

          {/* ===== CELL 4: Log-Log Chart ===== */}
          <section className="card p-4">
            <XYChart
              title={t.chartTitle}
              xAxisLabel={t.chartXAxisLabel}
              yAxisLabel={t.chartYAxisLabel}
              series={chartSeries}
              logarithmicX={true}
              logarithmicY={true}
              showLine={false} // Default to no lines unless overridden
            />
            {regressionCoeffs && (
              <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-md text-slate-700 text-sm">
                <p className="font-medium mb-1">{t.chartRegressionTitle}:</p>
                <p className="font-mono">
                  T = {regressionCoeffs.A.toExponential(4)} · P<sup>{regressionCoeffs.B.toFixed(4)}</sup>
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  (Log-Log Linear Regression: ln(T) = {Math.log(regressionCoeffs.A).toFixed(4)} + {regressionCoeffs.B.toFixed(4)} · ln(P))
                </p>
              </div>
            )}
          </section>
        </main>

        <footer className="mt-auto border-t border-slate-200 bg-slate-50">
          <div className="container py-6">
            <p className="text-right text-sm text-slate-600">
              {t.createdBy}{" "}
              <a
                href="https://www.vut.cz/lide/marek-karlicek-246863"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:text-blue-700 underline"
              >
                Marek Karlíček
              </a>
            </p>
          </div>
        </footer>
      </div>

      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        data={appData}
      />

      <PdfDialog
        isOpen={isPdfDialogOpen}
        onClose={() => setIsPdfDialogOpen(false)}
      />
    </>
  );
}

export default App;
