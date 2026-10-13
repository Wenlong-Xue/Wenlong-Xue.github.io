# Wenlong Xue academic website

Static academic website at https://wenlong-xue.github.io/. The main working copy is `D:\Codex\wenlong-website`; the local website copy is `D:\Web\wenlong-website`.

## Preview and edit

Run `node scripts/preview.mjs 8786`, then open `http://127.0.0.1:8786/`.

Use `http://127.0.0.1:8786/edit.html` in Edge or Chrome. Open the website folder, edit fields, then use **Save to folder**. This changes local JSON; publishing to GitHub is a separate step. **Download JSON** is also available. The draft preview only changes your own browser.

## Content

- `content/site.json`: profile, email, portrait, homepage text, research topics and timeline.
- `content/publications.json`: full authors, DOI, citation details, publication type and related versions.
- `content/news.json`: dated English and Chinese updates.
- `content/people.json`: member profiles, photos and placeholders.
- `content/i18n.json`: Chinese UI and profile text.
- `content/articles.json` and `content/articles-zh.json`: longer research/background text.
- `content/publication-audit.json`: verified metadata sources and changes.

Publications are grouped by journal issue year when assigned; otherwise by online publication year. Earlier online dates remain visible when they differ. Journal articles are the default view. Preprints, covers and parallel editions remain accessible using **All** or **Other versions**. The homepage shows four recent journal articles without repeating parallel versions.

## Prepare an update

Run `node scripts/build.mjs` after editing content and before publishing. This small dependency-free script writes crawler-readable English content, page metadata and a sitemap into the HTML. The public website needs no server or build runtime and remains compatible with GitHub Pages. The browser also reloads JSON for editing and Chinese switching.

`node scripts/collect-metadata.mjs` fetches ORCID-listed DOIs and Crossref records into the ignored `.research-cache/` folder. Review the records before running `node scripts/apply-metadata.mjs`; that migration is specific to the 2026-10-13 update. Do not use it blindly for subsequent updates. Google Scholar is linked, but automated access is not guaranteed.

The October 2026 update contains 29 records, including 21 journal articles. The 25 journal/parallel-edition DOI records were checked against Crossref, ORCID and the KU Leuven profile; the existing three preprints and one cover are retained as archive entries. The update adds the September photochromic-glass paper, August Nature Materials paper and the JACS publication of the zinc-halide flux work. Full authors are retained.

## Verify and publish

`node scripts/verify.mjs` uses Playwright and the installed Edge browser to check desktop/mobile layouts, images, filtering, language switching, metadata, no-JavaScript content and editor JSON exports. Screenshots are saved under ignored `test-results/`.

Commit the generated HTML and content together, then push `main` to `https://github.com/Wenlong-Xue/Wenlong-Xue.github.io`. GitHub Pages deploys the repository root. `robots.txt` permits crawling, and `sitemap.xml` lists public academic pages. `edit.html` is a maintenance tool and is omitted from the sitemap.
