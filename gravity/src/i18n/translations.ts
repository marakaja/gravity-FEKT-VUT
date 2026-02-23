export const translations = {
  cs: {
    // Header
    title: "Úloha 10: Matematické kyvadlo",
    reset: "Reset",
    export: "Export",
    connectPort: "Připojit port",
    pdfButtonTitle: "Zadání úlohy",
    tabsAriaLabel: "Kyvadla",
    
    // Tabs
    pendulum1Tab: "Pozice matematického kyvadla",
    pendulum2Tab: "Postupná metoda měření",
    
    // Messages
    notSupportedMessage: "Web Serial API není k dispozici. Použijte Chrome/Edge na HTTPS/localhost.",
    connectMessage: "Připojte port pro zahájení měření.",

    // Serial dialog
    serialDialogTitle: "Měření periody",
    serialDialogDistanceLabel: "Vzdálenost závaží od konce [mm]",
    serialDialogChannelLabel: "kanál",
    serialDialogChannelTop: "Závaží nahoře",
    serialDialogChannelBottom: "Závaží dole",
    serialDialogStart20: "Start (sbírat 20)",
    serialDialogStop: "Stop",
    serialDialogContinue: "Pokračovat",
    serialDialogLastValues: "Naposledy načtené hodnoty (max 20):",
    serialDialogAveragePeriod: "Průměrná perioda:",
    serialDialogIndexHeader: "#",
    serialDialogPeriodHeader: "Perioda [ms]",

    // Serial dialog 100
    serialDialog100Title: "Měření (až 100 vzorků) - závaží {channel}",
    serialDialog100Start: "Start (sbírat 100)",
    serialDialog100Stop: "Stop",
    serialDialog100Save: "Uložit (součty po 10 z posledních 90)",
    serialDialog100OutlierWarning:
      "❌ Pozor některý z kmitů se liší o více než 10% od průměru ({avg} ms). ❌",

    // Pendulum 1
    pendulum1NewMeasurement: "Nové měření",
    pendulum1PositionTitle: "Stanovení polohy závaží",
    pendulum1MultipleIntersectionsWarning:
      "❌ Pozor: Existuje více než jeden průsečík. ❌",
    pendulum1DistanceLabel: "Vzdálenost závaží od konce",
    pendulum1PeriodLabel: "Perioda",
    pendulum1InsufficientData: "Nedostatek dat nebo přímky jsou rovnoběžné.",
    pendulum1MeasurementsTitle: "Tabulka měření",
    pendulum1TableDistance: "Vzdálenost [mm]",
    pendulum1TableTop: "Závaží nahoře [ms]",
    pendulum1TableBottom: "Závaží dole [ms]",
    pendulum1NoMeasurements: "Žádná měření",
    pendulum1InvalidDistance: "Zadejte platnou vzdálenost.",

    // Chart
    xyChartTitle: "Závislost doby kmitu na poloze závaží",
    xyChartSeriesBottom: "Závaží dole",
    xyChartSeriesTop: "Závaží nahoře",
    xyChartFitBottom: "Kvadratické proložení závaží dole{mse}",
    xyChartFitTop: "Kvadratické proložení závaží nahoře{mse}",
    xyChartXAxisTitle: "Vzdálenost závaží od konce [mm]",
    xyChartYAxisTitle: "Perioda [ms]",

    // Pendulum 2
    pendulum2OpenTop: "Otevřít měření pro závaží nahoře",
    pendulum2OpenBottom: "Otevřít měření pro závaží dole",
    pendulum2ComputedSummary:
      "Vypočteno na základě proložení předchozího měření: Vzdálenost závaží od konce - {distance} mm, Odhadovaná perioda - {time} ms",
    pendulum2TableDescription: "Popis",
    pendulum2TableTop: "Hodnoty nahoře [ms]",
    pendulum2TableBottom: "Hodnoty dole [ms]",
    pendulum2OscillationTimeLabel: "Čas {count}. kmitu",

    // Export dialog
    exportDialogTitle: "Export dat",
    exportDialogSubtitle:
      "Exportujte data pomocí QR kódu nebo zkopírujte do schránky",
    exportDialogQrTitle: "QR kód s daty",
    exportDialogQrGenerating: "QR kód se generuje...",
    exportDialogQrDescription:
      "Naskenujte tento QR kód pro otevření stránky s daty z měření kyvadel. QR kód obsahuje odkaz na export stránku s vašimi daty.",
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
    exportPageDecodeError: "Chyba při dekódování dat",
    exportPageLoading: "Načítání dat...",
    exportPageErrorTitle: "Chyba při načítání",
    exportPageNoDataFound: "Data nebyla nalezena",
    exportPageBack: "Zpět",
    exportPagePrint: "Tisk",
    exportPageTitle: "Export dat - Úloha 10: Matematické kyvadlo",
    exportPageDataFrom: "Data z {timestamp} (verze {version})",
    exportPageQrReload: "QR kód pro opětovné načtení dat",
    exportPagePendulum1Title: "Stanovení pozice závaží matematického kyvadla",
    exportPagePendulum1ParamsTitle: "Parametry matematického kyvadla",
    exportPageDistanceLabel: "Vzdálenost:",
    exportPageTimeLabel: "Čas:",
    exportPagePendulum1TableDistance: "Vzdálenost závaží od konce [mm]",
    exportPagePendulum1TableTop: "Perioda závaží nahoře [ms]",
    exportPagePendulum1TableBottom: "Perioda závaží dole [ms]",
    exportPageNoMeasurements: "Žádná měření",
    exportPagePendulum2Title: "Postupná metoda měření",
    exportPagePendulum2TableOrder: "Pořadí kmitu",
    exportPagePendulum2TableTop: "Čas kmitu - závaží nahoře [ms]",
    exportPagePendulum2TableBottom: "Čas kmitu - závaží dole [ms]",
    
    // Footer
    createdBy: "Vytvořil",
  },
  en: {
    // Header
    title: "Task 10: Mathematical Pendulum",
    reset: "Reset",
    export: "Export",
    connectPort: "Connect Port",
    pdfButtonTitle: "Assignment",
    tabsAriaLabel: "Pendulums",
    
    // Tabs
    pendulum1Tab: "Mathematical Pendulum Position",
    pendulum2Tab: "Progressive Measurement Method",
    
    // Messages
    notSupportedMessage: "Web Serial API is not available. Use Chrome/Edge on HTTPS/localhost.",
    connectMessage: "Connect port to start measurement.",

    // Serial dialog
    serialDialogTitle: "Period measurement",
    serialDialogDistanceLabel: "Weight distance from the end [mm]",
    serialDialogChannelLabel: "channel",
    serialDialogChannelTop: "Top weight",
    serialDialogChannelBottom: "Bottom weight",
    serialDialogStart20: "Start (collect 20)",
    serialDialogStop: "Stop",
    serialDialogContinue: "Continue",
    serialDialogLastValues: "Last read values (max 20):",
    serialDialogAveragePeriod: "Average period:",
    serialDialogIndexHeader: "#",
    serialDialogPeriodHeader: "Period [ms]",

    // Serial dialog 100
    serialDialog100Title: "Measurement (up to 100 samples) - {channel} weight",
    serialDialog100Start: "Start (collect 100)",
    serialDialog100Stop: "Stop",
    serialDialog100Save: "Save (sums of 10 from last 90)",
    serialDialog100OutlierWarning:
      "❌ Warning: some oscillations differ by more than 10% from average ({avg} ms). ❌",

    // Pendulum 1
    pendulum1NewMeasurement: "New measurement",
    pendulum1PositionTitle: "Weight position estimation",
    pendulum1MultipleIntersectionsWarning:
      "❌ Warning: more than one intersection exists. ❌",
    pendulum1DistanceLabel: "Weight distance from the end",
    pendulum1PeriodLabel: "Period",
    pendulum1InsufficientData: "Not enough data or the lines are parallel.",
    pendulum1MeasurementsTitle: "Measurements table",
    pendulum1TableDistance: "Distance [mm]",
    pendulum1TableTop: "Top weight [ms]",
    pendulum1TableBottom: "Bottom weight [ms]",
    pendulum1NoMeasurements: "No measurements",
    pendulum1InvalidDistance: "Enter a valid distance.",

    // Chart
    xyChartTitle: "Oscillation period vs. weight position",
    xyChartSeriesBottom: "Bottom weight",
    xyChartSeriesTop: "Top weight",
    xyChartFitBottom: "Quadratic fit (bottom weight){mse}",
    xyChartFitTop: "Quadratic fit (top weight){mse}",
    xyChartXAxisTitle: "Weight distance from the end [mm]",
    xyChartYAxisTitle: "Period [ms]",

    // Pendulum 2
    pendulum2OpenTop: "Open measurement for top weight",
    pendulum2OpenBottom: "Open measurement for bottom weight",
    pendulum2ComputedSummary:
      "Computed from the previous fit: Weight distance from the end - {distance} mm, Estimated period - {time} ms",
    pendulum2TableDescription: "Description",
    pendulum2TableTop: "Top values [ms]",
    pendulum2TableBottom: "Bottom values [ms]",
    pendulum2OscillationTimeLabel: "Time of {count}th oscillation",

    // Export dialog
    exportDialogTitle: "Data export",
    exportDialogSubtitle:
      "Export data via QR code or copy the link to clipboard",
    exportDialogQrTitle: "QR code with data",
    exportDialogQrGenerating: "Generating QR code...",
    exportDialogQrDescription:
      "Scan this QR code to open the page with your pendulum measurement data. The QR code contains a link to the export page.",
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
    exportPageDecodeError: "Error decoding data",
    exportPageLoading: "Loading data...",
    exportPageErrorTitle: "Error while loading",
    exportPageNoDataFound: "Data not found",
    exportPageBack: "Back",
    exportPagePrint: "Print",
    exportPageTitle: "Data export - Task 10: Mathematical Pendulum",
    exportPageDataFrom: "Data from {timestamp} (version {version})",
    exportPageQrReload: "QR code to reload data",
    exportPagePendulum1Title: "Position of the mathematical pendulum weight",
    exportPagePendulum1ParamsTitle: "Pendulum parameters",
    exportPageDistanceLabel: "Distance:",
    exportPageTimeLabel: "Time:",
    exportPagePendulum1TableDistance: "Weight distance from end [mm]",
    exportPagePendulum1TableTop: "Top weight period [ms]",
    exportPagePendulum1TableBottom: "Bottom weight period [ms]",
    exportPageNoMeasurements: "No measurements",
    exportPagePendulum2Title: "Progressive measurement method",
    exportPagePendulum2TableOrder: "Oscillation order",
    exportPagePendulum2TableTop: "Oscillation time - top weight [ms]",
    exportPagePendulum2TableBottom: "Oscillation time - bottom weight [ms]",
    
    // Footer
    createdBy: "Created by",
  },
};

export type Language = keyof typeof translations;
export type TranslationKeys = typeof translations.cs;
