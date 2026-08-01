/* =========================================================================
   ED Nurse Onboarding Dashboard — script.js
   -------------------------------------------------------------------------
   This file is organized into clearly labeled sections:

     1. EMBEDDED CSV DATA
     2. CSV PARSING UTILITIES
     3. DATA LOADING & TRANSFORMATION
     4. DERIVED / COMPUTED FIELDS (status color, orientation day, etc.)
     5. APPLICATION STATE (search term, active filters, sort settings)
     6. RENDERING FUNCTIONS (turn data + state into HTML)
     7. EVENT LISTENERS (respond to user input)
     8. INITIALIZATION

   Read them top to bottom — later sections depend on earlier ones.
   ========================================================================= */


/* =========================================================================
   1. EMBEDDED CSV DATA
   -------------------------------------------------------------------------
   Why is the CSV text pasted directly into this file instead of being
   loaded with fetch("master_orientation_dataset.csv")?

   When you open index.html directly from your file system (double-click,
   or File > Open), the page loads over the "file://" protocol. Browsers
   block fetch() from reading local files over file:// for security
   reasons (a CORS restriction), so a fetch-based version of this
   dashboard would fail silently with no data.

   Embedding the CSV content as JavaScript strings guarantees the
   dashboard works the moment you open index.html, with no local web
   server required. If you DO run this through a local server (e.g.
   `python -m http.server` and open http://localhost:8000), you could
   swap this section out for real fetch() calls to the .csv files.

   To refresh the data: regenerate the three CSV files, then paste their
   contents into the three constants below.
   ========================================================================= */

// One row per employee: identity, track, aggregate competency counts,
// computed status, and manager notes.
const MASTER_DATASET_CSV = `Employee ID,Employee Name,Hire Date,Orientation Track,Assigned Preceptor,Current Completion Percentage,Number of Completed Competencies,Number of In Progress Competencies,Number of Not Started Competencies,Current Status,Follow-up Needed,Manager Notes
EMP001,Sarah Mitchell,2026-05-04,60,Jordan Reyes,30%,3,3,4,Behind Schedule,Yes,"Sarah is significantly behind on her 60-day orientation checklist. Several core competencies (EKG interpretation, trauma assessment, SBAR handoff) remain Not Started despite being well past their target completion days. Preceptor Jordan Reyes reports scheduling conflicts have limited hands-on practice time."
EMP002,David Chen,2026-06-01,30,Maria Alvarez,89%,8,1,0,Nearly Complete,No,"David has completed nearly all required competencies well within his 30-day track. Only SBAR handoff communication remains in progress, with a check-off scheduled this week. Preceptor notes strong clinical judgment and readiness for independent practice."
EMP003,Priya Nair,2026-05-18,60,Jordan Reyes,80%,8,1,1,Nearly Complete,Yes,"Priya has demonstrated the required skills in practice, but completion dates are missing from the record for three competencies (medication safety check, EKG, EHR charting). Preceptor confirms the skills were performed but sign-off paperwork was never submitted; records need to be corrected."
EMP004,Marcus Johnson,2026-06-15,30,Tom Baker,100%,9,0,0,Complete,No,"Marcus is performing exceptionally well, completing every competency ahead of schedule with consistently strong feedback from preceptor Tom Baker. He is being considered as a candidate for the ED float pool after orientation."
EMP005,Lindsey Park,2026-06-22,30,Maria Alvarez,67%,6,2,1,On Track,No,"Lindsey is progressing steadily and on pace with her 30-day track. A couple of documentation and IV therapy competencies are still in progress but are expected to be completed on schedule."
EMP006,Omar Farouk,2026-05-11,60,Tom Baker,80%,8,2,0,Nearly Complete,Yes,"Omar is generally on track but has two competencies (ACLS participation, SBAR handoff) still in progress well past the midpoint of his 60-day track. Preceptor recommends additional simulation lab time to close the gap."`;

// One row per flagged issue: missing documentation, behind-schedule
// employees, overdue individual competencies, and data inconsistencies.
const EXCEPTIONS_CSV = `Exception Category,Employee ID,Employee Name,Details,Flag
Missing Documentation,EMP003,Priya Nair,"Status = Complete but Completion Date is blank for: High-Alert Medication Safety Check (Medication Administration), 12-Lead EKG Acquisition and Interpretation (Cardiac Monitoring), EHR Charting Standards (Documentation). Preceptor states the skills were performed but paperwork was not submitted.",Needs Manager Review
Employee Behind Schedule,EMP001,Sarah Mitchell,"Only 30% of competencies complete 88 days after hire on a 60-day track (28 days past the orientation window close). 7 of 10 competencies are still In Progress or Not Started.",Needs Manager Review
Overdue Competency,EMP001,Sarah Mitchell,"Bag-Valve-Mask Ventilation (Airway Management) - required Day 15, currently In Progress - 73 days overdue.",Needs Manager Review
Overdue Competency,EMP001,Sarah Mitchell,"12-Lead EKG Acquisition and Interpretation (Cardiac Monitoring) - required Day 20, currently Not Started - 68 days overdue.",Needs Manager Review
Overdue Competency,EMP001,Sarah Mitchell,"Rapid Trauma Assessment (Trauma Care) - required Day 25, currently Not Started - 63 days overdue.",Needs Manager Review
Overdue Competency,EMP001,Sarah Mitchell,"EHR Charting Standards (Documentation) - required Day 15, currently In Progress - 73 days overdue.",Needs Manager Review
Overdue Competency,EMP001,Sarah Mitchell,"ACLS Protocol Participation (Code Blue Response) - required Day 40, currently Not Started - 48 days overdue.",Needs Manager Review
Overdue Competency,EMP001,Sarah Mitchell,"Peripheral IV Insertion and Management (IV Therapy) - required Day 20, currently In Progress - 68 days overdue.",Needs Manager Review
Overdue Competency,EMP001,Sarah Mitchell,"SBAR Handoff Communication (Patient Handoff) - required Day 30, currently Not Started - 58 days overdue.",Needs Manager Review
Overdue Competency,EMP002,David Chen,"SBAR Handoff Communication (Patient Handoff) - required Day 30, currently In Progress - 30 days overdue.",Needs Manager Review
Overdue Competency,EMP003,Priya Nair,"ACLS Protocol Participation (Code Blue Response) - required Day 40, currently In Progress - 34 days overdue.",Needs Manager Review
Overdue Competency,EMP003,Priya Nair,"SBAR Handoff Communication (Patient Handoff) - required Day 30, currently Not Started - 44 days overdue.",Needs Manager Review
Overdue Competency,EMP005,Lindsey Park,"EHR Charting Standards (Documentation) - required Day 15, currently In Progress - 24 days overdue.",Needs Manager Review
Overdue Competency,EMP005,Lindsey Park,"Peripheral IV Insertion and Management (IV Therapy) - required Day 20, currently In Progress - 19 days overdue.",Needs Manager Review
Overdue Competency,EMP005,Lindsey Park,"SBAR Handoff Communication (Patient Handoff) - required Day 30, currently Not Started - 9 days overdue.",Needs Manager Review
Overdue Competency,EMP006,Omar Farouk,"ACLS Protocol Participation (Code Blue Response) - required Day 40, currently In Progress - 41 days overdue.",Needs Manager Review
Overdue Competency,EMP006,Omar Farouk,"SBAR Handoff Communication (Patient Handoff) - required Day 30, currently In Progress - 51 days overdue.",Needs Manager Review
Data Inconsistency,EMP003,Priya Nair,"3 competency records show Status = Complete with no Completion Date recorded, which is internally inconsistent (a completed item should have a completion date). Requires manager confirmation and record correction.",Needs Manager Review`;

// One row per individual competency assigned to an employee. This is the
// same data used to build the "Number of Completed/In Progress/Not
// Started Competencies" columns in the master dataset above — it is
// needed here too so the detail modal can list each competency by name.
const COMPETENCY_CHECKLIST_CSV = `Employee ID,Competency Category,Competency,Required Completion Day,Status,Completion Date
EMP001,Triage,ESI Triage Assessment,5,Complete,2026-05-10
EMP001,Medication Administration,High-Alert Medication Safety Check,10,Complete,2026-05-20
EMP001,Airway Management,Bag-Valve-Mask Ventilation,15,In Progress,
EMP001,Cardiac Monitoring,12-Lead EKG Acquisition and Interpretation,20,Not Started,
EMP001,Trauma Care,Rapid Trauma Assessment,25,Not Started,
EMP001,Infection Control,PPE Donning and Doffing,10,Complete,2026-05-15
EMP001,Documentation,EHR Charting Standards,15,In Progress,
EMP001,Code Blue Response,ACLS Protocol Participation,40,Not Started,
EMP001,IV Therapy,Peripheral IV Insertion and Management,20,In Progress,
EMP001,Patient Handoff,SBAR Handoff Communication,30,Not Started,
EMP002,Triage,ESI Triage Assessment,3,Complete,2026-06-04
EMP002,Medication Administration,High-Alert Medication Safety Check,5,Complete,2026-06-06
EMP002,Airway Management,Bag-Valve-Mask Ventilation,7,Complete,2026-06-09
EMP002,Cardiac Monitoring,12-Lead EKG Acquisition and Interpretation,10,Complete,2026-06-12
EMP002,Trauma Care,Rapid Trauma Assessment,13,Complete,2026-06-15
EMP002,Infection Control,PPE Donning and Doffing,5,Complete,2026-06-06
EMP002,Documentation,EHR Charting Standards,15,Complete,2026-06-18
EMP002,IV Therapy,Peripheral IV Insertion and Management,20,Complete,2026-06-24
EMP002,Patient Handoff,SBAR Handoff Communication,30,In Progress,
EMP003,Triage,ESI Triage Assessment,5,Complete,2026-05-23
EMP003,Medication Administration,High-Alert Medication Safety Check,10,Complete,
EMP003,Airway Management,Bag-Valve-Mask Ventilation,15,Complete,2026-06-02
EMP003,Cardiac Monitoring,12-Lead EKG Acquisition and Interpretation,20,Complete,
EMP003,Trauma Care,Rapid Trauma Assessment,25,Complete,2026-06-12
EMP003,Infection Control,PPE Donning and Doffing,10,Complete,2026-05-28
EMP003,Documentation,EHR Charting Standards,15,Complete,
EMP003,Code Blue Response,ACLS Protocol Participation,40,In Progress,
EMP003,IV Therapy,Peripheral IV Insertion and Management,20,Complete,2026-06-08
EMP003,Patient Handoff,SBAR Handoff Communication,30,Not Started,
EMP004,Triage,ESI Triage Assessment,3,Complete,2026-06-17
EMP004,Medication Administration,High-Alert Medication Safety Check,5,Complete,2026-06-18
EMP004,Airway Management,Bag-Valve-Mask Ventilation,7,Complete,2026-06-20
EMP004,Cardiac Monitoring,12-Lead EKG Acquisition and Interpretation,10,Complete,2026-06-23
EMP004,Trauma Care,Rapid Trauma Assessment,13,Complete,2026-06-25
EMP004,Infection Control,PPE Donning and Doffing,5,Complete,2026-06-17
EMP004,Documentation,EHR Charting Standards,15,Complete,2026-06-27
EMP004,IV Therapy,Peripheral IV Insertion and Management,20,Complete,2026-06-30
EMP004,Patient Handoff,SBAR Handoff Communication,30,Complete,2026-07-05
EMP005,Triage,ESI Triage Assessment,3,Complete,2026-06-24
EMP005,Medication Administration,High-Alert Medication Safety Check,5,Complete,2026-06-27
EMP005,Airway Management,Bag-Valve-Mask Ventilation,7,Complete,2026-06-29
EMP005,Cardiac Monitoring,12-Lead EKG Acquisition and Interpretation,10,Complete,2026-07-02
EMP005,Trauma Care,Rapid Trauma Assessment,13,Complete,2026-07-06
EMP005,Infection Control,PPE Donning and Doffing,5,Complete,2026-06-27
EMP005,Documentation,EHR Charting Standards,15,In Progress,
EMP005,IV Therapy,Peripheral IV Insertion and Management,20,In Progress,
EMP005,Patient Handoff,SBAR Handoff Communication,30,Not Started,
EMP006,Triage,ESI Triage Assessment,5,Complete,2026-05-17
EMP006,Medication Administration,High-Alert Medication Safety Check,10,Complete,2026-05-24
EMP006,Airway Management,Bag-Valve-Mask Ventilation,15,Complete,2026-05-30
EMP006,Cardiac Monitoring,12-Lead EKG Acquisition and Interpretation,20,Complete,2026-06-05
EMP006,Trauma Care,Rapid Trauma Assessment,25,Complete,2026-06-12
EMP006,Infection Control,PPE Donning and Doffing,10,Complete,2026-05-22
EMP006,Documentation,EHR Charting Standards,15,Complete,2026-06-01
EMP006,Code Blue Response,ACLS Protocol Participation,40,In Progress,
EMP006,IV Therapy,Peripheral IV Insertion and Management,20,Complete,2026-06-08
EMP006,Patient Handoff,SBAR Handoff Communication,30,In Progress,`;

// "Today", for the purposes of this fictional dataset. All of the CSV
// data above (overdue-day counts, etc.) was calculated as of this date.
// Using a fixed date instead of `new Date()` keeps the dashboard's own
// calculations (like "Orientation Day") consistent with the numbers
// already baked into EXCEPTIONS_CSV, no matter when a student opens
// this page.
const AS_OF_DATE = new Date('2026-07-31T00:00:00');


/* =========================================================================
   2. CSV PARSING UTILITIES
   -------------------------------------------------------------------------
   A small hand-written CSV parser. It has to handle quoted fields that
   contain commas (our Manager Notes and Details columns do), which is
   why a simple `line.split(',')` would not be safe here.
   ========================================================================= */

/**
 * Parses raw CSV text into an array of rows, where each row is an array
 * of string cells. Supports double-quoted fields, commas inside quotes,
 * and escaped quotes ("") inside a quoted field.
 */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  const normalized = text.replace(/\r\n/g, '\n');

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];

    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"'; // escaped quote inside a quoted field
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  // push the final field/row if the text didn't end with a newline
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

/**
 * Converts raw CSV text into an array of plain objects, using the first
 * row as property names (headers).
 */
function csvToObjects(text) {
  const rows = parseCSV(text).filter((r) => !(r.length === 1 && r[0] === ''));
  const headers = rows[0].map((h) => h.trim());

  return rows.slice(1).map((cells) => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = (cells[i] || '').trim();
    });
    return obj;
  });
}


/* =========================================================================
   3. DATA LOADING & TRANSFORMATION
   -------------------------------------------------------------------------
   Turn the three raw CSV strings into JavaScript objects, and group the
   competency/exception rows by Employee ID so the detail modal can look
   them up quickly.
   ========================================================================= */

const masterRows = csvToObjects(MASTER_DATASET_CSV);
const exceptionRows = csvToObjects(EXCEPTIONS_CSV);
const competencyRows = csvToObjects(COMPETENCY_CHECKLIST_CSV);

/** Groups an array of objects by a given key, returning a Map. */
function groupBy(items, key) {
  const map = new Map();
  items.forEach((item) => {
    const groupKey = item[key];
    if (!map.has(groupKey)) map.set(groupKey, []);
    map.get(groupKey).push(item);
  });
  return map;
}

const competenciesByEmployee = groupBy(competencyRows, 'Employee ID');
const exceptionsByEmployee = groupBy(exceptionRows, 'Employee ID');


/* =========================================================================
   4. DERIVED / COMPUTED FIELDS
   -------------------------------------------------------------------------
   The raw CSV gives us a "Current Status" (On Track / Nearly Complete /
   Behind Schedule / Complete) and a "Follow-up Needed" flag separately.
   For the dashboard's 4-color legend we combine both into a single
   "display status" per employee, using this priority order (most
   urgent first):

     1. Behind Schedule  -> RED     (already the most severe signal)
     2. Follow-up Needed -> ORANGE  ("Needs Attention" - e.g. missing
                                      documentation or overdue items,
                                      even if completion % looks fine)
     3. Nearly Complete   -> YELLOW
     4. Everything else
        (On Track / Complete) -> GREEN

   This keeps the 4 summary cards mutually exclusive: every employee
   lands in exactly one bucket.
   ========================================================================= */

const STATUS_COLORS = {
  'On Track': 'green',
  'Nearly Complete': 'yellow',
  'Needs Attention': 'orange',
  'Behind Schedule': 'red',
};

function getDisplayStatus(employee) {
  if (employee['Current Status'] === 'Behind Schedule') return 'Behind Schedule';
  if (employee['Follow-up Needed'] === 'Yes') return 'Needs Attention';
  if (employee['Current Status'] === 'Nearly Complete') return 'Nearly Complete';
  return 'On Track'; // covers both "On Track" and "Complete" (100%)
}

/** Days elapsed between an employee's hire date and AS_OF_DATE. */
function getOrientationDay(hireDateStr) {
  const hireDate = new Date(hireDateStr + 'T00:00:00');
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((AS_OF_DATE - hireDate) / msPerDay);
}

/**
 * Builds the final list of employee objects used throughout the app,
 * combining the raw CSV fields with the computed fields above.
 */
const employees = masterRows.map((row) => {
  const completionPercent = parseInt(row['Current Completion Percentage'], 10) || 0;
  const displayStatus = getDisplayStatus(row);

  return {
    id: row['Employee ID'],
    name: row['Employee Name'],
    hireDate: row['Hire Date'],
    track: row['Orientation Track'], // "30" or "60"
    preceptor: row['Assigned Preceptor'],
    completionPercent,
    completed: parseInt(row['Number of Completed Competencies'], 10) || 0,
    inProgress: parseInt(row['Number of In Progress Competencies'], 10) || 0,
    notStarted: parseInt(row['Number of Not Started Competencies'], 10) || 0,
    rawStatus: row['Current Status'],
    followUpNeeded: row['Follow-up Needed'],
    managerNotes: row['Manager Notes'],
    displayStatus,
    colorClass: STATUS_COLORS[displayStatus],
    orientationDay: getOrientationDay(row['Hire Date']),
    competencies: competenciesByEmployee.get(row['Employee ID']) || [],
    exceptions: exceptionsByEmployee.get(row['Employee ID']) || [],
  };
});


/* =========================================================================
   5. APPLICATION STATE
   -------------------------------------------------------------------------
   A single object holding everything the user has currently selected.
   Any time one of these values changes, we re-run applyFiltersAndRender()
   to rebuild the visible list from scratch. For a dataset this small,
   re-rendering everything on every change is simple and fast enough -
   no need for more complex partial-update logic.
   ========================================================================= */

const state = {
  searchTerm: '',
  trackFilter: 'all',   // 'all' | '30' | '60'
  statusFilter: 'all',  // 'all' | one of the 4 display statuses
  sortKey: 'completion', // 'completion' | 'name' | 'orientationDay'
  sortAscending: true,
};


/* =========================================================================
   6. RENDERING FUNCTIONS
   ========================================================================= */

/** Renders the 5 summary cards at the top. Always reflects ALL employees. */
function renderSummaryCards() {
  const counts = {
    total: employees.length,
    'On Track': 0,
    'Nearly Complete': 0,
    'Needs Attention': 0,
    'Behind Schedule': 0,
  };

  employees.forEach((emp) => {
    counts[emp.displayStatus]++;
  });

  const cards = [
    { label: 'Total Employees', value: counts.total, className: 'total' },
    { label: 'On Track', value: counts['On Track'], className: 'on-track' },
    { label: 'Nearly Complete', value: counts['Nearly Complete'], className: 'nearly-complete' },
    { label: 'Needs Attention', value: counts['Needs Attention'], className: 'needs-attention' },
    { label: 'Behind Schedule', value: counts['Behind Schedule'], className: 'behind-schedule' },
  ];

  const html = cards
    .map(
      (card) => `
      <div class="summary-card ${card.className}">
        <div class="value">${card.value}</div>
        <div class="label">${card.label}</div>
      </div>`
    )
    .join('');

  document.getElementById('summaryCards').innerHTML = html;
}

/** Escapes text before inserting it into innerHTML, to avoid HTML injection. */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Builds the HTML for a single employee card in the list. */
function renderEmployeeCard(emp) {
  const followUpHtml = emp.followUpNeeded === 'Yes'
    ? '<span class="follow-up-flag">⚠ Follow-up needed</span>'
    : '<span>No follow-up needed</span>';

  return `
    <article class="employee-card status-${emp.colorClass}" data-id="${emp.id}" tabindex="0" role="button" aria-label="View details for ${escapeHtml(emp.name)}">
      <div class="card-top">
        <div>
          <h3>${escapeHtml(emp.name)}</h3>
          <div class="card-meta">${emp.id} &middot; ${emp.track}-Day Track &middot; Preceptor: ${escapeHtml(emp.preceptor)}</div>
        </div>
        <span class="badge badge-${emp.colorClass}">${emp.displayStatus}</span>
      </div>

      <div class="progress-track">
        <div class="progress-fill status-${emp.colorClass}" style="width: ${emp.completionPercent}%"></div>
      </div>
      <div class="progress-label">
        <span>${emp.completionPercent}% complete</span>
        <span>Day ${emp.orientationDay} of ${emp.track}</span>
      </div>

      <div class="card-footer-row">
        <span>${emp.completed} done / ${emp.inProgress} in progress / ${emp.notStarted} not started</span>
        ${followUpHtml}
      </div>
    </article>`;
}

/** Filters + sorts `employees` based on the current state, then renders. */
function applyFiltersAndRender() {
  let visible = employees.filter((emp) => {
    const matchesSearch = emp.name.toLowerCase().includes(state.searchTerm.toLowerCase());
    const matchesTrack = state.trackFilter === 'all' || emp.track === state.trackFilter;
    const matchesStatus = state.statusFilter === 'all' || emp.displayStatus === state.statusFilter;
    return matchesSearch && matchesTrack && matchesStatus;
  });

  visible = sortEmployees(visible, state.sortKey, state.sortAscending);

  const listEl = document.getElementById('employeeList');
  const emptyEl = document.getElementById('emptyState');

  if (visible.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }

  emptyEl.classList.add('hidden');
  listEl.innerHTML = visible.map(renderEmployeeCard).join('');

  // Wire up click/keyboard handlers on the freshly-rendered cards.
  listEl.querySelectorAll('.employee-card').forEach((card) => {
    card.addEventListener('click', () => openDetailModal(card.dataset.id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openDetailModal(card.dataset.id);
      }
    });
  });
}

/** Returns a new, sorted copy of `list` based on sortKey/ascending. */
function sortEmployees(list, sortKey, ascending) {
  const sorted = [...list].sort((a, b) => {
    let result = 0;
    if (sortKey === 'completion') {
      result = a.completionPercent - b.completionPercent;
    } else if (sortKey === 'name') {
      result = a.name.localeCompare(b.name);
    } else if (sortKey === 'orientationDay') {
      result = a.orientationDay - b.orientationDay;
    }
    return ascending ? result : -result;
  });
  return sorted;
}

/** Builds the competency table HTML for the detail modal. */
function renderCompetencyTable(competencies) {
  if (competencies.length === 0) {
    return '<p>No competency records found.</p>';
  }

  const rows = competencies
    .map(
      (c) => `
      <tr>
        <td>${escapeHtml(c['Competency Category'])}</td>
        <td>${escapeHtml(c['Competency'])}</td>
        <td>Day ${escapeHtml(c['Required Completion Day'])}</td>
        <td><span class="badge badge-${competencyStatusColor(c['Status'])}">${escapeHtml(c['Status'])}</span></td>
        <td>${escapeHtml(c['Completion Date'] || '—')}</td>
      </tr>`
    )
    .join('');

  return `
    <table class="competency-table">
      <thead>
        <tr><th>Category</th><th>Competency</th><th>Required By</th><th>Status</th><th>Completed</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/** Maps a single competency's status to one of our 4 badge colors. */
function competencyStatusColor(status) {
  if (status === 'Complete') return 'green';
  if (status === 'In Progress') return 'yellow';
  return 'red'; // Not Started
}

/** Builds the exceptions list HTML for the detail modal. */
function renderExceptionsList(exceptions) {
  if (exceptions.length === 0) {
    return '<p>No exceptions recorded for this employee.</p>';
  }

  return exceptions
    .map(
      (ex) => `
      <div class="exception-item">
        <span class="exception-category">${escapeHtml(ex['Exception Category'])}</span>
        ${escapeHtml(ex['Details'])}
        <div><span class="badge badge-orange" style="margin-top:6px;">${escapeHtml(ex['Flag'])}</span></div>
      </div>`
    )
    .join('');
}

/** Opens the detail modal for a given employee ID and fills in its content. */
function openDetailModal(employeeId) {
  const emp = employees.find((e) => e.id === employeeId);
  if (!emp) return;

  const modalBody = document.getElementById('modalBody');
  modalBody.innerHTML = `
    <h2 id="modalTitle">${escapeHtml(emp.name)}</h2>
    <p class="modal-subtitle">${emp.id} &middot; ${emp.track}-Day Track &middot; Preceptor: ${escapeHtml(emp.preceptor)}</p>

    <span class="badge badge-${emp.colorClass}">${emp.displayStatus}</span>

    <div class="modal-section">
      <h3>Overview</h3>
      <div class="info-grid">
        <div><span class="label">Hire Date:</span> ${escapeHtml(emp.hireDate)}</div>
        <div><span class="label">Orientation Day:</span> Day ${emp.orientationDay} of ${emp.track}</div>
        <div><span class="label">Completion:</span> ${emp.completionPercent}%</div>
        <div><span class="label">Follow-up Needed:</span> ${escapeHtml(emp.followUpNeeded)}</div>
      </div>
    </div>

    <div class="modal-section">
      <h3>Manager Notes</h3>
      <p class="manager-notes">${escapeHtml(emp.managerNotes)}</p>
    </div>

    <div class="modal-section">
      <h3>Competencies (${emp.competencies.length})</h3>
      ${renderCompetencyTable(emp.competencies)}
    </div>

    <div class="modal-section">
      <h3>Orientation Exceptions (${emp.exceptions.length})</h3>
      ${renderExceptionsList(emp.exceptions)}
    </div>
  `;

  document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeDetailModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}


/* =========================================================================
   7. EVENT LISTENERS
   ========================================================================= */

document.getElementById('searchInput').addEventListener('input', (e) => {
  state.searchTerm = e.target.value;
  applyFiltersAndRender();
});

document.getElementById('trackFilter').addEventListener('change', (e) => {
  state.trackFilter = e.target.value;
  applyFiltersAndRender();
});

document.getElementById('statusFilter').addEventListener('change', (e) => {
  state.statusFilter = e.target.value;
  applyFiltersAndRender();
});

document.getElementById('sortSelect').addEventListener('change', (e) => {
  state.sortKey = e.target.value;
  applyFiltersAndRender();
});

document.getElementById('sortDirectionBtn').addEventListener('click', (e) => {
  state.sortAscending = !state.sortAscending;
  e.target.textContent = state.sortAscending ? '▲ Asc' : '▼ Desc';
  applyFiltersAndRender();
});

// Close the modal via the X button, clicking the dark overlay, or Escape.
document.getElementById('modalCloseBtn').addEventListener('click', closeDetailModal);

document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target.id === 'modalOverlay') closeDetailModal();
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeDetailModal();
});


/* =========================================================================
   8. INITIALIZATION
   ========================================================================= */

renderSummaryCards();
applyFiltersAndRender();
