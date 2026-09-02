# MiHarina UI Implementation Handoff

Last updated: 2026-09-02  
Status: Ready for human review and approval  
Authority: Planning only; this document does not authorize production UI changes

## Purpose

This handoff translates the approved MiHarina UI design into an implementation sequence for the existing React application. It connects the approved visual references to current routes, reusable components, available API support, backend gaps, and acceptance checks.

The governing design decisions remain in [`UI_DESIGN_CONTEXT.md`](UI_DESIGN_CONTEXT.md). If a visual reference and this handoff appear to conflict, pause implementation and request human review rather than choosing one silently.

## Approved reference set

| Area | Approved reference |
| --- | --- |
| Identity and original component language | [`ui/UICard.png`](ui/UICard.png) |
| Custom category iconography | [`ui/Iconografia.png`](ui/Iconografia.png) |
| Bank-badge treatment exploration | [`ui/bank-badge-treatment-exploration.png`](ui/bank-badge-treatment-exploration.png) |
| Balanced Home baseline | [`ui/mi-harina-balanced-overview.html`](ui/mi-harina-balanced-overview.html) |
| Visual foundations | [`ui/mi-harina-foundations-gallery.html`](ui/mi-harina-foundations-gallery.html) |
| Components | [`ui/mi-harina-components-gallery.html`](ui/mi-harina-components-gallery.html) |
| Interaction states | [`ui/mi-harina-interaction-states.html`](ui/mi-harina-interaction-states.html) |
| Home, Activity, and mobile Review composition | [`ui/mi-harina-key-screens.html`](ui/mi-harina-key-screens.html) |
| Add Expense | [`ui/mi-harina-add-expense-gallery.html`](ui/mi-harina-add-expense-gallery.html) |
| Alerts behavior | [`ui/mi-harina-alerts-behavior.html`](ui/mi-harina-alerts-behavior.html) |
| Semantic icon mappings | [`ui/mi-harina-icon-mappings.html`](ui/mi-harina-icon-mappings.html) |
| Reports treatment | [`ui/mi-harina-report-treatments.html`](ui/mi-harina-report-treatments.html) |
| Categories access | [`ui/mi-harina-categories-access.html`](ui/mi-harina-categories-access.html) |
| Settings navigation | [`ui/mi-harina-settings-navigation.html`](ui/mi-harina-settings-navigation.html) |
| Settings content | [`ui/mi-harina-settings-screens.html`](ui/mi-harina-settings-screens.html) |
| Search | [`ui/mi-harina-search-screens.html`](ui/mi-harina-search-screens.html) |
| Desktop Review | [`ui/mi-harina-desktop-review.html`](ui/mi-harina-desktop-review.html) |
| Alert settings | [`ui/mi-harina-alert-settings.html`](ui/mi-harina-alert-settings.html) |

These files are the approved design artifacts. Their sample data is illustrative and is not a replacement for application data or existing calculations.

The bank-badge exploration is a treatment reference rather than a source of official logo artwork. Its third-row solid circular badges define the preferred compact composition; the generated bank marks themselves must not be shipped as official assets.

## Route and screen map

| Product area | Current UI route | Target UI route | Current data source | Change |
| --- | --- | --- | --- | --- |
| Home | `/` | `/` | Grouped `GET /expenses` plus existing supporting endpoints | Redesign with capped Today and Recent previews, favorite budgets, greeting, time icon, favorite-bank rate, and informative alerts. |
| Activity | Not implemented | `/activity` | Grouped `GET /expenses` with a fixed `from`/`to` window | Add a contextual route from Home with reverse-chronological date groups and no filters or tabs. No separate Activity endpoint is needed. |
| Review | `/review` | `/review` | Existing Review endpoints | Preserve queue behavior; apply approved desktop and mobile treatments. |
| Search | `/search` | `/search` | Grouped `GET /expenses` with existing filters | Preserve all filters, sorting, totals, Review links, flags, details, and actions; flatten the grouped response and adapt filters on mobile. |
| Add Expense | `/add` | `/add` | Existing expense-creation and supporting-list endpoints | Preserve route for direct access. Present as a focused modal on desktop and a framed focused screen on mobile. |
| Reports | `/reports/*` | Existing report routes | Existing report endpoints | Preserve all three existing reports and apply the Clear ranking hierarchy where appropriate. |
| Alerts | Not implemented | `/alerts` | Existing `/alerts` lifecycle endpoints plus `/events/anomaly` | Add a full Alerts center for duplicate-expense alerts. Desktop bell also opens a compact panel; mobile bell opens this route/view. Suspicious-expense alerts remain a future extension. |
| Settings | `/settings/*` | Existing settings routes | Existing Settings endpoints, including anomaly-alert preferences | Replace top submenu with desktop rail and mobile Settings index-to-detail navigation. |

Activity and Alerts are contextual destinations, not new primary navigation items. Categories remain accessible only through Settings.

“Not implemented” in the current UI route column refers only to route availability. Activity already has its required backend data source in the grouped `GET /expenses` response.

## Global shell

The application shell is shared by every signed-in product route.

### Desktop

- Locked MiHarina bag logo links to Home.
- Primary destinations: Review with pending count, Search, and Reports.
- Add Expense is a secondary header action.
- Persistent utilities: Currency, Theme, Alerts, and Settings.
- No mobile bottom navigation is shown.

### Mobile

- Compact top bar contains the locked identity plus persistent Currency, Theme, and Alerts utilities.
- Bottom navigation contains Home, Review, Search, and Reports.
- The selected Home item remains an ordinary selected navigation item, not a large pill or blob.
- Add Expense remains reachable without outranking Review.

### Shell components

- `MiHarinaLogo`: approved full mark and compact isotype variants only.
- `DesktopPrimaryNav` and `MobileBottomNav`: one responsive navigation system at a time.
- `CurrencyQuickControl`: CRC/USD quick display selection, synchronized across every financial surface.
- `ThemeControl`: light/dark switch with theme-appropriate accessible label.
- `AlertsControl`: unread count, desktop panel trigger, and mobile Alerts destination.
- `SettingsControl`: direct Settings access.

## Shared expense system

Home, Activity, Search, and relevant Review contexts must share one expense presentation system rather than implementing visually different rows.

### Proposed component boundaries

- `ExpenseList`: date grouping, empty groups, daily totals, and loading/empty/error states.
- `ExpenseFrame`: merchant, category, time, amount, expand control, flag region, and actions.
- `ExpenseActions`: Edit, Split, and Delete are always visible in the main frame on desktop and mobile. A conditional crossed-flag action is added when the expense is flagged.
- `ExpenseFlag`: possible duplicate now and suspicious expense when available; persistent in collapsed and expanded states.
- `ExpenseDetails`: an unlabeled frame directly below the corresponding expense.
- `ExpenseDetailRow`: one full-width icon-and-value row per metadata item.
- `BankBadge`: official locally stored bank artwork when available, otherwise the existing approved generic approximation; never a bank-code text badge. Compact contexts prefer the third-row solid circular treatment from the approved exploration.
- `CardNetworkBadge`: official Visa, Mastercard, or American Express network artwork in the shared badge container.
- `ExpenseDialogs`: reuse the current edit, split, delete, and destructive-confirmation behavior.

### Required behavior

- Expansion occurs inline and never beside the expense.
- The note or comment always occupies its own detail row.
- Detail rows use spacing, not internal separator lines.
- Available future metadata is appended as another `ExpenseDetailRow` without changing the main row.
- Credit-card expenses add a localized `Pays on [date]` detail row when a calculated payment due date is available.
- Payment identity follows the stable order **bank badge → card-network badge → masked last four digits**.
- Bank artwork is resolved from the stable backend bank code, with legacy entity aliases normalized to that code. Official artwork takes precedence; the existing generic pictogram approximation is the fallback. Do not generate a bank short-code badge.
- Every bank badge exposes the full bank name to assistive technology. Management and selection views also show the bank name visibly; compact expense details may use the accessible label and tooltip while retaining the icon-only layout.
- Compact bank badges prefer a consistent circular brand-color field with an approved reversed/white official mark. When the official artwork is intended for a light background or does not pass contrast on the brand field, use the exploration's light neutral circular treatment instead.
- Official bank and card-network artwork keeps its approved proportions and colors; it must not be stretched, arbitrarily recolored, or fetched remotely at runtime.
- Direct actions do not depend on the details being expanded.
- Destructive actions require explicit confirmation and retain a safe Cancel path.

## Screen implementation map

### Home

- Greeting includes the user's name and Sun, Sunset, or Moon according to time of day.
- One favorite-bank exchange rate is visible; an inline expansion reveals the second when configured.
- Today preview shows at most three expenses on desktop and two on mobile.
- Recent preview is similarly compact.
- `View all expenses` opens `/activity`, never Search.
- Favorite categories link to the relevant Budget versus actual detail.
- Budget bars use semantic progression from healthy green through warning to danger as usage approaches or exceeds 100%.
- Today's section does not contain a duplicate Add button.

### Activity

- One continuous reverse-chronological list: Today, Yesterday, then calendar dates.
- No filter, sort, tab, or search controls.
- Empty date groups remain visible with a short empty-state message.
- Non-empty group headers show the daily total.
- Uses the grouped response from `GET /expenses` with a fixed `from`/`to` date window; no separate Activity API or expense-level pagination is required.
- Because the backend returns groups only for dates containing expenses, the frontend synthesizes missing dates inside the requested window so approved empty date groups remain visible.

### Review

- Preserve pending count, batch selection, Approve selected, Approve all, category selection, confidence, direct approval, and deep links.
- The learning option label is exactly `Always` in English, with the approved Spanish resource reviewed alongside it.
- Do not restore the removed explanatory queue subtitle.
- Mobile layout must not clip or require horizontal scrolling.

### Search

- Desktop filters remain visible below the page heading.
- Mobile exposes filters through one clear Filters control.
- Preserve merchant/note query, date controls, quick range, category, sort field, direction, result count, and total.
- Preserve Review links for unreviewed expenses.
- Uses the shared expense frame, flags, actions, and detail pattern.

### Add Expense

- Desktop uses the approved focused modal treatment.
- Mobile uses the same focused hierarchy inside a framed MiHarina application screen.
- Omit the redundant `Record new expense` subtitle.
- Payment method and Note expand inline without opening a second screen.
- Preserve current submission and validation behavior while exposing existing credit-card support through the approved optional section.

### Settings

- Desktop uses a persistent left rail for Basic, Credit cards, Categories, and Advanced.
- Mobile opens a Settings index, then a framed section detail screen.
- Existing routes remain stable.
- Category management and favorite selection remain Settings-only.
- Advanced preserves the existing `credit_card_expense_date` preference, with transaction-day and card-due-date choices, as its own Credit card reporting section.
- The selected reporting-date rule must be applied consistently to monthly budgets, Home favorite-category status, and every affected report without rewriting the original expense timestamp.
- New technical preferences extend Advanced unless separately approved.

### Reports

All existing report routes, data, calculations, controls, and translations remain distinct:

1. Budget versus actual: month/year, ranked category budget use, progressive disclosure, category/subcategory detail, and Home deep link.
2. Burndown: month/year, main category, actual versus expected cumulative pace, and subcategory lines.
3. Subcategories by month: year, main category, and twelve-month subcategory trends.

Apply the approved Clear ranking hierarchy where it fits the report's data. Period comparison remains pinned for future work and is not part of this implementation.

## Visual-system implementation

Create semantic design tokens before screen-level styling:

- Approved light and dark palette values from `UI_DESIGN_CONTEXT.md`.
- Inter regular and medium typography.
- Comfortable 4/8/12/16/24 spacing rhythm.
- Compact radii: approximately 6px controls, 9px cards, and 12px large panels.
- Page, surface, raised-surface, border, text, muted, primary, gold, warning, and danger tokens.
- Semantic budget states and chart colors that remain distinguishable in both themes.
- Shared hover, focus, pressed, expanded, disabled, loading, validation, flagged, and destructive states.

Color must not be the only carrier of status. Warning and flag treatments also require an icon and text label.

## Existing implementation that can be reused

- React Router route structure and current route URLs.
- Existing expense list, create, update, split, delete, and bulk-approve API calls.
- Existing categories, settings, banks, exchange rates, credit cards, and report calls.
- Current edit, split, and delete dialogs, subject to approved visual-state updates.
- Current currency and theme state behavior.
- Current ECharts integration and report calculations.
- Current bank/card badge resolution, upgraded to prefer locally stored official bank artwork while retaining the existing generic approximation as fallback. Short-code badges are not used.
- Existing language infrastructure; every changed or added label must be supplied in English and Spanish.

The current generic wallet brand icon and generic Lucide category fallbacks are not approved substitutes for the locked MiHarina mark and custom category artwork.

## Data and backend dependencies

| Capability | Current support | Implementation note |
| --- | --- | --- |
| Home and Activity expense data | Available | `GET /expenses` now returns `{ days: [{ date, total_crc, total_usd, expenses }] }`. Reuse fixed `from`/`to` windows; no separate Activity endpoint or expense-level pagination is required. |
| Favorite categories and saved currency | Available | Reuse Settings data. |
| Favorite-bank rates | Available | Reuse banks, favorite-bank settings, and exchange-rate calls. |
| Expense actions and flags | Available for current scope | Preserve the current duplicate flag. `GET /events/anomaly` lists flagged expenses and `DELETE /events/anomaly/{id}` explicitly clears one expense's flag. Suspicious-expense behavior remains future work. The conditional crossed-flag action invokes this DELETE route after confirmation. |
| Card payment date in expense details | Available | Each expense now includes `payment_date`; use it for the localized payment-date detail row so Home, Activity, and Search remain consistent. |
| Review queue and approvals | Available | Existing endpoints support current workflow. |
| Search | Available with response adaptation | Existing `GET /expenses` filters remain usable, but Search must flatten the grouped `days[].expenses` response and derive its result count and displayed total from the returned groups. |
| Add Expense | Available | Create already accepts payment-related data; use current credit-card list for selection. |
| Existing reports | Available | Preserve the three audited endpoint families and current calculations. |
| Credit-card reporting date | Available | Reuse `credit_card_expense_date`; expose it under Advanced and preserve the existing English and Spanish labels. |
| Review pending count | Derivable | Initially derive from existing Review data; consider a compact count endpoint only if performance requires it. |
| Alert settings | Available for current anomaly scope | `GET`/`PUT /settings` provide `alerts_enabled`, `duplicate_alerts_enabled`, and reserved `suspicious_alerts_enabled`. Only duplicate alerts are active in this release. |
| Alerts center | Available for duplicate alerts | Use `GET /alerts`, `GET /alerts/unread-count`, `PATCH /alerts/{id}/read`, `POST /alerts/mark-all-read`, and `PATCH /alerts/{id}/dismiss`. The payload already provides type, severity, expense destination, localized template data, and lifecycle timestamps. |
| Thirty-day Earlier retention | Not available | Requires backend lifecycle/retention behavior or an explicitly agreed client-storage alternative. Backend ownership is preferred. |
| Period comparison | Not available | Deferred; requires separately scoped comparable-period data. |

### Audited alert contract

The current backend supports this release's duplicate-expense alert flow:

- `GET /alerts?limit=50&offset=0` returns `{ current, earlier }`, ordered most-recent-first within each group.
- `GET /alerts/unread-count` supplies the global bell count.
- `PATCH /alerts/{id}/read` marks one alert read without changing its expense flag.
- `POST /alerts/mark-all-read` marks all unread alerts read.
- `PATCH /alerts/{id}/dismiss` moves an alert out of Current without changing its expense flag.
- `GET /events/anomaly` returns the caller's currently flagged expenses for backfill and direct anomaly views.
- `DELETE /events/anomaly/{id}` explicitly clears `flag_type` and `flag_reason` on that one expense and sets `resolved_at` on its related alert records. It does not clear the other expense in a duplicate pair.
- `GET`/`PUT /settings` support global alerts, duplicate alerts, and a reserved suspicious-alert preference.

Current production alert type: `duplicate_expense`. The contract reserves `suspicious_expense`, but its detector and UI treatment are future work. Credit-card reminders and favorite-category budget alerts are outside this release's alert scope even where earlier visual references used them as examples.

Persistent expense flags remain owned by the expense/anomaly model. Alert read or dismissal operations never clear them; only the explicit anomaly DELETE route unflags an expense. Thirty-day Earlier retention is not yet enforced by the backend.

### Expense unflag action

- Show a `flag-off` icon action only when an expense has `flag_type`.
- Place it with the direct expense actions in the main expense frame so it remains reachable whether details are collapsed or expanded, on desktop and mobile.
- Use localized accessible labels: **Clear expense flag** / **Quitar marca del gasto**. Do not use a bell icon because this action does not read, dismiss, or otherwise manage an alert.
- Ask for confirmation that names the current flag before calling `DELETE /events/anomaly/{id}`; explain that only this expense is being unflagged and its related alert will be resolved.
- On success, remove the flag treatment and action everywhere that expense is currently rendered, move/update its related alert state, and refresh the unread count if required by the returned state. On failure, retain the flag and show a non-blocking error.
- The action must never call an alert read or dismiss route, and alert controls must never call the anomaly DELETE route.

## Implementation sequence

Each phase is a separate approval and verification checkpoint. Small, reviewable changes are preferred over a single complete redesign.

### Phase 0 — Baseline protection

- Record a clean production build result and representative current-screen captures.
- Identify existing manual test flows in English/Spanish and light/dark themes.
- Add a lightweight automated test foundation only if separately approved.

Exit check: current behavior is reproducible before visual migration begins.

### Phase 1 — Foundations and application shell

- Add approved tokens, Inter, surface hierarchy, spacing, radii, and interaction states.
- Implement locked logo variants and approved semantic icons.
- Rebuild the responsive shell, primary navigation, and persistent utilities.
- Keep current page contents functioning inside the new shell.

Exit check: every existing route remains reachable in both themes and at desktop/mobile widths; only one navigation system is visible at a time.

### Phase 2 — Shared expense components

- Build `ExpenseFrame`, `ExpenseActions`, `ExpenseFlag`, `ExpenseDetails`, and `ExpenseDetailRow`.
- Consolidate `BankBadge` and `CardNetworkBadge` into the shared expense/payment-detail system, including official-art priority, approximation fallback, and accessible bank names.
- Adapt current dialogs and destructive confirmation.
- Verify collapsed, expanded, flagged, loading, empty, and error states.

Exit check: one shared implementation satisfies the approved desktop/mobile expense pattern.

### Phase 3 — Home and Activity

- Apply capped previews, greeting/rates, favorite-budget status, and Home alert placement.
- Add `/activity` using date-window requests to the grouped `GET /expenses` response; extend older history by requesting an earlier window rather than paginating individual expenses.
- Preserve category report deep links and direct expense actions.

Exit check: Home remains stable as expense volume grows; Activity provides complete contextual history without filters.

### Phase 4 — Review and Search

- Migrate both screens to approved responsive compositions and shared expense primitives.
- Preserve every audited filter, sorting, total, batch, confidence, Review-link, and approval behavior.

Exit check: functional parity is confirmed in English/Spanish and desktop/mobile.

### Phase 5 — Add Expense

- Implement focused desktop modal and framed mobile form.
- Add inline optional Payment method and Note disclosure.
- Preserve validation, submission, and existing direct-route access.

Exit check: keyboard, touch, validation, success, and cancellation flows work without losing entered data unexpectedly.

### Phase 6 — Settings

- Implement desktop rail and mobile index-to-detail navigation.
- Migrate all four current sections without changing their ownership.
- Add the persisted global and possible-duplicate alert controls. Keep the reserved suspicious-alert control out of the production UI until its detector is implemented.

Exit check: every current setting remains reachable and save behavior is unchanged.

### Phase 7 — Alerts

- Implement bell count, desktop panel, mobile/full Alerts center, Current/Earlier sections, contextual navigation, and lifecycle actions.
- Integrate the supported global and possible-duplicate alert settings.

Dependency status: satisfied for duplicate-expense alerts. Suspicious alerts and automatic thirty-day Earlier retention remain future backend work.

Exit check: list, unread count, read, mark-all-read, dismiss, contextual navigation, and explicit unflag/resolve behavior match the audited contract. Alert lifecycle actions must not alter expense flags except when the user explicitly invokes `DELETE /events/anomaly/{id}`. Automatic Earlier retention is deferred.

### Phase 8 — Reports

- Apply shared report navigation and the Clear ranking hierarchy.
- Migrate Budget versus actual, Burndown, and Subcategories by month independently.
- Preserve currency, calculations, controls, chart meaning, category deep links, and translations.

Exit check: figures match the existing reports for the same inputs, and charts remain legible in both themes and responsive layouts.

### Phase 9 — Integrated quality review

- Test all routes in English and Spanish, light and dark, desktop and representative mobile widths.
- Verify keyboard focus, icon labels, touch targets, overflow, loading, empty, error, validation, flagged, expanded, and destructive states.
- Confirm currency changes update every visible amount consistently.
- Confirm the locked identity and custom iconography are used throughout.

Exit check: the approved UI references and functional parity checklist pass human review.

## Recommended first implementation slice

After this handoff is approved, begin only with **Phase 1: Foundations and application shell**.

This slice establishes the tokens, locked identity, responsive navigation, and global utilities required by every later screen while keeping existing page behavior intact. It should be demonstrated on the current routes in light/dark and desktop/mobile before shared expense components begin.

## Approval gates

1. Approve or revise this implementation handoff.
2. Separately authorize Phase 1 production changes.
3. Review the working Phase 1 implementation before Phase 2 begins.
4. Repeat the review gate at the end of each phase.

No approval should be inferred from this document's existence.
