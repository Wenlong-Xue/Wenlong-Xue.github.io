const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const DEFAULT_LANGUAGE = "en";
const STORAGE_LANGUAGE_KEY = "wenlongSiteLanguage";
const DATA_VERSION = "seo-20260604";
const PAGE_TITLE_KEYS = {
  home: "siteTitle",
  about: "aboutTitle",
  research: "researchTitle",
  "mof-glasses": "mofGlassesTitle",
  publications: "publicationsTitle",
  news: "newsTitle",
  people: "peopleTitle",
  contact: "contactTitle"
};
const PAGE_NAMES = {
  about: "About",
  research: "Research",
  "mof-glasses": "MOF Glasses",
  publications: "Publications",
  news: "News",
  people: "People",
  contact: "Contact"
};
const EN_PAGE_TITLES = {
  home: "Wenlong Xue | MOF Glasses & Hybrid Glass Frameworks",
  about: "About Wenlong Xue | MOF Glasses Researcher",
  research: "Research on MOF Glasses, Proton Conductors & Devices | Wenlong Xue",
  "mof-glasses": "MOF Glasses & Hybrid Glass Frameworks | Wenlong Xue",
  publications: "Publications on MOF Glasses & Hybrid Frameworks | Wenlong Xue",
  news: "News | Wenlong Xue MOF Glasses Research",
  people: "People | Wenlong Xue Research Group",
  contact: "Contact Wenlong Xue | MOF Glasses Research"
};

let currentLanguage = DEFAULT_LANGUAGE;
let translations = {};
let contentCache = null;

const escapeHTML = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

function setText(selector, value) {
  const element = qs(selector);
  if (element) element.textContent = value || "";
}

function setLink(selector, url) {
  const element = qs(selector);
  if (element && url) element.href = url;
}

function setImage(selector, src, alt) {
  const element = qs(selector);
  if (!element) return;
  if (src) element.src = src;
  if (alt) element.alt = alt;
}

function getNestedValue(source, path) {
  return path.split(".").reduce((value, key) => value?.[key], source);
}

function getTranslation(path, fallback = "") {
  if (currentLanguage === DEFAULT_LANGUAGE) return fallback;
  return getNestedValue(translations[currentLanguage], path) ?? fallback;
}

function getInitialLanguage() {
  const params = new URLSearchParams(window.location.search);
  const requested = params.get("lang") || window.localStorage.getItem(STORAGE_LANGUAGE_KEY);
  return requested === "zh" ? "zh" : DEFAULT_LANGUAGE;
}

function captureTranslationDefaults() {
  qsa("[data-i18n]").forEach((element) => {
    if (!element.dataset.i18nDefault) element.dataset.i18nDefault = element.textContent;
  });
}

function applyStaticTranslations() {
  document.documentElement.lang = currentLanguage === "zh" ? "zh-CN" : "en";
  qsa("[data-i18n]").forEach((element) => {
    const fallback = element.dataset.i18nDefault || element.textContent;
    element.textContent = getTranslation(element.dataset.i18n, fallback);
  });
}

function updateLanguageSwitch() {
  qsa("[data-lang-option]").forEach((button) => {
    const isActive = button.dataset.langOption === currentLanguage;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function mergeTranslatedArray(base = [], translated = []) {
  return base.map((item, index) => ({ ...item, ...(translated[index] || {}) }));
}

function localizeSite(site = {}) {
  const localized = translations[currentLanguage] || {};
  const research = site.research || {};
  const translatedResearch = localized.research || {};

  return {
    ...site,
    profile: { ...(site.profile || {}), ...(localized.profile || {}) },
    hero: { ...(site.hero || {}), ...(localized.hero || {}) },
    about: { ...(site.about || {}), ...(localized.about || {}) },
    research: {
      ...research,
      ...translatedResearch,
      items: mergeTranslatedArray(research.items || [], translatedResearch.items || [])
    },
    contact: { ...(site.contact || {}), ...(localized.contact || {}) }
  };
}

function localizeArray(items = [], key) {
  const translated = translations[currentLanguage]?.[key] || [];
  return mergeTranslatedArray(items, translated);
}

function setActiveNav() {
  const page = document.body.dataset.page || "home";
  const activePage = document.body.dataset.navActive || page;
  qsa("[data-nav-page]").forEach((link) => {
    const isActive = link.dataset.navPage === activePage;
    link.classList.toggle("active", isActive);
    if (isActive) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function setPageTitle(profile = {}) {
  const page = document.body.dataset.page || "home";
  const translatedTitle = getTranslation(`meta.${PAGE_TITLE_KEYS[page]}`, "");
  if (translatedTitle) {
    document.title = translatedTitle;
    return;
  }

  const name = profile.name || "Wenlong Xue";
  document.title = EN_PAGE_TITLES[page] || `${PAGE_NAMES[page] || "Wenlong Xue"} | ${name}`;
}

async function loadJSON(path) {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${path}${separator}v=${DATA_VERSION}`);
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function loadDraftData() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("draft")) return null;
  const raw = window.localStorage.getItem("wenlongSiteDraft");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Draft data could not be parsed.", error);
    return null;
  }
}

function renderSite(site) {
  const profile = site.profile || {};
  const hero = site.hero || {};
  const about = site.about || {};
  const research = site.research || {};
  const contact = site.contact || {};

  setText("[data-profile-name]", profile.name);
  setText("[data-profile-role-full]", profile.roleFull || profile.role);
  setText("[data-profile-affiliation]", profile.affiliation);
  setText("[data-profile-location]", profile.location);
  setImage("[data-profile-photo]", profile.photoUrl, profile.photoAlt);

  setText("[data-hero-eyebrow]", hero.eyebrow);
  setText("[data-hero-title]", hero.title || profile.name);
  setText("[data-hero-subtitle]", hero.subtitle);

  qsa("[data-about-text]").forEach((target) => {
    const isHomeSummary = target.dataset.aboutText === "home";
    const paragraphs = isHomeSummary
      ? [hero.lead || about.paragraphs?.[0]].filter(Boolean)
      : (about.paragraphs?.length ? about.paragraphs : [hero.lead].filter(Boolean));
    target.innerHTML = paragraphs.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("");
  });

  setText("[data-research-heading]", research.heading);
  setText("[data-research-intro]", research.intro);
  renderResearch(research.items || []);

  setText("[data-contact-heading]", contact.heading);
  setText("[data-contact-text]", contact.text);
  setText("[data-contact-name]", profile.name);
  setText("[data-contact-role]", profile.roleFull || profile.role);
  setText("[data-contact-affiliation]", profile.affiliation);
  setText("[data-contact-location]", profile.location);
  setText("[data-footer-name]", profile.name);

  const email = qs("[data-contact-email]");
  if (email && profile.email) {
    email.textContent = profile.email;
    email.href = `mailto:${profile.email}`;
  }
  setLink("[data-scholar-link]", profile.scholarUrl);
  setLink("[data-orcid-link]", profile.orcidUrl);
  setLink("[data-ku-link]", profile.kuProfileUrl);
}

function renderResearch(items) {
  const target = qs("[data-research]");
  if (!target) return;
  target.innerHTML = items.map((item) => `
    <article class="research-item">
      <figure class="research-image">
        <img src="${escapeHTML(item.image || "assets/img/network.svg")}" alt="${escapeHTML(item.imageAlt || item.title || "")}" />
      </figure>
      <div class="research-copy">
        <h3>${escapeHTML(item.title)}</h3>
        <p>${escapeHTML(item.text)}</p>
        ${renderTags(item.tags || [])}
      </div>
    </article>
  `).join("");
}

function renderTags(tags) {
  if (!tags.length) return "";
  return `<div class="tag-row">${tags.map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("")}</div>`;
}

function renderPublications(items) {
  const target = qs("[data-publications]");
  renderSelectedPublications(items);
  if (!target) return;

  const groups = items.reduce((map, pub) => {
    const year = pub.year || "Other";
    if (!map.has(year)) map.set(year, []);
    map.get(year).push(pub);
    return map;
  }, new Map());

  target.innerHTML = Array.from(groups.entries()).map(([year, pubs]) => `
    <section class="publication-year">
      <h2>${escapeHTML(year)}</h2>
      <div class="publication-year-items">
        ${pubs.map(renderPublicationItem).join("")}
      </div>
    </section>
  `).join("");
}

function renderSelectedPublications(items) {
  const target = qs("[data-selected-publications]");
  if (!target) return;
  const selected = items.filter((pub) => pub.selected);
  target.innerHTML = selected.map(renderSelectedPublicationItem).join("");
}

function renderSelectedPublicationItem(pub) {
  const keywords = pub.keywords || pub.tags || [];
  return `
    <article class="selected-publication">
      <h3>${escapeHTML(pub.title)}</h3>
      <p class="publication-authors">${escapeHTML(pub.authors)}</p>
      <p class="publication-meta">${escapeHTML([pub.journal, pub.year].filter(Boolean).join(", "))}</p>
      <div class="selected-publication-footer">
        ${pub.url ? `<a class="publication-link" href="${escapeHTML(pub.url)}" target="_blank" rel="noopener">DOI</a>` : ""}
        ${keywords.length ? `<p class="keyword-line"><strong>Keywords:</strong> ${keywords.map(escapeHTML).join(", ")}</p>` : ""}
      </div>
    </article>
  `;
}

function formatCitation(pub) {
  const parts = [];
  if (pub.journal) parts.push(`<strong>${escapeHTML(pub.journal)}</strong>`);
  const details = [pub.volume, pub.issue ? `(${pub.issue})` : "", pub.pages].filter(Boolean).join(" ");
  if (details) parts.push(escapeHTML(details));
  if (pub.type && pub.type !== "Journal article") parts.push(escapeHTML(pub.type));
  return parts.join(", ");
}

function renderPublicationItem(pub) {
  const citation = formatCitation(pub);
  const doiLabel = getTranslation("labels.doi", "DOI");
  const linkLabel = getTranslation("labels.link", "Link");
  const scholarLabel = getTranslation("labels.scholar", "Scholar");
  return `
    <article class="publication-item">
      <div class="publication-body">
        <h3 class="publication-title">${escapeHTML(pub.title)}</h3>
        <p class="publication-authors">${escapeHTML(pub.authors)}</p>
        <p class="publication-meta">${citation}</p>
      </div>
      <div class="publication-actions">
        ${pub.url ? `<a class="publication-link" href="${escapeHTML(pub.url)}" target="_blank" rel="noopener">${pub.doi ? escapeHTML(doiLabel) : escapeHTML(linkLabel)}</a>` : ""}
        ${pub.scholarUrl ? `<a class="publication-link subtle" href="${escapeHTML(pub.scholarUrl)}" target="_blank" rel="noopener">${escapeHTML(scholarLabel)}</a>` : ""}
      </div>
    </article>
  `;
}

function renderNews(items) {
  const target = qs("[data-news]");
  if (!target) return;
  target.innerHTML = items.map((item) => `
    <article class="news-item">
      <div class="news-date">${escapeHTML(item.date)}</div>
      <h3>${escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.text)}</p>
    </article>
  `).join("");
}

function renderPeople(items) {
  const target = qs("[data-people]");
  if (!target) return;
  target.innerHTML = items.map((person) => `
    <article class="person-item">
      <figure class="person-photo">
        <img src="${escapeHTML(person.photo || "assets/img/member-placeholder.svg")}" alt="${escapeHTML(person.photoAlt || person.name || "")}" />
      </figure>
      <div class="person-copy">
        <div class="person-role">${escapeHTML(person.role)}</div>
        <h3>${escapeHTML(person.name)}</h3>
        <p>${escapeHTML(person.bio)}</p>
        ${renderPersonLinks(person.links || [])}
      </div>
    </article>
  `).join("");
}

function renderPersonLinks(links) {
  if (!links.length) return "";
  return `<div class="person-links">${links.map((link) => `
    <a href="${escapeHTML(link.url)}" target="_blank" rel="noopener">${escapeHTML(link.label)}</a>
  `).join("")}</div>`;
}

function setupNavigation() {
  const navToggle = qs("[data-nav-toggle]");
  const navLinks = qs("[data-nav-links]");
  if (!navToggle || !navLinks) return;

  navToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  qsa(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

function setupLanguageSwitch() {
  qsa("[data-lang-option]").forEach((button) => {
    button.addEventListener("click", () => {
      const nextLanguage = button.dataset.langOption === "zh" ? "zh" : DEFAULT_LANGUAGE;
      if (nextLanguage === currentLanguage) return;
      currentLanguage = nextLanguage;
      window.localStorage.setItem(STORAGE_LANGUAGE_KEY, currentLanguage);
      if (contentCache) renderAll(contentCache);
    });
  });
}

function renderAll(data) {
  const site = localizeSite(data.site || {});
  const news = localizeArray(data.news || [], "news");
  const people = localizeArray(data.people || [], "people");

  applyStaticTranslations();
  updateLanguageSwitch();
  setActiveNav();
  renderSite(site);
  renderPublications(data.publications || []);
  renderNews(news);
  renderPeople(people);
  setPageTitle(site.profile || {});
}

async function init() {
  currentLanguage = getInitialLanguage();
  captureTranslationDefaults();
  setText("[data-year]", new Date().getFullYear());
  setupNavigation();
  setupLanguageSwitch();

  try {
    const i18n = await loadJSON("content/i18n.json").catch(() => ({}));
    translations = i18n || {};
    const draft = loadDraftData();
    if (draft) {
      contentCache = {
        site: draft.site,
        publications: draft.publications,
        news: draft.news,
        people: draft.people
      };
    } else {
      const [site, publications, news, people] = await Promise.all([
        loadJSON("content/site.json"),
        loadJSON("content/publications.json"),
        loadJSON("content/news.json"),
        loadJSON("content/people.json")
      ]);
      contentCache = { site, publications, news, people };
    }

    renderAll(contentCache);
  } catch (error) {
    console.error(error);
    const publicationTarget = qs("[data-publications]");
    if (publicationTarget) {
      publicationTarget.innerHTML = '<p class="publication-meta">Content data could not be loaded. Please preview the site through a local web server.</p>';
    }
  }
}

init();
