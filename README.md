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
│   ├── api.ts               Typed expense-api requests, credentials: "include"
│   ├── auth.tsx              Auth context and ProtectedRoute (session cookie)
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
| `/login` | Login | Required to reach any other route; see Authentication below |
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

`src/lib/auth.tsx` implements session-cookie auth against the Go API's
`/auth/*` endpoints — no client-readable token. `AuthProvider` resolves
`user` via `GET /auth/me` on mount (the only way to know "am I logged in"
now that the session lives in an `HttpOnly` cookie, not `localStorage`),
and `ProtectedRoute` wraps the routed `<AppShell />` in `App.tsx`, holding
off any redirect until that initial check resolves (avoids a flash-redirect
to `/login`).

Every `api.ts` request is sent with `credentials: "include"` so the browser
attaches the session cookie automatically; there's no `Authorization`
header. Because the frontend and API are on different subdomains in
production (`app.miharina.co.cr` vs `api.miharina.co.cr`), this is a
credentialed **cross-origin** request — the API's CORS config needs
`Access-Control-Allow-Credentials: true` and an explicit, non-wildcard
`Access-Control-Allow-Origin` for the cookie to actually be sent/accepted
(see `expense-api`'s `CORS_ALLOWED_ORIGINS`). See the backend repo's
`docs/session-auth-spec.md` for the full design.

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
[parent repo's docker-compose.yml](https://github.com/josepablomartinez/expensesmanager/blob/main/docker-compose.yml).

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

Split into base + override + prod, same pattern as the backend repo:

- **`docker-compose.yml`** — shared `web` service definition (build context,
  restart policy). No ports, no environment-specific values.
- **`docker-compose.override.yml`** — local dev only, auto-loaded by plain
  `docker compose up`. Builds with `VITE_API_URL: http://localhost:8081` and
  publishes the container on host port `5173:80`.
- **`docker-compose.prod.yml`** — Traefik labels, prod `VITE_API_URL`,
  external network join. No `ports:` — only Traefik reaches this container,
  so the dev-only `5173:80` mapping never reaches the production server.

**Because the API URL is compiled into the bundle at build time**, changing
it means rebuilding the image — there's no runtime env var for this. Update
the relevant file's `args.VITE_API_URL` value (or override it with
`--build-arg`) before building for any environment, and rebuild whenever
the API's public URL changes.

### Production

`docker-compose.prod.yml` builds against `https://api.miharina.co.cr` and
adds Traefik labels for `app.miharina.co.cr`, following the same pattern as
the backend repo's `expense-api`/`n8n` services (Traefik does TLS
termination + routing only; no `ports:` published). It joins the
backend stack's `web` Docker network as an **external** network
(`miharina_web`, from that stack's `docker-compose.prod.yml` setting
`name: miharina`) so Traefik — which runs as part of the backend stack —
can route to this container. Deploy on the same host, after the backend
stack is already up:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

Requires:
- The `app.miharina.co.cr` DNS record pointed at the host (see the backend
  repo's `docs/miharina-deployment-guide.md`)
- `expense-api`'s `CORS_ALLOWED_ORIGINS` (prod `.env`) including
  `https://app.miharina.co.cr` — see Authentication above

## Known gaps

- Not yet deployed to production — `docker-compose.prod.yml` exists but has
  not been run on the actual host yet; the cross-origin credentialed CORS
  setup has only been exercised against `localhost` ports so far, not the
  real `app.miharina.co.cr` / `api.miharina.co.cr` subdomains.
- No test suite currently configured.
