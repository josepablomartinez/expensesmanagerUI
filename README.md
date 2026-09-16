# MiHarina (Expenses Manager UI)

React + TypeScript web app for tracking, reviewing, searching, and reporting on
personal expenses captured by the [Expenses Manager](https://github.com/josepablomartinez/expensesmanager)
automation. It talks to the [`expense-api`](https://github.com/josepablomartinez/expensesmanager/tree/main/API)
Go backend. The responsive MiHarina interface supports English and Spanish,
light and dark themes, and CRC/USD display. Expense events refresh relevant
views through Server-Sent Events.

## Tech stack

- **React 18** + **TypeScript**
- **Vite 6** — dev server / build tooling
- **React Router v6** — client-side routing (`src/App.tsx`)
- **Tailwind CSS** — styling, with `class-variance-authority`, `clsx`, and
  `tailwind-merge` for composable component variants (`src/components/ui/`)
- **ECharts** (`echarts` + `echarts-for-react`) — report charts
- **lucide-react**, local category artwork, and local bank/brand assets — icons
- **Inter** (`@fontsource/inter`) — interface font
- Plain `fetch` for API calls (`src/lib/api.ts`), no data-fetching library
- Served in production by **nginx** (see Deployment below)

## Project structure

```
src/
├── App.tsx                  Route table
├── main.tsx                 Entry point and context providers
├── lib/
│   ├── api.ts               Typed expense-api requests and JWT header injection
│   ├── auth.tsx              Auth context and optional ProtectedRoute
│   ├── events.ts             Shared /events SSE connection
│   ├── alerts.tsx            Alert state and unread count
│   ├── language.tsx          English/Spanish selection and translations
│   ├── currency.tsx          Shared CRC/USD display selection
│   ├── theme.tsx             Light/dark theme
│   └── i18n/                 English and Spanish dictionaries
├── components/
│   ├── layout/AppShell.tsx   Responsive navigation and utilities
│   ├── expenses/            Shared expense rows, details, flags, and actions
│   ├── dashboard/           Home widgets
│   ├── alerts/              Alert list and desktop panel
│   ├── reports/             Shared report controls
│   ├── charts/EChart.tsx     ECharts wrapper
│   └── ui/                  Reusable controls
└── pages/
    ├── Home.tsx             Dashboard and recent expense previews
    ├── Activity.tsx         Chronological expense activity
    ├── Search.tsx           Filterable expense results
    ├── AddExpense.tsx       Manual expense entry
    ├── Review.tsx           Review and bulk approval queue
    ├── Alerts.tsx           Alert center
    ├── Login.tsx            Future authentication screen
    ├── settings/            Basic, credit cards, categories, advanced
    └── reports/             Budget, burndown, subcategories by month
```

## Routes

| Path | Page | Notes |
|------|------|-------|
| `/login` | Login | Auth route exists but is not enforced; see Authentication below |
| `/` | Home | Greeting, expense previews, favorite category budgets, exchange rates |
| `/activity` | Activity | Chronological expense list from `GET /expenses`, with older dates loaded on demand |
| `/search` | Search | Filterable expense list from `GET /expenses` |
| `/add` | Add Expense | Manual Cash or SINPE entry via `POST /expenses` |
| `/review` | Review | Categorization and approval queue, including bulk review |
| `/alerts` | Alerts | Alert center; desktop also has a compact bell panel |
| `/settings` | Settings | Basic settings on desktop; section index on mobile |
| `/settings/basic` | Basic | Profile, language, currency, and favorites |
| `/settings/credit-cards` | Credit cards | Manage saved credit cards |
| `/settings/categories` | Categories | Manage categories, subcategories, and budgets |
| `/settings/advanced` | Advanced | Exchange-rate, credit-card reporting, and alert preferences |
| `/reports` | Reports | Redirects to Budget versus actual |
| `/reports/budget-vs-actual` | Budget versus actual | Category budget ranking and details |
| `/reports/burndown` | Burndown | Actual versus expected spending pace |
| `/reports/subcategories-by-month` | Subcategories by month | Monthly subcategory trends |

## Interface

The desktop header links to Review, Search, and Reports, with Add Expense and
currency, theme, alerts, and Settings controls alongside. Mobile uses a bottom
bar for Home, Review, Add, Search, and Reports. Activity opens from Home;
Categories is under Settings. The desktop alert bell opens a panel, while the
mobile bell opens `/alerts`.

Home, Activity, and Search share expense rows, details, flags, and edit/split/
delete actions. The API returns expenses grouped by day; Activity starts with
two weeks and can load older two-week windows. Search filters and sorts the
returned expenses. The interface uses
English or Spanish labels, light or dark styling, and a shared CRC/USD display
selection. Language and display currency are saved through Settings; theme is
stored in the browser.

## Live updates

`src/lib/events.ts` opens an `EventSource` against `expense-api`'s
`GET /events` SSE stream. The shared connection notifies subscribers when an
expense is created or deleted. Expense views, the review count, and alert
state use these events to refresh without polling.

## Authentication

`src/lib/auth.tsx` implements a full JWT flow — `AuthProvider`, token
storage in `localStorage` (`expenses_jwt`), a `Bearer` header injected into
every `api.ts` request, and a `ProtectedRoute` wrapper — but it's currently
**unused**: the Go API has no `/auth/login` endpoint yet, so `App.tsx`
leaves every route open (see the comment at the top of that file). Once
`expense-api` gains an auth endpoint, wrap the routed `<AppShell />`
element in `<ProtectedRoute>` to require a token.

## Configuration

| Var | Example | Notes |
|-----|---------|-------|
| `VITE_API_URL` | `http://localhost:8081` | Base URL of `expense-api`. **Baked into the JS bundle at build time** (Vite inlines `import.meta.env.*` values), so it must be an origin reachable from the *browser*, not an internal Docker service name. |

```bash
cp .env.example .env.local   # edit VITE_API_URL if the API isn't on localhost:8081
```

## Running locally

```bash
npm install
npm run dev
```

Serves on `http://localhost:5173` (see `vite.config.ts`) with hot reload.
Requires `expense-api` running and reachable at `VITE_API_URL` (set to
`http://localhost:8081` in `.env.example`) — see the
[API README](https://github.com/josepablomartinez/expensesmanager/tree/main/API)
for running it, or bring up the whole stack via the
[parent repo's docker-compose.yaml](https://github.com/josepablomartinez/expensesmanager/blob/main/docker-compose.yaml).

```bash
npm run build     # tsc -b && vite build -> dist/
npm run preview   # serve the production build locally
```

## Deployment

`Dockerfile` is a two-stage build: `node:20-alpine` builds the static
bundle with `VITE_API_URL` passed as a build arg (baked into the JS, since
this is a client-rendered app), then `nginx:1.27-alpine` serves `dist/`
using `nginx.conf`, which just rewrites all paths to `index.html` for
client-side routing (`try_files $uri $uri/ /index.html`).

```bash
docker compose up -d --build
```

`docker-compose.yaml` here builds the `web` service with
`VITE_API_URL: http://localhost:8081` as a build arg and publishes it on
`5173:80`. **Because the API URL is compiled into the bundle at build
time**, changing it means rebuilding the image — there's no runtime env
var for this. Update the `args.VITE_API_URL` value (or override it with
`--build-arg`) before building for any environment other than local
Docker, and rebuild whenever the API's public URL changes.

## Known gaps

- No `/auth/login` on the backend yet, so the JWT login flow in
  `lib/auth.tsx` is wired but unreachable — see Authentication above.
- No test suite currently configured.
