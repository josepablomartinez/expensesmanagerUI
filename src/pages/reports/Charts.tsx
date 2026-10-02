import * as React from "react";
import { useLocation } from "react-router-dom";
import { api } from "@/lib/api";
import { ExchangeRateChart } from "@/components/reports/ExchangeRateChart";
import { CreditCardChart } from "@/components/reports/CreditCardChart";
import { HourProfileChart } from "@/components/reports/HourProfileChart";
// Preserve existing chart URLs and the settings link to #hour-profile.
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
