import { Select } from "@/components/ui/select";

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface PeriodSelectProps {
  year: number;
  month: number;
  onYearChange: (year: number) => void;
  onMonthChange: (month: number) => void;
}

export function PeriodSelect({ year, month, onYearChange, onMonthChange }: PeriodSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <Select value={month} onChange={(e) => onMonthChange(Number(e.target.value))}>
        {MONTHS.map((m, i) => (
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
