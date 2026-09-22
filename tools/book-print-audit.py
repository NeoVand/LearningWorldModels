from pathlib import Path
from PIL import Image,ImageOps,ImageDraw
from pypdf import PdfReader
import pdfplumber,json,logging
logging.getLogger('pdfminer').setLevel(logging.ERROR)
root=Path(__file__).resolve().parents[1];folder=root/'tmp/full-book/pdf'
files=sorted(folder.glob('page-*.png'))
for start in range(0,len(files),12):
 sheet=Image.new('RGB',(1500,4*690),'#e9e9e5');d=ImageDraw.Draw(sheet)
 for j,p in enumerate(files[start:start+12]):
  im=Image.open(p).convert('RGB');im.thumbnail((485,650));x=(j%3)*500+(500-im.width)//2;y=(j//3)*690+25
  sheet.paste(im,(x,y));d.text((x,y-19),p.stem,fill='black')
 sheet.save(folder/f'contact-{start//12+1}.png')
report=[]
with pdfplumber.open(root/'output/pdf/before-the-move-complete.pdf') as pdf:
 for i,p in enumerate(pdf.pages):
  bad=[c for c in p.chars if c['x0']<0 or c['x1']>p.width+.5 or c['top']<0 or c['bottom']>p.height+.5]
  text=p.extract_text() or ''
  report.append(dict(page=i+1,characters=len(text),outside_page=len(bad),head=text[:90]))
(root/'research/full-book/print-inspection.json').write_text(json.dumps(report,indent=2))
print(json.dumps(dict(pages=len(report),contacts=(len(files)+11)//12,outside=sum(p['outside_page'] for p in report)),indent=2))
