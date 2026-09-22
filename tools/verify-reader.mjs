import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
const root=path.resolve(import.meta.dirname,'..');
const {chromium}=await import(process.env.BOOK_PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({headless:true,args:['--enable-unsafe-webgpu','--enable-features=WebGPU',...(process.platform==='darwin'?['--use-angle=metal']:[])]});
const page=await browser.newPage({viewport:{width:1440,height:1080},colorScheme:'light'});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
const folder=path.join(root,'tmp/editorial');fs.mkdirSync(folder,{recursive:true});
await page.goto(pathToFileURL(path.join(root,'world-models.html')).href);
await page.evaluate(()=>document.fonts.ready);
await page.addStyleTag({content:'html{scroll-behavior:auto!important}'});
assert.equal(await page.locator('.chapter-check').count(),0);
assert.ok(await page.locator('.arm-mechanism').count()>=3);
assert.equal(await page.locator('.arm-mechanism [data-link]').count(),2*await page.locator('.arm-mechanism').count());
const layouts=[];
for(const width of [1440,820,390]) {
 await page.setViewportSize({width,height:1080});
 for(const theme of ['light','dark']) {
  if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#theme-toggle').click();
  await page.locator('#opening').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(folder,`opening-${width}-${theme}.png`)});
  await page.locator('#visual-O1').screenshot({path:path.join(folder,`arm-${width}-${theme}.png`)});
  const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.body.scrollWidth,theme:document.documentElement.dataset.theme,distorted:[...document.querySelectorAll('[data-visual] circle')].filter(e=>{const m=e.getScreenCTM();return Math.abs(Math.hypot(m.a,m.b)-Math.hypot(m.c,m.d))>0.001}).length,brokenImages:[...document.images].filter(e=>!e.complete||!e.naturalWidth).length}));
  assert.equal(layout.width,layout.scroll);assert.equal(layout.distorted,0);assert.equal(layout.brokenImages,0);layouts.push(layout);
  await page.locator('.menu').click();
  await page.waitForTimeout(220);
  assert.equal(await page.locator('#contents').evaluate(e=>e.inert),false);
  await page.locator('#search').fill('CEM');
  assert.ok(await page.locator('#contents .nav-chapter:not([hidden])').count()>0);
  await page.locator('#search').fill('no-such-lesson-123456');
  assert.equal(await page.locator('#search-empty').isVisible(),true);
  await page.locator('#search').fill('');
  await page.screenshot({path:path.join(folder,`contents-${width}-${theme}.png`)});
  if(width<1100){
   assert.equal(await page.locator('main').evaluate(e=>e.inert),true);
   await page.locator('#close-contents').focus();await page.keyboard.press('Shift+Tab');
   assert.ok(await page.evaluate(()=>document.activeElement.closest('#contents')!==null));
  }
  await page.keyboard.press('Escape');
  assert.equal(await page.locator('#contents').evaluate(e=>e.inert),true);
  assert.equal(await page.locator('main').evaluate(e=>e.inert),false);
 }
}
await page.setViewportSize({width:1440,height:1080});
const canvases=[];
for(const theme of ['dark','light']) {
 if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#theme-toggle').click();
 for(const [name,selector]of [['jepa','#jepa .diagram'],['sigreg','#sigreg-lab'],['code','#implementation .code-wrap'],['architecture','#paper .diagram'],['comparison','#visual-P3']]){
  const el=page.locator(selector).first();await el.scrollIntoViewIfNeeded();await el.screenshot({path:path.join(folder,`${name}-${theme}.png`)});
 }
 canvases.push(await page.locator('#sigreg-lab canvas').first().evaluate(c=>c.toDataURL()));
}
assert.notEqual(canvases[0],canvases[1]);
await page.locator('#theme-toggle').click();await page.reload();
assert.equal(await page.locator('html').getAttribute('data-theme'),'dark');
const training=await page.evaluate(async()=>{
 const init=await WorldWorkshop.init({seed:17});
 const before=WorldWorkshop.snapshot().evaluation;
 const result=await WorldWorkshop.train(20);
 const trim=e=>Object.fromEntries(Object.entries(e).filter(([,v])=>typeof v==='number'));
 await WorldWorkshop.resetScene();
 const control=await WorldWorkshop.control(2);
 return {backend:init.backend,parameters:init.info.parameters,before:trim(before),after:trim(result.evaluation),step:result.metrics.step,control:{actions:control.trajectory.length,error:control.scene.error}};
});
assert.equal(training.step,20);assert.ok(Number.isFinite(training.after.predictionLoss));
assert.notEqual(training.after.predictionLoss,training.before.predictionLoss);
assert.equal(training.control.actions,2);
assert.ok(Number.isFinite(training.control.error));
for(const theme of ['dark','light']){
 if(await page.locator('html').getAttribute('data-theme')!==theme)await page.locator('#theme-toggle').click();
 await page.locator('#control-lab').screenshot({path:path.join(folder,`live-control-${theme}.png`)});
 assert.equal(await page.locator('#world-control-plot .arm-mechanism [data-link]').count(),2);
}
assert.deepEqual(errors,[]);
const report={checked:new Date().toISOString(),layouts,errors,training};
fs.writeFileSync(path.join(root,'research/editorial-2026-09-21/reader-check.json'),JSON.stringify(report,null,2));
await browser.close();console.log(JSON.stringify(report,null,2));
