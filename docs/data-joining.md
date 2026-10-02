# How the three datasets become one analysis

The unit connecting this project is a **TLC taxi zone**, identified by `LocationID`. We do not join a complaint directly to a business, choose the nearest venue, or claim that a complaint happened inside a nightlife establishment. Instead, complaint points and venue points independently receive a taxi-zone ID. A unique zone lookup then attaches the observed venue count and group label to each zone's complaint counts.

## 1. Inputs and what each contributes

| Input | Source grain | Used fields | Purpose |
|---|---|---|---|
| Original NYPD historic RDS snapshot | Complaint record | `CMPLNT_NUM`, `CMPLNT_FR_DT`, `CMPLNT_FR_TM`, `OFNS_DESC`, `Latitude`, `Longitude` | Timing, offense category and spatial location |
| Original Yelp-derived RDS snapshot | Venue listing | `id`, `lat`, `lon` | Observed nightlife venue count within a zone |
| TLC taxi-zone RDS snapshot | Polygon feature | `LocationID`, `zone`, `borough`, geometry | A common spatial reference and denominator registry |

The source snapshots were found in the original local project referenced by the supplied PDF. They are not fresh API downloads. `data/processed/audit.json` records source MD5 fingerprints. A newly downloaded venue inventory could produce a different analysis and must not be described as an exact reproduction.

## 2. Clean complaint records before joining

`R/prepare.R` starts with **2,404,692** source records. It retains the first record per `CMPLNT_NUM`, removing **2,047** repeated IDs. The rule follows source order; it does not select a latest revision by a timestamp.

Occurrence-start dates are parsed as month/day/year. Time is converted from seconds to the hour when stored as an R `difftime`; otherwise the hour comes from the time string. Eligible records have dates from 2019-01-01 through 2023-12-31, hours 0–23, finite coordinates, and coordinates inside a broad screening box (latitude 40–42, longitude −75 to −72). **Three** records are invalid or outside those restrictions. This box is a preliminary validity check, not the final NYC boundary.

Using occurrence-start time rather than report time aligns the analysis to when an event was recorded as starting. Approximate or default times can still concentrate observations at certain hours. No adjustment for those time-quality issues is claimed.

## 3. Prepare a common spatial reference

The taxi-zone features are projected to **EPSG:2263**, repaired with `st_make_valid()`, and filtered to exclude EWR. Features sharing a `LocationID` are dissolved with `group_by(LocationID)` and `summarise()`, producing **259 unique NYC zone IDs**. The code asserts that no duplicate IDs remain.

Complaint and venue coordinates are first represented as WGS84 (EPSG:4326) points, then projected to EPSG:2263. A common coordinate reference system is necessary before evaluating spatial containment. Coordinates are not compared as raw strings, and borough text is not used to infer a zone. Zone names and boroughs come from the zone polygons.

## 4. Make two independent spatial assignments

The same `assign_zone()` helper is used for both datasets:

```r
hits <- st_within(points, zones)
# Exactly one hit: return that zone's LocationID.
# Zero hits or multiple hits: return NA.
```

`st_within()` is strict about a point being in a polygon's interior. A point on a boundary, outside all polygons, or within multiple polygons does not get forced to the closest zone. **193 complaint records** fail unique containment and are excluded. The audit stores their combined count; it does not split them into outside, boundary and overlap reasons.

To reduce computation, the complaint pipeline spatially evaluates each unique longitude/latitude pair once. That coordinate lookup is then joined back by `(lon, lat)`. Shared coordinates do not collapse distinct complaint IDs: every eligible complaint keeps its row, while the lookup supplies one zone ID.

Venue listings are deduplicated by `id`, restricted to finite coordinates, and assigned independently. The cleaned snapshot has **244 unique venue records**; **226** match a taxi zone and **18** remain unmatched. The audit's venue snapshot count is measured after those venue-cleaning steps; it is not a complete NYC venue census.

## 5. Join zone attributes without multiplying complaints

Matched venues are counted by `LocationID`. The counts are **left-joined onto the full zone registry**, not used as an inner-join filter. Zones without a matched listing receive a count of **zero observed venues**. This preserves all 259 zones, including zeros, for counts and denominators.

| Join | Key | Cardinality | Why it matters |
|---|---|---|---|
| Unique complaint coordinates → zone assignment | Longitude + latitude | One coordinate pair to at most one zone | Reuses spatial results without collapsing distinct complaints |
| Complaint records → coordinate lookup | Longitude + latitude | Many complaints to one coordinate result | Does not multiply complaint rows |
| Full zone registry → venue counts | LocationID | One zone to zero or one count row | Keeps zero-observed-venue zones |
| Complaint aggregates → zone attributes | LocationID | Many cube rows to one zone | Each aggregate gets one cohort and borough |
| Monthly complaint records → cohort lookup | LocationID | Many complaints to one zone | Supports cohort/window/month totals |

The labels are **Low: 0–4; Medium: 5–14; High: 15+ observed venues**. They describe a count in a sample, not venues per square kilometer and not actual nightlife activity. The resulting groups contain 245 Low, 13 Medium and 1 High zone. Only 84 zones have a nonzero observed venue count.

The all-hours cube is stored separately from `zones.csv`. Python and the dashboard associate the cube's `LocationID` with a unique zone lookup; R joins the cohort lookup directly when making monthly aggregates. Both use the same registry. The exported files do not require an expensive spatial join to open the dashboard.

## 6. Reconcile and aggregate

The complaint audit closes exactly:

```text
2,404,692 raw records
−   2,047 repeated complaint IDs
−       3 invalid / outside date-time-coordinate scope
−     193 not uniquely within a taxi zone
=2,402,449 matched complaint records
```

The cube sums to 2,402,449, as does the independently grouped monthly output. Of these, **913,446** occur in the overnight window (8 PM–8 AM): 443,130 early, 292,989 after midnight, and 177,327 after 4 AM. The dashboard's default headline is therefore a **33.9% decline** from early evening to after midnight, rather than an increase.

`cube.csv` has grain **year × LocationID × clock hour × offense group**. `monthly.csv` has grain **calendar month × observed venue group × time window**. Absent combinations are treated as zero counts, while denominators come from the complete zone registry and calendar—not from the number of nonzero rows.

## 7. What the display does and does not normalize

The three comparison windows are each four clock hours: 8 PM–midnight, midnight–4 AM and 4–8 AM. Changes use `(later / earlier − 1) × 100`. A zero earlier count produces “Not estimable,” not infinity or a zero-percent change.

The optional volume display divides by **selected zones × calendar days**. The full five-year period has 1,826 calendar days; 2020 has 366. A window chart's value is a four-hour count per zone/day; an hourly chart's value is a one-hour count per zone/day. Monthly charts divide by each month's day count. There is no visitor, population, venue-capacity or footfall denominator.

Dates follow recorded calendar dates. Post-midnight events are not reassigned to a preceding business night, and daylight-saving exposure is not adjusted. The same venue snapshot is applied to every year; historical openings, closures and turnover are unknown.

## 8. Display geometry is not analysis geometry

The point-in-polygon assignments use the prepared, unsimplified zone boundaries. Only after analysis, the geometry is simplified with a 100-foot tolerance in EPSG:2263 and transformed to WGS84 for the interactive map. This keeps the report portable without changing the assignment process. No individual complaint coordinates or raw venue listings are embedded in the report.

## Reproduce and inspect

Run `Rscript R/prepare.R /path/to/original/data` to regenerate aggregates from the exact snapshots, then `python3 python/build.py` for the evidence pack and dashboard. `tests/test_analysis.py` checks conservation, zone registry integrity, venue reconciliation and threshold sample sizes. The JSON audit includes the input fingerprints needed to distinguish a new snapshot from this one.
