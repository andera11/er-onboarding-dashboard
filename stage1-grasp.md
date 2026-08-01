# Stage 1 GRASP Brief

## Goal
Use Claude's Cowork capability to consolidate fictional Emergency Department nurse onboarding data from multiple files into one organized dataset that department managers can use to track orientation progress.

## Resources
- employee_roster.csv
- competency_checklist.csv
- manager_notes.csv

## Autonomy Limits
Claude may organize, summarize, calculate completion percentages, and identify missing information. It may not invent missing data or make employment or orientation decisions.

## Sign-Off Point
After Claude produced the master dataset and exception report, I manually compared three fictional employee records against the original roster, competency checklist, and manager notes. I did not approve the consolidated output until the completion counts, notes, and missing-documentation flags matched the source files.

## Proof
Claude produced a consolidated orientation dataset and an orientation exceptions report. I reviewed the results to verify that employees behind schedule, missing documentation, and follow-up items were identified correctly.
