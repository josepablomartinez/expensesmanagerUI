import * as React from "react";
import { api, type Bank } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useT } from "@/lib/language";

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const formatHour = (h: number) => `${String(h).padStart(2, "0")}:00`;

export default function Advanced() {
  const t = useT();
  const [banks, setBanks] = React.useState<Bank[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  const [exchangeRateSource, setExchangeRateSource] = React.useState("average");
  const [exchangeRateBankId, setExchangeRateBankId] = React.useState<number | null>(null);
  const [creditCardExpenseDate, setCreditCardExpenseDate] = React.useState("event");
  const [alertsEnabled, setAlertsEnabled] = React.useState(true);
  const [duplicateAlertsEnabled, setDuplicateAlertsEnabled] = React.useState(true);
  const [suspiciousAlertsEnabled, setSuspiciousAlertsEnabled] = React.useState(true);
  const [zThreshold, setZThreshold] = React.useState("3.5");
  const [medianRatio, setMedianRatio] = React.useState("1.5");
  const [quietStart, setQuietStart] = React.useState(0);
  const [quietEnd, setQuietEnd] = React.useState(6);

  React.useEffect(() => {
    Promise.all([api.settings.get(), api.banks.list()])
      .then(([settings, bankList]) => {
        setExchangeRateSource(settings.exchange_rate_source);
        setExchangeRateBankId(settings.exchange_rate_bank_id);
        setCreditCardExpenseDate(settings.credit_card_expense_date);
        setAlertsEnabled(settings.alerts_enabled);
        setDuplicateAlertsEnabled(settings.duplicate_alerts_enabled);
        setSuspiciousAlertsEnabled(settings.suspicious_alerts_enabled);
        setZThreshold(String(settings.suspicious_z_threshold));
        setMedianRatio(String(settings.suspicious_median_ratio));
        setQuietStart(settings.quiet_hours_start);
        setQuietEnd(settings.quiet_hours_end);
        setBanks(bankList);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t.settings.failedToLoad))
      .finally(() => setLoading(false));
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await api.settings.update({
        exchange_rate_source: exchangeRateSource,
        exchange_rate_bank_id: exchangeRateSource === "bank" ? exchangeRateBankId : undefined,
        credit_card_expense_date: creditCardExpenseDate,
        alerts_enabled: alertsEnabled,
        duplicate_alerts_enabled: duplicateAlertsEnabled,
        suspicious_alerts_enabled: suspiciousAlertsEnabled,
        suspicious_z_threshold: Number(zThreshold),
        suspicious_median_ratio: Number(medianRatio),
        quiet_hours_start: quietStart,
        quiet_hours_end: quietEnd,
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.settings.failedToSave);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">{t.common.loading}</p>;

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.exchangeRateSource}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          <div className="flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground">{t.settings.exchangeRateSourceHelp}</p>
            <Select
              id="exchange_rate_source"
              value={exchangeRateSource}
              onChange={(e) => {
                setSaved(false);
                setExchangeRateSource(e.target.value);
              }}
              className="w-56"
            >
              <option value="average">{t.settings.exchangeRateSourceAverage}</option>
              <option value="bank">{t.settings.exchangeRateSourceBank}</option>
            </Select>
          </div>
          {exchangeRateSource === "bank" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="exchange_rate_bank_id">
                {t.settings.exchangeRateBank}
              </label>
              <Select
                id="exchange_rate_bank_id"
                value={exchangeRateBankId ?? ""}
                onChange={(e) => {
                  setSaved(false);
                  setExchangeRateBankId(e.target.value === "" ? null : Number(e.target.value));
                }}
                className="w-56"
              >
                <option value="" disabled>
                  {t.settings.exchangeRateBank}
                </option>
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.creditCardExpenseDate}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 pt-0">
          <p className="text-xs leading-relaxed text-muted-foreground">{t.settings.creditCardExpenseDateHelp}</p>
          <div className="flex max-w-sm flex-col gap-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="credit_card_expense_date">
              {t.settings.expenseDate}
            </label>
            <Select
              id="credit_card_expense_date"
              value={creditCardExpenseDate}
              onChange={(e) => {
                setSaved(false);
                setCreditCardExpenseDate(e.target.value);
              }}
            >
              <option value="event">{t.settings.creditCardExpenseDateEvent}</option>
              <option value="due">{t.settings.creditCardExpenseDateDue}</option>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t.settings.alertSettings}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col pt-0">
          <div className="flex items-start justify-between gap-4 py-1">
            <div className="min-w-0">
              <label htmlFor="alerts-enabled" className="text-sm font-medium text-foreground">
                {t.settings.alertsEnabled}
              </label>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.settings.alertsEnabledHelp}</p>
            </div>
            <Switch
              id="alerts-enabled"
              checked={alertsEnabled}
              onCheckedChange={(checked) => {
                setSaved(false);
                setAlertsEnabled(checked);
              }}
              aria-label={t.settings.alertsEnabled}
            />
          </div>

          <div className="mt-4 flex items-start justify-between gap-4 border-t border-border pt-4">
            <div className="min-w-0">
              <label htmlFor="duplicate-alerts-enabled" className="text-sm font-medium text-foreground">
                {t.settings.duplicateAlerts}
              </label>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.settings.duplicateAlertsHelp}</p>
            </div>
            <Switch
              id="duplicate-alerts-enabled"
              checked={duplicateAlertsEnabled}
              onCheckedChange={(checked) => {
                setSaved(false);
                setDuplicateAlertsEnabled(checked);
              }}
              disabled={!alertsEnabled}
              aria-label={t.settings.duplicateAlerts}
            />
          </div>

          <div className="mt-4 flex items-start justify-between gap-4 border-t border-border pt-4">
            <div className="min-w-0">
              <label htmlFor="suspicious-alerts-enabled" className="text-sm font-medium text-foreground">
                {t.settings.suspiciousAlerts}
              </label>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t.settings.suspiciousAlertsHelp}</p>
            </div>
            <Switch
              id="suspicious-alerts-enabled"
              checked={suspiciousAlertsEnabled}
              onCheckedChange={(checked) => {
                setSaved(false);
                setSuspiciousAlertsEnabled(checked);
              }}
              disabled={!alertsEnabled}
              aria-label={t.settings.suspiciousAlerts}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="suspicious_z_threshold">
                {t.settings.suspiciousZThreshold}
              </label>
              <Input
                id="suspicious_z_threshold"
                type="number"
                inputMode="decimal"
                min={0.5}
                max={10}
                step={0.1}
                value={zThreshold}
                onChange={(e) => {
                  setSaved(false);
                  setZThreshold(e.target.value);
                }}
                className="w-28"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">{t.settings.suspiciousZThresholdHelp}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="suspicious_median_ratio">
                {t.settings.suspiciousMedianRatio}
              </label>
              <Input
                id="suspicious_median_ratio"
                type="number"
                inputMode="decimal"
                min={1}
                max={10}
                step={0.1}
                value={medianRatio}
                onChange={(e) => {
                  setSaved(false);
                  setMedianRatio(e.target.value);
                }}
                className="w-28"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">{t.settings.suspiciousMedianRatioHelp}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">{t.settings.quietHours}</span>
            <div className="flex flex-wrap items-center gap-2">
              <label className="text-xs text-muted-foreground" htmlFor="quiet_hours_start">
                {t.settings.quietHoursFrom}
              </label>
              <Select
                id="quiet_hours_start"
                value={quietStart}
                onChange={(e) => {
                  setSaved(false);
                  setQuietStart(Number(e.target.value));
                }}
                className="w-24"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </Select>
              <label className="text-xs text-muted-foreground" htmlFor="quiet_hours_end">
                {t.settings.quietHoursUntil}
              </label>
              <Select
                id="quiet_hours_end"
                value={quietEnd}
                onChange={(e) => {
                  setSaved(false);
                  setQuietEnd(Number(e.target.value));
                }}
                className="w-24"
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </Select>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{t.settings.quietHoursHelp}</p>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">{t.settings.alertFlagsNote}</p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? t.common.saving : t.common.save}
        </Button>
        {saved && <span className="text-sm text-muted-foreground">{t.common.saved}</span>}
      </div>
    </div>
  );
}
