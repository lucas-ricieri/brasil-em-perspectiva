const assert=require('node:assert/strict'),fs=require('node:fs'),Model=require('../model.js');
const data=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../data/snapshot.json'),'utf8'));
const base=Model.calculate(data,{mode:'change'});
assert.equal(base.rows.length,6);
assert.equal(base.active.length,6,'Default balanced basket should have six verified metrics');
for(const r of base.rows){assert(r.score>=0&&r.score<=100);assert.equal(r.metrics.length,6);for(const m of r.metrics)assert(m.valid&&m.n>=2);}
assert(!base.rows.some(r=>r.term.id==='itamar'));
assert(!base.eligible.some(e=>e.series.id==='SH.STA.MMRT'));
const historic=Model.calculate(data,{current:false});assert.equal(historic.rows.length,5);assert.equal(historic.active.length,8);
const zero=Model.calculate(data,{weights:{economia:0,social:0,vida:0}});assert(zero.rows.every(r=>r.score===null));
const empty=Model.calculate(data,{excluded:data.series.filter(s=>s.rank).map(s=>s.id)});assert(empty.rows.every(r=>r.score===null));
assert.equal(Model.getTerms({transition:'temer'}).find(t=>t.id==='temer').start,2016);
assert.equal(Model.getTerms({transition:'dilma'}).find(t=>t.id==='dilma').end,2016);
assert.equal(Model.stats({id:'test',values:{2000:10,2002:14}},{start:2000,end:2002},{mode:'change'}).value,2);
assert.equal(Model.stats({id:'test',values:{}},{start:2000,end:2002}).valid,false);
assert.equal(Model.stats({id:'test',values:{2000:1}},{start:2000,end:2002}).valid,false);
const equal=structuredClone(data);equal.series.forEach(s=>{if(s.rank)Object.keys(s.values).forEach(y=>s.values[y]=1)});assert(Model.calculate(equal).rows.every(r=>r.score===50));
assert(Math.abs(data.series.find(s=>s.id==='BCB_433').values['2024']-4.831295791859591)<1e-10);
for(const s of data.series){for(const [year,value] of Object.entries(s.values)){assert(+year<=2025);assert(Number.isFinite(value));}}
console.log('PASS: cobertura, ranking, empates, pesos zero, ausência de dados, transição, diferenças anualizadas e IPCA composto.');
console.log(JSON.stringify(base.rows.map(r=>({governo:r.term.short,nota:+r.score.toFixed(2),metricas:r.metrics.length})),null,2));
