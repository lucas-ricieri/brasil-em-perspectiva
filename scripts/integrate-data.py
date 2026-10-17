"""Integra respostas complementares preservando os valores já existentes."""
import pathlib,json,csv
ROOT=pathlib.Path(__file__).resolve().parents[1]
payload=json.loads((ROOT/'data/snapshot.json').read_text(encoding='utf-8'))
extra=json.loads((ROOT/'data/investment-series.json').read_text(encoding='utf-8'))
existing={s['id']:s for s in payload['series']}
for s in extra:
 if s['id'] in existing and existing[s['id']]['values']!=s['values']:
  raise ValueError('Revisão histórica exige tratamento explícito: '+s['id'])
 if s['id'] not in existing:payload['series'].append(s)
payload['investmentAsOf']='2026-10-16'
(ROOT/'data/snapshot.json').write_text(json.dumps(payload,ensure_ascii=False,indent=2),encoding='utf-8')
(ROOT/'dist/data.js').write_text('window.DATA = '+json.dumps(payload,ensure_ascii=False)+';',encoding='utf-8')
with (ROOT/'dist/dados.csv').open('w',encoding='utf-8-sig',newline='') as f:
 w=csv.writer(f,lineterminator='\n');w.writerow(['serie','indicador','ano','valor','unidade','fonte','url','coleta'])
 for s in payload['series']:
  for y,v in sorted(s['values'].items()):w.writerow([s['id'],s['name'],y,v,s['unit'],s['source'],s['url'],s.get('collectedAt',payload['asOf'])])
print('Séries integradas:',len(payload['series']))
