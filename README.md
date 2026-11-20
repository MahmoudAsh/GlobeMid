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
- **Approved days** count only the working days that fall *inside* the period. A request from 29 Nov to 2 Dec
  counts 2 days in November and 2 in December. Tables show this as `4 (2 in period)`.
- **Working days** exclude Friday and Saturday (Egypt weekend). Weeks run Sunday to Saturday
  (`WEEK_STARTS_ON` in `src/lib/constants.ts`).
- "On leave today" and "Who's off this week" always use the real today and the current week. They respect the
  department and type filters.
- Every page uses the same functions in `src/lib/stats.ts`, so Overview, Employees and the Employee report
  always agree.

## Project layout

```
src/
  lib/
    types.ts         LeaveRequest, Employee
    data-source.ts   loadLeaveData() — the ONLY place that knows where data comes from
    mock-data.ts     55 employees / ~200 requests (seeded, deterministic)
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

## Connecting the Google Sheet

Everything happens in **`src/lib/data-source.ts`**. No other file needs to change.

1. Set `DATA_SOURCE` to `'google-sheet'`.
2. Fill in `SHEET_CONFIG.spreadsheetId` (from the sheet URL) and `sheetName` (the tab name).
3. Edit `COLUMN_MAPPING` so each **sheet header** maps to an app field:

   ```ts
   export const COLUMN_MAPPING = {
     'Employee Name': 'employee',
     'Leave Type': 'type',
     'Start Date': 'startDate',
     'End Date': 'endDate',
     'Number of Days': 'days',   // optional: if missing, working days are calculated (Fri/Sat excluded)
     Reason: 'reason',
     ...
   }
   ```

   Free-text leave types are mapped to Annual / Sick / Casual / Unpaid / Other by `normalizeLeaveType()`
   in `constants.ts`. Date cells in common formats (`2026-11-20`, `20/11/2026`, …) are parsed by `DATE_FORMATS`.
4. Implement `loadFromGoogleSheet()` using one of the two options below. The row-mapping helper
   `rowsToLeaveData(rows, rowStatuses?)` and a small `parseCsv()` are already written.

### ⚠️ Approval status is stored as cell colour

Today the reviewer marks requests by colouring rows: green means approved, red means rejected, no colour means
pending. **A CSV export of a Google Sheet does not include cell colours.** Choose one of these:

- **(a) Add a "Status" column** (Approved / Rejected / Pending). This is the simplest option. Share the sheet as
  "Anyone with the link can view" and fetch
  `https://docs.google.com/spreadsheets/d/<id>/gviz/tq?tqx=out:csv&sheet=<tab>`, then
  `rowsToLeaveData(parseCsv(text))`.
- **(b) Keep the colours** and read them with the **Google Sheets API v4**:
  `spreadsheets.get` with `includeGridData=true`, using
  `fields=sheets.data.rowData.values(formattedValue,effectiveFormat.backgroundColor)` and a browser
  **API key restricted** to the Sheets API and your Pages domain. Convert each row's background with
  `colorToStatus()` (green → approved, red → rejected, otherwise pending). Pass those as `rowStatuses`.

Both options are described in the `TODO(google-sheet)` comments in `data-source.ts`.

People who never requested leave only appear if there's an employee list. Point
`SHEET_CONFIG.employeesSheetName` at a roster tab and merge it in `deriveEmployees()`.
