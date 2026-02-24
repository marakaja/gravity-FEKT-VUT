import { useEffect, useState } from "react";
import { ExportDialog } from "./components/ExportDialog";
import { PdfDialog } from "./components/PdfDialog";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { useWebSerialContext } from "./context/useWebSerialContext";
import { useLanguage } from "./context/LanguageContext";
import {
  clearPendulumData,
  isLocalStorageAvailable,
  loadPendulum1Data,
  loadPendulum2Data,
  savePendulum1Data,
  savePendulum2Data,
} from "./lib/localStorage";
import { Pendulum1 } from "./view/Pendulum1";
import { Pendulum2 } from "./view/Pendulum2";

export type Pendulum1Data = {
  measure: {
    valueA: number | null;
    measureA: number | null;
    measureB: number | null;
  }[];
  intersection: { distance: number; time: number };
};

export type Pendulum2Data = { measureA: number[]; measureB: number[] };

function App() {
  const { isSupported, isOpen, errorMessage, connect, flush } =
    useWebSerialContext();
  const { t } = useLanguage();
  const [pendulum1Data, setPendulum1Data] = useState<Pendulum1Data>(() => {
    // Try to load from localStorage first, fallback to default values
    const saved = loadPendulum1Data();
    return (
      saved || {
        measure: [],
        intersection: { distance: 0, time: 0 },
      }
    );
  });
  const [pendulum2Data, setPendulum2Data] = useState<Pendulum2Data>(() => {
    // Try to load from localStorage first, fallback to default values
    const saved = loadPendulum2Data();
    return (
      saved || {
        measureA: [],
        measureB: [],
      }
    );
  });
  const [activeTab, setActiveTab] = useState<
    "pendulum1" | "pendulum2" | undefined
  >(undefined);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab("pendulum1");
    }
  }, [isOpen]);

  useEffect(() => {
    if (errorMessage) {
      setActiveTab(undefined);
    }
  }, [errorMessage]);

  // Auto-save pendulum1 data when it changes
  useEffect(() => {
    if (isLocalStorageAvailable()) {
      savePendulum1Data(pendulum1Data);
    }
  }, [pendulum1Data]);

  // Auto-save pendulum2 data when it changes
  useEffect(() => {
    if (isLocalStorageAvailable()) {
      savePendulum2Data(pendulum2Data);
    }
  }, [pendulum2Data]);

  function reset() {
    // Clear data from localStorage
    if (isLocalStorageAvailable()) {
      clearPendulumData();
    }

    // Reset state to empty values
    setPendulum1Data({
      measure: [],
      intersection: { distance: 0, time: 0 },
    });
    setPendulum2Data({ measureA: [], measureB: [] });
  }

  return (
    <>
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex items-center justify-between py-4">
          <h1 className="text-xl font-semibold text-slate-900">
            {t.title}
          </h1>
          <div className="flex gap-2">
            <LanguageSwitcher />
            <button
              onClick={reset}
              disabled={!isOpen}
              className="px-3 py-2 rounded-md bg-slate-300 hover:bg-slate-200 disabled:opacity-50 text-slate-700 shadow-sm"
            >
              {t.reset}
            </button>
            <button
              onClick={() => setIsExportDialogOpen(true)}
              disabled={!isOpen}
              className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-sm flex items-center justify-center"
            >
              {t.export}
            </button>
            <button
              onClick={() => setIsPdfDialogOpen(true)}
              className="px-3 py-2 rounded-md bg-yellow-200 hover:bg-yellow-300 disabled:opacity-50 text-black shadow-sm flex items-center justify-center"
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
            <button
              onClick={connect}
              disabled={!isSupported || isOpen}
              className="px-3 py-2 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white shadow-sm"
            >
              {t.connectPort}
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-y-auto" style={{ maxHeight: "calc(100vh - 130px)" }}>
      {!isSupported && (
        <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          {t.notSupportedMessage}
        </p>
      )}
      {errorMessage && (
        <p className="text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
          {errorMessage}
        </p>
      )}
      <div className="container mt-4">
        <div
          role="tablist"
          aria-label={t.tabsAriaLabel}
          className="inline-flex rounded-md border border-slate-200 shadow-sm overflow-hidden"
        >
          <button
            role="tab"
            disabled={!isOpen}
            aria-selected={activeTab === "pendulum1"}
            onClick={() => setActiveTab("pendulum1")}
            className={`px-3 py-2 text-sm ${
              activeTab === "pendulum1"
                ? "bg-slate-300 text-black"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t.pendulum1Tab}
          </button>
          <button
            role="tab"
            disabled={!isOpen}
            aria-selected={activeTab === "pendulum2"}
            onClick={() => setActiveTab("pendulum2")}
            className={`px-3 py-2 text-sm border-l border-slate-200 ${
              activeTab === "pendulum2"
                ? "bg-slate-300 text-black"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t.pendulum2Tab}
          </button>
        </div>
      </div>

      {!isOpen && (
        <main className="container py-6 space-y-6">
          <p className="text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-md px-3 py-2">
            {t.connectMessage}
          </p>
        </main>
      )}
      <div hidden={activeTab !== "pendulum1"}>
        <Pendulum1
          isOpen={isOpen}
          flush={flush}
          setPendulum1Data={setPendulum1Data}
          pendulum1Data={pendulum1Data}
        />
      </div>
      <div hidden={activeTab !== "pendulum2"}>
        <Pendulum2
          setPendulum2Data={setPendulum2Data}
          pendulum2Data={pendulum2Data}
          intersection={pendulum1Data.intersection}
        />
      </div>

      <footer className="mt-auto border-t border-slate-200 bg-slate-50">
        <div className="container py-6">
          <p className="text-right text-sm text-slate-600">
            {t.createdBy}{" "}
            <a
              href="https://malek.page"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:text-blue-700 underline"
            >
              Ing. Jakub Málek
            </a>
          </p>
        </div>
      </footer>
      </div>

      <ExportDialog
        isOpen={isExportDialogOpen}
        onClose={() => setIsExportDialogOpen(false)}
        pendulum1Data={pendulum1Data}
        pendulum2Data={pendulum2Data}
      />

      <PdfDialog
        isOpen={isPdfDialogOpen}
        onClose={() => setIsPdfDialogOpen(false)}
      />
    </>
  );
}

export default App;
