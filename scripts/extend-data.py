"""Amplia a coleta sem revisar as séries anteriores. Reexecutar: python scripts/extend-data.py.
Só a biblioteca padrão. --cached usa respostas já preservadas em data/raw.
"""
import pathlib,json,sys,datetime,urllib.request,csv,concurrent.futures
from xlsx_source import sheets
from collect import wb
ROOT=pathlib.Path(__file__).resolve().parents[1]
ASOF='2026-10-15'
SPECS=json.loads((ROOT/'data'/'extension-specs.json').read_text(encoding='utf-8'))
ANP='https://www.gov.br/anp/pt-br/assuntos/precos-e-defesa-da-concorrencia/precos/precos-revenda-e-de-distribuicao-combustiveis/'
FILES={
 'gasolina-2001-2012.xlsx':ANP+'shlp/2001-2012/mensal-brasil-2001-a-2012.xlsx',
 'gasolina-2013.xlsx':ANP+'shlp/mensal/mensal-brasil-desde-jan2013.xlsx',
 'cofog.xlsx':(ROOT/'data'/'cofog-source.txt').read_text(encoding='utf-8').strip()
}
def fetch_files():
 for name,url in FILES.items():
  with urllib.request.urlopen(url,timeout=70) as r:(ROOT/'data/raw'/name).write_bytes(r.read())
def source_series(ident,name,group,note,values,source,url,api,unit='% do PIB',**extra):
 return dict(id=ident,name=name,group=group,unit=unit,direction=0,rank=False,note=note,sourceNote=note,values=values,source=source,url=url,api=api,updated=None,latest=None,collectedAt=ASOF,**extra)
def fuel():
 months={}
 for name in ['gasolina-2001-2012.xlsx','gasolina-2013.xlsx']:
  for _,rows in sheets(ROOT/'data/raw'/name):
   for r in rows:
    if r.get('B')!='GASOLINA COMUM':continue
    d=datetime.date(1899,12,30)+datetime.timedelta(days=int(float(r['A'])))
    if d.year>2025:continue
    key=d.strftime('%Y-%m')
    if key in months:raise ValueError('Mês duplicado: '+key)
    months[key]=float(r['E'])
 years={str(y):sum(v for k,v in months.items() if k.startswith(str(y)))/12 for y in range(2001,2026) if sum(k.startswith(str(y)) for k in months)==12}
 return source_series('ANP_GASOLINA','Gasolina comum — preço de revenda','economia','Média aritmética dos 12 preços médios mensais nacionais da ANP, em R$ nominais por litro; não corrigida pela inflação nem ponderada pelo volume anual vendido. Só anos com 12 meses. 2001 é parcial e 2020 fica sem valor anual por interrupção da pesquisa entre 18/8 e 17/10. A abrangência e a ponderação mudaram ao longo da série (2004, 2017, 2018); ver fonte. Não é preço da refinaria.',years,'ANP · Levantamento de Preços',ANP+'serie-historica-do-levantamento-de-precos',[FILES[k] for k in FILES if k.startswith('gasolina')],unit='R$ correntes / litro',monthlyValues=months)
def treasury():
 book=dict(sheets(ROOT/'data/raw/cofog.xlsx'));results=[]
 url='https://www.tesourotransparente.gov.br/publicacoes/cofog-despesas-por-funcao-do-governo-geral/2024/114'
 scope='União, estados e municípios consolidados; não somente governo federal. COFOG, valores preliminares da edição 2024, série 2010–2024. Mais gasto não implica melhor resultado. '
 def values(rows,code,investment=False):
  yearrow=next(r for r in rows if r.get('C')=='2010')
  header=next((r for r in rows if r.get('L','').startswith('31 -')),None) if investment else None
  row=next(r for r in rows if r.get('A')==code)
  if not investment:return {y:100*float(row[c]) for c,y in yearrow.items() if y.isdigit() and 2010<=int(y)<=2024 and row.get(c)}
  cols=list(yearrow);mapping={};year=None
  for col in cols:
   if yearrow[col].isdigit() and 2010<=int(yearrow[col])<=2024:year=yearrow[col]
   if header.get(col,'').startswith('31 -') and year and row.get(col):mapping[year]=100*float(row[col])
  assert len(mapping)==15
  return mapping
 results.append(source_series('STN_COFOG_703','Despesa com ordem pública e segurança','vida',scope+'Despesa total, corrente e capital, da função 703: polícia, bombeiros, tribunais, prisões e outras atividades. Não equivale à função orçamentária brasileira Segurança Pública nem apenas ao policiamento.',values(book['1.5.a'],'703'),'Tesouro Nacional · COFOG',url,FILES['cofog.xlsx']))
 for code,name,group in [('703','ordem pública e segurança','vida'),('707','saúde','vida'),('709','educação','educacao')]:
  results.append(source_series('STN_COFOG_INV_'+code,'Investimento público bruto em '+name,group,scope+'Coluna 31 (investimento bruto) da tabela 2.4.a, função '+code+'. Aquisição líquida de ativos não financeiros, incluindo ativos fixos, estoques e outros ativos; não inclui todo o custeio do serviço. '+('Segurança inclui tribunais e prisões.' if code=='703' else ''),values(book['2.4.a'],code,True),'Tesouro Nacional · COFOG',url,FILES['cofog.xlsx']))
 return results

def main():
 cached='--cached' in sys.argv
 payload=json.loads((ROOT/'data/snapshot.json').read_text(encoding='utf-8'))
 archive=ROOT/'data/archive/snapshot-2026-10-14.json';archive.parent.mkdir(exist_ok=True)
 if not archive.exists():archive.write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding="utf-8")
 if not cached:fetch_files()
 if cached:
  extra=json.loads((ROOT/'data/extension-wdi.json').read_text(encoding='utf-8'))
 else:
  with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:extra=list(pool.map(wb,SPECS))
  (ROOT/'data/extension-wdi.json').write_text(json.dumps(extra,ensure_ascii=False,indent=2),encoding="utf-8")
 extra+= [fuel()]+treasury()
 for s in extra:s['collectedAt']=ASOF
 ids={s['id'] for s in extra}
 for s in payload['series']:s.setdefault('collectedAt',payload['asOf'])
 payload['series']=[s for s in payload['series'] if s['id'] not in ids]+extra
 payload['extensionAsOf']=ASOF
 (ROOT/'data/snapshot.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding="utf-8")
 (ROOT/'dist/data.js').write_text('window.DATA = '+json.dumps(payload,ensure_ascii=False)+';',encoding='utf-8')
 with (ROOT/'dist/dados.csv').open('w',encoding='utf-8-sig',newline='') as f:
  w=csv.writer(f,lineterminator="\n");w.writerow(['serie','indicador','ano','valor','unidade','fonte','url','coleta'])
  for s in payload['series']:
   for y,v in sorted(s['values'].items()):w.writerow([s['id'],s['name'],y,v,s['unit'],s['source'],s['url'],s['collectedAt']])
 print([(s['id'],len(s['values']),min(s['values'],default='—'),max(s['values'],default='—')) for s in extra])
if __name__=='__main__':main()
