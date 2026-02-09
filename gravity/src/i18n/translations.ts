export const translations = {
  cs: {
    // Header
    title: "Úloha 10: Matematické kyvadlo",
    reset: "Reset",
    export: "Export",
    connectPort: "Připojit port",
    
    // Tabs
    pendulum1Tab: "Pozice matematického kyvadla",
    pendulum2Tab: "Postupná metoda měření",
    
    // Messages
    notSupportedMessage: "Web Serial API není k dispozici. Použijte Chrome/Edge na HTTPS/localhost.",
    connectMessage: "Připojte port pro zahájení měření.",
    
    // Footer
    createdBy: "Created by",
  },
  en: {
    // Header
    title: "Task 10: Mathematical Pendulum",
    reset: "Reset",
    export: "Export",
    connectPort: "Connect Port",
    
    // Tabs
    pendulum1Tab: "Mathematical Pendulum Position",
    pendulum2Tab: "Progressive Measurement Method",
    
    // Messages
    notSupportedMessage: "Web Serial API is not available. Use Chrome/Edge on HTTPS/localhost.",
    connectMessage: "Connect port to start measurement.",
    
    // Footer
    createdBy: "Created by",
  },
};

export type Language = keyof typeof translations;
export type TranslationKeys = typeof translations.cs;
