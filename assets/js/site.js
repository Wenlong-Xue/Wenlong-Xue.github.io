const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

const state = {
  publications: [],
  filters: {
    year: "all",
    topic: "all"
  }
};

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

async function loadJSON(path) {
  const response = await fetch(path);
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
  const platforms = site.platforms || {};
  const contact = site.contact || {};

  document.title = `${profile.name || "Wenlong Xue"} | Hybrid Glass Frameworks`;

  setText("[data-profile-initials]", profile.initials);
  setText("[data-profile-name]", profile.name);
  setText("[data-profile-role]", profile.role);
  setText("[data-profile-role-full]", profile.roleFull || profile.role);
  setText("[data-profile-affiliation]", profile.affiliation);
  setText("[data-profile-location]", profile.location);

  setText("[data-hero-eyebrow]", hero.eyebrow);
  setText("[data-hero-title]", hero.title || profile.name);
  setText("[data-hero-subtitle]", hero.subtitle);
  setText("[data-hero-lead]", hero.lead);
  const primary = qs("[data-hero-primary]");
  const secondary = qs("[data-hero-secondary]");
  if (primary) {
    primary.textContent = hero.primaryText || "Explore research";
    primary.href = hero.primaryHref || "#research";
  }
  if (secondary) {
    secondary.textContent = hero.secondaryText || "Publications";
    secondary.href = hero.secondaryHref || "#publications";
  }

  renderMetrics(site.metrics || []);

  setText("[data-about-heading]", about.heading);
  const aboutTarget = qs("[data-about-text]");
  if (aboutTarget) {
    aboutTarget.innerHTML = (about.paragraphs || [])
      .map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`)
      .join("");
  }

  setText("[data-research-heading]", research.heading);
  setText("[data-research-intro]", research.intro);
  renderResearch(research.items || []);

  setText("[data-platform-heading]", platforms.heading);
  setText("[data-platform-intro]", platforms.intro);
  renderPlatforms(platforms.items || []);

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

function renderMetrics(items) {
  const target = qs("[data-metrics]");
  if (!target) return;
  target.innerHTML = items.map((item) => `
    <div class="metric">
      <strong>${escapeHTML(item.label)}</strong>
      <span>${escapeHTML(item.value)}</span>
    </div>
  `).join("");
}

function renderResearch(items) {
  const target = qs("[data-research]");
  if (!target) return;
  target.innerHTML = items.map((item, index) => `
    <article class="card">
      <span class="card-index">${String(index + 1).padStart(2, "0")}</span>
      <h3>${escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.text)}</p>
      ${renderTags(item.tags || [])}
    </article>
  `).join("");
}

function renderPlatforms(items) {
  const target = qs("[data-platforms]");
  if (!target) return;
  target.innerHTML = items.map((item) => `
    <article class="platform-card">
      <h3>${escapeHTML(item.title)}</h3>
      <p>${escapeHTML(item.text)}</p>
    </article>
  `).join("");
}

function renderTags(tags) {
  if (!tags.length) return "";
  return `<div class="tag-row">${tags.map((tag) => `<span class="tag">${escapeHTML(tag)}</span>`).join("")}</div>`;
}

function setupPublicationFilters(items) {
  const yearSelect = qs("[data-filter-year]");
  const topicSelect = qs("[data-filter-topic]");
  if (!yearSelect || !topicSelect) return;

  const years = Array.from(new Set(items.map((item) => item.year).filter(Boolean))).sort((a, b) => Number(b) - Number(a));
  const topics = Array.from(new Set(items.flatMap((item) => item.tags || []))).sort((a, b) => a.localeCompare(b));

  yearSelect.innerHTML = '<option value="all">All</option>' + years.map((year) => `<option value="${escapeHTML(year)}">${escapeHTML(year)}</option>`).join("");
  topicSelect.innerHTML = '<option value="all">All</option>' + topics.map((topic) => `<option value="${escapeHTML(topic)}">${escapeHTML(topic)}</option>`).join("");

  yearSelect.value = state.filters.year;
  topicSelect.value = state.filters.topic;

  yearSelect.addEventListener("change", () => {
    state.filters.year = yearSelect.value;
    renderPublications();
  });
  topicSelect.addEventListener("change", () => {
    state.filters.topic = topicSelect.value;
    renderPublications();
  });
}

function renderPublications() {
  const target = qs("[data-publications]");
  if (!target) return;

  const filtered = state.publications.filter((pub) => {
    const matchesYear = state.filters.year === "all" || pub.year === state.filters.year;
    const matchesTopic = state.filters.topic === "all" || (pub.tags || []).includes(state.filters.topic);
    return matchesYear && matchesTopic;
  });

  if (!filtered.length) {
    target.innerHTML = '<div class="pub-empty">No publications match the current filters.</div>';
    return;
  }

  target.innerHTML = filtered.map((pub) => `
    <article class="pub-item">
      <div>
        <h3>${escapeHTML(pub.title)}</h3>
        <div class="pub-meta">${escapeHTML(pub.authors)} &middot; <strong>${escapeHTML(pub.journal)}</strong> &middot; ${escapeHTML(pub.year)}</div>
        ${renderTags(pub.tags || [])}
      </div>
      <div class="pub-links">
        ${pub.url ? `<a class="pub-link" href="${escapeHTML(pub.url)}" target="_blank" rel="noopener">DOI</a>` : ""}
        ${pub.selected ? '<span class="pub-link">Selected</span>' : ""}
      </div>
    </article>
  `).join("");
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
    <article class="person-card">
      <div class="person-role">${escapeHTML(person.role)}</div>
      <h3>${escapeHTML(person.name)}</h3>
      <p>${escapeHTML(person.bio)}</p>
      ${renderPersonLinks(person.links || [])}
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
    document.body.classList.toggle("nav-open", isOpen);
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  qsa(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      document.body.classList.remove("nav-open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

async function init() {
  setText("[data-year]", new Date().getFullYear());
  setupNavigation();

  try {
    const draft = loadDraftData();
    const [site, publications, news, people] = draft
      ? [draft.site, draft.publications, draft.news, draft.people]
      : await Promise.all([
        loadJSON("content/site.json"),
        loadJSON("content/publications.json"),
        loadJSON("content/news.json"),
        loadJSON("content/people.json")
      ]);

    renderSite(site);
    state.publications = publications || [];
    setupPublicationFilters(state.publications);
    renderPublications();
    renderNews(news || []);
    renderPeople(people || []);
  } catch (error) {
    console.error(error);
    const publicationTarget = qs("[data-publications]");
    if (publicationTarget) {
      publicationTarget.innerHTML = '<div class="pub-empty">Content data could not be loaded. Please preview the site through a local web server.</div>';
    }
  }
}

init();
