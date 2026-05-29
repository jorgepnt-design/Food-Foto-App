const DB_NAME = "mealvault-db";
const STORE = "photos";
const DEFAULT_API_ENDPOINT = "https://food-foto-app.onrender.com";
const categories = ["Frühstück", "Mittagessen", "Abendessen", "Snacks", "Dessert", "Getränke", "Sonstiges"];

const translations = {
  de: {
    appName: "Foodporn", tagline: "Food-Fotos organisiert", gallery: "Galerie", upload: "Upload", stats: "Statistiken",
    settings: "Einstellungen", quickFilters: "Schnellfilter", allPhotos: "Alle Fotos", favorites: "Favoriten",
    thisMonth: "Dieser Monat", untagged: "Ohne Tags", storage: "Speicherung",
    storageText: "Lokal in IndexedDB. Cloud-Anbindung ist vorbereitet.", workspace: "Private Sammlung",
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
    storageText: "Stored locally in IndexedDB. Cloud sync is ready to connect.", workspace: "Private collection",
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
  edit: { rotation: 0, filter: "none", cropSquare: false, flipH: false, flipV: false, brightness: 100, contrast: 100, saturation: 100 }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

function safeGet(key) {
  try { return localStorage.getItem(key) || ""; } catch { return ""; }
}

function safeSet(key, value) {
  try { localStorage.setItem(key, value); } catch {
    document.cookie = `${encodeURIComponent(key)}=${encodeURIComponent(value)}; max-age=31536000; path=/; SameSite=Lax`;
  }
}

document.addEventListener("DOMContentLoaded", init);

async function init() {
  setupCategorySelects();
  bindEvents();
  applyLanguage();
  try {
    state.db = await openDb();
    await migrateLegacyPhotos();
    state.photos = await getAllPhotos();
    render();
    autoSyncFromCloud();
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
    request.onsuccess = () => resolve(request.result.sort((a, b) => new Date(b.takenAt) - new Date(a.takenAt)));
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
  if (!state.db) { state.photos = state.photos.filter((p) => p.id !== id); return Promise.resolve(); }
  return new Promise((resolve, reject) => {
    const request = tx("readwrite").delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function setupCategorySelects() {
  $("#category-filter").innerHTML = [`<option value="">Alle</option>`, ...categories.map((c) => `<option>${c}</option>`)].join("");
  $("#detail-category").innerHTML = categories.map((c) => `<option>${c}</option>`).join("");
}

function bindEvents() {
  $$(".nav-tab").forEach((btn) => btn.addEventListener("click", () => switchView(btn.dataset.view)));
  $$(".quick-filter").forEach((btn) => btn.addEventListener("click", () => {
    state.quick = btn.dataset.quick;
    $$(".quick-filter").forEach((item) => item.classList.toggle("active", item === btn));
    switchView("gallery");
    render();
  }));
  ["search-input", "date-from", "date-to", "category-filter", "tag-filter"].forEach((id) => $(`#${id}`).addEventListener("input", render));
  $("#clear-filters").addEventListener("click", clearFilters);
  $$("[data-go-upload]").forEach((btn) => btn.addEventListener("click", () => switchView("upload")));
  $$(".density").forEach((btn) => btn.addEventListener("click", () => {
    $$(".density").forEach((item) => item.classList.toggle("active", item === btn));
    $("#gallery-grid").classList.toggle("compact", btn.dataset.density === "compact");
  }));

  const drop = $("#drop-zone");
  $("#file-input").addEventListener("change", (e) => handleFiles(e.target.files));
  ["dragenter", "dragover"].forEach((n) => drop.addEventListener(n, (e) => { e.preventDefault(); drop.classList.add("dragging"); }));
  ["dragleave", "drop"].forEach((n) => drop.addEventListener(n, (e) => { e.preventDefault(); drop.classList.remove("dragging"); }));
  drop.addEventListener("drop", (e) => handleFiles(e.dataTransfer.files));

  $("#close-detail").addEventListener("click", closeDetail);
  $("#detail-form").addEventListener("submit", saveDetails);
  $("#favorite-toggle").addEventListener("click", toggleSelectedFavorite);
  $("#delete-photo").addEventListener("click", deleteSelected);
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
  $("#api-endpoint").value = DEFAULT_API_ENDPOINT;
  $("#api-endpoint").readOnly = true;
  $("#cloud-provider").addEventListener("change", () => safeSet("foodporn-cloud-provider", $("#cloud-provider").value));
  $("#cloud-test").addEventListener("click", testCloudConnection);
  $("#cloud-sync").addEventListener("click", () => syncFromCloud());
  updateCloudStatus();
  bindLightboxEvents();
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
  render();
}

// ─── Cloud Utilities ──────────────────────────────────────────────

function getApiEndpoint() {
  return DEFAULT_API_ENDPOINT;
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

// Weckt den Render-Server auf und wartet bis er antwortet (max 90s)
async function ensureServerAwake(endpoint) {
  const maxWait = 90000;
  const requestTimeout = 8000;
  const retryDelay = 3000;
  const start = Date.now();
  setCloudStatus("⏳ Render-Server wird gestartet (kann bis zu 90s dauern)...", "#e67e22");
  while (Date.now() - start < maxWait) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), requestTimeout);
      const res = await fetch(`${endpoint}/health`, { cache: "no-store", signal: controller.signal });
      clearTimeout(timer);
      if (res.ok) {
        setCloudStatus("✓ Server bereit.", "#27ae60");
        return true;
      }
    } catch {
      // noch nicht bereit, weiter warten
    }
    const elapsed = Math.round((Date.now() - start) / 1000);
    const remaining = Math.round((maxWait - (Date.now() - start)) / 1000);
    if (remaining > 0) setCloudStatus(`⏳ Warte auf Server... (${elapsed}s / max 90s)`, "#e67e22");
    await new Promise((r) => setTimeout(r, retryDelay));
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
  } catch (error) {
    clearTimeout(timer);
    throw error;
  }
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

async function autoSyncFromCloud() {
  const endpoint = getApiEndpoint();
  if (!endpoint) return;
  try { await syncFromCloud({ silent: true }); } catch { /* ignorieren beim Start */ }
}

async function syncFromCloud(options = {}) {
  const endpoint = getApiEndpoint();
  if (!endpoint) {
    if (!options.silent) alert("Bitte zuerst den API-Endpunkt eintragen.");
    return;
  }

  // Schritt 1: Server wecken
  const awake = await ensureServerAwake(endpoint);
  if (!awake) {
    if (!options.silent) setCloudStatus("✗ Server antwortet nicht. Bitte später erneut versuchen.", "#c0392b");
    return;
  }

  // Schritt 2: Fotos laden
  setCloudStatus("☁ Lade Fotos aus der Cloud...", "#e67e22");
  let cloudPhotos;
  try {
    const res = await fetchWithTimeout(`${endpoint}/api/photos`, { cache: "no-store" }, 30000);
    cloudPhotos = await res.json();
  } catch (error) {
    setCloudStatus(`✗ Sync fehlgeschlagen: ${error.message}`, "#c0392b");
    return;
  }

  // Schritt 3: Mergen
  let imported = 0;
  for (const cloudPhoto of cloudPhotos.photos || []) {
    const existing = state.photos.find((p) => p.cloudObject === cloudPhoto.cloudObject || p.id === cloudPhoto.id);
    const merged = {
      id: cloudPhoto.id || crypto.randomUUID(),
      name: cloudPhoto.name || getCloudObjectFileName(cloudPhoto.cloudObject) || "cloud-photo.jpg",
      type: cloudPhoto.type || "image/jpeg",
      dataUrl: cloudPhoto.cloudUrl,
      takenAt: cloudPhoto.takenAt || cloudPhoto.createdAt || new Date().toISOString(),
      camera: cloudPhoto.camera || "Unbekannt",
      category: cloudPhoto.category || "Sonstiges",
      tags: Array.isArray(cloudPhoto.tags) ? cloudPhoto.tags : parseTags(cloudPhoto.tags),
      description: cloudPhoto.description || "",
      favorite: cloudPhoto.favorite === true || cloudPhoto.favorite === "true",
      createdAt: cloudPhoto.createdAt || new Date().toISOString(),
      storage: "gcs",
      cloudObject: cloudPhoto.cloudObject,
      cloudUrl: cloudPhoto.cloudUrl,
      editedAt: cloudPhoto.editedAt || cloudPhoto.updatedAt || cloudPhoto.createdAt
    };
    if (existing) { Object.assign(existing, merged); await savePhoto(existing); }
    else { await savePhoto(merged); state.photos.push(merged); imported++; }
  }

  state.photos = await getAllPhotos();
  render();
  if (!options.silent) switchView("gallery");
  setCloudStatus(`✓ Sync abgeschlossen. ${imported} neue Bilder. Insgesamt: ${state.photos.length}.`, "#27ae60");
}

// ─── Upload ───────────────────────────────────────────────────────

async function wakeUpRender(endpoint) {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    await fetch(`${endpoint}/health`, { method: "GET", cache: "no-store", signal: ctrl.signal });
    clearTimeout(timer);
  } catch { /* ignorieren */ }
}

function setUploadItemStatus(item, text, isError = false) {
  const strong = item.querySelector("strong");
  if (!strong) return;
  strong.textContent = text;
  strong.style.color = isError ? "#c0392b" : "";
}

async function handleFiles(fileList) {
  const files = Array.from(fileList).filter(isSupportedImageFile);
  const uploadList = $("#upload-list");
  if (!files.length) {
    const item = document.createElement("div");
    item.className = "upload-item";
    item.innerHTML = `<span>Keine unterstützten Bilder ausgewählt</span><strong>Hinweis</strong>`;
    uploadList.prepend(item);
    return;
  }

  const endpoint = getApiEndpoint();
  if (endpoint) wakeUpRender(endpoint);

  for (const file of files) {
    const item = document.createElement("div");
    item.className = "upload-item";
    item.innerHTML = `<span>${escapeHtml(file.name)}</span><strong>Import...</strong>`;
    uploadList.prepend(item);

    let dataUrl, buffer;
    try {
      [dataUrl, buffer] = await Promise.all([createLocalPreview(file), readAsArrayBuffer(file)]);
    } catch (error) {
      setUploadItemStatus(item, `Lesefehler: ${error.message}`, true);
      continue;
    }

    const exif = parseExif(buffer);
    const created = exif.takenAt || new Date(file.lastModified || Date.now()).toISOString();
    const photo = {
      id: crypto.randomUUID(),
      name: file.name,
      type: normalizeImageType(file.type),
      dataUrl,
      takenAt: created,
      camera: [exif.make, exif.model].filter(Boolean).join(" ") || "Unbekannt",
      category: suggestCategory(created),
      tags: suggestTags(file.name),
      description: "",
      favorite: false,
      createdAt: new Date().toISOString(),
      storage: "local"
    };

    if (endpoint) {
      setUploadItemStatus(item, "Cloud-Upload...");
      try {
        const cloud = await uploadPhotoToCloud(file, photo);
        if (cloud) {
          photo.storage = "gcs";
          photo.cloudObject = cloud.objectName;
          photo.cloudUrl = cloud.url;
          delete photo.cloudError;
        }
      } catch (error) {
        photo.storage = "local";
        photo.cloudError = error.message;
        setUploadItemStatus(item, "Cloud fehlgeschlagen — lokal gespeichert", true);
        item.title = `Cloud-Fehler: ${error.message}`;
        console.error("[Cloud-Upload]", file.name, error);
      }
    }

    await savePhotoBestEffort(photo, item);
  }

  render();
  switchView("gallery");
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
  form.append("metadata", JSON.stringify(withoutDataUrl(photo)));
  const res = await fetchWithTimeout(`${endpoint}/api/photos/upload`, { method: "POST", body: form }, 45000);
  return res.json();
}

async function uploadEditedImageToCloud(blob, photo) {
  const endpoint = getApiEndpoint();
  if (!endpoint) return null;
  const form = new FormData();
  form.append("image", blob, photo.name || "edited-image.jpg");
  form.append("metadata", JSON.stringify(withoutDataUrl(photo)));
  if (photo.cloudObject) form.append("replaceObjectName", photo.cloudObject);
  const res = await fetchWithTimeout(`${endpoint}/api/photos/upload`, { method: "POST", body: form }, 45000);
  return res.json();
}

// ─── Image helpers ────────────────────────────────────────────────

function isSupportedImageFile(file) {
  const name = (file.name || "").toLowerCase();
  return (file.type || "").startsWith("image/") || name.endsWith(".heic") || name.endsWith(".heif");
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
  const parts = String(objectName).split("/");
  return parts[parts.length - 1];
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
  const raw = await readAsDataUrl(file);
  return resizeDataUrl(raw, 1800, file.type || "image/jpeg", 0.84);
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
  state.filtered = filterPhotos();
  renderGallery();
  renderStats();
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
    const haystack = [photo.name, photo.category, photo.description, photo.camera, ...(photo.tags || [])].join(" ").toLowerCase();
    if (state.quick === "favorites" && !photo.favorite) return false;
    if (state.quick === "untagged" && photo.tags.length) return false;
    if (state.quick === "thisMonth" && (date.getMonth() !== now.getMonth() || date.getFullYear() !== now.getFullYear())) return false;
    if (query && !haystack.includes(query)) return false;
    if (from && date < from) return false;
    if (to && date > to) return false;
    if (category && photo.category !== category) return false;
    if (tag && !photo.tags.some((t) => t.toLowerCase().includes(tag))) return false;
    return true;
  });
}

function renderGallery() {
  const grid = $("#gallery-grid");
  grid.innerHTML = "";
  $("#result-count").textContent = `${state.filtered.length} Foto${state.filtered.length === 1 ? "" : "s"}`;
  $("#empty-state").classList.toggle("hidden", state.filtered.length > 0);
  state.filtered.forEach((photo) => {
    const node = $("#photo-card-template").content.firstElementChild.cloneNode(true);
    const imgEl = node.querySelector("img");
    imgEl.src = getDisplayImageUrl(photo);
    imgEl.alt = photo.description || photo.name;
    imgEl.onerror = () => { if (photo.cloudUrl && imgEl.src !== photo.cloudUrl) imgEl.src = photo.cloudUrl; };
    node.querySelector("h3").textContent = photo.category;
    node.querySelector("p").textContent = formatDate(photo.takenAt);
    node.querySelector(".favorite-star").textContent = photo.favorite ? "★" : "☆";
    node.querySelector(".photo-open").addEventListener("click", () => openLightbox(photo.id));
    node.querySelector(".card-fullscreen").addEventListener("click", () => openLightbox(photo.id));
    node.querySelector(".card-details").addEventListener("click", () => openDetail(photo.id));
    node.querySelector(".favorite-star").addEventListener("click", async () => {
      photo.favorite = !photo.favorite;
      await savePhoto(photo);
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
}

function formatDate(iso) {
  return new Intl.DateTimeFormat(state.lang === "de" ? "de-DE" : "en-US", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
}

function getDisplayImageUrl(photo) {
  const url = photo.dataUrl || photo.cloudUrl || "";
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  // Signierte GCS/S3-URLs dürfen keine extra Parameter bekommen (Signatur wird sonst ungültig)
  if (url.includes("X-Goog-") || url.includes("X-Amz-")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}v=${encodeURIComponent(photo.editedAt || photo.createdAt || "")}`;
}

// ─── Detail Panel ────────────────────────────────────────────────

function openDetail(id) {
  const photo = state.photos.find((item) => item.id === id);
  if (!photo) return;
  state.selectedId = id;
  resetEditState();
  $("#detail-description").value = photo.description || "";
  $("#detail-category").value = photo.category;
  $("#detail-tags").value = (photo.tags || []).join(", ");
  $("#detail-date").value = toLocalInput(photo.takenAt);
  $("#detail-camera").textContent = photo.camera || "-";
  $("#detail-file").textContent = photo.name;
  $("#favorite-toggle").textContent = photo.favorite ? "★ Favorit" : "☆ Favorit";
  $("#detail-panel").classList.add("open");
  $("#detail-panel").setAttribute("aria-hidden", "false");
  drawSelectedImage();
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
  photo.description = $("#detail-description").value.trim();
  photo.category = $("#detail-category").value;
  photo.tags = $("#detail-tags").value.split(",").map((t) => t.trim()).filter(Boolean);
  photo.takenAt = new Date($("#detail-date").value).toISOString();
  await savePhoto(photo);
  state.photos = await getAllPhotos();
  render();
  closeDetail();
}

function getSelected() { return state.photos.find((p) => p.id === state.selectedId); }

async function toggleSelectedFavorite() {
  const photo = getSelected();
  if (!photo) return;
  photo.favorite = !photo.favorite;
  await savePhoto(photo);
  $("#favorite-toggle").textContent = photo.favorite ? "★ Favorit" : "☆ Favorit";
  render();
}

async function deleteSelected() {
  const photo = getSelected();
  if (!photo || !confirm("Dieses Foto wirklich löschen?")) return;
  if (photo.cloudObject) {
    setCloudStatus("⏳ Aus Cloud löschen...", "#e67e22");
    const awake = await ensureServerAwake(DEFAULT_API_ENDPOINT);
    if (awake) {
      try {
        await fetchWithTimeout(`${DEFAULT_API_ENDPOINT}/api/photos/${photo.cloudObject}`, { method: "DELETE" }, 30000);
        setCloudStatus("✓ Aus Cloud gelöscht.", "#27ae60");
      } catch (error) {
        setCloudStatus(`⚠ Cloud-Löschen fehlgeschlagen: ${error.message}`, "#c0392b");
        console.error("[Cloud-Delete]", error);
      }
    } else {
      setCloudStatus("⚠ Server nicht erreichbar – nur lokal gelöscht.", "#c0392b");
    }
  }
  await removePhoto(photo.id);
  state.photos = state.photos.filter((item) => item.id !== photo.id);
  render();
  closeDetail();
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

function drawSelectedImage() {
  const photo = getSelected();
  if (!photo) return;
  const img = new Image();
  img.onload = () => {
    const canvas = $("#edit-canvas");
    const ctx = canvas.getContext("2d");
    const sourceSize = state.edit.cropSquare ? Math.min(img.width, img.height) : null;
    const sx = sourceSize ? (img.width - sourceSize) / 2 : 0;
    const sy = sourceSize ? (img.height - sourceSize) / 2 : 0;
    const sw = sourceSize || img.width;
    const sh = sourceSize || img.height;
    const rotated = Math.abs(state.edit.rotation % 180) === 90;
    canvas.width = rotated ? sh : sw;
    canvas.height = rotated ? sw : sh;
    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((state.edit.rotation * Math.PI) / 180);
    ctx.scale(state.edit.flipH ? -1 : 1, state.edit.flipV ? -1 : 1);
    ctx.filter = buildCanvasFilter();
    ctx.drawImage(img, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
    ctx.restore();
  };
  img.src = photo.dataUrl;
}

function buildCanvasFilter() {
  const filters = [`brightness(${state.edit.brightness}%)`, `contrast(${state.edit.contrast}%)`, `saturate(${state.edit.saturation}%)`];
  if (state.edit.filter === "warm") filters.push("sepia(18%)", "saturate(118%)");
  if (state.edit.filter === "mono") filters.push("grayscale(100%)", "contrast(108%)");
  return filters.join(" ");
}

async function saveEditedImage() {
  const photo = getSelected();
  if (!photo) return;
  const canvas = $("#edit-canvas");
  photo.dataUrl = canvas.toDataURL(photo.type || "image/jpeg", 0.92);
  photo.editedAt = new Date().toISOString();
  if (getApiEndpoint()) {
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, photo.type || "image/jpeg", 0.92));
    try {
      const cloud = await uploadEditedImageToCloud(blob, photo);
      if (cloud) { photo.storage = "gcs"; photo.cloudObject = cloud.objectName; photo.cloudUrl = cloud.url; delete photo.cloudError; }
    } catch (error) {
      photo.cloudError = error.message;
      console.error("[Cloud-Upload bearbeitetes Bild]", error);
    }
  }
  await savePhoto(photo);
  state.photos = await getAllPhotos();
  resetEditState();
  render();
  closeDetail();
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
  const zipFiles = files.map((p) => ({ name: safeFileName(`${p.category}-${p.name}`), data: base64ToUint8(p.dataUrl) }));
  zipFiles.push({ name: "metadata.json", data: new TextEncoder().encode(JSON.stringify(files.map(withoutDataUrl), null, 2)) });
  downloadBlob(new Blob([createZip(zipFiles)], { type: "application/zip" }), `foodporn-export-${new Date().toISOString().slice(0, 10)}.zip`);
}

function withoutDataUrl(photo) { const { dataUrl, ...meta } = photo; return meta; }

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
  link.href = url; link.download = filename; link.click();
  URL.revokeObjectURL(url);
}

async function shareApp() {
  const text = `Foodporn: ${state.filtered.length} gefilterte Food-Fotos`;
  if (navigator.share) await navigator.share({ title: "Foodporn", text, url: location.href });
  else { await navigator.clipboard.writeText(location.href); alert("Link wurde in die Zwischenablage kopiert."); }
}

function safeFileName(name) { return name.replace(/[^a-z0-9._-]+/gi, "-").replace(/-+/g, "-"); }

// ─── Lightbox ─────────────────────────────────────────────────

let lightboxIndex = 0;

function openLightbox(id) {
  const idx = state.filtered.findIndex((p) => p.id === id);
  if (idx === -1) return;
  lightboxIndex = idx;
  renderLightbox();
  $("#lightbox").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeLightbox() {
  $("#lightbox").classList.add("hidden");
  document.body.style.overflow = "";
}

function lightboxNav(dir) {
  lightboxIndex = (lightboxIndex + dir + state.filtered.length) % state.filtered.length;
  renderLightbox();
}

function renderLightbox() {
  const photo = state.filtered[lightboxIndex];
  if (!photo) return;
  const img = $("#lightbox-img");
  img.src = getDisplayImageUrl(photo);
  img.alt = photo.description || photo.name;
  $("#lightbox-caption").textContent = `${photo.category} · ${formatDate(photo.takenAt)} · ${lightboxIndex + 1} / ${state.filtered.length}`;
  $("#lightbox-prev").style.display = state.filtered.length > 1 ? "" : "none";
  $("#lightbox-next").style.display = state.filtered.length > 1 ? "" : "none";
  $("#lightbox-detail").onclick = () => { closeLightbox(); openDetail(photo.id); };
}

function bindLightboxEvents() {
  $("#lightbox-close").addEventListener("click", closeLightbox);
  $("#lightbox-prev").addEventListener("click", () => lightboxNav(-1));
  $("#lightbox-next").addEventListener("click", () => lightboxNav(1));
  $("#lightbox").addEventListener("click", (e) => { if (e.target === $("#lightbox") || e.target === $("#lightbox-img-wrap")) closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if ($("#lightbox").classList.contains("hidden")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") lightboxNav(-1);
    if (e.key === "ArrowRight") lightboxNav(1);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}
