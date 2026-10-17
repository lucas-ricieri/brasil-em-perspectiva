"""Snapshot reproducível das APIs públicas. Python 3; apenas biblioteca padrão."""
import json, urllib.request, time, math, concurrent.futures, pathlib, csv
ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / 'data' / 'raw'
RAW.mkdir(parents=True, exist_ok=True)
ASOF = '2026-10-14'
# id, nome, unidade, grupo, direção desejável, candidato ao ranking, nota
SPECS = [
('NY.GDP.MKTP.KD.ZG','Crescimento real do PIB','% ao ano','economia',1,True,'Variação anual do PIB a preços constantes. No ranking, usa sempre a média das taxas.'),
('NY.GDP.PCAP.KD','PIB real por habitante','US$ de 2015','economia',1,False,'Produção média por habitante; não é renda mediana das famílias. Dólares constantes de 2015.'),
('NY.GDP.MKTP.KD','PIB real total','US$ de 2015','economia',1,False,'Produção total a preços constantes; evita confundir inflação com expansão econômica.'),
('SL.UEM.TOTL.ZS','Desemprego — OIT','% da força de trabalho','economia',-1,True,'Estimativa modelada da OIT. Não equivale à série observada da PNAD Contínua nem ao U-3 americano. Revisões e harmonização afetam comparações.'),
('SL.TLF.CACT.ZS','Participação na força de trabalho','% da população 15+','economia',1,False,'Estimativa modelada da OIT para pessoas com 15 anos ou mais.'),
('NE.GDI.FTOT.ZS','Formação bruta de capital fixo','% do PIB','economia',1,False,'Investimento público e privado em ativos fixos; não mede somente investimento empresarial.'),
('NY.GNS.ICTR.ZS','Poupança bruta nacional','% do PIB','economia',1,False,'Poupança nacional; NÃO é a taxa de poupança pessoal das famílias.'),
('SI.POV.GINI','Desigualdade de renda — Gini','pontos (0–100)','social',-1,True,'Distribuição de renda/consumo, não de patrimônio. Pesquisas domiciliares harmonizadas pelo Banco Mundial/PIP; mudanças de pesquisa podem afetar a série.'),
('SI.POV.UMIC','Pobreza — US$ 8,30 por dia','% da população','social',-1,True,'Linha internacional de US$ 8,30/dia em PPC de 2021; não é uma linha nacional oficial. Mudanças de pesquisa exigem cautela.'),
('SI.POV.DDAY','Extrema pobreza — US$ 3 por dia','% da população','social',-1,False,'Linha internacional de US$ 3/dia em PPC de 2021. Não misturar com antigas linhas em PPC de 2017.'),
('SI.DST.10TH.10','Renda dos 10% mais ricos','% da renda','social',-1,False,'Participação na renda/consumo, NÃO participação no patrimônio.'),
('SI.DST.FRST.20','Renda dos 20% mais pobres','% da renda','social',1,False,'Participação na renda/consumo; não mede mobilidade social.'),
('SN.ITK.MSFI.ZS','Insegurança alimentar moderada ou grave','% da população','social',-1,False,'Estimativa FAO/FIES. Conceito distinto da EBIA do IBGE; não combinar as escalas.'),
('SP.DYN.LE00.IN','Expectativa de vida ao nascer','anos','vida',1,True,'Estimativa demográfica. Reflete décadas de condições sociais; efeitos não são atribuíveis somente ao governo contemporâneo.'),
('SH.STA.MMRT','Mortalidade materna','por 100 mil nascidos vivos','vida',-1,True,'Estimativa modelada interagências (OMS e parceiros), sujeita a revisões; não é contagem direta do SIM.'),
('VC.IHR.PSRC.P5','Homicídios intencionais','por 100 mil habitantes','vida',-1,True,'Compilação UNODC. Não equivale necessariamente ao conceito de mortes violentas intencionais do FBSP. Segurança também depende dos estados.'),
('SH.XPD.OOPC.CH.ZS','Desembolso direto em saúde','% do gasto corrente em saúde','vida',-1,False,'Gasto direto dos domicílios como parcela do gasto total; não mede valor absoluto nem ausência de cobertura pelo SUS.'),
('SH.XPD.CHEX.GD.ZS','Despesa corrente em saúde','% do PIB','vida',0,False,'Gasto público e privado. Mais gasto isoladamente não representa melhor resultado.'),
('SH.UHC.SRVS.CV.XD','Cobertura de serviços de saúde','índice (0–100)','vida',1,False,'Índice de serviços essenciais; não é taxa de pessoas com plano privado ou sem seguro.'),
('SE.SEC.CUAT.UP.ZS','Conclusão do ensino médio — adultos','% da população 25+','educacao',1,False,'Estoque de adultos com pelo menos ensino médio completo; não é taxa de conclusão de uma coorte escolar.'),
('SE.ADT.LITR.ZS','Alfabetização de adultos','% da população 15+','educacao',1,False,'Indicador complementar de educação; não substitui proficiência do Saeb ou Ideb.'),
('NY.GDP.MKTP.KD.ZG@WLD','Crescimento real mundial','% ao ano','contexto',0,False,'Referência externa. Diferença Brasil–mundo é comparação descritiva, não ajuste causal.'),
]

def get(url):
    for attempt in range(3):
        try:
            req=urllib.request.Request(url,headers={'User-Agent':'BrazilPublicIndicatorsDashboard/1.0'})
            with urllib.request.urlopen(req,timeout=70) as r: return json.load(r)
        except Exception:
            if attempt==2: raise
            time.sleep(1+attempt)

def wb(spec):
    ident,name,unit,group,direction,rank,note=spec
    code=ident.split('@')[0]; country='WLD' if '@WLD' in ident else 'BRA'
    url=f'https://api.worldbank.org/v2/country/{country}/indicator/{code}?format=json&date=1993:2026&per_page=100&footnote=y'
    payload=get(url)
    (RAW/(ident.replace('@','_')+'.json')).write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
    if not isinstance(payload,list) or len(payload)<2 or not isinstance(payload[1],list): raise ValueError(str(payload)[:200])
    values={str(r['date']):r['value'] for r in payload[1] if r['value'] is not None and int(r['date'])<=2025}
    metadata=get(f'https://api.worldbank.org/v2/indicator/{code}?format=json')
    meta=metadata[1][0]
    (RAW/(ident.replace('@','_')+'_meta.json')).write_text(json.dumps(metadata,ensure_ascii=False,indent=2),encoding='utf-8')
    result=dict(id=ident,name=name,unit=unit,group=group,direction=direction,rank=rank,note=note,values=values,source='Banco Mundial · '+meta.get('sourceOrganization',''),sourceNote=meta.get('sourceNote',''),url=f'https://data.worldbank.org/indicator/{code}?locations={"1W" if country=="WLD" else "BR"}',api=url,updated=payload[0].get('lastupdated'),latest=None)
    print(ident, len(values), min(values,default='—'),max(values,default='—'),flush=True)
    return result

def bcb(code,name,unit,group,direction,rank,note,agg):
    rows=[]; urls=[]
    for start,end in [(1993,2002),(2003,2012),(2013,2022),(2023,2026)]:
        final='14/10/2026' if end==2026 else f'31/12/{end}'
        url=f'https://api.bcb.gov.br/dados/serie/bcdata.sgs.{code}/dados?formato=json&dataInicial=01/01/{start}&dataFinal={final}'
        try: data=get(url)
        except Exception as e:
            if code in [13762,5727] and end<2003: continue
            raise e
        if not isinstance(data,list): raise ValueError(str(data))
        rows.extend(data);urls.append(url)
    (RAW/f'BCB_{code}.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
    years={}
    for r in rows:
        day,month,year=map(int,r['data'].split('/'))
        if (year,month,day)>(2026,10,14): continue
        years.setdefault(year,[]).append((month,float(r['valor'])))
    vals={}
    for year,ls in years.items():
        ls.sort()
        if year>2025: continue
        if agg=='dec' and ls[-1][0]==12: vals[str(year)]=ls[-1][1]
        elif len(ls)==12: vals[str(year)]=(math.prod(1+v/100 for _,v in ls)-1)*100 if agg=='compound' else sum(v for _,v in ls)/12
    last=sorted(rows,key=lambda r:tuple(reversed([int(v) for v in r['data'].split('/')])))[-1]
    print('BCB',code,len(vals),min(vals,default='—'),max(vals,default='—'),last,flush=True)
    return dict(id='BCB_'+str(code),name=name,unit=unit,group=group,direction=direction,rank=rank,note=note,values=vals,source='Banco Central do Brasil · SGS '+str(code),sourceNote=note,url=f'https://www3.bcb.gov.br/sgspub/consultarmetadados/consultarMetadadosSeries.do?method=consultarMetadadosSeriesInternet&hdOidSerieSelecionada={code}',api=urls,updated=None,latest=last)

def main():
    series=[]; errors=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        futures={pool.submit(wb,s):s[0] for s in SPECS}
        for f in concurrent.futures.as_completed(futures):
            try: series.append(f.result())
            except Exception as e: errors.append({'id':futures[f],'error':str(e)});print('ERROR',futures[f],e,flush=True)
    jobs=[
      (433,'Inflação — IPCA','% no ano','economia',-1,True,'IPCA do IBGE via BCB. Produto das 12 variações mensais; somente anos completos. No ranking, usa sempre média das taxas anuais. O dado mais recente abaixo é mensal, não anual. Menor inflação é uma escolha normativa; deflação não é necessariamente desejável.','compound'),
      (13762,'Dívida bruta do governo geral','% do PIB','fiscal',-1,False,'DBGG, metodologia a partir de 2008, série desde dezembro/2006. Saldo de dezembro; não é somente dívida federal. Excluída do ranking histórico por falta de cobertura de FHC.','dec'),
      (5727,'Déficit nominal do governo geral','% do PIB em 12 meses','fiscal',-1,False,'Necessidade de financiamento do governo geral, resultado nominal acumulado em 12 meses. Valor positivo representa déficit. Dezembro de cada ano; não confundir com resultado primário ou orçamento federal.','dec'),
      (4189,'Selic acumulada no mês, anualizada','% ao ano','contexto',0,False,'Média aritmética das taxas mensais anualizadas (SGS 4189). Não é a meta Selic de fim de ano, nem retorno anual composto. Indicador de contexto, sem pontuação.','mean'),
    ]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures={pool.submit(bcb,*s):s[0] for s in jobs}
        for f in concurrent.futures.as_completed(futures):
            try: series.append(f.result())
            except Exception as e: errors.append({'id':str(futures[f]),'error':str(e)});print('ERROR',futures[f],e,flush=True)
    for s in series: s['collectedAt']=ASOF
    order=[x[0] for x in SPECS]+['BCB_'+str(x[0]) for x in jobs]
    series.sort(key=lambda s:order.index(s['id']))
    payload={'asOf':ASOF,'annualCutoff':2025,'series':series,'errors':errors}
    (ROOT/'data'/'snapshot.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
    (ROOT/'dist'/'data.js').write_text('window.DATA = '+json.dumps(payload,ensure_ascii=False)+';',encoding='utf-8')
    with (ROOT/'dist'/'dados.csv').open('w',encoding='utf-8-sig',newline='') as f:
        w=csv.writer(f,lineterminator="\n");w.writerow(['serie','indicador','ano','valor','unidade','fonte','url','coleta'])
        for s in series:
            for y,v in sorted(s['values'].items()): w.writerow([s['id'],s['name'],y,v,s['unit'],s['source'],s['url'],ASOF])
    print('DONE',len(series),'series',len(errors),'errors',flush=True)
if __name__=='__main__': main()
