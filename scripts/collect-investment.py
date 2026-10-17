"""Coleta adicional de investimento/ciência; não altera snapshot, dist/data.js ou CSV.

python scripts/collect-investment.py [--cached] [--insecure-mdic]
Usa bibliotecas padrão e o leitor XLSX local. TLS é validado por padrão. A opção
--insecure-mdic somente contorna o certificado de balanca.mdic.gov.br, quando a
cadeia oficial não é reconhecida pelo host; não muda configuração global.
Composição BCB: transcrição conferida visualmente da Figura 22, página 23, RID2025.
"""
import concurrent.futures
import json
import hashlib
import math
import pathlib
import ssl
import sys
import urllib.request
import urllib.parse
from collect import wb
from xlsx_source import sheets

ROOT = pathlib.Path(__file__).resolve().parents[1]
RAW = ROOT / 'data/raw'
ASOF = '2026-10-16'
CUTOFF = 2025
MDIC = 'https://balanca.mdic.gov.br/balanca/publicacoes_dados_consolidados/pg.html'
MDIC_BASE = 'https://balanca.mdic.gov.br/balanca/publicacoes_dados_consolidados/tabelas/pg_series_historicas/'
BCB_RID = 'https://www.bcb.gov.br/content/publicacoes/relatorioidp/RelatoriaID2024/RID_2025.pdf'
SPECS = [
 ('FI.RES.TOTL.CD', 'Reservas internacionais, incluindo ouro', 'US$ correntes', 'economia', 0, False,
  'Estoque de reservas internacionais no fim do ano, incluindo ouro monetário, direitos especiais de saque, posição no FMI e ativos em moeda estrangeira sob controle das autoridades monetárias. Não são dólares em caixa do Tesouro Nacional; não medir como receita anual. Ouro avaliado a preços de mercado.'),
 ('IT.NET.USER.ZS', 'Pessoas que usam a internet', '% da população', 'ciencia', 1, False,
  'Pessoas que usaram a internet nos últimos três meses, em qualquer lugar/dispositivo. UIT/Banco Mundial. Mede uso, não velocidade, qualidade da conexão ou competências digitais; um indicador de difusão tecnológica, não de produção científica.'),
 ('IP.PAT.RESD', 'Pedidos de patente por residentes', 'pedidos por ano', 'ciencia', 1, False,
  'Pedidos de patente de residentes à autoridade nacional/regional, segundo OMPI/Banco Mundial. Não são patentes concedidas, nem pedidos mundiais de brasileiros; pedidos não medem qualidade, impacto comercial ou produtividade da pesquisa.'),
 ('NV.AGR.TOTL.ZS', 'Agropecuária — valor adicionado', '% do PIB', 'economia', 0, False,
  'Valor adicionado da agricultura, silvicultura e pesca dividido pelo PIB. Não é a participação de todo o agronegócio; insumos e processamento aparecem em outros setores. Estrutura econômica, sem direção normativa.'),
 ('NV.IND.TOTL.ZS', 'Indústria e construção — valor adicionado', '% do PIB', 'economia', 0, False,
  'Valor adicionado da indústria, incluindo construção, transformação, extração e utilidades, dividido pelo PIB. Não equivale apenas à indústria de transformação. Estrutura econômica, sem direção normativa.'),
 ('NV.SRV.TOTL.ZS', 'Serviços — valor adicionado', '% do PIB', 'economia', 0, False,
  'Valor adicionado de serviços dividido pelo PIB, incluindo comércio, finanças, transportes e serviços públicos. As parcelas de valor adicionado não somam necessariamente 100% do PIB por impostos líquidos sobre produtos e diferenças de cálculo.'),
]

def dump(path, value):
 path.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')

def download(url, path, insecure=False):
 if insecure and urllib.parse.urlsplit(url).hostname != 'balanca.mdic.gov.br':
  raise ValueError('A exceção TLS só pode ser usada para balanca.mdic.gov.br')
 request = urllib.request.Request(url, headers={'User-Agent':'BrazilPublicIndicatorsDashboard/1.0'})
 options = {'context':ssl._create_unverified_context()} if insecure else {}
 with urllib.request.urlopen(request, timeout=70, **options) as r:path.write_bytes(r.read())

def series(ident, name, unit, values, note, source, url, api, group='economia', direction=0):
 return dict(id=ident, name=name, unit=unit, group=group, direction=direction, rank=False,
             note=note, sourceNote=note, values=values, source=source, url=url, api=api,
             updated=None, latest=None, collectedAt=ASOF)

def annual_rows(name):
 rows=list(sheets(RAW / ('MDIC_'+name+'.xlsx')))[0][1]
 return {r['A']:r for r in rows if r.get('A','').isdigit() and 1993<=int(r['A'])<=CUTOFF}

def mdic_series():
 rows=annual_rows('TOTAIS_ANUAL')
 note=('Exportações/importações anuais de mercadorias, valor FOB em US$ correntes. '
       'Exclui serviços e não equivale à exportação das contas nacionais. Tabelas MDIC '
       'de 1997 a 2025, revisadas até a consulta; anos anteriores permanecem sem valor. '
       'A conversão de US$ milhões do arquivo para US$ usa multiplicação por 1.000.000. '
       'Não se interpreta variação nominal em dólar como variação de volume.')
 return [series('MDIC_EXPORT_FOB','Exportações de mercadorias — FOB','US$ correntes',
                {y:float(r['B'])*1e6 for y,r in rows.items()},note,'MDIC · Secex',MDIC,MDIC_BASE+'TOTAIS_ANUAL.xlsx'),
         series('MDIC_IMPORT_FOB','Importações de mercadorias — FOB','US$ correntes',
                {y:float(r['C'])*1e6 for y,r in rows.items()},note,'MDIC · Secex',MDIC,MDIC_BASE+'TOTAIS_ANUAL.xlsx')]

def export_composition(totals, filename, title, labels, note):
 years={}
 for y,row in annual_rows(filename).items():
  total=totals[y]
  items=[dict(id=col,label=label,value=float(row[col])*1e6) for col,label in labels]
  residual=total-sum(x['value'] for x in items)
  if abs(residual)>1: # Valores são arredondados ao dólar nos arquivos fonte.
   if residual<0:raise ValueError('Composição supera total MDIC '+filename+' '+y)
   items.append(dict(id='unclassified',label='Não classificados na CGCE',value=residual))
  assert math.isclose(sum(x['value'] for x in items),total,abs_tol=1.1), (filename,y)
  years[y]=dict(total=total,items=items)
 return dict(id=filename,title=title,unit='US$ correntes FOB',source='MDIC · Secex',url=MDIC,
             api=MDIC_BASE+filename+'.xlsx',note=note,years=years)

def gdp_composition(extra):
 selected={s['id']:s for s in extra}
 mapping=[('NV.AGR.TOTL.ZS','Agropecuária'),('NV.IND.TOTL.ZS','Indústria e construção'),('NV.SRV.TOTL.ZS','Serviços')]
 years={}; excluded=[]
 common=set.intersection(*(set(selected[c]['values']) for c,_ in mapping))
 for y in sorted(common):
  raw=[dict(id=c,label=label,value=selected[c]['values'][y]) for c,label in mapping]
  coverage=sum(x['value'] for x in raw)
  if not 0<coverage<=100.001:
   excluded.append(dict(year=y,rawSumPctGdp=coverage,reason='A soma setorial em % do PIB excede 100% nesta edição WDI; composição indisponível, sem corrigir observações.'))
   continue
  years[y]=dict(total=100,coveredShareOfGdp=coverage,rawSharesOfGdp=raw,
      outsideSectorValueAddedPctGdp=100-coverage,
      items=[dict(id=x['id'],label=x['label'],value=x['value']/coverage*100) for x in raw])
 return dict(id='WDI_VALUE_ADDED', title='Composição do valor adicionado',unit='% do valor adicionado setorial',
   source='Banco Mundial · contas nacionais',url='https://data.worldbank.org/indicator/NV.SRV.TOTL.ZS?locations=BR',
   api=[s['api'] for c,s in selected.items() if c in dict(mapping)],years=years,excludedYears=excluded,
   note='A pizza compara os três grandes setores no valor adicionado: cada parcela original em % do PIB é dividida pela soma das três e multiplicada por 100. Os valores originais em % do PIB estão preservados em rawSharesOfGdp. A diferença calculada entre 100% do PIB e essa soma é mostrada separadamente; refere-se ao que está fora do valor adicionado setorial (impostos líquidos sobre produtos e possíveis diferenças de cálculo), e não é uma série fiscal observada. Setores de maior tamanho não são necessariamente os de maior contribuição para o crescimento anual.')

def fdi_stock():
 # Transcrição da figura; percentuais arredondados, não valores setoriais exatos em dólar.
 items=[('Serviços financeiros',21.7),('Petróleo e gás',7.9),('Comércio',7.4),('Eletricidade',5.3),
        ('Químicos',4.4),('Veículos',4.1),('Serviços de TI',3.8),('Bebidas',3.6),('Alimentos',3.2),('Demais setores',38.6)]
 assert math.isclose(sum(v for _,v in items),100,abs_tol=1e-9)
 extract=dict(figure=22,printedPage=23,pdfPage=24,year=2024,total=884800000000,totalUnit='US$ correntes',
              unit='% do estoque de participação no capital',items=[dict(label=l,value=v) for l,v in items],
              transcription='Conferida visualmente na figura 22; percentuais arredondados a uma casa decimal.')
 dump(RAW/'BCB_RID_2025_figure22.json',extract)
 return dict(id='BCB_IDP_STOCK_2024',title='Onde está o capital estrangeiro',year=2024,
  total=884800000000,totalUnit='US$ correntes',unit='% do estoque de participação no capital',
  items=extract['items'],source='Banco Central · Relatório de Investimento Direto 2025, figura 22, p. 23',url=BCB_RID,
  api=BCB_RID,publishedAt='2025-11-25',
  note='Estoque ao fim de 2024 de investimento direto no país (IDP), apenas participação no capital: US$ 884,8 bilhões. Exclui US$ 256,4 bilhões de operações intercompanhia. Não é o fluxo anual de novos aportes; variações do estoque incluem câmbio, preços e reclassificações. Percentuais setoriais arredondados publicados pelo BCB, transcritos da figura 22. Este recorte não oferece comparação histórica por mandato.')

def main():
 RAW.mkdir(exist_ok=True)
 cached='--cached' in sys.argv
 insecure='--insecure-mdic' in sys.argv
 if cached:
  extra=json.loads((ROOT/'data/investment-wdi.json').read_text(encoding='utf-8'))
 else:
  with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:extra=list(pool.map(wb,SPECS))
  for s in extra:s['collectedAt']=ASOF
  dump(ROOT/'data/investment-wdi.json',extra)
  for n in ['TOTAIS_ANUAL','EXP_ISIC_ANUAL','EXP_CGCE_ANUAL']:
   download(MDIC_BASE+n+'.xlsx',RAW/('MDIC_'+n+'.xlsx'),insecure)
  download(MDIC,RAW/('MDIC_consolidados_'+ASOF+'.html'),insecure)
  download(BCB_RID,RAW/'BCB_RID_2025.pdf')
  fetched=[(MDIC_BASE+n+'.xlsx','MDIC_'+n+'.xlsx',not insecure) for n in ['TOTAIS_ANUAL','EXP_ISIC_ANUAL','EXP_CGCE_ANUAL']]
  fetched += [(MDIC,'MDIC_consolidados_'+ASOF+'.html',not insecure),(BCB_RID,'BCB_RID_2025.pdf',True)]
  dump(RAW/'investment-fetch-log.json',dict(collectedAt=ASOF,files=[dict(url=u,file=n,tlsVerified=verified,sha256=hashlib.sha256((RAW/n).read_bytes()).hexdigest()) for u,n,verified in fetched]))
 extra+=mdic_series()
 for s in extra:
  assert s['values'] and all(1993<=int(y)<=2025 and math.isfinite(v) for y,v in s['values'].items()),s['id']
 dump(ROOT/'data/investment-series.json',extra)
 totals=next(s for s in extra if s['id']=='MDIC_EXPORT_FOB')['values']
 exports=export_composition(totals,'EXP_ISIC_ANUAL','Exportações por atividade',
  [('B','Agropecuária'),('C','Indústria extrativa'),('D','Indústria de transformação'),('E','Outros produtos')],
  'Mercadorias FOB, classificação por atividade econômica (ISIC), de 1997 a 2025. As quatro categorias são mutuamente exclusivas. Agropecuária não inclui toda a cadeia do agronegócio: alimentos processados pertencem à transformação. Os quatro valores em dólar somam o total anual de exportações; nenhuma categoria é omitida.')
 export_types=export_composition(totals,'EXP_CGCE_ANUAL','Exportações por tipo de uso',
  [('B','Bens de capital'),('C','Bens intermediários'),('D','Bens de consumo'),('E','Combustíveis e lubrificantes')],
  'Grandes categorias econômicas (CGCE), mercadorias FOB. A parcela não classificada é a diferença calculada entre o total anual MDIC e a soma das quatro categorias; aparece como categoria separada para que a pizza cubra todas as exportações. Não se trata da classificação básica/semimanufaturada/manufaturada.')
 details=dict(asOf=ASOF,annualCutoff=CUTOFF,exportComposition=exports,exportTypeComposition=export_types,
              gdpComposition=gdp_composition(extra),fdiStockComposition=fdi_stock(),
  limitations=['Reservas internacionais são ativos das autoridades monetárias; não são saldo de dólares no Tesouro.',
               'Investimento estrangeiro direto (fluxo), estoque de capital estrangeiro e formação bruta de capital fixo são conceitos distintos.',
               'As séries novas não revisam observações anteriores: sua incorporação ao snapshot cabe ao processo de integração.',
               'Nenhum valor parcial de 2026 foi incorporado às séries anuais.'])
 dump(ROOT/'data/investment-detail.json',details)
 print(json.dumps([dict(id=s['id'],n=len(s['values']),first=min(s['values']),last=max(s['values'])) for s in extra],ensure_ascii=False))
 print('Composições verificadas:',len(exports['years']),'anos MDIC;',len(details['gdpComposition']['years']),'anos VA; BCB estoque2024.')

if __name__=='__main__':main()
