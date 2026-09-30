import type { CategorySummary } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { useLanguage } from "@/lib/language";

interface MainGroup {
  id: number;
  name: string;
  count: number;
  total: number;
  rows: CategorySummary["rows"];
}

// The API already orders rows by main category then amount, so a single pass
// groups them; subtotals are plain sums of the rows shown.
function groupRows(rows: CategorySummary["rows"]): MainGroup[] {
  const groups: MainGroup[] = [];
  for (const row of rows) {
    let g = groups[groups.length - 1];
    if (!g || g.id !== row.main_category_id) {
      g = { id: row.main_category_id, name: row.main_category_name, count: 0, total: 0, rows: [] };
      groups.push(g);
    }
    g.rows.push(row);
    g.count += row.expense_count;
    g.total += row.total_colones;
  }
  return groups;
}

// "YYYY-MM-DD" -> local Date without the UTC shift new Date(str) would add.
function parseDay(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Brand lockup from the brand sheet (docs/ui/UICard.png): the bag outline
// without its tile, the two-tone wordmark and the tagline. Fixed brand
// colours, like the rest of the sheet, so it reads the same in dark mode.
function BrandLockup() {
  return (
    <div className="flex shrink-0 items-center gap-2">
        <svg aria-hidden="true" className="h-12 w-12 text-[#0F3D32]" viewBox="3 4 26 26" fill="none">
          <g transform="translate(16 0) scale(1.3 1) translate(-16 0)">
          <path
            d="M11 9c1.6-3.1 3.3-3.7 5-2.1 1.7-1.6 3.4-1 5 2.1l-2.3 2.6h-5.4L11 9Z"
            stroke="currentColor"
            strokeWidth="1.6"
            vectorEffect="non-scaling-stroke"
            strokeLinejoin="round"
          />
          <path
            d="M12.4 11.6c-1.1 2.5-2.6 7.2-2.8 10.7-.1 2.7 2.1 4.1 6.4 4.1s6.5-1.4 6.4-4.1c-.2-3.5-1.7-8.2-2.8-10.7"
            stroke="currentColor"
            strokeWidth="1.6"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M19.3 11.8c2.2-.2 4 .4 5.2 1.7" stroke="currentColor" strokeWidth="1.6"
            vectorEffect="non-scaling-stroke" strokeLinecap="round" />
          </g>
          <circle cx="16" cy="17.2" r="1.65" fill="#D4A43A" />
          <circle cx="16" cy="22.3" r="1.65" fill="#D4A43A" />
        </svg>
        <span className="text-3xl font-semibold leading-none tracking-tight">
          <span className="text-[#2F6B57]">Mi</span>
          <span className="text-[#0F3D32]">Harina</span>
        </span>
    </div>
  );
}

// The shareable page itself. Deliberately fixed light colours (not theme
// tokens) so it looks like paper on screen in dark mode and prints the same.
export function CategoryReportSheet({ report, name }: { report: CategorySummary; name?: string }) {
  const { t, language } = useLanguage();
  const locale = language === "es" ? "es-CR" : "en-US";
  const fmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });
  const groups = groupRows(report.rows);
  const c = t.categoryReport;

  return (
    <article
      data-testid="category-report-sheet"
      className="rounded-lg border border-neutral-200 bg-white p-5 text-neutral-900 shadow-sm sm:p-8 print:rounded-none print:border-0 print:p-0 print:shadow-none"
    >
      <header className="flex items-start justify-between gap-4 border-b border-neutral-200 pb-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight">{name?.trim() || c.sheetTitle}</h2>
          <p className="text-sm text-neutral-600">
            {fmt.format(parseDay(report.from))} – {fmt.format(parseDay(report.to))}
          </p>
          <p className="text-xs text-neutral-500">{c.generated(fmt.format(new Date()))}</p>
        </div>
        <BrandLockup />
      </header>

      <div className="mt-4 flex flex-col gap-5">
        {groups.map((g) => (
          <section key={g.id} className="break-inside-avoid">
            <div className="flex items-baseline justify-between gap-3 border-b border-neutral-300 pb-1">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-neutral-700">{g.name}</h3>
              <span className="text-sm font-semibold tabular-nums">{formatMoney(g.total, "CRC")}</span>
            </div>
            <table className="w-full text-sm">
              <thead className="sr-only">
                <tr>
                  <th>{c.subcategory}</th>
                  <th>{c.amount}</th>
                  <th>{c.share}</th>
                </tr>
              </thead>
              <tbody>
                {g.rows.map((r) => (
                  <tr key={r.category_id} className="border-b border-neutral-100 last:border-0">
                    <td className="py-1.5 pr-2">{r.subcategory_name}</td>
                    <td className="w-32 py-1.5 text-right tabular-nums">{formatMoney(r.total_colones, "CRC")}</td>
                    <td className="w-16 py-1.5 pl-3 text-right text-xs tabular-nums text-neutral-600">{r.pct.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>

      <footer className="mt-5 flex items-baseline justify-between gap-3 border-t-2 border-neutral-800 pt-3">
        <span className="text-base font-semibold">{c.total}</span>
        <span className="text-lg font-semibold tabular-nums">{formatMoney(report.total_colones, "CRC")}</span>
      </footer>
      <p className="mt-2 text-xs text-neutral-500">{c.colonesNote}</p>
    </article>
  );
}
