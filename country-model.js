(function(root){
 'use strict';
 const areas=[
  {id:'economia',name:'Economia',color:'#728EAD',metrics:[['NY.GDP.MKTP.KD.ZG',1],['NY.GDP.PCAP.KD',1],['SL.UEM.TOTL.ZS',-1],['BCB_433',-1]],reading:'Produção, renda média por habitante, emprego e inflação. Menor inflação é uma escolha simplificada, sem premiar cumprimento de meta. PIB por habitante não é renda mediana.'},
  {id:'social',name:'Condições sociais',color:'#7FB5A4',metrics:[['SI.POV.GINI',-1],['SI.POV.UMIC',-1]],reading:'Desigualdade de renda e pobreza internacional; não mede patrimônio ou toda a proteção social.'},
  {id:'vida',name:'Saúde e segurança',color:'#C57E74',metrics:[['SP.DYN.LE00.IN',1],['VC.IHR.PSRC.P5',-1]],reading:'Longevidade e homicídios intencionais. Segurança envolve estados e municípios; não inclui todos os crimes.'},
  {id:'educacao',name:'Educação',color:'#D5AD6D',metrics:[['SE.SEC.CUAT.UP.ZS',1],['SE.ADT.LITR.ZS',1]],reading:'Escolaridade acumulada e alfabetização; não mede proficiência da aprendizagem.'},
  {id:'ciencia',name:'Ciência e tecnologia',color:'#728EAD',metrics:[['GB.XPD.RSDV.GD.ZS',1],['IT.NET.USER.ZS',1]],reading:'Esforço nacional de P&D e difusão de internet. São aproximações de insumo e acesso, não produtividade científica.'},
  {id:'fiscal',name:'Finanças públicas',color:'#7FB5A4',metrics:[['BCB_13762',-1],['BCB_5727',-1]],reading:'Dívida e déficit nominal do governo geral. Menores razões são uma escolha normativa; não avaliam a qualidade do gasto.'}
 ];
 const finite=Number.isFinite;
 const average=xs=>xs.length?xs.reduce((a,b)=>a+b,0)/xs.length:null;
 function quantile(sorted,p){if(!sorted.length)return null;const pos=(sorted.length-1)*p,i=Math.floor(pos),f=pos-i;return sorted[i]+((sorted[i+1]??sorted[i])-sorted[i])*f;}
 function reference(data,method='robust'){
  return areas.flatMap(a=>a.metrics.map(([id,direction])=>{
   const series=data.series.find(s=>s.id===id);
   const values=Object.entries(series?.values||{}).filter(([y,v])=>+y>=1994&&+y<=2025&&finite(v)).map(([,v])=>v).sort((a,b)=>a-b);
   return {id,area:a.id,direction,n:values.length,lo:quantile(values,method==='robust'?.1:0),hi:quantile(values,method==='robust'?.9:1)};
  }));
 }
 function normalize(value,ref){
  if(!finite(value)||!ref||!finite(ref.lo)||!finite(ref.hi))return null;
  if(Math.abs(ref.hi-ref.lo)<1e-12)return 50;
  const raw=Math.max(0,Math.min(1,(value-ref.lo)/(ref.hi-ref.lo)));
  return 100*(ref.direction>0?raw:1-raw);
 }
 function calculate(data,opts={}){
  const refs=reference(data,opts.scale||'robust'),weights=Object.fromEntries(areas.map(a=>[a.id,Math.max(0,finite(opts.weights?.[a.id])?opts.weights[a.id]:1)]));
  const byId=new Map(data.series.map(s=>[s.id,s]));
  const years=Array.from({length:32},(_,i)=>{
   const year=1994+i;
   const metrics=refs.map(r=>{const raw=byId.get(r.id)?.values[year];return {...r,raw:finite(raw)?raw:null,score:normalize(raw,r)};});
   // Uma dimensão só existe quando toda a sua cesta fixa está observada no ano.
   const groups=Object.fromEntries(areas.map(a=>{const ms=metrics.filter(m=>m.area===a.id);return [a.id,ms.every(m=>m.score!==null)?average(ms.map(m=>m.score)):null];}));
   const required=areas.filter(a=>weights[a.id]>0),observed=required.filter(a=>groups[a.id]!==null),complete=required.length>0&&required.length===observed.length;
   const denominator=observed.reduce((sum,a)=>sum+weights[a.id],0);
   const score=(!opts.strict||complete)&&denominator?observed.reduce((sum,a)=>sum+groups[a.id]*weights[a.id],0)/denominator:null;
   return {year,groups,metrics,score,complete,nAreas:observed.length,required:required.length,weightCoverage:required.length?denominator/required.reduce((sum,a)=>sum+weights[a.id],0):0};
  });
  return {areas,refs,weights,years,scale:opts.scale||'robust',strict:!!opts.strict};
 }
 function summarize(index,terms){
  return terms.map(term=>{
   const annual=index.years.filter(r=>r.year>=term.start&&r.year<=term.end),scored=annual.filter(r=>r.score!==null),full=scored.filter(r=>r.complete);
   const groups=Object.fromEntries(areas.map(a=>{const ys=annual.filter(r=>r.groups[a.id]!==null);return [a.id,{score:average(ys.map(r=>r.groups[a.id])),n:ys.length}];}));
   return {term,score:average(scored.map(r=>r.score)),n:scored.length,expected:annual.length,full:full.length,first:scored[0]||null,last:scored.at(-1)||null,groups,partial:scored.some(r=>!r.complete),weightCoverage:average(scored.map(r=>r.weightCoverage))};
  });
 }
 const api={areas,reference,normalize,calculate,summarize,quantile};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Country=api;
})(typeof window==='undefined'?globalThis:window);
