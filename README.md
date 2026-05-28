# MealVault - Food Foto Organizer

Statische Web-App für das Repository `jorgepnt-design/Food-Foto-App`.

## Start

Die App ist ohne Build-Schritt lauffähig:

1. `index.html` im Browser öffnen
2. Food-Fotos hochladen
3. Kategorien, Tags und Beschreibungen pflegen

## Funktionen

- Drag-and-Drop-Upload mehrerer Bilder
- Speicherung im Browser per IndexedDB
- JPEG-EXIF-Auswertung für Aufnahmedatum, Kamerahersteller und Modell
- Kategorien, Tags, Beschreibungen und Favoriten
- Filter nach Datum, Kategorie, Tags und Volltextsuche
- Galerie- und Detailansicht
- einfache Bildbearbeitung: drehen, quadratisch zuschneiden, warmer Filter, Schwarz-Weiß
- Statistik-Dashboard
- ZIP-Export inklusive `metadata.json`
- Teilen per Web Share API oder Zwischenablage
- Deutsch/Englisch-Umschaltung
- Vercel-geeignete Static-Site-Struktur
- optionaler Cloud-Upload nach Google Cloud Storage über ein Render-Backend

## Frontend-Deployment auf Vercel

Bei Vercel als Projekt-Root dieses Repository wählen. Es ist kein Build Command nötig, weil `index.html`, `styles.css` und `app.js` direkt ausgeliefert werden.

## Cloud-Speicherung mit Google Cloud Storage und Render

Der Ordner `server/` enthält eine Render-fähige Node/Express-API. Sie nimmt Bild-Uploads entgegen und speichert die Dateien in Google Cloud Storage.

Benötigte Render-Umgebungsvariablen:

- `GCS_BUCKET_NAME`: Name des Buckets
- `GCP_PROJECT_ID`: Google-Cloud-Projekt
- `GOOGLE_APPLICATION_CREDENTIALS_JSON`: Service-Account-JSON als Secret
- `CORS_ORIGIN`: erlaubte Frontend-URL, z. B. `https://jorgepnt-design.github.io`
- `MAX_UPLOAD_MB`: Upload-Limit, Standard `25`

Der Service Account braucht mindestens Schreibrechte auf den Bucket, z. B. die Rolle `Storage Object Admin` für diesen Bucket. Wenn der Bucket privat bleibt, liefert die API signierte Lese-URLs zurück. Wenn du öffentliche oder CDN-URLs nutzen willst, setze zusätzlich `GCS_PUBLIC_BASE_URL`.

In der App unter `Einstellungen` den Render-API-Endpunkt eintragen, z. B. `https://food-foto-app-api.onrender.com`. Ab dann werden neue und bearbeitete Bilder zusätzlich in Google Cloud Storage gespeichert.

Für die nächste Ausbaustufe sollten Metadaten zusätzlich in PostgreSQL gespeichert und OAuth/Auth0 aktiviert werden.
