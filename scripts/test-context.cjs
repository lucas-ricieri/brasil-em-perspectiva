const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Model=require('../model.js'),{EVENTS}=require('../event-catalog.js'),{PROFILES}=require('../policy-expansion.js');
const data=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/snapshot.json'))),previous=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/archive/snapshot-2026-10-14.json')));
const ids=new Set(data.series.map(s=>s.id));
assert.equal(ids.size,data.series.length);
assert.equal(data.series.length,43);
for(const s of previous.series)assert.deepEqual(data.series.find(n=>n.id===s.id).values,s.values,'A extensão deve preservar o snapshot original');
for(const opts of [{},{current:false},{transition:'temer'},{transition:'dilma'},{relative:true},{mode:'level'}])assert.deepEqual(Model.calculate(data,opts).rows,Model.calculate(previous,opts).rows,'Novas séries não alteram notas');
assert.equal(Model.partyForYear(1994).name,'PMDB');assert.equal(Model.partyForYear(1999).name,'PSDB');
assert.equal(Model.partyForYear(2005).color,Model.partyForYear(2015).color);
assert.equal(Model.partyForYear(2016).name,'PT / PMDB · transição');
for(const [year,name] of [[2019,'PSL'],[2020,'Sem partido'],[2021,'Sem partido'],[2022,'PL'],[2023,'PT']])assert.equal(Model.partyForYear(year).name,name);
assert.equal(new Set(EVENTS.map(e=>e.id)).size,EVENTS.length);
for(const e of EVENTS){assert(e.year<=e.end);assert(e.year>=1994&&e.end<=2025);assert(e.url.startsWith('https://'));for(const id of e.metrics)assert(ids.has(id));}
for(const t of Model.terms){assert(PROFILES[t.sourceProfile||t.id]);for(const a of PROFILES[t.sourceProfile||t.id].actions){assert(ids.has(a.metric));assert(a.url.startsWith('https://'));assert(a.action&&a.limit&&a.mechanism);}}
const gas=data.series.find(s=>s.id==='ANP_GASOLINA');assert(!('2001' in gas.values));assert(!('2020' in gas.values));
for(const [year,value] of Object.entries(gas.values)){
 const ms=Object.entries(gas.monthlyValues).filter(([m])=>m.startsWith(year));assert.equal(ms.length,12);
 assert(Math.abs(ms.reduce((a,[m,v])=>a+v,0)/12-value)<1e-10);
}
// Valores do relatório COFOG 2024: protege contra erro de escala 100× na planilha.
assert(Math.abs(data.series.find(s=>s.id==='STN_COFOG_703').values['2024']-2.95)<.01);
assert(Math.abs(data.series.find(s=>s.id==='STN_COFOG_INV_703').values['2024']-.1203)<.0001);
console.log('PASS: 43 séries, valores originais preservados e novas séries fora da nota, partidos, vínculos documentais, gasolina completa e escala COFOG.');
