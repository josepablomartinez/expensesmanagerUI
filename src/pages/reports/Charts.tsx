import * as React from "react";
import { api } from "@/lib/api";
import { ExchangeRateChart } from "@/components/reports/ExchangeRateChart";
import { CreditCardChart } from "@/components/reports/CreditCardChart";
import { useT } from "@/lib/language";

// Reports → Charts: simple standalone charts, reached from the link in the
// Reports header rather than the report tab bar.
export default function Charts() {
  const t = useT();
  const [favoriteBanks, setFavoriteBanks] = React.useState<string[]>([]);

  React.useEffect(() => {
    api.settings.get().then((s) => setFavoriteBanks(s.favorite_banks ?? [])).catch(() => {});
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-semibold">{t.charts.title}</h2>
        <p className="text-sm text-muted-foreground">{t.charts.description}</p>
      </div>
      <ExchangeRateChart favoriteBanks={favoriteBanks} />
      <CreditCardChart />
    </div>
  );
}
