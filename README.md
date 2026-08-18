# Expenses Manager UI

React + TypeScript web app for reviewing, searching, and reporting on
personal expenses captured by the [Expenses Manager](https://github.com/josepablomartinez/expensesmanager)
automation. Talks to the [`expense-api`](https://github.com/josepablomartinez/expensesmanager/tree/main/API)
Go backend and updates live as new expenses arrive via Server-Sent Events.

## Tech stack

- **React 18** + **TypeScript**
- **Vite 6** — dev server / build tooling
- **React Router v6** — client-side routing (`src/App.tsx`)
- **Tailwind CSS** — styling, with `class-variance-authority`, `clsx`, and
  `tailwind-merge` for composable component variants (`src/components/ui/`)
- **ECharts** (`echarts` + `echarts-for-react`) — report charts (budget vs.
  actual, burndown)
- **lucide-react** — icon set
- Plain `fetch` for API calls (`src/lib/api.ts`), no data-fetching library
- Served in production by **nginx** (see Deployment below)

## Project structure

```
src/
├── App.tsx               Route table
├── main.tsx               Entry point
├── lib/
│   ├── api.ts              Typed fetch wrapper for expense-api + JWT header injection
│   ├── auth.tsx             AuthProvider / useAuth / ProtectedRoute (JWT in localStorage)
│   ├── events.ts            SSE client for expense-api's /events stream
│   ├── categoryGrouping.ts  Groups categories/subcategories for display
│   ├── categoryIcons.tsx    Icon mapping per category
│   └── format.ts            Currency/date formatting helpers
├── components/
│   ├── layout/AppShell.tsx  Page chrome (nav, outlet) shared by all routes
│   ├── charts/EChart.tsx    ECharts wrapper used by the report pages
│   ├── SplitExpenseDialog.tsx
│   ├── InfoModal.tsx
│   └── ui/                  Low-level primitives (button, card, input, select, badge)
└── pages/
    ├── Login.tsx
    ├── Home.tsx
    ├── Search.tsx
    ├── AddExpense.tsx
    ├── Review.tsx            Approve/categorize low-confidence expenses (bulk approve, split)
    ├── Categories.tsx
    └── reports/
        ├── ReportsLayout.tsx
        ├── BudgetVsActual.tsx
        └── Burndown.tsx
```

## Routes

| Path | Page | Notes |
|------|------|-------|
| `/login` | `Login` | Not currently enforced — see Authentication below |
| `/` | `Home` | Dashboard |
| `/search` | `Search` | Filterable expense list (`GET /expenses`) |
| `/add` | `AddExpense` | Manual entry (`POST /expenses`) |
| `/review` | `Review` | Low-confidence queue, bulk approve, split (`GET /expenses/review`, `POST /expenses/bulk-approve`, `POST /expenses/{id}/split`) |
| `/categories` | `Categories` | `GET /categories` |
| `/reports/budget-vs-actual` | `BudgetVsActual` | `GET /reports/budget-vs-actual` |
| `/reports/burndown` | `Burndown` | `GET /reports/burndown` |

## Live updates

`src/lib/events.ts` opens an `EventSource` against `expense-api`'s
`GET /events` SSE stream, which fires whenever n8n (or a manual entry)
inserts or updates an expense in Postgres. Pages that show expense lists
subscribe to this to refresh without polling.

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
| `VITE_API_URL` | `http://localhost:8080` | Base URL of `expense-api`. **Baked into the JS bundle at build time** (Vite inlines `import.meta.env.*` values), so it must be an origin reachable from the *browser*, not an internal Docker service name. |

```bash
cp .env.example .env.local   # edit VITE_API_URL if the API isn't on localhost:8080
```

## Running locally

```bash
npm install
npm run dev
```

Serves on `http://localhost:5173` (see `vite.config.ts`) with hot reload.
Requires `expense-api` running and reachable at `VITE_API_URL` (default
`http://localhost:8080`) — see the
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
`VITE_API_URL: http://localhost:8080` as a build arg and publishes it on
`5173:80`. **Because the API URL is compiled into the bundle at build
time**, changing it means rebuilding the image — there's no runtime env
var for this. Update the `args.VITE_API_URL` value (or override it with
`--build-arg`) before building for any environment other than local
Docker, and rebuild whenever the API's public URL changes.

## Known gaps

- No `/auth/login` on the backend yet, so the JWT login flow in
  `lib/auth.tsx` is wired but unreachable — see Authentication above.
- No test suite currently configured.
