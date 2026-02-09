export const translations = {
  cs: {
    // Header
    title: "Lapogen",
    reset: "Reset",
    export: "Export",
    connectPort: "Připojit port",
    
    // Tabs
    vaTab: "VA Charakteristika",
    angleTab: "Vyzařovací charakteristika",
    frequencyTab: "Frekvenční charakteristika",
    luxAmperTab: "Lux-Amper",
    
    // Messages
    notSupportedMessage: "Web Serial API není k dispozici. Použijte Chrome/Edge na HTTPS/localhost.",
    connectMessage: "Připojte port pro zahájení měření.",
    resetConfirm: "Opravdu chcete smazat všechna naměřená data? Tato akce je nevratná.",
    
    // Footer
    createdBy: "Created by",
  },
  en: {
    // Header
    title: "Lapogen",
    reset: "Reset",
    export: "Export",
    connectPort: "Connect Port",
    
    // Tabs
    vaTab: "VA Characteristic",
    angleTab: "Radiation Characteristic",
    frequencyTab: "Frequency Characteristic",
    luxAmperTab: "Lux-Amper",
    
    // Messages
    notSupportedMessage: "Web Serial API is not available. Use Chrome/Edge on HTTPS/localhost.",
    connectMessage: "Connect port to start measurement.",
    resetConfirm: "Are you sure you want to delete all measured data? This action cannot be undone.",
    
    // Footer
    createdBy: "Created by",
  },
};

export type Language = keyof typeof translations;
export type TranslationKeys = typeof translations.cs;
