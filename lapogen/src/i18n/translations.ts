export const translations = {
  cs: {
    // Header
    title: "Lapogen",
    reset: "Reset",
    export: "Export",
    connectPort: "Připojit port",
    pdfButtonTitle: "Zadání úlohy",
    tabsAriaLabel: "Měření",
    
    // Tabs
    vaTab: "VA Charakteristika",
    angleTab: "Vyzařovací charakteristika",
    frequencyTab: "Frekvenční charakteristika",
    luxAmperTab: "Lux-Amper",
    
    // Messages
    notSupportedMessage: "Web Serial API není k dispozici. Použijte Chrome/Edge na HTTPS/localhost.",
    connectMessage: "Připojte port pro zahájení měření.",
    resetConfirm: "Opravdu chcete smazat všechna naměřená data? Tato akce je nevratná.",

    // Export dialog
    exportDialogTitle: "Export dat",
    exportDialogSubtitle:
      "Exportujte data pomocí QR kódu nebo zkopírujte do schránky",
    exportDialogQrTitle: "QR kód s daty",
    exportDialogQrGenerating: "QR kód se generuje...",
    exportDialogQrDescription:
      "Naskenujte tento QR kód pro otevření stránky s daty z měření. QR kód obsahuje odkaz na export stránku s vašimi daty.",
    exportDialogExportUrlTitle: "Export URL",
    exportDialogCopyUrl: "Kopírovat URL",
    exportDialogDownloadQr: "Stáhnout QR kód",
    exportDialogCopySuccess: "URL zkopírována do schránky",
    exportDialogCopyError: "Chyba při kopírování URL do schránky",
    exportDialogQrAlt: "QR kód",

    // PDF dialog
    pdfDialogTitle: "Zadání úlohy",
    pdfDialogIframeTitle: "Zadání úlohy",

    // Data table
    dataTableActions: "Akce",
    dataTableDelete: "Smazat",
    dataTableEmpty: "Žádná data",

    // Measurement dialog
    measurementDialogStartFirst: "Nejdříve spusťte sběr dat",
    measurementDialogAngleOk: "✓ Úhel ramene je v pořádku",
    measurementDialogAngleOutOfRange:
      "⚠ Úhel ramene mimo toleranci (±{threshold}°)",
    measurementDialogCurrentAngle: "Aktuální úhel: {angle}°",
    measurementDialogCurrentVoltage: "Aktuální napětí (ADC)",
    measurementDialogAverage: "Průměr ({count})",
    measurementDialogPeek: "Peek (ADC)",
    measurementDialogAngleLabel: "Úhel",
    measurementDialogStartCollect: "Spustit sběr",
    measurementDialogStopCollect: "Zastavit sběr",
    measurementDialogReset: "Reset",
    measurementDialogSave: "Uložit měření",
    measurementDialogCancel: "Zrušit",

    // VA characteristic
    vaTitle: "Měření VA charakteristiky",
    vaDescription:
      "Měření závislosti napětí na diodě na proudu. Nastavte proudový offset a měřte napětí.",
    vaCurrentLabel: "Proud [uA]",
    vaCurrentRangeHint: "Rozsah: 1–30 000 µA",
    vaAddPoint: "Přidat do grafu",
    vaChartTitle: "VA Charakteristika",
    vaLogX: "Logaritmická osa X",
    vaTableTitle: "Tabulka měření",
    vaEmptyMeasurements: "Žádná měření",
    vaAlertMeasureVoltage: "Nejdříve změřte napětí",
    vaXAxisLabel: "Proud [uA]",
    vaYAxisLabel: "Napětí [mV]",

    // Angle characteristic
    angleTitle: "Měření úhlu LED",
    angleDescription:
      "Měření úhlu LED při různých amplitudách. Frekvence: 200 Hz, offset: 50% amplitudy.",
    angleSetAmplitudeLabel: "Nastavit amplitudu [uA]",
    angleAddPoint: "Přidat bod",
    angleInputPlaceholder: "0-30000",
    angleInputRangeHint: "Rozsah: 0–30 000 µA",
    angleCurrentValuesTitle: "Aktuální hodnoty",
    angleDetectorLabel: "Úhel detektoru",
    angleVoltageLabel: "Napětí detektoru",
    anglePolarTitle: "Úhlová charakteristika",
    angleTableTitle: "Tabulka měření",
    angleEmptyMeasurements: "Žádná měření",
    angleAlertWaitForDevice: "Čekejte na měření ze zařízení",
    angleColumnAmplitude: "Amplituda [uA]",
    angleColumnAngle: "Úhel [°]",
    angleColumnVoltage: "Napětí [V]",

    // Frequency characteristic
    frequencyTitle: "Frekvenční charakteristika",
    frequencyDescription:
      "Měření závislosti napětí na frekvenci. Offset: 50% amplitudy.",
    frequencyAmplitudeLabel: "Amplituda [uA]",
    frequencyAmplitudeRangeHint: "Rozsah: 0–30 000 µA",
    frequencyLabel: "Frekvence [Hz]",
    frequencyFrequencyRangeHint: "Rozsah: 1–200 000 Hz",
    frequencyAddPoint: "Přidat bod",
    frequencyLogY: "Logaritmická osa Y",
    frequencyTableTitle: "Tabulka měření",
    frequencyEmptyMeasurements: "Žádná měření",
    frequencyInvalidAmplitude:
      "Zadejte platnou amplitudu v rozsahu 0-30000 uA",
    frequencyInvalidFrequency:
      "Zadejte platnou frekvenci v rozsahu 1-200000 Hz",
    frequencyAngleOutOfRange:
      "Rameno musí být v nulovém úhlu (±5°). Aktuální úhel: {angle}°",
    frequencyDuplicatePoint:
      "Bod s amplitudou {amplitude} uA a frekvencí {frequency} Hz již existuje.",
    frequencyMeasurementFailed: "Měření selhalo nebo vypršel časový limit.",
    frequencyXAxisLabel: "Frekvence [Hz]",
    frequencyYAxisLabel: "Napětí [mV]",

    // Lux-Amper
    luxTitle: "Lux-Amper charakteristika",
    luxDescription:
      "Měření závislosti luxů na proudu. Frekvence: 1000 Hz, offset: 50% amplitudy.",
    luxAmplitudeLabel: "Amplituda [uA]",
    luxAmplitudeRangeHint: "Rozsah: 0–30 000 µA",
    luxAddPoint: "Přidat bod",
    luxChartTitle: "Lux-Amper charakteristika",
    luxTableTitle: "Tabulka měření",
    luxEmptyMeasurements: "Žádná měření",
    luxInvalidAmplitude:
      "Zadejte platnou amplitudu v rozsahu 0-30000 uA",
    luxAngleOutOfRange:
      "Rameno musí být v nulovém úhlu (±5°). Aktuální úhel: {angle}°",
    luxPeakMissing: "Nelze získat hodnotu peak ze zařízení. Zkuste to znovu.",
    luxXAxisLabel: "Amplituda [uA]",
    luxYAxisLabel: "Napětí [mV]",

    // Export page
    exportPageMissingData: "Chybí data v URL parametru",
    exportPageDecompressError: "Chyba při dekompresi dat",
    exportPageDecodeError: "Chyba při dekódování dat",
    exportPageLoading: "Načítání dat...",
    exportPageErrorTitle: "Chyba při načítání",
    exportPageNoDataFound: "Data nebyla nalezena",
    exportPageBack: "Zpět",
    exportPagePrint: "Tisk",
    exportPageTitle: "Export dat - LED Charakteristiky",
    exportPageDataFrom: "Data z {timestamp}",
    exportPageQrReload: "QR kód pro opětovné načtení dat",
    exportPageVaTitle: "VA Charakteristika",
    exportPageAngleTitle: "Úhlová charakteristika",
    exportPageFrequencyTitle: "Frekvenční charakteristika",
    exportPageLuxTitle: "Lux-Amper charakteristika",
    exportPageVaTableCurrent: "Proud [uA]",
    exportPageVaTableVoltage: "Napětí [mV]",
    exportPageAngleTableAmplitude: "Amplituda [uA]",
    exportPageAngleTableAngle: "Úhel [°]",
    exportPageAngleTableVoltage: "Napětí [mV]",
    exportPageFrequencyTableAmplitude: "Amplituda [uA]",
    exportPageFrequencyTableFrequency: "Frekvence [Hz]",
    exportPageFrequencyTableVoltage: "Napětí [mV]",
    exportPageLuxTableAmplitude: "Amplituda [uA]",
    exportPageLuxTableVoltage: "Napětí [mV]",
    exportPageNoMeasurements: "Žádná měření",
    
    // Footer
    createdBy: "Vytvořil",
  },
  en: {
    // Header
    title: "Lapogen",
    reset: "Reset",
    export: "Export",
    connectPort: "Connect Port",
    pdfButtonTitle: "Assignment",
    tabsAriaLabel: "Measurements",
    
    // Tabs
    vaTab: "VA Characteristic",
    angleTab: "Radiation Characteristic",
    frequencyTab: "Frequency Characteristic",
    luxAmperTab: "Lux-Amper",
    
    // Messages
    notSupportedMessage: "Web Serial API is not available. Use Chrome/Edge on HTTPS/localhost.",
    connectMessage: "Connect port to start measurement.",
    resetConfirm: "Are you sure you want to delete all measured data? This action cannot be undone.",

    // Export dialog
    exportDialogTitle: "Data export",
    exportDialogSubtitle:
      "Export data via QR code or copy the link to clipboard",
    exportDialogQrTitle: "QR code with data",
    exportDialogQrGenerating: "Generating QR code...",
    exportDialogQrDescription:
      "Scan this QR code to open the page with your measurement data. The QR code contains a link to the export page.",
    exportDialogExportUrlTitle: "Export URL",
    exportDialogCopyUrl: "Copy URL",
    exportDialogDownloadQr: "Download QR code",
    exportDialogCopySuccess: "URL copied to clipboard",
    exportDialogCopyError: "Error copying URL to clipboard",
    exportDialogQrAlt: "QR code",

    // PDF dialog
    pdfDialogTitle: "Assignment",
    pdfDialogIframeTitle: "Assignment",

    // Data table
    dataTableActions: "Actions",
    dataTableDelete: "Delete",
    dataTableEmpty: "No data",

    // Measurement dialog
    measurementDialogStartFirst: "Start data collection first",
    measurementDialogAngleOk: "✓ Arm angle is OK",
    measurementDialogAngleOutOfRange:
      "⚠ Arm angle out of tolerance (±{threshold}°)",
    measurementDialogCurrentAngle: "Current angle: {angle}°",
    measurementDialogCurrentVoltage: "Current voltage (ADC)",
    measurementDialogAverage: "Average ({count})",
    measurementDialogPeek: "Peek (ADC)",
    measurementDialogAngleLabel: "Angle",
    measurementDialogStartCollect: "Start collection",
    measurementDialogStopCollect: "Stop collection",
    measurementDialogReset: "Reset",
    measurementDialogSave: "Save measurement",
    measurementDialogCancel: "Cancel",

    // VA characteristic
    vaTitle: "VA characteristic measurement",
    vaDescription:
      "Measure the LED voltage dependence on current. Set current offset and measure voltage.",
    vaCurrentLabel: "Current [uA]",
    vaCurrentRangeHint: "Range: 1–30,000 µA",
    vaAddPoint: "Add to chart",
    vaChartTitle: "VA characteristic",
    vaLogX: "Logarithmic X axis",
    vaTableTitle: "Measurements table",
    vaEmptyMeasurements: "No measurements",
    vaAlertMeasureVoltage: "Measure voltage first",
    vaXAxisLabel: "Current [uA]",
    vaYAxisLabel: "Voltage [mV]",

    // Angle characteristic
    angleTitle: "LED angle measurement",
    angleDescription:
      "Measure LED angle at different amplitudes. Frequency: 200 Hz, offset: 50% of amplitude.",
    angleSetAmplitudeLabel: "Set amplitude [uA]",
    angleAddPoint: "Add point",
    angleInputPlaceholder: "0-30000",
    angleInputRangeHint: "Range: 0–30,000 µA",
    angleCurrentValuesTitle: "Current values",
    angleDetectorLabel: "Detector angle",
    angleVoltageLabel: "Detector voltage",
    anglePolarTitle: "Angular characteristic",
    angleTableTitle: "Measurements table",
    angleEmptyMeasurements: "No measurements",
    angleAlertWaitForDevice: "Wait for device measurement",
    angleColumnAmplitude: "Amplitude [uA]",
    angleColumnAngle: "Angle [°]",
    angleColumnVoltage: "Voltage [V]",

    // Frequency characteristic
    frequencyTitle: "Frequency characteristic",
    frequencyDescription:
      "Measure voltage dependence on frequency. Offset: 50% of amplitude.",
    frequencyAmplitudeLabel: "Amplitude [uA]",
    frequencyAmplitudeRangeHint: "Range: 0–30,000 µA",
    frequencyLabel: "Frequency [Hz]",
    frequencyFrequencyRangeHint: "Range: 1–200,000 Hz",
    frequencyAddPoint: "Add point",
    frequencyLogY: "Logarithmic Y axis",
    frequencyTableTitle: "Measurements table",
    frequencyEmptyMeasurements: "No measurements",
    frequencyInvalidAmplitude:
      "Enter a valid amplitude in range 0-30000 uA",
    frequencyInvalidFrequency:
      "Enter a valid frequency in range 1-200000 Hz",
    frequencyAngleOutOfRange:
      "Arm must be at zero angle (±5°). Current angle: {angle}°",
    frequencyDuplicatePoint:
      "Point with amplitude {amplitude} uA and frequency {frequency} Hz already exists.",
    frequencyMeasurementFailed: "Measurement failed or timed out.",
    frequencyXAxisLabel: "Frequency [Hz]",
    frequencyYAxisLabel: "Voltage [mV]",

    // Lux-Amper
    luxTitle: "Lux-Amper characteristic",
    luxDescription:
      "Measure lux dependence on current. Frequency: 1000 Hz, offset: 50% of amplitude.",
    luxAmplitudeLabel: "Amplitude [uA]",
    luxAmplitudeRangeHint: "Range: 0–30,000 µA",
    luxAddPoint: "Add point",
    luxChartTitle: "Lux-Amper characteristic",
    luxTableTitle: "Measurements table",
    luxEmptyMeasurements: "No measurements",
    luxInvalidAmplitude: "Enter a valid amplitude in range 0-30000 uA",
    luxAngleOutOfRange:
      "Arm must be at zero angle (±5°). Current angle: {angle}°",
    luxPeakMissing: "Cannot read peak value from device. Try again.",
    luxXAxisLabel: "Amplitude [uA]",
    luxYAxisLabel: "Voltage [mV]",

    // Export page
    exportPageMissingData: "Missing data in URL parameter",
    exportPageDecompressError: "Error decompressing data",
    exportPageDecodeError: "Error decoding data",
    exportPageLoading: "Loading data...",
    exportPageErrorTitle: "Error while loading",
    exportPageNoDataFound: "Data not found",
    exportPageBack: "Back",
    exportPagePrint: "Print",
    exportPageTitle: "Data export - LED characteristics",
    exportPageDataFrom: "Data from {timestamp}",
    exportPageQrReload: "QR code to reload data",
    exportPageVaTitle: "VA characteristic",
    exportPageAngleTitle: "Angular characteristic",
    exportPageFrequencyTitle: "Frequency characteristic",
    exportPageLuxTitle: "Lux-Amper characteristic",
    exportPageVaTableCurrent: "Current [uA]",
    exportPageVaTableVoltage: "Voltage [mV]",
    exportPageAngleTableAmplitude: "Amplitude [uA]",
    exportPageAngleTableAngle: "Angle [°]",
    exportPageAngleTableVoltage: "Voltage [mV]",
    exportPageFrequencyTableAmplitude: "Amplitude [uA]",
    exportPageFrequencyTableFrequency: "Frequency [Hz]",
    exportPageFrequencyTableVoltage: "Voltage [mV]",
    exportPageLuxTableAmplitude: "Amplitude [uA]",
    exportPageLuxTableVoltage: "Voltage [mV]",
    exportPageNoMeasurements: "No measurements",
    
    // Footer
    createdBy: "Created by",
  },
};

export type Language = keyof typeof translations;
export type TranslationKeys = typeof translations.cs;
