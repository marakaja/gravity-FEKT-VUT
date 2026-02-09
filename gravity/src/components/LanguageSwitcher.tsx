import { useLanguage } from "../context/LanguageContext";
import type { Language } from "../i18n/translations";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <div className="inline-flex rounded-md border border-slate-200 shadow-sm overflow-hidden bg-white">
      <button
        onClick={() => handleLanguageChange("cs")}
        className={`px-3 py-2 text-sm font-medium transition-colors ${
          language === "cs"
            ? "bg-slate-300 text-black"
            : "text-slate-700 hover:bg-slate-50"
        }`}
        aria-label="Čeština"
        title="Čeština"
      >
        CS
      </button>
      <button
        onClick={() => handleLanguageChange("en")}
        className={`px-3 py-2 text-sm font-medium border-l border-slate-200 transition-colors ${
          language === "en"
            ? "bg-slate-300 text-black"
            : "text-slate-700 hover:bg-slate-50"
        }`}
        aria-label="English"
        title="English"
      >
        EN
      </button>
    </div>
  );
}
