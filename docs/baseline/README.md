# Phase 0 baseline protection

Recorded: 2026-09-03 (America/Costa_Rica)  
Source commit: `04828e1054ef0e645c287d316e0899f1fb608ff4`  
Branch: `ui`  
Phase: 0 — Baseline protection

## Outcome

The current source has a reproducible production build and a documented manual regression surface. Representative initial-screen captures are stored beside this file.

The refreshed container now serves the current production bundle on the backend's allowed `http://localhost:5173` origin. API-backed Home, Search, Review, Settings, and Reports views were verified in the rendered application.

No automated test framework was added. The implementation handoff requires separate approval for that work.

## Production build record

Environment:

- Windows / PowerShell
- Node.js `v24.19.0`
- npm `11.17.0`
- API used for the configured build: `http://localhost:8081`

Command:

```powershell
$env:VITE_API_URL = "http://localhost:8081"
npm run build
```

Result: **passed** on 2026-09-03.

- TypeScript project build completed.
- Vite transformed 2,251 modules.
- Output: `dist/index.html`, one CSS asset, and one JavaScript asset.
- JavaScript bundle: 1,467.62–1,467.66 kB minified, about 481.92 kB gzip depending on the injected API URL.
- Vite emitted a non-blocking warning because the JavaScript chunk exceeds 500 kB.

The build also succeeds without `VITE_API_URL`, but that bundle cannot make valid API requests. A real API URL is therefore a required runtime-baseline precondition even though the compiler does not enforce it.

## Environment finding

The initial baseline pass found that:

- `http://localhost:8081` returned successful responses for Settings, Expenses, and Budget-versus-actual API requests.
- The backend returned `Access-Control-Allow-Origin: http://localhost:5173` only for the configured UI origin.
- `http://localhost:5173` served an older containerized UI build.
- A fresh build served at `http://localhost:4173` rendered the current route shells, but API-backed views showed `Failed to fetch` because `4173` is not an allowed browser origin.

The container was refreshed on 2026-09-03. Follow-up verification confirmed:

- the served JavaScript and CSS asset fingerprints match the fresh local production build;
- the primary header no longer contains the retired Categories destination;
- Home and Search load live expense data without fetch errors;
- Review and all three Reports routes load their API-backed states;
- Basic, Credit cards, Categories, and Advanced Settings load through application navigation;
- a refreshed nested Settings URL remains on the same route and retains its loaded content.

The environment mismatch is resolved. The reproducible baseline origin is `http://localhost:5173`.

## Observed baseline limitations

These behaviors predate the approved redesign and are recorded so they are not mistaken for Phase 1 regressions:

- At 390 × 844, the current header and expense rows extend beyond the viewport and produce horizontal page scrolling.
- Mobile Review clips the queue heading, batch controls, category selectors, and direct approval controls horizontally.
- The current shell shows desktop-style primary navigation at the mobile width instead of one mobile-only navigation system.
- Data-backed pages visibly pass through their loading state on a fresh browser session; the state resolves successfully on the refreshed `5173` container.

The responsive shell limitations belong to Phase 1. The Review-specific layout limitations remain part of the later Review migration and its acceptance checks.

## Representative captures

Captures use the current production bundle at 1440 × 1000 desktop and 390 × 844 mobile viewports. Every capture was taken only after its API-backed loading state resolved successfully.

| Surface | Capture |
| --- | --- |
| Desktop Home | [desktop-home-light.jpg](screenshots/desktop-home-light.jpg) |
| Desktop Search | [desktop-search-light.jpg](screenshots/desktop-search-light.jpg) |
| Desktop Review | [desktop-review-light.jpg](screenshots/desktop-review-light.jpg) |
| Desktop Add expense | [desktop-add-light.jpg](screenshots/desktop-add-light.jpg) |
| Desktop Reports | [desktop-reports-light.jpg](screenshots/desktop-reports-light.jpg) |
| Desktop Settings | [desktop-settings-light.jpg](screenshots/desktop-settings-light.jpg) |
| Mobile Home | [mobile-home-light.jpg](screenshots/mobile-home-light.jpg) |
| Mobile Review | [mobile-review-light.jpg](screenshots/mobile-review-light.jpg) |

The checked-in captures are visual anchors, not golden-image tests. Data, dates, greeting text, and exchange rates are expected to vary.

## Manual test matrix

Run the core flow once in each of these four presentation combinations:

| Language | Theme |
| --- | --- |
| English | Light |
| English | Dark |
| Spanish | Light |
| Spanish | Dark |

Run every combination at both representative viewports:

- Desktop: 1440 × 1000
- Mobile: 390 × 844

For each combination, verify:

- the active language is applied to navigation, page headings, controls, empty/loading/error text, confirmation dialogs, and success feedback;
- page, card, input, chart, muted, selected, warning, and destructive treatments remain legible in the active theme;
- keyboard focus is visible and logical on desktop;
- no horizontal page scrolling, clipped controls, or unreachable actions appear on mobile;
- the currency control updates every visible financial amount consistently.

## Core manual flow

### 1. Application shell and routing

1. Open Home and verify the header, currency control, theme control, Settings entry, and bottom navigation.
2. Visit Review, Search, Add expense, all three Reports pages, and all four Settings pages.
3. Refresh each direct URL and verify it returns to the same route.
4. Verify Home, Search, and Add expense remain reachable from the bottom navigation.
5. Toggle CRC/USD and confirm visible amounts update without a route change.
6. Toggle light/dark and confirm the selection survives a refresh.

Current route inventory:

- `/`
- `/search`
- `/add`
- `/review`
- `/settings/basic`
- `/settings/credit-cards`
- `/settings/categories`
- `/settings/advanced`
- `/reports/budget-vs-actual`
- `/reports/burndown`
- `/reports/subcategories-by-month`

### 2. Home and expense behavior

1. Verify greeting, favorite-bank rate, favorite-category budgets, date groups, daily totals, and empty-day text.
2. Expand and collapse an expense and verify its metadata stays associated with the correct row.
3. Open Edit, Split, and Delete from a representative expense; use Cancel for the baseline pass.
4. Open the longer-history control and verify additional results append without losing the current state.
5. Follow a favorite-category budget to its report and verify the category context is retained.

### 3. Search

1. Search by merchant and note text.
2. Exercise explicit dates and every quick range.
3. Filter by category.
4. Sort by date and amount in both directions.
5. Verify result count, displayed total, currency changes, and empty results.
6. Expand a result and open its Edit, Split, and Delete actions, cancelling destructive changes.
7. Follow an unreviewed expense to Review when a suitable fixture exists.

### 4. Add expense

1. Submit an empty form and verify required-field validation.
2. Enter merchant, amount, currency, date, time, and category.
3. Exercise both supported manual payment methods: Cash and SINPE. Manual entry must not offer credit-card selection.
4. Add and remove an optional note.
5. For a mutation-enabled test run, save a clearly named disposable expense, verify it appears in Home/Search, then remove it through the normal confirmed Delete flow.

### 5. Review

1. Verify pending count and queue content.
2. Change a proposed category and exercise the learning choice.
3. Select and clear multiple rows.
4. Open the Bulk review button/workflow and verify its batch scope, category decisions, confirmation and cancellation paths, completion feedback, and resulting queue state.
5. With resettable fixtures, separately test direct approval, Approve selected, Approve all, and Split.
6. Verify empty-queue behavior after approvals.

Approval operations change backend data. Use known resettable fixtures rather than personal transactions.

### 6. Settings

1. Basic: verify personal information, currency, language, favorite categories, and favorite banks load.
2. Change the language and confirm the application updates consistently, then restore the starting value.
3. Credit cards: verify list, Add, Edit, and Deactivate entry points; cancel before mutation in the baseline pass.
4. Categories: verify category and subcategory management entry points; cancel before mutation in the baseline pass.
5. Advanced: verify exchange-rate fallback and credit-card reporting-date controls.
6. Save one reversible preference change and verify it survives refresh, then restore the original value.

### 7. Reports

1. Budget versus actual: change month/year, expand ranked categories, inspect category/subcategory detail, and verify a Home deep link.
2. Burndown: change month/year and main category; verify actual, expected, and subcategory series.
3. Subcategories by month: change year and main category; verify twelve-month series.
4. On every report, switch CRC/USD and verify values, axes, tooltips, legends, and empty states.

## Phase 0 exit check

- [x] Clean production build result recorded.
- [x] Representative current-source screen captures recorded.
- [x] English/Spanish and light/dark manual flows identified.
- [x] Desktop and mobile verification sizes identified.
- [x] Automated test foundation intentionally deferred pending separate approval.
- [x] Fresh current-source bundle and API-backed browser flows available on the same allowed local origin.

Phase 0's baseline-protection exit check is complete. Phase 1 remains a separate approval checkpoint under the implementation handoff.
