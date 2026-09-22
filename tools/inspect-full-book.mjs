import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..');
const {chromium}=await import(process.env.BOOK_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1400,height:1050}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(pathToFileURL(path.join(root,'second-edition.html')).href);
await page.evaluate(()=>document.fonts.ready);
await page.addStyleTag({content:'header{visibility:hidden!important} html{scroll-behavior:auto!important}'});
const figures=page.locator('figure.diagram');
for(let i=0;i<await figures.count();i++){
 const el=figures.nth(i);await el.scrollIntoViewIfNeeded();await el.screenshot({path:path.join(root,`tmp/full-book/figures/figure-${i+1}.png`)});
}
const collisions=await page.evaluate(()=>{
 const bad=[];
 for(const svg of document.querySelectorAll('figure.diagram > svg')){
  const matrix=svg.getScreenCTM();const label=svg.querySelector('title').textContent;
  const rects=[...svg.querySelectorAll('text,foreignObject .katex-html')].map(e=>({text:e.textContent,rect:e.getBoundingClientRect()}));
  for(const p of svg.querySelectorAll('.diagram-arrow')){
   const length=p.getTotalLength();
   for(let j=3;j<length-3;j+=3){const v=p.getPointAtLength(j);const q=new DOMPoint(v.x,v.y).matrixTransform(matrix);
    for(const{rect:r,text}of rects){if(q.x>r.left+2&&q.x<r.right-2&&q.y>r.top+2&&q.y<r.bottom-2){bad.push({label,text,path:p.getAttribute('d')});j=length;break;}}
   }
  }
 }
 return bad;
});
const malformedMath=await page.locator('.diagram-math .katex-html').evaluateAll(es=>es.filter(e=>/mathrm|mathbb|operatorname/.test(e.textContent)).map(e=>e.textContent));
const broken=await page.evaluate(()=>[...document.querySelectorAll('a[href^="#"]')].filter(a=>!document.getElementById(a.hash.slice(1))).map(a=>a.getAttribute('href')));
const desks=[];
for(const id of ['geometry','uncertainty','ridge','attention','rollout','normality']){
 const el=page.locator(`#${id}-lab`);await el.scrollIntoViewIfNeeded();const before=await el.locator('.readout').innerText();
 await el.locator('input').evaluate(e=>{e.value=e.max;e.dispatchEvent(new Event('input',{bubbles:true}))});
 const after=await el.locator('.readout').innerText();if(before===after)throw Error('Desk did not respond: '+id);
 await el.screenshot({path:path.join(root,`tmp/full-book/${id}-desk.png`)});desks.push({id,before,after});
}
await page.locator('[data-normality="two-point"]').click();
await page.locator('#normality-lab').screenshot({path:path.join(root,'tmp/full-book/normality-two-point.png')});
const requiredHidden=await page.locator('details > summary').evaluateAll(es=>es.filter(e=>e.textContent.startsWith('Required')).map(e=>e.textContent));
if(requiredHidden.length)throw Error('Core proofs are hidden: '+requiredHidden.join(', '));
const chapters=await page.locator('article').evaluateAll(es=>es.map(e=>e.id));
for(const id of chapters){await page.locator(`#${id}`).scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,`tmp/full-book/chapter-${id}.png`)});}
for(let i=0;i<await page.locator('.code-wrap').count();i++){const e=page.locator('.code-wrap').nth(i);await e.scrollIntoViewIfNeeded();await e.screenshot({path:path.join(root,`tmp/full-book/code-${i+1}.png`)});}
const desktop=await page.evaluate(()=>({width:innerWidth,scroll:document.body.scrollWidth,mathOverflow:[...document.querySelectorAll('.katex-display')].filter(e=>e.scrollWidth>e.clientWidth+2).map(e=>e.textContent.slice(0,80))}));
await page.setViewportSize({width:390,height:844});await page.locator('#attention-lab').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,'tmp/full-book/mobile-attention.png')});
const mobile=await page.evaluate(()=>({width:innerWidth,scroll:document.body.scrollWidth,visibleSelects:[...document.querySelectorAll('select')].filter(e=>e.getBoundingClientRect().height).length}));
await page.locator('#normality-lab').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,'tmp/full-book/mobile-normality.png')});
await page.locator('#paper .diagram').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,'tmp/full-book/mobile-architecture.png')});
await page.locator('#implementation .code-wrap').first().scrollIntoViewIfNeeded();await page.screenshot({path:path.join(root,'tmp/full-book/mobile-code.png')});
const report={chapters:chapters.length,figures:await figures.count(),diagramMath:await page.locator('.diagram-math').count(),errors,broken,malformedMath,collisions,desks,desktop,mobile};
fs.writeFileSync(path.join(root,'research/full-book/browser-inspection.json'),JSON.stringify(report,null,2));
await browser.close();console.log(JSON.stringify(report,null,2));
if(malformedMath.length||errors.length||broken.length||collisions.length||desktop.mathOverflow.length||mobile.width!==mobile.scroll)process.exitCode=1;
