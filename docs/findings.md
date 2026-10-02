# What changes after midnight?

Rebuilt evidence from the original NYPD, venue and taxi-zone snapshots. Counts describe reported complaints, not visitor-adjusted risk.

| Observed venue group | Zones | 8 PM–midnight | Midnight–4 AM | Change | 95% paired-month interval |
|---|---:|---:|---:|---:|---:|
| All | 259 | 443,130 | 292,989 | -33.9% | -34.8% to -33.0% |
| Low | 245 | 416,116 | 274,224 | -34.1% | -35.0% to -33.2% |
| Medium | 13 | 25,880 | 17,837 | -31.1% | -32.8% to -29.3% |
| High | 1 | 1,134 | 928 | -18.2% | -29.5% to -3.8% |

## Five answers

1. **Midnight increase?** Overall counts fall 33.9% across equal four-hour windows. The descriptive result runs against the increase hypothesis.
2. **After 4 AM?** Counts fall a further 39.5% relative to midnight–4 AM. A clock-time contrast cannot identify a closing-time effect.
3. **Venue-group difference?** High minus Low midnight change is 15.9 percentage points (paired-month 95% interval 4.6 to 30.3). High contains one zone, so this is not a replicated high-venue district finding.
4. **Offense composition?** The dashboard shows counts and shares by window. Compare the mix as well as the total; no offense-specific causal test is claimed.
5. **Persistence?** After-midnight counts are lower in 5 of five years for the full-city snapshot.

## Threshold sensitivity

| High-group threshold | Zones | Midnight change |
|---|---:|---:|
| ≥10 observed venues | 2 | -22.9% |
| ≥15 observed venues | 1 | -18.2% |
| ≥20 observed venues | 0 | Not estimable |

Intervals use 60 complete paired months, 2,000 bootstrap draws and seed 9750. Group differences resample the same months jointly. They do not account for serial correlation, incomplete venue coverage, historical venue turnover, missing footfall exposure or causal confounding.

See [how the data were joined](data-joining.md) for join keys, spatial rules, cardinality and reconciliation.
