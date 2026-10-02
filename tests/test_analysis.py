import unittest, sys, json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'python'))
from build import read,pct,bootstrap,ROOT
class AnalysisTests(unittest.TestCase):
    def test_direction_and_zero(self):
        self.assertAlmostEqual(pct(100,80),-20)
        self.assertIsNone(pct(0,5))
    def test_bootstrap_constant_pair(self):
        lo,hi=bootstrap([(100,80)]*60,reps=100)
        self.assertAlmostEqual(lo,-20);self.assertAlmostEqual(hi,-20)
    def test_conservation(self):
        audit=json.loads((ROOT/'data/processed/audit.json').read_text())
        self.assertEqual(sum(int(r['n']) for r in read('cube.csv')),audit['matched_rows'])
        self.assertEqual(sum(int(r['n']) for r in read('monthly.csv')),audit['matched_rows'])
        self.assertEqual(audit['raw_rows'],sum(audit[k] for k in ['duplicate_ids','invalid_or_outside_scope','unmatched_complaints','matched_rows']))
    def test_zone_registry(self):
        zs=read('zones.csv'); ids={z['LocationID'] for z in zs}
        self.assertEqual(len(zs),len(ids))
        for r in read('cube.csv'):
            self.assertIn(r['LocationID'],ids);self.assertTrue(0<=int(r['hour'])<24);self.assertGreater(int(r['n']),0)
        for z in zs:
            n=int(z['venues']);self.assertEqual(z['cohort'],'High' if n>=15 else 'Medium' if n>=5 else 'Low')
    def test_no_external_dashboard_dependencies(self):
        html=(ROOT/'docs/index.html').read_text()
        self.assertNotIn('__DATA__',html);self.assertNotIn('<script src=',html)

class EvidenceTests(unittest.TestCase):
    def test_paired_group_difference(self):
        from build import bootstrap_difference
        lo, hi = bootstrap_difference([(100,80)]*60, [(100,90)]*60, reps=100)
        self.assertAlmostEqual(lo,10); self.assertAlmostEqual(hi,10)
        self.assertEqual(bootstrap_difference([(0,0)],[(0,0)],reps=10),[None,None])
    def test_reference_reconciles(self):
        e=json.loads((ROOT/'data/processed/evidence.json').read_text())
        all_groups=e['findings'][0]
        for key in ['early','midnight','closing','zones']:
            self.assertEqual(all_groups[key],sum(f[key] for f in e['findings'][1:]))
        self.assertEqual(sum(r['early'] for r in e['annual']),all_groups['early'])
        self.assertEqual(sum(r['midnight'] for r in e['annual']),all_groups['midnight'])
        self.assertEqual(sum(r['days'] for r in e['annual']),1826)
    def test_sensitivity_sample(self):
        e=json.loads((ROOT/'data/processed/evidence.json').read_text())
        z=read('zones.csv')
        for row in e['sensitivity']:
            self.assertEqual(row['zones'],sum(int(v['venues'])>=row['threshold'] for v in z))
            if row['zones']==0: self.assertIsNone(row['change'])
    def test_venue_audit(self):
        e=json.loads((ROOT/'data/processed/evidence.json').read_text())['coverage']
        a=json.loads((ROOT/'data/processed/audit.json').read_text())
        self.assertEqual(e['matched_venues']+a['venues_unmatched'],e['snapshot'])
        self.assertEqual(e['observed_zones'],sum(int(z['venues'])>0 for z in read('zones.csv')))

if __name__=='__main__':unittest.main()
