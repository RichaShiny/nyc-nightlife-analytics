# How the data were joined

This project combines three different source layers: NYPD complaint records, a historical nightlife-venue snapshot, and NYC Taxi & Limousine Commission taxi-zone polygons. The join is spatial rather than name-based because the complaint and venue records are point locations while the analytical geography is the taxi zone.

## Join flow

### 1. Standardize the taxi-zone geography

Taxi-zone polygons are transformed to EPSG:2263, repaired with `st_make_valid()`, and filtered to exclude EWR. Geometry is then grouped by `LocationID` so each analytical zone has one unique identifier, zone name, and borough.

This step matters because the same `LocationID` must be the stable key used later for venue counts, complaint counts, cohort assignment, the dashboard map, and all denominators.

### 2. Assign nightlife venues to taxi zones

The venue snapshot is deduplicated by venue `id`, rows without finite latitude/longitude are removed, and the remaining points are converted from WGS84 (EPSG:4326) to EPSG:2263.

Each venue point is assigned with `st_within()`. A venue receives a `LocationID` only when it falls inside exactly one taxi-zone polygon. Boundary or outside points remain unmatched rather than being pushed to the nearest zone.

Venue counts are then aggregated by `LocationID` and left-joined back to the complete zone table. Missing venue counts are filled with zero so zones with no observed venue in the snapshot are retained in the analysis.

Observed venue cohorts are defined as:

- Low: 0–4 observed venues
- Medium: 5–14 observed venues
- High: 15+ observed venues

These are snapshot-based groups. A zero does not prove that a zone historically had no nightlife venues.

### 3. Clean and spatially assign complaint records

Complaint records are deduplicated by `CMPLNT_NUM`. The pipeline derives occurrence date and hour, converts latitude/longitude to numeric values, and keeps records from January 1, 2019 through December 31, 2023 with valid hours and plausible NYC-area coordinates.

To avoid repeating the same spatial calculation for identical coordinates, the pipeline first creates a unique longitude/latitude table. Those unique points are assigned to taxi zones using the same `st_within()` rule as the venue points. The resulting `LocationID` is then joined back to the complaint rows by longitude and latitude.

Complaints without a unique taxi-zone match remain unmatched and are excluded from the analytical cube. They are still counted in the audit output.

### 4. Join complaint rows to nightlife intensity

Once each eligible complaint has a `LocationID`, the complaint table is joined to the zone table on `LocationID`. This attaches the zone's observed venue cohort to every matched complaint.

The core relationship is therefore:

```
venue point  -> taxi-zone LocationID -> venue count -> observed venue cohort
complaint point -> taxi-zone LocationID ----------------^
```

There is no fuzzy matching between business names and complaints, no address-string join, and no nearest-neighbor reassignment.

### 5. Aggregate for analysis and dashboarding

The matched complaint data are aggregated into:

- `cube.csv`: year × taxi zone × hour × offense group
- `monthly.csv`: month × observed venue cohort × comparison period
- `zones.csv`: taxi-zone metadata, borough, venue count, and cohort
- `zones.geojson`: simplified taxi-zone geometry for the dashboard
- `audit.json`: source fingerprints and row-loss diagnostics

The Python builder consumes these aggregates rather than individual complaint coordinates. This keeps the browser report compact, reproducible, and appropriately aggregated.

## Join validation

The pipeline checks that `LocationID` is unique in the zone lookup and that the number of complaints represented in the analytical cube matches the audited count of spatially matched complaint records.

The audit also records duplicate complaint IDs, invalid or out-of-scope rows, unmatched complaint coordinates, unmatched venue points, and source-file fingerprints.

## Interpretation limits

The spatial join establishes geographic co-location at the taxi-zone level. It does not establish that a complaint occurred at a specific venue, was caused by nightlife activity, involved a venue patron, or reflects visitor-adjusted risk.

The nightlife snapshot is incomplete and is applied across 2019–2023. Stronger causal or risk claims would require historical venue coverage, footfall or patron exposure, finer event context, and a stronger identification strategy.
