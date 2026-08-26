import * as React from "react";
import { siVisa, siMastercard, siAmericanexpress } from "simple-icons";
import { ChartNoAxesColumnIncreasing, Star } from "lucide-react";
import type { CardType } from "@/lib/api";

// Bank badges: simple original pictograms (not traced from any bank's
// actual logo artwork) in the bank's real brand colors -- see the module
// comment on each shape below for why it's a safe simplification rather
// than an imitation of the specific proprietary artwork. Keyed by
// normalized bank code/name so both `banks.code` (from GET /banks) and the
// free-text `expenses.entity` column (which holds the same codes, plus
// legacy variants like "ProA") resolve to the same badge.
interface BankStyle {
  label: string;
  render: () => React.ReactElement;
}

// Plain two-triangle house (roof + body, no door/window/chimney detail) --
// generic enough that it reads as "a house," not Davivienda's specific
// illustrated mascot house.
function HouseGlyph({ roof, body }: { roof: string; body: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4">
      <path d="M2 12 L12 3 L22 12 Z" fill={roof} />
      <rect x="4" y="12" width="16" height="9" rx="1" fill={body} />
    </svg>
  );
}

// A plain star, mostly one color with a thin accent sliver clipped onto one
// edge -- a subtle nod to the two-tone idea without matching Promerica's
// specific diagonal motion-line split.
function AccentStarGlyph({ main, accent }: { main: string; accent: string }) {
  return (
    <span className="relative block h-4 w-4">
      <Star className="absolute inset-0 h-4 w-4" fill={main} color={main} strokeWidth={0} />
      <span className="absolute inset-0 overflow-hidden" style={{ clipPath: "polygon(58% 0, 100% 0, 100% 100%, 58% 100%)" }}>
        <Star className="h-4 w-4" fill={accent} color={accent} strokeWidth={0} />
      </span>
    </span>
  );
}

const BANK_ALIASES: Record<string, BankStyle> = {
  // Ascending-bars/growth icon -- a completely generic finance pictogram,
  // unrelated in concept to BAC's actual flag-shaped mark.
  BAC: { label: "BAC San Jose", render: () => <ChartNoAxesColumnIncreasing className="h-4 w-4 text-red-600" strokeWidth={2.5} /> },
  BG: { label: "Banco General", render: () => <Star className="h-4 w-4" fill="#1e40af" color="#1e40af" strokeWidth={0} /> },
  BANCOGENERAL: { label: "Banco General", render: () => <Star className="h-4 w-4" fill="#1e40af" color="#1e40af" strokeWidth={0} /> },
  DV: { label: "Davivienda", render: () => <HouseGlyph roof="#ea580c" body="#dc2626" /> },
  DAVIVIENDA: { label: "Davivienda", render: () => <HouseGlyph roof="#ea580c" body="#dc2626" /> },
  PROMERICA: { label: "Promerica", render: () => <AccentStarGlyph main="#15803d" accent="#84cc16" /> },
  PROM: { label: "Promerica", render: () => <AccentStarGlyph main="#15803d" accent="#84cc16" /> },
  PROA: { label: "Promerica", render: () => <AccentStarGlyph main="#15803d" accent="#84cc16" /> },
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
  render: () => <ChartNoAxesColumnIncreasing className="h-4 w-4 text-slate-600" strokeWidth={2.5} />,
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
      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/10 ${className}`}
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
