export const escapeHTML = (value = '') => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
export const sortPublications = (items) => [...items].sort((a,b) => Number(b.year)-Number(a.year) || String(b.onlineDate || b.date || '').localeCompare(String(a.onlineDate || a.date || '')) || a.title.localeCompare(b.title));
export const isArticle = (pub) => pub.type === 'Journal article';
const ownName = (name) => /^wen[\s\-\u2010\u2011]*long\s+xue$/i.test(name.trim());
const searchText = (value) => String(value || '').normalize('NFKD').replace(/\p{Diacritic}/gu,'').toLowerCase();
export function matchingPublications(items, { query = '', mode = 'all' } = {}) {
  const needle = searchText(query.trim());
  return sortPublications(items).filter(pub => (mode === 'all' || (mode === 'articles' ? isArticle(pub) : !isArticle(pub))) && (!needle || searchText([pub.title,pub.authors,pub.journal,pub.doi,pub.year,...(pub.keywords || pub.tags || [])].join(' ')).includes(needle)));
}
export function publicationHTML(pub, lang = 'en') {
  const authors = (pub.authorList || pub.authors.split(',').map(name => name.trim())).map(name => ownName(name) ? `<strong>${escapeHTML(name)}</strong>` : escapeHTML(name)).join(', ');
  const citation = [pub.journal, pub.volume ? `${pub.volume}${pub.issue ? ` (${pub.issue})` : ''}` : '', pub.pages, pub.year].filter(Boolean).map(escapeHTML).join(', ');
  const labels = { Preprint:'预印本', Cover:'封面', 'German translation':'平行版本' };
  const type = isArticle(pub) ? '' : `<span class="publication-type">${escapeHTML(lang === 'zh' ? labels[pub.type] || pub.type : pub.type)}</span>`;
  const online = pub.onlineYear && String(pub.onlineYear) !== String(pub.year) ? `<span class="publication-type">${escapeHTML(pub.onlineYear)} ${lang === 'zh' ? '在线发表' : 'online'}</span>` : '';
  return `<article class="publication-item" data-doi="${escapeHTML(pub.doi)}"><h3 class="publication-title"><a href="${escapeHTML(pub.url)}" target="_blank" rel="noopener">${escapeHTML(pub.title)}</a></h3><p class="publication-authors">${authors}</p><p class="publication-meta">${citation}</p><div class="publication-actions"><a href="${escapeHTML(pub.url)}" target="_blank" rel="noopener">DOI</a>${pub.scholarUrl ? `<a href="${escapeHTML(pub.scholarUrl)}" target="_blank" rel="noopener">Scholar</a>` : ''}${pub.publishedVersion ? `<a href="https://doi.org/${escapeHTML(pub.publishedVersion)}" target="_blank" rel="noopener">${lang === 'zh' ? '正式发表版本' : 'Published version'}</a>` : ''}${type}${online}</div></article>`;
}
export function publicationsHTML(items, options = {}) {
  const groups = new Map();
  for (const pub of matchingPublications(items, options)) {
    if (!groups.has(pub.year)) groups.set(pub.year, []);
    groups.get(pub.year).push(pub);
  }
  return [...groups].map(([year, pubs]) => `<section class="publication-year"><h2>${escapeHTML(year)}</h2><div class="publication-year-items">${pubs.map(pub => publicationHTML(pub, options.lang)).join('')}</div></section>`).join('');
}
export function latestHTML(items) {
  return sortPublications(items.filter(isArticle)).slice(0,4).map(pub => `<article class="latest-item"><span class="latest-year">${escapeHTML(pub.year)}</span><div><h3><a href="${escapeHTML(pub.url)}" target="_blank" rel="noopener">${escapeHTML(pub.title)}</a></h3><p class="latest-meta">${escapeHTML(pub.journal)}</p></div></article>`).join('');
}
export function researchHTML(items) {
  return items.map((item,index) => `<article class="research-item"><div class="research-index">0${index+1}</div><div class="research-copy"><h3>${escapeHTML(item.title)}</h3><p>${escapeHTML(item.text)}</p></div></article>`).join('');
}
export function newsHTML(items, lang = 'en') {
  return items.map(item => `<article class="news-item"><time class="news-date" datetime="${escapeHTML(item.date)}">${escapeHTML(item.date)}</time><div><h3>${item.url ? `<a href="${escapeHTML(item.url)}" target="_blank" rel="noopener">${escapeHTML(lang === 'zh' ? item.titleZh || item.title : item.title)}</a>` : escapeHTML(lang === 'zh' ? item.titleZh || item.title : item.title)}</h3><p>${escapeHTML(lang === 'zh' ? item.textZh || item.text : item.text)}</p></div></article>`).join('');
}
export function peopleHTML(items, lang = 'en') {
  return items.map(person => `<article class="person-item"><figure class="person-photo">${person.placeholder ? `<div class="photo-placeholder"><img src="assets/img/user-round.svg" alt="${lang === 'zh' ? '成员照片待加入' : 'Future member photo'}" width="32" height="32" /><span>${lang === 'zh' ? '待加入' : 'To be added'}</span></div>` : `<img src="${escapeHTML(person.photo)}" alt="${escapeHTML(person.photoAlt || person.name)}" width="256" height="320" />`}</figure><div class="person-copy"><h3>${escapeHTML(person.name)}</h3><div class="person-role">${escapeHTML(person.role)}</div><p>${escapeHTML(person.bio)}</p><div class="person-links">${(person.links || []).map(link => `<a href="${escapeHTML(link.url)}" target="_blank" rel="noopener">${escapeHTML(link.label)}</a>`).join('')}</div></div></article>`).join('');
}
