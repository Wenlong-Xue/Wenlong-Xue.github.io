import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cache = path.join(root, '.research-cache');
await fs.mkdir(cache, { recursive: true });
async function getJSON(url) {
  const response = await fetch(url, { headers: { Accept: 'application/json', 'User-Agent': 'WenlongAcademicWebsite/1.0 (publication metadata review)' }, signal: AbortSignal.timeout(30000) });
  if (!response.ok) throw new Error(`${response.status}: ${url}`);
  return response.json();
}
const orcid = await getJSON('https://pub.orcid.org/v3.0/0000-0003-0778-2300/works');
await fs.writeFile(path.join(cache, 'orcid-works.json'), JSON.stringify(orcid, null, 2));
const old = JSON.parse(await fs.readFile(path.join(root, 'content/publications.json'), 'utf8'));
const dois = new Set(old.filter(p => p.type === 'Journal article' || p.type === 'German translation').map(p => p.doi));
for (const group of orcid.group || []) {
  for (const id of group['external-ids']?.['external-id'] || []) {
    if (id['external-id-type'] === 'doi') {
      const doi = id['external-id-value'].replace(/^https?:\/\/doi.org\//, '').trim();
      if (/^10\.(1002|1038|1021|1039|1016)\//.test(doi)) dois.add(doi);
    }
  }
}
const metadata = [];
const failures = [];
for (const doi of dois) {
  try {
    const record = (await getJSON(`https://api.crossref.org/works/${encodeURIComponent(doi)}`)).message;
    metadata.push(record);
    console.log(JSON.stringify({ doi, title: record.title?.[0], online: record['published-online']?.['date-parts'], print: record['published-print']?.['date-parts'], volume: record.volume, issue: record.issue, page: record.page, authorCount: record.author?.length }));
  } catch (error) {
    failures.push({ doi, error: error.message });
    console.log(`FAILED ${doi}: ${error.message}`);
  }
  await new Promise(resolve => setTimeout(resolve, 250));
}
await fs.writeFile(path.join(cache, 'crossref-records.json'), JSON.stringify(metadata, null, 2));
await fs.writeFile(path.join(cache, 'failures.json'), JSON.stringify(failures, null, 2));
console.log(JSON.stringify({ records: metadata.length, failures }));
