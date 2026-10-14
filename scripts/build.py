import pathlib,json
root=pathlib.Path(__file__).resolve().parents[1]
html=(root/'template.html').read_text(encoding='utf-8')
for marker,file in [('/*STYLES*/','style.css'),('/*DATA*/','dist/data.js'),('/*MODEL*/','model.js'),('/*APP*/','app.js')]:
    text=(root/file).read_text(encoding='utf-8')
    if marker=='/*APP*/': text=(root/'inventory.js').read_text(encoding='utf-8')+'\n'+text
    html=html.replace(marker,text)
(root/'dist'/'index.html').write_text(html,encoding='utf-8')
manifest=root/'.openai'/'hosting.json'
data=json.loads(manifest.read_text(encoding='utf-8-sig'))
data['static']={'directory':'dist'}
manifest.write_text(json.dumps(data,indent=2),encoding='utf-8')
print('HTML independente:',len(html),'caracteres')
