# Reading the redesigned dashboard

The report follows six chapters: the midnight question; geography and venues; offense patterns; evidence strength; joining methodology; and the conclusion. It has 14 numbered figures plus data-quality summaries and a join diagram.

| Figure | Question / view | Filter scope |
|---|---|---|
| 01 | 24-hour rhythm | All active filters |
| 02 | Equal four-hour windows | All active filters |
| 03 | Annual early/midnight/closing trends | All years; other filters apply; per zone/day |
| 04 | Overnight hour × year heatmap | All years; other filters apply; per zone/day |
| 05 | Filtered venue-group window comparison | All venue groups; other filters apply; own group denominators |
| 06 | Taxi-zone choropleth with inspection | All active filters; map metric can be volume, midnight change, or fixed venue count |
| 07 | Borough changes around midnight | All boroughs; other filters apply |
| 08 | Zone venue counts versus complaints/day | Active filters; each point is a zone |
| 09 | Top eight zones by overnight volume | Active filters; raw overnight counts |
| 10 | Stacked offense volume by hour | All offense types; other filters apply; volume display applies |
| 11 | Offense composition by window | All offense types; other filters apply; always shares |
| 12 | Group changes with bootstrap intervals | Fixed full-snapshot reference |
| 13 | High-venue threshold sensitivity | Fixed full-snapshot reference |
| 14 | 60-month early/midnight/closing trends | Fixed full-snapshot reference; counts/calendar day |

Scopes are labeled on the figures so a comparison cannot silently lose a group or year. Reference figures stay fixed intentionally. The bottom five-question summary is also a full-snapshot reference; the larger conclusion paragraph above it responds to filters.

The map's dropdown provides keyboard-accessible zone inspection, alongside clicking a polygon. Inspection changes the detail box only. Hoverable marks provide exact values. Expand “View chart values” for textual tables. The filtered cube download contains all 24 hours under the active year, borough, cohort and offense filters. A volume-display choice does not alter the exported counts.

## Visual direction

The presentation uses a dark navigation rail and introductory city map, warm paper backgrounds, an editorial title hierarchy, numbered figures, and restrained teal, amber and lavender accents. The map outline uses actual zone polygons. No external fonts, chart libraries, telemetry, map tiles or network fetches are required to view the report.

Source styles and behavior now live in `python/dashboard.css` and `python/dashboard.js`. `python/build.py` embeds them, data and markup into one `docs/index.html` for GitHub Pages and offline use.
