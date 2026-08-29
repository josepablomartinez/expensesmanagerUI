import * as React from "react";
import { api, type Bank } from "@/lib/api";
import { CreditCardsSection } from "@/components/settings/CreditCardsSection";
import { useT } from "@/lib/language";

export default function CreditCards() {
  const t = useT();
  const [banks, setBanks] = React.useState<Bank[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    api.banks
      .list()
      .then(setBanks)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;

  return <CreditCardsSection banks={banks} />;
}
