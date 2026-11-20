# Leave Tracker

A small internal, **read-only** web view of the team's leave requests (~55 employees).
Frontend only, with no backend and no login. The real data lives in a Google Sheet that employees fill in;
for now the app runs on realistic mock data.

**Stack:** Vite · React · TypeScript · Tailwind CSS v4 · shadcn/ui · recharts (via shadcn chart) ·
react-router (HashRouter) · date-fns · lucide-react.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-checks (tsc -b) and builds to dist/
npm run preview   # serve the production build locally
```

Requires Node 20+.

## Pages

| Route | What it shows |
| --- | --- |
| `#/` Overview | Stat tiles, approved-days chart (stacked by type), breakdown by type, top 5, who's off this week |
| `#/employees` | Every employee (including those with zero requests): sortable and searchable, with a totals row |
| `#/employees/:id` | One person's report: tiles, chart, type breakdown, every request |
| `#/requests` | All requests, newest first, with search and pagination |

The **filter bar** (Week / Month / Year / All time, prev / next / Today, department, type, status) is shared by
every page. It lives in React context and in the URL query (e.g. `#/employees?p=year&d=2025-06-01&dept=Finance+%26+HR`),
so any view can be bookmarked or shared.

### Languages (English / العربية)

The navbar switch toggles **English** and **Arabic**. Arabic switches the whole layout to right-to-left
(`dir="rtl"`), mirrors the charts and arrows, formats dates in Arabic (e.g. `20 نوفمبر 2026`) and uses
IBM Plex Sans Arabic. The choice is remembered per browser.

- Strings live in `src/i18n/en.ts` (source) and `src/i18n/ar.ts`. TypeScript fails the build if a key is
  missing in Arabic.
- Data from the sheet (names, departments, reasons) is shown exactly as written.
- Numbers use Western digits (0–9) in both languages.

### How the numbers are counted

- A request **belongs to a period** if its date range overlaps the period.
- **Approved days** = the day counts of approved requests (see *How rows are read* below).
- Weeks run **Saturday to Friday**, matching the sheet (`WEEK_STARTS_ON` in `src/lib/constants.ts`).
- "Off this week" and "Who's off this week" always use the real current week. They respect the type filter
  and count annual, sick, day off, training and holiday requests, but not shift changes.
- If the data stops before the current month, the app opens on the latest week that has data.
- Every page uses the same functions in `src/lib/stats.ts`, so Overview, Employees and the Employee report
  always agree.

## Project layout

```
src/
  lib/
    types.ts         LeaveRequest, Employee
    data-source.ts   loadLeaveData() — the ONLY place that knows where data comes from
    mock-data.ts     invented demo data in the same shape as the real sheet
    constants.ts     leave types + fixed colours, statuses, weekend, week start
    dates.ts         periods, working days, overlap / in-period day maths
    stats.ts         filtering and aggregation shared by all pages
  i18n/              en / ar strings + language context (RTL)
  context/           data loading + global filter state (URL-synced)
  components/        layout, filter bar, chart, badges, tiles, tables
  pages/             overview, employees, employee-report, requests
```

## Deploy to Cloudflare Pages (free)

**From Git (recommended):**

1. Push this repo to GitHub.
2. Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** → pick the repo.
3. Framework preset: *None* (or *Vite*). **Build command:** `npm run build`. **Build output directory:** `dist`.
4. If the default Node version is too old, add an environment variable: `NODE_VERSION = 22`.
5. Save and deploy. Every push to the production branch redeploys.

**Direct upload:** `npm run build`, then `npx wrangler pages deploy dist --project-name leave-tracker`.

The app uses a `HashRouter` and relative asset paths, so it works on any static host. `public/_redirects`
(`/* /index.html 200`) is included as a safety net for deep links.

> Leave data will be visible to anyone with the URL. To limit access to company emails, put the site behind
> **Cloudflare Access** (Zero Trust → Access → Applications), which is free for up to 50 users.

## The data: the "Leave" Google Sheet

Everything about reading data lives in **`src/lib/data-source.ts`**. No other file needs to change.

The app reads three tabs. Only the listed columns are read; anything else, such as the roster's
*Address* column, is ignored.

| Tab | Columns used | Purpose |
| --- | --- | --- |
| **Weekly Requests** | Name · Request · Status · Annual · Week · Note | One row per request |
| **FSRs** | FSR Names (and Department, if added later) | The roster. People with no requests still appear |
| **Aliases** *(add this tab)* | Name in requests · Correct name | Fixes spelling variants ("Moahmed Ali" → "Mohamed Ali") |

Header names and tab names are configurable in `COLUMN_MAPPING` / `SHEET_CONFIG`. Matching ignores case
and extra spaces.

**How rows are read**

- **Status:** "Approved" means approved and "Rejected" means rejected. *Sick* and *Training* are recorded facts,
  so they count as approved. A blank cell means **pending**. Cell colours are not used.
- **Week:** a label like `27-12 to 2-1` (Saturday to Friday). The year isn't written, so it is inferred:
  the last row is the latest year that isn't far in the future, and going up the sheet the year steps back
  at each December/January boundary. A weekly request is counted in the period that contains its Saturday.
- **Type:** the free-text *Request* is sorted into Annual, Sick, Day off, Shift change, Training / outside,
  Holiday or Other (`classifyRequest()`). Shift changes don't count as "off".
- **Days:** the number in the *Annual* column (e.g. `2 Day`). For sick requests, the number in the text is
  used too (`Out of schedule 3 Day ( Sick )`). Otherwise the row counts 0 days.
- **Names:** spaces and capitals are ignored when matching, then *Aliases* are applied, then the name is
  matched to the roster. Names that aren't in FSRs are still shown, with a "Not in FSRs list" tag.

### Where the data comes from (`VITE_DATA_SOURCE`)

| Value | Reads | Use for |
| --- | --- | --- |
| `mock` (default) | invented demo data in the same format | development, demos |
| `csv-files` | `./data/weekly-requests.csv`, `./data/fsrs.csv`, `./data/aliases.csv` next to `index.html` | a private preview from an export |
| `google-sheet` | the live sheet | production |

**Connecting the live sheet**

1. Share the sheet as **"Anyone with the link can view"**. The app reads it with the public CSV export, so
   no API key is needed now that status is a text column.
2. In Cloudflare Pages → *Settings → Environment variables*, add:
   - `VITE_DATA_SOURCE = google-sheet`
   - `VITE_SHEET_ID = <the long id from the sheet URL>`
3. Redeploy. Locally: `VITE_DATA_SOURCE=google-sheet VITE_SHEET_ID=... npm run dev`.

> ⚠️ "Anyone with the link" means anyone who finds the link can read the sheet. If that's not acceptable,
> keep the sheet private and add a small proxy (e.g. a Cloudflare Worker with a service account) later.
> Only `loadTabs()` in `data-source.ts` would change.

Real exports (`*.xlsx`, `*.csv`, `public/data/`) are git-ignored. Never commit employee data.
