// Computational rendering tests. A DOM stub does not replace a visual browser review.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('docs/index.html','utf8');
const scripts=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
const elements={};
function get(id){return elements[id] ||= {value:['metric','mapMetric'].includes(id)?'count':id==='zoneFocus'?'':'all',innerHTML:'',textContent:'',hidden:false,style:{},listeners:{},insertAdjacentHTML(where,s){this.innerHTML+=s},addEventListener(name,fn){this.listeners[name]=fn},set selectedIndex(n){this.value=['metric','mapMetric'].includes(id)?'count':'all'}};}
const context={console,Blob,URL,setTimeout,document:{getElementById:get,addEventListener(){},createElement:()=>({click(){}})}};
vm.createContext(context);vm.runInContext(scripts,context);
const evaluate=s=>vm.runInContext(s,context), render=()=>evaluate('render()');
const chartIds=['hour','windows','annual','heatmap','map','boroughChart','scatter','ranking','offenseHours','composition','forest','sensitivity','monthlyChart','cohortComparison'];
for(const id of chartIds){assert(get(id).innerHTML.includes('<svg'),id);assert(!/NaN|Infinity|undefined/.test(get(id).innerHTML),id+' has invalid values');}
assert.equal(evaluate('currentTotals.night'),913446);assert.equal(evaluate('currentZones.length'),259);
assert.equal(get('verdictValue').textContent,'-33.9%');
assert.equal(evaluate('days(2020)'),366);assert.equal(evaluate('days("all")'),1826);
const initial=get('cards').innerHTML,reference=get('forest').innerHTML,monthly=get('monthlyChart').innerHTML;
get('year').value='2020';get('cohort').value='High';get('metric').value='rate';render();
assert.equal(evaluate('currentZones.length'),1);assert.equal(reference,get('forest').innerHTML);assert.equal(monthly,get('monthlyChart').innerHTML);
const baseRows=evaluate('filterRows(state(), ["year"]).length');get('year').value='2023';render();assert.equal(baseRows,evaluate('filterRows(state(), ["year"]).length'));
const cohorts=get('cohortComparison').innerHTML;get('cohort').value='Low';render();assert.equal(cohorts,get('cohortComparison').innerHTML,'Group comparison omits cohort filter');get('cohort').value='High';render();
const composition=get('composition').innerHTML;get('type').value='Drug';render();assert.equal(composition,get('composition').innerHTML,'Composition intentionally ignores offense filter');
get('borough').value='Bronx';render();assert.equal(get('verdictValue').textContent,'Not estimable');assert.equal(get('emptyNotice').hidden,false);
for(const id of chartIds)assert(!/NaN|Infinity|undefined/.test(get(id).innerHTML),id+' invalid on empty group');
get('reset').onclick();assert.equal(initial,get('cards').innerHTML);assert.equal(get('emptyNotice').hidden,true);
get('zoneFocus').value='239';get('zoneFocus').onchange();assert(get('zoneDetail').innerHTML.includes('Upper West Side South'));
get('mapMetric').value='change';get('mapMetric').onchange();assert(get('mapLegend').innerHTML.includes('Decrease'));
get('mapMetric').value='venues';get('mapMetric').onchange();assert(get('mapLegend').innerHTML.includes('observed venues'));
get('reset').onclick();assert.equal(initial,get('cards').innerHTML);
if(process.env.CHART_EXPORT_DIR){fs.mkdirSync(process.env.CHART_EXPORT_DIR,{recursive:true});for(const id of chartIds){let out=get(id).innerHTML.replace('<svg ','<svg xmlns="http://www.w3.org/2000/svg" ').replace('<title>','<style>text{font-family:Arial;font-size:11px;fill:#667577}.label{fill:#253b3c;font-weight:bold}.tiny{font-size:9px}.gridline{stroke:#e5e8e2;stroke-width:1}.baseline{stroke:#a0afaa;stroke-width:1}</style><title>');fs.writeFileSync(process.env.CHART_EXPORT_DIR+'/'+id+'.svg',out);}}
console.log('Dashboard checks passed: 14 charts, known totals, leap-day denominator, filter scopes, fixed reference panels, empty groups, zone inspection, map modes and reset.');
