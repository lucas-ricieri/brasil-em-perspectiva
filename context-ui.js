'use strict';
let selectedEvent='pandemia';
function bindEventButtons(root){
 root.querySelectorAll('[data-event]').forEach(button=>{
  const activate=()=>{const restore=document.activeElement===button;selectedEvent=button.dataset.event;chart();if(restore)root.querySelector('[data-event="'+selectedEvent+'"]')?.focus();};
  button.addEventListener('click',activate);
  if(button.tagName.toLowerCase()!=='button')button.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();activate();}});
 });
}
function renderEventContext(a,b,s){
 const root=$('eventContext');
 if(!$('showEvents').checked){root.innerHTML='';return;}
 const visible=getChartEvents(s,a,b);
 if(!visible.some(e=>e.id===selectedEvent))selectedEvent=visible[0]?.id||null;
 const selected=visible.find(e=>e.id===selectedEvent);
 root.innerHTML=`<div class="event-heading"><b>Marcos para ler a curva</b><span>Selecione um evento · números correspondem aos marcadores do gráfico</span></div><div class="event-chips">${visible.map(e=>`<button type="button" data-event="${e.id}" aria-pressed="${e.id===selectedEvent}"><span>${visible.indexOf(e)+1}</span>${e.year}${e.end!==e.year?'–'+e.end:''} · ${esc(e.title)}</button>`).join('')}</div>`;
 if(!selected){root.innerHTML+='<p class="muted">Nenhum marco da seleção histórica está neste recorte.</p>';return;}
 const obs=Object.entries(s.values).filter(([y])=>+y>=Math.max(a,selected.year)&&+y<=Math.min(b,selected.end)).sort(([x],[y])=>+x-+y);
 root.innerHTML+=`<article class="event-detail" aria-live="polite"><div><span class="eyebrow">${esc(selected.kind)} · ${esc(selected.date)}</span><h4>${esc(selected.title)}</h4><p>${esc(selected.text)}</p><p><b>O que observar:</b> ${esc(selected.channel)}</p><a href="${esc(selected.url)}" target="_blank" rel="noopener">Registro do evento ↗</a><div class="event-related">${selected.metrics.filter(id=>byId(id)).map(id=>`<button type="button" data-event-metric="${id}" aria-pressed="${s.id===id}">${esc(byId(id).name)}</button>`).join('')}</div></div><aside><small>Na curva selecionada · ${esc(s.name)}</small>${obs.length?obs.map(([y,v])=>`<b>${y} · ${compact(v)} <small>${esc(s.unit)}</small></b>`).join(''):'<p>Sem observação anual neste intervalo. A lacuna foi preservada.</p>'}<p>Coincidência no tempo não demonstra causa. As faixas destacam anos, não variações diárias.</p></aside></article>`;
 bindEventButtons(root);
 root.querySelectorAll('[data-event-metric]').forEach(button=>button.addEventListener('click',()=>{$('indicator').value=button.dataset.eventMetric;chart();}));
}
function initContext(){
 for(const id of ['policyA','policyB'])$(id).innerHTML=Model.terms.map(t=>`<option value="${t.id}">${t.short} · ${t.party}</option>`).join('');
 $('policyA').value='lula1';$('policyB').value='bolsonaro';
 for(const id of ['policyA','policyB','policyTopic','policyStatus'])$(id).addEventListener('change',renderPolicies);
}
function renderPolicies(){
 const topic=$('policyTopic').value;
 const numericTerms=Model.getTerms({...options(),current:true});
 $('policyCards').innerHTML=['policyA','policyB'].map(id=>{
  const term=Model.terms.find(t=>t.id===$(id).value),recut=numericTerms.find(t=>t.id===term.id)||term,p=PROFILES[term.sourceProfile||term.id];
  const periodActions=p.actions.filter(action=>action.term?action.term===term.id:action.year>=(term.actualStart||term.start)&&action.year<=(term.actualEnd||term.end));
  const status=$('policyStatus').value;
  const approved=a=>a.status==='Marco aprovado'||a.status.startsWith('Lei aprovada');
  const actions=periodActions.filter(action=>(topic==='all'||(topic==='crime'?action.subtopic==='crime':action.topic===topic))&&(status==='all'||(status==='approved'?approved(action):!approved(action))));
  const ids=['NY.GDP.MKTP.KD.ZG','SI.POV.UMIC','SE.XPD.TOTL.GD.ZS','SH.XPD.GHED.GD.ZS','STN_COFOG_703','GB.XPD.RSDV.GD.ZS','IT.NET.USER.ZS','BCB_13762','BCB_5727'];
  return `<article class="policy-card" style="--party:${term.color}"><div class="policy-card-head"><span class="eyebrow">${esc(term.party)} · recorte ${recut.start}–${recut.end}</span><h3>${esc(term.name)}</h3><p><b>Eixos da presidência na amostra:</b> ${esc(p.focus)}</p><p class="muted">${esc(p.difference)}</p><span class="profile-count">${periodActions.length} marcos documentados neste mandato · ${actions.length} no filtro</span></div><div class="policy-actions"><h4>Decisões e agenda por área</h4>${actions.length?actions.map(action=>`<details class="policy-action"><summary><span class="action-year">${action.year}</span><span>${esc(action.title)}<small>${esc(groups[action.topic]||action.topic)}${action.subtopic==='crime'?' · combate ao crime':''} · ${esc(action.ref)}</small></span><span class="status ${approved(action)?'':'pending'}">${esc(action.status)}</span></summary><div class="action-body"><p><b>Ação ou tentativa documentada:</b> ${esc(action.action)}</p><p><b>Como pode atuar:</b> ${esc(action.mechanism)}</p><p><b>Limite da interpretação:</b> ${esc(action.limit)}</p><div class="action-links"><a href="${esc(action.url)}" target="_blank" rel="noopener">Documento de referência ↗</a><button type="button" class="text-button" data-policy-metric="${action.metric}" data-term="${term.id}" data-policy-year="${action.year}">Explorar indicador relacionado ↗</button></div></div></details>`).join(''):'<p class="empty">Nenhum marco desta área na amostra deste governo. Isso não significa ausência de ações.</p>'}</div><div class="policy-outcomes"><h4>Resultados observados no período</h4><p class="muted">Primeiro → último valor publicado dentro do recorte. São observações, não efeitos atribuídos aos atos acima.</p>${ids.filter(metric=>{const s=byId(metric);return s&&(topic==='all'||(topic==='crime'?s.id==='VC.IHR.PSRC.P5'||s.id==='STN_COFOG_703':s.group===topic));}).map(metric=>{
   const s=byId(metric),st=Model.stats(s,recut,{mode:'level'});
   return `<div class="outcome"><span>${esc(s.name)}<small>${esc(s.unit)}</small></span><span>${st.n?compact(st.first[1])+' → '+compact(st.last[1]):'Sem dados'}<small>${st.n?st.first[0]+'–'+st.last[0]+' · '+st.n+' observações'+(st.n===1?' · um único ano':''):'Sem observações no recorte'}${st.n&&!st.valid?' · cobertura insuficiente para o ranking':''}</small></span></div>`;
  }).join('')}</div></article>`;
 }).join('');
 $('policyCards').querySelectorAll('[data-policy-metric]').forEach(button=>button.addEventListener('click',()=>{
  const term=numericTerms.find(t=>t.id===button.dataset.term)||Model.terms.find(t=>t.id===button.dataset.term);
  $('indicator').value=button.dataset.policyMetric;$('startYear').value=Math.min(term.start,+button.dataset.policyYear);$('endYear').value=Math.min(2025,Math.max(term.end,+button.dataset.policyYear));chart();$('explorar').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
 }));
}
