# Maintain Wenlong Xue's academic website

The working repository is `D:\Codex\wenlong-website`. Preserve GitHub Pages hosting, separate pages and EN/Chinese switching. Keep the layout compact: white background, restrained typography, narrow reading measures, plain research summaries and year-grouped papers. Keep the portrait and future-member placeholders.

Routine edits belong in `content/*.json`. The browser editor saves these files locally. Preserve full author strings and keep `authorList` consistent when authors change. Keep preprints, covers and parallel editions clearly labelled; relate them to journal versions through `publishedVersion`. Never add similarly named researchers' papers without ORCID, institutional or coauthor evidence.

Use DOI publisher/Crossref records to verify titles, author order, volume, issue, pages and publication dates. Journal issue year is used for grouping when available, with earlier online publication dates retained. Record sources and verification dates. Never claim that Scholar synchronisation is automatic.

Run `node scripts/build.mjs` after JSON edits. This writes static English content and metadata into public HTML so information is visible without JavaScript. The browser hydrates the same content for Chinese, filtering and draft previews. Preserve canonical URLs, sitemap, robots, social metadata and valid Schema.org types. Only actual personal-profile pages should be `ProfilePage`; other pages should be `WebPage`.

Use `node scripts/verify.mjs` with Playwright/Edge to test desktop and mobile layouts, full paper data, publication search, type filters, language persistence, photos, no-JavaScript content and editor JSON export. Inspect the screenshots as well as the assertions. The ignored `test-results/` and `.research-cache/` folders must not be published.

Do not rerun `scripts/apply-metadata.mjs` without review: it is the date-specific October 2026 migration. Create a backup before syncing the public files to `D:\Web\wenlong-website`; exclude `.git`, metadata caches and test results. Never overwrite unrelated user edits.
