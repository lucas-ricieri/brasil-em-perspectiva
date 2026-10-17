'use strict';
let countryIndex=null;
function countryOptions(){return {strict:$('countryStrict').checked,scale:$('countryScale').value,weights:Object.fromEntries(Country.areas.map(a=>[a.id,+$('countryWeight_'+a.id).value]))};}
function countryTerms(){return [Model.terms[0],...Model.getTerms(options())];}
function initCountry(){
 $('countryWeights').innerHTML=Country.areas.map(a=>`<label class="country-weight"><span>${a.name}</span><output id="countryOut_${a.id}">1×</output><input type="range" min="0" max="3" step="0.5" value="1" id="countryWeight_${a.id}" aria-label="Peso no Índice País: ${a.name}"></label>`).join('');
 $('countryYear').innerHTML=annualYears.map(y=>`<option value="${y}">${y}</option>`).join('');
 const initial=Country.calculate(DATA);$('countryYear').value=initial.years.filter(y=>y.complete).at(-1)?.year||2023;
 for(const id of ['countryStrict','countryScale','countryYear'])$(id).addEventListener('change',renderCountry);
 for(const a of Country.areas)$('countryWeight_'+a.id).addEventListener('input',renderCountry);
 $('countryReset').addEventListener('click',()=>{for(const a of Country.areas)$('countryWeight_'+a.id).value=1;$('countryStrict').checked=false;$('countryScale').value='robust';renderCountry();});
 $('exportCountry').addEventListener('click',exportCountry);
}
function renderCountry(){
 if(!$('countryWeight_economia'))return;
 const opts=countryOptions();countryIndex=Country.calculate(DATA,opts);
 const selected=countryIndex.years.find(y=>y.year===+$('countryYear').value),summaries=Country.summarize(countryIndex,countryTerms());
 for(const a of Country.areas)$('countryOut_'+a.id).textContent=fmt(opts.weights[a.id],1)+'×';
 $('countryValue').innerHTML=`<span class="eyebrow">ÍNDICE PAÍS · ${selected.year}</span><strong>${fmt(selected.score,1)}<small>/ 100</small></strong><span class="coverage-badge ${selected.complete?'':'partial'}">${selected.nAreas}/${selected.required} áreas ativas observadas · ${selected.complete?'cesta completa':selected.required?'cobertura parcial':'sem pesos ativos'}</span>`;
 $('countryNotice').textContent=opts.strict?'Cesta constante: a nota anual só existe quando todas as áreas com peso positivo estão completas. Períodos antigos ou recentes podem ficar sem índice. Não interpolamos valores.':'Modo exploratório: o índice usa as áreas completas disponíveis e redistribui seus pesos. A composição muda quando faltam áreas; notas parciais de mandatos distintos não são uma comparação de cesta constante. Ative “Exigir todas as áreas” para esse recorte.';
 $('countryAreas').innerHTML=Country.areas.map(a=>{const metrics=selected.metrics.filter(m=>m.area===a.id);return `<article class="area-card" style="--area:${a.color}"><span>${a.name}</span><strong>${fmt(selected.groups[a.id],1)}</strong><div class="area-meter"><i style="width:${selected.groups[a.id]??0}%"></i></div><p>${esc(a.reading)}</p><details><summary>${metrics.filter(m=>m.score!==null).length}/${metrics.length} métricas observadas</summary>${metrics.map(m=>`<p><a href="${esc(byId(m.id)?.url||'#fontes')}" target="_blank" rel="noopener">${esc(byId(m.id)?.name||m.id)}</a><br>${m.raw===null?'Sem observação':compact(m.raw)+' '+esc(byId(m.id)?.unit||'')} · nota ${fmt(m.score,1)} · ${m.direction>0?'maior':'menor'} nesta regra</p>`).join('')}</details></article>`;}).join('');
 $('countryChart').innerHTML=countryLine(countryIndex,selected.year);
 $('countryChart').querySelectorAll('[data-country-year]').forEach(el=>{const activate=()=>{$('countryYear').value=el.dataset.countryYear;renderCountry();$('countryYear').focus();};el.addEventListener('click',activate);el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});});
 $('countryTerms').innerHTML='<thead><tr><th>Mandato / anos no painel</th><th>Índice médio</th><th>Primeiro → último</th><th>Áreas: médias dos anos observados</th><th>Cobertura</th></tr></thead><tbody>'+summaries.map(row=>`<tr><td><b>${esc(row.term.short)}</b><small>${row.term.start}–${row.term.end}${row.term.id==='lula3'?' · em andamento':''}</small></td><td class="country-term-score">${fmt(row.score,1)}<small>${row.n?(row.partial?'Índice parcial':'Cesta completa'):'Sem índice no modo atual'}</small></td><td>${row.first?fmt(row.first.score,1)+' → '+fmt(row.last.score,1):'—'}<small>${row.first?row.first.year+'–'+row.last.year:'Sem ano observado'}</small></td><td><div class="term-dimensions">${Country.areas.map(a=>`<span title="${a.name}: ${row.groups[a.id].n} anos observados"><i style="background:${a.color}"></i>${a.name}: ${fmt(row.groups[a.id].score,1)}</span>`).join('')}</div></td><td>${row.n}/${row.expected} anos com índice<small>${row.full} anos com todas as áreas ativas</small><small>${row.n?'Peso observado médio: '+fmt(100*row.weightCoverage,0)+'%':''}${row.expected===1?' · um único ano, descrição sem tendência':''}</small></td></tr>`).join('')+'</tbody>';
 $('countryAudit').innerHTML='<thead><tr><th>Ano</th>'+Country.areas.map(a=>`<th>${a.name}</th>`).join('')+'<th>Índice País</th><th>Áreas ativas</th></tr></thead><tbody>'+countryIndex.years.map(row=>`<tr><td>${row.year}${row.year===2016?' · compartilhado':''}</td>${Country.areas.map(a=>`<td>${fmt(row.groups[a.id],1)}</td>`).join('')}<td>${fmt(row.score,1)}</td><td>${row.nAreas}/${row.required}</td></tr>`).join('')+'</tbody>';
 $('countryReference').innerHTML='<thead><tr><th>Área / métrica</th><th>Direção</th><th>Limite 0 / 100 antes da direção</th><th>Observações na referência</th></tr></thead><tbody>'+countryIndex.refs.map(r=>`<tr><td>${groups[r.area]}<small><a href="${esc(byId(r.id)?.url||'#fontes')}" target="_blank" rel="noopener">${esc(byId(r.id)?.name||r.id)}</a></small></td><td>${r.direction>0?'Maior':'Menor'} nesta regra</td><td>${compact(r.lo)} / ${compact(r.hi)}<small>${esc(byId(r.id)?.unit||'')}</small></td><td>${r.n} anos · janela 1994–2025</td></tr>`).join('')+'</tbody>';
}
function countryLine(index,selected){
 const W=1100,H=265,L=42,R=18,T=18,B=34,X=y=>L+(y-1994)/31*(W-L-R),Y=v=>H-B-v/100*(H-T-B);
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="Índice País anual de 1994 a 2025. Clique ou use o teclado para escolher o ano. Linhas tracejadas indicam trechos com cobertura parcial.">`;
 for(let v=0;v<=100;v+=25)svg+=`<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#ddd6cb" stroke-dasharray="3 5"/><text x="${L-8}" y="${Y(v)+4}" text-anchor="end" font-size="10" fill="#5c6269">${v}</text>`;
 for(const t of countryTerms()){const x1=X(Math.max(1994,t.start)-.4),x2=X(Math.min(2025,t.end)+.4);svg+=`<rect x="${x1}" y="${T}" width="${Math.max(1,x2-x1)}" height="${H-T-B}" fill="${t.color}" opacity=".025"/>`;}
 for(let i=1;i<index.years.length;i++){const a=index.years[i-1],b=index.years[i];if(a.score===null||b.score===null)continue;svg+=`<line x1="${X(a.year)}" x2="${X(b.year)}" y1="${Y(a.score)}" y2="${Y(b.score)}" stroke="#506c8b" stroke-width="2.8" ${a.complete&&b.complete?'':'stroke-dasharray="5 4"'}/>`;}
 index.years.filter(y=>y.score!==null).forEach(y=>{svg+=`<circle data-country-year="${y.year}" tabindex="0" role="button" aria-label="${y.year}: ${fmt(y.score,1)} pontos; ${y.nAreas}/${y.required} áreas" cx="${X(y.year)}" cy="${Y(y.score)}" r="${y.year===selected?6:3.8}" fill="${y.complete?'#728EAD':'#fffdf8'}" stroke="#506c8b" stroke-width="2"><title>${y.year}: ${fmt(y.score,1)} · ${y.nAreas}/${y.required} áreas</title></circle>`;});
 for(let y=1994;y<=2025;y++)if(y===1994||y===2025||y%5===0)svg+=`<text x="${X(y)}" y="${H-8}" text-anchor="middle" font-size="10" fill="#5c6269">${y}</text>`;
 return svg+'</svg>';
}
function exportCountry(){
 const opts=countryOptions(),idx=Country.calculate(DATA,opts),terms=Country.summarize(idx,countryTerms());
 downloadCSV('indice-pais-criterios-e-auditoria.csv',[
 ['Indice','Índice País exploratório · versão 1 · 2026-10-16'],['Escala',idx.scale==='robust'?'Percentis 10/90, interpolação linear, corte 0–100':'Mínimo e máximo históricos, corte 0–100'],['Referencia','Observações disponíveis em 1994–2025; não depende dos mandatos selecionados'],['Pesos',JSON.stringify(idx.weights)],['Exige cesta completa',idx.strict],['Transicao2016',options().transition],['Formula','Média por área de cesta fixa; média ponderada de áreas observadas. Ausência não vira zero. Índice parcial muda composição e não é comparação constante.'],[],
 ['Tipo','Ano ou mandato','Area','Serie','Valor bruto','Direcao','Limite inferior','Limite superior','Nota','Areas observadas','Areas ativas','Fonte','Consulta'],
 ...idx.years.flatMap(y=>y.metrics.map(m=>['metrica',y.year,m.area,m.id,m.raw,m.direction,m.lo,m.hi,m.score,y.nAreas,y.required,byId(m.id)?.url,byId(m.id)?.collectedAt])),
 ...idx.years.map(y=>['indice_anual',y.year,'','',null,'','','',y.score,y.nAreas,y.required]),
 ...terms.map(t=>['media_mandato',t.term.short,'','',null,'','','',t.score,t.n,t.expected,'Cobertura: '+t.full+' anos completos; parcial='+t.partial])
 ]);
}
