import {escapeHTML,publicationsHTML,matchingPublications,latestHTML,researchHTML,newsHTML,peopleHTML} from './templates.mjs?v=20261013';
const qs = (selector) => document.querySelector(selector);
const qsa = (selector) => [...document.querySelectorAll(selector)];
const version = 'minimal-20261013';
const storageKey = 'wenlongSiteLanguage';
const pageTitleKeys = {home:'siteTitle',about:'aboutTitle',research:'researchTitle','mof-glasses':'mofGlassesTitle',publications:'publicationsTitle',news:'newsTitle',people:'peopleTitle',contact:'contactTitle'};
const originalTitle = document.title;
let language = 'en';
let content;
let translations = {};
let filter = {query:'',mode:'articles'};
function storedLanguage() { try { return localStorage.getItem(storageKey); } catch { return null; } }
function translate(path, fallback) { return language === 'zh' ? path.split('.').reduce((value,key) => value?.[key], translations.zh) ?? fallback : fallback; }
function setText(selector, value) { qsa(selector).forEach(element => { element.textContent = value || ''; }); }
function setLink(selector, url) { qsa(selector).forEach(element => { if (url) element.href = url; }); }
function setContent(selector, html) { const target=qs(selector); if(target) target.innerHTML=html; }
function updatePublications() {
  if (!qs('[data-publications]')) return;
  const results = matchingPublications(content.publications,filter);
  qsa('[data-publication-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.publicationMode===filter.mode)));
  setContent('[data-publications]',publicationsHTML(content.publications,{...filter,lang:language}));
  setText('[data-publication-count]',language === 'zh' ? `${results.length} 条记录` : `${results.length} records`);
  setText('[data-publication-empty]',language === 'zh' ? '没有匹配的论文。' : 'No matching publications.');
  qs('[data-publication-empty]').hidden = Boolean(results.length);
}
function render() {
  const translated=language === 'zh' ? translations.zh || {} : {};
  const site=content.site;
  const profile={...site.profile,...translated.profile};
  const hero={...site.hero,...translated.hero};
  const about={...site.about,...translated.about};
  const research={...site.research,...translated.research,items:site.research.items.map((item,i)=>({...item,...translated.research?.items?.[i]}))};
  document.documentElement.lang=language === 'zh' ? 'zh-CN' : 'en';
  qsa('[data-i18n]').forEach(element=> { element.textContent=translate(element.dataset.i18n,element.dataset.defaultText); });
  qsa('[data-lang-option]').forEach(button=> { const active=button.dataset.langOption === language; button.classList.toggle('active',active); button.setAttribute('aria-pressed',String(active)); });
  document.title=translate(`meta.${pageTitleKeys[document.body.dataset.page]}`,originalTitle);
  for(const [selector,value] of Object.entries({'[data-profile-name]':profile.name,'[data-hero-title]':hero.title,'[data-hero-subtitle]':hero.subtitle,'[data-hero-eyebrow]':hero.eyebrow,'[data-profile-role-full]':profile.roleFull,'[data-profile-affiliation]':profile.affiliation,'[data-profile-location]':profile.location,'[data-footer-name]':profile.name,'[data-contact-name]':profile.name,'[data-contact-role]':profile.roleFull,'[data-contact-affiliation]':profile.affiliation,'[data-contact-location]':profile.location,'[data-contact-heading]':translated.contact?.heading || site.contact.heading,'[data-contact-text]':translated.contact?.text || site.contact.text,'[data-research-heading]':research.heading,'[data-research-intro]':research.intro})) setText(selector,value);
  qsa('[data-profile-photo]').forEach(image=> { image.src=profile.photoUrl; image.alt=profile.photoAlt; });
  qsa('[data-about-text]').forEach(target=> { const paragraphs=target.dataset.aboutText === 'home' ? [hero.lead] : about.paragraphs; target.innerHTML=paragraphs.map(p=>`<p>${escapeHTML(p)}</p>`).join(''); });
  setText('[data-contact-email]',profile.email);
  setLink('[data-contact-email]',`mailto:${profile.email}`);
  setLink('[data-scholar-link]',profile.scholarUrl); setLink('[data-orcid-link]',profile.orcidUrl); setLink('[data-ku-link]',profile.kuProfileUrl);
  setContent('[data-research]',researchHTML(research.items));
  setContent('[data-latest-publications]',latestHTML(content.publications));
  setContent('[data-news]',newsHTML(content.news,language));
  const people=content.people.map((person,i)=>({...person,...translated.people?.[i]}));
  setContent('[data-people]',peopleHTML(people,language));
  updatePublications();
  const search=qs('[data-publication-search]');
  if(search) { search.placeholder=language === 'zh' ? '搜索标题、作者或 DOI' : 'Search title, author or DOI'; search.setAttribute('aria-label',search.placeholder); }
  qsa('[data-long-text]').forEach(element=> { if(language==='zh' && translated.articles?.[element.dataset.longText]) element.innerHTML=translated.articles[element.dataset.longText]; else element.innerHTML=element.dataset.originalHTML; });
  setText('[data-year]',new Date().getFullYear());
  document.body.dataset.ready='true';
}
async function loadJSON(file) { const response=await fetch(`content/${file}.json?v=${version}`,{cache:'no-cache'}); if(!response.ok) throw new Error(`Could not load ${file}`); return response.json(); }
async function init() {
  qsa('[data-i18n]').forEach(element=>element.dataset.defaultText=element.textContent);
  qsa('[data-long-text]').forEach(element=>element.dataset.originalHTML=element.innerHTML);
  const requested=new URLSearchParams(location.search).get('lang') || storedLanguage(); language=requested === 'zh' ? 'zh' : 'en';
  const toggle=qs('[data-nav-toggle]'), nav=qs('[data-nav-links]');
  toggle?.addEventListener('click',()=> { const open=nav.classList.toggle('open'); toggle.setAttribute('aria-expanded',String(open)); });
  document.addEventListener('keydown',event=> { if(event.key==='Escape' && nav?.classList.contains('open')) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded','false'); toggle.focus(); } });
  try {
    const [site,publications,news,people,i18n]=await Promise.all(['site','publications','news','people','i18n'].map(loadJSON));
    content={site,publications,news,people}; translations=i18n;
    if(new URLSearchParams(location.search).has('draft')) { try { const draft=JSON.parse(localStorage.getItem('wenlongSiteDraft')); if(draft?.site) content={...content,...draft}; } catch(error) { console.warn('Draft could not be loaded.',error); } }
    render();
    qsa('[data-lang-option]').forEach(button=>button.addEventListener('click',()=> { language=button.dataset.langOption; try { localStorage.setItem(storageKey,language); } catch {} const url=new URL(location.href); url.searchParams.delete('lang'); history.replaceState(null,'',url); render(); }));
    qs('[data-publication-search]')?.addEventListener('input',event=> { filter.query=event.target.value; updatePublications(); });
    qsa('[data-publication-mode]').forEach(button=>button.addEventListener('click',()=> { filter.mode=button.dataset.publicationMode; qsa('[data-publication-mode]').forEach(item=>item.setAttribute('aria-pressed',String(item===button))); updatePublications(); }));
  } catch(error) { console.warn('Live content unavailable; showing the saved page.',error); document.body.dataset.ready='fallback'; }
}
init();
