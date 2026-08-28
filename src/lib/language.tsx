import * as React from "react";
import { api } from "@/lib/api";
import { en, es, type Language, type Dictionary } from "@/lib/i18n";

const STORAGE_KEY = "language";

function getInitialLanguage(): Language {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "en" || stored === "es") return stored;
  return navigator.language.startsWith("es") ? "es" : "en";
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (l: Language) => void;
  t: Dictionary;
}

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

// Backed by settings.language (persisted server-side, same field the
// Settings page's "Language" card edits) so the choice follows the user
// across devices. localStorage only avoids a flash of the wrong language
// before that fetch resolves -- same pattern as CurrencyProvider.
export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = React.useState<Language>(getInitialLanguage);

  React.useEffect(() => {
    api.settings
      .get()
      .then((s) => {
        if (s.language === "en" || s.language === "es") {
          setLanguageState(s.language);
        }
      })
      .catch(() => {});
  }, []);

  const setLanguage = React.useCallback((l: Language) => {
    setLanguageState(l);
    localStorage.setItem(STORAGE_KEY, l);
    api.settings.update({ language: l }).catch(() => {});
  }, []);

  const t = language === "es" ? es : en;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
}

export const useT = () => useLanguage().t;
