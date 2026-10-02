"""Rebuild the evidence pack and offline report using only Python's standard library."""
import calendar
import csv
import json
import random
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MONTHS = [f"{y}-{m:02}" for y in range(2019, 2024) for m in range(1, 13)]


def read(name):
    with (ROOT / 'data/processed' / name).open() as f:
        return list(csv.DictReader(f))


def pct(a, b):
    return None if not a else 100 * (b / a - 1)


def bootstrap(pairs, seed=9750, reps=2000):
    """Percentile interval from resampled complete paired months; not causal inference."""
    rng = random.Random(seed)
    values = []
    for _ in range(reps):
        sample = rng.choices(pairs, k=len(pairs))
        a, b = sum(p[0] for p in sample), sum(p[1] for p in sample)
        if a:
            values.append(pct(a, b))
    values.sort()
    return [values[int(.025 * len(values))], values[int(.975 * len(values))]] if values else [None, None]


def bootstrap_difference(low_pairs, high_pairs, seed=9750, reps=2000):
    """Same sampled month indices for both groups preserve paired temporal variation."""
    if len(low_pairs) != len(high_pairs):
        raise ValueError('Groups must use the same ordered months')
    rng = random.Random(seed)
    values = []
    for _ in range(reps):
        ix = rng.choices(range(len(low_pairs)), k=len(low_pairs))
        la, lb = (sum(low_pairs[i][j] for i in ix) for j in (0, 1))
        ha, hb = (sum(high_pairs[i][j] for i in ix) for j in (0, 1))
        if la and ha:
            values.append(pct(ha, hb) - pct(la, lb))
    values.sort()
    return [values[int(.025 * len(values))], values[int(.975 * len(values))]] if values else [None, None]


def group_for(venues, high=15):
    return 'High' if venues >= high else 'Medium' if venues >= 5 else 'Low'


def make_evidence(rows, zones, monthly, audit):
    lookup = {z['LocationID']: z for z in zones}
    if len(lookup) != len(zones):
        raise ValueError('Zone lookup must have one row per LocationID')
    if sum(r['n'] for r in rows) != audit['matched_rows']:
        raise ValueError('Cube does not reconcile to matched records')
    if sum(int(r['n']) for r in monthly) != audit['matched_rows']:
        raise ValueError('Monthly aggregates do not reconcile')
    findings, pair_lookup = [], {}
    for group in ['All', 'Low', 'Medium', 'High']:
        counts = defaultdict(int)
        for r in monthly:
            if group == 'All' or r['cohort'] == group:
                counts[r['month'], r['period']] += int(r['n'])
        pairs = [(counts[m, 'Early'], counts[m, 'Midnight']) for m in MONTHS]
        closing = [(counts[m, 'Midnight'], counts[m, 'Closing']) for m in MONTHS]
        pair_lookup[group] = pairs
        a, b, c = sum(p[0] for p in pairs), sum(p[1] for p in pairs), sum(p[1] for p in closing)
        findings.append(dict(cohort=group, zones=sum(group == 'All' or z['cohort'] == group for z in zones),
                             early=a, midnight=b, closing=c, change=pct(a, b), interval=bootstrap(pairs),
                             closing_change=pct(b, c), closing_interval=bootstrap(closing)))
    sensitivity = []
    for threshold in [10, 15, 20]:
        ids = {z['LocationID'] for z in zones if z['venues'] >= threshold}
        early = sum(r['n'] for r in rows if r['LocationID'] in ids and r['hour'] >= 20)
        midnight = sum(r['n'] for r in rows if r['LocationID'] in ids and r['hour'] < 4)
        sensitivity.append(dict(threshold=threshold, zones=len(ids), early=early, midnight=midnight, change=pct(early, midnight)))
    years = []
    for year in range(2019, 2024):
        yr = [r for r in rows if r['year'] == year]
        a = sum(r['n'] for r in yr if r['hour'] >= 20)
        b = sum(r['n'] for r in yr if r['hour'] < 4)
        years.append(dict(year=year, early=a, midnight=b, change=pct(a, b), days=366 if calendar.isleap(year) else 365))
    high, low = findings[3], findings[1]
    return dict(findings=findings, sensitivity=sensitivity, annual=years,
                gradient=dict(difference_pp=high['change'] - low['change'],
                              interval=bootstrap_difference(pair_lookup['Low'], pair_lookup['High'])),
                coverage=dict(zones=len(zones), observed_zones=sum(z['venues'] > 0 for z in zones),
                              matched_venues=sum(z['venues'] for z in zones),
                              retained_pct=100 * audit['matched_rows'] / audit['raw_rows'],
                              snapshot=audit['venues_snapshot']))


def build():
    rows, zones, monthly = read('cube.csv'), read('zones.csv'), read('monthly.csv')
    for r in rows:
        for key in ['year', 'LocationID', 'hour', 'n']:
            r[key] = int(r[key])
    for z in zones:
        for key in ['LocationID', 'venues']:
            z[key] = int(z[key])
    audit = json.loads((ROOT / 'data/processed/audit.json').read_text())
    evidence = make_evidence(rows, zones, monthly, audit)
    payload = dict(rows=[[r[k] for k in ['year', 'LocationID', 'hour', 'type', 'n']] for r in rows],
                   zones=zones, monthly=[[r['month'], r['cohort'], r['period'], int(r['n'])] for r in monthly],
                   geo=json.loads((ROOT / 'data/processed/zones.geojson').read_text()), audit=audit, evidence=evidence)
    html = (ROOT / 'python/dashboard.html').read_text()
    html = html.replace('__STYLES__', (ROOT / 'python/dashboard.css').read_text())
    html = html.replace('__SCRIPT__', (ROOT / 'python/dashboard.js').read_text())
    html = html.replace('__DATA__', json.dumps(payload, separators=(',', ':')).replace('<', '\\u003c'))
    (ROOT / 'docs/index.html').write_text(html)
    (ROOT / 'data/processed/findings.json').write_text(json.dumps(evidence['findings'], indent=2) + '\n')
    (ROOT / 'data/processed/evidence.json').write_text(json.dumps(evidence, indent=2) + '\n')
    lines = ['# What changes after midnight?', '',
             'Rebuilt evidence from the original NYPD, venue and taxi-zone snapshots. Counts describe reported complaints, not visitor-adjusted risk.', '',
             '| Observed venue group | Zones | 8 PM–midnight | Midnight–4 AM | Change | 95% paired-month interval |',
             '|---|---:|---:|---:|---:|---:|']
    for f in evidence['findings']:
        lines.append(f"| {f['cohort']} | {f['zones']} | {f['early']:,} | {f['midnight']:,} | {f['change']:.1f}% | {f['interval'][0]:.1f}% to {f['interval'][1]:.1f}% |")
    overall = evidence['findings'][0]
    g = evidence['gradient']
    lines += ['', '## Five answers', '',
              f"1. **Midnight increase?** Overall counts fall {abs(overall['change']):.1f}% across equal four-hour windows. The descriptive result runs against the increase hypothesis.",
              f"2. **After 4 AM?** Counts fall a further {abs(overall['closing_change']):.1f}% relative to midnight–4 AM. A clock-time contrast cannot identify a closing-time effect.",
              f"3. **Venue-group difference?** High minus Low midnight change is {g['difference_pp']:.1f} percentage points (paired-month 95% interval {g['interval'][0]:.1f} to {g['interval'][1]:.1f}). High contains one zone, so this is not a replicated high-venue district finding.",
              '4. **Offense composition?** The dashboard shows counts and shares by window. Compare the mix as well as the total; no offense-specific causal test is claimed.',
              f"5. **Persistence?** After-midnight counts are lower in {sum(y['change'] < 0 for y in evidence['annual'])} of five years for the full-city snapshot.", '',
              '## Threshold sensitivity', '', '| High-group threshold | Zones | Midnight change |', '|---|---:|---:|']
    for s in evidence['sensitivity']:
        change = 'Not estimable' if s['change'] is None else f"{s['change']:.1f}%"
        lines.append(f"| ≥{s['threshold']} observed venues | {s['zones']} | {change} |")
    lines += ['', 'Intervals use 60 complete paired months, 2,000 bootstrap draws and seed 9750. Group differences resample the same months jointly. They do not account for serial correlation, incomplete venue coverage, historical venue turnover, missing footfall exposure or causal confounding.', '',
              'See [how the data were joined](data-joining.md) for join keys, spatial rules, cardinality and reconciliation.']
    (ROOT / 'docs/findings.md').write_text('\n'.join(lines) + '\n')
    print('Built offline dashboard, findings and evidence.json')


if __name__ == '__main__':
    build()
