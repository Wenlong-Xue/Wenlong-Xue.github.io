import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {startPreview} from './preview.mjs';
const require=createRequire(import.meta.url);
let playwright;
try { playwright=require('playwright'); } catch { playwright=createRequire(path.resolve(path.dirname(process.execPath),'../node_modules/playwright/package.json'))('playwright'); }
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.join(root,'test-results'); await fs.mkdir(output,{recursive:true});
const {server,url}=await startPreview();
let browser;
const failures=[];
try {
 browser=await playwright.chromium.launch({headless:true,channel:'msedge'});
 const pubData=JSON.parse(await fs.readFile(path.join(root,'content/publications.json'),'utf8'));
 const context=await browser.newContext({viewport:{width:1440,height:980}});
 const page=await context.newPage();
 page.on('pageerror',error=>failures.push(error.message));
 page.on('response',response=> { if(response.status()>=400) failures.push(`${response.status()} ${response.url()}`); });
 const files=['index','about','research','mof-glasses','publications','news','people','contact'];
 for(const width of [1440,390]) {
  await page.setViewportSize({width,height:width===1440?980:844});
  for(const file of files) {
   await page.goto(`${url}/${file}.html`);
   await page.waitForSelector('body[data-ready="true"]');
   await page.waitForFunction(()=>[...document.images].every(img=>img.complete && img.naturalWidth>0));
   const layout=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,images:[...document.images].map(img=>({loaded:img.complete&&img.naturalWidth>0,alt:img.alt})),canonical:document.querySelector('link[rel="canonical"]')?.href,robots:document.querySelector('meta[name="robots"]')?.content,ld:JSON.parse(document.querySelector('script[type="application/ld+json"]').textContent)}));
   assert(layout.scroll<=layout.width,`${file} overflows at ${width}: ${layout.scroll}`);
   assert.equal(layout.h1,1,file);
   assert(layout.images.every(img=>img.loaded&&img.alt),`Image failed on ${file}`);
   assert(layout.canonical.startsWith('https://wenlong-xue.github.io/'));
   assert.equal(layout.robots,'index, follow');
   if(file==='index') {
    const portrait=await page.locator('.portrait img').boundingBox();
    assert(portrait.height/portrait.width<1.35,'Homepage portrait must remain compact');
    assert(await page.locator('h1').isVisible());
   }
   await page.screenshot({path:path.join(output,`${file}-${width}.png`),fullPage:false});
  }
 }
 await page.goto(`${url}/publications.html`); await page.waitForSelector('body[data-ready="true"]');
 assert.equal(await page.locator('.publication-item').count(),pubData.filter(pub=>pub.type==='Journal article').length);
 await page.locator('[data-publication-mode="all"]').click();
 assert.equal(await page.locator('.publication-item').count(),pubData.length);
 await page.locator('[data-publication-mode="articles"]').click();
 assert.equal(await page.locator('.publication-item').count(),pubData.filter(pub=>pub.type==='Journal article').length);
 await page.locator('[data-publication-search]').fill('10.1038/s41563-026-02712-5');
 assert.equal(await page.locator('.publication-item').count(),1);
 assert.match(await page.locator('.publication-authors').innerText(),/Jan-Benedikt Weiß.*Wen-Long Xue.*Sebastian Henke/);
 await page.locator('[data-publication-search]').fill('unlikely-query-no-results');
 assert(await page.locator('[data-publication-empty]').isVisible());
 await page.locator('[data-publication-search]').fill('');
 await page.locator('[data-publication-mode="other"]').click();
 assert.equal(await page.locator('.publication-item').count(),pubData.filter(pub=>pub.type!=='Journal article').length);
 await page.locator('[data-lang-option="zh"]').click();
 assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
 await page.goto(`${url}/research.html`); await page.waitForSelector('body[data-ready="true"]');
 assert.equal(await page.locator('html').getAttribute('lang'),'zh-CN');
 await page.locator('summary').click(); assert.match(await page.locator('[data-long-text]').innerText(),/无定形质子导体/);
 await page.goto(`${url}/about.html?lang=en`); await page.waitForSelector('body[data-ready="true"]');
 await page.locator('[data-lang-option="zh"]').click();
 assert.equal(new URL(page.url()).searchParams.get('lang'),null);
 await page.locator('[data-lang-option="en"]').click();
 await page.goto(`${url}/contact.html`); await page.waitForSelector('body[data-ready="true"]');
 assert.equal(await page.locator('[data-contact-email]').getAttribute('href'),'mailto:wenlong.xue@kuleuven.be');
 await page.locator('[data-nav-toggle]').click(); assert(await page.locator('[data-nav-links]').isVisible());
 await page.keyboard.press('Escape'); assert.equal(await page.locator('[data-nav-toggle]').getAttribute('aria-expanded'),'false');
 const noJS=await browser.newContext({javaScriptEnabled:false,viewport:{width:390,height:844}});
 const plain=await noJS.newPage(); await plain.goto(`${url}/publications.html`);
 assert.equal(await plain.locator('.publication-item').count(),pubData.length);
 await plain.goto(`${url}/index.html`); assert.equal(await plain.locator('.latest-item').count(),4);
 await plain.goto(`${url}/research.html`); assert((await plain.locator('.research-narrative').textContent()).split(/\s+/).length>=800);
 await noJS.close();
 await page.goto(`${url}/edit.html`); await page.waitForSelector('[data-path="site.profile.photoUrl"]');
 await page.locator('[data-path="publications.0.authors"]').fill('Test Person, Wen-Long Xue');
 const draft=await page.evaluate(()=>JSON.parse(localStorage.getItem('wenlongSiteDraft')));
 assert.deepEqual(draft.publications[0].authorList,['Test Person','Wen-Long Xue']);
 const downloads=[]; page.on('download',download=>downloads.push(download));
 await page.locator('[data-download]').click(); await page.waitForTimeout(1200);
 assert.equal(downloads.length,4); assert(downloads.every(download=>download.suggestedFilename().endsWith('.json')));
 await page.evaluate(()=>localStorage.removeItem('wenlongSiteDraft'));
 assert.deepEqual(failures,[]);
 await fs.writeFile(path.join(output,'verification.json'),JSON.stringify({passed:true,pages:files.length,viewports:[1440,390],publicationRecords:pubData.length,journalArticles:pubData.filter(pub=>pub.type==='Journal article').length,checks:['metadata','images','no horizontal overflow','search and type filters','Chinese and English','language persistence','no-JavaScript content','editor author sync and JSON export','mobile navigation']},null,2));
 console.log('All website checks passed. Screenshots: '+output);
} finally { await browser?.close(); await new Promise(resolve=>server.close(resolve)); }
