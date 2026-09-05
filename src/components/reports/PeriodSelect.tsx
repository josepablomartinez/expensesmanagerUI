import { Select } from "@/components/ui/select";
import { useT } from "@/lib/language";

interface PeriodSelectProps {
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

export function PeriodSelect({ year, month, onYearChange, onMonthChange }: PeriodSelectProps) {
  const t = useT();
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 sm:flex">
      <Select aria-label={t.reportsLayout.month} value={month} onChange={(e) => onMonthChange(Number(e.target.value))} className="min-w-0">
        {t.months.full.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </Select>
      <Select aria-label={t.reportsLayout.year} value={year} onChange={(e) => onYearChange(Number(e.target.value))}>
        {[year - 1, year, year + 1].map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
    </div>
  );
}
