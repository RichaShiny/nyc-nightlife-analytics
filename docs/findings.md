# Findings from the rebuilt snapshot

These are spatially matched NYPD complaints, not visitor-adjusted crime risks.

- **Low observed venue group (245 zones):** 416,116 early-evening complaints; 274,224 after midnight; change -34.1% (paired-month bootstrap 95% interval -35.0% to -33.2%). After 4 AM: -39.2% relative to midnight–4 AM.
- **Medium observed venue group (13 zones):** 25,880 early-evening complaints; 17,837 after midnight; change -31.1% (paired-month bootstrap 95% interval -32.8% to -29.3%). After 4 AM: -42.2% relative to midnight–4 AM.
- **High observed venue group (1 zones):** 1,134 early-evening complaints; 928 after midnight; change -18.2% (paired-month bootstrap 95% interval -29.5% to -3.8%). After 4 AM: -56.4% relative to midnight–4 AM.

Intervals resample 60 months, paired across windows, with 2,000 draws and seed 9750. They describe temporal variability under independent-month resampling; serial correlation and snapshot selection are not covered. No causal effect or personal risk is identified.

Matched complaints: 2,402,449. Unmatched spatial records: 193. See audit.json for exclusions.
