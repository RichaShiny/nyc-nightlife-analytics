// Execute report logic against a minimal DOM stub; this is not a visual browser test.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const html=fs.readFileSync('docs/index.html','utf8');const script=html.match(/<script>([\s\S]*)<\/script>/)[1];
const elements={};const ids=['year','borough','cohort','type','metric'];
function get(id){return elements[id] ||= {value:id==='metric'?'count':'all',innerHTML:'',textContent:'',style:{},insertAdjacentHTML(where,s){this.innerHTML+=s},set selectedIndex(n){this.value=this===elements.metric?'count':'all'}}}
const context={console,Set,Map,Blob,URL,setTimeout,document:{getElementById:get,querySelectorAll:()=>ids.map(get),addEventListener(){},createElement:()=>({click(){}})}};
vm.createContext(context);vm.runInContext(script,context);

assert(get('hour').innerHTML.includes('<polyline'));
assert(get('map').innerHTML.includes('<path'));
assert(!get('cards').innerHTML.includes('NaN'));
const initial=get('cards').innerHTML;
get('year').value='2020';get('cohort').value='High';get('metric').value='rate';vm.runInContext('render()',context);
assert.notEqual(initial,get('cards').innerHTML);
assert(!get('hour').innerHTML.includes('NaN'));
get('borough').value='Bronx';vm.runInContext('render()',context);
assert(get('cards').innerHTML.includes('Not estimable'));
get('reset').onclick();assert.equal(initial,get('cards').innerHTML);
console.log('Dashboard logic checks passed: initial render, filters, rates, empty group, reset.');
