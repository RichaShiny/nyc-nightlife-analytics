# Research design

## Overarching question
Do the temporal patterns of reported complaints around observed nightlife venues support an after-midnight increase? This project addresses the safety component of the original broader nightlife-and-urban-economy question. It does not measure employment, spending or economic impact.

| Question | Directional hypothesis | Estimand / visualization | Interpretation |
|---|---|---|---|
| Q1: Midnight increase? | H1: midnight/early ratio > 1; null ratio = 1 | (midnight − early) / early; hourly profile and window bars | Descriptive association |
| Q2: Post-4 AM decline? | H1: closing/midnight ratio < 1; null ratio = 1 | 4–8 AM change vs 12–4 AM | A timing comparison, not evidence that closing caused a decline |
| Q3: Venue gradient? | H1: midnight change is greater in High than Low; null equal changes | Group filters and full-period results; zone map | One high-group zone cannot establish a general high-density effect |
| Q4: Offense composition? | H1: proportions differ by observed venue group; null equal proportions | Within-selection percentages and group filters | Exploratory; broad offense labels simplify heterogeneous events |
| Q5: Year consistency? | H1: midnight-change sign persists each year | Five-year comparison table | Avoid unequal-era totals; descriptive persistence, not pandemic causality |

## Units and denominators
One raw record is a complaint, not a person or conviction. The analytical cube groups year × taxi zone × occurrence hour × offense group. Three comparison windows each span four hours. Their percentage changes need no window-duration adjustment. The optional chart denominator is selected taxi zones × calendar days: 365 or 366 by year, 1,826 for the full period. For an hourly chart this represents the average count during that clock hour per zone/day; for window bars it represents a whole four-hour window per zone/day. It is never a person-time risk rate.

The same calendar date range is used for each clock-time window. This is not a paired nightlife-business-date design; post-midnight events are not moved to the preceding evening. Daylight-saving differences are not adjusted. Future weekend analysis should define an overnight business date before assigning weekday/weekend.

## Uncertainty
Python resamples 60 paired months with replacement 2,000 times (seed 9750). The 2.5th and 97.5th percentiles describe month-to-month variation in the aggregate percent change. Zeros are included for missing monthly group/window combinations. Independent-month resampling may understate uncertainty when months are serially correlated. These are exploratory intervals, not confirmatory causal tests. No p-value or “statistically proven” claim is made. Snapshot coverage and spatial measurement uncertainty are not included.

## Sensitivity work before stronger conclusions
The redesigned dashboard includes High-threshold sensitivity at 10, 15 and 20 observed venues; all sample sizes and null estimates are reported. Further work should test venue counts per land area; historical annual venue inventories; borough-stratified models with zone and month effects; alternate offense mappings; complete-night dates; and visitor exposure. The shipped dashboard supports borough, year and offense sensitivity exploration, but the additional models, historical inventories and exposure analyses are not implemented or claimed.


The High-minus-Low comparison uses the same resampled month indices for both groups, preserving within-month pairing. Results are percentage-point differences, not ratios of percentage changes. The one-zone High group remains a major generalizability constraint even when the descriptive interval excludes zero.
