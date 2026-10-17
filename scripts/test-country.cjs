'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),Country=require('../country-model.js'),Model=require('../model.js'),data=require('../data/snapshot.json');
const partial=Country.calculate(data),strict=Country.calculate(data,{strict:true});
assert.equal(partial.refs.length,14);assert.equal(Country.areas.length,6);
assert.equal(strict.years.find(y=>y.year===2003).score,null,'Sem série fiscal completa, não há índice completo');
assert(strict.years.find(y=>y.year===2023).score!==null);
assert.equal(partial.years.find(y=>y.year===2010).groups.social,null,'Lacuna de pesquisa social não pode ser interpolada');
for(const row of partial.years){if(row.score!==null)assert(row.score>=0&&row.score<=100);for(const score of Object.values(row.groups))assert(score===null||(score>=0&&score<=100));}
const weights=Object.fromEntries(Country.areas.map(a=>[a.id,0]));assert(Country.calculate(data,{weights}).years.every(y=>y.score===null));
weights.economia=1;const econOnly=Country.calculate(data,{weights,strict:true});assert.equal(econOnly.years.find(y=>y.year===1994).score,econOnly.years.find(y=>y.year===1994).groups.economia);
const tied=structuredClone(data);tied.series.forEach(s=>Object.keys(s.values).forEach(y=>s.values[y]=10));assert(Country.calculate(tied).years.filter(y=>y.score!==null).every(y=>y.score===50));
const missing=structuredClone(data);delete missing.series.find(s=>s.id==='BCB_433').values['2023'];assert.equal(Country.calculate(missing).years.find(y=>y.year===2023).groups.economia,null,'Não redistribuir pesos dentro de área incompleta');
assert.equal(Country.normalize(null,{lo:0,hi:10,direction:1}),null);assert.equal(Country.normalize(0,{lo:0,hi:10,direction:-1}),100);
const future=structuredClone(data);future.series.forEach(s=>s.values['2026']=1e10);assert.deepEqual(Country.calculate(future).refs,partial.refs,'Referência exclui anos futuros e parciais');
const groups=Country.summarize(partial,Model.terms);assert.equal(groups.length,10);assert.equal(groups.find(r=>r.term.id==='dilma2').expected,1);assert(groups.find(r=>r.term.id==='dilma2').score!==null,'Índice de um ano é descrição, não evolução');
assert.deepEqual(Country.summarize(partial,Model.terms.filter(t=>t.id==='lula1'))[0],groups.find(t=>t.term.id==='lula1'),'Mudar seleção de mandatos não redefine índice');
const refs=Country.reference(data,'range');for(const ref of refs){assert(ref.lo<=partial.refs.find(r=>r.id===ref.id).lo);assert(ref.hi>=partial.refs.find(r=>r.id===ref.id).hi);}
// Catálogo relacionado: filtros distintos para cada tipo de curva.
const controls={eventMode:{value:'main'},eventCategory:{value:'all'},eventType:{value:'all'},eventScope:{value:'all'},eventLimit:{value:'8'}};
const sandbox={console,$:id=>controls[id]};vm.createContext(sandbox);
for(const f of ['context.js','policy-expansion.js','event-catalog.js','timeline.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),sandbox,{filename:f});
const list=(id,group)=>JSON.parse(vm.runInContext(`JSON.stringify(getChartEvents({id:${JSON.stringify(id)},group:${JSON.stringify(group)}},1994,2025))`,sandbox));
const gdp=list('NY.GDP.MKTP.KD.ZG','economia'),science=list('GB.XPD.RSDV.GD.ZS','ciencia'),crime=list('VC.IHR.PSRC.P5','vida');
assert(!gdp.some(e=>e.id==='suez'||e.id==='coronaday'));assert(science.some(e=>e.title.includes('Inovação')));assert(crime.some(e=>e.title.includes('Desarmamento')));assert(gdp.length<=8);
controls.eventMode.value='all';controls.eventLimit.value='50';assert(list('NY.GDP.MKTP.KD.ZG','economia').some(e=>e.id==='suez'));
controls.eventCategory.value='ciencia';assert(list('NY.GDP.MKTP.KD.ZG','economia').every(e=>e.categories.includes('ciencia')));
const cases=require('../data/company-cases.json');assert.equal(new Set(cases.cases.map(c=>c.id)).size,cases.cases.length);assert(cases.cases.every(c=>c.sourceUrl.startsWith('https://')&&c.scope&&c.year<=2025));assert.equal(cases.cases.filter(c=>c.kind==='unicorn').length,8);
console.log('PASS: Índice País, seis áreas, 14 métricas, lacunas, pesos, sensibilidade, mandatos, marcos por indicador e casos empresariais.');
