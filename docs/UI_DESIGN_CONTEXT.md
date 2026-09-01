# MiHarina UI Design Context

Last updated: 2026-08-31  
Status: Initial UI design and interaction specification approved; implementation handoff is ready for human review

## Purpose of this document

This document is the shared source of truth for MiHarina's interface design. It records established product requirements, locked decisions, the current information-architecture proposal, and decisions that remain open.

It is intended to prevent future UI work from accidentally reversing earlier decisions as the product grows.

## Decision policy

- The **MiHarina name and logo are locked**.
- All other visual and interaction decisions can be discussed and challenged.
- No proposed design change should be implemented without human feedback and approval.
- Existing labels and their language behavior must be respected. The application already supports English and Spanish.
- Recommendations in this document are not automatically approved merely because they are documented.

## Approved interface reference

The selected structural baseline is the **Balanced overview**. A preserved interactive reference is available at [`docs/ui/mi-harina-balanced-overview.html`](ui/mi-harina-balanced-overview.html).

This reference demonstrates:

- Desktop Home, mobile Home, and mobile Review
- Light and dark theme previews
- Persistent Currency, Theme, Alerts, and Settings controls
- Review receiving more navigational weight than manual expense entry
- Today's expenses and favorite-category budgets sharing the first content tier
- A stable, capped preview of today's and recent expenses on Home
- A contextual, chronological Activity page for the complete expense history
- Expandable expense details
- Persistent Edit, Split, and Delete expense actions
- Inline flags that remain visible wherever an expense appears

The reference captures the approved structure, not final production styling or implementation details.

## Approved visual foundations

The interactive [`docs/ui/mi-harina-foundations-gallery.html`](ui/mi-harina-foundations-gallery.html) preserves the visual-foundations review. The following selections are approved for both light and dark themes:

- Palette: **Higher contrast**
- Typography: **Inter**, using regular and medium weights
- Spacing: **Comfortable**, based on a 4, 8, 12, 16, and 24 pixel rhythm
- Corners: **Compact**, using approximately 6px for controls, 9px for cards, and 12px for larger panels

### Higher-contrast palette

Light foundation:

- Primary: `#063B30`
- Secondary: `#14604B`
- Soft green: `#D5E8DF`
- Page: `#F4F1E9`
- Surface: `#FFFDFA`
- Text: `#092F28`
- Border: `#CFC8BB`
- Gold accent: `#D4A43A`
- Warning: `#C96F35`
- Danger: `#B64236`

Dark foundation:

- Primary: `#A5DDC4`
- Secondary: `#7BC3A3`
- Soft green: `#1F4034`
- Page: `#081310`
- Surface: `#101F1A`
- Raised surface: `#172923`
- Text: `#FBF8F0`
- Border: `#426157`
- Gold accent: `#E0B95D`
- Warning: `#F0A061`
- Danger: `#FF8F82`

Palette alternatives remain visible in the gallery for historical comparison, but Higher contrast is the default and approved selection.

## Approved components

The interactive [`docs/ui/mi-harina-components-gallery.html`](ui/mi-harina-components-gallery.html) preserves the approved component review. It applies the approved foundations and lets reviewers switch between light and dark themes, desktop and mobile previews, and English and Spanish labels.

The following component groups are approved as the basis for interaction-state refinement:

- Primary, secondary, quiet, destructive, icon-only, and disabled actions
- Text, amount, category, date, and checkbox fields
- Count, confidence, reviewed, and category badges
- Duplicate, suspicious-expense, and over-budget flags
- Normal, approaching-limit, and over-budget progress bars
- Informative, warning, and expense-related alert cards
- Collapsed and expanded expense frames with persistent Edit, Split, and Delete actions
- A dedicated, unlabeled detail frame beneath every expense, revealed on demand and containing payment source, masked card information, notes, and other available expense details
- Review-queue card treatment
- Desktop header utilities and mobile bottom navigation in component context

The gallery uses the approved MiHarina bag isotype. Interaction behavior and final production implementation still require their own review.

## Approved interaction states

The interactive [`docs/ui/mi-harina-interaction-states.html`](ui/mi-harina-interaction-states.html) preserves the approved reference for hover, keyboard focus, pressed or selected, expanded, disabled, loading, validation, flagged, and destructive-confirmation states.

Approved behavior:

- Hover and pressed feedback remain subtle and do not shift surrounding layout.
- Keyboard focus is clearly visible in both themes.
- Loading and disabled states remain distinguishable.
- Validation messages identify the problem in text as well as color.
- Expense flags remain visible when an expense expands.
- Selection is distinct from warning or flagged states.
- Destructive actions require an explicit confirmation step and provide a safe Cancel path.

## Approved key-screen composition

The interactive [`docs/ui/mi-harina-key-screens.html`](ui/mi-harina-key-screens.html) applies the approved structure, foundations, components, and interaction states to five implementation-priority views:

1. Desktop Home
2. Mobile Home
3. Desktop Activity
4. Mobile Activity
5. Mobile Review

The reference includes light and dark themes, English and Spanish labels, persistent global utilities, the favorite-bank exchange-rate header, expandable expense details, persistent flags and expense actions, stable Home previews, unfiltered chronological Activity views with empty date groups, informative alerts, and a mobile-safe Review workflow. This five-screen composition is approved.

## Product context

MiHarina is a personal expense-management product. It is primarily intended for one user, with a demo user also available. A second real user is possible but unlikely in the near term.

The product is currently a web application. An Android application is expected eventually, and both the web and Android versions should remain active. Interface decisions should therefore establish patterns that can translate well between responsive web and Android without forcing both platforms to look identical.

Expenses normally arrive through an automated email workflow and are categorized automatically. Manual expense entry remains important but is expected to be used less frequently than expense review.

There is currently no income feature. The interface should not imply that income tracking exists.

## Existing product areas

- Home and recent expenses
- Review queue
- Expense search and history
- Manual expense entry
- Reports
  - Budget versus actual
  - Burn-down
  - Subcategories by month
- Categories and budgets
- Credit cards
- User and application settings
- Exchange-rate information
- Duplicate-expense flags

All existing pages are used even though the application has relatively few pages.

## Core experience principles

### Daily first

The Home page should primarily answer:

1. What expenses were made today?
2. Are my favorite categories over or under budget?

Daily activity should receive more emphasis than a general monthly financial summary.

### Clear and restrained

- Prefer fewer elements with a strong visual hierarchy.
- Keep the product user-directed rather than highly proactive.
- Alerts should be informative, visible, and non-intrusive.
- Avoid blocking dialogs or visually dominant warnings for ordinary reminders.

### Designed to grow

- New features should first be placed within an existing product area when that relationship is natural.
- A feature should become a primary navigation destination only when it creates a genuinely distinct, frequently used workflow.
- New reports belong within Reports.
- New expense flags and attention states belong within the expense review/alert model.
- Account, card, category, and preference management belong within Settings unless future usage demonstrates otherwise.
- Income should not enter the information architecture until an income feature and its recurring workflow exist.

## Locked identity

- Product name: **MiHarina**
- MiHarina logo
- Product surfaces must use one of the approved logo/isotype variants defined in the `UICard` reference.
- Generic wallet, currency, finance, or money-badge icons must not substitute for the MiHarina brand mark.

The current `UICard` artifact in the repository is a design reference. Its palette, typography, icon treatment, component examples, and sample layouts can be discussed; they are not locked solely because they appear in that artifact.

## Theme requirements

MiHarina supports both light and dark themes. Both are first-class design requirements.

Every proposed screen and component should be evaluated in both themes, including:

- Page and card surfaces
- Borders and elevation
- Text hierarchy and contrast
- Hover, focus, selected, disabled, and pressed states
- Charts and data visualizations
- Budget progress indicators
- Alert and flag colors
- Brand and category icons

Theme-specific colors must preserve the same semantic meaning. Color should not be the only way a warning, flag, or status is communicated.

## Currency requirements

The user can choose the currency used to display expenses, totals, budgets, and reports.

- The saved default currency remains configurable in Settings.
- A quick currency control must remain visible and accessible throughout the application.
- The quick control should clearly communicate CRC (`₡`) and USD (`$`).
- Changing display currency should update all relevant financial values consistently.

Currency and theme are global display controls, not navigation destinations.

## Information architecture

The following structure is the approved working baseline. Individual visual treatments and implementation details still require review:

```text
MiHarina
├── Home
│   ├── Today's expenses
│   ├── Favorite-category budget status
│   ├── Recent expenses
│   └── Exchange-rate information
├── Review
│   ├── Pending categorization
│   └── Expenses requiring attention
├── Search
│   ├── Expense history
│   ├── Filters and sorting
│   └── Expense details and actions
├── Reports
│   ├── Budget versus actual
│   ├── Burn-down
│   └── Subcategories by month
├── Add expense
├── Alerts
└── Settings
    ├── Basic preferences
    ├── Credit cards
    ├── Categories and budgets
    ├── Personal information
    └── Advanced configuration
```

### Destination and action hierarchy

Proposed primary destinations:

- Home
- Review
- Search
- Reports

Proposed secondary action:

- Add expense

Proposed global utilities:

- Currency
- Theme
- Alerts
- Settings

Review should have more visual and navigational weight than Add expense because automated ingestion makes reviewing expenses the more important recurring workflow.

## Navigation proposal

### Desktop web

- The MiHarina logo links to Home.
- The top navigation provides Review, Search, and Reports.
- Review displays a pending count when applicable.
- Add expense is a visible but secondary header action.
- The persistent utility group contains Currency, Theme, Alerts, and Settings.
- A mobile-style bottom navigation should not be duplicated on desktop.

Conceptual order:

```text
MiHarina | Review (count) | Search | Reports | Add expense | Currency | Theme | Alerts | Settings
```

### Mobile web and future Android

- A compact top bar contains the MiHarina identity and global utilities.
- The mobile top bar uses the compact MiHarina isotype and global utilities without an Add action.
- The bottom bar contains Home, Review, a restrained centered Add Expense action, Search, and Reports.
- Add Expense uses the same footprint and vertical alignment as the other bottom items, with a small soft-green plus marker and visible label rather than a raised floating-action treatment. Review retains greater workflow weight through its pending count and selected state.
- Review displays a pending count when applicable.
- Add expense remains easy to reach but should not receive more visual weight than Review.
- Currency and theme quick controls must remain visible at all times.
- Alerts must remain globally reachable.

On mobile, Add Expense opens as a focused form within the recognizable MiHarina application frame; it does not compete with Review in the bottom navigation.

## Home-page content hierarchy

The **Balanced overview** structural direction has been selected as the Home-page baseline. Today's expenses and favorite-category budget status share the first content tier, while recent expenses and informative reminders follow beneath them.

Recommended order:

1. Compact greeting or page identity
2. Today's expenses and today's total
3. Favorite categories for the current month
4. A compact preview of recent expenses from earlier days
5. Favorite-bank exchange-rate information within the Home greeting area

Favorite-category items should link to the relevant report detail.

Review status should normally be communicated with a count on the Review destination rather than a dominant Home-page alert.

### Home greeting and favorite-bank rates

- Home begins with a time-appropriate salutation and the user's name.
- A time-of-day-appropriate icon accompanies the salutation: sun for daytime, sunset for the evening transition, and moon for nighttime.
- The greeting area displays the current exchange rate from the user's favorite-bank settings.
- One favorite bank is shown by default to keep the header compact.
- When a second favorite bank is configured, a small expand control reveals it in place rather than navigating elsewhere.
- The expected number of selected favorite banks is normally one or two.
- Bank preference management remains in Settings; the Home header is a read-only quick reference.

### Expense list behavior on Home

- Home uses stable previews so growing expense history does not continually change the dashboard layout.
- Today's preview shows up to three expenses on desktop and up to two on mobile.
- Recent expenses use a similarly compact preview.
- A **View all expenses** link opens the contextual Activity page; it does not open Search.
- Every expense frame can expand and collapse to reveal a dedicated detail frame directly beneath that expense.
- The detail frame is hidden while collapsed and may include the bank, card network and last four digits, motive or note, and other available expense metadata.
- Every expense frame retains direct Edit, Split, and Delete actions.
- Flags remain visible in both collapsed and expanded states.
- Today's expenses do not repeat an Add action; manual entry remains available through the persistent navigation action.

### Contextual Activity page

- Activity is reached contextually from Home and is not added to primary desktop or mobile navigation.
- The page has no filters or tabs.
- It presents one continuous reverse-chronological expense history: Today first, followed by Yesterday and older calendar dates.
- Every date group remains visible even when it has no expenses, using a short empty-state message inside the group.
- Date groups with expenses show their daily total in the date header.
- Expense frames retain expandable detail, persistent flags, and always-visible Edit, Split, and Delete actions.
- Desktop and mobile follow the same information order and behavior.

## Alerts and flags

### Alerts center

Alerts should have a persistent home in the global utility area, represented by a bell and an unread count when necessary.

Approved behavior:

- Desktop: the bell opens a compact alerts panel with a route to view all alerts if needed.
- Mobile: the bell opens a mobile-appropriate alerts view.
- Alerts do not use blocking dialogs.
- Reading or dismissing an alert does not automatically resolve its underlying condition.

The interactive [`docs/ui/mi-harina-alerts-behavior.html`](ui/mi-harina-alerts-behavior.html) records the approved behavior:

- Desktop uses a compact bell panel containing the newest current alerts and a **View all alerts** route.
- Mobile opens a framed Alerts center rather than a small floating popover.
- The complete Alerts center keeps **Current** alerts first and an **Earlier** chronological section beneath them; it does not require filters.
- Opening an individual alert marks that alert as read and follows its contextual action, such as opening the card, report, or expense.
- **Mark all read** changes unread state only; it does not dismiss alerts or resolve conditions.
- Dismissing removes an item from Current and moves it temporarily to Earlier.
- Dismissing a duplicate or suspicious-expense alert never removes the persistent flag from the expense.
- Resolving the underlying condition moves the alert to Earlier automatically.
- Repeated checks update the existing alert for the same condition rather than creating daily duplicates.
- Dismissed and resolved alerts remain in Earlier for 30 days.

Potential alert types include:

- Credit-card payment date approaching
- Favorite category approaching or exceeding its budget
- Possible duplicate expense
- Suspicious expense in a future version

### Alert configuration

Alert behavior is controlled through **Settings → Advanced**. The approved controls are:

- Enable or disable credit-card payment reminders and choose how many days before payment the reminder appears.
- Enable or disable favorite-category budget alerts and choose the approaching-budget threshold.
- Enable or disable possible-duplicate notifications.
- Future suspicious-expense notifications may extend this group when that feature exists.

These controls affect notification generation only. Disabling or dismissing a notification never removes an existing flag from an expense. The approved responsive reference is [`docs/ui/mi-harina-alert-settings.html`](ui/mi-harina-alert-settings.html).

### Flagged expenses

A flag is persistent state attached to an expense. It is distinct from the informational alert generated by that state.

A flagged expense must be visibly marked wherever it appears, including:

- Home
- Search results
- Expense details
- Relevant lists or reports
- Review, when action is required

Reading or dismissing an alert must not clear the corresponding expense flag. The flag remains until its underlying state is resolved or explicitly cleared.

Suggested semantic treatments:

- Upcoming reminder: restrained gold or amber treatment
- Approaching budget threshold: amber warning
- Duplicate or suspicious expense: red attention treatment

Every treatment should combine color with an icon and a clear text label.

## Language requirements

- Existing English and Spanish labels and configuration must be preserved.
- UI layouts must accommodate both languages.
- Copy changes require human review and should be applied consistently to both language resources.

## Accessibility baseline

No additional accessibility standard has been requested beyond normal best practices. Designs should still provide:

- Readable contrast in both themes
- Keyboard-visible focus states on the web
- Adequate mobile touch targets
- Text or icon support for color-coded states
- Accessible labels for icon-only global controls

## Observations from the current live interface

The application was reviewed at `http://localhost:5173/` on desktop and a phone-sized viewport.

- Desktop currently shows both top and bottom navigation, creating competing navigation systems.
- Mobile retains desktop top-navigation links and experiences horizontal overflow.
- The mobile Review workflow is horizontally clipped.
- Add expense currently receives stronger navigation emphasis than Review.
- The existing Home content already contains the correct daily-expense and favorite-category concepts, though their hierarchy can be refined.

These observations inform the proposal but do not authorize implementation changes.

## Open decisions requiring human approval

- No remaining decision in the initial UI selection phase. Any implementation-driven change still requires human review.

## Approved iconography mappings

The locked visual sources remain [`docs/ui/UICard.png`](ui/UICard.png) and [`docs/ui/Iconografia.png`](ui/Iconografia.png). The custom category artwork in `Iconografia.png` must be used unchanged for the defined categories and must not be replaced with generic interface-library icons.

The interactive [`docs/ui/mi-harina-icon-mappings.html`](ui/mi-harina-icon-mappings.html) records the approved semantic interface mappings across Navigation, Utilities, Expenses, and Alerts and time.

Approved system rules:

- Interface actions use consistent rounded line icons that visually complement the approved category artwork without imitating or replacing it.
- Navigation uses House, List checks, Search, and Column chart for Home, Review, Search, and Reports.
- The contextual Activity destination uses History but does not enter primary navigation.
- Display currency uses the active currency glyph, such as ₡ or $, rather than a generic wallet or money icon.
- Expense actions use Chevron, Pencil, Split, and Trash for Expand, Edit, Split, and Delete.
- Possible duplicate uses Copy; the future suspicious-expense state uses Shield alert. Both retain a visible text label.
- Alert semantics use Credit card for payment reminders, Triangle alert for approaching a budget, Circle alert for exceeding a budget, and Circle check for resolved state.
- Salutation icons use Sun, Sunset, and Moon according to time of day.
- Color supports meaning but never replaces the icon and label; destructive and flagged states remain explicitly labeled.

## Current design step

Review and approve the implementation handoff in [`UI_IMPLEMENTATION_HANDOFF.md`](UI_IMPLEMENTATION_HANDOFF.md). After approval, production work may begin only when the first implementation phase is separately authorized.

The current application exposes four peer Settings sections in a top submenu:

1. **Basic:** personal information, saved currency, language, favorite categories, and favorite banks.
2. **Credit cards:** active-card list, deactivation, card limits, cutoff and payment dates, and Add credit card.
3. **Categories:** categories, subcategories, and Add category.
4. **Advanced:** exchange-rate fallback selection and credit-card reporting date behavior.

The interactive [`docs/ui/mi-harina-settings-navigation.html`](ui/mi-harina-settings-navigation.html) compares three responsive treatments while preserving those four sections and their current behaviors:

1. **Adaptive navigation:** a persistent left rail on desktop and a Settings index followed by a detail screen on mobile.
2. **Top submenu:** retains the current horizontal submenu, using compact icon treatment on mobile.
3. **Section picker:** replaces the visible submenu with a single labeled section selector.

All three preserve the persistent global Currency, Theme, Alerts, and Settings utilities, the approved MiHarina identity, light and dark themes, and English and Spanish labels.

The **Adaptive navigation** treatment is approved: Settings uses a persistent left rail on desktop and a Settings index followed by a detail screen on mobile. This remains the single Settings navigation pattern as the product grows. New technical preferences belong in **Advanced** unless a future human review explicitly creates another section.

The interactive [`docs/ui/mi-harina-settings-screens.html`](ui/mi-harina-settings-screens.html) now applies the approved navigation to all four Settings sections on desktop and mobile:

1. **Basic:** grouped form sections for personal information, saved display/language preferences, favorite categories, and favorite banks.
2. **Credit cards:** a management list with card context, direct Edit and Deactivate actions, and Add card.
3. **Categories:** a management list with direct category editing, Add subcategory, and Add category actions.
4. **Advanced:** grouped technical-preference forms, currently including exchange-rate fallback and credit-card reporting date behavior. Additional advanced preferences extend this page as form sections without changing Settings navigation.

The Settings content layouts are approved.

### Credit-card reporting date

- **Settings → Advanced** includes a Credit card reporting section.
- The setting determines whether a credit-card expense counts toward the month in which the expense happened or the month in which the card payment is due.
- The two existing choices are preserved through the application language resources: **The day it happened** and **The card's due date**, with their approved Spanish equivalents.
- This is a reporting and budgeting rule; it does not alter the expense's original transaction timestamp.
- The setting applies consistently anywhere expenses are grouped or calculated by reporting month, including favorite-category budgets and Reports.

The interactive [`docs/ui/mi-harina-search-screens.html`](ui/mi-harina-search-screens.html) records the approved Search treatment across desktop and mobile. It preserves every existing Search capability: merchant or note query, date range and quick range, category filter, date or amount sorting, direction, result count and total, unreviewed links to Review, persistent flags, inline details, and direct Edit, Split, and Delete actions. Desktop keeps filters directly below the heading; mobile collapses them behind an explicit Filters control while keeping summary and results visible.

### Approved expanded expense-detail pattern

- Expanded expense metadata uses a dedicated detail frame below the main expense row.
- Each available detail occupies its own full-width, icon-and-value row; the comment or note is therefore always its own row.
- Detail rows use spacing rather than internal separator lines, keeping the frame clean on both desktop and mobile.
- The pattern can grow without changing the expense-row layout: future metadata such as payment source, masked card, bank, import source, or notes is appended as another detail row.
- Credit-card expenses include a localized **Pays on [date]** row showing the calculated card-payment due date. This row is omitted when no applicable card due date exists.

### Approved Desktop Review queue

The interactive [`docs/ui/mi-harina-desktop-review.html`](ui/mi-harina-desktop-review.html) records the approved desktop treatment for Review. It preserves pending count, batch selection, Approve selected, Approve all, per-expense category selection, confidence, direct approval, and the learning choice. The learning choice uses the compact label **Always**; the redundant explanatory queue subtitle is omitted.

### Approved Categories access

Category creation, editing, archiving, subcategory management, and favorite selection are accessible only through Settings. Categories does not appear in primary navigation, Reports, Add Expense, or contextual report links.

The interactive [`docs/ui/mi-harina-categories-access.html`](ui/mi-harina-categories-access.html) compares three access models on desktop and mobile:

1. **Settings only:** all category creation, editing, archiving, and favorite selection remains reachable exclusively through Settings.
2. **Contextual links:** Settings remains the single owner of category management, while Add Expense and a category report provide links into the relevant Settings context.
3. **Reports section:** Categories becomes a secondary section inside Reports while also remaining in Settings.

All models preserve the locked custom category artwork. No model adds Categories to primary desktop or mobile navigation.

The **Settings only** model is approved. The other two models remain reference alternatives and are not part of the approved scope.

The interactive [`docs/ui/mi-harina-report-treatments.html`](ui/mi-harina-report-treatments.html) compares three responsive directions:

1. **Clear ranking:** monthly columns plus directly labeled horizontal category bars and a prominent favorite-category budget detail.
2. **Donut composition:** the UICard-inspired category donut, a compact monthly chart, and favorite-category budget bars.
3. **Period comparison:** paired current-versus-previous bars, period totals, and the largest category changes.

All three preserve the persistent currency selector, responsive mobile stacking, light and dark themes, English and Spanish labels, and semantic budget colors. The selected direction may still borrow a focused comparison treatment from another option if the hierarchy remains restrained.

The **Clear ranking** direction is approved as the report-treatment baseline. Monthly columns, directly labeled horizontal category bars, and semantic favorite-category budget detail establish the visual language for Reports on desktop and mobile.

### Report migration requirements

- Every report type already implemented in MiHarina must transfer to the redesigned interface; the redesign must not remove or silently consolidate existing reporting capabilities.
- Each existing report should adopt the approved Clear ranking hierarchy where applicable while preserving its current data, calculations, controls, and language labels.
- A complete inventory of existing report types and backend endpoints is required before implementation planning for Reports.
- **Period comparison** is pinned as a desirable future Reports section, but it is not part of the currently approved scope.
- Before Period comparison is scheduled, verify whether the backend already provides comparable current-versus-previous-period data. If it does not, define the required backend work separately.

### Completed Reports inventory and endpoint audit

The existing Reports experience has three separate report types. All must remain distinct in the redesigned Reports area:

1. **Budget versus actual** (`/reports/budget-vs-actual`): month and year selection; ranked category budget consumption; progressive See more; selected main category and subcategory detail; amount, budget, and percentage-used data in CRC and USD; Home can deep-link to a category through `?category=<id>`.
2. **Burndown** (`/reports/burndown` and `/reports/burndown-by-subcategory`): month and year selection; main-category selection; cumulative actual spend versus expected pace; subcategory cumulative-spend lines.
3. **Subcategories by month** (`/reports/category-month-matrix`): year selection; main-category selection; twelve-month subcategory trend lines.

All three report types use the selected display currency and existing English and Spanish labels. The current backend has no endpoint that returns matching current and prior period totals or category deltas; **Period comparison** therefore remains a separately scoped future backend and UI enhancement.

The interactive [`docs/ui/mi-harina-add-expense-gallery.html`](ui/mi-harina-add-expense-gallery.html) compares three initial presentation directions across desktop and mobile:

1. **Focused entry:** a compact desktop modal and framed mobile form, with optional information progressively disclosed.
2. **Context panel:** a desktop side panel and mobile sheet that preserve more of the originating Home context.
3. **Full page:** a dedicated form page on both platforms with all fields visible.

The **Focused entry** direction is approved. Desktop uses a focused modal. Mobile retains the same field hierarchy inside the recognizable MiHarina application frame without showing the Home greeting behind the form. The Payment method and Note section expands inline within the current form, and the redundant explanatory subtitle beneath Add Expense is omitted.

## Decision log

### 2026-08-28

- Established that the MiHarina name and logo are locked.
- Confirmed that other design decisions remain open to discussion and require human intervention before changes.
- Confirmed personal-use scope with a demo user.
- Confirmed web-first delivery with a future Android application; both platforms should remain active.
- Established daily expenses and favorite-category budget status as the Home-page priorities.
- Established Review as more important than manual Add expense.
- Established a restrained, user-directed product character.
- Proposed a compact top menu and mobile bottom navigation.
- Established support for existing English and Spanish labels.

### 2026-08-29

- Established light and dark themes as first-class design requirements.
- Established persistent, globally visible Currency and Theme quick controls.
- Kept the saved default currency in Settings while preserving the global quick selector.
- Added a non-intrusive Alerts center to the proposed global utility area.
- Established that flagged expenses must remain marked wherever they appear.
- Distinguished dismissing an alert from resolving an expense flag.
- Selected the Balanced overview as the Home-page structural direction.
- Initially established in-place progressive disclosure for older Home expenses; this was later superseded by the contextual Activity-page decision below.
- Established expandable expense frames with additional payment and expense details.
- Preserved direct Edit, Split, and Delete actions on every expense frame.
- Removed the duplicate Add action from Today's expenses; the persistent navigation action is the single entry point.
- Replaced the temporary generic finance icon in the wireframe with the approved MiHarina bag isotype and prohibited substitute brand icons.
- Approved the Higher contrast palette for light and dark themes.
- Approved Inter typography with regular and medium weights.
- Approved Comfortable spacing with a 4/8/12/16/24 rhythm.
- Approved Compact corners for controls, cards, and panels.
- Removed the redundant "Expense details" label from expanded expense frames.
- Added the Home salutation and favorite-bank exchange-rate pattern: one bank is shown by default and an inline control reveals a second configured favorite bank.
- Approved the component set shown in the Components gallery.
- Approved the Interaction States gallery, including hover, keyboard focus, pressed or selected, expanded, disabled, loading, validation, persistent flags, completion feedback, and destructive confirmation.
- Corrected the key-screen reference so mobile expense actions remain in the always-visible expense frame, mobile bottom-navigation selection does not become a large pill, and favorite-category progress retains its green-to-warning-to-danger semantics.
- Replaced expanding Home history with stable Today and Recent previews that link to a contextual Activity page.
- Defined Activity as an unfiltered reverse-chronological page with Today followed by older date groups, including visible empty date groups on both desktop and mobile.

### 2026-08-30

- Approved the stable, capped Today and Recent expense previews on Home for desktop and mobile.
- Approved the contextual Activity page without filters or tabs.
- Approved the Activity ordering of Today followed by older date groups, including date groups with no expenses.
- Approved the complete five-screen composition: Desktop Home, Mobile Home, Desktop Activity, Mobile Activity, and Mobile Review.
- Moved the active design review to Desktop Add Expense and Mobile Add Expense.
- Selected Focused entry for Add Expense and approved its desktop modal presentation.
- Refined Focused entry on mobile to retain the MiHarina application frame without showing the Home greeting behind the form.
- Approved Focused entry for Desktop and Mobile Add Expense.
- Confirmed that Payment method and Note expand inline within the current form and removed the redundant Add Expense subtitle.
- Added the Alerts behavior proposal covering the desktop quick panel, mobile Alerts center, lifecycle rules, contextual actions, settings, de-duplication, and proposed retention.
- Approved the complete Alerts behavior proposal, including desktop and mobile presentation, lifecycle rules, contextual actions, de-duplication, settings structure, and 30-day Earlier retention.
- Confirmed that the Home salutation uses a time-appropriate sun, sunset, or moon icon.
- Added the remaining icon-mapping proposal while preserving the locked UICard identity and custom category iconography.
- Approved the semantic icon mappings for navigation, utilities, expense actions and flags, alerts, and time-of-day salutations.
- Added three report chart-treatment directions for desktop and mobile review: Clear ranking, Donut composition, and Period comparison.
- Approved Clear ranking as the report-treatment baseline for desktop and mobile.
- Required every already implemented report type to transfer into the redesigned Reports experience.
- Pinned Period comparison as a future enhancement pending verification of backend support.
- Added three Categories access models for desktop and mobile review: Settings only, Settings-owned contextual links, and a Reports-level secondary section.
- Approved Settings only as the Categories access model; category management and favorite selection remain exclusively within Settings.
- Audited the current Settings area and confirmed four peer sections: Basic, Credit cards, Categories, and Advanced.
- Added three Settings submenu navigation treatments for responsive review: Adaptive navigation, the existing Top submenu, and a compact Section picker.
- Approved Adaptive navigation for Settings: desktop left rail and mobile Settings index followed by detail.
- Established the growth rule that new technical preferences extend Advanced rather than creating a new Settings navigation item.
- Added the Settings content-layout gallery for Basic, Credit cards, Categories, and Advanced on desktop and mobile.
- Approved the Settings content layouts for Basic, Credit cards, Categories, and Advanced.
- Added the responsive Search-screen treatment for review, preserving all existing filters, sorting, results, flags, detail, Review links, and expense actions.
- Approved the responsive Search treatment: full desktop filters, one explicit mobile Filters control, persistent results and actions, and unreviewed routes to Review.
- Approved the expandable expense-detail pattern: stacked full-width icon-and-value rows, no internal dividers, and a dedicated comment row.
- Moved the active review to the Desktop Review queue treatment.
- Approved the Desktop Review queue, including batch actions, category selection, confidence, direct approval, and the compact Always learning control.
- Moved the active work to Reports migration inventory and backend endpoint audit.

### 2026-08-31

- Completed the Reports migration and backend endpoint inventory for Budget versus actual, Burndown, and Subcategories by month.
- Confirmed that Period comparison has no current supporting endpoint and remains future work.
- Approved Alert settings within Advanced: credit-card reminders and lead time, favorite-category warnings and threshold, and possible-duplicate notifications.
- Confirmed that Alert settings control notifications only and never clear persistent expense flags.
- Corrected the Alert settings reference header to use the locked MiHarina bag icon, the active currency glyph, and the approved Theme, Alerts, and Settings line icons.
- Completed the initial UI selection and interaction-specification phase; implementation handoff preparation is next.
- Prepared the implementation handoff, including route mapping, reusable component boundaries, backend dependencies, phased acceptance checks, and a recommended first implementation slice. No production UI change has been authorized yet.
- Corrected the Balanced overview so Add Expense remains reachable on mobile without crowding the top bar or appearing inside Today.
- Adopted the UICard-inspired mobile structure: compact isotype and utilities above, with a restrained centered Add action between Review and Search below. Review retains the pending count and stronger workflow priority.
- Normalized the centered Add action to the same footprint and baseline as the other mobile bottom items; removed the raised offset and oversized circular treatment.

### 2026-09-01

- Added the existing Credit card reporting preference to the redesigned Advanced Settings screen.
- Confirmed that credit-card expenses may count either in the transaction month or the card-payment due month, without changing the original transaction date.
- Added the calculated credit-card payment date to expanded expense details as its own localized, full-width metadata row.
- Recorded the revised `GET /expenses` contract: expenses are returned in date groups with CRC/USD daily totals and an expense-level `payment_date`.
- Confirmed that this grouped endpoint supplies Home and Activity directly; the frontend adds missing empty dates within the requested window, and Search flattens the groups for its result presentation.
- Removed the need for a separate Activity API and expense-level Activity pagination; older history can be requested in complete date windows.
