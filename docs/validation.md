# Validation

Executed successfully:

- R source-to-aggregate pipeline on the original snapshots.
- Python report generation, including input-total reconciliation.
- Five Python unit/integrity tests: percentage direction and zero baseline, deterministic paired bootstrap, source-to-aggregate conservation, zone registry and cohort thresholds, offline embedding.
- JavaScript execution with a minimal DOM stub: initial chart/map generation, year/cohort filters, zone/day mode, empty selection and reset.

The JavaScript smoke test is not a browser layout or accessibility test. Local HTML preview was blocked by the browser security policy in this session. Visual layout, tooltip placement and download interaction still need manual browser review. Open docs/index.html, resize the window, change each filter, hover the line/map, expand notes and download a filtered CSV.
