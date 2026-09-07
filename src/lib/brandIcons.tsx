import * as React from "react";
import { siVisa, siMastercard, siAmericanexpress } from "simple-icons";
import { ChartNoAxesColumnIncreasing } from "lucide-react";
import type { CardType } from "@/lib/api";
import bacLogo from "@/assets/banks/bac.png";
import bancoGeneralLogo from "@/assets/banks/banco-general.png";
import daviviendaLogo from "@/assets/banks/davivienda-badge.png";
import promericaLogo from "@/assets/banks/promerica.png";

// Approved compact marks are bundled as icon-only crops from the third badge
// row in the bank-treatment exploration; see assets/banks/README.md. The
// registry is keyed by normalized bank code/name so both `banks.code` and
// legacy `expenses.entity` variants resolve to the same badge.
interface BankStyle {
  label: string;
  render: () => React.ReactElement;
}

function ApprovedBankMark({ src }: { src: string }) {
  return (
    <img
      src={src}
      alt=""
      className="h-7 w-7 rounded-full object-cover"
      aria-hidden="true"
      draggable={false}
    />
  );
}

const BANK_ALIASES: Record<string, BankStyle> = {
  BAC: { label: "BAC San Jose", render: () => <ApprovedBankMark src={bacLogo} /> },
  BG: { label: "Banco General", render: () => <ApprovedBankMark src={bancoGeneralLogo} /> },
  BANCOGENERAL: { label: "Banco General", render: () => <ApprovedBankMark src={bancoGeneralLogo} /> },
  DV: { label: "Davivienda", render: () => <ApprovedBankMark src={daviviendaLogo} /> },
  DAVIVIENDA: { label: "Davivienda", render: () => <ApprovedBankMark src={daviviendaLogo} /> },
  PROMERICA: { label: "Promerica", render: () => <ApprovedBankMark src={promericaLogo} /> },
  PROM: { label: "Promerica", render: () => <ApprovedBankMark src={promericaLogo} /> },
  PROA: { label: "Promerica", render: () => <ApprovedBankMark src={promericaLogo} /> },
};

function normalize(s: string) {
  return s.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

// Aliases are short codes ("BAC"), but callers pass either that code
// (expenses.entity) or a full display name (credit_cards.bank_name, e.g.
// "BAC San Jose") -- so an exact match isn't enough. Longest-key-first
// substring match handles both, without "BG" spuriously matching inside an
// unrelated longer name.
const ALIAS_KEYS = Object.keys(BANK_ALIASES).sort((a, b) => b.length - a.length);

const FALLBACK_BANK_STYLE: BankStyle = {
  label: "Bank",
  render: () => <ChartNoAxesColumnIncreasing className="h-4 w-4" strokeWidth={2.5} />,
};

// Resolves a bank display style from either a `banks.code`/`banks.name`
// value or a raw `expenses.entity` string. Returns null for "MANUAL" (no
// bank known) and falls back to a neutral badge for any bank not in
// BANK_ALIASES yet, rather than hiding it.
export function resolveBank(codeOrName?: string | null): BankStyle | null {
  if (!codeOrName) return null;
  const key = normalize(codeOrName);
  if (key === "" || key === "MANUAL") return null;
  const alias = ALIAS_KEYS.find((k) => key.includes(k));
  if (alias) return BANK_ALIASES[alias];
  return { ...FALLBACK_BANK_STYLE, label: codeOrName };
}

// Icon-only -- the bank name is carried in the `title` tooltip/aria-label
// rather than printed alongside, since the badge is meant to stand on its
// own next to a card or expense row. Full-color glyph on a light neutral
// chip (rather than a white silhouette on a brand-color chip, the
// treatment used for card networks below) so each bank's two-tone coloring
// stays visible.
export function BankBadge({ codeOrName, className = "" }: { codeOrName?: string | null; className?: string }) {
  const style = resolveBank(codeOrName);
  if (!style) return null;
  return (
    <span
      title={style.label}
      aria-label={style.label}
      className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-muted-foreground shadow-sm ring-1 ring-black/10 ${className}`}
    >
      {style.render()}
    </span>
  );
}

// Real network marks (MIT-licensed path data from simple-icons -- official
// brand shapes, used editorially here to identify which network a card is
// on, same pattern as any payments UI showing a Visa/Mastercard/Amex mark).
// Rendered as a white glyph on its own brand-color squircle, icon only.
const CARD_NETWORK_ICONS: Record<CardType, { label: string; svgPath: string; hex: string }> = {
  visa: { label: siVisa.title, svgPath: siVisa.path, hex: siVisa.hex },
  mastercard: { label: siMastercard.title, svgPath: siMastercard.path, hex: siMastercard.hex },
  amex: { label: siAmericanexpress.title, svgPath: siAmericanexpress.path, hex: siAmericanexpress.hex },
};

export function CardNetworkBadge({ type, className = "" }: { type?: string | null; className?: string }) {
  const icon = type ? CARD_NETWORK_ICONS[type as CardType] : undefined;
  if (!icon) return null;
  return (
    <span
      title={icon.label}
      aria-label={icon.label}
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg shadow-sm ${className}`}
      style={{ backgroundColor: `#${icon.hex}` }}
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="white">
        <path d={icon.svgPath} />
      </svg>
    </span>
  );
}
