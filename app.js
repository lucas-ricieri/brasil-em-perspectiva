'use strict';
const $=id=>document.getElementById(id), esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=(n,d=2)=>n==null||!Number.isFinite(n)?'—':n.toLocaleString('pt-BR',{maximumFractionDigits:d,minimumFractionDigits:d});
const compact=n=>Math.abs(n)>=1e12?fmt(n/1e12)+' tri':Math.abs(n)>=1e9?fmt(n/1e9)+' bi':Math.abs(n)>=1e6?fmt(n/1e6)+' mi':fmt(n);
const groups={economia:'Economia',social:'Condições sociais',vida:'Saúde e segurança',educacao:'Educação',ciencia:'Ciência e tecnologia',fiscal:'Finanças públicas',contexto:'Contexto externo e monetário'};
const colors={economia:'#728EAD',social:'#7FB5A4',vida:'#C57E74'};
let excluded=[],catalogTab='series',ranking;
const options=()=>({mode:$('mode').value,transition:$('transition').value,current:$('current').checked,relative:$('relative').checked,excluded,weights:Object.fromEntries(['economia','social','vida'].map(g=>[g,+$('weight_'+g).value]))});
const byId=id=>DATA.series.find(s=>s.id===id);
const termForYear=y=>y===2016?{short:'Transição',color:'#989f93'}:Model.terms.find(t=>y>=t.start&&y<=t.end);
const annualYears=Array.from({length:32},(_,i)=>1994+i);
for(const [id,val] of [['startYear',1994],['endYear',2025]]){$(id).innerHTML=annualYears.map(y=>`<option ${y===val?'selected':''}>${y}</option>`).join('');}
$('indicator').innerHTML=Object.keys(groups).map(g=>`<optgroup label="${groups[g]}">${DATA.series.filter(s=>s.group===g).map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</optgroup>`).join('');
for(const id of ['compareA','compareB']) $(id).innerHTML=Model.terms.map(t=>`<option value="${t.id}">${t.short} · ${t.start}–${t.end}</option>`).join('');
$('compareA').value='lula1';$('compareB').value='bolsonaro';
$('weights').innerHTML=Object.entries(colors).map(([g,color])=>`<div class="weight"><div class="weight-head"><label for="weight_${g}" style="color:${color}">${groups[g]}</label><output id="out_${g}">1×</output></div><input id="weight_${g}" type="range" min="0" max="5" value="1" step="0.5" aria-label="Peso de ${groups[g]}"></div>`).join('');
function snapshot(){
 const ipca=byId('BCB_433'),debt=byId('BCB_13762');
 $('snapshot').innerHTML=`<div><small>Base para explorar</small><b>${DATA.series.length} séries</b><p>Fontes públicas · cobertura variável</p></div><div><small>PIB real · 2025</small><b>${fmt(byId('NY.GDP.MKTP.KD.ZG').values['2025'])}%</b><p>Variação anual · WDI / contas nacionais</p></div><div><small>IPCA · ${ipca.latest.data.slice(3)}</small><b>${fmt(+ipca.latest.valor)}%</b><p>Último mês disponível · não é taxa anual</p></div><div><small>Dívida bruta · ${debt.latest.data.slice(3)}</small><b>${fmt(+debt.latest.valor)}%</b><p>Do PIB · BCB · leitura mensal</p></div>`;
}
function chart(){
 const s=byId($('indicator').value),a=+$('startYear').value,b=+$('endYear').value;
 $('chartTitle').textContent=s.name;$('chartUnit').textContent=s.unit;
 $('chartNote').textContent=s.note+(s.latest?` Última observação mensal disponível: ${s.latest.data.slice(3)} = ${fmt(+s.latest.valor)}. O gráfico e as comparações usam somente anos completos.`:'');
 $('chartSource').innerHTML=`<a href="${esc(s.url)}" target="_blank" rel="noopener">Fonte e metodologia ↗</a> · ${esc(s.source)} · Código: ${esc(s.id)} · Consulta: ${esc(s.collectedAt||DATA.asOf)}`;
 $('worldLine').disabled=s.id!=='NY.GDP.MKTP.KD.ZG';
 if(a>b){$('eventContext').innerHTML='';$('chart').innerHTML='<p class="empty">Escolha um ano inicial anterior ou igual ao final.</p>';$('annualTable').innerHTML='';$('lastValue').innerHTML='';$('chartLegend').innerHTML='';return;}
 renderEventContext(a,b,s);
 const pts=Object.entries(s.values).map(([y,v])=>[+y,v]).filter(([y])=>y>=a&&y<=b).sort((x,y)=>x[0]-y[0]);
 const world=s.id==='NY.GDP.MKTP.KD.ZG'&&$('worldLine').checked?Object.entries(byId('NY.GDP.MKTP.KD.ZG@WLD').values).map(([y,v])=>[+y,v]).filter(([y])=>y>=a&&y<=b).sort((x,y)=>x[0]-y[0]):[];
 const last=pts.at(-1);$('lastValue').innerHTML=last?`<strong>${compact(last[1])}</strong><small>último ano no recorte · ${last[0]}</small>`:'<small>Sem dados no recorte</small>';
 if(!pts.length){$('chart').innerHTML='<p class="empty">Não há observações publicadas nesta janela.</p>'; $('annualTable').innerHTML='';$('chartLegend').innerHTML='';return;}
 const W=1100,H=380,L=70,R=24,T=27,B=100;
 let min=Math.min(...pts.map(p=>p[1]),...world.map(p=>p[1])),max=Math.max(...pts.map(p=>p[1]),...world.map(p=>p[1]));
 let pad=(max-min)*.14||Math.max(Math.abs(max)*.1,1);min-=pad;max+=pad;
 const X=y=>L+((y-a+.5)/(b-a+1))*(W-L-R),Y=v=>H-B-(v-min)/(max-min)*(H-T-B);
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="${esc(s.name)}, ${a} a ${b}. Valores disponíveis na tabela abaixo.">`;
 const spans=Model.terms.filter(t=>t.id!=='bolsonaro').concat([{start:2016,end:2016,short:'Transição',color:'#86755b'},{start:2019,end:2019,short:'Bolsonaro',color:Model.parties.PSL.color},{start:2020,end:2021,short:'Bolsonaro',color:Model.parties.none.color},{start:2022,end:2022,short:'Bolsonaro',color:Model.parties.PL.color}]);
 spans.forEach(t=>{const st=Math.max(a,t.start),en=Math.min(b,t.end);if(st<=en){const x=X(st)-((W-L-R)/(b-a+1)/2),width=(en-st+1)*(W-L-R)/(b-a+1);svg+=`<rect x="${x}" y="${T}" width="${width}" height="${H-T-B}" fill="${t.color}" opacity=".07"/>`;if(width>45)svg+=`<text class="chart-bg-label" x="${x+width/2}" y="17" text-anchor="middle" font-size="11" fill="${t.color}">${t.short}</text>`;}});
 for(let i=0;i<=4;i++){const v=min+(max-min)*i/4,y=Y(v);svg+=`<line x1="${L}" x2="${W-R}" y1="${y}" y2="${y}" stroke="#dfe4d9" stroke-dasharray="3 4"/><text x="${L-10}" y="${y+4}" font-size="11" fill="#748071" text-anchor="end">${compact(v)}</text>`;}
 const step=b-a>20?4:b-a>10?2:1;
 for(let y=a;y<=b;y++){if((y-a)%step===0||y===b)svg+=`<text x="${X(y)}" y="${H-B+22}" text-anchor="middle" font-size="11" fill="#748071">${y}</text>`;}
 const path=points=>points.map((p,i)=>`${i===0||p[0]-points[i-1][0]>1?'M':'L'}${X(p[0]).toFixed(2)},${Y(p[1]).toFixed(2)}`).join(' ');
 if(world.length)svg+=`<path d="${path(world)}" fill="none" stroke="#b18b4b" stroke-width="2" stroke-dasharray="6 4"/>`;
 // Cada metade de um segmento usa a cor do ponto anual correspondente.
 for(let i=1;i<pts.length;i++){
  const p=pts[i-1],q=pts[i];if(q[0]-p[0]>1)continue;
  const mx=(X(p[0])+X(q[0]))/2,my=(Y(p[1])+Y(q[1]))/2;
  svg+=`<path d="M${X(p[0])},${Y(p[1])} L${mx},${my}" fill="none" stroke="${Model.partyForYear(p[0]).color}" stroke-width="2.7"/><path d="M${mx},${my} L${X(q[0])},${Y(q[1])}" fill="none" stroke="${Model.partyForYear(q[0]).color}" stroke-width="2.7"/>`;
 }
 const event=$('showEvents').checked?EVENTS.find(e=>e.id===selectedEvent):null;
 if(event&&event.year<=b&&event.end>=a){
  const st=Math.max(a,event.year),en=Math.min(b,event.end),half=(W-L-R)/(b-a+1)/2;
  svg+=`<rect x="${X(st)-half}" y="${T}" width="${(en-st+1)*half*2}" height="${H-T-B}" fill="#d49834" opacity=".11"/>`;
 }
 for(const [y,v] of pts){const marked=event&&y>=event.year&&y<=event.end;
  if(marked)svg+=`<circle cx="${X(y)}" cy="${Y(v)}" r="9" fill="none" stroke="#a26913" stroke-width="2"/>`;
  svg+=`<circle cx="${X(y)}" cy="${Y(v)}" r="4" fill="#fffefa" stroke="${Model.partyForYear(y).color}" stroke-width="2" tabindex="0"><title>${y}: ${compact(v)} ${esc(s.unit)} · ${termForYear(y)?.short||''} · ${Model.partyForYear(y).name}${marked?' · '+esc(event.title):''}</title></circle>`;
 }
 if($('showEvents').checked)getChartEvents(s,a,b).forEach((e,i)=>{if(e.end<a||e.year>b)return;
  const cy=H-62+(i%3)*24,active=e.id===selectedEvent;
  svg+=`<g class="event-marker" role="button" tabindex="0" data-event="${e.id}" aria-label="${esc(e.title)} · ${esc(e.date)}" aria-pressed="${active}"><title>${esc(e.date)} · ${esc(e.title)}</title><line x1="${X(Math.max(a,e.year))}" x2="${X(Math.max(a,e.year))}" y1="${T}" y2="${cy-10}" stroke="${active?'#a26913':'#8e9586'}" stroke-dasharray="3 5" opacity=".45"/><circle cx="${X(Math.max(a,e.year))}" cy="${cy}" r="10" fill="${active?'#875814':'#edf0e6'}" stroke="#a7ae9d"/><text x="${X(Math.max(a,e.year))}" y="${cy+4}" text-anchor="middle" font-size="11" fill="${active?'#fff':'#20392f'}">${i+1}</text></g>`;
 });
 if(world.length)for(const [y,v] of world)svg+=`<circle cx="${X(y)}" cy="${Y(v)}" r="3" fill="#b18b4b"><title>Mundo ${y}: ${fmt(v)}%</title></circle>`;
 $('chart').innerHTML=svg+'</svg>';
 bindEventButtons($('chart'));
 $('chartLegend').innerHTML=Model.terms.filter(t=>t.end>=a&&t.start<=b).map(t=>t.id==='bolsonaro'?[[2019,2019],[2020,2021],[2022,2022]].filter(([st,en])=>en>=a&&st<=b).map(([st])=>`<span><i style="background:${Model.partyForYear(st).color}"></i>Bolsonaro · ${Model.partyForYear(st).name}</span>`).join(''):`<span><i style="background:${t.color}"></i>${t.short} · ${t.party}</span>`).join('')+(a<=2016&&b>=2016?'<span>2016 · compartilhado</span>':'')+(world.length?'<span><i style="background:#b18b4b"></i>Mundo (tracejado)</span>':'');
 $('annualTable').innerHTML='<thead><tr><th>Ano</th><th>Governo / recorte</th><th>Valor</th><th>Unidade</th></tr></thead><tbody>'+Array.from({length:b-a+1},(_,i)=>a+i).map(y=>`<tr><td>${y}</td><td>${termForYear(y)?.short||'—'}</td><td>${s.values[y]==null?'Sem observação':compact(s.values[y])}</td><td>${s.unit}</td></tr>`).join('')+'</tbody>';
}
function renderRank(){
 const opts=options();ranking=Model.calculate(DATA,opts);
 for(const g of Object.keys(colors))$('out_'+g).textContent=fmt(opts.weights[g],1)+'×';
 $('rankSummary').textContent=`${ranking.terms.length} mandatos · ${ranking.active.length} métricas na cesta comum`;
 $('rankingRows').innerHTML=ranking.rows.map(r=>{
  const denom=Object.entries(r.groups).reduce((a,[g,v])=>a+(v===null?0:opts.weights[g]),0);
  return `<div class="rank-row"><span class="rank-number">${r.position==null?'—':String(r.position).padStart(2,'0')}</span><div class="rank-name">${r.term.name}<small>${r.term.start}–${r.term.end}${r.term.id==='lula3'?' · mandato em andamento':''}${r.reason?' · '+esc(r.reason):''}</small></div><div class="rank-bar" aria-label="Contribuições ponderadas à nota">${Object.entries(r.groups).filter(([g,v])=>v!==null).map(([g,v])=>`<span style="width:${denom?v*opts.weights[g]/denom:0}%;background:${colors[g]}" title="${groups[g]}: ${fmt(v,1)} / 100; peso ${opts.weights[g]}"></span>`).join('')}</div><div class="rank-score">${fmt(r.score,2)}<small>de 100</small></div></div>`;
 }).join('');
 const unavailable=ranking.evaluations.filter(e=>!ranking.eligible.includes(e)).map(e=>e.series.name);
 $('rankWarning').textContent=ranking.rows[0]?.score==null?'Sem nota: selecione ao menos uma métrica elegível e um peso positivo.':`Cesta comum: ${ranking.active.map(e=>e.series.name).join('; ')}. ${unavailable.length?'Fora da cesta por cobertura: '+unavailable.join('; ')+'. ':''}Finanças públicas, educação e moradia não compõem esta nota. Resultados dependem do recorte e dos pesos; consulte as janelas abaixo.`;
 $('metricChoices').innerHTML=ranking.evaluations.map(e=>{const valid=ranking.eligible.includes(e),missing=e.stats.map((s,i)=>s.valid?'':ranking.terms[i].short+': '+s.reason).filter(Boolean).join('; ');return `<label class="check ${valid?'':'disabled'}"><input type="checkbox" data-metric="${e.series.id}" ${!excluded.includes(e.series.id)&&valid?'checked':''} ${valid?'':'disabled'}><span>${e.series.name}${valid?'':`<small>${missing}</small>`}</span></label>`;}).join('');
 $('metricChoices').querySelectorAll('input').forEach(el=>el.addEventListener('change',()=>{excluded=el.checked?excluded.filter(x=>x!==el.dataset.metric):[...excluded,el.dataset.metric];renderRank();}));
 $('auditTable').innerHTML='<thead><tr><th>Governo</th><th>Métrica</th><th>Janela / observações</th><th>Primeiro → último</th><th>Valor agregado</th><th>Nota relativa</th></tr></thead><tbody>'+ranking.rows.flatMap(r=>r.metrics.map(m=>{const s=byId(m.id);return `<tr><td>${r.term.short}</td><td>${s.name}<small>${s.direction>0?'Maior':'Menor'} é melhor nesta regra</small></td><td>${m.first[0]}–${m.last[0]}<small>${m.n} anos · ${fmt(100*m.coverage,0)}% de cobertura</small></td><td>${compact(m.first[1])} → ${compact(m.last[1])}<small>${s.unit}</small></td><td>${compact(m.value)}<small>${m.method==='mean'?(opts.relative&&m.id==='NY.GDP.MKTP.KD.ZG'?'média Brasil − mundo (p.p.)':'média · '+s.unit):s.unit+' / ano decorrido'}</small></td><td>${fmt(m.score,1)}</td></tr>`;})).join('')+'</tbody>';
 renderCompare();renderPolicies();renderCountry();if(investmentReady)renderInvestment();
}
function renderCompare(){
 const opts=options(),ts=Model.getTerms({...opts,current:true});
 const getT=id=>ts.find(t=>t.id===id)||Model.terms.find(t=>t.id===id),a=getT($('compareA').value),b=getT($('compareB').value);
 $('compareTable').innerHTML=`<thead><tr><th>Indicador / unidade</th><th>${a.short} · ${a.start}–${a.end}</th><th>${b.short} · ${b.start}–${b.end}</th></tr></thead><tbody>`+DATA.series.filter(s=>s.group!=='contexto').map(s=>`<tr><td>${s.name}<small>${s.unit}</small></td>${[a,b].map(t=>{const st=Model.stats(s,t,{mode:'level'});return `<td>${st.n?compact(st.mean):'—'}<small>${st.n?`${st.first[0]}–${st.last[0]} · ${st.n} observações`:'Sem dados publicados'}</small></td>`;}).join('')}</tr>`).join('')+'</tbody>';
}
function catalog(){
 const q=$('search').value.toLocaleLowerCase('pt-BR');
 if(catalogTab==='series'){
  const rows=DATA.series.filter(s=>(s.name+' '+s.group+' '+s.id+' '+s.note).toLocaleLowerCase('pt-BR').includes(q));
  $('catalogCount').textContent=rows.length+' séries';
  $('catalog').innerHTML='<thead><tr><th>Indicador</th><th>Cobertura anual</th><th>Fonte</th><th>Definição e limites</th></tr></thead><tbody>'+rows.map(s=>{const ys=Object.keys(s.values).map(Number).filter(y=>y>=1994).sort();return `<tr><td><b>${s.name}</b><small>${groups[s.group]} · ${s.unit}</small></td><td><span class="status">Carregado</span><small>${ys[0]}–${ys.at(-1)} · ${ys.length} observações</small><div class="coverage" title="Cada coluna representa um ano de 1994 a 2025">${annualYears.map(y=>`<i class="${s.values[y]!=null?'yes':''}" title="${y}: ${s.values[y]!=null?'disponível':'ausente'}"></i>`).join('')}</div></td><td><a href="${esc(s.url)}" target="_blank" rel="noopener">Fonte original ↗</a><small>${esc(s.id)}</small><small>Consulta: ${esc(s.collectedAt||DATA.asOf)}</small><small>Atualização informada: ${esc(s.updated||'não informada')}</small></td><td>${esc(s.note)}<details><summary>Metadados da fonte</summary><p>${esc(s.source)}</p><p>${esc(s.sourceNote)}</p></details></td></tr>`;}).join('')+'</tbody>';
 }else{
  const rows=INVENTORY.filter(row=>row.join(' ').toLocaleLowerCase('pt-BR').includes(q));$('catalogCount').textContent=rows.length+' itens da lista';
  $('catalog').innerHTML='<thead><tr><th>Solicitado</th><th>Adaptação brasileira</th><th>Situação nesta versão</th><th>Acesso e ressalvas</th></tr></thead><tbody>'+rows.map(([name,br,status,note,url])=>`<tr><td>${name}</td><td>${br}</td><td><span class="status ${status==='Não integrado'?'absent':status.includes('Carregado')||status.includes('carregado')?'':'pending'}">${status}</span></td><td>${note}${url?`<small><a href="${esc(url)}" target="_blank" rel="noopener">Consultar fonte / referência ↗</a></small>`:''}</td></tr>`).join('')+'</tbody>';
 }
}
function downloadCSV(name,rows){const csv='\ufeff'+rows.map(row=>row.map(v=>'"'+String(v??'').replaceAll('"','""')+'"').join(';')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function exportRank(){const opts=options();downloadCSV('ranking-governos-criterios.csv',[
 ['Consulta',DATA.asOf],['Mandatos sem nota',ranking.rows.filter(r=>r.score===null).map(r=>r.term.short+': '+(r.reason||'Sem métricas ou pesos ativos')).join(' | ')],['Criterio',opts.mode],['Tratamento 2016',opts.transition],['Inclui mandato atual',opts.current],['PIB relativo ao mundo',opts.relative],['Pesos relativos',JSON.stringify(opts.weights)],['Metricas ativas',ranking.active.map(e=>e.series.id).join(' | ')],['Formula','Min-max 0–100 entre governos; média por dimensão; média ponderada entre dimensões. Sem inferência causal.'],[],
 ['Posicao','Governo','Inicio recorte','Fim recorte','Nota','Metrica','Janela inicio','Janela fim','N observacoes','Cobertura','Primeiro valor','Ultimo valor','Metodo','Agregado','Unidade original','Nota metrica','Fonte'],
 ...ranking.rows.flatMap(r=>r.metrics.map(m=>[r.position,r.term.name,r.term.start,r.term.end,r.score,m.id,m.first[0],m.last[0],m.n,m.coverage,m.first[1],m.last[1],m.method,m.value,byId(m.id).unit,m.score,byId(m.id).url]))]);}
$('exportRank').addEventListener('click',exportRank);
$('exportData').addEventListener('click',()=>downloadCSV('brasil-indicadores-1994-2025.csv',[['Indicador','Codigo','Ano','Valor','Unidade','Fonte','Data da consulta'],...DATA.series.flatMap(s=>Object.entries(s.values).filter(([y])=>+y>=1994).sort((a,b)=>+a[0]-b[0]).map(([y,v])=>[s.name,s.id,y,v,s.unit,s.url,s.collectedAt||DATA.asOf]))]));
for(const id of ['indicator','startYear','endYear','worldLine','showEvents','eventMode','eventCategory','eventType','eventScope','eventLimit'])$(id).addEventListener('change',chart);
for(const id of ['mode','transition','current','relative'])$(id).addEventListener('change',renderRank);
for(const g of Object.keys(colors))$('weight_'+g).addEventListener('input',renderRank);
for(const id of ['compareA','compareB'])$(id).addEventListener('change',renderCompare);
for(const [id,tab] of [['seriesTab','series'],['inventoryTab','inventory']])$(id).addEventListener('click',()=>{catalogTab=tab;$('seriesTab').setAttribute('aria-selected',String(tab==='series'));$('inventoryTab').setAttribute('aria-selected',String(tab==='inventory'));catalog();});
$('search').addEventListener('input',catalog);
$('reset').addEventListener('click',()=>{$('mode').value='change';$('transition').value='exclude';$('current').checked=true;$('relative').checked=false;for(const g of Object.keys(colors))$('weight_'+g).value=1;excluded=[];renderRank();});
initContext();initCountry();snapshot();chart();renderRank();catalog();initInvestment();
