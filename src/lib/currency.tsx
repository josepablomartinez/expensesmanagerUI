import * as React from "react";
import { api } from "@/lib/api";

export type DisplayCurrency = "CRC" | "USD";
const STORAGE_KEY = "display_currency";

function getInitialCurrency(): DisplayCurrency {
  return localStorage.getItem(STORAGE_KEY) === "USD" ? "USD" : "CRC";
}

interface CurrencyContextValue {
  currency: DisplayCurrency;
  setCurrency: (c: DisplayCurrency) => void;
  toggleCurrency: () => void;
}

const CurrencyContext = React.createContext<CurrencyContextValue | null>(null);

// Backed by settings.display_currency (persisted server-side, same field the
// Settings page's "Currency display" card edits) so the toggle in the header
// and the one in Settings never drift apart. localStorage only avoids a
// flash of the wrong currency before that fetch resolves.
export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = React.useState<DisplayCurrency>(getInitialCurrency);

  React.useEffect(() => {
    api.settings
      .get()
      .then((s) => {
        if (s.display_currency === "USD" || s.display_currency === "CRC") {
          setCurrencyState(s.display_currency);
        }
      })
      .catch(() => {});
  }, []);

  const setCurrency = React.useCallback((c: DisplayCurrency) => {
    setCurrencyState(c);
    localStorage.setItem(STORAGE_KEY, c);
    api.settings.update({ display_currency: c }).catch(() => {});
  }, []);

  const toggleCurrency = React.useCallback(() => {
    setCurrency(currency === "CRC" ? "USD" : "CRC");
  }, [currency, setCurrency]);

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, toggleCurrency }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = React.useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}
