# Codex instruction: maintain Wenlong Xue academic website

You are helping maintain an academic website for Wenlong Xue. The site should remain a fast, static, GitHub Pages-compatible academic website that is easy for a non-specialist to update.

## Current architecture

- Plain HTML, CSS, and JavaScript.
- No build step and no backend.
- `index.html` is the home page. About, Research, MOF Glasses, Publications, News, People, and Contact are separate pages.
- `edit.html` is a local browser-based editor for JSON content.
- Public content is stored under `content/`.
- `sitemap.xml` and `robots.txt` live at the root for search-engine discovery.

## Editing rules

Routine content updates should be made in JSON:

- `content/site.json`: profile, hero text, about text, research, images, and contact.
- `content/i18n.json`: Chinese translations for public page labels and editable content.
- `content/publications.json`: publication entries grouped by year on `publications.html`.
- `content/news.json`: recent updates.
- `content/people.json`: profile and group members, including photo paths.

Avoid hard-coding content into `index.html` unless the layout itself needs to change.

Preserve canonical URLs, meta descriptions, index/follow robots tags, and Schema.org `ProfilePage` / `Person` JSON-LD when editing public pages.

## Design direction

- Academic, modern, clean, and credible for a future research-group website.
- Use restrained sections, narrow text measure, and clear hierarchy.
- Keep layout responsive for desktop, tablet, and mobile.
- Avoid heavy dependencies and avoid adding a build system unless the project expands substantially.

## Content direction

- Use British English.
- Prefer concise scientific language.
- Core themes: hybrid glass frameworks, MOF glasses, amorphous proton conductors, synchrotron characterisation, thin-film processing, device integration, and energy/separation technologies.
- Do not overclaim unpublished results.

## Publication data

Publication entries support:

- `title`
- `authors`
- `journal`
- `volume`
- `issue`
- `pages`
- `year`
- `type`
- `doi`
- `url`
- `scholarUrl`

Sort publications newest first. Use the Google Scholar profile as the publication list source, and use DOI or publisher URLs where possible. Preserve complete author strings.

## Validation checklist

Before finalising edits:

- Confirm JSON files are valid.
- Run through a local server, for example `python -m http.server 8000`.
- Check `index.html`, `about.html`, `people.html`, and `edit.html` in a browser.
- Check EN/Chinese language switching.
- Check mobile layout below 760 px.
- Confirm publication year grouping works.
- Confirm editor draft preview and JSON saving/downloading work.
