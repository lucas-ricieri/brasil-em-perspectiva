"""Leitura dos valores salvos em XLSX de fontes oficiais (sem recalcular fórmulas)."""
import zipfile, xml.etree.ElementTree as ET
NS = {'m':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
def sheets(path):
    with zipfile.ZipFile(path) as z:
        shared = []
        if 'xl/sharedStrings.xml' in z.namelist():
            shared = [''.join(t.text or '' for t in si.findall('.//m:t', NS)) for si in ET.fromstring(z.read('xl/sharedStrings.xml'))]
        rels = {r.attrib['Id']:r.attrib['Target'] for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        for sheet in ET.fromstring(z.read('xl/workbook.xml')).find('m:sheets',NS):
            target=rels[sheet.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']]
            target=target.lstrip('/') if target.startswith('/') else 'xl/'+target
            rows=[]
            for row in ET.fromstring(z.read(target)).findall('.//m:sheetData/m:row',NS):
                cells={}
                for c in row:
                    key=''.join(x for x in c.attrib['r'] if x.isalpha())
                    value=c.findtext('m:v','',NS)
                    if c.attrib.get('t')=='s': value=shared[int(value)]
                    elif c.attrib.get('t')=='inlineStr': value=''.join(t.text or '' for t in c.findall('.//m:t',NS))
                    cells[key]=value
                rows.append(cells)
            yield sheet.attrib['name'],rows
