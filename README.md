# MiHarina (Expenses Manager UI)

React + TypeScript web app for tracking, reviewing, searching, and reporting on
personal expenses captured by the [Expenses Manager](https://github.com/josepablomartinez/expensesmanager)
automation. It talks to the [`expense-api`](https://github.com/josepablomartinez/expensesmanager/tree/main/API)
Go backend. The responsive interface supports English and Spanish, light and
dark themes, and CRC/USD display, and refreshes live through Server-Sent
Events.

## Tech stack

- **React 18** + **TypeScript**, built with **Vite 6**
- **React Router v6** for client-side routing (`src/App.tsx`)
- **Tailwind CSS**, with `class-variance-authority`, `clsx` and `tailwind-merge`
  for component variants (`src/components/ui/`)
- **ECharts** (`echarts` + `echarts-for-react`) for report charts
- **lucide-react**, `simple-icons`, and local category/bank artwork for icons
- **Inter** (`@fontsource/inter`) as the interface font
- Plain `fetch` for API calls (`src/lib/api.ts`), no data-fetching library
- **Vitest** for unit tests
- Served in production by **nginx** (see Deployment)

## Project structure

```
src/
├── App.tsx                  Route table
├── main.tsx                 Entry point and context providers
├── lib/
│   ├── api.ts               Typed expense-api client (credentials: "include")
│   ├── auth.tsx             Auth context and ProtectedRoute (session cookie)
│   ├── events.ts            Shared /events SSE connection
│   ├── alerts.tsx           Alert state and unread count
│   ├── language.tsx         English/Spanish selection
│   ├── currency.tsx         Shared CRC/USD display selection
│   ├── theme.tsx            Light/dark theme
│   ├── recurrent.ts         Recurrent-expense helpers
│   ├── reviewApprove.ts     Review-queue approval logic
│   └── i18n/                English and Spanish dictionaries
├── components/
│   ├── layout/              AppShell: responsive navigation and utilities
│   ├── expenses/            Shared expense rows, details, flags, and actions
│   ├── dashboard/           Home widgets
│   ├── alerts/              Alert list and desktop panel
│   ├── recurrent/           Recurrent-payment cards, form, and link dialog
│   ├── reports/             Report controls and charts
│   ├── settings/            Settings sections (cards)
│   ├── charts/EChart.tsx    ECharts wrapper
│   └── ui/                  Reusable controls
└── pages/
    ├── Home, Activity, Search, AddExpense, Review, Alerts, Login
    ├── settings/            Basic, Credit cards, Categories, Recurring, Advanced
    └── reports/             Budget vs actual, Payment window, Burndown,
                             Subcategories by month, Charts
```

## Routes

Every route except `/login` requires a session.

| Path | Page | Notes |
|------|------|-------|
| `/login` | Login | Session-cookie sign-in; see Authentication |
| `/` | Home | Greeting, expense previews, favorite category budgets, exchange rates |
| `/activity` | Activity | Chronological expenses, older two-week windows loaded on demand |
| `/search` | Search | Filterable, sortable expenses, with free-text search on merchant and note |
| `/add` | Add Expense | Manual Cash or SINPE entry |
| `/review` | Review | Categorization and approval queue (single and bulk), plus due recurrent payments |
| `/alerts` | Alerts | Alert center; desktop also has a compact bell panel |
| `/settings` | Settings | Section index on mobile; Basic on desktop |
| `/settings/basic` | Basic | Profile, language, currency, favorites |
| `/settings/credit-cards` | Cards | Manage saved credit and debit cards |
| `/settings/categories` | Categories | Categories, subcategories, budgets (CRC or USD), recurring marker |
| `/settings/recurring` | Recurring | Manage recurrent monthly payments |
| `/settings/advanced` | Advanced | Exchange-rate source, credit-card date basis, alert preferences |
| `/reports` | Reports | Redirects to Budget versus actual |
| `/reports/budget-vs-actual` | Budget versus actual | Spend against category budgets |
| `/reports/payment-window` | Payment window | Spend by payment month, through next month |
| `/reports/burndown` | Burndown | Actual versus expected spending pace |
| `/reports/subcategories-by-month` | Subcategories by month | Monthly subcategory trends |
| `/reports/charts` | Charts | Exchange-rate history and credit-card cycle spend |

## Interface

The desktop header links to Review, Search and Reports, with Add Expense and
currency, theme, alerts and Settings controls alongside. Mobile uses a bottom
bar for Home, Review, Add, Search and Reports. Activity opens from Home.

Home, Activity and Search share expense rows, details, flags and
edit/split/delete actions. Foreign-currency expenses show the original amount
and conversion note. Language and display currency are saved through Settings;
theme is stored in the browser.

## Live updates

`src/lib/events.ts` opens one `EventSource` against `expense-api`'s
`GET /events` stream. When an expense is created or deleted, subscribed views,
the review count and alert state refresh without polling.

## Authentication

`src/lib/auth.tsx` uses session-cookie auth against the API's `/auth/*`
endpoints — no client-readable token. `AuthProvider` resolves the user via
`GET /auth/me` on mount, and `ProtectedRoute` waits for that check before
redirecting to `/login`, avoiding a flash-redirect.

Every request in `api.ts` is sent with `credentials: "include"`. Because the
UI and API are on different subdomains in production, this is a credentialed
cross-origin request: the API's `CORS_ALLOWED_ORIGINS` must list the UI's
exact origin (no wildcard). See the backend repo's
[`docs/session-auth-spec.md`](https://github.com/josepablomartinez/expensesmanager/blob/main/docs/session-auth-spec.md).

## Configuration

| Var | Example | Notes |
|-----|---------|-------|
| `VITE_API_URL` | `http://localhost:8081` | Base URL of `expense-api`. **Baked into the bundle at build time**, so it must be reachable from the *browser*, not an internal Docker service name. |

```bash
cp .env.example .env.local   # adjust VITE_API_URL if your API is elsewhere
```

## Running locally

Requires `expense-api` reachable at `VITE_API_URL` — see the
[backend README](https://github.com/josepablomartinez/expensesmanager#running-locally).

```bash
npm install
npm run dev       # http://localhost:5173, hot reload
```

```bash
npm run build     # tsc -b && vite build -> dist/
npm run preview   # serve the production build locally
npm test          # vitest run
```

## Deployment

The `Dockerfile` builds the static bundle in `node:20-alpine` (with
`VITE_API_URL` as a build arg) and serves `dist/` from `nginx:1.27-alpine`,
using `nginx.conf` to rewrite all paths to `index.html` for client-side routing.

Compose files follow the same base + override + prod split as the backend:

- `docker-compose.yml` — shared `web` service (build context, restart policy).
- `docker-compose.override.yml` — local dev, auto-loaded; builds against
  `http://localhost:8081` and publishes `5173:80`.
- `docker-compose.prod.yml` — production; builds against the public API URL,
  adds Traefik labels, and joins the backend stack's external Docker network.
  Publishes no ports.

```bash
docker compose up -d --build                                                   # local
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build  # production
```

Because the API URL is compiled in, **changing it means rebuilding the
image**. In production, deploy after the backend stack is up (its Traefik and
network must exist); `deploy.sh` in the backend repo does both. The API's
`CORS_ALLOWED_ORIGINS` must include the UI's production origin.

## Docs

`docs/` holds the UI design context, implementation handoff, and the
reference mockups and baseline screenshots they cite. They record design
decisions rather than current behavior.
