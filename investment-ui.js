'use strict';
let selectedSlice=0,investmentReady=false;
const investmentPalette=['#728EAD','#7FB5A4','#D5AD6D','#C57E74','#E6DFD3','#AABCD0','#B5D3C8','#E5CCA4','#DDAAA2','#C3C8CD'];
const companyKinds={unicorn:'Marco de unicórnio',entry:'Entrada comercial',expansion:'Expansão', 'factory-exit':'Encerramento fabril','ownership-sale':'Venda de controle',exit:'Saída operacional'};
function initInvestment(){
 for(const id of ['investmentView','investmentKind'])$(id).addEventListener('change',()=>{selectedSlice=0;fillInvestmentYears();renderInvestment();});
 $('investmentYear').addEventListener('change',()=>{selectedSlice=0;renderInvestment();});
 $('companyTerm').innerHTML='<option value="all">Todos os mandatos</option>'+Model.terms.map(t=>`<option value="${t.id}">${t.short} · ${t.start}–${t.end}</option>`).join('')+'<option value="transition">2016 · ano compartilhado</option>';
 for(const id of ['companyTerm','companyKind'])$(id).addEventListener('change',renderCompanies);
 $('exportInvestment').addEventListener('click',()=>{
  const {source,row,year}=investmentComposition();
  downloadCSV('brasil-composicao-setorial.csv',[['Recorte',source.title],['Ano',year],['Unidade',source.unit],['Conceito',source.note],['Fonte',source.url],['Consulta',INVESTMENT_DETAIL.asOf],[],['Categoria','Valor','Participacao percentual','Unidade'],...row.items.map(item=>[item.label,item.value,100*item.value/row.total,source.unit])]);
 });
 investmentReady=true;fillInvestmentYears();renderInvestment();renderCompanies();
}
function investmentSource(){return $('investmentView').value==='exports'?($('investmentKind').value==='type'?INVESTMENT_DETAIL.exportTypeComposition:INVESTMENT_DETAIL.exportComposition):$('investmentView').value==='gdp'?INVESTMENT_DETAIL.gdpComposition:INVESTMENT_DETAIL.fdiStockComposition;}
function fillInvestmentYears(){
 const source=investmentSource(),previous=$('investmentYear').value;
 const years=source.years?Object.keys(source.years).map(Number).sort((a,b)=>b-a):[source.year];
 $('investmentYear').innerHTML=years.map(y=>`<option>${y}</option>`).join('');
 $('investmentYear').value=years.includes(+previous)?previous:years[0];
 $('investmentKind').disabled=$('investmentView').value!=='exports';
}
function investmentComposition(){
 const source=investmentSource(),year=+$('investmentYear').value;
 const row=source.years?source.years[year]:{total:100,items:source.items};
 return {source,row,year};
}
function renderInvestment(){
 const {source,row,year}=investmentComposition();selectedSlice=Math.min(selectedSlice,row.items.length-1);
 const summarySpecs=[['FI.RES.TOTL.CD','Reservas internacionais','US$ '],['BX.KLT.DINV.CD.WD','IED recebido · fluxo líquido','US$ '],['NE.GDI.FTOT.ZS','Investimento fixo · público + privado',''],['MDIC_EXPORT_FOB','Exportações de mercadorias · FOB','US$ ']];
 $('investmentSnapshot').innerHTML=summarySpecs.map(([id,label,prefix])=>{const s=byId(id),v=s?.values[year];return `<article><small>${label} · ${year}</small><strong>${Number.isFinite(v)?prefix+compact(v)+(s.unit==='% do PIB'?'%':''):'—'}</strong><p>${Number.isFinite(v)?esc(s.unit):'Sem observação anual neste ano'}</p><a href="${esc(s?.url||'#fontes')}" target="_blank" rel="noopener">Fonte e conceito ↗</a></article>`;}).join('');
 $('investmentChartTitle').textContent=source.title+' · '+year;
 $('investmentChartNote').textContent=source.note;
 $('investmentSource').innerHTML=`<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.source)} ↗</a> · Consulta: ${esc(INVESTMENT_DETAIL.asOf)}${source.publishedAt?' · Publicação: '+esc(source.publishedAt):''}`;
 const item=row.items[selectedSlice],pct=100*item.value/row.total;
 let offset=0;
 $('investmentDonut').innerHTML=`<svg viewBox="0 0 260 260" role="group" aria-label="${esc(source.title)} ${year}. Selecione uma fatia ou uma categoria na legenda.">${row.items.map((it,i)=>{const share=100*it.value/row.total,begin=offset;offset+=share;return `<circle class="donut-slice" data-slice="${i}" role="button" tabindex="0" aria-label="${esc(it.label)}: ${fmt(share,2)}%" cx="130" cy="130" r="88" pathLength="100" fill="none" stroke="${investmentPalette[i%investmentPalette.length]}" stroke-width="${i===selectedSlice?39:31}" stroke-dasharray="${share} ${100-share}" stroke-dashoffset="${-begin}" transform="rotate(-90 130 130)"><title>${esc(it.label)}: ${fmt(share,2)}%</title></circle>`;}).join('')}<text x="130" y="127" text-anchor="middle" fill="#293747" font-size="33" font-family="Georgia">${fmt(pct,1)}%</text><text x="130" y="151" text-anchor="middle" fill="#5c6269" font-size="10">fatia selecionada</text></svg><p><b>${esc(item.label)}</b><br>${source.years&&$('investmentView').value==='exports'?'US$ '+compact(item.value):fmt(item.value,2)+'%'}${$('investmentView').value==='fdi'?' do estoque de capital':''}</p>`;
 $('investmentLegend').innerHTML=row.items.map((it,i)=>`<button data-slice="${i}" type="button" aria-pressed="${i===selectedSlice}"><i style="background:${investmentPalette[i%investmentPalette.length]}"></i><span>${esc(it.label)}<small>${source.years&&$('investmentView').value==='exports'?'US$ '+compact(it.value):fmt(it.value,2)+'%'}</small></span><b>${fmt(100*it.value/row.total,2)}%</b></button>`).join('');
 for(const root of [$('investmentDonut'),$('investmentLegend')])root.querySelectorAll('[data-slice]').forEach(el=>{const activate=()=>{selectedSlice=+el.dataset.slice;renderInvestment();$('investmentLegend').querySelector(`[data-slice="${selectedSlice}"]`)?.focus();};el.addEventListener('click',activate);if(el.tagName.toLowerCase()!=='button')el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});});
 const view=$('investmentView').value;
 $('investmentTotals').innerHTML=view==='exports'?`<span>Total exportado em ${year}</span><strong>US$ ${compact(row.total)}</strong><small>Mercadorias · valores correntes FOB. Não inclui exportações de serviços.</small>`:view==='gdp'?`<span>Valor adicionado dos três setores / PIB</span><strong>${fmt(row.coveredShareOfGdp,2)}%</strong><small>A pizza redistribui esses três setores para somar 100% do valor adicionado setorial. A parcela fora deles é ${fmt(row.outsideSectorValueAddedPctGdp,2)}% do PIB; não é um quarto setor. Participação é tamanho, não contribuição ao crescimento.</small>`:`<span>Estoque de participação no capital · ${year}</span><strong>US$ ${compact(source.total)}</strong><small>Exclui operações intercompanhia. É estoque acumulado, não aporte anual nem ranking dos setores que mais receberam no ano.</small>`;
 $('investmentByTerm').innerHTML='<thead><tr><th>Mandato</th><th>IED recebido</th><th>Investimento fixo</th><th>Exportações de bens</th><th>Reservas internacionais</th></tr></thead><tbody>'+countryTerms().map(t=>`<tr><td>${t.short}<small>${t.start}–${t.end}</small></td>${['BX.KLT.DINV.CD.WD','NE.GDI.FTOT.ZS','MDIC_EXPORT_FOB','FI.RES.TOTL.CD'].map((id,i)=>{const s=byId(id),st=Model.stats(s,t,{mode:'level'});return `<td>${st.n?(i===1?fmt(st.mean)+'%':'US$ '+compact(i===3?st.last[1]:st.mean)):'—'}<small>${st.n?(i===3?'Estoque no último ano observado':'Média anual')+' · '+st.first[0]+'–'+st.last[0]+' · '+st.n+' anos':'Sem dados no recorte'}</small></td>`;}).join('')}</tr>`).join('')+'</tbody>';
}
function renderCompanies(){
 const termId=$('companyTerm').value,kind=$('companyKind').value,term=Model.terms.find(t=>t.id===termId);
 const periodCases=COMPANY_CASES.cases.filter(c=>termId==='all'||(termId==='transition'?c.year===2016:c.year>=term.start&&c.year<=term.end));
 const rows=periodCases.filter(c=>kind==='all'||(kind==='movements'?c.kind!=='unicorn':c.kind===kind));
 $('companyCount').textContent=`${rows.length} casos documentados no filtro · amostra, não total nacional`;
 $('companyCases').innerHTML=rows.length?rows.map(c=>`<article class="company-card"><div><span class="eyebrow">${esc(companyKinds[c.kind])} · ${esc(c.date)}</span><h4>${esc(c.name)}</h4><span class="muted">${esc(c.sector)}</span></div><p>${esc(c.description)}</p><details><summary>Escopo e evidência</summary><p>${esc(c.scope)}</p>${c.additionalSources?.map(source=>`<p><a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.title)} ↗</a></p>`).join('')||''}</details><a href="${esc(c.sourceUrl)}" target="_blank" rel="noopener">${esc(c.sourceTitle)} ↗</a></article>`).join(''):'<p class="empty">Não há casos documentados neste filtro. Isso não significa ausência de unicórnios, entradas ou saídas no país.</p>';
 $('companyByTerm').innerHTML='<thead><tr><th>Mandato</th><th>Unicórnios</th><th>Entradas</th><th>Expansões</th><th>Encerramentos fabris</th><th>Vendas de controle</th><th>Saídas operacionais</th></tr></thead><tbody>'+[...Model.terms,{id:'transition',short:'2016 · compartilhado',start:2016,end:2016}].sort((a,b)=>a.start-b.start).map(t=>{const cs=COMPANY_CASES.cases.filter(c=>c.year>=t.start&&c.year<=t.end);return `<tr><td>${t.short}<small>Apenas casos da amostra</small></td>${Object.keys(companyKinds).map(k=>`<td>${cs.filter(c=>c.kind===k).length}</td>`).join('')}</tr>`;}).join('')+'</tbody>';
 $('companyLimitations').innerHTML=COMPANY_CASES.limitations.map(t=>`<p>${esc(t)}</p>`).join('');
}
