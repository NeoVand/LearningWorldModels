from pathlib import Path
from PIL import Image, ImageDraw
import sys
width=sys.argv[1] if len(sys.argv)>1 else '1440'
theme=sys.argv[2] if len(sys.argv)>2 else 'light'
folder=Path(f'tmp/implementation/visuals-{width}-{theme}')
paths=sorted(folder.glob('*.png'))
for n in range(0,len(paths),16):
 canvas=Image.new('RGB',(1600,2200),'#283044' if theme=='dark' else '#e5e9f0');d=ImageDraw.Draw(canvas)
 for j,p in enumerate(paths[n:n+16]):
  im=Image.open(p).convert('RGB');im.thumbnail((380,510));x=(j%4)*400+10;y=(j//4)*550+30
  canvas.paste(im,(x,y));d.text((x,y-22),p.stem,fill='white' if theme=='dark' else '#26384c')
 canvas.save(f'tmp/implementation/contact-{width}-{theme}-{n//16+1}.jpg')
