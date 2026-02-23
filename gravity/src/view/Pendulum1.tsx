import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FC,
  type SetStateAction,
} from "react";
import type { Pendulum1Data } from "../App";
import { SerialDialog } from "../components/SerialDialog";
import { XYChart } from "../components/XYChart";
import { useLanguage } from "../context/LanguageContext";

// Simple linear type for points used in charts and regressions
type XYPoint = { x: number; y: number };

// Quadratic regression y = a*x^2 + b*x + c using least squares (solve 3x3 by Gaussian elimination)
const computeQuadraticRegression = (
  points: XYPoint[]
): { a: number; b: number; c: number; mse: number } | null => {
  const n = points.length;
  if (n < 3) return null;

  let sumX = 0;
  let sumX2 = 0;
  let sumX3 = 0;
  let sumX4 = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2Y = 0;

  for (const p of points) {
    const x = p.x;
    const y = p.y;
    const x2 = x * x;
    sumX += x;
    sumX2 += x2;
    sumX3 += x2 * x;
    sumX4 += x2 * x2;
    sumY += y;
    sumXY += x * y;
    sumX2Y += x2 * y;
  }

  // Augmented matrix [A|b]
  const A = [
    [sumX4, sumX3, sumX2, sumX2Y],
    [sumX3, sumX2, sumX, sumXY],
    [sumX2, sumX, n, sumY],
  ];

  // Gaussian elimination with partial pivoting
  for (let col = 0; col < 3; col++) {
    // find pivot
    let pivotRow = col;
    for (let r = col + 1; r < 3; r++) {
      if (Math.abs(A[r][col]) > Math.abs(A[pivotRow][col])) pivotRow = r;
    }
    if (
      Math.abs(A[pivotRow][col]) < 1e-12 ||
      !Number.isFinite(A[pivotRow][col])
    )
      return null;
    // swap
    if (pivotRow !== col) {
      const tmp = A[col];
      A[col] = A[pivotRow];
      A[pivotRow] = tmp;
    }
    // normalize and eliminate below
    const pivot = A[col][col];
    for (let c = col; c < 4; c++) A[col][c] /= pivot;
    for (let r = col + 1; r < 3; r++) {
      const factor = A[r][col];
      for (let c = col; c < 4; c++) A[r][c] -= factor * A[col][c];
    }
  }

  // Back substitution
  const x3 = A[2][3];
  const x2coef = A[1][3] - A[1][2] * x3;
  const x1coef = A[0][3] - A[0][2] * x3 - A[0][1] * x2coef;
  const a = x1coef; // corresponds to a
  const b = x2coef; // corresponds to b
  const c = x3; // corresponds to c

  if (![a, b, c].every(Number.isFinite)) return null;

  let sumSquaredError = 0;
  for (const p of points) {
    const predicted = a * p.x * p.x + b * p.x + c;
    const error = p.y - predicted;
    sumSquaredError += error * error;
  }
  const mse = sumSquaredError / n;
  return { a, b, c, mse };
};

// Intersection of two quadratics y = a1*x^2 + b1*x + c1 and y = a2*x^2 + b2*x + c2
// Returns all plausible intersections based on data domain, or empty array if none
const computeQuadraticIntersections = (
  qa: { a: number; b: number; c: number } | null,
  qb: { a: number; b: number; c: number } | null,
  domainA: { min: number; max: number } | null,
  domainB: { min: number; max: number } | null
): { x: number; y: number }[] => {
  if (!qa || !qb) return [];
  const A = qa.a - qb.a;
  const B = qa.b - qb.b;
  const C = qa.c - qb.c;

  // Handle near-linear case when quadratic terms cancel out
  if (Math.abs(A) < 1e-12) {
    if (Math.abs(B) < 1e-12) return []; // parallel or identical
    const x = -C / B;
    const y = qa.a * x * x + qa.b * x + qa.c;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return [];
    return [{ x, y }];
  }

  const discriminant = B * B - 4 * A * C;
  if (discriminant < 0) return [];
  const sqrtD = Math.sqrt(discriminant);
  const x1 = (-B - sqrtD) / (2 * A);
  const x2 = (-B + sqrtD) / (2 * A);

  const candidates = [x1, x2].filter((x) => Number.isFinite(x));
  if (candidates.length === 0) return [];

  // Filter candidates within overlapping domain if available
  const hasDomains = !!domainA && !!domainB;
  let overlapMin = -Infinity,
    overlapMax = Infinity;
  if (hasDomains) {
    overlapMin = Math.max(domainA!.min, domainB!.min);
    overlapMax = Math.min(domainA!.max, domainB!.max);
  }
  const results = candidates
    .map((x) => {
      const y = qa.a * x * x + qa.b * x + qa.c;
      return Number.isFinite(y) ? { x, y } : null;
    })
    .filter((pt): pt is { x: number; y: number } => !!pt)
    .filter((pt) =>
      hasDomains ? pt.x >= overlapMin && pt.x <= overlapMax : true
    );
  return results;
};

type Pendulum1Props = {
  isOpen: boolean;
  flush: () => void;
  setPendulum1Data: Dispatch<SetStateAction<Pendulum1Data>>;
  pendulum1Data: Pendulum1Data;
};

export const Pendulum1: FC<Pendulum1Props> = ({
  isOpen,
  flush,
  setPendulum1Data: setMeasurements,
  pendulum1Data: measurements,
}) => {
  const { t } = useLanguage();
  const [localError, setLocalError] = useState<string>("");

  // Dialog + measurement flow
  const [inputValueA, setInputValueA] = useState<string>("");
  const [measurementChannel, setMeasurementChannel] = useState<"A" | "B">("A");

  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);

  // removed send helper (unused)

  // Dialog helpers
  function openDialog() {
    setInputValueA("");
    setMeasurementChannel("A");
    flush();
    setIsDialogOpen(true);
  }

  function saveMeasurement(avg: number) {
    const vA = Number(inputValueA);
    if (!Number.isFinite(vA)) {
      setLocalError(t.pendulum1InvalidDistance);
      return;
    }

    // Update measurements array keyed by valueA
    setMeasurements((prev: Pendulum1Data) => {
      const index = prev.measure.findIndex((m) => m.valueA === vA);
      if (index !== -1) {
        const updated = [...prev.measure];
        const existing = updated[index];
        updated[index] =
          measurementChannel === "A"
            ? { ...existing, valueA: vA, measureA: avg }
            : { ...existing, valueA: vA, measureB: avg };
        return { ...prev, measure: updated };
      }
      return {
        ...prev,
        measure: [
          ...prev.measure,
          {
            valueA: vA,
            measureA: measurementChannel === "A" ? avg : null,
            measureB: measurementChannel === "B" ? avg : null,
          },
        ],
      };
    });
    setIsDialogOpen(false);
  }

  function closeDialog() {
    setIsDialogOpen(false);
  }

  // Create XY series for chart and computations

  const seriesA = useMemo<XYPoint[]>(
    () =>
      (measurements.measure ?? [])
        .filter((m) => m.valueA !== null && m.measureA !== null)
        .map((m) => ({
          x: m.valueA as number,
          y: m.measureA as number,
        })),
    [measurements]
  );

  const seriesB = useMemo<XYPoint[]>(
    () =>
      (measurements.measure ?? [])
        .filter((m) => m.valueA !== null && m.measureB !== null)
        .map((m) => ({ x: m.valueA as number, y: m.measureB as number })),
    [measurements]
  );

  // Quadratic fits and MSE
  const quadA = useMemo(() => computeQuadraticRegression(seriesA), [seriesA]);
  const quadB = useMemo(() => computeQuadraticRegression(seriesB), [seriesB]);

  const fitA = useMemo<XYPoint[]>(() => {
    if (!quadA || seriesA.length === 0) return [];
    const xs = seriesA.map((p) => p.x);
    const min = Math.min(...xs);
    const max = Math.max(...xs);
    const pad = Math.max(1, (max - min) * 0.05);
    const start = min - pad;
    const end = max + pad;
    const a = quadA.a,
      b = quadA.b,
      c = quadA.c;
    const N = 100;
    const out: XYPoint[] = [];
    for (let i = 0; i <= N; i++) {
      const x = start + ((end - start) * i) / N;
      const y = a * x * x + b * x + c;
      out.push({ x, y });
    }
    return out;
  }, [quadA, seriesA]);

  const fitB = useMemo<XYPoint[]>(() => {
    if (!quadB || seriesB.length === 0) return [];
    const xs = seriesB.map((p) => p.x);
    const min = Math.min(...xs);
    const max = Math.max(...xs);
    const pad = Math.max(1, (max - min) * 0.05);
    const start = min - pad;
    const end = max + pad;
    const a = quadB.a,
      b = quadB.b,
      c = quadB.c;
    const N = 100;
    const out: XYPoint[] = [];
    for (let i = 0; i <= N; i++) {
      const x = start + ((end - start) * i) / N;
      const y = a * x * x + b * x + c;
      out.push({ x, y });
    }
    return out;
  }, [quadB, seriesB]);

  // Domains for picking plausible intersection
  const domainA = useMemo<{ min: number; max: number } | null>(() => {
    if (seriesA.length === 0) return null;
    const xs = seriesA.map((p) => p.x);
    return { min: Math.min(...xs), max: Math.max(...xs) };
  }, [seriesA]);

  const domainB = useMemo<{ min: number; max: number } | null>(() => {
    if (seriesB.length === 0) return null;
    const xs = seriesB.map((p) => p.x);
    return { min: Math.min(...xs), max: Math.max(...xs) };
  }, [seriesB]);

  // Quadratic intersection points
  const quadraticIntersections = useMemo<
    { distance: number; time: number }[]
  >(() => {
    const intersections = computeQuadraticIntersections(
      quadA,
      quadB,
      domainA,
      domainB
    );
    return intersections.map((intersection) => ({
      distance: intersection.x,
      time: intersection.y,
    }));
  }, [quadA, quadB, domainA, domainB]);

  // Side-effect: store first regression intersection into shared state, guarded to avoid loops
  useEffect(() => {
    if (!quadraticIntersections || quadraticIntersections.length === 0) return;
    const first = quadraticIntersections[0];
    setMeasurements((prev: Pendulum1Data) => {
      const next = {
        distance: first.distance,
        time: first.time,
      };
      const prevVal = prev.intersection;
      const same =
        prevVal &&
        prevVal.distance === next.distance &&
        prevVal.time === next.time;
      return same ? prev : { ...prev, intersection: next };
    });
  }, [quadraticIntersections, setMeasurements]);

  return (
    <>
      {localError && (
        <p className="text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
          {localError}
        </p>
      )}

      <main className="container py-6 space-y-6">
        <section className="card p-4">
          <XYChart
            seriesA={seriesA}
            seriesB={seriesB}
            fitA={fitA}
            fitB={fitB}
            mseA={quadA?.mse}
            mseB={quadB?.mse}
          />
          <span className="flex justify-end w-full">
            <button
              onClick={openDialog}
              disabled={!isOpen}
              className="px-3 mt-2 py-2 rounded-md bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white shadow-sm"
            >
              {t.pendulum1NewMeasurement}
            </button>
          </span>
        </section>

        <section className="card p-4">
          <h3 className="text-slate-900 font-medium mb-3">
            {t.pendulum1PositionTitle}
          </h3>
          {quadraticIntersections.length > 1 && (
            <div className="text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mb-3">
              {t.pendulum1MultipleIntersectionsWarning}
            </div>
          )}
          {measurements.intersection ? (
            <div className="flex flex-wrap gap-6 text-slate-900">
              <div>
                <div className="text-xs text-slate-600">
                  {t.pendulum1DistanceLabel}
                </div>
                <div className="text-xl">
                  {measurements.intersection.distance.toFixed(2)} mm
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-600">
                  {t.pendulum1PeriodLabel}
                </div>
                <div className="text-xl">
                  {measurements.intersection.time.toFixed(2)} ms
                </div>
              </div>
            </div>
          ) : (
            <div className="text-slate-700">
              {t.pendulum1InsufficientData}
            </div>
          )}
        </section>

        <section className="card p-4">
          <h3 className="text-slate-900 font-medium mb-3">
            {t.pendulum1MeasurementsTitle}
          </h3>
          <div className="max-h-64 overflow-auto rounded-md border border-slate-200">
            <table className="min-w-full text-sm text-slate-900">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-slate-700">
                    {t.pendulum1TableDistance}
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-slate-700">
                    {t.pendulum1TableTop}
                  </th>
                  <th className="text-left px-3 py-2 font-medium text-slate-700">
                    {t.pendulum1TableBottom}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {(() => {
                  const sorted = (measurements.measure ?? [])
                    .slice()
                    .sort(
                      (a, b) =>
                        (a.valueA ?? Number.POSITIVE_INFINITY) -
                        (b.valueA ?? Number.POSITIVE_INFINITY)
                    );
                  if (sorted.length === 0) {
                    return (
                      <tr>
                        <td className="px-3 py-3 text-slate-700" colSpan={3}>
                          {t.pendulum1NoMeasurements}
                        </td>
                      </tr>
                    );
                  }
                  return sorted.map((m, i) => (
                    <tr
                      key={`${m.valueA ?? "null"}-${i}`}
                      className="odd:bg-white even:bg-slate-50"
                    >
                      <td className="px-3 py-2">{m.valueA ?? "-"}</td>
                      <td className="px-3 py-2">
                        {m.measureA?.toFixed(1) ?? "-"}
                      </td>
                      <td className="px-3 py-2">
                        {m.measureB?.toFixed(1) ?? "-"}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      <SerialDialog
        isOpen={isDialogOpen}
        onClose={closeDialog}
        inputValueA={inputValueA}
        setInputValueA={setInputValueA}
        measurementChannel={measurementChannel}
        setMeasurementChannel={setMeasurementChannel}
        onSave={saveMeasurement}
      />
    </>
  );
};
