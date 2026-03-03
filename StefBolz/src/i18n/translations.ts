export const translations = {
  cs: {
    // Header
    title: "Úloha 26: Stefan-Boltzmannův zákon",
    reset: "Reset",
    export: "Export",
    pdfButtonTitle: "Zadání úlohy",

    // Messages
    resetConfirm: "Opravdu chcete smazat všechna naměřená data? Tato akce je nevratná.",

    // Cell 1 - Cold resistance
    coldResTitle: "Měření odporu studeného vlákna",
    coldResDescription: "Zadejte 5 měření napětí a proudu žárovkou za studena. Odpor se automaticky vypočítá.",
    coldResVoltage: "U [V]",
    coldResCurrent: "I [A]",
    coldResResistance: "R [Ω]",
    coldResRow: "Měření {n}",
    coldResAverage: "Průměr R₀",
    coldResAverageValue: "Průměrný odpor studeného vlákna R₀ = {value} Ω",

    // Cell 2 - Hot measurements
    hotMeasTitle: "Měření při různých výkonech",
    hotMeasDescription: "Zadejte měření napětí a proudu při různých nastaveních výkonu. Upravte počet řádků dle potřeby.",
    hotMeasVoltage: "U [V]",
    hotMeasCurrent: "I [A]",
    hotMeasAddRow: "Přidat řádek",
    hotMeasRemoveRow: "Odebrat řádek",
    hotMeasFilamentDiameter: "Průměr vlákna d [mm]",
    hotMeasFilamentLength: "Délka vlákna l [mm]",
    hotMeasAmbientTemp: "Teplota okolí T₀ [°C]",

    // Cell 3 - Results table
    resultsTitle: "Tabulka výsledků",
    resultsDescription: "Přehled všech měřených a vypočtených hodnot.",
    resultsVoltage: "U [V]",
    resultsCurrent: "I [A]",
    resultsPower: "P [W]",
    resultsResistance: "R [Ω]",
    resultsRatio: "R/R₀",
    resultsTemperature: "T [K]",
    resultsEmissivity: "α",
    resultsNoData: "Zadejte měření v předchozích krocích",
    surfaceAreaNote: "Plocha povrchu vlákna S = π·d·l = {value} m²",

    // Cell 4 - Chart
    chartTitle: "Závislost teploty vlákna na výkonu",
    chartXAxisLabel: "P [W]",
    chartYAxisLabel: "T [K]",
    chartSeriesLabel: "T(P)",
    chartRegressionTitle: "Proložení metodou nejmenších čtverců (mocninná funkce)",

    // Export dialog
    exportDialogTitle: "Export dat",
    exportDialogSubtitle: "Exportujte data pomocí QR kódu nebo zkopírujte do schránky",
    exportDialogQrTitle: "QR kód s daty",
    exportDialogQrGenerating: "QR kód se generuje...",
    exportDialogQrDescription: "Naskenujte tento QR kód pro otevření stránky s daty z měření.",
    exportDialogExportUrlTitle: "Export URL",
    exportDialogCopyUrl: "Kopírovat URL",
    exportDialogDownloadQr: "Stáhnout QR kód",
    exportDialogCopySuccess: "URL zkopírována do schránky",
    exportDialogCopyError: "Chyba při kopírování URL do schránky",
    exportDialogQrAlt: "QR kód",

    // PDF dialog
    pdfDialogTitle: "Zadání úlohy",
    pdfDialogIframeTitle: "Zadání úlohy",

    // Export page
    exportPageMissingData: "Chybí data v URL parametru",
    exportPageDecompressError: "Chyba při dekompresi dat",
    exportPageDecodeError: "Chyba při dekódování dat",
    exportPageLoading: "Načítání dat...",
    exportPageErrorTitle: "Chyba při načítání",
    exportPageNoDataFound: "Data nebyla nalezena",
    exportPageBack: "Zpět",
    exportPagePrint: "Tisk",
    exportPageTitle: "Export dat - Stefan-Boltzmann",
    exportPageDataFrom: "Data z {timestamp}",
    exportPageQrReload: "QR kód pro opětovné načtení dat",
    exportPageColdResTitle: "Měření odporu studeného vlákna",
    exportPageHotMeasTitle: "Měření při různých výkonech",
    exportPageResultsTitle: "Tabulka výsledků",
    exportPageChartTitle: "Závislost teploty vlákna na výkonu",
    exportPageNoMeasurements: "Žádná měření",
    exportPageFilamentDiameter: "Průměr vlákna d",
    exportPageFilamentLength: "Délka vlákna l",
    exportPageAmbientTemp: "Teplota okolí T₀",

    // Footer
    createdBy: "Vytvořil",
  },
  en: {
    // Header
    title: "Lab 26: Stefan-Boltzmann",
    reset: "Reset",
    export: "Export",
    pdfButtonTitle: "Assignment",

    // Messages
    resetConfirm: "Are you sure you want to delete all measured data? This action cannot be undone.",

    // Cell 1 - Cold resistance
    coldResTitle: "Cold filament resistance measurement",
    coldResDescription: "Enter 5 measurements of voltage and current through the cold lightbulb. Resistance is calculated automatically.",
    coldResVoltage: "U [V]",
    coldResCurrent: "I [A]",
    coldResResistance: "R [Ω]",
    coldResRow: "Measurement {n}",
    coldResAverage: "Average R₀",
    coldResAverageValue: "Average cold filament resistance R₀ = {value} Ω",

    // Cell 2 - Hot measurements
    hotMeasTitle: "Measurements at various power levels",
    hotMeasDescription: "Enter voltage and current measurements at different power settings. Adjust number of rows as needed.",
    hotMeasVoltage: "U [V]",
    hotMeasCurrent: "I [A]",
    hotMeasAddRow: "Add row",
    hotMeasRemoveRow: "Remove row",
    hotMeasFilamentDiameter: "Filament diameter d [mm]",
    hotMeasFilamentLength: "Filament length l [mm]",
    hotMeasAmbientTemp: "Ambient temperature T₀ [°C]",

    // Cell 3 - Results table
    resultsTitle: "Results table",
    resultsDescription: "Overview of all measured and calculated values.",
    resultsVoltage: "U [V]",
    resultsCurrent: "I [A]",
    resultsPower: "P [W]",
    resultsResistance: "R [Ω]",
    resultsRatio: "R/R₀",
    resultsTemperature: "T [K]",
    resultsEmissivity: "α",
    resultsNoData: "Enter measurements in previous steps",
    surfaceAreaNote: "Filament surface area S = π·d·l = {value} m²",

    // Cell 4 - Chart
    chartTitle: "Filament temperature vs. power",
    chartXAxisLabel: "P [W]",
    chartYAxisLabel: "T [K]",
    chartSeriesLabel: "T(P)",
    chartRegressionTitle: "Least Squares Fit (Power Law)",

    // Export dialog
    exportDialogTitle: "Data export",
    exportDialogSubtitle: "Export data via QR code or copy the link to clipboard",
    exportDialogQrTitle: "QR code with data",
    exportDialogQrGenerating: "Generating QR code...",
    exportDialogQrDescription: "Scan this QR code to open the page with your measurement data.",
    exportDialogExportUrlTitle: "Export URL",
    exportDialogCopyUrl: "Copy URL",
    exportDialogDownloadQr: "Download QR code",
    exportDialogCopySuccess: "URL copied to clipboard",
    exportDialogCopyError: "Error copying URL to clipboard",
    exportDialogQrAlt: "QR code",

    // PDF dialog
    pdfDialogTitle: "Assignment",
    pdfDialogIframeTitle: "Assignment",

    // Export page
    exportPageMissingData: "Missing data in URL parameter",
    exportPageDecompressError: "Error decompressing data",
    exportPageDecodeError: "Error decoding data",
    exportPageLoading: "Loading data...",
    exportPageErrorTitle: "Error while loading",
    exportPageNoDataFound: "Data not found",
    exportPageBack: "Back",
    exportPagePrint: "Print",
    exportPageTitle: "Data export - Stefan-Boltzmann",
    exportPageDataFrom: "Data from {timestamp}",
    exportPageQrReload: "QR code to reload data",
    exportPageColdResTitle: "Cold filament resistance measurement",
    exportPageHotMeasTitle: "Measurements at various power levels",
    exportPageResultsTitle: "Results table",
    exportPageChartTitle: "Filament temperature vs. power",
    exportPageNoMeasurements: "No measurements",
    exportPageFilamentDiameter: "Filament diameter d",
    exportPageFilamentLength: "Filament length l",
    exportPageAmbientTemp: "Ambient temperature T₀",

    // Footer
    createdBy: "Created by",
  },
};

export type Language = keyof typeof translations;
export type TranslationKeys = (typeof translations)["cs"];
