"""Confere domínios, composição, fontes brutas e reprodução da coleta adicional.
Executar: python scripts/test-investment.py
Não modifica o snapshot nem os arquivos em dist.
"""
import hashlib
import json
import math
import pathlib
import subprocess
import sys
import unittest

ROOT=pathlib.Path(__file__).resolve().parents[1]

def read(name):
 return json.loads((ROOT/'data'/name).read_text(encoding='utf-8'))

class InvestmentDataTests(unittest.TestCase):
 def test_annual_coverage_and_metadata(self):
  ss=read('investment-series.json')
  self.assertEqual(len(ss),8)
  self.assertEqual(len({s['id'] for s in ss}),len(ss))
  for s in ss:
   with self.subTest(series=s['id']):
    self.assertTrue(s['values'])
    self.assertTrue(s['url'].startswith('https://'))
    self.assertEqual(s['collectedAt'],'2026-10-16')
    self.assertTrue(all(1993<=int(y)<=2025 and math.isfinite(v) for y,v in s['values'].items()))
    self.assertFalse(s['rank'])

 def test_export_pies_cover_the_published_total(self):
  detail=read('investment-detail.json')
  total_series=next(s['values'] for s in read('investment-series.json') if s['id']=='MDIC_EXPORT_FOB')
  for kind in ['exportComposition','exportTypeComposition']:
   pie=detail[kind]
   self.assertEqual(set(pie['years']),set(total_series))
   for year,r in pie['years'].items():
    with self.subTest(kind=kind,year=year):
     # Os arquivos MDIC expressam milhões com seis casas: precisão de US$1.
     self.assertEqual(sum(round(i['value']) for i in r['items']),round(r['total']))
     self.assertEqual(round(r['total']),round(total_series[year]))
     self.assertTrue(all(i['value']>=0 for i in r['items']))
     self.assertEqual(len({i['id'] for i in r['items']}),len(r['items']))
  cgce=detail['exportTypeComposition']['years']['2025']
  self.assertEqual(round(next(i['value'] for i in cgce['items'] if i['id']=='unclassified')),314360)

 def test_gdp_pie_is_normalized_and_preserves_original_shares(self):
  pie=read('investment-detail.json')['gdpComposition']
  series={s['id']:s for s in read('investment-series.json')}
  self.assertEqual({r['year'] for r in pie['excludedYears']},{'1993','1994'})
  self.assertNotIn('1993',pie['years'])
  self.assertNotIn('1994',pie['years'])
  for year,r in pie['years'].items():
   with self.subTest(year=year):
    self.assertTrue(math.isclose(sum(i['value'] for i in r['items']),100,abs_tol=1e-10))
    self.assertEqual(len(r['items']),3)
    raw=sum(i['value'] for i in r['rawSharesOfGdp'])
    self.assertAlmostEqual(raw,r['coveredShareOfGdp'],places=10)
    self.assertAlmostEqual(raw+r['outsideSectorValueAddedPctGdp'],100,places=10)
    for i in r['rawSharesOfGdp']:
     self.assertEqual(i['value'],series[i['id']]['values'][year])
    for i in r['items']:
     self.assertAlmostEqual(i['value'],series[i['id']]['values'][year]/raw*100,places=10)

 def test_bcb_stock_is_one_year_and_not_a_flow(self):
  stock=read('investment-detail.json')['fdiStockComposition']
  self.assertEqual(stock['year'],2024)
  self.assertEqual(stock['total'],884800000000)
  self.assertEqual(len(stock['items']),10)
  self.assertAlmostEqual(sum(i['value'] for i in stock['items']),100,places=10)
  self.assertIn('estoque',stock['unit'])
  self.assertIn('Exclui',stock['note'])
  self.assertIn('operações intercompanhia',stock['note'])

 def test_raw_download_hashes_match_and_tls_exception_is_explicit(self):
  log=read('raw/investment-fetch-log.json')
  for source in log['files']:
   with self.subTest(file=source['file']):
    self.assertEqual(hashlib.sha256((ROOT/'data/raw'/source['file']).read_bytes()).hexdigest(),source['sha256'])
    if not source['tlsVerified']:
     self.assertTrue(source['url'].startswith('https://balanca.mdic.gov.br/'))

 def test_cached_reproduction_is_byte_identical(self):
  names=['investment-series.json','investment-detail.json','investment-wdi.json']
  before={name:(ROOT/'data'/name).read_bytes() for name in names}
  subprocess.run([sys.executable,str(ROOT/'scripts/collect-investment.py'),'--cached'],cwd=ROOT,
                 check=True,capture_output=True,text=True)
  for name,data in before.items():
   with self.subTest(file=name):self.assertEqual((ROOT/'data'/name).read_bytes(),data)

if __name__=='__main__':unittest.main(verbosity=2)
