import * as React from "react";
import { useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { ExchangeRateChart } from "@/components/reports/ExchangeRateChart";
import { CreditCardChart } from "@/components/reports/CreditCardChart";
import { HourProfileChart } from "@/components/reports/HourProfileChart";


// Reports → Charts: simple standalone charts, reached from the link in the
// Reports header rather than the report tab bar.
export default function Charts() {
  const { search, hash } = useLocation();
  const view = hash === "#hour-profile" ? "hour-profile" : new URLSearchParams(search).get("view");
  const [favoriteBanks, setFavoriteBanks] = React.useState<string[]>([]);

  React.useEffect(() => {
    api.settings.get().then((s) => setFavoriteBanks(s.favorite_banks ?? [])).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-4">
      {view === "credit-card" ? <CreditCardChart />
        : view === "hour-profile" ? <HourProfileChart />
        : <ExchangeRateChart favoriteBanks={favoriteBanks} />}
    </div>
  );
}
