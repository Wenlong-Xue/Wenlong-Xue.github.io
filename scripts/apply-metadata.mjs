import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=async file=>JSON.parse(await fs.readFile(path.join(root,file),'utf8'));
const write=async (file,data)=>fs.writeFile(path.join(root,file),JSON.stringify(data,null,2)+'\n');
const old=await read('content/publications.json');
const records=await read('.research-cache/crossref-records.json');
const date='2026-10-13';
const clean=value=>String(value || '').replace(/<[^>]*>/g,'').replace(/[\u2010\u2011]/g,'-').replace(/\s+/g,' ').trim();
const iso=parts=>parts?.map((part,i)=>i ? String(part).padStart(2,'0') : String(part)).join('-');
const key=doi=>doi.toLowerCase();
const byDOI=new Map(old.map(pub=>[key(pub.doi),pub]));
const audit=[];
for(const record of records) {
  if(record.type!=='journal-article') continue;
  const doi=record.DOI;
  const previous=byDOI.get(key(doi));
  const authors=record.author.map(author=>clean([author.given,author.family].filter(Boolean).join(' ')));
  if(!authors.some(name=>/^wen[\s-]*long\s+xue$/i.test(name))) throw new Error(`Author identity missing: ${doi}`);
  const online=record['published-online']?.['date-parts']?.[0];
  const print=record['published-print']?.['date-parts']?.[0];
  const published=print || online || record.issued?.['date-parts']?.[0];
  const type=doi.includes('/ange.') ? 'German translation' : 'Journal article';
  const next={...previous,title:clean(record.title?.[0]),authors:authors.join(', '),authorList:authors,journal:clean(record['container-title']?.[0]),volume:record.volume || '',issue:record.issue || '',pages:record.page || record['article-number'] || '',year:String(published[0]),onlineDate:iso(online) || previous?.date?.replaceAll('/','-') || iso(published),onlineYear:String(online?.[0] || previous?.year || published[0]),date:iso(published),publisher:record.publisher || '',type,doi,url:`https://doi.org/${doi}`,tags:previous?.tags || [],verifiedAt:date,metadataSource:`https://api.crossref.org/works/${doi}`};
  delete next.citations;
  if(type==='German translation') next.publishedVersion=doi.replace('/ange.','/anie.');
  if(doi==='10.1002/anie.1298188') next.tags=['hybrid glasses','photochromism'];
  if(doi==='10.1038/s41563-026-02712-5') next.tags=['MOF glasses','ligand exchange','flux melting'];
  if(doi==='10.1021/jacs.6c05678') next.tags=['MOF glasses','flux-assisted vitrification','gas sorption'];
  if(doi==='10.1002/anie.202010783') next.keywords=['proton conduction','ionic liquids','metal-organic frameworks'];
  byDOI.set(key(doi),next);
  audit.push({doi,status:previous ? 'updated' : 'added',title:next.title,authors:authors.length,year:next.year,onlineDate:next.onlineDate,source:next.metadataSource,verifiedAt:date});
}
const relations={'10.26434/chemrxiv.15000963':'10.1021/jacs.6c05678','10.26434/chemrxiv-2025-2ss9r':'10.1038/s41563-026-02712-5','10.26434/chemrxiv-2023-51bpl':'10.1038/s41467-024-48703-5'};
const pubs=[...byDOI.values()].map(pub=> {
  const result={...pub}; delete result.citations;
  if(relations[pub.doi]) result.publishedVersion=relations[pub.doi];
  return result;
}).sort((a,b)=>Number(b.year)-Number(a.year) || String(b.onlineDate || b.date).localeCompare(String(a.onlineDate || a.date)));
await write('content/publications.json',pubs);
await write('content/publication-audit.json',{verifiedAt:date,grouping:'Journal issue year where assigned; otherwise online publication year. Online-first dates retained separately.',sources:['https://orcid.org/0000-0003-0778-2300','https://www.kuleuven.be/wieiswie/en/person/00177372','https://api.crossref.org/'],records:[...new Map(audit.map(item=>[key(item.doi),item])).values()]});
const site=await read('content/site.json');
site.publicationsUpdated=date;
site.profile.photoUrl='assets/img/wenlong-xue.webp';
site.profile.photoAlt='Wenlong Xue, MSCA Postdoctoral Fellow at KU Leuven';
site.profile.kuProfileUrl='https://www.kuleuven.be/wieiswie/en/person/00177372';
site.profile.affiliation='Ameloot Group · cMACS, KU Leuven';
site.research.heading='Research';
site.hero.eyebrow='Materials chemistry';
site.timeline=[{date:'2025–present',text:'MSCA Postdoctoral Fellow, KU Leuven',textZh:'MSCA 博士后研究员，KU Leuven'},{date:'2024–2025',text:'Postdoctoral Researcher, TU Dortmund',textZh:'博士后研究员，多特蒙德工业大学'},{date:'2021–2024',text:'PhD, TU Dortmund',textZh:'博士，多特蒙德工业大学'},{date:'2017–2020',text:'Master’s degree, Capital Normal University',textZh:'硕士，首都师范大学'}];
await write('content/site.json',site);
const people=await read('content/people.json');
people[0].photo=site.profile.photoUrl; people[0].photoAlt=site.profile.photoAlt;
people[1]={...people[1],placeholder:true,name:'To be added',role:'Future members',bio:'Student, postdoctoral and visiting researcher profiles will appear here.'};
await write('content/people.json',people);
const news=[
  {date:'2026-09-14',title:'Photochromic hybrid metal halide glasses',titleZh:'光致变色杂化金属卤化物玻璃',text:'New collaborative work in Angewandte Chemie International Edition.',textZh:'合作研究发表于 Angewandte Chemie International Edition。',url:'https://doi.org/10.1002/anie.1298188'},
  {date:'2026-08-24',title:'Restructuring MOF glasses through ligand exchange',titleZh:'通过配体交换重构 MOF 玻璃',text:'Flux-mediated ligand exchange research published in Nature Materials.',textZh:'助熔介导的配体交换研究发表于 Nature Materials。',url:'https://doi.org/10.1038/s41563-026-02712-5'},
  {date:'2026-06-16',title:'Zinc halide flux-assisted vitrification',titleZh:'锌卤化物助熔玻璃化',text:'The full journal article is now available in JACS.',textZh:'正式论文已发表于 JACS。',url:'https://doi.org/10.1021/jacs.6c05678'},
  {date:'2026-05-04',title:'Alkali-ion-modified ZIF glasses',titleZh:'碱金属离子改性的 ZIF 玻璃',text:'Collaborative work published in Nature Chemistry.',textZh:'合作研究发表于 Nature Chemistry。',url:'https://doi.org/10.1038/s41557-026-02115-8'},
  {date:'2025-03',title:'MSCA Postdoctoral Fellowship at KU Leuven',titleZh:'在 KU Leuven 开展 MSCA 博士后研究',text:'Research on amorphous hybrid frameworks and proton-conducting materials in the Ameloot Group.',textZh:'在 Ameloot 课题组开展无定形杂化框架与质子传导材料研究。',url:site.profile.kuProfileUrl}
];
await write('content/news.json',news);
const i18n=await read('content/i18n.json');
i18n.zh.profile.affiliation='Ameloot 课题组 · cMACS，KU Leuven';
i18n.zh.hero.eyebrow='材料化学';
i18n.zh.research.heading='研究方向';
i18n.zh.pages.publications.heading='论文';
i18n.zh.pages.publications.intro='按正式卷期年份归类；尚未分配卷期的文章按在线发表年份归类。';
i18n.zh.people[1]={name:'待加入',role:'未来成员',photoAlt:'成员照片待加入',bio:'学生、博士后及访问学者的个人资料将在这里展示。'};
i18n.zh.labels={...i18n.zh.labels,latest:'最新论文',viewAll:'查看全部论文',updated:'更新于',all:'全部',articles:'期刊论文',other:'其他版本',researchDetail:'研究详情',background:'MOF 玻璃背景',timeline:'经历',skip:'跳转到正文'};
delete i18n.zh.news;
await write('content/i18n.json',i18n);
console.log(JSON.stringify({records:pubs.length,articles:pubs.filter(p=>p.type==='Journal article').length,added:audit.filter(p=>p.status==='added').map(p=>({title:p.title,doi:p.doi}))},null,2));
