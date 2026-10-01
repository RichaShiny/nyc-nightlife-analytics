"""Build an offline, interactive report from R-generated aggregates. Standard library only."""
import csv, json, calendar, random, statistics
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def read(name):
    with (ROOT/'data/processed'/name).open() as f: return list(csv.DictReader(f))
def pct(a,b): return None if not a else 100*(b/a-1)
def bootstrap(pairs,seed=9750,reps=2000):
    rng=random.Random(seed); values=[]
    for _ in range(reps):
        sample=rng.choices(pairs,k=len(pairs)); a=sum(p[0] for p in sample); b=sum(p[1] for p in sample)
        if a: values.append(pct(a,b))
    values.sort()
    return [values[int(.025*len(values))],values[int(.975*len(values))]] if values else [None,None]
def build():
    rows=read('cube.csv'); zones=read('zones.csv'); monthly=read('monthly.csv')
    for r in rows:
        for k in ['year','LocationID','hour','n']: r[k]=int(r[k])
    for z in zones:
        for k in ['LocationID','venues']: z[k]=int(z[k])
    lookup={z['LocationID']:z for z in zones}
    assert len(lookup)==len(zones)
    audit=json.loads((ROOT/'data/processed/audit.json').read_text())
    assert sum(r['n'] for r in rows)==audit['matched_rows']
    months=[f'{y}-{m:02}' for y in range(2019,2024) for m in range(1,13)]
    findings=[]
    for group in ['Low','Medium','High']:
        counts={(r['month'],r['period']):int(r['n']) for r in monthly if r['cohort']==group}
        # Resample complete paired months; descriptive intervals, not causal tests.
        pairs=[(counts.get((m,'Early'),0),counts.get((m,'Midnight'),0)) for m in months]
        closing=[(counts.get((m,'Midnight'),0),counts.get((m,'Closing'),0)) for m in months]
        findings.append(dict(cohort=group,zones=sum(z['cohort']==group for z in zones),early=sum(a for a,b in pairs),midnight=sum(b for a,b in pairs),change=pct(sum(a for a,b in pairs),sum(b for a,b in pairs)),interval=bootstrap(pairs),closing_change=pct(sum(a for a,b in closing),sum(b for a,b in closing))))
    payload=dict(rows=[[r[k] for k in ['year','LocationID','hour','type','n']] for r in rows],zones=zones,geo=json.loads((ROOT/'data/processed/zones.geojson').read_text()),audit=audit,findings=findings)
    html=(ROOT/'python/dashboard.html').read_text().replace('__DATA__',json.dumps(payload,separators=(',',':')))
    (ROOT/'docs/index.html').write_text(html)
    (ROOT/'data/processed/findings.json').write_text(json.dumps(findings,indent=2))
    lines=['# Findings from the rebuilt snapshot','', 'These are spatially matched NYPD complaints, not visitor-adjusted crime risks.','']
    for f in findings:
        lines.append(f"- **{f['cohort']} observed venue group ({f['zones']} zones):** {f['early']:,} early-evening complaints; {f['midnight']:,} after midnight; change {f['change']:.1f}% (paired-month bootstrap 95% interval {f['interval'][0]:.1f}% to {f['interval'][1]:.1f}%). After 4 AM: {f['closing_change']:.1f}% relative to midnight–4 AM.")
    lines+=['','Intervals resample 60 months, paired across windows, with 2,000 draws and seed 9750. They describe temporal variability under independent-month resampling; serial correlation and snapshot selection are not covered. No causal effect or personal risk is identified.','',f"Matched complaints: {audit['matched_rows']:,}. Unmatched spatial records: {audit['unmatched_complaints']:,}. See audit.json for exclusions."]
    (ROOT/'docs/findings.md').write_text('\n'.join(lines)+'\n')
    print('Built docs/index.html and findings.md')
if __name__=='__main__': build()
