# ED Nurse Onboarding Dashboard

An interactive, single-page dashboard for tracking Emergency Department
nurse onboarding progress. Built with plain HTML, CSS, and JavaScript —
no frameworks, build tools, or installs required.

All employee data is **fictional**, created for a Business Development
course assignment.

## Files

| File | Purpose |
|---|---|
| `index.html` | Page structure: header, summary cards, controls, employee list, detail modal. |
| `styles.css` | All visual styling, including the color-coded status system. |
| `script.js` | Data, filtering/sorting logic, and all rendering — see comments inside. |
| `README.md` | This file. |

## How to run it

Just open `index.html` in any modern browser (Chrome, Edge, Firefox):

1. Keep all four files together in the same folder — `index.html` links to
   `styles.css` and `script.js` by relative path.
2. Double-click `index.html`, or right-click it and choose "Open with"
   your browser.

No server, no `npm install`, no internet connection needed.

### Why is the data pasted into `script.js` instead of loaded from the CSV files?

Browsers block a webpage opened via `file://` (i.e. double-clicked, not
served by a web server) from using `fetch()` to read local files — it's a
security restriction (CORS), not a bug. To make this dashboard work the
moment you open `index.html`, the contents of the three consolidated CSV
files are embedded directly as text inside `script.js` and parsed there
with a small hand-written CSV parser.

If you'd rather serve this over a local web server (for example, running
`python -m http.server` in this folder and visiting
`http://localhost:8000`), you could replace the embedded strings with
real `fetch("master_orientation_dataset.csv")` calls — `fetch()` works
fine once the page is loaded over `http://` instead of `file://`.

**To refresh the data:** regenerate the CSV files, then paste their new
contents into the `MASTER_DATASET_CSV`, `EXCEPTIONS_CSV`, and
`COMPETENCY_CHECKLIST_CSV` constants at the top of `script.js`.

## Data sources

The dashboard is built from three consolidated CSVs (embedded in
`script.js`, Section 1):

- **`master_orientation_dataset.csv`** — one row per employee: identity,
  hire date, track, preceptor, aggregate competency counts, current
  status, follow-up flag, and manager notes.
- **`orientation_exceptions.csv`** — one row per flagged issue: missing
  documentation, employees behind schedule, individual overdue
  competencies, and data inconsistencies.
- **`competency_checklist.csv`** — one row per individual competency
  assigned to an employee. The master dataset only stores the *counts*
  of completed/in-progress/not-started competencies, so this file is
  what powers the competency-by-competency table in the detail view.

## How status and color-coding work

Each employee has a **Current Status** from the master dataset (`On
Track`, `Nearly Complete`, `Behind Schedule`, or `Complete`) and a
separate **Follow-up Needed** flag. The dashboard combines both into one
of four mutually-exclusive **display statuses**, using this priority
order (see `getDisplayStatus()` in `script.js`):

1. **Behind Schedule → Red** — always the most urgent signal.
2. **Needs Attention → Orange** — `Follow-up Needed = Yes` but not
   already Behind Schedule (e.g. missing documentation, overdue items).
3. **Nearly Complete → Yellow**
4. **On Track → Green** — also covers `Complete` (100%), since finishing
   early is a form of being on track.

This priority order means every employee lands in exactly one bucket, so
the 5 summary cards (Total, On Track, Nearly Complete, Needs Attention,
Behind Schedule) always add up correctly.

"Orientation Day" (shown on each card and sortable) is the number of
days between an employee's hire date and a fixed reference date,
`AS_OF_DATE` (2026-07-31), defined near the top of `script.js`. A fixed
date is used instead of "today" so the dashboard's day counts always
match the overdue-day numbers already baked into
`orientation_exceptions.csv`, no matter when you open the page.

## Features

- **Summary cards** — Total Employees, On Track, Nearly Complete, Needs
  Attention, Behind Schedule (always reflect the full roster, regardless
  of active filters).
- **Search** — filters the list live as you type an employee's name.
- **Filters** — by orientation track (30-Day / 60-Day) and by display
  status.
- **Sort** — by Completion %, Employee Name, or Orientation Day, with an
  ascending/descending toggle button.
- **Progress bar** — color-coded per employee on each card.
- **Detail view** — click (or press Enter/Space on) any employee card to
  open a modal showing their full competency table, manager notes,
  follow-up flag, and any orientation exceptions on file. Close it with
  the × button, by clicking outside the modal, or by pressing Escape.

## Extending this project

Some ideas if you want to build on this for the assignment:

- Add a CSV upload button (`<input type="file">` + `FileReader`) so a
  manager could load a *different* roster without editing `script.js`.
- Add a chart (e.g. a simple `<canvas>` bar chart) summarizing
  competency completion by category across all employees.
- Persist filter/sort selections in the URL query string so a specific
  view can be bookmarked or shared.
