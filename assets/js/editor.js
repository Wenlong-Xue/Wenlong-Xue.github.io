const editorState = {
  site: null,
  publications: [],
  news: [],
  people: []
};

let directoryHandle = null;
let previewTimer = null;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const listConfigs = {
  metrics: {
    title: "Homepage metrics",
    path: "site.metrics",
    addLabel: "Add metric",
    defaults: () => ({ label: "New metric", value: "" }),
    fields: [
      { key: "label", label: "Label" },
      { key: "value", label: "Text", type: "textarea" }
    ]
  },
  research: {
    title: "Research directions",
    path: "site.research.items",
    addLabel: "Add direction",
    defaults: () => ({ title: "New direction", text: "", tags: [] }),
    fields: [
      { key: "title", label: "Title" },
      { key: "text", label: "Text", type: "textarea" },
      { key: "tags", label: "Tags", type: "tags" }
    ]
  },
  platforms: {
    title: "Platforms",
    path: "site.platforms.items",
    addLabel: "Add platform",
    defaults: () => ({ title: "New platform", text: "" }),
    fields: [
      { key: "title", label: "Title" },
      { key: "text", label: "Text", type: "textarea" }
    ]
  },
  publications: {
    title: "Publications",
    path: "publications",
    addLabel: "Add paper",
    defaults: () => ({
      title: "New publication",
      authors: "Xue, W.-L.; et al.",
      journal: "",
      year: String(new Date().getFullYear()),
      doi: "",
      url: "",
      tags: [],
      selected: false
    }),
    fields: [
      { key: "title", label: "Title", type: "textarea" },
      { key: "authors", label: "Authors" },
      { key: "journal", label: "Journal" },
      { key: "year", label: "Year" },
      { key: "doi", label: "DOI" },
      { key: "url", label: "URL" },
      { key: "tags", label: "Tags", type: "tags" },
      { key: "selected", label: "Selected paper", type: "checkbox" }
    ]
  },
  news: {
    title: "News",
    path: "news",
    addLabel: "Add news",
    defaults: () => ({ date: String(new Date().getFullYear()), title: "New update", text: "" }),
    fields: [
      { key: "date", label: "Date" },
      { key: "title", label: "Title" },
      { key: "text", label: "Text", type: "textarea" }
    ]
  },
  people: {
    title: "People",
    path: "people",
    addLabel: "Add person",
    defaults: () => ({ name: "New person", role: "", bio: "", links: [] }),
    fields: [
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "bio", label: "Bio", type: "textarea" },
      { key: "links", label: "Links", type: "links" }
    ]
  }
};

function escapeHTML(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getPath(path) {
  return path.split(".").reduce((object, part) => object?.[part], editorState);
}

function setPath(path, value) {
  const parts = path.split(".");
  const last = parts.pop();
  const target = parts.reduce((object, part) => object[part], editorState);
  target[last] = value;
}

async function fetchJSON(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function setStatus(message, type = "ok") {
  const target = $("[data-status]");
  target.textContent = message;
  target.className = `status-bar ${type}`;
}

function fieldHTML(path, label, type = "text", options = {}) {
  const value = getPath(path);
  const full = options.full ? " full" : "";
  const dataType = type === "textarea" ? "text" : type;

  if (type === "textarea") {
    return `
      <div class="field${full}">
        <label for="${path}">${escapeHTML(label)}</label>
        <textarea id="${path}" data-path="${path}" data-type="text">${escapeHTML(value || "")}</textarea>
      </div>
    `;
  }

  if (type === "paragraphs") {
    return `
      <div class="field${full}">
        <label for="${path}">${escapeHTML(label)}</label>
        <textarea id="${path}" data-path="${path}" data-type="paragraphs">${escapeHTML((value || []).join("\n\n"))}</textarea>
      </div>
    `;
  }

  if (type === "checkbox") {
    return `
      <label class="checkbox-field${full}">
        <input type="checkbox" data-path="${path}" data-type="checkbox" ${value ? "checked" : ""} />
        ${escapeHTML(label)}
      </label>
    `;
  }

  if (type === "tags") {
    return `
      <div class="field${full}">
        <label for="${path}">${escapeHTML(label)}</label>
        <input id="${path}" data-path="${path}" data-type="tags" value="${escapeHTML((value || []).join(", "))}" />
      </div>
    `;
  }

  if (type === "links") {
    return `
      <div class="field${full}">
        <label for="${path}">${escapeHTML(label)}</label>
        <textarea id="${path}" data-path="${path}" data-type="links">${escapeHTML(linksToText(value || []))}</textarea>
      </div>
    `;
  }

  return `
    <div class="field${full}">
      <label for="${path}">${escapeHTML(label)}</label>
      <input id="${path}" data-path="${path}" data-type="${dataType}" value="${escapeHTML(value || "")}" />
    </div>
  `;
}

function parseTags(value) {
  return value.split(",").map((tag) => tag.trim()).filter(Boolean);
}

function linksToText(links) {
  return links.map((link) => `${link.label || ""} | ${link.url || ""}`).join("\n");
}

function parseLinks(value) {
  return value.split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, ...urlParts] = line.split("|");
      return {
        label: (label || "").trim(),
        url: urlParts.join("|").trim()
      };
    })
    .filter((link) => link.label && link.url);
}

function renderStaticFields() {
  $("[data-basics-fields]").innerHTML = [
    fieldHTML("site.profile.name", "Name"),
    fieldHTML("site.profile.initials", "Initials"),
    fieldHTML("site.profile.role", "Short role"),
    fieldHTML("site.profile.roleFull", "Full role"),
    fieldHTML("site.profile.affiliation", "Affiliation", "textarea", { full: true }),
    fieldHTML("site.profile.location", "Location"),
    fieldHTML("site.profile.email", "Email"),
    fieldHTML("site.profile.scholarUrl", "Google Scholar URL", "text", { full: true }),
    fieldHTML("site.profile.orcidUrl", "ORCID URL", "text", { full: true }),
    fieldHTML("site.profile.kuProfileUrl", "KU Leuven profile URL", "text", { full: true })
  ].join("");

  $("[data-homepage-fields]").innerHTML = [
    fieldHTML("site.hero.eyebrow", "Hero eyebrow"),
    fieldHTML("site.hero.title", "Hero title"),
    fieldHTML("site.hero.subtitle", "Hero subtitle", "textarea", { full: true }),
    fieldHTML("site.hero.lead", "Hero lead", "textarea", { full: true }),
    fieldHTML("site.hero.primaryText", "Primary button text"),
    fieldHTML("site.hero.primaryHref", "Primary button link"),
    fieldHTML("site.hero.secondaryText", "Secondary button text"),
    fieldHTML("site.hero.secondaryHref", "Secondary button link"),
    fieldHTML("site.about.heading", "About heading", "text", { full: true }),
    fieldHTML("site.about.paragraphs", "About paragraphs", "paragraphs", { full: true }),
    fieldHTML("site.contact.heading", "Contact heading", "text", { full: true }),
    fieldHTML("site.contact.text", "Contact text", "textarea", { full: true })
  ].join("");

  $("[data-research-fields]").innerHTML = [
    fieldHTML("site.research.heading", "Research heading", "text", { full: true }),
    fieldHTML("site.research.intro", "Research intro", "textarea", { full: true })
  ].join("");

  $("[data-platform-fields]").innerHTML = [
    fieldHTML("site.platforms.heading", "Platform heading", "text", { full: true }),
    fieldHTML("site.platforms.intro", "Platform intro", "textarea", { full: true })
  ].join("");
}

function renderListEditor(key) {
  const config = listConfigs[key];
  const target = $(`[data-list="${key}"]`) || $(`[data-collection="${key}"]`);
  if (!target) return;
  const items = getPath(config.path) || [];

  const listHead = target.matches(".list-editor")
    ? `
      <div class="list-head">
        <h3>${escapeHTML(config.title)}</h3>
        <button class="button secondary small" type="button" data-add="${key}">${escapeHTML(config.addLabel)}</button>
      </div>
    `
    : "";

  target.innerHTML = listHead + items.map((item, index) => {
    const title = item.title || item.name || item.label || `Item ${index + 1}`;
    const fields = config.fields.map((field) => {
      const path = `${config.path}.${index}.${field.key}`;
      return fieldHTML(path, field.label, field.type || "text", { full: field.type === "textarea" || field.type === "links" });
    }).join("");

    return `
      <article class="edit-card">
        <div class="edit-card-title">
          <strong>${escapeHTML(title)}</strong>
          <div class="row-actions">
            <button class="icon-button" type="button" title="Move up" data-move="up" data-key="${key}" data-index="${index}">Up</button>
            <button class="icon-button" type="button" title="Move down" data-move="down" data-key="${key}" data-index="${index}">Down</button>
            <button class="icon-button" type="button" title="Remove" data-remove="${key}" data-index="${index}">Remove</button>
          </div>
        </div>
        <div class="field-grid two">${fields}</div>
      </article>
    `;
  }).join("");
}

function renderEditor() {
  renderStaticFields();
  Object.keys(listConfigs).forEach(renderListEditor);
  updateDraft();
}

function updateFromField(input) {
  const path = input.dataset.path;
  const type = input.dataset.type;
  if (!path) return;

  if (type === "checkbox") {
    setPath(path, input.checked);
  } else if (type === "tags") {
    setPath(path, parseTags(input.value));
  } else if (type === "paragraphs") {
    setPath(path, input.value.split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean));
  } else if (type === "links") {
    setPath(path, parseLinks(input.value));
  } else {
    setPath(path, input.value);
  }

  updateDraft();
}

function addItem(key) {
  const config = listConfigs[key];
  const items = getPath(config.path);
  items.unshift(config.defaults());
  renderEditor();
  setStatus(`${config.title}: item added.`);
}

function removeItem(key, index) {
  const config = listConfigs[key];
  const items = getPath(config.path);
  items.splice(Number(index), 1);
  renderEditor();
  setStatus(`${config.title}: item removed.`);
}

function moveItem(key, index, direction) {
  const config = listConfigs[key];
  const items = getPath(config.path);
  const current = Number(index);
  const next = direction === "up" ? current - 1 : current + 1;
  if (next < 0 || next >= items.length) return;
  const [item] = items.splice(current, 1);
  items.splice(next, 0, item);
  renderEditor();
  setStatus(`${config.title}: item moved.`);
}

function updateDraft() {
  window.localStorage.setItem("wenlongSiteDraft", JSON.stringify(editorState));
  const preview = $("[data-json-preview]");
  if (preview) preview.value = JSON.stringify(editorState, null, 2);

  window.clearTimeout(previewTimer);
  previewTimer = window.setTimeout(refreshPreview, 700);
}

function refreshPreview() {
  const iframe = $("[data-preview]");
  if (iframe) iframe.contentWindow.location.reload();
}

async function readFileFromHandle(path) {
  const parts = path.split("/");
  let handle = directoryHandle;
  for (const part of parts.slice(0, -1)) {
    handle = await handle.getDirectoryHandle(part);
  }
  const fileHandle = await handle.getFileHandle(parts.at(-1));
  const file = await fileHandle.getFile();
  return JSON.parse(await file.text());
}

async function writeFileToHandle(path, data) {
  const parts = path.split("/");
  let handle = directoryHandle;
  for (const part of parts.slice(0, -1)) {
    handle = await handle.getDirectoryHandle(part, { create: true });
  }
  const fileHandle = await handle.getFileHandle(parts.at(-1), { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(`${JSON.stringify(data, null, 2)}\n`);
  await writable.close();
}

async function loadFromFolder() {
  if (!("showDirectoryPicker" in window)) {
    setStatus("Your browser cannot open folders directly. Use Edge or Chrome for direct saving.", "warn");
    return;
  }

  directoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
  editorState.site = await readFileFromHandle("content/site.json");
  editorState.publications = await readFileFromHandle("content/publications.json");
  editorState.news = await readFileFromHandle("content/news.json");
  editorState.people = await readFileFromHandle("content/people.json");
  renderEditor();
  setStatus("Folder opened. Changes can now be saved directly.");
}

async function saveToFolder() {
  if (!directoryHandle) {
    if (!("showDirectoryPicker" in window)) {
      setStatus("Direct saving is not supported in this browser. Use Download JSON instead.", "warn");
      return;
    }
    directoryHandle = await window.showDirectoryPicker({ mode: "readwrite" });
  }

  await writeFileToHandle("content/site.json", editorState.site);
  await writeFileToHandle("content/publications.json", editorState.publications);
  await writeFileToHandle("content/news.json", editorState.news);
  await writeFileToHandle("content/people.json", editorState.people);
  setStatus("Saved to content/site.json, publications.json, news.json, and people.json.");
  refreshPreview();
}

function downloadJSON() {
  const files = [
    ["site.json", editorState.site],
    ["publications.json", editorState.publications],
    ["news.json", editorState.news],
    ["people.json", editorState.people]
  ];

  files.forEach(([name, data]) => {
    const blob = new Blob([`${JSON.stringify(data, null, 2)}\n`], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  });

  setStatus("JSON files downloaded. Move them into the content folder if direct saving is unavailable.");
}

async function loadDefaultContent() {
  const [site, publications, news, people] = await Promise.all([
    fetchJSON("content/site.json"),
    fetchJSON("content/publications.json"),
    fetchJSON("content/news.json"),
    fetchJSON("content/people.json")
  ]);
  editorState.site = site;
  editorState.publications = publications;
  editorState.news = news;
  editorState.people = people;
}

function bindEvents() {
  document.addEventListener("input", (event) => {
    if (event.target.matches("[data-path]")) updateFromField(event.target);
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-path]")) updateFromField(event.target);
  });

  document.addEventListener("click", async (event) => {
    const addKey = event.target.dataset.add;
    const removeKey = event.target.dataset.remove;
    const moveDirection = event.target.dataset.move;

    if (addKey) addItem(addKey);
    if (removeKey) removeItem(removeKey, event.target.dataset.index);
    if (moveDirection) moveItem(event.target.dataset.key, event.target.dataset.index, moveDirection);

    if (event.target.matches("[data-load-folder]")) {
      try {
        await loadFromFolder();
      } catch (error) {
        console.error(error);
        setStatus("Folder could not be opened. Choose the website root folder that contains index.html.", "warn");
      }
    }

    if (event.target.matches("[data-save]")) {
      try {
        await saveToFolder();
      } catch (error) {
        console.error(error);
        setStatus("Could not save files. Check that you selected the website root folder.", "warn");
      }
    }

    if (event.target.matches("[data-download]")) downloadJSON();
    if (event.target.matches("[data-refresh-preview]")) refreshPreview();
  });
}

async function initEditor() {
  bindEvents();
  try {
    await loadDefaultContent();
    renderEditor();
    setStatus("Content loaded. Edit fields, then save or download JSON.");
  } catch (error) {
    console.error(error);
    setStatus("Content files could not be loaded. Preview the editor through a local web server.", "warn");
  }
}

initEditor();
