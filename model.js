(function(root){
  'use strict';
  const terms=[
    {id:'itamar',sourceProfile:'itamar',name:'Itamar Franco',short:'Itamar',start:1994,end:1994,actualStart:1992,actualEnd:1994,party:'PMDB',color:'#247548',note:'Somente 1994 no painel. Fora do ranking de evolução; índice anual descritivo disponível.'},
    {id:'fhc1',sourceProfile:'fhc',name:'Fernando H. Cardoso · 1º mandato',short:'FHC I',start:1995,end:1998,party:'PSDB',color:'#245caa',note:'Primeiro mandato, separado de 1999–2002.'},
    {id:'fhc2',sourceProfile:'fhc',name:'Fernando H. Cardoso · 2º mandato',short:'FHC II',start:1999,end:2002,party:'PSDB',color:'#245caa',note:'Segundo mandato.'},
    {id:'lula1',sourceProfile:'lula12',name:'Lula · 1º mandato',short:'Lula I',start:2003,end:2006,party:'PT',color:'#b52b34',note:'Primeiro mandato.'},
    {id:'lula2',sourceProfile:'lula12',name:'Lula · 2º mandato',short:'Lula II',start:2007,end:2010,party:'PT',color:'#b52b34',note:'Segundo mandato.'},
    {id:'dilma1',sourceProfile:'dilma',name:'Dilma Rousseff · 1º mandato',short:'Dilma I',start:2011,end:2014,party:'PT',color:'#b52b34',note:'Primeiro mandato.'},
    {id:'dilma2',sourceProfile:'dilma',name:'Dilma Rousseff · 2º mandato',short:'Dilma II',start:2015,end:2015,actualStart:2015,actualEnd:2016,party:'PT',color:'#b52b34',note:'2016 é compartilhado. Sem nota de evolução no padrão: apenas um ano exclusivo. O índice anual é descritivo.'},
    {id:'temer',sourceProfile:'temer',name:'Michel Temer',short:'Temer',start:2017,end:2018,actualStart:2016,actualEnd:2018,party:'PMDB/MDB',color:'#247548',note:'Governou desde maio/2016, com transição compartilhada no padrão.'},
    {id:'bolsonaro',sourceProfile:'bolsonaro',name:'Jair Bolsonaro',short:'Bolsonaro',start:2019,end:2022,party:'PSL → sem partido → PL',color:'#194b88',note:'Mandato de 2019–2022.'},
    {id:'lula3',sourceProfile:'lula3',name:'Lula · 3º mandato',short:'Lula III',start:2023,end:2025,actualEnd:2026,party:'PT',color:'#b52b34',note:'Mandato atual: anos anuais completos publicados até 2025.'}
  ];
  const parties={PT:{name:'PT',color:'#b52b34'},PSDB:{name:'PSDB',color:'#245caa'},PMDB:{name:'PMDB',color:'#247548'},MDB:{name:'MDB',color:'#247548'},PSL:{name:'PSL',color:'#52752c'},PL:{name:'PL',color:'#194b88'},none:{name:'Sem partido',color:'#68717d'},transition:{name:'PT / PMDB · transição',color:'#86755b'}};
  // Filiação predominante no ano, sem dividir valores anuais em observações mensais.
  function partyForYear(y){
    if(y===2016)return parties.transition;
    if(y===2019)return parties.PSL;
    if(y===2020||y===2021)return parties.none;
    if(y===2022)return parties.PL;
    if(y===2018)return parties.MDB;
    const t=terms.find(t=>y>=t.start&&y<=t.end);
    return t?parties[t.party.split('/')[0]]:parties.none;
  }
  const alwaysMean=new Set(['NY.GDP.MKTP.KD.ZG','BCB_433']);
  function getTerms(opts={}){return terms.filter(t=>t.id!=='itamar'&&(opts.current!==false||t.id!=='lula3')).map(t=>({...t,start:t.id==='temer'&&opts.transition==='temer'?2016:t.start,end:t.id==='dilma2'&&opts.transition==='dilma'?2016:t.end}));}
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
    const comparable=ts.map((t,i)=>t.end-t.start+1>=2?i:-1).filter(i=>i>=0);
    const eligible=evaluations.filter(e=>comparable.length&&comparable.every(i=>e.stats[i].valid));
    const active=eligible.filter(e=>!opts.excluded?.includes(e.series.id));
    const weights=opts.weights||{economia:1,social:1,vida:1};
    const rows=ts.map((term,i)=>{
      const shortPeriod=term.end-term.start+1<2;
      const metrics=shortPeriod?[]:active.map(e=>{
        const values=comparable.map(i=>e.stats[i].value*e.series.direction),lo=Math.min(...values),hi=Math.max(...values);
        const score=Math.abs(hi-lo)<1e-12?50:100*(e.stats[i].value*e.series.direction-lo)/(hi-lo);
        return {id:e.series.id,group:e.series.group,score,...e.stats[i]};
      });
      const groups={};
      for(const g of ['economia','social','vida']){const m=metrics.filter(m=>m.group===g);groups[g]=m.length?m.reduce((s,m)=>s+m.score,0)/m.length:null;}
      const denom=Object.entries(groups).reduce((s,[g,v])=>s+(v===null?0:(weights[g]||0)),0);
      const score=denom?Object.entries(groups).reduce((s,[g,v])=>s+(v===null?0:v*(weights[g]||0)),0)/denom:null;
      return {term,score,groups,metrics,reason:shortPeriod?'Recorte com apenas um ano exclusivo; sem nota de evolução.':''};
    }).sort((a,b)=>(b.score??-1)-(a.score??-1));
    rows.forEach((r,i)=>r.position=r.score===null?null:(i>0&&Math.abs(r.score-rows[i-1].score)<1e-9?rows[i-1].position:i+1));
    return {rows,active,eligible,evaluations,terms:ts,comparable};
  }
  const api={terms,parties,partyForYear,getTerms,stats,calculate};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Model=api;
})(typeof window==='undefined'?globalThis:window);
