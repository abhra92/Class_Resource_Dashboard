const state = {
  data: null,
  activeSection: null,
  query: "",
  expandedPaths: new Set()
};

const els = {
  updated: document.getElementById("last-updated"),
  search: document.getElementById("search-input"),
  clear: document.getElementById("clear-search"),
  stats: document.getElementById("stats-grid"),
  tabs: document.getElementById("section-tabs"),
  list: document.getElementById("resource-list"),
  count: document.getElementById("result-count"),
  themeToggle: document.getElementById("switch")
};

const THEME_STORAGE_KEY = "class-resource-theme";

function getNodeIcon(type) {
  if (type === "dir") {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M3 6.75A1.75 1.75 0 0 1 4.75 5h4.1c.46 0 .9.18 1.22.51l1.42 1.49h7.77A1.75 1.75 0 0 1 21 8.75v8.5A1.75 1.75 0 0 1 19.25 19h-14.5A1.75 1.75 0 0 1 3 17.25v-10.5Z" />
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7.75 3h5.69c.46 0 .9.18 1.22.51l3.83 3.83c.33.32.51.76.51 1.22v10.69A1.75 1.75 0 0 1 17.25 21h-9.5A1.75 1.75 0 0 1 6 19.25v-14.5A1.75 1.75 0 0 1 7.75 3Zm5.25 1.81V8h3.19L13 4.81Z" />
    </svg>
  `;
}

function getActionIcon(action) {
  if (action === "download") {
    return `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M12 3a.75.75 0 0 1 .75.75v8.69l2.72-2.72a.75.75 0 1 1 1.06 1.06l-4 4a.75.75 0 0 1-1.06 0l-4-4a.75.75 0 1 1 1.06-1.06l2.72 2.72V3.75A.75.75 0 0 1 12 3Zm-7 13.5A.75.75 0 0 1 5.75 15h12.5a.75.75 0 0 1 0 1.5H5.75A.75.75 0 0 1 5 16.5Zm1.75 2.5h10.5a.75.75 0 0 1 0 1.5H6.75a.75.75 0 0 1 0-1.5Z" />
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 5c4.6 0 8.27 3.04 9.55 6.22a1.8 1.8 0 0 1 0 1.56C20.27 15.96 16.6 19 12 19s-8.27-3.04-9.55-6.22a1.8 1.8 0 0 1 0-1.56C3.73 8.04 7.4 5 12 5Zm0 1.5c-3.87 0-7.08 2.5-8.16 5.5 1.08 3 4.29 5.5 8.16 5.5s7.08-2.5 8.16-5.5c-1.08-3-4.29-5.5-8.16-5.5Zm0 2.25A3.25 3.25 0 1 1 8.75 12 3.25 3.25 0 0 1 12 8.75Zm0 1.5A1.75 1.75 0 1 0 13.75 12 1.75 1.75 0 0 0 12 10.25Z" />
      </svg>
    `;
}

function normalize(text) {
  return String(text || "").toLowerCase().trim();
}

function readSections(data) {
  return Object.keys(data).filter((key) => key !== "metadata");
}

function flattenNodes(nodes, sectionName, store = []) {
  nodes.forEach((node) => {
    store.push({ ...node, sectionName });
    if (node.type === "dir" && Array.isArray(node.children)) {
      flattenNodes(node.children, sectionName, store);
    }
  });
  return store;
}

function formatSectionName(name) {
  return name.replace(/[-_]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function toPanelId(path, depth) {
  const safePath = encodeURIComponent(path).replace(/%/g, "_");
  return `children_${depth}_${safePath}`;
}

function applyTheme(theme) {
  const nextTheme = theme === "light" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", nextTheme);
  if (els.themeToggle) {
    els.themeToggle.setAttribute("aria-label", `Switch to ${nextTheme === "dark" ? "light" : "dark"} mode`);
    els.themeToggle.checked = nextTheme === "dark";
  }
  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch (error) {
    console.warn("Could not persist theme preference.", error);
  }
}

function getInitialTheme() {
  try {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }
  } catch (error) {
    console.warn("Could not read theme preference.", error);
  }

  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function buildStats(data) {
  const sections = readSections(data);
  const all = sections.flatMap((section) => flattenNodes(data[section], section));
  const files = all.filter((n) => n.type === "file").length;
  const folders = all.filter((n) => n.type === "dir").length;
  const cards = [
    { label: "Sections", value: sections.length },
    { label: "Files", value: files },
    { label: "Folders", value: folders },
    { label: "Total Items", value: all.length }
  ];

  els.stats.innerHTML = cards
    .map(
      (card) => `
        <article class="stat-card">
          <p class="stat-label">${card.label}</p>
          <p class="stat-value">${card.value}</p>
        </article>
      `
    )
    .join("");
}

function buildTabs(sections) {
  els.tabs.innerHTML = sections
    .map(
      (section) => `
        <button
          class="tab-btn"
          type="button"
          role="tab"
          data-section="${section}"
          aria-selected="${section === state.activeSection}"
        >
          ${formatSectionName(section)}
        </button>
      `
    )
    .join("");
}

function matchesQuery(node, query) {
  if (!query) return true;
  return (
    normalize(node.name).includes(query) ||
    normalize(node.path).includes(query) ||
    normalize(node.type).includes(query)
  );
}

function renderNodes(nodes, depth = 0, query = "") {
  const fragments = [];
  let visibleCount = 0;

  nodes.forEach((node) => {
    const isDir = node.type === "dir";
    const hasChildren = isDir && Array.isArray(node.children) && node.children.length > 0;
    const childResult = isDir && hasChildren ? renderNodes(node.children || [], depth + 1, query) : null;
    const selfMatch = matchesQuery(node, query);
    const childVisible = childResult ? childResult.visibleCount > 0 : false;
    const shouldRender = query ? selfMatch || childVisible : true;

    if (!shouldRender) {
      return;
    }

    visibleCount += 1 + (childResult ? childResult.visibleCount : 0);

    const icon = getNodeIcon(node.type);
    const isExpanded = query ? true : state.expandedPaths.has(node.path);
    const panelId = isDir ? toPanelId(node.path, depth) : "";
    const action = isDir
      ? `<button class="folder-toggle" type="button" data-path="${node.path}" data-target="${panelId}" aria-controls="${panelId}" aria-expanded="${isExpanded ? "true" : "false"}">${isExpanded ? "Close" : "Open"}</button>`
      : `
        <div class="node-actions">
          <a class="node-link icon-button" href="${encodeURI(node.url)}" target="_blank" rel="noopener" aria-label="View file">
            ${getActionIcon("view")}
          </a>
          <a class="node-link icon-button" href="${encodeURI(node.url)}" download aria-label="Download file">
            ${getActionIcon("download")}
          </a>
        </div>
      `;

    const children = isDir
      ? `<div id="${panelId}" class="children-wrap" ${isExpanded ? "" : "hidden"}>${
          hasChildren
            ? (childResult ? childResult.html : "")
            : `<p class="folder-empty" role="status">Coming soon. Resources for this folder will be added here.</p>`
        }</div>`
      : "";

    fragments.push(`
      <article class="resource-node" data-depth="${depth}" data-type="${node.type}">
        <div class="node-row">
          <div class="node-left">
            <span class="node-icon" aria-hidden="true">${icon}</span>
            <div>
              <p class="node-title">${node.name}</p>
              <p class="node-path">${node.path}</p>
            </div>
          </div>
          ${action}
        </div>
        ${children}
      </article>
    `);
  });

  return {
    html: fragments.join(""),
    visibleCount
  };
}

function renderList() {
  if (!state.data || !state.activeSection) return;

  const data = state.data[state.activeSection] || [];
  const query = normalize(state.query);
  const rendered = renderNodes(data, 0, query);

  if (!rendered.html) {
    els.list.innerHTML = `<p class="empty">No results found for this filter.</p>`;
    els.count.textContent = "0 items";
    return;
  }

  els.list.innerHTML = rendered.html;
  els.count.textContent = `${rendered.visibleCount} items`;
}

function attachEvents() {
  els.themeToggle?.addEventListener("change", () => {
    const currentTheme = document.documentElement.getAttribute("data-theme");
    applyTheme(currentTheme === "light" ? "dark" : "light");
  });

  els.search.addEventListener("input", (event) => {
    state.query = event.target.value;
    renderList();
  });

  els.clear.addEventListener("click", () => {
    state.query = "";
    els.search.value = "";
    renderList();
    els.search.focus();
  });

  els.tabs.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-section]");
    if (!button) return;
    state.activeSection = button.dataset.section;
    state.expandedPaths.clear();
    buildTabs(readSections(state.data));
    renderList();
  });

  els.list.addEventListener("click", (event) => {
    const toggle = event.target.closest(".folder-toggle");
    if (!toggle) return;

    const path = toggle.dataset.path;
    const targetId = toggle.dataset.target;
    const children = targetId ? document.getElementById(targetId) : null;
    if (!children) return;

    const isOpen = !children.hasAttribute("hidden");
    if (isOpen) {
      children.setAttribute("hidden", "");
      toggle.setAttribute("aria-expanded", "false");
      toggle.textContent = "Open";
      if (path) state.expandedPaths.delete(path);
    } else {
      children.removeAttribute("hidden");
      toggle.setAttribute("aria-expanded", "true");
      toggle.textContent = "Close";
      if (path) state.expandedPaths.add(path);
    }
  });
}

async function initialize() {
  try {
    applyTheme(getInitialTheme());

    const response = await fetch("files.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("Failed to load data source.");
    }

    const data = await response.json();
    state.data = data;

    const sections = readSections(data);
    state.activeSection = sections[0] || null;

    const updated = data.metadata?.lastUpdated || "Unknown";
    els.updated.textContent = `Last updated: ${updated}`;

    buildStats(data);
    buildTabs(sections);
    renderList();
    attachEvents();
  } catch (error) {
    els.list.innerHTML = `<p class="empty">Could not load files.json. Check that the file exists in the project root.</p>`;
    els.count.textContent = "0 items";
    console.error(error);
  }
}

initialize();
