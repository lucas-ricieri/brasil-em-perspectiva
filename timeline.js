'use strict';
// Associações do catálogo marcos-de-interesse.md, refinadas por métrica e fonte.
function getChartEvents(series,a,b){
 const mode=$('eventMode')?.value||'main',category=$('eventCategory')?.value||'all',type=$('eventType')?.value||'all',scope=$('eventScope')?.value||'all';
 const exact=EVENTS.filter(e=>e.metrics.includes(series.id));
 let events=EVENTS.filter(e=>e.year<=b&&e.end>=a);
 if(mode!=='all')events=events.filter(e=>exact.length?e.metrics.includes(series.id):(e.categories||[]).includes(series.group));
 if(mode==='main')events=events.filter(e=>(e.priority||1)<=1);
 if(category!=='all')events=events.filter(e=>(e.categories||[]).includes(category));
 if(type!=='all')events=events.filter(e=>e.type===type);
 if(scope!=='all')events=events.filter(e=>(e.scope||(e.kind==='Mundo'?'mundo':'brasil'))===scope);
 const limit=+$('eventLimit')?.value||8;
 return events.sort((x,y)=>(x.priority||1)-(y.priority||1)||x.year-y.year||x.id.localeCompare(y.id)).slice(0,limit).sort((x,y)=>x.year-y.year||x.id.localeCompare(y.id));
}
