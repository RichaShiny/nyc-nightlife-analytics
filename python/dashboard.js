/* Native SVG report: no external libraries, data requests or runtime dependencies. */
'use strict';
const $ = id => document.getElementById(id);
const Z = Object.fromEntries(D.zones.map(z => [z.LocationID, z]));
const GROUPS = ['Low', 'Medium', 'High'];
const TYPES = ['Property', 'Violent', 'Disorder', 'Drug', 'Other'];
const HOURS = [20,21,22,23,0,1,2,3,4,5,6,7];
const C = {teal:'#067e80', amber:'#b47724', lavender:'#8077af', red:'#b75c46', gray:'#9eaaa3'};
const TC = [C.teal, C.amber, C.lavender, C.red, C.gray];
const GC = {Low:C.teal, Medium:C.amber, High:C.lavender};
const fmt = n => Number(n).toLocaleString('en-US', {maximumFractionDigits:2});
const short = n => Math.abs(n)>=1e6 ? (n/1e6).toFixed(1)+'m' : Math.abs(n)>=1000 ? (n/1000).toFixed(1)+'k' : fmt(n);
const pc = (a,b) => a>0 ? 100*(b/a-1) : null;
const pp = n => n===null ? 'Not estimable' : (n>0?'+':'')+n.toFixed(1)+'%';
const esc = s => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const sum = xs => xs.reduce((a,b)=>a+b,0);
const days = y => y==='all'?1826:(Number(y)===2020?366:365);
const hourLabel = h => h===0?'12 AM':h<12?h+' AM':h===12?'12 PM':(h-12)+' PM';
const period = h => h>=20?0:h<4?1:h<8?2:3;
const windows = ['8 PM–midnight','Midnight–4 AM','4–8 AM'];
const svg = (title,content,w=640,h=310) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${content}</svg>`;
const txt = (x,y,t,cls='',anchor='start') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(t)}</text>`;
const tip = s => `class="mark" data-tip="${esc(s)}"`;
const noData = () => '<div class="no-data">No observations in this selection.</div>';
function table(id,heads,rows){$(id).innerHTML='<table><thead><tr>'+heads.map(h=>`<th scope="col">${esc(h)}</th>`).join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(v=>`<td>${esc(v===null?'Not estimable':v)}</td>`).join('')+'</tr>').join('')+'</tbody></table>';}
function niceMax(v){if(v<=0)return 1;const p=10**Math.floor(Math.log10(v));return Math.ceil(v/p)*p;}
function yGrid(max,{left=54,right=610,top=30,bottom=250}={}){return [0,.25,.5,.75,1].map(f=>{const y=bottom-f*(bottom-top);return `<line class="gridline" x1="${left}" x2="${right}" y1="${y}" y2="${y}"/>`+txt(left-9,y+4,short(max*f),'','end');}).join('');}
function lineChart(id,title,series,labels,{w=640,h=310,tickEvery=1,bands=[]}={}){
 const left=54,right=w-24,top=30,bottom=h-46,max=niceMax(Math.max(0,...series.flatMap(s=>s.values))),n=labels.length;
 const x=i=>left+(right-left)*i/Math.max(1,n-1),y=v=>bottom-(bottom-top)*v/max;
 let content=bands.map(b=>`<rect x="${x(b.start)}" y="${top}" width="${x(b.end)-x(b.start)}" height="${bottom-top}" fill="${b.color}"/>`).join('')+yGrid(max,{left,right,top,bottom});
 content+=labels.map((l,i)=>i%tickEvery===0?txt(x(i),h-17,l,'','middle'):'').join('');
 for(const s of series){content+=`<polyline points="${s.values.map((v,i)=>`${x(i)},${y(v)}`).join(' ')}" fill="none" stroke="${s.color}" stroke-width="2.5"/>`;content+=s.values.map((v,i)=>`<circle ${tip(`${labels[i]} · ${s.name}: ${fmt(v)}`)} cx="${x(i)}" cy="${y(v)}" r="${n>25?2.4:3.8}" fill="${s.color}"/>`).join('');}
 $(id).innerHTML=svg(title,content,w,h);
}
function filterRows(s,omit=[]){return D.rows.filter(r=>(omit.includes('year')||s.year==='all'||r[0]===+s.year)&&(omit.includes('borough')||s.borough==='all'||Z[r[1]].borough===s.borough)&&(omit.includes('cohort')||s.cohort==='all'||Z[r[1]].cohort===s.cohort)&&(omit.includes('type')||s.type==='all'||r[3]===s.type));}
function zoneScope(s,omit=[]){return D.zones.filter(z=>(omit.includes('borough')||s.borough==='all'||z.borough===s.borough)&&(omit.includes('cohort')||s.cohort==='all'||z.cohort===s.cohort));}
function totals(rows){const h=Array(24).fill(0),p=Array(4).fill(0),byZone={};for(const r of rows){h[r[2]]+=r[4];p[period(r[2])]+=r[4];if(period(r[2])<3)byZone[r[1]]=(byZone[r[1]]||0)+r[4];}return {h,p,byZone,night:sum(p.slice(0,3)),all:sum(p)};}
let currentRows=[],currentZones=[],currentState=null,currentTotals=null,selectedZone='';
function state(){return Object.fromEntries(['year','borough','cohort','type','metric'].map(id=>[id,$(id).value]));}
function render(){
 const s=state(),zs=zoneScope(s),rows=filterRows(s),t=totals(rows),den=s.metric==='rate'?Math.max(1,zs.length)*days(s.year):1;
 currentRows=rows;currentZones=zs;currentState=s;currentTotals=t;
 const change=pc(t.p[0],t.p[1]),closing=pc(t.p[1],t.p[2]);
 $('selectionStatus').textContent=`${s.year==='all'?'2019–2023':s.year} / ${s.borough==='all'?'All boroughs':s.borough} / ${s.cohort==='all'?'All venue groups':s.cohort+' observed venues'} / ${s.type==='all'?'All offenses':s.type} · ${zs.length} zones · ${fmt(rows.reduce((a,r)=>a+r[4],0))} complaints across 24 hours`;
 $('emptyNotice').hidden=t.all>0;
 $('verdictValue').textContent=pp(change);
 $('verdictTitle').textContent=change===null?'A zero baseline cannot support a percentage.':change<0?'Fewer complaints after midnight.':change>0?'More complaints after midnight.':'The two windows have equal counts.';
 $('verdictText').textContent=`${fmt(t.p[0])} complaints between 8 PM and midnight, versus ${fmt(t.p[1])} between midnight and 4 AM. ${change===null?'Broaden the selection to compare windows.':change<0?'This selection does not support the hypothesized after-midnight increase.':'This is a descriptive comparison; it does not establish a nightlife effect.'}`;
 
 $('cards').innerHTML=[[fmt(t.night),'Overnight complaints','8 PM–8 AM'],[pp(closing),'Change after 4 AM','Relative to midnight–4 AM'],[zs.length,'Taxi zones selected',zs.filter(z=>z.venues>0).length+' with observed venues'],[t.night?fmt(100*t.p[1]/t.night)+'%':'—','After-midnight share','Of selected overnight complaints']].map(([a,b,c])=>`<div class="metric"><strong>${a}</strong><span>${b}</span><span class="mini">${c}</span></div>`).join('');
 lineChart('hour','24-hour complaint profile',[{name:s.metric==='rate'?'Complaints per zone/day':'Complaints',values:t.h.map(v=>v/den),color:C.teal}],Array.from({length:24},(_,i)=>hourLabel(i)),{tickEvery:4,bands:[{start:0,end:3.5,color:'#e4f0eb'},{start:19.5,end:23,color:'#f7ecd9'}]});
 $('hourNote').innerHTML=`${s.metric==='rate'?'Complaints per zone per calendar day in each clock hour.':'Counts over the selected years.'} ${t.all?'The highest recorded clock hour is <b>'+hourLabel(t.h.indexOf(Math.max(...t.h)))+'</b>.':''} Occurrence-start times can be approximate, including midnight defaults.`;
 table('hourTable',['Hour',s.metric==='rate'?'Per zone/day':'Count'],t.h.map((n,i)=>[hourLabel(i),fmt(n/den)]));
 const wm=niceMax(Math.max(...t.p.slice(0,3))/den),ww=500,base=215;
 $('windows').innerHTML=svg('Equal four-hour complaint windows',yGrid(wm,{left:50,right:480,top:25,bottom:base})+t.p.slice(0,3).map((n,i)=>{const v=n/den,x=75+i*145,y=base-v/wm*170;return `<rect ${tip(windows[i]+': '+fmt(v))} x="${x}" y="${y}" width="83" height="${base-y}" fill="${[C.amber,C.teal,C.lavender][i]}"/>`+txt(x+41,y-10,short(v),'label','middle')+txt(x+41,245,['8 PM–12 AM','12–4 AM','4–8 AM'][i],'','middle');}).join(''),ww,275);
 $('windowNote').innerHTML=`Midnight change: <b>${pp(change)}</b>. Next-window change: <b>${pp(closing)}</b>. ${s.metric==='rate'?'Each bar is a four-hour window per zone/day.':'Each bar covers the same number of clock hours.'}`;
 table('windowsTable',['Window','Complaints',s.metric==='rate'?'Per zone/day':'Change from prior'],windows.map((w,i)=>[w,fmt(t.p[i]),s.metric==='rate'?fmt(t.p[i]/den):i?pp(pc(t.p[i-1],t.p[i])):'Baseline']));
 renderAnnual(s,zs);renderGeography(s,zs,t);renderOffenses(s,zs);
 $('conclusionLead').textContent=`In your selection, the midnight comparison is ${pp(change)} and the post-4 AM comparison is ${pp(closing)}. The evidence describes when complaints are recorded across the selected zones; it does not establish why those patterns occur.`;
 $('supportedText').textContent=change===null?'This selection has no early-window baseline. No percentage conclusion is available.':`The selected records contain ${change<0?'fewer':change>0?'more':'the same number of'} complaints after midnight than during the prior four-hour window. Comparisons are based on occurrence-start time.`;
}
function renderAnnual(s,zs){
 const rs=filterRows(s,['year']),ys=[2019,2020,2021,2022,2023],yr=ys.map(y=>totals(rs.filter(r=>r[0]===y)));
 const series=windows.map((name,i)=>({name,color:[C.amber,C.teal,C.lavender][i],values:yr.map((t,j)=>t.p[i]/(days(ys[j])*Math.max(zs.length,1)))}));
 lineChart('annual','Yearly average complaints per zone per day',series,ys.map(String));
 const valid=yr.filter(t=>t.p[0]>0),negative=valid.filter(t=>t.p[1]<t.p[0]).length;
 $('annualNote').innerHTML=`<b>${negative} of ${valid.length} estimable years</b> have fewer after-midnight complaints. All years remain visible; the year filter is intentionally omitted here.`;
 table('annualTable',['Year','Early / zone/day','Midnight / zone/day','4–8 AM / zone/day','Midnight change'],ys.map((y,j)=>[y,...series.map(p=>fmt(p.values[j])),pp(pc(yr[j].p[0],yr[j].p[1]))]));
 const vals=yr.map((t,i)=>HOURS.map(h=>t.h[h]/(days(ys[i])*Math.max(1,zs.length)))),mx=Math.max(...vals.flat(),.001);
 let g='';vals.forEach((row,j)=>{g+=txt(45,54+j*37,ys[j],'label','end');row.forEach((v,i)=>{g+=`<rect ${tip(`${ys[j]} · ${hourLabel(HOURS[i])}: ${fmt(v)} complaints per zone/day`)} x="${58+i*34}" y="${32+j*37}" width="31" height="32" fill="hsl(177 47% ${95-64*v/mx}%)"/>`;});});
 HOURS.forEach((h,i)=>{if(i%2===0)g+=txt(72+i*34,237,hourLabel(h),'tiny','middle');});
 $('heatmap').innerHTML=svg('Year by overnight hour heatmap',g,490,267);$('heatLegend').innerHTML=`0 <span class="scale-bar"></span> ${fmt(mx)} per zone/day`;
 table('heatTable',['Year',...HOURS.map(hourLabel)],ys.map((y,j)=>[y,...vals[j].map(fmt)]));
}
const projection=([lon,lat])=>[(lon+74.27)*1015+15,(40.925-lat)*1320+12];
const ringPath=ring=>ring.map((p,i)=>(i?'L':'M')+projection(p).map(v=>v.toFixed(2)).join(',')).join(' ')+'Z';
const geometryPath=g=>(g.type==='MultiPolygon'?g.coordinates.flat():g.coordinates).map(ringPath).join(' ');
function drawMap(zs,t){
 const ids=new Set(zs.map(z=>z.LocationID)),mode=$('mapMetric').value,early={},mid={};
 for(const r of currentRows){if(r[2]>=20)early[r[1]]=(early[r[1]]||0)+r[4];if(r[2]<4)mid[r[1]]=(mid[r[1]]||0)+r[4];}
 const val=z=>mode==='venues'?z.venues:mode==='change'?pc(early[z.LocationID]||0,mid[z.LocationID]||0):(t.byZone[z.LocationID]||0);
 const mx=Math.max(1,...zs.map(z=>Math.abs(val(z)||0)));
 const content=D.geo.features.map(f=>{const id=f.properties.LocationID,z=Z[id],v=val(z),active=ids.has(id),fill=!active||v===null?'#e0e5df':mode==='change'?(v<0?`hsl(177 45% ${90-45*Math.abs(v)/mx}%)`:`hsl(21 60% ${90-43*Math.abs(v)/mx}%)`):`hsl(177 45% ${94-62*Math.sqrt(v/mx)}%)`;
 return `<path ${active?tip(`${z.zone}\n${mode==='change'?'Midnight change: '+pp(v):mode==='venues'?'Observed venues: '+v:'Overnight complaints: '+fmt(v)}\n${z.venues} observed venues`):''} ${active?'data-zone="'+id+'"':''} d="${geometryPath(f.geometry)}" fill="${fill}" stroke="${String(id)===selectedZone?'#b47724':'#fffefa'}" stroke-width="${String(id)===selectedZone?2.2:.65}" fill-rule="evenodd"/>`;
 }).join('');
 $('map').innerHTML=svg('NYC taxi zones, '+mode,content+txt(565,535,'N ↑','label','end'),625,560);
 $('mapLegend').innerHTML=mode==='change'?`Decrease <span class="scale-bar" style="background:linear-gradient(90deg,#087f80,#eef2e9,#bd6741)"></span> Increase · ±${fmt(mx)}%`: `0 <span class="scale-bar"></span> ${fmt(mx)} ${mode==='venues'?'observed venues':'complaints'} · square-root color scale`;
}
function renderGeography(s,zs,t){
 const previous=$('zoneFocus').value; $('zoneFocus').innerHTML='<option value="">Choose a zone</option>'+[...zs].sort((a,b)=>a.zone.localeCompare(b.zone)).map(z=>`<option value="${z.LocationID}">${esc(z.zone)}</option>`).join('');
 selectedZone=zs.some(z=>String(z.LocationID)===previous)?previous:'';$('zoneFocus').value=selectedZone;drawMap(zs,t);zoneDetails();
 const bs=[...new Set(D.zones.map(z=>z.borough))].sort(),br=filterRows(s,['borough']),bt=bs.map(b=>totals(br.filter(r=>Z[r[1]].borough===b))),changes=bt.map(t=>pc(t.p[0],t.p[1]));
 const max=Math.max(50,...changes.filter(x=>x!==null).map(Math.abs)),zero=320,scale=135/max;
 let g=`<line class="baseline" x1="${zero}" x2="${zero}" y1="25" y2="254"/>`+txt(zero,276,'0%','','middle')+txt(zero-135,276,'−'+fmt(max)+'%','','middle')+txt(zero+135,276,'+'+fmt(max)+'%','','middle');
 bs.forEach((b,i)=>{const v=changes[i],y=42+i*43;g+=txt(0,y+15,b,'label');if(v===null)g+=txt(172,y+15,'No baseline');else{let x=zero+Math.min(0,v)*scale;g+=`<rect ${tip(`${b}: ${pp(v)}\nEarly: ${fmt(bt[i].p[0])}; midnight: ${fmt(bt[i].p[1])}`)} x="${x}" y="${y}" width="${Math.abs(v)*scale}" height="24" fill="${v<=0?C.teal:C.red}"/>`+txt(v<=0?x-7:zero+v*scale+7,y+16,pp(v),'label',v<=0?'end':'start');}});
 $('boroughChart').innerHTML=svg('Borough midnight percentage change',g,535,303);
 $('boroughNote').textContent=`${changes.filter(v=>v!==null&&v<0).length} of ${changes.filter(v=>v!==null).length} estimable boroughs show a decline. No percentage is reported when the early window is zero.`;
 table('boroughTable',['Borough','Early','Midnight','Change'],bs.map((b,i)=>[b,fmt(bt[i].p[0]),fmt(bt[i].p[1]),pp(changes[i])]));
 const points=zs.map(z=>({...z,n:t.byZone[z.LocationID]||0})),xm=Math.max(1,...points.map(z=>z.venues)),ym=niceMax(Math.max(0,...points.map(z=>z.n/days(s.year))));
 let scat=yGrid(ym,{left:55,right:610,top:35,bottom:255});[0,.25,.5,.75,1].forEach(f=>scat+=txt(55+555*f,280,fmt(xm*f),'','middle'));
 points.forEach(z=>{scat+=`<circle ${tip(`${z.zone}\n${z.venues} observed venues\n${fmt(z.n/days(s.year))} overnight complaints/day\n${fmt(z.n)} total complaints`)} cx="${55+z.venues/xm*555}" cy="${255-z.n/days(s.year)/ym*220}" r="4" fill="${GC[z.cohort]}" fill-opacity=".65" stroke="${GC[z.cohort]}" stroke-width=".5"/>`;});
 scat+=txt(330,306,'Observed venue count (snapshot)','','middle')+txt(55,18,'Overnight complaints per day');$('scatter').innerHTML=svg('Zone venues versus overnight complaints per day',scat,640,322);
 table('scatterTable',['Zone','Observed venues','Overnight count','Per day'],points.sort((a,b)=>b.n-a.n).map(z=>[z.zone,z.venues,fmt(z.n),fmt(z.n/days(s.year))]));
 const top=points.slice(0,8),tm=Math.max(1,...top.map(z=>z.n));let rank='';top.forEach((z,i)=>{let y=20+i*41;rank+=txt(0,y,z.zone.length>29?z.zone.slice(0,27)+'…':z.zone,'label')+`<rect ${tip(z.zone+': '+fmt(z.n)+' complaints')} x="0" y="${y+7}" width="${360*z.n/tm}" height="10" fill="${GC[z.cohort]}"/>`+txt(465,y+16,fmt(z.n),'label','end');});$('ranking').innerHTML=svg('Eight zones by overnight complaint volume',rank,485,top.length*41+25);
 table('rankingTable',['Zone','Complaints','Observed venues'],top.map(z=>[z.zone,fmt(z.n),z.venues]));
}
function zoneDetails(){
 const id=selectedZone;if(!id||!Z[id]){$('zoneDetail').innerHTML='<strong>Inspect a neighborhood</strong>Select a taxi zone to see its overnight volume, midnight comparison and venue coverage.';return;}
 const z=Z[id],t=totals(currentRows.filter(r=>String(r[1])===id));
 $('zoneDetail').innerHTML=`<strong>${esc(z.zone)}</strong>${esc(z.borough)} · ${z.cohort} observed venue group<dl><div><dt>Overnight complaints</dt><dd>${fmt(t.night)}</dd></div><div><dt>Midnight change</dt><dd>${pp(pc(t.p[0],t.p[1]))}</dd></div><div><dt>Observed venues</dt><dd>${z.venues}</dd></div></dl>`;
}
function renderOffenses(s,zs){
 const rows=filterRows(s,['type']),matrix=HOURS.map(()=>TYPES.map(()=>0)),pm=windows.map(()=>TYPES.map(()=>0));
 rows.forEach(r=>{const hi=HOURS.indexOf(r[2]),ti=TYPES.indexOf(r[3]);if(hi>=0&&ti>=0){matrix[hi][ti]+=r[4];pm[period(r[2])][ti]+=r[4];}});
 const den=s.metric==='rate'?Math.max(1,zs.length)*days(s.year):1,max=niceMax(Math.max(0,...matrix.map(r=>sum(r)/den))),base=250;
 let g=yGrid(max,{left:50,right:615,top:35,bottom:base});matrix.forEach((row,i)=>{let used=0;row.forEach((n,j)=>{const height=n/den/max*205;g+=`<rect ${tip(`${hourLabel(HOURS[i])} · ${TYPES[j]}: ${fmt(n)} complaints`)} x="${58+i*46}" y="${base-used-height}" width="31" height="${height}" fill="${TC[j]}"/>`;used+=height;});g+=txt(73+i*46,273,hourLabel(HOURS[i]),'tiny','middle');});g+=`<line x1="232" x2="232" y1="28" y2="253" stroke="#798c85" stroke-dasharray="3 4"/>`+txt(234,19,'MIDNIGHT','tiny');$('offenseHours').innerHTML=svg('Stacked hourly offense volumes',g,640,296);
 const totalsByType=TYPES.map((_,j)=>sum(matrix.map(r=>r[j]))),mi=totalsByType.indexOf(Math.max(...totalsByType));
 $('offenseNote').innerHTML=`${sum(totalsByType)?'<b>'+TYPES[mi]+'</b> is the largest analytical offense group in this selection.':'No overnight complaints match the geography/year selection.'} ${s.metric==='rate'?'Bars show complaints per zone/day.':'Bars show counts.'} The offense filter is omitted so the composition remains comparable.`;
 table('offenseHoursTable',['Hour',...TYPES],HOURS.map((h,i)=>[hourLabel(h),...matrix[i].map(fmt)]));
 let comp='';pm.forEach((row,i)=>{const total=sum(row);let start=0,y=35+i*74;comp+=txt(0,y,windows[i],'label');row.forEach((n,j)=>{const share=total?n/total:0;comp+=`<rect ${tip(`${windows[i]} · ${TYPES[j]}\n${fmt(n)} complaints · ${fmt(share*100)}%`)} x="${start}" y="${y+13}" width="${450*share}" height="30" fill="${TC[j]}"/>`;if(share>.12)comp+=`<text x="${start+225*share}" y="${y+33}" text-anchor="middle" style="fill:${j===4?'#10272f':'white'};font-size:10px">${Math.round(share*100)}%</text>`;start+=450*share;});if(!total)comp+=txt(0,y+34,'No complaints');});$('composition').innerHTML=svg('Offense composition by four-hour window',comp,470,276);
 const a=sum(pm[0]),b=sum(pm[1]),deltas=TYPES.map((_,i)=>a&&b?100*(pm[1][i]/b-pm[0][i]/a):null),valid=deltas.filter(x=>x!==null);
 const best=valid.length?deltas.reduce((best,v,i)=>Math.abs(v)>Math.abs(deltas[best])?i:best,0):-1;
 $('compositionNote').textContent=best<0?'Both comparison windows need complaints to compare shares.':`${TYPES[best]} has the largest absolute share shift: ${deltas[best]>0?'+':''}${deltas[best].toFixed(1)} percentage points after midnight. This describes composition, not risk.`;
 table('compositionTable',['Window','Offense','Count','Share'],pm.flatMap((row,i)=>row.map((n,j)=>[windows[i],TYPES[j],fmt(n),sum(row)?fmt(n/sum(row)*100)+'%':'No complaints'])));
}
function renderReference(){
 const f=D.evidence.findings,min=-60,max=10,x=v=>165+(v-min)/(max-min)*385;let forest=`<line class="baseline" x1="${x(0)}" x2="${x(0)}" y1="20" y2="255" stroke-dasharray="3 4"/>`;
 [-60,-40,-20,0].forEach(v=>forest+=txt(x(v),278,v+'%','','middle'));
 f.forEach((v,i)=>{const y=45+i*55,color=v.cohort==='All'?C.teal:GC[v.cohort];forest+=txt(0,y,v.cohort==='All'?'All zones':v.cohort+' observed venues','label')+txt(0,y+17,v.zones+' zones','tiny')+`<line ${tip(v.cohort+': '+pp(v.change)+'; 95% interval '+pp(v.interval[0])+' to '+pp(v.interval[1]))} x1="${x(v.interval[0])}" x2="${x(v.interval[1])}" y1="${y}" y2="${y}" stroke="${color}" stroke-width="3"/><circle cx="${x(v.change)}" cy="${y}" r="5" fill="${color}"/>`+txt(625,y+4,pp(v.change),'label','end');});$('forest').innerHTML=svg('Midnight changes with paired-month bootstrap intervals',forest,640,306);
 $('forestNote').innerHTML=`High minus Low change is <b>${fmt(D.evidence.gradient.difference_pp)} percentage points</b> (95% interval ${fmt(D.evidence.gradient.interval[0])} to ${fmt(D.evidence.gradient.interval[1])}). High consists of Upper West Side South alone; the difference is not evidence of a general venue-density effect.`;
 table('forestTable',['Group','Zones','Early','Midnight','Change','95% lower','95% upper'],f.map(v=>[v.cohort,v.zones,fmt(v.early),fmt(v.midnight),pp(v.change),pp(v.interval[0]),pp(v.interval[1])]));
 let sen='';D.evidence.sensitivity.forEach((v,i)=>{let y=40+i*68;sen+=txt(0,y,'≥'+v.threshold+' venues','label')+txt(0,y+19,v.zones+' qualifying '+(v.zones===1?'zone':'zones'),'tiny');if(v.change!==null){const xpos=190+(v.change+60)/70*200;sen+=`<line x1="190" x2="362" y1="${y}" y2="${y}" stroke="#e0e7df"/><circle ${tip('Threshold '+v.threshold+': '+pp(v.change)+'; '+v.zones+' zones')} cx="${xpos}" cy="${y}" r="6" fill="${i===1?C.amber:C.teal}"/>`+txt(470,y+5,pp(v.change),'label','end');}else sen+=txt(225,y,'Not estimable');});sen+=txt(190,258,'−60%')+txt(362,258,'0%','','middle');$('sensitivity').innerHTML=svg('High venue threshold sensitivity',sen,490,290);
 table('sensitivityTable',['High threshold','Zones','Early','Midnight','Change'],D.evidence.sensitivity.map(v=>['≥'+v.threshold,v.zones,fmt(v.early),fmt(v.midnight),pp(v.change)]));
 const months=Array.from({length:60},(_,i)=>`${2019+Math.floor(i/12)}-${String(i%12+1).padStart(2,'0')}`),lookup={};D.monthly.forEach(r=>{lookup[r[0]+'|'+r[2]]=(lookup[r[0]+'|'+r[2]]||0)+r[3];});
 const nd=m=>new Date(Date.UTC(+m.slice(0,4),+m.slice(5,7),0)).getUTCDate();
 const ms=['Early','Midnight','Closing'].map((key,i)=>({name:windows[i],color:[C.amber,C.teal,C.lavender][i],values:months.map(m=>(lookup[m+'|'+key]||0)/nd(m))}));
 lineChart('monthlyChart','Sixty-month average daily complaint volumes',ms,months,{w:1080,h:300,tickEvery:12,bands:[{start:12,end:35.5,color:'#eef0ed'}]});
 table('monthlyTable',['Month',...windows.map(w=>w+' / day')],months.map((m,i)=>[m,...ms.map(s=>fmt(s.values[i]))]));
 const a=D.audit;const auditRows=[['Raw source records',a.raw_rows,'Original NYPD snapshot'],['Duplicate complaint IDs removed','−'+fmt(a.duplicate_ids),'First source record per CMPLNT_NUM retained'],['Invalid or outside scope','−'+fmt(a.invalid_or_outside_scope),'Occurrence date, time and broad coordinate screening'],['Not uniquely inside a zone','−'+fmt(a.unmatched_complaints),'Outside, boundary or ambiguous point-in-polygon results'],['Matched complaints',a.matched_rows,'Used in the all-hours analytical cube']];
 $('auditFlow').innerHTML=auditRows.map((r,i)=>`<div class="audit-row ${i===4?'total':''}"><div>${r[0]}<small>${r[2]}</small></div><strong>${typeof r[1]==='number'?fmt(r[1]):r[1]}</strong></div>`).join('')+`<p class="footnote">Retention: ${D.evidence.coverage.retained_pct.toFixed(2)}%. Counts reconcile exactly: raw = duplicates + invalid/out of scope + unmatched + matched.</p>`;
 const cover=D.evidence.coverage;$('venueCoverage').innerHTML=`<div class="coverage-value">${cover.observed_zones}<small> / ${cover.zones} zones</small></div><div class="sub">have at least one observed venue</div><div class="coverage-grid" aria-hidden="true">${Array.from({length:cover.zones},(_,i)=>`<i class="${i<cover.observed_zones?'observed':''}"></i>`).join('')}</div><p class="footnote">Each block is one taxi zone. Teal = at least one venue in the matched snapshot. Gray = zero observed venues.</p>`;
 const overall=f[0],answers=[['Q1 · AFTER MIDNIGHT','Counts decline',`${pp(overall.change)} across equal four-hour windows in the full snapshot.`],['Q2 · AFTER 4 AM','A further decline',`${pp(overall.closing_change)} relative to midnight–4 AM. Timing is not causality.`],['Q3 · VENUE GROUPS','A sparse comparison',`The High group contains one zone. Thresholds of 10, 15 and 20 produce different samples.`],['Q4 · OFFENSE MIX','Composition matters','Counts and shares answer different questions. The charts show both by clock hour and window.'],['Q5 · ACROSS YEARS',`${D.evidence.annual.filter(y=>y.change<0).length}/5 yearly declines`,`Full-city yearly comparisons test whether the direction persists across calendar years.`]];
 $('questionAnswers').innerHTML=answers.map(a=>`<article class="answer-card"><span class="question">${a[0]}</span><h3>${a[1]}</h3><p>${a[2]}</p></article>`).join('');
 $('heroMap').innerHTML=svg('Decorative NYC zone outline',D.geo.features.map(f=>`<path d="${geometryPath(f.geometry)}" fill="${f.properties.venues>0?'#789b8f':'#294c50'}" stroke="#133138" stroke-width="1"/>`).join(''),625,560);
}
[...new Set(D.zones.map(z=>z.borough))].sort().forEach(b=>$('borough').insertAdjacentHTML('beforeend',`<option>${esc(b)}</option>`));
$('crimeLegend').innerHTML=TYPES.map((t,i)=>`<span><i class="swatch" style="background:${TC[i]}"></i>${t}</span>`).join('');
for(const id of ['year','borough','cohort','type','metric'])$(id).onchange=render;
$('reset').onclick=()=>{for(const id of ['year','borough','cohort','type','metric'])$(id).selectedIndex=0;selectedZone='';$('zoneFocus').value='';$('mapMetric').value='count';render();};
$('mapMetric').onchange=()=>drawMap(currentZones,currentTotals);
$('zoneFocus').onchange=()=>{selectedZone=$('zoneFocus').value;drawMap(currentZones,currentTotals);zoneDetails();};
$('map').addEventListener('click',e=>{const p=e.target.closest('[data-zone]');if(p){selectedZone=p.dataset.zone;$('zoneFocus').value=selectedZone;drawMap(currentZones,currentTotals);zoneDetails();}});
$('download').onclick=()=>{const csv='year,zone_id,hour,offense_group,complaints\n'+currentRows.map(r=>r.join(',')).join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='nyc-nightlife-filtered-cube.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
document.addEventListener('mousemove',e=>{const el=e.target.closest('[data-tip]'),tt=$('tooltip');tt.hidden=!el;if(el){tt.textContent=el.dataset.tip;tt.style.left=Math.max(8,Math.min(e.clientX+12,innerWidth-285))+'px';tt.style.top=Math.max(8,Math.min(e.clientY+12,innerHeight-110))+'px';}});
document.addEventListener('mouseout',e=>{if(!e.relatedTarget)$('tooltip').hidden=true;});
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('tooltip').hidden=true;});
renderReference();render();
