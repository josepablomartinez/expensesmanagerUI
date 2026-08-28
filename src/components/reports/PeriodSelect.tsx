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
    <div className="flex items-center gap-2">
      <Select value={month} onChange={(e) => onMonthChange(Number(e.target.value))}>
        {t.months.full.map((m, i) => (
          <option key={m} value={i + 1}>
            {m}
          </option>
        ))}
      </Select>
      <Select value={year} onChange={(e) => onYearChange(Number(e.target.value))}>
        {[year - 1, year, year + 1].map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </Select>
    </div>
  );
}
