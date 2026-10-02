# Validation

## Original source pipeline

The R source-to-aggregate pipeline completed on the original snapshots. This redesign does not change the underlying complaint cube, monthly aggregates, zone definitions or spatial assignments.

## Redesigned report

- Python rebuilds the dashboard, findings and machine-readable `evidence.json`.
- Nine Python tests cover percentage direction and zero baselines, constant-pair bootstrap behavior, paired group differences, source/aggregate reconciliation, zone registry integrity, venue coverage reconciliation, threshold sample sizes and offline embedding.
- JavaScript tests execute the generated report with a minimal DOM stub. They verify all 13 SVG figures, default overnight totals, leap-year denominators, filter scope exclusions, fixed reference panels, empty groups, map modes, zone inspection and reset.
- Chart SVGs are exported from the same executed JavaScript and rendered with Sharp for visual figure inspection. This checks figure labels and marks independently of a browser layout.

The current public dashboard was inspected before editing. The redesigned HTML's full browser layout, tooltips, scrolling, responsive behavior and download interaction still require browser review after merge. A prior local-file browser preview was blocked by browser security policy; the computational and SVG checks do not substitute for full browser verification.

Manual review: open the deployed dashboard at desktop and mobile widths; follow the six chapters; change each global filter; compare the labeled fixed reference section; inspect a map zone with both dropdown and pointer; expand a chart table; download the filtered cube; verify the join audit and final narrative.
