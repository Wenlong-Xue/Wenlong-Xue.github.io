# Wenlong Xue academic website

This is a lightweight static academic website for GitHub Pages. It uses plain HTML, CSS, and JavaScript, with editable content stored in JSON files under `content/`.

## Local preview

Open a terminal in this folder and run:

```bash
python -m http.server 8000
```

Then open:

- Website: `http://localhost:8000/`
- Editor: `http://localhost:8000/edit.html`

Opening `index.html` directly may work for the layout, but most browsers block local JSON loading from `file://`. Use the local server above for normal editing.

## Editing content in the browser

Use `edit.html` in Microsoft Edge or Google Chrome.

1. Click **Open folder**.
2. Choose the website root folder, the one that contains `index.html`.
3. Edit profile, homepage text, research directions, platforms, publications, news, and people.
4. Click **Save to folder**.
5. Refresh the main website tab.

If folder saving is not available, click **Download JSON** and place the downloaded files into the `content/` folder.

## Content files

- `content/site.json`: profile, hero text, research, platforms, metrics, and contact.
- `content/publications.json`: publication list shown on the website.
- `content/news.json`: recent updates.
- `content/people.json`: current profile and future group members.

The homepage loads these files automatically, so routine updates should not require editing `index.html`.

## Publication updates

Publication entries support:

- `title`
- `authors`
- `journal`
- `year`
- `doi`
- `url`
- `tags`
- `selected`

Use the editor to add or reorder papers. DOI links appear automatically when `url` is filled.

## GitHub Pages deployment

1. Create a GitHub repository, for example `wenlongxue.github.io`.
2. Upload all files from this folder to the repository root.
3. In GitHub, go to **Settings > Pages**.
4. Choose **Deploy from a branch**.
5. Select branch `main` and folder `/root`.
6. Save.

The public site will be available at `https://<username>.github.io/`.
