const DB_NAME = "mealvault-db";
const STORE = "photos";
const DEFAULT_API_ENDPOINT = "https://food-foto-app.onrender.com";
const DEFAULT_CATEGORIES = ["Frühstück", "Mittagessen", "Abendessen", "Snacks", "Dessert", "Getränke", "Restaurant / Auswärts", "Sonstiges"];
const TAG_PRESETS = ["Low Carb", "Protein", "Süß", "Schnell", "Airfryer", "Italienisch", "Portugiesisch", "Vegetarisch"];
const CUSTOM_CATEGORIES_KEY = "foodporn-custom-categories";

// Alle Kategorien: Standard + eigene + alles was in Fotos vorkommt
function getCategories() {
  let custom = [];
  try { custom = JSON.parse(safeGet(CUSTOM_CATEGORIES_KEY) || "[]"); } catch {}
  const fromPhotos = state.photos.map((p) => p.category).filter(Boolean);
  const all = [...DEFAULT_CATEGORIES];
  [...custom, ...fromPhotos].forEach((c) => { if (!all.includes(c)) all.push(c); });
  return all;
}

function addCustomCategory(name) {
  const clean = (name || "").trim();
  if (!clean) return null;
  let custom = [];
  try { custom = JSON.parse(safeGet(CUSTOM_CATEGORIES_KEY) || "[]"); } catch {}
  if (!custom.includes(clean) && !DEFAULT_CATEGORIES.includes(clean)) {
    custom.push(clean);
    safeSet(CUSTOM_CATEGORIES_KEY, JSON.stringify(custom));
  }
  return clean;
}

const translations = {
  de: {
    appName: "Foodporn", tagline: "Food-Fotos organisiert", gallery: "Galerie", upload: "Upload", stats: "Statistiken",
    settings: "Einstellungen", quickFilters: "Schnellfilter", allPhotos: "Alle Fotos", favorites: "Favoriten",
    thisMonth: "Dieser Monat", untagged: "Ohne Tags", storage: "Speicherung",
    storageText: "Cloud-Speicherung in Google Cloud Storage, lokaler Cache in IndexedDB.", workspace: "Private Sammlung",
    galleryTitle: "Essensbilder", tutorial: "Tutorial", share: "Teilen", exportZip: "ZIP exportieren",
    search: "Suche", from: "Von", to: "Bis", category: "Kategorie", tag: "Tag", reset: "Zurücksetzen",
    emptyTitle: "Noch keine passenden Bilder", emptyText: "Lade Essensfotos hoch oder passe die Filter an.",
    uploadPhotos: "Fotos hochladen", dropTitle: "Bilder hier ablegen",
    dropText: "Oder anklicken und mehrere Food-Fotos auswählen. EXIF-Daten werden automatisch gelesen.",
    totalPhotos: "Fotos gesamt", favoritePhotos: "Favoriten", topCategory: "Top-Kategorie", topTag: "Top-Tag",
    categoryDistribution: "Kategorien", tagDistribution: "Beliebte Tags", authTitle: "Login & Datenschutz",
    authText: "Diese Version läuft lokal ohne Server. OAuth/Auth0 kann im Backend ergänzt werden.",
    demoUser: "Demo-Nutzer", cloudTitle: "Cloud-Speicher",
    cloudText: "Google Cloud Storage kann über ein Render-Backend angebunden werden.",
    cloudSync: "Cloud synchronisieren", cloudTest: "Cloud testen", choosePhotos: "Bilder auswählen",
    storageProvider: "Provider", apiEndpoint: "API-Endpunkt", backupTitle: "Backups",
    backupText: "Exportiere regelmäßig ZIP-Dateien als lokale Sicherung.", exportMetadata: "Metadaten exportieren",
    details: "Details", saveImage: "Bild speichern", resetEdit: "Reset", brightness: "Helligkeit", contrast: "Kontrast",
    saturation: "Sättigung", description: "Beschreibung", tagsComma: "Tags, mit Komma getrennt",
    takenAt: "Aufgenommen am", favorite: "Favorit", saveMetadata: "Metadaten speichern", delete: "Löschen",
    tutorialTitle: "Kurze Einführung", tutorial1: "Ziehe Food-Fotos in den Upload-Bereich.",
    tutorial2: "Prüfe EXIF-Datum, Kategorie und Tags in der Detailansicht.",
    tutorial3: "Nutze Suche, Datumsfilter und Tags, um alte Gerichte schnell zu finden.",
    tutorial4: "Exportiere ausgewählte Filterergebnisse als ZIP-Backup."
  },
  en: {
    appName: "Foodporn", tagline: "Food photos organized", gallery: "Gallery", upload: "Upload", stats: "Stats",
    settings: "Settings", quickFilters: "Quick filters", allPhotos: "All photos", favorites: "Favorites",
    thisMonth: "This month", untagged: "Untagged", storage: "Storage",
    storageText: "Stored in Google Cloud Storage, cached locally in IndexedDB.", workspace: "Private collection",
    galleryTitle: "Meal photos", tutorial: "Tutorial", share: "Share", exportZip: "Export ZIP",
    search: "Search", from: "From", to: "To", category: "Category", tag: "Tag", reset: "Reset",
    emptyTitle: "No matching photos yet", emptyText: "Upload meal photos or change the filters.",
    uploadPhotos: "Upload photos", dropTitle: "Drop images here",
    dropText: "Or click to choose multiple food photos. EXIF data is read automatically.",
    totalPhotos: "Total photos", favoritePhotos: "Favorites", topCategory: "Top category", topTag: "Top tag",
    categoryDistribution: "Categories", tagDistribution: "Popular tags", authTitle: "Login & privacy",
    authText: "This version runs locally without a server. OAuth/Auth0 can be added in the backend.",
    demoUser: "Demo user", cloudTitle: "Cloud storage",
    cloudText: "Google Cloud Storage can be connected through a Render backend.",
    cloudSync: "Sync cloud", cloudTest: "Test cloud", choosePhotos: "Choose photos",
    storageProvider: "Provider", apiEndpoint: "API endpoint", backupTitle: "Backups",
    backupText: "Export ZIP files regularly as local backups.", exportMetadata: "Export metadata",
    details: "Details", saveImage: "Save image", resetEdit: "Reset", brightness: "Brightness", contrast: "Contrast",
    saturation: "Saturation", description: "Description", tagsComma: "Tags, comma separated",
    takenAt: "Taken at", favorite: "Favorite", saveMetadata: "Save metadata", delete: "Delete",
    tutorialTitle: "Quick start", tutorial1: "Drag food photos into the upload area.",
    tutorial2: "Review EXIF date, category and tags in the detail view.",
    tutorial3: "Use search, date filters and tags to find older dishes quickly.",
    tutorial4: "Export filtered results as a ZIP backup."
  }
};

const state = {
  db: null,
  photos: [],
  filtered: [],
  activeView: "gallery",
  quick: "all",
  lang: safeGet("foodporn-lang") || safeGet("mealvault-lang") || "de",
  selectedId: null,
  detailIndex: 0,
  sortField: safeGet("foodporn-sort-field") || "date",
  sortDir: safeGet("foodporn-sort-dir") || "desc",
  galleryView: safeGet("foodporn-gallery-view") || "grid",
  galleryCols: parseInt(safeGet("foodporn-gallery-cols") || "3", 10),
  batchMode: false,
  selectedIds: new Set(),
  edit: { rotation: 0, filter: "none", cropSquare: false, flipH: false, flipV: false, brightness: 100, contrast: 100, saturation: 100 }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

// ── Polyfills für ältere iOS-Versionen ───────────────────────────
// crypto.randomUUID: erst ab iOS 15.4 — Fallback für ältere Geräte
function generateUUID() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback: RFC4122 v4 UUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function safeGet(key) {
  try { return localStorage.getItem(key) || ""; } catch { return ""; }
}

function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch {
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; max-age=31536000; path=/; SameSite=Lax`;
  }
}

document.addEventListener("DOMContentLoaded", init);
// ─── Deleted-Liste (lokal persistent) ────────────────────────────
const DELETED_KEY = "foodporn-deleted-ids";

function getDeletedSet() {
  try {
    const raw = localStorage.getItem(DELETED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch { return new Set(); }
}

function addToDeletedSet(photo) {
  try {
    const set = getDeletedSet();
    if (photo.id)          set.add(photo.id);
    if (photo.cloudObject) set.add(photo.cloudObject);
    const arr = Array.from(set);
    localStorage.setItem(DELETED_KEY, JSON.stringify(
      arr.length > 500 ? arr.slice(arr.length - 500) : arr
    ));
  } catch {}
}

function isDeleted(cp) {
  const set = getDeletedSet();
  return (cp.id && set.has(cp.id)) || (cp.cloudObject && set.has(cp.cloudObject));
}

// Cloud-Löschung: non-blocking aber mit Retry
function deleteFromCloud(photo) {
  // Sofort lokal merken — das ist das Wichtigste
  if (photo) addToDeletedSet(photo);
  // Cloud-Löschung im Hintergrund mit Retry
  setTimeout(() => _retryDeleteFromCloud(photo, 3), 100);
}

async function _retryDeleteFromCloud(photo, retriesLeft) {
  const endpoint = getApiEndpoint();
  if (!endpoint || !photo || retriesLeft <= 0) return;
  try {
    // Server aufwecken (kurzer Timeout)
    const ctrl = new AbortController();
    setTimeout(() => ctrl.abort(), 6000);
    await fetch(`${endpoint}/health`, { cache: "no-store", signal: ctrl.signal });
  } catch {
    // Server schläft noch — in 15s nochmal versuchen
    setTimeout(() => _retryDeleteFromCloud(photo, retriesLeft - 1), 15000);
    return;
  }
  // Server wach — jetzt löschen
  if (photo.cloudObject) {
    fetch(`${endpoint}/api/photos?objectName=${encodeURIComponent(photo.cloudObject)}`,
      { method: "DELETE" }).catch(() => {});
  }
  const ids = [photo.id, photo.cloudObject].filter(Boolean);
  for (const id of ids) {
    fetch(`${endpoint}/api/user-edits/${encodeURIComponent(id)}`,
      { method: "DELETE" }).catch(() => {});
  }
}

function removePhotoFromDb(id) {
  if (!state.db) { state.photos = state.photos.filter((p) => p.id !== id); return Promise.resolve(); }
  return new Promise((resolve, reject) => {
    const request = tx("readwrite").delete(id);
    request.onsuccess = () => resolve();
    request.onerror  = () => reject(request.error);
  });
}


async function init() {
  const _ep = safeGet("foodporn-api-endpoint") || safeGet("mealvault-api-endpoint");
  if (!_ep || _ep.includes("food-foto-app-api")) {
    safeSet("foodporn-api-endpoint", "https://food-foto-app.onrender.com");
    safeSet("mealvault-api-endpoint", "https://food-foto-app.onrender.com");
  }
  setupCategorySelects();
  bindEvents();
  restoreFilters();
  applyLanguage();
  try {
    state.db = await openDb();
    await migrateLegacyPhotos();
    state.photos = await getAllPhotos();
    setupCategorySelects();   // jetzt sind auch Kategorien aus vorhandenen Fotos bekannt
    restoreFilters();         // gespeicherten Kategorie-Filter erneut anwenden
    render();
    autoSyncFromCloud();
    // Thumbnails für alle Fotos generieren die noch keins haben
    generateMissingThumbnails();
  } catch (error) {
    showStartupError(error);
    state.photos = [];
    render();
  }
}

function showStartupError(error) {
  const main = document.querySelector(".main");
  if (!main) return;
  const box = document.createElement("div");
  box.className = "startup-error";
  box.textContent = `App konnte nicht gestartet werden: ${error.message}`;
  main.prepend(box);
}

function openDb() { return openNamedDb(DB_NAME); }

function openNamedDb(name) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function migrateLegacyPhotos() {
  const legacyNames = ["foodporn-db"];
  const existing = await getAllPhotos();
  const known = new Set(existing.map((p) => p.id));
  for (const name of legacyNames) {
    if (name === DB_NAME) continue;
    const legacyPhotos = await getPhotosFromDb(name);
    for (const photo of legacyPhotos) {
      if (known.has(photo.id)) continue;
      await savePhoto(photo);
      known.add(photo.id);
    }
  }
}

async function getPhotosFromDb(name) {
  let db;
  try {
    db = await openNamedDb(name);
    if (!db.objectStoreNames.contains(STORE)) return [];
    return await new Promise((resolve, reject) => {
      const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch { return []; } finally { if (db) db.close(); }
}

function tx(mode = "readonly") {
  if (!state.db) throw new Error("Lokale Datenbank ist nicht verfügbar");
  return state.db.transaction(STORE, mode).objectStore(STORE);
}

function getAllPhotos() {
  if (!state.db) return Promise.resolve(state.photos.slice());
  return new Promise((resolve, reject) => {
    const request = tx().getAll();
    // Keine Vorsortierung hier — Sortierung erfolgt in sortPhotos()
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

function savePhoto(photo) {
  if (!state.db) {
    const index = state.photos.findIndex((item) => item.id === photo.id);
    if (index >= 0) state.photos[index] = photo; else state.photos.unshift(photo);
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const request = tx("readwrite").put(photo);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function removePhoto(id) {
  const photo = state.photos.find((p) => p.id === id);
  if (photo) addToDeletedSet(photo);
  if (!state.db) { state.photos = state.photos.filter((p) => p.id !== id); return Promise.resolve(); }
  return new Promise((resolve, reject) => {
    const request = tx("readwrite").delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function setupCategorySelects() {
  const cats = getCategories();
  const opt = (c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`;
  const filterEl = $("#category-filter");
  const detailEl = $("#detail-category");
  const prevFilter = filterEl.value;
  const prevDetail = detailEl.value;
  filterEl.innerHTML = [`<option value="">Alle</option>`, ...cats.map(opt)].join("");
  detailEl.innerHTML = cats.map(opt).join("") + `<option value="__new__">+ Neue Kategorie…</option>`;
  if (prevFilter) filterEl.value = prevFilter;
  if (prevDetail && prevDetail !== "__new__") detailEl.value = prevDetail;
  setupBatchCategorySelect();
}

function bindEvents() {
  $$(".nav-tab").forEach((btn) => btn.addEventListener("click", () => switchView(btn.dataset.view)));
  $$(".quick-filter").forEach((btn) => btn.addEventListener("click", () => {
    state.quick = btn.dataset.quick;
    $$(".quick-filter").forEach((item) => item.classList.toggle("active", item === btn));
    persistFilters();
    switchView("gallery");
    render();
  }));
  ["search-input", "date-from", "date-to", "category-filter", "tag-filter"].forEach((id) => $(`#${id}`).addEventListener("input", () => { persistFilters(); render(); }));
  $("#clear-filters").addEventListener("click", clearFilters);
  $$("[data-go-upload]").forEach((btn) => btn.addEventListener("click", () => switchView("upload")));

  // ── Sortierung ───────────────────────────────────────────────────
  const sortFieldEl = $("#sort-field");
  const sortDirEl = $("#sort-dir");
  if (sortFieldEl) {
    sortFieldEl.value = state.sortField;
    sortFieldEl.addEventListener("change", () => {
      state.sortField = sortFieldEl.value;
      safeSet("foodporn-sort-field", state.sortField);
      render();
    });
  }
  if (sortDirEl) {
    updateSortDirButton();
    sortDirEl.addEventListener("click", () => {
      state.sortDir = state.sortDir === "desc" ? "asc" : "desc";
      safeSet("foodporn-sort-dir", state.sortDir);
      updateSortDirButton();
      render();
    });
  }

  // ── Galerie-Ansicht ──────────────────────────────────────────────
  $$(".view-mode-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.galleryView = btn.dataset.view;
      safeSet("foodporn-gallery-view", state.galleryView);
      $$(".view-mode-btn").forEach((b) => b.classList.toggle("active", b === btn));
      applyGalleryView();
    });
  });

  // ── Dichte-Slider ────────────────────────────────────────────────
  const colsSlider = $("#cols-slider");
  const colsValue = $("#cols-value");
  if (colsSlider) {
    colsSlider.value = state.galleryCols;
    if (colsValue) colsValue.textContent = state.galleryCols;
    colsSlider.addEventListener("input", () => {
      state.galleryCols = parseInt(colsSlider.value, 10);
      safeSet("foodporn-gallery-cols", state.galleryCols);
      if (colsValue) colsValue.textContent = state.galleryCols;
      applyGalleryView();
    });
  }

  const drop = $("#drop-zone");
  $("#file-input").addEventListener("change", (e) => handleFiles(e.target.files));
  ["dragenter", "dragover"].forEach((n) => drop.addEventListener(n, (e) => { e.preventDefault(); drop.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach((n) => drop.addEventListener(n, (e) => { e.preventDefault(); drop.classList.remove("dragging"); }));
  drop.addEventListener("drop", (e) => {
    e.preventDefault();
    drop.classList.remove("dragging");
    // Versuche zuerst items (unterstützt auch iCloud/externe Apps)
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const files = [];
      for (const item of e.dataTransfer.items) {
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length > 0) { handleFiles(files); return; }
    }
    // Fallback: files direkt
    handleFiles(e.dataTransfer.files);
  });

  $("#close-detail").addEventListener("click", closeDetail);
  $("#detail-prev").addEventListener("click", () => detailNavigate(-1));
  $("#detail-next").addEventListener("click", () => detailNavigate(+1));

  // ── Swipe auf dem Detail-Panel (iPhone) ─────────────────────────
  // Nur auf dem Canvas/Bild-Bereich swipeable, nicht auf Formfeldern
  const detailPanel = $("#detail-panel");
  let dtStartX = 0, dtStartY = 0, dtSwiping = false;

  detailPanel.addEventListener("touchstart", (e) => {
    // Nicht triggern wenn Touch auf Input/Select/Textarea
    const tag = e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return;
    dtStartX = e.touches[0].clientX;
    dtStartY = e.touches[0].clientY;
    dtSwiping = false;
  }, { passive: true });

  detailPanel.addEventListener("touchmove", (e) => {
    if (!dtStartX) return;
    const dx = e.touches[0].clientX - dtStartX;
    const dy = e.touches[0].clientY - dtStartY;
    // Nur wenn klar horizontal (dx > dy und mindestens 12px)
    if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      dtSwiping = true;
      e.preventDefault(); // Scroll verhindern während horizontalem Swipe
    }
  }, { passive: false });

  detailPanel.addEventListener("touchend", (e) => {
    if (!dtSwiping || !dtStartX) { dtStartX = 0; return; }
    const dx = e.changedTouches[0].clientX - dtStartX;
    const dy = e.changedTouches[0].clientY - dtStartY;
    dtStartX = 0; dtSwiping = false;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    // Swipe links → nächstes, Swipe rechts → vorheriges
    detailNavigate(dx < 0 ? +1 : -1);
  }, { passive: true });
  $("#detail-form").addEventListener("submit", saveDetails);

  // ── Eigene Kategorie anlegen ─────────────────────────────────────
  $("#detail-category").addEventListener("change", () => {
    const sel = $("#detail-category");
    if (sel.value !== "__new__") return;
    const name = prompt("Name der neuen Kategorie:");
    const clean = addCustomCategory(name);
    setupCategorySelects();
    const photo = getSelected();
    sel.value = clean || (photo && photo.category) || DEFAULT_CATEGORIES[0];
  });

  // ── Tag-Vorschläge (Chips) ───────────────────────────────────────
  const presetBox = $("#tag-presets");
  if (presetBox) {
    TAG_PRESETS.forEach((tag) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "tag-preset-chip";
      chip.textContent = tag;
      chip.addEventListener("click", () => {
        const input = $("#detail-tags");
        const tags = input.value.split(",").map((t) => t.trim()).filter(Boolean);
        const idx = tags.findIndex((t) => t.toLowerCase() === tag.toLowerCase());
        if (idx >= 0) tags.splice(idx, 1); else tags.push(tag);
        input.value = tags.join(", ");
        chip.classList.toggle("active", idx < 0);
      });
      presetBox.appendChild(chip);
    });
  }

  $("#favorite-toggle").addEventListener("click", toggleSelectedFavorite);
  $("#delete-photo").addEventListener("click", deleteSelected);
  $("#download-photo").addEventListener("click", () => {
    downloadPhoto(state.photos.find((p) => p.id === state.selectedId));
  });
  $("#rotate-left").addEventListener("click", () => editImage({ rotation: state.edit.rotation - 90 }));
  $("#rotate-right").addEventListener("click", () => editImage({ rotation: state.edit.rotation + 90 }));
  $("#crop-square").addEventListener("click", () => editImage({ cropSquare: !state.edit.cropSquare }));
  $("#flip-horizontal").addEventListener("click", () => editImage({ flipH: !state.edit.flipH }));
  $("#flip-vertical").addEventListener("click", () => editImage({ flipV: !state.edit.flipV }));
  $("#filter-warm").addEventListener("click", () => editImage({ filter: state.edit.filter === "warm" ? "none" : "warm" }));
  $("#filter-mono").addEventListener("click", () => editImage({ filter: state.edit.filter === "mono" ? "none" : "mono" }));
  $("#reset-edit").addEventListener("click", resetEdit);
  $("#save-edit").addEventListener("click", saveEditedImage);
  $("#brightness-range").addEventListener("input", (e) => editImage({ brightness: Number(e.target.value) }));
  $("#contrast-range").addEventListener("input", (e) => editImage({ contrast: Number(e.target.value) }));
  $("#saturation-range").addEventListener("input", (e) => editImage({ saturation: Number(e.target.value) }));

  $("#export-button").addEventListener("click", exportZip);
  $("#metadata-export").addEventListener("click", exportMetadata);
  $("#share-button").addEventListener("click", shareApp);
  $("#tutorial-button").addEventListener("click", () => $("#tutorial-modal").classList.remove("hidden"));
  $("#close-tutorial").addEventListener("click", () => $("#tutorial-modal").classList.add("hidden"));
  $("#language-toggle").addEventListener("click", () => {
    state.lang = state.lang === "de" ? "en" : "de";
    safeSet("foodporn-lang", state.lang);
    applyLanguage();
  });
  $("#cloud-provider").value = safeGet("foodporn-cloud-provider") || safeGet("mealvault-cloud-provider") || "Google Cloud Storage";
  $("#api-endpoint").value = getApiEndpoint();
  persistApiEndpoint($("#api-endpoint").value);
  $("#cloud-provider").addEventListener("change", () => safeSet("foodporn-cloud-provider", $("#cloud-provider").value));
  $("#api-endpoint").addEventListener("input", () => { persistApiEndpoint($("#api-endpoint").value); updateCloudStatus(); });
  $("#api-endpoint").addEventListener("blur", () => {
    $("#api-endpoint").value = getApiEndpoint();
    persistApiEndpoint($("#api-endpoint").value);
    updateCloudStatus();
  });
  $("#cloud-test").addEventListener("click", testCloudConnection);
  $("#cloud-sync").addEventListener("click", () => syncWithFeedback());
  $("#sync-button").addEventListener("click", () => syncWithFeedback());
  $("#refresh-button").addEventListener("click", async () => {
    state.photos = await getAllPhotos();
    render();
  });
  updateCloudStatus();

}

function updateSortDirButton() {
  const btn = $("#sort-dir");
  if (!btn) return;
  btn.textContent = state.sortDir === "desc" ? "↓ Neu→Alt" : "↑ Alt→Neu";
  const fieldLabels = { date: "Datum", year: "Jahr", uploaded: "Upload", name: "Name", category: "Kategorie", favorites: "Favoriten", edited: "Bearbeitet" };
  const label = fieldLabels[state.sortField] || state.sortField;
  btn.title = `Sortierung: ${label} ${state.sortDir === "desc" ? "absteigend" : "aufsteigend"} — klicken zum Umkehren`;
}

// ─── Sortierung ───────────────────────────────────────────────────────────────

function getSortValue(photo, field) {
  switch (field) {
    case "date": {
      const raw = photo.takenAt || photo.exifDate || photo.createdAt || null;
      if (!raw) return 0;
      const ts = typeof raw === "number" ? raw : new Date(raw).getTime();
      return isNaN(ts) ? 0 : ts;
    }
    case "year": {
      const raw = photo.takenAt || photo.exifDate || photo.createdAt || null;
      if (!raw) return 0;
      const d = new Date(raw);
      return isNaN(d.getTime()) ? 0 : d.getFullYear() * 100 + d.getMonth();
    }
    case "uploaded": {
      const raw = photo.createdAt || photo.takenAt || null;
      if (!raw) return 0;
      const ts = new Date(raw).getTime();
      return isNaN(ts) ? 0 : ts;
    }
    case "name":
      return (photo.title || photo.name || "").toLowerCase();
    case "category":
      return (photo.category || "").toLowerCase();
    case "favorites": {
      // Favoriten zuerst, innerhalb der Gruppe nach Datum
      const raw = photo.takenAt || photo.createdAt || null;
      const ts = raw ? new Date(raw).getTime() : 0;
      return (photo.favorite ? 1e15 : 0) + (isNaN(ts) ? 0 : ts);
    }
    case "edited": {
      const raw = photo.editedAt || photo.updatedAt || photo.createdAt || null;
      if (!raw) return 0;
      const ts = new Date(raw).getTime();
      return isNaN(ts) ? 0 : ts;
    }
    default:
      return 0;
  }
}

function sortPhotos(photos) {
  const { sortField, sortDir } = state;
  const desc = sortDir === "desc";
  return [...photos].sort((a, b) => {
    const va = getSortValue(a, sortField);
    const vb = getSortValue(b, sortField);
    if (typeof va === "string") return desc ? vb.localeCompare(va, state.lang) : va.localeCompare(vb, state.lang);
    return desc ? vb - va : va - vb;
  });
}

// ─── Galerie-Ansicht ──────────────────────────────────────────────────────────

function applyGalleryView() {
  const grid = $("#gallery-grid");
  if (!grid) return;

  // Alle alten View- und Cols-Klassen entfernen
  Array.from(grid.classList).forEach((c) => {
    if (c.startsWith("view-") || c.startsWith("cols-")) grid.classList.remove(c);
  });

  grid.classList.add("view-" + state.galleryView);
  grid.classList.add("cols-" + state.galleryCols);

  // Aktiven View-Button markieren
  $$(".view-mode-btn").forEach((b) => b.classList.toggle("active", b.dataset.view === state.galleryView));

  // Sichtbarkeit je nach Modus steuern
  const isPure    = state.galleryView === "pure";
  const isCompact = state.galleryView === "compact";
  const isList    = state.galleryView === "list";

  $$(".photo-info").forEach((el) => {
    el.style.display = isPure ? "none" : "";
  });
  $$(".tag-row").forEach((el) => {
    el.style.display = (isPure || isCompact) ? "none" : "";
  });
  $$(".card-actions").forEach((el) => {
    el.style.display = (isPure || isCompact) ? "none" : isList ? "flex" : "";
  });
}

function applyLanguage() {
  $$("[data-i18n]").forEach((node) => { node.textContent = translations[state.lang][node.dataset.i18n] || node.textContent; });
  $("#language-toggle").textContent = state.lang.toUpperCase();
}

function switchView(view) {
  state.activeView = view;
  $$(".nav-tab").forEach((btn) => btn.classList.toggle("active", btn.dataset.view === view));
  $$(".view").forEach((sec) => sec.classList.toggle("active", sec.id === `${view}-view`));
  const titleMap = { gallery: "galleryTitle", upload: "upload", stats: "stats", settings: "settings" };
  $("#view-title").textContent = translations[state.lang][titleMap[view]];
  if (view === "stats") renderStats();
}

function clearFilters() {
  $("#search-input").value = "";
  $("#date-from").value = "";
  $("#date-to").value = "";
  $("#category-filter").value = "";
  $("#tag-filter").value = "";
  state.quick = "all";
  $$(".quick-filter").forEach((item) => item.classList.toggle("active", item.dataset.quick === "all"));
  persistFilters();
  render();
}

// ── Filter-Persistenz ────────────────────────────────────────────
function persistFilters() {
  try {
    const f = {
      q:     $("#search-input").value,
      from:  $("#date-from").value,
      to:    $("#date-to").value,
      cat:   $("#category-filter").value,
      tag:   $("#tag-filter").value,
      quick: state.quick,
    };
    localStorage.setItem("foodporn-filters", JSON.stringify(f));
  } catch {}
}

function restoreFilters() {
  try {
    const raw = localStorage.getItem("foodporn-filters");
    if (!raw) return;
    const f = JSON.parse(raw);
    if (f.q)    $("#search-input").value = f.q;
    if (f.from) $("#date-from").value    = f.from;
    if (f.to)   $("#date-to").value      = f.to;
    if (f.cat)  $("#category-filter").value = f.cat;
    if (f.tag)  $("#tag-filter").value   = f.tag;
    if (f.quick) {
      state.quick = f.quick;
      $$(".quick-filter").forEach((b) => b.classList.toggle("active", b.dataset.quick === f.quick));
    }
  } catch {}
}

// ─── Cloud Utilities ──────────────────────────────────────────────

function getApiEndpoint() {
  return ($("#api-endpoint").value || safeGet("foodporn-api-endpoint") || safeGet("mealvault-api-endpoint") || DEFAULT_API_ENDPOINT).trim().replace(/\/$/, "");
}

function persistApiEndpoint(value) {
  const endpoint = (value || DEFAULT_API_ENDPOINT).trim().replace(/\/$/, "");
  safeSet("foodporn-api-endpoint", endpoint);
  safeSet("mealvault-api-endpoint", endpoint);
  return endpoint;
}

function setCloudStatus(text, color = "") {
  const el = $("#cloud-status");
  if (!el) return;
  el.textContent = text;
  el.style.color = color;
}

function updateCloudStatus() {
  const endpoint = getApiEndpoint();
  if (endpoint) {
    setCloudStatus(`Cloud aktiv: ${endpoint}`, "#27ae60");
  } else {
    setCloudStatus("Cloud-Upload ist aktiv, sobald ein API-Endpunkt eingetragen ist.", "");
  }
}

async function ensureServerAwake(endpoint) {
  const maxWait = 55000;
  const interval = 3000;
  const start = Date.now();
  setCloudStatus("⏳ Render-Server wird gestartet (kann bis zu 60s dauern)...", "#e67e22");
  while (Date.now() - start < maxWait) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), interval);
      const res = await fetch(`${endpoint}/health`, { cache: "no-store", signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) { setCloudStatus("✓ Server bereit.", "#27ae60"); return true; }
    } catch { /* noch nicht bereit */ }
    await new Promise((r) => setTimeout(r, interval));
  }
  return false;
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${body || res.statusText}`);
    }
    return res;
  } catch (error) { clearTimeout(timer); throw error; }
}

async function testCloudConnection() {
  const endpoint = getApiEndpoint();
  if (!endpoint) { setCloudStatus("Bitte zuerst den API-Endpunkt eintragen.", "#c0392b"); return; }
  setCloudStatus("⏳ Verbinde mit Render...", "#e67e22");
  const awake = await ensureServerAwake(endpoint);
  if (!awake) { setCloudStatus("✗ Server antwortet nicht nach 60s. Bitte Render-Dashboard prüfen.", "#c0392b"); return; }
  try {
    const res = await fetchWithTimeout(`${endpoint}/api/photos`, { cache: "no-store" });
    const data = await res.json();
    setCloudStatus(`✓ Cloud erreichbar. ${(data.photos || []).length} Bilder in der Cloud.`, "#27ae60");
  } catch (error) {
    setCloudStatus(`✗ Cloud-Test fehlgeschlagen: ${error.message}`, "#c0392b");
  }
}

// Metadaten (Titel, Kategorie, Tags, Favorit ...) in der Cloud persistieren.
// Fire-and-forget mit Konsolen-Warnung bei Fehler.
function syncMetadataToCloud(photo) {
  const endpoint = getApiEndpoint();
  if (!endpoint || !photo || !photo.id) return Promise.resolve();
  return fetchWithTimeout(`${endpoint}/api/user-edits`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: photo.id, edits: cloudSafeMetadata(photo) })
  }, 15000).catch((e) => console.warn("[Metadaten-Sync]", e.message));
}

// ─── Globales Toast (Bestätigungen / Fehlermeldungen) ─────────────
function showToast(msg, isError = false) {
  let toast = $("#app-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "app-toast";
    toast.className = "app-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.toggle("error", isError);
  toast.classList.add("visible");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("visible"), 2600);
}

async function autoSyncFromCloud() {
  const endpoint = getApiEndpoint();
  if (!endpoint) return;
  try { await syncFromCloud({ silent: true }); } catch { /* ignorieren beim Start */ }
}

// Sync mit automatischem Retry — Render schläft oft beim ersten Versuch ein
async function syncWithFeedback() {
  const btn1 = $("#sync-button");
  const btn2 = $("#cloud-sync");
  if (btn1) btn1.disabled = true;
  if (btn2) btn2.disabled = true;
  try {
    await syncFromCloud();
  } catch {
    // erster Versuch fehlgeschlagen — 12s warten und nochmal
    setCloudStatus("⏳ Erster Versuch fehlgeschlagen, versuche erneut...", "#e67e22");
    await new Promise((r) => setTimeout(r, 12000));
    try {
      await syncFromCloud();
    } catch (error) {
      setCloudStatus(`✗ Sync fehlgeschlagen: ${error.message}`, "#c0392b");
    }
  } finally {
    if (btn1) btn1.disabled = false;
    if (btn2) btn2.disabled = false;
  }
}

async function syncFromCloud(options = {}) {
  const endpoint = getApiEndpoint();
  if (!endpoint) { if (!options.silent) alert("Bitte zuerst den API-Endpunkt eintragen."); return; }
  const awake = await ensureServerAwake(endpoint);
  if (!awake) {
    if (!options.silent) setCloudStatus("✗ Server antwortet nicht. Bitte später erneut versuchen.", "#c0392b");
    return;
  }
  setCloudStatus("☁ Lade Fotos aus der Cloud...", "#e67e22");
  let cloudPhotos;
  try {
    const res = await fetchWithTimeout(`${endpoint}/api/photos`, { cache: "no-store" }, 30000);
    cloudPhotos = await res.json();
  } catch (error) {
    setCloudStatus(`✗ Sync fehlgeschlagen: ${error.message}`, "#c0392b");
    return;
  }
  // User-Edits laden (Gerichtsnamen, Beschreibungen etc.)
  let userEdits = {};
  try {
    const editsRes = await fetchWithTimeout(`${endpoint}/api/user-edits`, { cache: "no-store" }, 10000);
    userEdits = await editsRes.json();
  } catch (e) {
    console.warn("[user-edits]", e.message);
  }

  // ── Deleted-Listen zusammenführen ──────────────────────────────
  // Cloud → lokal mergen
  const cloudDeleted = Array.isArray(userEdits.__deleted__) ? userEdits.__deleted__ : [];
  const localDeletedArr = Array.from(getDeletedSet());

  // Alle IDs in lokale Liste eintragen
  if (cloudDeleted.length) {
    try {
      const localSet = getDeletedSet();
      cloudDeleted.forEach((id) => localSet.add(id));
      const arr = Array.from(localSet);
      localStorage.setItem(DELETED_KEY, JSON.stringify(arr.length > 500 ? arr.slice(-500) : arr));
    } catch {}
  }

  // Lokal → Cloud hochladen: alle IDs nachtragen, die der Cloud fehlen
  // z.B. wenn Laptop gelöscht hat aber Render schlief
  const cloudDeletedSet = new Set(cloudDeleted);
  for (const id of localDeletedArr) {
    if (!cloudDeletedSet.has(id)) {
      fetch(`${endpoint}/api/user-edits/${encodeURIComponent(id)}`,
        { method: "DELETE" }).catch(() => {});
    }
  }

  // Lokal vorhandene gelöschte Fotos aus IndexedDB entfernen
  const allLocal = await getAllPhotos();
  for (const p of allLocal) {
    if (isDeleted(p)) {
      await removePhotoFromDb(p.id);
      if (p.cloudObject) {
        fetch(`${endpoint}/api/photos?objectName=${encodeURIComponent(p.cloudObject)}`,
          { method: "DELETE" }).catch(() => {});
      }
    }
  }

  let imported = 0;
  for (const cp of cloudPhotos.photos || []) {
    if (isDeleted(cp)) continue;
    // User-Edits mit Cloud-Metadaten mergen
    const edits = userEdits[cp.id] || {};
    Object.assign(cp, edits);
    const existing = state.photos.find((p) => p.cloudObject === cp.cloudObject || p.id === cp.id);
    const merged = {
      id: cp.id || generateUUID(),
      name: cp.name || getCloudObjectFileName(cp.cloudObject) || "cloud-photo.jpg",
      type: cp.type || "image/jpeg",
      dataUrl: cp.cloudUrl,
      takenAt: cp.takenAt || cp.createdAt || new Date().toISOString(),
      camera: cp.camera || "Unbekannt",
      category: cp.category || "Sonstiges",
      tags: Array.isArray(cp.tags) ? cp.tags : parseTags(cp.tags),
      title: cp.title || "",
      description: cp.description || "",
      favorite: cp.favorite === true || cp.favorite === "true",
      createdAt: cp.createdAt || new Date().toISOString(),
      storage: "gcs",
      cloudObject: cp.cloudObject,
      cloudUrl: cp.cloudUrl,
      editedAt: cp.editedAt || cp.updatedAt || cp.createdAt
    };
    // Foto überspringen wenn keine gültige URL vorhanden
    if (!merged.dataUrl || merged.dataUrl.length < 10) continue;
    if (existing) {
      // Lokale Bearbeitung ist neuer als der Cloud-Stand → lokal behalten,
      // sonst würde eine noch nicht hochgeladene Bearbeitung überschrieben
      const localTime = new Date(existing.editedAt || 0).getTime();
      const cloudTime = new Date(merged.editedAt || 0).getTime();
      if (existing.dataUrl && existing.dataUrl.startsWith("data:") && localTime > cloudTime) {
        // Nur Metadaten-Felder übernehmen, Bild lokal lassen
        const { dataUrl, editedAt, ...metaOnly } = merged;
        Object.assign(existing, metaOnly);
      } else {
        // Bild hat sich in der Cloud geändert → altes Thumbnail verwerfen
        // (nur über editedAt vergleichen — signierte URLs ändern sich bei jedem Sync)
        if (existing.editedAt !== merged.editedAt) delete existing.thumbUrl;
        Object.assign(existing, merged);
      }
      await savePhoto(existing);
    }
    else { await savePhoto(merged); state.photos.push(merged); imported++; }
  }
  // ── Fotos bereinigen ────────────────────────────────────────────
  const cloudObjectSet = new Set(
    (cloudPhotos.photos || []).map((cp) => cp.cloudObject).filter(Boolean)
  );
  const cloudIdSet = new Set(
    (cloudPhotos.photos || []).map((cp) => cp.id).filter(Boolean)
  );
  const currentLocal = await getAllPhotos();
  for (const p of currentLocal) {
    // 1. Cloud-Foto das nicht mehr in GCS ist → löschen
    if (p.storage === "gcs" || p.storage === "cloud") {
      const stillInCloud = (p.cloudObject && cloudObjectSet.has(p.cloudObject))
                        || (p.id && cloudIdSet.has(p.id));
      if (!stillInCloud) {
        addToDeletedSet(p);
        await removePhotoFromDb(p.id);
        continue;
      }
    }
    // 2. Foto ohne gültige URL → löschen (kaputte Einträge)
    if (!p.dataUrl || p.dataUrl.length < 10) {
      await removePhotoFromDb(p.id);
    }
  }

  state.photos = await getAllPhotos();
  setupCategorySelects();
  render();
  if (!options.silent) switchView("gallery");
  setCloudStatus(`✓ Sync abgeschlossen. ${imported} neue Bilder. Insgesamt: ${state.photos.length}.`, "#27ae60");
  generateMissingThumbnails();
}

// ─── Upload ───────────────────────────────────────────────────────

async function wakeUpRender(endpoint) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 5000);
    await fetch(`${endpoint}/health`, { method: "GET", cache: "no-store", signal: ctrl.signal });
    clearTimeout(t);
  } catch { /* ignorieren */ }
}

function setUploadItemStatus(item, text, isError = false) {
  const strong = item.querySelector("strong");
  if (!strong) return;
  strong.textContent = text;
  strong.style.color = isError ? "#c0392b" : "";
}

// Schneller Hash für Duplikat-Erkennung (erste 64KB + Dateigröße)
async function fileHash(buffer) {
  try {
    // crypto.subtle braucht HTTPS — Fallback auf einfachen Checksum
    if (typeof crypto !== "undefined" && crypto.subtle) {
      const slice = buffer.slice(0, 65536);
      const hashBuf = await crypto.subtle.digest("SHA-256", slice);
      const arr = Array.from(new Uint8Array(hashBuf));
      return arr.map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16)
        + "_" + buffer.byteLength;
    }
  } catch {}
  // Fallback: einfacher Checksum aus ersten Bytes + Größe
  const view = new Uint8Array(buffer, 0, Math.min(256, buffer.byteLength));
  let sum = 0;
  for (let i = 0; i < view.length; i++) sum = (sum * 31 + view[i]) >>> 0;
  return sum.toString(16) + "_" + buffer.byteLength;
}

async function handleFiles(fileList) {
  const files = Array.from(fileList).filter(isSupportedImageFile);
  const uploadList = $("#upload-list");
  if (!files.length) {
    const item = document.createElement("div");
    item.className = "upload-item";
    item.innerHTML = `<span>Keine unterstützten Bilder</span><strong>Hinweis</strong>`;
    uploadList.prepend(item);
    return;
  }
  const endpoint = getApiEndpoint();
  if (endpoint) wakeUpRender(endpoint);

  // Fortschrittsanzeige initialisieren
  const progressBox  = $("#upload-progress");
  const progressText = $("#upload-progress-text");
  const progressPct  = $("#upload-progress-pct");
  const progressFill = $("#upload-progress-fill");
  let done = 0;
  const updateProgress = () => {
    if (!progressBox) return;
    const pct = Math.round((done / files.length) * 100);
    progressBox.classList.remove("hidden");
    if (progressText) progressText.textContent = `${done} / ${files.length} Fotos`;
    if (progressPct)  progressPct.textContent  = `${pct}%`;
    if (progressFill) progressFill.style.width = `${pct}%`;
  };
  updateProgress();

  for (const file of files) {
    try {
    const item = document.createElement("div");
    item.className = "upload-item";
    item.innerHTML = `<span>${escapeHtml(file.name)}</span><strong>Lese Datei...</strong>`;
    uploadList.prepend(item);

    // Schritt 1: Datei lesen
    let dataUrl, buffer;
    try {
      setUploadItemStatus(item, "Lese Datei...");
      [dataUrl, buffer] = await Promise.all([
        createLocalPreview(file),
        readAsArrayBuffer(file)
      ]);
      setUploadItemStatus(item, "Datei gelesen ✓");
    } catch (error) {
      setUploadItemStatus(item, `Lesefehler: ${error.message}`, true);
      continue;
    }

    // Schritt 2: EXIF + Metadaten
    setUploadItemStatus(item, "Verarbeite EXIF...");
    let exif = {};
    try { exif = parseExif(buffer); } catch {}
    const created = exif.takenAt || new Date(file.lastModified || Date.now()).toISOString();

    // Schritt 3: Duplikat-Check
    let hash = null;
    try {
      hash = await fileHash(buffer);
      const duplicate = state.photos.find((p) => p.fileHash === hash);
      if (duplicate) {
        setUploadItemStatus(item, `⚠ Duplikat: "${duplicate.title || duplicate.name}"`, true);
        continue;
      }
    } catch {}

    const photo = {
      id: generateUUID(), name: file.name, type: normalizeImageType(file.type),
      dataUrl, takenAt: created,
      camera: [exif.make, exif.model].filter(Boolean).join(" ") || "Unbekannt",
      category: suggestCategory(created), tags: suggestTags(file.name),
      description: "", favorite: false, createdAt: new Date().toISOString(), storage: "local",
      fileHash: hash
    };

    // Schritt 4: Lokal speichern
    setUploadItemStatus(item, "Speichere lokal...");
    await savePhotoBestEffort(photo, item);

    // Schritt 4b: Thumbnail asynchron erstellen (non-blocking)
    createThumbnail(photo.dataUrl, photo.type).then(async (thumb) => {
      if (thumb) {
        photo.thumbUrl = thumb;
        await savePhoto(photo).catch(() => {});
      }
    });

    // Schritt 5: Cloud-Upload (optional)
    if (endpoint && photo.storage === "local") {
      setUploadItemStatus(item, "Cloud-Upload...");
      try {
        const cloud = await uploadPhotoToCloud(file, photo);
        if (cloud) {
          photo.storage = "gcs";
          photo.cloudObject = cloud.objectName;
          photo.cloudUrl = cloud.url;
          delete photo.cloudError;
          await savePhotoBestEffort(photo, item);
        }
      } catch (error) {
        setUploadItemStatus(item, "Cloud fehlgeschlagen — lokal gespeichert", true);
        console.error("[Cloud-Upload]", file.name, error);
      }
    }
    } finally {
      done++;
      updateProgress();
    }
  }
  // Fortschrittsbalken nach kurzer Zeit ausblenden
  if (progressBox) setTimeout(() => progressBox.classList.add("hidden"), 2500);
  setupCategorySelects();
  render();
  switchView("gallery");
  showToast(`✓ ${files.length} Foto${files.length === 1 ? "" : "s"} hochgeladen`);
}


async function savePhotoBestEffort(photo, item) {
  try {
    await savePhoto(photo);
    upsertPhotoInMemory(photo);
    if (!item.querySelector("strong").style.color) {
      setUploadItemStatus(item, photo.storage === "gcs" ? "☁ Cloud + lokal" : "Lokal gespeichert");
    } else if (photo.storage === "gcs") {
      setUploadItemStatus(item, "☁ Cloud + lokal");
    }
    return;
  } catch (error) { photo.localSaveWarning = error.message; }
  try {
    photo.dataUrl = await resizeDataUrl(photo.dataUrl, 900, photo.type || "image/jpeg", 0.7);
    await savePhoto(photo);
    upsertPhotoInMemory(photo);
    setUploadItemStatus(item, photo.storage === "gcs" ? "☁ Cloud + lokal (komprimiert)" : "Lokal komprimiert");
    return;
  } catch (error) {
    photo.localSaveWarning = error.message;
    upsertPhotoInMemory(photo);
    setUploadItemStatus(item, photo.storage === "gcs" ? "☁ Nur Cloud" : "⚠ Nur temporär", photo.storage !== "gcs");
    if (photo.storage !== "gcs") item.title = `Lokales Speichern fehlgeschlagen: ${error.message}`;
  }
}

function upsertPhotoInMemory(photo) {
  const index = state.photos.findIndex((item) => item.id === photo.id);
  if (index >= 0) state.photos[index] = photo; else state.photos.unshift(photo);
}

async function uploadPhotoToCloud(file, photo) {
  const endpoint = getApiEndpoint();
  if (!endpoint) return null;
  const form = new FormData();
  form.append("image", file, file.name);
  form.append("metadata", JSON.stringify(cloudSafeMetadata(photo)));
  const res = await fetchWithTimeout(`${endpoint}/api/photos/upload`, { method: "POST", body: form }, 45000);
  return res.json();
}

async function uploadEditedImageToCloud(blob, photo) {
  const endpoint = getApiEndpoint();
  if (!endpoint) return null;
  const form = new FormData();
  form.append("image", blob, photo.name || "edited-image.jpg");
  form.append("metadata", JSON.stringify(cloudSafeMetadata(photo)));
  if (photo.cloudObject) form.append("replaceObjectName", photo.cloudObject);
  const res = await fetchWithTimeout(`${endpoint}/api/photos/upload`, { method: "POST", body: form }, 45000);
  return res.json();
}

// ─── Image helpers ────────────────────────────────────────────────

function isSupportedImageFile(file) {
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  const imageExts = [".jpg",".jpeg",".png",".gif",".webp",".heic",".heif",".avif",".bmp",".tiff",".tif"];
  if (type.startsWith("image/")) return true;
  if (imageExts.some((ext) => name.endsWith(ext))) return true;
  // iCloud-Fotos: manchmal kein MIME-Type, aber file.kind === "file"
  if (!type && file.size > 0 && !name.includes(".")) return true; // unbekannte Datei mit Inhalt
  return false;
}

function normalizeImageType(type) {
  return type && type.startsWith("image/") ? type : "image/jpeg";
}

function parseTags(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return String(value).split(",").map((t) => t.trim()).filter(Boolean);
}

function getCloudObjectFileName(objectName) {
  if (!objectName) return "";
  return String(objectName).split("/").pop();
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function createLocalPreview(file) {
  const dataUrl = await readAsDataUrl(file);
  // Lokale Kopie auf max. 2000px begrenzen — schont IndexedDB und Speicher
  // auf dem iPhone. Das unveränderte Original wird in die Cloud hochgeladen.
  try { return await resizeDataUrl(dataUrl, 2000, normalizeImageType(file.type), 0.88); }
  catch { return dataUrl; }
}

function createThumbnail(dataUrl, type) {
  return new Promise((resolve) => {
    const img = new Image();
    const timer = setTimeout(() => { img.onload = null; resolve(null); }, 8000);
    img.onload = () => {
      clearTimeout(timer);
      try {
        const maxEdge = 400;
        const ratio = Math.min(1, maxEdge / Math.max(img.width, img.height));
        if (ratio >= 1) { resolve(dataUrl); return; }
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.width  * ratio);
        canvas.height = Math.round(img.height * ratio);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL(type || "image/jpeg", 0.75));
      } catch { resolve(null); }
    };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = dataUrl;
  });
}

function resizeDataUrl(dataUrl, maxEdge, type = "image/jpeg", quality = 0.84) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(1, maxEdge / Math.max(img.width, img.height));
      if (ratio >= 1) { resolve(dataUrl); return; }
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.width * ratio));
      canvas.height = Math.max(1, Math.round(img.height * ratio));
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL(type, quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

function readAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

// ── Lädt ein Bild als data:URL — auch von externen HTTPS-URLs ────
function loadImageAsDataUrl(src) {
  return new Promise((resolve, reject) => {
    if (src.startsWith("data:")) { resolve(src); return; }
    fetch(src)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      })
      .catch(reject);
  });
}

function parseExif(buffer) {
  const view = new DataView(buffer);
  if (view.getUint16(0) !== 0xffd8) return {};
  let offset = 2;
  while (offset < view.byteLength) {
    const marker = view.getUint16(offset); offset += 2;
    const size = view.getUint16(offset); offset += 2;
    if (marker === 0xffe1 && getString(view, offset, 4) === "Exif") return parseTiff(view, offset + 6);
    offset += size - 2;
  }
  return {};
}

function parseTiff(view, tiffStart) {
  const little = getString(view, tiffStart, 2) === "II";
  const firstIfd = tiffStart + view.getUint32(tiffStart + 4, little);
  const root = readIfd(view, firstIfd, tiffStart, little);
  let exif = {};
  if (root[0x8769]) exif = readIfd(view, tiffStart + root[0x8769], tiffStart, little);
  const rawDate = exif[0x9003] || root[0x0132];
  return { make: root[0x010f], model: root[0x0110], takenAt: rawDate ? exifDateToIso(rawDate) : null };
}

function readIfd(view, offset, tiffStart, little) {
  const result = {};
  const entries = view.getUint16(offset, little);
  for (let i = 0; i < entries; i++) {
    const entry = offset + 2 + i * 12;
    const tag = view.getUint16(entry, little);
    const type = view.getUint16(entry + 2, little);
    const count = view.getUint32(entry + 4, little);
    const valueOffset = entry + 8;
    const actual = count <= 4 ? valueOffset : tiffStart + view.getUint32(valueOffset, little);
    if (type === 2) result[tag] = getString(view, actual, count).replace(/\0/g, "").trim();
    if (type === 3 && count === 1) result[tag] = view.getUint16(valueOffset, little);
    if (type === 4 && count === 1) result[tag] = view.getUint32(valueOffset, little);
  }
  return result;
}

function getString(view, offset, length) {
  let out = "";
  for (let i = 0; i < length && offset + i < view.byteLength; i++) out += String.fromCharCode(view.getUint8(offset + i));
  return out;
}

function exifDateToIso(value) {
  const match = String(value).match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, y, m, d, h, min, s] = match;
  return new Date(`${y}-${m}-${d}T${h}:${min}:${s}`).toISOString();
}

function suggestCategory(isoDate) {
  const hour = new Date(isoDate).getHours();
  if (hour < 11) return "Frühstück";
  if (hour < 15) return "Mittagessen";
  if (hour < 18) return "Snacks";
  return "Abendessen";
}

function suggestTags(name) {
  const lower = name.toLowerCase();
  const tags = [];
  [["veggie","vegetarisch"],["salad","salat"],["asia","asiatisch"],["pasta","pasta"],["soup","suppe"],["cake","dessert"]]
    .forEach(([needle, tag]) => { if (lower.includes(needle)) tags.push(tag); });
  return tags;
}

// ─── Render / Gallery ────────────────────────────────────────────

function render() {
  state.filtered = sortPhotos(filterPhotos());
  renderGallery();
  // Statistiken nur berechnen wenn sichtbar — spart Re-Renders
  if (state.activeView === "stats") renderStats();
}

function filterPhotos() {
  const query = $("#search-input").value.trim().toLowerCase();
  const from = $("#date-from").value ? new Date($("#date-from").value) : null;
  const to = $("#date-to").value ? new Date(`${$("#date-to").value}T23:59:59`) : null;
  const category = $("#category-filter").value;
  const tag = $("#tag-filter").value.trim().toLowerCase();
  const now = new Date();
  return state.photos.filter((photo) => {
    const date = new Date(photo.takenAt);
    const haystack = [photo.title, photo.name, photo.category, photo.description, photo.camera, ...(photo.tags || [])].join(" ").toLowerCase();
    if (state.quick === "favorites" && !photo.favorite) return false;
    if (state.quick === "untagged" && (photo.tags || []).length) return false;
    if (state.quick === "thisMonth" && (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear())) return false;
    if (query && !haystack.includes(query)) return false;
    if (from && date < from) return false;
    if (to && date > to) return false;
    if (category && photo.category !== category) return false;
    if (tag && !(photo.tags || []).some((t) => t.toLowerCase().includes(tag))) return false;
    return true;
  });
}

function renderGallery() {
  const grid = $("#gallery-grid");
  grid.innerHTML = "";
  // Fotos ohne gültige Bild-URL ausfiltern (z.B. nach geräteübergreifendem Löschen)
  const validFiltered = state.filtered.filter((photo) => {
    const url = getDisplayImageUrl(photo);
    return url && url.length > 0;
  });
  $("#result-count").textContent = `${validFiltered.length} Foto${validFiltered.length === 1 ? "" : "s"}`;
  $("#empty-state").classList.toggle("hidden", validFiltered.length > 0);

  validFiltered.forEach((photo) => {
    const node = $("#photo-card-template").content.firstElementChild.cloneNode(true);
    const imgEl = node.querySelector("img");
    imgEl.alt = photo.description || photo.name;
    // Thumbnail sofort zeigen — thumbUrl, cloudUrl oder dataUrl
    imgEl.src = photo.thumbUrl || getDisplayImageUrl(photo);
    node.querySelector("h3").textContent = photo.title || photo.category;
    node.querySelector("p").textContent = formatDate(photo.takenAt);
    node.querySelector(".favorite-star").textContent = photo.favorite ? "★" : "☆";
    node.querySelector(".photo-open").addEventListener("click", () => {
      if (state.galleryView === "pure") openLightbox(photo.id);
      else openDetail(photo.id);
    });
    node.querySelector(".card-details").addEventListener("click", () => openDetail(photo.id));
    node.querySelector(".card-fullscreen").addEventListener("click", () => openLightbox(photo.id));
    node.querySelector(".card-share").addEventListener("click", async (e) => {
      e.stopPropagation();
      await sharePhoto(photo);
    });
    node.querySelector(".card-download").addEventListener("click", async (e) => {
      e.stopPropagation();
      await downloadPhoto(photo);
    });
    node.querySelector(".card-delete").addEventListener("click", async () => {
      if (!confirm("Dieses Foto wirklich löschen?")) return;
      await removePhoto(photo.id);
      state.photos = state.photos.filter((item) => item.id !== photo.id);
      deleteFromCloud(photo);
      render();
      showToast("🗑 Foto gelöscht");
    });
    node.querySelector(".favorite-star").addEventListener("click", async () => {
      photo.favorite = !photo.favorite;
      photo.updatedAt = new Date().toISOString();
      await savePhoto(photo);
      syncMetadataToCloud(photo);
      render();
    });
    const tagRow = node.querySelector(".tag-row");
    (photo.tags || []).slice(0, 4).forEach((tag) => {
      const pill = document.createElement("span");
      pill.className = "tag-pill";
      pill.textContent = tag;
      tagRow.appendChild(pill);
    });
    grid.appendChild(node);
  });

  // Galerie-View nach Render anwenden (damit neue Cards korrekt gestylt sind)
  applyGalleryView();
}

function formatDate(iso) {
  return new Intl.DateTimeFormat(state.lang === "de" ? "de-DE" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

function getDisplayImageUrl(photo, thumb) {
  // thumb=true: kleines Thumbnail für Galerie-Kacheln
  if (thumb && photo.thumbUrl) return photo.thumbUrl;
  if (!photo.dataUrl) return "";
  if (photo.dataUrl.startsWith("data:")) return photo.dataUrl;
  // Signierte GCS-URLs dürfen NICHT verändert werden — zusätzliche
  // Query-Parameter machen die Signatur ungültig (403)
  if (/X-Goog-Signature|X-Goog-Credential/i.test(photo.dataUrl)) return photo.dataUrl;
  const sep = photo.dataUrl.includes("?") ? "&" : "?";
  return `${photo.dataUrl}${sep}v=${encodeURIComponent(photo.editedAt || photo.createdAt || "")}`;
}

// ─── Detail Panel ────────────────────────────────────────────────

function openDetail(id) {
  const photo = state.photos.find((item) => item.id === id);
  if (!photo) return;
  state.selectedId = id;

  // Position in der gefilterten Liste
  const idx = state.filtered.findIndex((p) => p.id === id);
  state.detailIndex = idx >= 0 ? idx : 0;

  const posEl = $("#detail-position");
  const n = state.filtered.length;
  if (posEl) posEl.textContent = n > 1 ? `${state.detailIndex + 1} / ${n}` : "";
  const hasSiblings = n > 1;
  const prevBtn = $("#detail-prev");
  const nextBtn = $("#detail-next");
  if (prevBtn) prevBtn.style.visibility = hasSiblings ? "" : "hidden";
  if (nextBtn) nextBtn.style.visibility = hasSiblings ? "" : "hidden";

  resetEditState();
  $("#detail-title").value = photo.title || "";
  $("#detail-description").value = photo.description || "";
  $("#detail-category").value = photo.category;
  $("#detail-tags").value = (photo.tags || []).join(", ");
  // Preset-Chips entsprechend der vorhandenen Tags markieren
  const currentTags = (photo.tags || []).map((t) => t.toLowerCase());
  $$(".tag-preset-chip").forEach((chip) => {
    chip.classList.toggle("active", currentTags.includes(chip.textContent.toLowerCase()));
  });
  $("#detail-date").value = toLocalInput(photo.takenAt);
  $("#detail-camera").textContent = photo.camera || "-";
  $("#detail-file").textContent = photo.name;
  $("#favorite-toggle").textContent = photo.favorite ? "★ Favorit" : "☆ Favorit";
  $("#detail-panel").classList.add("open");
  $("#detail-panel").setAttribute("aria-hidden", "false");
  drawSelectedImage();
}

function detailNavigate(dir) {
  if (!state.filtered.length) return;
  const n = state.filtered.length;
  state.detailIndex = ((state.detailIndex || 0) + dir + n) % n;
  openDetail(state.filtered[state.detailIndex].id);
}

function closeDetail() {
  $("#detail-panel").classList.remove("open");
  $("#detail-panel").setAttribute("aria-hidden", "true");
}

function toLocalInput(iso) {
  const date = new Date(iso);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

async function saveDetails(event) {
  event.preventDefault();
  const photo = getSelected();
  if (!photo) return;
  photo.title = $("#detail-title").value.trim();
  photo.description = $("#detail-description").value.trim();
  photo.category = $("#detail-category").value;
  photo.tags = $("#detail-tags").value.split(",").map((t) => t.trim()).filter(Boolean);
  const dateValue = $("#detail-date").value;
  if (dateValue && !isNaN(new Date(dateValue).getTime())) {
    photo.takenAt = new Date(dateValue).toISOString();
  }
  photo.updatedAt = new Date().toISOString();
  await savePhoto(photo);
  syncMetadataToCloud(photo);
  state.photos = await getAllPhotos();
  render();
  closeDetail();
  showToast("✓ Details gespeichert");
}

function getSelected() { return state.photos.find((p) => p.id === state.selectedId); }

async function toggleSelectedFavorite() {
  const photo = getSelected();
  if (!photo) return;
  photo.favorite = !photo.favorite;
  photo.updatedAt = new Date().toISOString();
  await savePhoto(photo);
  syncMetadataToCloud(photo);
  $("#favorite-toggle").textContent = photo.favorite ? "★ Favorit" : "☆ Favorit";
  render();
}

async function deleteSelected() {
  const photo = getSelected();
  if (!photo || !confirm("Dieses Foto wirklich löschen?")) return;
  await removePhoto(photo.id);
  state.photos = state.photos.filter((item) => item.id !== photo.id);
  render();
  closeDetail();
  deleteFromCloud(photo);
}

// ─── Image Editing ───────────────────────────────────────────────

function editImage(changes) { Object.assign(state.edit, changes); drawSelectedImage(); }
function resetEdit() { resetEditState(); drawSelectedImage(); }

function resetEditState() {
  state.edit = { rotation: 0, filter: "none", cropSquare: false, flipH: false, flipV: false, brightness: 100, contrast: 100, saturation: 100 };
  $("#brightness-range").value = "100";
  $("#contrast-range").value = "100";
  $("#saturation-range").value = "100";
}

async function drawSelectedImage() {
  const photo = getSelected();
  if (!photo) return;

  const canvas = $("#edit-canvas");
  const ctx = canvas.getContext("2d");
  const { rotation, filter, cropSquare, flipH, flipV, brightness, contrast, saturation } = state.edit;

  let src;
  try { src = await loadImageAsDataUrl(getDisplayImageUrl(photo)); }
  catch { src = getDisplayImageUrl(photo); }

  const img = new Image();
  img.onload = () => {
    const rad = (rotation * Math.PI) / 180;
    const sin = Math.abs(Math.sin(rad));
    const cos = Math.abs(Math.cos(rad));
    let w = img.width * cos + img.height * sin;
    let h = img.width * sin + img.height * cos;
    if (cropSquare) { const s = Math.min(w, h); w = s; h = s; }
    canvas.width = w; canvas.height = h;
    ctx.save();
    ctx.translate(w / 2, h / 2);
    if (flipH) ctx.scale(-1, 1);
    if (flipV) ctx.scale(1, -1);
    ctx.rotate(rad);
    ctx.drawImage(img, -img.width / 2, -img.height / 2);
    ctx.restore();
    // Live-Vorschau über CSS-Filter (schnell, ruckelfrei) —
    // beim Speichern werden die Filter in bakeFiltersIntoCanvas() eingebrannt
    const filters = [];
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
    if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
    if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
    if (filter === "warm") filters.push("sepia(30%) saturate(130%)");
    if (filter === "mono") filters.push("grayscale(100%)");
    canvas.style.filter = filters.join(" ");
  };
  img.src = src;
}

// Prüft ob der Browser Filter direkt auf dem Canvas-Kontext unterstützt
// (Safari/iOS lange nicht — dort pixelbasierter Fallback)
function supportsCanvasFilter() {
  const ctx = document.createElement("canvas").getContext("2d");
  if (typeof ctx.filter !== "string") return false;
  ctx.filter = "brightness(50%)";
  return ctx.filter !== "none" && ctx.filter !== "";
}

// Wendet die aktuellen Bearbeitungs-Filter dauerhaft auf einen Canvas an.
// Nutzt ctx.filter wenn verfügbar, sonst manuelle Pixel-Berechnung (Safari).
function bakeFiltersIntoCanvas(canvas, edit) {
  const { brightness, contrast, saturation, filter } = edit;
  const hasAdjust = brightness !== 100 || contrast !== 100 || saturation !== 100;
  const hasPreset = filter === "warm" || filter === "mono";
  if (!hasAdjust && !hasPreset) return canvas;

  if (supportsCanvasFilter()) {
    const filters = [];
    if (brightness !== 100) filters.push(`brightness(${brightness}%)`);
    if (contrast !== 100) filters.push(`contrast(${contrast}%)`);
    if (saturation !== 100) filters.push(`saturate(${saturation}%)`);
    if (filter === "warm") filters.push("sepia(30%) saturate(130%)");
    if (filter === "mono") filters.push("grayscale(100%)");
    const out = document.createElement("canvas");
    out.width = canvas.width; out.height = canvas.height;
    const ctx = out.getContext("2d");
    ctx.filter = filters.join(" ");
    ctx.drawImage(canvas, 0, 0);
    return out;
  }

  // Pixel-Fallback — identische Reihenfolge wie die CSS-Filterkette
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = imageData.data;
  const b = brightness / 100;
  const c = contrast / 100;
  const s = saturation / 100;
  for (let i = 0; i < d.length; i += 4) {
    let r = d[i], g = d[i + 1], bl = d[i + 2];
    // Helligkeit
    if (b !== 1) { r *= b; g *= b; bl *= b; }
    // Kontrast (um 128 zentriert)
    if (c !== 1) { r = (r - 128) * c + 128; g = (g - 128) * c + 128; bl = (bl - 128) * c + 128; }
    // Sättigung (Luma-Interpolation, Rec. 709)
    if (s !== 1) {
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
      r = luma + (r - luma) * s; g = luma + (g - luma) * s; bl = luma + (bl - luma) * s;
    }
    if (filter === "warm") {
      // sepia(30%) + saturate(130%)
      const sr = r * 0.393 + g * 0.769 + bl * 0.189;
      const sg = r * 0.349 + g * 0.686 + bl * 0.168;
      const sb = r * 0.272 + g * 0.534 + bl * 0.131;
      r = r * 0.7 + sr * 0.3; g = g * 0.7 + sg * 0.3; bl = bl * 0.7 + sb * 0.3;
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
      r = luma + (r - luma) * 1.3; g = luma + (g - luma) * 1.3; bl = luma + (bl - luma) * 1.3;
    } else if (filter === "mono") {
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * bl;
      r = g = bl = luma;
    }
    d[i]     = r < 0 ? 0 : r > 255 ? 255 : r;
    d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g;
    d[i + 2] = bl < 0 ? 0 : bl > 255 ? 255 : bl;
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

// Erzeugt nach einer Bildänderung ein frisches Thumbnail
async function refreshThumbnail(photo) {
  try {
    const thumb = await createThumbnail(photo.dataUrl.startsWith("data:")
      ? photo.dataUrl
      : await loadImageAsDataUrl(getDisplayImageUrl(photo)), photo.type);
    if (thumb) photo.thumbUrl = thumb; else delete photo.thumbUrl;
  } catch { delete photo.thumbUrl; }
}

async function saveEditedImage() {
  const photo = getSelected();
  if (!photo) return;
  const saveBtn = $("#save-edit");
  const originalLabel = saveBtn.textContent;
  saveBtn.disabled = true;
  saveBtn.textContent = "⏳ Speichere...";

  try {
    const canvas = $("#edit-canvas");
    // Transformierten Canvas kopieren und Filter dauerhaft einbrennen
    const working = document.createElement("canvas");
    working.width = canvas.width; working.height = canvas.height;
    working.getContext("2d").drawImage(canvas, 0, 0);
    const finalCanvas = bakeFiltersIntoCanvas(working, state.edit);
    const dataUrl = finalCanvas.toDataURL(photo.type || "image/jpeg", 0.9);

    photo.dataUrl = dataUrl;
    photo.editedAt = new Date().toISOString();
    photo.updatedAt = photo.editedAt;

    let cloudOk = true;
    if (photo.cloudObject && getApiEndpoint()) {
      try {
        const blob = await (await fetch(dataUrl)).blob();
        const cloud = await uploadEditedImageToCloud(blob, photo);
        if (cloud) { photo.cloudUrl = cloud.url; photo.dataUrl = cloud.url; }
      } catch (e) {
        cloudOk = false;
        console.warn("[Cloud-Edit-Upload]", e.message);
      }
    }

    // Thumbnail neu erzeugen, damit die Galerie das bearbeitete Bild zeigt
    photo.thumbUrl = null;
    try {
      const thumb = await createThumbnail(dataUrl, photo.type);
      if (thumb) photo.thumbUrl = thumb;
    } catch {}

    await savePhoto(photo);
    syncMetadataToCloud(photo);
    state.photos = await getAllPhotos();
    resetEditState();
    render();
    closeDetail();
    showToast(cloudOk ? "✓ Bild gespeichert" : "⚠ Lokal gespeichert — Cloud-Upload fehlgeschlagen", !cloudOk);
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = originalLabel;
  }
}

// ─── Stats ───────────────────────────────────────────────────────

function renderStats() {
  $("#stat-total").textContent = state.photos.length;
  $("#stat-favorites").textContent = state.photos.filter((p) => p.favorite).length;
  const categoryCounts = countBy(state.photos, (p) => p.category);
  const tagCounts = countTags(state.photos);
  $("#stat-top-category").textContent = topKey(categoryCounts) || "-";
  $("#stat-top-tag").textContent = topKey(tagCounts) || "-";
  renderBars("#category-bars", categoryCounts);
  renderBars("#tag-bars", tagCounts);
  renderMonthlyChart();
  renderHeatmap();
}

// ── Fotos pro Monat (letzte 24 Monate) ──────────────────────────
function renderMonthlyChart() {
  const box = $("#monthly-chart");
  if (!box) return;
  box.innerHTML = "";

  const now = new Date();
  const months = [];
  for (let i = 23; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth(), label: "", count: 0 });
  }
  const mDE = ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"];
  months.forEach((m) => { m.label = `${mDE[m.month]} ${String(m.year).slice(2)}`; });

  state.photos.forEach((p) => {
    const d = new Date(p.takenAt);
    if (isNaN(d)) return;
    const entry = months.find((m) => m.year === d.getFullYear() && m.month === d.getMonth());
    if (entry) entry.count++;
  });

  const max = Math.max(1, ...months.map((m) => m.count));
  const wrap = document.createElement("div");
  wrap.className = "monthly-bars";
  months.forEach((m) => {
    const col = document.createElement("div");
    col.className = "monthly-col";
    const h = Math.round((m.count / max) * 100);
    col.innerHTML = `
      <div class="monthly-bar-wrap">
        <span class="monthly-val">${m.count || ""}</span>
        <div class="monthly-bar" style="height:${h}%" title="${m.label}: ${m.count} Fotos"></div>
      </div>
      <span class="monthly-label">${m.label}</span>`;
    wrap.appendChild(col);
  });
  box.appendChild(wrap);
}

// ── Heatmap: Wochentag × Tageszeit ──────────────────────────────
function renderHeatmap() {
  const box = $("#heatmap-chart");
  if (!box) return;
  box.innerHTML = "";

  const days = ["Mo","Di","Mi","Do","Fr","Sa","So"];
  const slots = 6; // 4h-Blöcke: 0-4, 4-8, 8-12, 12-16, 16-20, 20-24
  const slotLabels = ["0–4","4–8","8–12","12–16","16–20","20–24"];

  // counts[weekday0=Mo][slot]
  const counts = Array.from({ length: 7 }, () => new Array(slots).fill(0));
  state.photos.forEach((p) => {
    const d = new Date(p.takenAt);
    if (isNaN(d)) return;
    const wd = (d.getDay() + 6) % 7; // 0=Mo
    const slot = Math.min(Math.floor(d.getHours() / 4), slots - 1);
    counts[wd][slot]++;
  });
  const max = Math.max(1, ...counts.flat());

  const table = document.createElement("div");
  table.className = "heatmap-table";

  // Header-Zeile
  const header = document.createElement("div");
  header.className = "heatmap-row heatmap-header";
  header.innerHTML = `<span class="heatmap-day-label"></span>` +
    slotLabels.map((l) => `<span class="heatmap-slot-label">${l}</span>`).join("");
  table.appendChild(header);

  days.forEach((day, di) => {
    const row = document.createElement("div");
    row.className = "heatmap-row";
    row.innerHTML = `<span class="heatmap-day-label">${day}</span>`;
    counts[di].forEach((c, si) => {
      const pct = c / max;
      const cell = document.createElement("span");
      cell.className = "heatmap-cell";
      cell.style.background = c === 0
        ? "var(--surface-soft)"
        : `rgba(47,111,99,${0.15 + pct * 0.85})`;
      cell.title = `${day} ${slotLabels[si]} Uhr: ${c} Fotos`;
      cell.textContent = c || "";
      row.appendChild(cell);
    });
    table.appendChild(row);
  });
  box.appendChild(table);
}

function countBy(items, getter) {
  return items.reduce((acc, item) => { const key = getter(item) || "Unbekannt"; acc[key] = (acc[key] || 0) + 1; return acc; }, {});
}

function countTags(items) {
  return items.reduce((acc, photo) => { (photo.tags || []).forEach((t) => { acc[t] = (acc[t] || 0) + 1; }); return acc; }, {});
}

function topKey(counts) {
  const first = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return first ? first[0] : undefined;
}

function renderBars(selector, counts) {
  const box = $(selector);
  box.innerHTML = "";
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const max = Math.max(1, ...entries.map((e) => e[1]));
  entries.forEach(([label, count]) => {
    const row = document.createElement("div");
    row.className = "bar-row";
    row.innerHTML = `<span>${escapeHtml(label)}</span><div class="bar-track"><div class="bar-fill" style="width:${(count / max) * 100}%"></div></div><strong>${count}</strong>`;
    box.appendChild(row);
  });
  if (!entries.length) box.textContent = "-";
}

// ─── Export / Share ──────────────────────────────────────────────

async function exportMetadata() {
  downloadBlob(new Blob([JSON.stringify(state.photos.map(withoutDataUrl), null, 2)], { type: "application/json" }), "foodporn-metadaten.json");
}

async function exportZip() {
  const files = state.filtered.length ? state.filtered : state.photos;
  if (!files.length) return;

  const btn = $("#export-button");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Exportiere..."; }

  try {
    const zipFiles = [];
    for (const p of files) {
      const url = getDisplayImageUrl(p);
      if (!url) continue;
      let data;
      try {
        if (url.startsWith("data:")) {
          // Lokales Bild — direkt als Base64 dekodieren
          data = base64ToUint8(url);
        } else {
          // Cloud-URL — per fetch laden
          const res = await fetch(url);
          if (!res.ok) continue;
          const buf = await res.arrayBuffer();
          data = new Uint8Array(buf);
        }
        zipFiles.push({ name: safeFileName(`${p.title || p.category}-${p.name}`), data });
      } catch { continue; }
    }
    zipFiles.push({
      name: "metadata.json",
      data: new TextEncoder().encode(JSON.stringify(files.map(withoutDataUrl), null, 2))
    });
    downloadBlob(
      new Blob([createZip(zipFiles)], { type: "application/zip" }),
      `foodporn-export-${new Date().toISOString().slice(0, 10)}.zip`
    );
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "ZIP exportieren"; }
  }
}

// Entfernt alle großen Base64-Felder — für Export und lokale Zwecke
function withoutDataUrl(photo) {
  const { dataUrl, thumbUrl, cropHistory, originalDataUrl, localSaveWarning, ...meta } = photo;
  return meta;
}

// Schlanke Whitelist für Cloud-Metadaten (GCS erlaubt nur 8 KB Metadaten pro Objekt,
// user-edits.json darf nicht mit Base64-Daten aufgebläht werden)
function cloudSafeMetadata(photo) {
  return {
    id: photo.id,
    name: photo.name,
    type: photo.type,
    title: photo.title || "",
    description: photo.description || "",
    category: photo.category || "",
    tags: Array.isArray(photo.tags) ? photo.tags : [],
    favorite: photo.favorite === true,
    camera: photo.camera || "",
    takenAt: photo.takenAt || "",
    createdAt: photo.createdAt || "",
    editedAt: photo.editedAt || "",
    cloudObject: photo.cloudObject || "",
    fileHash: photo.fileHash || ""
  };
}

function base64ToUint8(dataUrl) {
  const base64 = dataUrl.split(",")[1];
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function createZip(files) {
  const chunks = [], central = [];
  let offset = 0;
  files.forEach((file) => {
    const name = new TextEncoder().encode(file.name);
    const data = file.data;
    const crc = crc32(data);
    const local = new Uint8Array(30 + name.length);
    const view = new DataView(local.buffer);
    view.setUint32(0, 0x04034b50, true); view.setUint16(4, 20, true); view.setUint16(8, 0, true);
    view.setUint32(14, crc, true); view.setUint32(18, data.length, true); view.setUint32(22, data.length, true);
    view.setUint16(26, name.length, true); local.set(name, 30);
    chunks.push(local, data);
    const header = new Uint8Array(46 + name.length);
    const hv = new DataView(header.buffer);
    hv.setUint32(0, 0x02014b50, true); hv.setUint16(4, 20, true); hv.setUint16(6, 20, true);
    hv.setUint32(16, crc, true); hv.setUint32(20, data.length, true); hv.setUint32(24, data.length, true);
    hv.setUint16(28, name.length, true); hv.setUint32(42, offset, true); header.set(name, 46);
    central.push(header);
    offset += local.length + data.length;
  });
  const centralSize = central.reduce((s, i) => s + i.length, 0);
  const end = new Uint8Array(22);
  const ev = new DataView(end.buffer);
  ev.setUint32(0, 0x06054b50, true); ev.setUint16(8, files.length, true); ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true); ev.setUint32(16, offset, true);
  return concatUint8([...chunks, ...central, end]);
}

function crc32(data) {
  let crc = -1;
  for (let i = 0; i < data.length; i++) { crc ^= data[i]; for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1)); }
  return (crc ^ -1) >>> 0;
}

function concatUint8(arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  arrays.forEach((a) => { out.set(a, offset); offset += a.length; });
  return out;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = filename; link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  // Safari braucht die URL noch kurz nach dem Klick — nicht sofort freigeben
  setTimeout(() => { URL.revokeObjectURL(url); link.remove(); }, 4000);
}

async function shareApp() {
  const text = `Foodporn: ${state.filtered.length} gefilterte Food-Fotos`;
  if (navigator.share) await navigator.share({ title: "Foodporn", text, url: location.href });
  else { await navigator.clipboard.writeText(location.href); alert("Link wurde in die Zwischenablage kopiert."); }
}

function safeFileName(name) { return name.replace(/[^a-z0-9._-]+/gi, "-").replace(/-+/g, "-"); }

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

// ─── Lightbox ────────────────────────────────────────────────────

function openLightbox(id) {
  const idx = state.filtered.findIndex((p) => p.id === id);
  if (idx < 0) return;
  state.lightboxIndex = idx;
  showLightboxPhoto();
  $("#lightbox").classList.remove("hidden");
}

function showLightboxPhoto() {
  const photo = state.filtered[state.lightboxIndex];
  if (!photo) return;
  const img = $("#lightbox-img");
  img.src = getDisplayImageUrl(photo);
  img.alt = photo.title || photo.description || photo.name;
  $("#lightbox-caption").textContent = [photo.title || photo.category, formatDate(photo.takenAt)].filter(Boolean).join(" · ");
}

function closeLightbox() {
  $("#lightbox").classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  $("#lightbox-close").addEventListener("click", closeLightbox);
  $("#lightbox-prev").addEventListener("click", () => {
    if (state.cropActive) return; // keine Navigation während Crop
    state.lightboxIndex = (state.lightboxIndex - 1 + state.filtered.length) % state.filtered.length;
    showLightboxPhoto();
  });
  $("#lightbox-next").addEventListener("click", () => {
    if (state.cropActive) return;
    state.lightboxIndex = (state.lightboxIndex + 1) % state.filtered.length;
    showLightboxPhoto();
  });
  $("#lightbox-detail").addEventListener("click", () => {
    const photo = state.filtered[state.lightboxIndex];
    if (photo) { closeLightbox(); openDetail(photo.id); }
  });

  // ── Share aus Lightbox ───────────────────────────────────────────
  $("#lightbox-share").addEventListener("click", shareLightboxPhoto);
  $("#lightbox-download").addEventListener("click", () => downloadPhoto(state.filtered[state.lightboxIndex]));

  // ── Crop-Toggle ──────────────────────────────────────────────────
  $("#lightbox-crop-toggle").addEventListener("click", toggleCropMode);
  $$(".crop-ratio-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      $$(".crop-ratio-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      state.cropRatio = btn.dataset.ratio;
      updateCropFrame();
    });
  });
  $("#crop-apply").addEventListener("click", applyCrop);
  $("#crop-cancel").addEventListener("click", () => toggleCropMode(false));
  $("#crop-undo").addEventListener("click", cropUndo);
  $("#crop-original").addEventListener("click", cropRestoreOriginal);

  // ── Tastaturnavigation ───────────────────────────────────────────
  document.addEventListener("keydown", (e) => {
    const lightboxOpen = !$("#lightbox").classList.contains("hidden");
    const detailOpen   = $("#detail-panel").classList.contains("open");

    if (lightboxOpen) {
      if (e.key === "Escape") { if (state.cropActive) toggleCropMode(false); else closeLightbox(); }
      if (state.cropActive) return;
      if (e.key === "ArrowLeft")  { $("#lightbox-prev").click(); }
      if (e.key === "ArrowRight") { $("#lightbox-next").click(); }
      return;
    }

    if (detailOpen) {
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "ArrowLeft"  || e.key === "ArrowUp")   { e.preventDefault(); detailNavigate(-1); }
      if (e.key === "ArrowRight" || e.key === "ArrowDown")  { e.preventDefault(); detailNavigate(+1); }
      if (e.key === "Escape") closeDetail();
    }
  });

  // ── Touch-Swipe für iPhone / Android ────────────────────────────
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoving = false;
  const lb = $("#lightbox");

  lb.addEventListener("touchstart", (e) => {
    touchStartX = e.changedTouches[0].clientX;
    touchStartY = e.changedTouches[0].clientY;
    touchMoving = false;
  }, { passive: true });

  // Non-passive: wir rufen ggf. preventDefault() auf um horizontalen Scroll zu blockieren
  lb.addEventListener("touchmove", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    // Wenn der Swipe eindeutig horizontal ist → Scroll verhindern
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
      e.preventDefault();
      touchMoving = true;
    }
  }, { passive: false });

  lb.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    // Mindestens 40px horizontal, und mehr horizontal als vertikal
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
    if (dx < 0) {
      // Swipe links → nächstes Bild
      state.lightboxIndex = (state.lightboxIndex + 1) % state.filtered.length;
    } else {
      // Swipe rechts → vorheriges Bild
      state.lightboxIndex = (state.lightboxIndex - 1 + state.filtered.length) % state.filtered.length;
    }
    showLightboxPhoto();
  }, { passive: true });

  // Hintergrund-Klick (nicht auf Bild/Button) schließt Lightbox
  lb.addEventListener("click", (e) => {
    if (touchMoving) { touchMoving = false; return; } // kein Close nach Swipe
    if (e.target === lb || e.target.classList.contains("lightbox-img-wrap")) closeLightbox();
  });
});

// ═══════════════════════════════════════════════════════════════════
// ─── FEATURE: Batch-Edit (Stapelbearbeitung) ─────────────────────
// ═══════════════════════════════════════════════════════════════════

function setupBatchCategorySelect() {
  const sel = $("#batch-category");
  if (!sel) return;
  sel.innerHTML = `<option value="">Kategorie setzen…</option>` +
    getCategories().map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");
}

function startBatchMode() {
  state.batchMode = true;
  state.selectedIds = new Set();
  updateBatchToolbar();
  render();
}

function batchCancel() {
  state.batchMode = false;
  state.selectedIds = new Set();
  updateBatchToolbar();
  render();
}

function toggleBatchSelect(id, selected) {
  if (selected) state.selectedIds.add(id);
  else state.selectedIds.delete(id);
  // Card visuell aktualisieren ohne komplett neu zu rendern
  const card = $(`#gallery-grid [data-id="${id}"]`);
  if (card) card.classList.toggle("batch-selected", selected);
  updateBatchToolbar();
}

function updateBatchToolbar() {
  const toolbar = $("#batch-toolbar");
  const countEl = $("#batch-count");
  if (!toolbar) return;
  const n = state.selectedIds.size;
  const visible = state.batchMode;
  toolbar.classList.toggle("hidden", !visible);
  if (countEl) countEl.textContent = `${n} ausgewählt`;
  // Alle Karten im Batch-Modus markieren
  $$(".photo-card").forEach((card) => {
    card.classList.toggle("batch-mode", state.batchMode);
  });
}

function batchSetFavorite(value) {
  if (!state.selectedIds.size) return;
  // Karten im DOM direkt aktualisieren + in DB speichern
  state.selectedIds.forEach((id) => {
    const photo = state.photos.find((p) => p.id === id);
    if (photo) {
      photo.favorite = value;
      photo.updatedAt = new Date().toISOString();
      savePhoto(photo);
      syncMetadataToCloud(photo);
    }
  });
  render();
}

async function batchApply() {
  const n = state.selectedIds.size;
  if (!n) return;

  const newCategory = $("#batch-category").value;
  const rawTags = $("#batch-tags").value.trim();
  const addTags = rawTags ? rawTags.split(",").map((t) => t.trim()).filter(Boolean) : [];

  if (!newCategory && !addTags.length) {
    alert("Bitte eine Kategorie wählen oder Tags eingeben.");
    return;
  }

  const ids = Array.from(state.selectedIds);
  for (const id of ids) {
    const photo = state.photos.find((p) => p.id === id);
    if (!photo) continue;
    if (newCategory) photo.category = newCategory;
    if (addTags.length) {
      const existing = new Set(photo.tags || []);
      addTags.forEach((t) => existing.add(t));
      photo.tags = Array.from(existing);
    }
    photo.updatedAt = new Date().toISOString();
    await savePhoto(photo);
    syncMetadataToCloud(photo);
  }

  // Eingaben zurücksetzen
  $("#batch-category").value = "";
  $("#batch-tags").value = "";

  state.photos = await getAllPhotos();
  batchCancel();
}

async function batchDelete() {
  const n = state.selectedIds.size;
  if (!n) return;
  if (!confirm(`${n} Foto${n === 1 ? "" : "s"} wirklich löschen?`)) return;
  const toDelete = Array.from(state.selectedIds).map((id) => state.photos.find((p) => p.id === id)).filter(Boolean);
  for (const p of toDelete) { await removePhoto(p.id); }
  state.photos = state.photos.filter((p) => !state.selectedIds.has(p.id));
  batchCancel();
  for (const p of toDelete) { deleteFromCloud(p); }
}


// ═══════════════════════════════════════════════════════════════════
// ─── FEATURE 5: Lightbox Crop-Tool ───────────────────────────────
// ═══════════════════════════════════════════════════════════════════

// Crop-State
Object.assign(state, { cropActive: false, cropRatio: "free", cropHistory: [] });

function toggleCropMode(forceOff) {
  const on = forceOff === false ? false : !state.cropActive;
  state.cropActive = on;
  const overlay   = $("#crop-overlay");
  const cropBar   = $("#lightbox-crop-bar");
  const toggleBtn = $("#lightbox-crop-toggle");
  overlay.classList.toggle("hidden", !on);
  cropBar.classList.toggle("hidden", !on);
  toggleBtn.classList.toggle("lb-action-active", on);
  // Nav-Pfeile ausblenden während Crop
  $$(".lightbox-nav").forEach((b) => b.style.visibility = on ? "hidden" : "");
  if (on) {
    updateCropFrame();
    updateCropHistoryButtons();
  }
}

function updateCropHistoryButtons() {
  const photo = state.filtered[state.lightboxIndex];
  const undoBtn     = $("#crop-undo");
  const originalBtn = $("#crop-original");
  if (!undoBtn || !originalBtn) return;
  const hasHistory  = photo && photo.cropHistory && photo.cropHistory.length > 0;
  const hasOriginal = photo && !!photo.originalDataUrl;
  undoBtn.disabled     = !hasHistory;
  originalBtn.disabled = !hasOriginal;
  undoBtn.style.opacity     = hasHistory  ? "1" : "0.4";
  originalBtn.style.opacity = hasOriginal ? "1" : "0.4";
}

function updateCropFrame() {
  const img   = $("#lightbox-img");
  const frame = $("#crop-frame");
  const overlay = $("#crop-overlay");
  if (!img || !frame) return;

  // Overlay exakt über das Bild legen (nicht über den ganzen Container) —
  // sonst stimmen die Crop-Koordinaten nicht, wenn das Bild kleiner ist
  if (overlay) {
    overlay.style.left   = img.offsetLeft + "px";
    overlay.style.top    = img.offsetTop  + "px";
    overlay.style.width  = img.offsetWidth  + "px";
    overlay.style.height = img.offsetHeight + "px";
    overlay.style.inset  = "auto";
  }
  const ratio = state.cropRatio;

  // Startrahmen: 80% des Bildes, proportional
  let fw, fh;
  if (ratio === "free") {
    fw = img.offsetWidth  * 0.8;
    fh = img.offsetHeight * 0.8;
  } else {
    const [rw, rh] = ratio.split(":").map(Number);
    const aspect = rw / rh;
    fw = Math.min(img.offsetWidth * 0.85, img.offsetHeight * 0.85 * aspect);
    fh = fw / aspect;
  }
  const ox = (img.offsetWidth  - fw) / 2;
  const oy = (img.offsetHeight - fh) / 2;

  frame.style.left   = ox + "px";
  frame.style.top    = oy + "px";
  frame.style.width  = fw + "px";
  frame.style.height = fh + "px";

  // Drag-Handles aktivieren
  enableCropDrag(img, frame, ratio);
}

function enableCropDrag(img, frame, ratio) {
  // Entfernt alte Listener durch Klonen
  const newFrame = frame.cloneNode(true);
  frame.parentNode.replaceChild(newFrame, frame);
  const f = newFrame;

  let dragging = false, resizing = false, resizeDir = "";
  let startX, startY, startL, startT, startW, startH;

  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const iw = img.offsetWidth, ih = img.offsetHeight;

  const getAspect = () => {
    if (ratio === "free") return null;
    const [rw, rh] = ratio.split(":").map(Number);
    return rw / rh;
  };

  const onTouchMove = (ev) => onMove(ev.touches[0]);

  f.addEventListener("mousedown", startDrag);
  f.addEventListener("touchstart", (e) => startDrag(e.touches[0]), { passive: true });

  function startDrag(e) {
    const rect = f.getBoundingClientRect();
    const ex = (e.clientX || e.pageX) - rect.left;
    const ey = (e.clientY || e.pageY) - rect.top;
    const edge = 18;
    if (ex < edge && ey < edge)        { resizing = true; resizeDir = "nw"; }
    else if (ex > rect.width - edge && ey < edge) { resizing = true; resizeDir = "ne"; }
    else if (ex < edge && ey > rect.height - edge) { resizing = true; resizeDir = "sw"; }
    else if (ex > rect.width - edge && ey > rect.height - edge) { resizing = true; resizeDir = "se"; }
    else { dragging = true; }
    startX = e.clientX || e.pageX; startY = e.clientY || e.pageY;
    startL = parseFloat(f.style.left); startT = parseFloat(f.style.top);
    startW = parseFloat(f.style.width); startH = parseFloat(f.style.height);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("mouseup",  endDrag);
    document.addEventListener("touchend", endDrag);
  }

  function onMove(e) {
    const dx = (e.clientX || e.pageX) - startX;
    const dy = (e.clientY || e.pageY) - startY;
    const asp = getAspect();
    if (dragging) {
      f.style.left = clamp(startL + dx, 0, iw - parseFloat(f.style.width))  + "px";
      f.style.top  = clamp(startT + dy, 0, ih - parseFloat(f.style.height)) + "px";
    } else if (resizing) {
      let nw = startW, nh = startH, nl = startL, nt = startT;
      if (resizeDir.includes("e")) nw = Math.max(40, startW + dx);
      if (resizeDir.includes("s")) nh = Math.max(40, startH + dy);
      if (resizeDir.includes("w")) { nw = Math.max(40, startW - dx); nl = startL + (startW - nw); }
      if (resizeDir.includes("n")) { nh = Math.max(40, startH - dy); nt = startT + (startH - nh); }
      if (asp) {
        if (resizeDir.includes("e") || resizeDir.includes("w")) nh = nw / asp;
        else nw = nh * asp;
      }
      nw = clamp(nw, 40, iw - nl);
      nh = clamp(nh, 40, ih - nt);
      f.style.left = clamp(nl, 0, iw - nw) + "px";
      f.style.top  = clamp(nt, 0, ih - nh) + "px";
      f.style.width  = nw + "px";
      f.style.height = nh + "px";
    }
  }

  function endDrag() {
    dragging = false; resizing = false;
    document.removeEventListener("mousemove", onMove);
    document.removeEventListener("touchmove", onTouchMove);
    document.removeEventListener("mouseup",  endDrag);
    document.removeEventListener("touchend", endDrag);
  }
}

async function applyCrop() {
  const photo = state.filtered[state.lightboxIndex];
  if (!photo) return;

  const img   = $("#lightbox-img");
  const frame = $("#crop-frame");
  if (!img || !frame) return;

  // Skalierungsfaktor: img.offsetWidth → img.naturalWidth
  const scaleX = img.naturalWidth  / img.offsetWidth;
  const scaleY = img.naturalHeight / img.offsetHeight;

  const cx = parseFloat(frame.style.left)   * scaleX;
  const cy = parseFloat(frame.style.top)    * scaleY;
  const cw = parseFloat(frame.style.width)  * scaleX;
  const ch = parseFloat(frame.style.height) * scaleY;

  // Bild als data:URL laden (auch für externe GCS-URLs)
  let src;
  try { src = await loadImageAsDataUrl(getDisplayImageUrl(photo)); }
  catch { src = getDisplayImageUrl(photo); }

  const srcImg = new Image();
  await new Promise((res) => { srcImg.onload = res; srcImg.src = src; });

  const canvas = document.createElement("canvas");
  canvas.width  = Math.round(cw);
  canvas.height = Math.round(ch);
  canvas.getContext("2d").drawImage(srcImg, cx, cy, cw, ch, 0, 0, cw, ch);

  const dataUrl = canvas.toDataURL(photo.type || "image/jpeg", 0.92);

  // ── Undo-History ───────────────────────────────────────────────
  // Beim allerersten Crop: Original sichern
  if (!photo.originalDataUrl) {
    photo.originalDataUrl = getDisplayImageUrl(photo);
  }
  // Aktuellen Stand in Undo-Stack schieben (max. 10 Schritte)
  if (!photo.cropHistory) photo.cropHistory = [];
  photo.cropHistory.push(getDisplayImageUrl(photo));
  if (photo.cropHistory.length > 10) photo.cropHistory.shift();

  photo.dataUrl  = dataUrl;
  photo.editedAt = new Date().toISOString();
  photo.updatedAt = photo.editedAt;

  // In Cloud hochladen
  let cloudOk = true;
  if (photo.cloudObject && getApiEndpoint()) {
    try {
      const blob = await (await fetch(dataUrl)).blob();
      const cloud = await uploadEditedImageToCloud(blob, photo);
      if (cloud) { photo.cloudUrl = cloud.url; photo.dataUrl = cloud.url; }
    } catch (e) { cloudOk = false; console.warn("[Crop-Upload]", e); }
  }

  // Thumbnail neu erzeugen — Galerie soll das zugeschnittene Bild zeigen
  photo.thumbUrl = null;
  try {
    const thumb = await createThumbnail(dataUrl, photo.type);
    if (thumb) photo.thumbUrl = thumb;
  } catch {}

  await savePhoto(photo);
  syncMetadataToCloud(photo);
  state.photos = await getAllPhotos();
  toggleCropMode(false);
  showLightboxPhoto(); // aktualisiertes Bild anzeigen
  render();
  showToast(cloudOk ? "✓ Zuschnitt gespeichert" : "⚠ Lokal gespeichert — Cloud-Upload fehlgeschlagen", !cloudOk);
}

// ═══════════════════════════════════════════════════════════════════
// ─── FEATURE 11: Foto aus Lightbox teilen ────────────────────────
// ═══════════════════════════════════════════════════════════════════

async function shareLightboxPhoto() {
  const photo = state.filtered[state.lightboxIndex];
  if (!photo) return;

  const title = photo.title || photo.category || "Foodporn";
  const text  = [photo.title, photo.description, (photo.tags || []).join(" ")].filter(Boolean).join(" · ");

  // Web Share API mit Bild-Blob (iOS/Android)
  if (navigator.share) {
    try {
      const src = getDisplayImageUrl(photo);
      // Bild als Blob laden und als Datei teilen (iOS 15+)
      const blob = await fetch(src).then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.blob();
      });
      const file = new File([blob], photo.name || "food.jpg", { type: blob.type || "image/jpeg" });
      // canShare ist nicht auf allen iOS-Versionen vorhanden → sicher prüfen
      const canShareFiles = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
      if (canShareFiles) {
        await navigator.share({ title, text, files: [file] });
        return;
      }
    } catch (e) {
      console.warn("[Share-Blob]", e.message);
    }
    // Fallback: nur URL teilen
    try {
      await navigator.share({ title, text, url: getDisplayImageUrl(photo) });
      return;
    } catch {}
  }

  // Desktop-Fallback: Bild-URL in Zwischenablage
  try {
    await navigator.clipboard.writeText(getDisplayImageUrl(photo));
    showLightboxToast("🔗 Bild-URL kopiert");
  } catch {
    showLightboxToast("⚠ Teilen nicht verfügbar");
  }
}

function showLightboxToast(msg) {
  let toast = $("#lightbox-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "lightbox-toast";
    toast.className = "lightbox-toast";
    $("#lightbox").appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("visible");
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove("visible"), 2400);
}

// ═══════════════════════════════════════════════════════════════════
// ─── FEATURE 8: Dark Mode (wird per CSS gesteuert, kein JS nötig)
// ─── Nur: Toggle in Settings falls jemand manuell umschalten will
// ═══════════════════════════════════════════════════════════════════
// (Dark Mode ist vollständig über @media prefers-color-scheme in
// styles.css gelöst — kein JS erforderlich)

// ─── Crop Undo / Original ─────────────────────────────────────────

async function cropUndo() {
  const photo = state.filtered[state.lightboxIndex];
  if (!photo || !photo.cropHistory || !photo.cropHistory.length) return;

  const prevUrl = photo.cropHistory.pop();      // letzten Stand holen
  photo.dataUrl  = prevUrl;
  photo.editedAt = new Date().toISOString();
  photo.updatedAt = photo.editedAt;

  // Wenn History leer und originalDataUrl === aktueller Stand → original aufräumen
  if (!photo.cropHistory.length && photo.originalDataUrl === prevUrl) {
    delete photo.originalDataUrl;
  }

  await refreshThumbnail(photo);
  await savePhoto(photo);
  state.photos = await getAllPhotos();
  showLightboxPhoto();              // Lightbox-Bild aktualisieren
  updateCropHistoryButtons();
  render();
}

async function cropRestoreOriginal() {
  const photo = state.filtered[state.lightboxIndex];
  if (!photo || !photo.originalDataUrl) return;
  if (!confirm("Wirklich zum Original zurücksetzen? Alle Crop-Bearbeitungen werden verworfen.")) return;

  photo.dataUrl     = photo.originalDataUrl;
  photo.editedAt    = new Date().toISOString();
  photo.updatedAt   = photo.editedAt;
  photo.cropHistory = [];
  delete photo.originalDataUrl;

  // Ggf. auch Cloud aktualisieren
  if (photo.cloudObject && getApiEndpoint()) {
    try {
      const blob = await fetch(photo.dataUrl).then((r) => r.blob());
      const cloud = await uploadEditedImageToCloud(blob, photo);
      if (cloud) { photo.cloudUrl = cloud.url; photo.dataUrl = cloud.url; }
    } catch (e) { console.warn("[Crop-Original-Upload]", e); }
  }

  await refreshThumbnail(photo);
  await savePhoto(photo);
  state.photos = await getAllPhotos();
  showLightboxPhoto();
  updateCropHistoryButtons();
  render();
}

// ─── Batch Thumbnail Generator ────────────────────────────────────
// Läuft einmalig beim App-Start im Hintergrund.
// Erstellt für alle Fotos ohne thumbUrl ein 400px Thumbnail
// und speichert es in der IndexedDB → nächster Start: sofort sichtbar.

async function generateMissingThumbnails() {
  const photos = state.photos.filter((p) => !p.thumbUrl);
  if (!photos.length) return;

  for (const photo of photos) {
    const src = getDisplayImageUrl(photo);
    if (!src) continue;
    try {
      const thumb = await _makeThumb(src, photo.type);
      if (thumb) {
        photo.thumbUrl = thumb;
        await savePhoto(photo).catch(() => {});
      }
    } catch { /* ignorieren */ }
    // Kurze Pause damit die UI nicht blockiert
    await new Promise((r) => setTimeout(r, 30));
  }
  // Galerie neu rendern damit alle Thumbnails sofort sichtbar sind
  render();
}

function _makeThumb(src, type) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const timer = setTimeout(() => { img.onload = null; resolve(null); }, 10000);
    img.onload = () => {
      clearTimeout(timer);
      try {
        const maxEdge = 400;
        const ratio = Math.min(1, maxEdge / Math.max(img.naturalWidth, img.naturalHeight));
        if (ratio >= 1 && src.startsWith("data:")) { resolve(src); return; }
        if (ratio >= 1) { resolve(null); return; } // Cloud-URL — nicht als thumb speichern
        const canvas = document.createElement("canvas");
        canvas.width  = Math.round(img.naturalWidth  * ratio);
        canvas.height = Math.round(img.naturalHeight * ratio);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL(type || "image/jpeg", 0.75));
      } catch { resolve(null); }
    };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = src;
  });
}

// ─── Foto teilen (Galerie-Karte + Lightbox) ───────────────────────
async function sharePhoto(photo) {
  if (!photo) return;
  const title = photo.title || photo.category || "Food-Foto";
  const text  = [photo.title, photo.description, (photo.tags||[]).join(" ")].filter(Boolean).join(" · ");
  const src   = getDisplayImageUrl(photo);

  // Web Share API — öffnet nativen Share-Dialog (WhatsApp, iMessage etc.)
  if (navigator.share) {
    try {
      // Bild als Datei teilen (iPhone: direkt in WhatsApp/iMessage einfügen)
      const blob = await fetch(src).then((r) => {
        if (!r.ok) throw new Error("fetch failed");
        return r.blob();
      });
      const file = new File([blob], photo.name || "food.jpg", { type: blob.type || "image/jpeg" });
      const canShare = typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });
      if (canShare) {
        await navigator.share({ title, text, files: [file] });
        return;
      }
    } catch (e) { console.warn("[sharePhoto blob]", e.message); }

    // Fallback: nur URL teilen
    try {
      await navigator.share({ title, text, url: src });
      return;
    } catch {}
  }

  // Desktop-Fallback: URL kopieren
  try {
    await navigator.clipboard.writeText(src);
    alert("🔗 Bild-URL in Zwischenablage kopiert");
  } catch {
    alert("Teilen wird auf diesem Gerät nicht unterstützt");
  }
}


// ─── Einzelnes Foto herunterladen (beste verfügbare Auflösung) ────
// Reihenfolge: 1) frisch signierte Cloud-URL (Original bzw. bearbeitete
// Version in voller Auflösung), 2) gespeicherte Cloud-URL, 3) lokale Kopie
// (max. 2000 px, da lokal verkleinert gespeichert wird).
async function getBestQualityBlob(photo, filename) {
  const candidates = [];
  const endpoint = getApiEndpoint();
  if (endpoint && photo.cloudObject) {
    // 1) Über die eigene API (CORS-sicher, Originalauflösung)
    candidates.push(async () => `${endpoint}/api/photos/download?objectName=${encodeURIComponent(photo.cloudObject)}&filename=${encodeURIComponent(filename)}`);
    // 2) Frisch signierte GCS-URL
    candidates.push(async () => {
      const res = await fetchWithTimeout(`${endpoint}/api/photos/signed-url?objectName=${encodeURIComponent(photo.cloudObject)}`, {}, 20000);
      const { url } = await res.json();
      if (!url) throw new Error("keine signierte URL");
      return url;
    });
  }
  if (photo.cloudUrl) candidates.push(async () => photo.cloudUrl);
  if (photo.dataUrl) candidates.push(async () => getDisplayImageUrl(photo));

  for (const getUrl of candidates) {
    try {
      const url = await getUrl();
      const res = await fetchWithTimeout(url, { cache: "no-store" }, 90000);
      const blob = await res.blob();
      if (blob.size > 0) return { blob, fromCloud: !url.startsWith("data:") };
    } catch (e) { console.warn("[Download]", e.message); }
  }
  return null;
}

function buildDownloadFileName(photo, mimeType) {
  const extByType = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/heic": "heic", "image/heif": "heif", "image/avif": "avif" };
  const ext = extByType[(mimeType || "").toLowerCase()] || ((photo.name || "").split(".").pop() || "jpg").toLowerCase();
  const base = (photo.title || (photo.name || "").replace(/\.[^.]+$/, "") || "food-foto")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_ ]+/g, "").trim().replace(/\s+/g, "-").slice(0, 80) || "food-foto";
  return `${base}.${ext}`;
}

async function downloadPhoto(photo) {
  if (!photo) return;
  showToast("⬇ Lade Bild in bester Auflösung…");
  const preferredName = buildDownloadFileName(photo, photo.type);
  const result = await getBestQualityBlob(photo, preferredName);
  if (!result) {
    // Letzter Ausweg: Bild direkt öffnen, damit es manuell gespeichert werden kann
    const url = photo.cloudUrl || getDisplayImageUrl(photo);
    if (url && !url.startsWith("data:")) {
      window.open(url, "_blank", "noopener");
      showToast("⚠ Direkter Download nicht möglich — Bild in neuem Tab geöffnet", true);
    } else {
      showToast("⚠ Download fehlgeschlagen", true);
    }
    return;
  }
  const filename = buildDownloadFileName(photo, result.blob.type || photo.type);

  // iPhone/iPad: Ein normaler Download landet nur in der Dateien-App.
  // In die Fotos-Mediathek kommt ein Bild nur über das Teilen-Menü
  // („Bild sichern“) — daher dort die Web Share API nutzen.
  if (isIOSDevice()) {
    const file = new File([result.blob], filename, { type: result.blob.type || photo.type || "image/jpeg" });
    if (typeof navigator.share === "function" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file] });
        showToast("✓ Tippe auf „Bild sichern“, um es in Fotos zu speichern");
      } catch (e) {
        // Safari verlangt einen frischen Tipp, wenn das Laden länger gedauert hat
        if (e && e.name === "NotAllowedError") showSaveToPhotosPrompt(file);
        else if (!e || e.name !== "AbortError") { downloadBlob(result.blob, filename); }
      }
      return;
    }
  }

  downloadBlob(result.blob, filename);
  showToast(result.fromCloud ? "✓ Download gestartet (Originalauflösung)" : "✓ Download gestartet (lokale Kopie)");
}

function isIOSDevice() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

// Bild ist geladen, aber Safari hat das Teilen-Menü blockiert →
// Knopf anzeigen, der Tipp liefert die nötige Nutzer-Geste
function showSaveToPhotosPrompt(file) {
  document.querySelector(".save-photos-prompt")?.remove();
  const box = document.createElement("div");
  box.className = "save-photos-prompt";
  box.innerHTML = `<p>Bild ist bereit (Originalauflösung)</p>
    <button type="button" class="primary-button save-photos-go">📲 In Fotos sichern</button>
    <button type="button" class="secondary-button save-photos-cancel">Abbrechen</button>`;
  document.body.appendChild(box);
  box.querySelector(".save-photos-cancel").addEventListener("click", () => box.remove());
  box.querySelector(".save-photos-go").addEventListener("click", async () => {
    try {
      await navigator.share({ files: [file] });
      box.remove();
      showToast("✓ Tippe auf „Bild sichern“, um es in Fotos zu speichern");
    } catch (e) {
      if (e && e.name === "AbortError") { box.remove(); return; }
      box.remove();
      downloadBlob(file, file.name);
    }
  });
}
