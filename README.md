# Wenlong Xue academic website

This is a lightweight multi-page academic website for GitHub Pages. It uses plain HTML, CSS, and JavaScript, with editable content stored in JSON files under `content/`.

## Local preview

Open a terminal in this folder and run:

```bash
python -m http.server 8000
```

Then open:

- Website: `http://localhost:8000/`
- About: `http://localhost:8000/about.html`
- MOF glasses SEO page: `http://localhost:8000/mof-glasses.html`
- Publications: `http://localhost:8000/publications.html`
- Editor: `http://localhost:8000/edit.html`

Opening `index.html` directly may work for the layout, but most browsers block local JSON loading from `file://`. Use the local server above for normal editing.

## Editing content in the browser

Use `edit.html` in Microsoft Edge or Google Chrome.

1. Click **Open folder**.
2. Choose the website root folder, the one that contains `index.html`.
3. Edit profile, homepage text, research directions, publications, news, and people.
4. Click **Save to folder**.
5. Refresh the main website tab.

If folder saving is not available, click **Download JSON** and place the downloaded files into the `content/` folder.

## Content files

- `content/site.json`: profile, hero text, about text, research, images, and contact.
- `content/i18n.json`: Chinese translations for public page labels and editable content.
- `content/publications.json`: publication list shown on `publications.html`, grouped by year.
- `content/news.json`: recent updates.
- `content/people.json`: current profile and future group members, including photo paths.
- `sitemap.xml` and `robots.txt`: crawl discovery files for GitHub Pages.

The public pages load these files automatically, so routine updates should not require editing the HTML files.

Public HTML pages include canonical URLs, meta descriptions, and Schema.org `ProfilePage` / `Person` JSON-LD for search engines.

## Publication updates

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

The publication list is structured from the Google Scholar profile and includes complete author strings, journal details, DOI or article links, and Scholar detail links. DOI links appear automatically when `url` is filled.

## GitHub Pages deployment

1. Create a GitHub repository, for example `wenlongxue.github.io`.
2. Upload all files from this folder to the repository root.
3. In GitHub, go to **Settings > Pages**.
4. Choose **Deploy from a branch**.
5. Select branch `main` and folder `/root`.
6. Save.

The public site will be available at `https://<username>.github.io/`.
