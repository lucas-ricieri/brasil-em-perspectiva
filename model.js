(function(root){
  'use strict';
  const terms=[
    {id:'itamar',name:'Itamar Franco',short:'Itamar',start:1994,end:1994,color:'#7c8693',note:'Somente 1994; mandato começou em 1992. Fora do ranking.'},
    {id:'fhc',name:'Fernando H. Cardoso',short:'FHC',start:1995,end:2002,color:'#567cba',note:'Dois mandatos consecutivos agrupados.'},
    {id:'lula12',name:'Lula · 1º e 2º mandatos',short:'Lula I–II',start:2003,end:2010,color:'#248b79',note:'Dois mandatos consecutivos agrupados.'},
    {id:'dilma',name:'Dilma Rousseff',short:'Dilma',start:2011,end:2015,color:'#a079ad',note:'Governou até 2016; o ano de transição é tratado separadamente.'},
    {id:'temer',name:'Michel Temer',short:'Temer',start:2017,end:2018,color:'#b18b4b',note:'Assumiu interinamente em maio/2016; o ano de transição é tratado separadamente.'},
    {id:'bolsonaro',name:'Jair Bolsonaro',short:'Bolsonaro',start:2019,end:2022,color:'#c47257',note:'Inclui o choque da pandemia e a recuperação posterior.'},
    {id:'lula3',name:'Lula · 3º mandato',short:'Lula III',start:2023,end:2025,color:'#367f98',note:'Em andamento em 2026. Ranking usa apenas anos completos publicados, até 2025.'}
  ];
  const alwaysMean=new Set(['NY.GDP.MKTP.KD.ZG','BCB_433']);
  function getTerms(opts={}){return terms.filter(t=>t.id!=='itamar'&&(opts.current!==false||t.id!=='lula3')).map(t=>({...t,start:t.id==='temer'&&opts.transition==='temer'?2016:t.start,end:t.id==='dilma'&&opts.transition==='dilma'?2016:t.end}));}
  function stats(series,term,opts={}){
    const points=Object.entries(series.values).map(([y,v])=>[+y,v]).filter(([y,v])=>y>=term.start&&y<=term.end&&Number.isFinite(v)).sort((a,b)=>a[0]-b[0]);
    const needed=term.end-term.start+1;
    if(!points.length) return {valid:false,n:0,reason:'Sem observações no período'};
    const first=points[0],last=points.at(-1),coverage=points.length/needed;
    let vals=points.map(([y,v])=>series.id==='NY.GDP.MKTP.KD.ZG'&&opts.world?v-opts.world[y]:v);
    let value=vals.reduce((a,b)=>a+b,0)/vals.length;
    const method=opts.mode==='level'||alwaysMean.has(series.id)?'mean':'change';
    if(method==='change') value=last[0]===first[0]?null:(last[1]-first[1])/(last[0]-first[0]);
    const valid=points.length>=2&&coverage>=.6&&first[0]<=term.start+1&&last[0]>=term.end-1&&Number.isFinite(value);
    return {valid,n:points.length,coverage,first,last,value,method,mean:points.reduce((a,p)=>a+p[1],0)/points.length,reason:valid?'':points.length<2?'Menos de 2 anos publicados':coverage<.6?'Cobertura inferior a 60%':'Dados distantes dos extremos do período'};
  }
  function calculate(data,opts={}){
    const ts=getTerms(opts),candidates=data.series.filter(s=>s.rank),world=opts.relative?data.series.find(s=>s.id==='NY.GDP.MKTP.KD.ZG@WLD')?.values:null;
    const opt={...opts,world};
    const evaluations=candidates.map(s=>({series:s,stats:ts.map(t=>stats(s,t,opt))}));
    const eligible=evaluations.filter(e=>e.stats.every(s=>s.valid));
    const active=eligible.filter(e=>!opts.excluded?.includes(e.series.id));
    const weights=opts.weights||{economia:1,social:1,vida:1};
    const rows=ts.map((term,i)=>{
      const metrics=active.map(e=>{
        const values=e.stats.map(s=>s.value*e.series.direction),lo=Math.min(...values),hi=Math.max(...values);
        const score=Math.abs(hi-lo)<1e-12?50:100*(values[i]-lo)/(hi-lo);
        return {id:e.series.id,group:e.series.group,score,...e.stats[i]};
      });
      const groups={};
      for(const g of ['economia','social','vida']){const m=metrics.filter(m=>m.group===g);groups[g]=m.length?m.reduce((s,m)=>s+m.score,0)/m.length:null;}
      const denom=Object.entries(groups).reduce((s,[g,v])=>s+(v===null?0:(weights[g]||0)),0);
      const score=denom?Object.entries(groups).reduce((s,[g,v])=>s+(v===null?0:v*(weights[g]||0)),0)/denom:null;
      return {term,score,groups,metrics};
    }).sort((a,b)=>(b.score??-1)-(a.score??-1));
    rows.forEach((r,i)=>r.position=r.score===null?null:(i>0&&Math.abs(r.score-rows[i-1].score)<1e-9?rows[i-1].position:i+1));
    return {rows,active,eligible,evaluations,terms:ts};
  }
  const api={terms,getTerms,stats,calculate};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Model=api;
})(typeof window==='undefined'?globalThis:window);
