# Leave Tracker

A small internal, **read-only** view of the team's leave, built from the manager's **"Weekly Requests"** Google
Sheet. Frontend only, with no backend and no login.

**Stack:** Vite · React · TypeScript · Tailwind CSS v4 · shadcn/ui · recharts (via shadcn chart) ·
react-router (HashRouter) · date-fns · lucide-react · Vitest.

## Run it

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # unit + integration tests (Vitest)
npm run build     # type-checks (tsc -b) and builds to dist/
npm run preview   # serve the production build locally
```

Requires Node 20+.

## Pages

| Route | What it shows |
| --- | --- |
| `#/` Overview | Totals for the period, annual days by month, requests by category, top employees by annual days, this week's requests |
| `#/employees` | One row per person: rows, approved / rejected / not marked, annual days, sick ≈, holidays ≈, birthdays, off changes, cancelled offs, and **FSR Annual Used vs Computed** (⚠ when they differ). Toggle *FSR list only / Everyone* |
| `#/employees/:id` | Every row for that person, grouped by week (newest first): request text, categories, status, annual days, note. Also a per-category summary and the name variants merged into this person |
| `#/requests` | All rows, with search, filters and pagination |
| *Add leave request* | Navbar button: the manager records a leave (employee, day or range, days, type, approved / rejected, reason). Saved to Cloudflare D1 |
| `#/data-check` | Unreadable weeks, non-Saturday weeks, unmatched names, unclassified request texts, and FSR vs computed mismatches. Use it to verify the numbers with the manager |

The **filter bar** (Week / Month / Year / All time, prev / next, month and year lists, category, status) is shared by every page and
stored in the URL, so views can be bookmarked. It **defaults to the year of the latest sheet week** (e.g. 2026).
Week mode steps through the weeks that actually exist in the sheet.

Also: English / العربية (full right-to-left), light / dark mode, and a phone-friendly layout.

## The data

```
src/data/
  weekly-requests.csv   export of the "Weekly Requests" tab (Row, Name, Request, Status, Annual, Week, Note, RowColor)
  fsrs.csv              the official FSR list + the sheet's manual "Annual Used" counter
  name-aliases.json     misspelled / short name → canonical name. THE place to fix names.
src/lib/sheet/          the parser (pure functions, unit-tested)
  names.ts              normalize (non-breaking spaces, spaces, case) + aliases + FSR matching
  weeks.ts              "27-12 to 2-1" → dates (Sat → Fri, year from a base year + Dec → Jan rollover)
  annual.ts             Annual column → annual days (leading number of "N Day", never "sick")
  status.ts             Approved / Rejected (or red row) / Sick / Training / empty → approved | rejected | not_marked
  classifier.ts         keyword table → categories (EDIT THIS to add keywords)
  parse.ts              puts it together → LeaveRow[] + employees + data-quality issues
src/lib/config.ts       base year (2025) and the FSR counter start date (2026-03-28)
src/lib/data-source.ts  the bundled CSV, or the live sheet when VITE_SHEET_CSV_URL is set
src/lib/periods.ts      week / month / year / all on sheet weeks
src/lib/stats.ts        aggregations shared by every page (so all pages agree)
```

> ⚠️ `src/data/` contains real employee names. Keep the repository private.

### How a row is read

One row = one line the manager wrote for **one employee in one week**. There are no exact dates.

- **Week:** `27-12 to 2-1` means 27 Dec → 2 Jan. The first row's year is `baseYear` (2025). The year goes up
  when the start month rolls back (Dec → Jan). A row belongs to a month or year by its week's **Saturday**.
- **Status:**
  - `Approved` → approved.
  - `Rejected`, or a red row (`RowColor = FF0000`) → rejected.
  - `Sick` → approved, with category Sick.
  - `Training` → approved, with category Training.
  - Empty → **not marked**. This is not "pending": for example, the Eid-week allocations are never marked.
- **Annual days** come only from the *Annual* column: the leading number of `N Day`, unless the cell says
  "sick". Rejected rows count 0. This is the source of truth for the annual balance.
- **Categories** come from keywords in the request text (English, Arabic and common typos). One row can have
  several. Non-annual day counts are approximate (the leading number in the text, default 1) and shown with ≈.
- **Names:** spaces, non-breaking spaces and case are normalized, then `name-aliases.json` is applied. Names
  not in `fsrs.csv` are still real people and are tagged "Not in FSR list".

### The FSR "Annual Used" counter

The FSRs tab's manual counter **starts at the week of 28 Mar 2026**. Counting the sheet from that week, 45 of
54 people match exactly; the other 9 are listed on the Data check page. If the counter is reset, change the
date in `src/lib/config.ts` (or set `VITE_FSR_COUNTER_START`).

### Live Google Sheet

1. Share the sheet as **"Anyone with the link can view"**.
2. Set `VITE_SHEET_CSV_URL` (Cloudflare Pages → Settings → Environment variables), then redeploy:
   `https://docs.google.com/spreadsheets/d/<ID>/gviz/tq?tqx=out:csv&sheet=Weekly%20Requests`
3. The live CSV has no `Row` / `RowColor` columns. Row numbers then come from the position in the export, and
   rejected rows must have "Rejected" written in Status.

`fsrs.csv` and `name-aliases.json` stay bundled; update them in the repo when the list changes.

## Adding leave requests from the dashboard

The **Add leave request** button (navbar, and on each employee's page) opens a form where the manager picks:
the employee, one day or a date range, the number of days, the leave type (annual, sick, emergency, …), the
decision (**Approved** or **Rejected**) and the reason. The request is saved straight away and shows up on
every page and in every total. Requests added by mistake can be deleted (trash icon next to "Added in app").

How it's stored:

- A **Cloudflare D1** database (SQLite), through two small Pages Functions:
  `functions/api/requests/index.ts` (GET list, POST add) and `functions/api/requests/[id].ts` (DELETE).
  The table is created automatically on first use (same SQL as `migrations/0001_create_leave_requests.sql`).
- Adding or deleting needs the **manager password**, kept as a Cloudflare secret (`MANAGER_PASSWORD`).
  It is never in the code. The browser remembers it until the tab is closed.
- An added request is counted in the **week of its start date** (Saturday → Friday), like a sheet row, and
  keeps its exact dates for display. Annual requests add to "Annual days" (and to the computed FSR balance).
- If the API isn't connected (e.g. plain `npm run dev`), the dashboard still works and shows the sheet only.

**One-time setup in Cloudflare:**

1. **Storage & Databases → D1 SQL Database → Create** → name it `leave-tracker`.
2. Pages project → **Settings → Bindings → Add → D1 database**: variable name **`DB`**, database `leave-tracker`.
3. Pages project → **Settings → Variables and Secrets → Add**: type **Secret**, name **`MANAGER_PASSWORD`**,
   value = the password.
4. **Deployments → Retry deployment** (bindings and secrets apply from the next deployment).

**Locally:** create `.dev.vars` with `MANAGER_PASSWORD=...` (git-ignored), then `npm run preview:cf`. This
runs the built site and the functions with a local D1 database on http://127.0.0.1:8788.

## Tests

`npm test` runs Vitest on the name normalization and aliases, week parsing with year rollover, the Annual
column parser, the status mapping and the classifier (all with real strings from the sheet). It also runs an
**integration test on the real CSV**, which checks among other things:

- Anwar = 8 rows and 8 annual days.
- 674 lines; statuses 492 approved + 21 Sick + 1 Training approved, 4 rejected, 156 empty.
- FSR = computed for Abdullah Samy, Fady Adel, Khaled, Wagdy and Mariam.

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

> The data will be visible to anyone with the URL. To limit access to company emails, put the site behind
> **Cloudflare Access** (Zero Trust → Access → Applications), which is free for up to 50 users.
