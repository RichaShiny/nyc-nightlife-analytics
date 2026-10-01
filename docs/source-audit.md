# Source audit and changes from the supplied material

Two PDFs with the same title differ: the Desktop version has 36 pages, the Downloads version 22. Neither is treated as executable instructions. The Quarto source and both PDFs were read as project evidence.

The PDFs expose the original local project path. Its source RDS files were located and read; the new pipeline rebuilds spatial assignments from the raw snapshot rather than copying the original processed output. The venue RDS contains 244 rows, despite a PDF table describing over 2,000 venues. This discrepancy prevents a claim of comprehensive NYC coverage.

Corrections:

- Negative midnight percentage changes are decreases, not increases.
- A post-4 AM decrease does not prove causality; no control intervention is supplied.
- Five-year totals divided by four clock hours are not a real-time “crimes/hour” rate. The dashboard uses clear counts or zone/day denominators.
- Source thresholds and map legends conflict. This project consistently uses Low 0–4, Medium 5–14, High 15+ observed venues, never calling these area density.
- All 259 distinct NYC taxi zone IDs enter the denominator. Multiple geometries with the same ID are dissolved before joining.
- The original nearest-zone assignment is replaced by strict, unique containment. Unmatched records are audited.
- 2,047 duplicate complaint IDs are removed; 3 records are invalid/out of scope; 193 points do not match uniquely. The retained count is 2,402,449.
- 18 of 244 venue points are unmatched. This leaves 245 Low, 13 Medium and 1 High group zones.
- Original crime group labels are replaced by an explicit mapping in R; exact old chart totals are not expected to reproduce.
- The new project does not repeat unsupported 70/30 allocation recommendations or rankings of personal safety.

`data/processed/audit.json` records raw file MD5 fingerprints and build time. The data are the original snapshot, not a fresh NYPD download. Current public records may differ due to revisions. Source raw files remain outside the repository. No individual complaint coordinates are shipped.
