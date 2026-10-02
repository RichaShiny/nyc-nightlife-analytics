# Data dictionary

| File | Grain | Fields |
|---|---|---|
| cube.csv | year × zone × hour × offense | year (2019–2023); LocationID (TLC ID); hour (0–23, occurrence start); type (analytical offense group); n (complaint count) |
| monthly.csv | calendar month × cohort × window | month (YYYY-MM); cohort (Low/Medium/High); period (Early/Midnight/Closing/Day); n |
| zones.csv | unique TLC zone | LocationID; zone; borough (polygon source); venues (observed matched unique venue IDs); cohort |
| zones.geojson | unique TLC zone | Same zone attributes, simplified WGS84 geometry; display only |
| audit.json | build | Input fingerprints, timestamp, exclusions, retained totals, group sizes |
| findings.json | full city and cohort | early/midnight/closing totals; percentage changes and bootstrap intervals; zone count |
| evidence.json | reference evidence pack | findings; annual window totals; venue coverage; High-minus-Low percentage-point difference with paired-month interval; High-threshold sensitivity at 10/15/20 venues |

Sparse cube rows omit zero counts. Analyses treat absent combinations as zero; zone denominators use the full zone registry. Missing spatial assignments are excluded, never assigned a zero-valued zone. A zero venue count is absence in the snapshot only.

Windows: Early [20,24); Midnight [0,4); Closing [4,8); Day [8,20). Groups: Low 0–4, Medium 5–14, High ≥15 observed venues.

Offense mapping: Violent = FELONY ASSAULT, ROBBERY, RAPE, MURDER & NON-NEGL. MANSLAUGHTER. Property = GRAND LARCENY, PETIT LARCENY, BURGLARY, GRAND LARCENY OF MOTOR VEHICLE. Drug = descriptions containing DRUG. Disorder = DISORDERLY CONDUCT, HARRASSMENT 2 (source spelling), CRIMINAL MISCHIEF & RELATED OF. Other = remaining descriptions, including missing. These categories do not constitute a comprehensive legal taxonomy.
