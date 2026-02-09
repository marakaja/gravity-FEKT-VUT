import { useEffect, useState } from "react";
import { ExportDialog } from "./components/ExportDialog";
import { PdfDialog } from "./components/PdfDialog";
import { LanguageSwitcher } from "./components/LanguageSwitcher";
import { useWebSerialContext } from "./context/useWebSerialContext";
import { useLanguage } from "./context/LanguageContext";
import {
  clearAppData,
  isLocalStorageAvailable,
  loadAppData,
  saveAppData,
} from "./lib/localStorage";
import {
  AngleCharacteristic,
  type AngleData,
} from "./view/AngleCharacteristic";
import {
  FrequencyCharacteristic,
  type FrequencyData,
} from "./view/FrequencyCharacteristic";
import { LuxAmper, type LuxAmperData } from "./view/LuxAmper";
import { VACharacteristic, type VAData } from "./view/VACharacteristic";

export type AppData = {
  vaCharacteristic: VAData[];
  angleCharacteristic: AngleData[];
  frequencyCharacteristic: FrequencyData[];
  luxAmper: LuxAmperData[];
};

type TabType = "va" | "angle" | "frequency" | "luxamper";

function App() {
  const { isSupported, isOpen, errorMessage, connect } = useWebSerialContext();
  const { t } = useLanguage();

  const [appData, setAppData] = useState<AppData>(() => {
    // Try to load from localStorage first
    const saved = loadAppData();
    return (
      saved || {
        vaCharacteristic: [],
        angleCharacteristic: [],
        frequencyCharacteristic: [],
        luxAmper: [],
      }
    );
  });

  const [activeTab, setActiveTab] = useState<TabType | undefined>(undefined);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isPdfDialogOpen, setIsPdfDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen && !activeTab) {
      setActiveTab("va");
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (errorMessage) {
      setActiveTab(undefined);
    }
  }, [errorMessage]);

  // Auto-save data when it changes
  useEffect(() => {
    if (isLocalStorageAvailable()) {
      saveAppData(appData);
    }
  }, [appData]);

  // Handle delete URL parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("delete")) {
      // Perform reset without confirmation dialog
      if (isLocalStorageAvailable()) {
        clearAppData();
      }
      setAppData({
        vaCharacteristic: [],
        angleCharacteristic: [],
        frequencyCharacteristic: [],
        luxAmper: [],
      });
      // Remove delete parameter from URL
      urlParams.delete("delete");
      const newUrl =
        urlParams.toString() === ""
          ? window.location.pathname
          : `${window.location.pathname}?${urlParams.toString()}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  const reset = () => {
    if (
      window.confirm(t.resetConfirm)
    ) {
      if (isLocalStorageAvailable()) {
        clearAppData();
      }
      setAppData({
        vaCharacteristic: [],
        angleCharacteristic: [],
        frequencyCharacteristic: [],
        luxAmper: [],
      });
    }
  };

  return (
    <>
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="container flex items-center justify-between py-4">
          <h1 className="text-xl font-semibold text-slate-900">{t.title} </h1>
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
              className="px-3 py-2 rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-sm"
            >
              {t.export}
            </button>
            <button
              onClick={() => setIsPdfDialogOpen(true)}
              className="px-3 py-2 rounded-md bg-yellow-200 hover:bg-yellow-300 disabled:opacity-50 text-black shadow-sm flex items-center justify-center"
              title="Export"
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

      {!isSupported && (
        <div className="container mt-4">
          <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
            {t.notSupportedMessage}
          </p>
        </div>
      )}

      {errorMessage && (
        <div className="container mt-4">
          <p className="text-rose-700 bg-rose-50 border border-rose-200 rounded-md px-3 py-2">
            {errorMessage}
          </p>
        </div>
      )}

      <div className="container mt-4">
        <div
          role="tablist"
          aria-label="Měření"
          className="inline-flex rounded-md border border-slate-200 shadow-sm overflow-hidden"
        >
          <button
            role="tab"
            disabled={!isOpen}
            aria-selected={activeTab === "va"}
            onClick={() => setActiveTab("va")}
            className={`px-3 py-2 text-sm ${
              activeTab === "va"
                ? "bg-slate-300 text-black"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t.vaTab}
          </button>
          <button
            role="tab"
            disabled={!isOpen}
            aria-selected={activeTab === "angle"}
            onClick={() => setActiveTab("angle")}
            className={`px-3 py-2 text-sm border-l border-slate-200 ${
              activeTab === "angle"
                ? "bg-slate-300 text-black"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t.angleTab}
          </button>
          <button
            role="tab"
            disabled={!isOpen}
            aria-selected={activeTab === "frequency"}
            onClick={() => setActiveTab("frequency")}
            className={`px-3 py-2 text-sm border-l border-slate-200 ${
              activeTab === "frequency"
                ? "bg-slate-300 text-black"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t.frequencyTab}
          </button>
          <button
            role="tab"
            disabled={!isOpen}
            aria-selected={activeTab === "luxamper"}
            onClick={() => setActiveTab("luxamper")}
            className={`px-3 py-2 text-sm border-l border-slate-200 ${
              activeTab === "luxamper"
                ? "bg-slate-300 text-black"
                : "bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {t.luxAmperTab}
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

      <div hidden={activeTab !== "va"}>
        {isOpen && (
          <VACharacteristic
            data={appData.vaCharacteristic}
            onDataChange={(data) =>
              setAppData((prev) => ({ ...prev, vaCharacteristic: data }))
            }
            isConnected={isOpen}
          />
        )}
      </div>

      <div hidden={activeTab !== "angle"}>
        {isOpen && (
          <AngleCharacteristic
            data={appData.angleCharacteristic}
            onDataChange={(data) =>
              setAppData((prev) => ({ ...prev, angleCharacteristic: data }))
            }
            isConnected={isOpen}
          />
        )}
      </div>

      <div hidden={activeTab !== "frequency"}>
        {isOpen && (
          <FrequencyCharacteristic
            data={appData.frequencyCharacteristic}
            onDataChange={(data) =>
              setAppData((prev) => ({ ...prev, frequencyCharacteristic: data }))
            }
            isConnected={isOpen}
          />
        )}
      </div>

      <div hidden={activeTab !== "luxamper"}>
        {isOpen && (
          <LuxAmper
            data={appData.luxAmper}
            onDataChange={(data) =>
              setAppData((prev) => ({ ...prev, luxAmper: data }))
            }
            isConnected={isOpen}
          />
        )}
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

      <footer className="mt-16 border-t border-slate-200 bg-slate-50">
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
    </>
  );
}

export default App;
