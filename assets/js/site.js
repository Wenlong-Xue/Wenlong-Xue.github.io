const qs = (selector, root = document) => root.querySelector(selector);
const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector));

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

function setActiveNav() {
  const page = document.body.dataset.page || "home";
  qsa("[data-nav-page]").forEach((link) => {
    if (link.dataset.navPage === page) link.classList.add("active");
  });
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
  const contact = site.contact || {};

  document.title = `${profile.name || "Wenlong Xue"} | Hybrid Glass Frameworks`;

  setText("[data-profile-name]", profile.name);
  setText("[data-profile-role-full]", profile.roleFull || profile.role);
  setText("[data-profile-affiliation]", profile.affiliation);
  setText("[data-profile-location]", profile.location);

  setText("[data-hero-eyebrow]", hero.eyebrow);
  setText("[data-hero-title]", hero.title || profile.name);
  setText("[data-hero-subtitle]", hero.subtitle);

  const aboutTarget = qs("[data-about-text]");
  if (aboutTarget) {
    const paragraphs = about.paragraphs?.length ? about.paragraphs : [hero.lead].filter(Boolean);
    aboutTarget.innerHTML = paragraphs.map((paragraph) => `<p>${escapeHTML(paragraph)}</p>`).join("");
  }

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
      <div class="research-image" aria-hidden="true"></div>
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
  return `
    <article class="publication-item">
      <div class="publication-body">
        <h3>${escapeHTML(pub.title)}</h3>
        <p class="publication-authors">${escapeHTML(pub.authors)}</p>
        <p class="publication-meta">${citation}</p>
      </div>
      <div class="publication-actions">
        ${pub.url ? `<a class="publication-link" href="${escapeHTML(pub.url)}" target="_blank" rel="noopener">${pub.doi ? "DOI" : "Link"}</a>` : ""}
        ${pub.scholarUrl ? `<a class="publication-link subtle" href="${escapeHTML(pub.scholarUrl)}" target="_blank" rel="noopener">Scholar</a>` : ""}
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
    navToggle.setAttribute("aria-expanded", String(isOpen));
  });

  qsa(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });
}

async function init() {
  setText("[data-year]", new Date().getFullYear());
  setupNavigation();
  setActiveNav();

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
    renderPublications(publications || []);
    renderNews(news || []);
    renderPeople(people || []);
  } catch (error) {
    console.error(error);
    const publicationTarget = qs("[data-publications]");
    if (publicationTarget) {
      publicationTarget.innerHTML = '<p class="publication-meta">Content data could not be loaded. Please preview the site through a local web server.</p>';
    }
  }
}

init();
