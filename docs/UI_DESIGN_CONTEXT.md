# MiHarina UI Design Context

Last updated: 2026-08-29  
Status: Balanced overview, visual foundations, component set, and interaction states approved; key-screen refinement under review

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
- Recent expenses remaining on Home
- In-place See more/See less behavior for older date groups
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

## Key-screen refinement in progress

The interactive [`docs/ui/mi-harina-key-screens.html`](ui/mi-harina-key-screens.html) applies the approved structure, foundations, components, and interaction states to the three implementation-priority views:

1. Desktop Home
2. Mobile Home
3. Mobile Review

The reference includes light and dark themes, English and Spanish labels, persistent global utilities, the favorite-bank exchange-rate header, expandable expense details, persistent flags and expense actions, in-place older activity, informative alerts, and a mobile-safe Review workflow. This screen-level composition is **not yet approved**.

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
- The bottom navigation contains Home, Review, Search, and Reports.
- Review displays a pending count when applicable.
- Add expense remains easy to reach but should not receive more visual weight than Review.
- Currency and theme quick controls must remain visible at all times.
- Alerts must remain globally reachable.

The exact mobile placement and treatment of Add expense remains an open design decision.

## Home-page content hierarchy

The **Balanced overview** structural direction has been selected as the Home-page baseline. Today's expenses and favorite-category budget status share the first content tier, while recent expenses and informative reminders follow beneath them.

Recommended order:

1. Compact greeting or page identity
2. Today's expenses and today's total
3. Favorite categories for the current month
4. Recent expenses from earlier days
5. Favorite-bank exchange-rate information within the Home greeting area

Favorite-category items should link to the relevant report detail.

Review status should normally be communicated with a count on the Review destination rather than a dominant Home-page alert.

### Home greeting and favorite-bank rates

- Home begins with a time-appropriate salutation and the user's name.
- The greeting area displays the current exchange rate from the user's favorite-bank settings.
- One favorite bank is shown by default to keep the header compact.
- When a second favorite bank is configured, a small expand control reveals it in place rather than navigating elsewhere.
- The expected number of selected favorite banks is normally one or two.
- Bank preference management remains in Settings; the Home header is a read-only quick reference.

### Expense list behavior on Home

- Recent expenses older than today remain on the Home page.
- A **See more** control progressively reveals additional older date groups in place.
- See more must not navigate to Search.
- Every expense frame can expand and collapse to reveal a dedicated detail frame directly beneath that expense.
- The detail frame is hidden while collapsed and may include the bank, card network and last four digits, motive or note, and other available expense metadata.
- Every expense frame retains direct Edit, Split, and Delete actions.
- Flags remain visible in both collapsed and expanded states.
- Today's expenses do not repeat an Add action; manual entry remains available through the persistent navigation action.

## Alerts and flags

### Alerts center

Alerts should have a persistent home in the global utility area, represented by a bell and an unread count when necessary.

Proposed behavior:

- Desktop: the bell opens a compact alerts panel with a route to view all alerts if needed.
- Mobile: the bell opens a mobile-appropriate alerts view.
- Alerts do not use blocking dialogs.
- Reading or dismissing an alert does not automatically resolve its underlying condition.

Potential alert types include:

- Credit-card payment date approaching
- Favorite category approaching or exceeding its budget
- Possible duplicate expense
- Suspicious expense in a future version

### Alert configuration

Alert behavior may be controlled through Settings. Potential controls include:

- Enable or disable credit-card payment reminders
- Configure how many days before payment an alert appears
- Configure budget-warning thresholds
- Enable or disable individual alert categories

Exact settings require human review before implementation.

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

- Exact icon style and mappings beyond the existing base iconography
- Final screen-level composition of Desktop Home, Mobile Home, and Mobile Review
- Mobile header placement and visual weight of Add expense
- Alerts panel versus dedicated alerts page behavior
- Alert dismissal, resolution, and retention rules
- Exact chart treatments in both themes
- Whether Categories remains within Settings or needs another access path

## Current design step

Review the refined Balanced overview direction across:

1. Desktop Home
2. Mobile Home
3. Mobile Review

Each view shows both light and dark themes and includes the persistent Currency, Theme, Alerts, and Settings utilities. Home demonstrates expandable expenses, direct expense actions, and in-place progressive disclosure of older expenses. Human approval is required before implementation planning begins.

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
- Established that older recent expenses are progressively revealed on Home through See more rather than opening Search.
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
