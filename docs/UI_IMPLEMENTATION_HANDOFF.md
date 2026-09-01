# MiHarina UI Implementation Handoff

Last updated: 2026-08-31  
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

## Route and screen map

| Product area | Current route | Target route and treatment | Change |
| --- | --- | --- | --- |
| Home | `/` | `/` | Redesign with capped Today and Recent previews, favorite budgets, greeting, time icon, favorite-bank rate, and informative alerts. |
| Activity | None | `/activity` | New contextual route from Home. Reverse chronological date groups; no filters or tabs. |
| Review | `/review` | `/review` | Preserve queue behavior; apply approved desktop and mobile treatments. |
| Search | `/search` | `/search` | Preserve all filters, sorting, totals, Review links, flags, details, and actions; adapt filters on mobile. |
| Add Expense | `/add` | `/add` | Preserve route for direct access. Present as a focused modal on desktop and a framed focused screen on mobile. |
| Reports | `/reports/*` | Existing report routes | Preserve all three existing reports and apply the Clear ranking hierarchy where appropriate. |
| Alerts | None | `/alerts` | New full Alerts center. Desktop bell also opens a compact panel; mobile bell opens this route/view. |
| Settings | `/settings/*` | Existing settings routes | Replace top submenu with desktop rail and mobile Settings index-to-detail navigation. |

Activity and Alerts are contextual destinations, not new primary navigation items. Categories remain accessible only through Settings.

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
- `ExpenseActions`: Edit, Split, and Delete; always visible in the main frame on desktop and mobile.
- `ExpenseFlag`: possible duplicate now and suspicious expense when available; persistent in collapsed and expanded states.
- `ExpenseDetails`: an unlabeled frame directly below the corresponding expense.
- `ExpenseDetailRow`: one full-width icon-and-value row per metadata item.
- `ExpenseDialogs`: reuse the current edit, split, delete, and destructive-confirmation behavior.

### Required behavior

- Expansion occurs inline and never beside the expense.
- The note or comment always occupies its own detail row.
- Detail rows use spacing, not internal separator lines.
- Available future metadata is appended as another `ExpenseDetailRow` without changing the main row.
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
- Uses the shared expense components and existing expense pagination.

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
- Current bank/card badge resolution, after visual review against the approved component treatment.
- Existing language infrastructure; every changed or added label must be supplied in English and Spanish.

The current generic wallet brand icon and generic Lucide category fallbacks are not approved substitutes for the locked MiHarina mark and custom category artwork.

## Data and backend dependencies

| Capability | Current support | Implementation note |
| --- | --- | --- |
| Home and Activity expense data | Available | Reuse expense list with date ranges, limit, and offset. Activity can paginate progressively. |
| Favorite categories and saved currency | Available | Reuse Settings data. |
| Favorite-bank rates | Available | Reuse banks, favorite-bank settings, and exchange-rate calls. |
| Expense actions and flags | Mostly available | Preserve current duplicate flag. Suspicious-expense behavior remains future work. |
| Review queue and approvals | Available | Existing endpoints support current workflow. |
| Search | Available | Existing list parameters support present filters and pagination. |
| Add Expense | Available | Create already accepts payment-related data; use current credit-card list for selection. |
| Existing reports | Available | Preserve the three audited endpoint families and current calculations. |
| Review pending count | Derivable | Initially derive from existing Review data; consider a compact count endpoint only if performance requires it. |
| Alert settings | Not represented in current settings model | Backend must persist enable/disable values, lead days, and budget threshold before these controls are functional. |
| Alerts center | Not available | Requires alert records, unread/read state, dismissal, resolution status, contextual target, de-duplication key, and timestamps. |
| Thirty-day Earlier retention | Not available | Requires backend lifecycle/retention behavior or an explicitly agreed client-storage alternative. Backend ownership is preferred. |
| Period comparison | Not available | Deferred; requires separately scoped comparable-period data. |

### Proposed alert contract for backend review

This is an implementation requirement, not a final API specification:

- Alert identity and type.
- Created/updated timestamps.
- Read timestamp or unread state.
- Dismissed and resolved timestamps or state.
- Contextual destination and related entity identifier.
- Condition/de-duplication key so repeated checks update one alert.
- Current versus Earlier lifecycle.
- Automatic deletion or exclusion after 30 days in Earlier.
- Settings for card lead days, favorite-category threshold, duplicate notifications, and future suspicious notifications.

Persistent expense flags remain owned by the expense/flag model; alert read or dismissal operations must never clear them.

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
- Adapt current dialogs and destructive confirmation.
- Verify collapsed, expanded, flagged, loading, empty, and error states.

Exit check: one shared implementation satisfies the approved desktop/mobile expense pattern.

### Phase 3 — Home and Activity

- Apply capped previews, greeting/rates, favorite-budget status, and Home alert placement.
- Add `/activity` and chronological grouped loading.
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
- Add Alert settings presentation only when persistence is available, or clearly keep it behind a non-production feature boundary.

Exit check: every current setting remains reachable and save behavior is unchanged.

### Phase 7 — Alerts

- Implement bell count, desktop panel, mobile/full Alerts center, Current/Earlier sections, contextual navigation, and lifecycle actions.
- Integrate the approved alert settings.

Dependency: backend alert storage and lifecycle contract must be approved and implemented first.

Exit check: read, dismiss, resolve, de-duplicate, and retention behavior matches the approved model without altering expense flags.

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
