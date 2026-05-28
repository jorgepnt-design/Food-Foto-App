# MealVault - Food Foto Organizer

Statische Web-App zum Organisieren, Filtern, Bearbeiten und Exportieren von Bildern gekochter Gerichte.

## Start

Oeffne `index.html` direkt im Browser oder starte einen lokalen Server:

```powershell
python -m http.server 8080
```

Danach: `http://localhost:8080/food-photo-app/`

## Enthaltene Funktionen

- Drag-and-Drop-Upload fuer mehrere Bilder
- lokale Speicherung in IndexedDB
- automatisches Auslesen wichtiger JPEG-EXIF-Daten wie Datum, Hersteller und Modell
- Kategorien, Tags, Beschreibung, Favoriten
- Filter nach Datum, Kategorie, Tags und Volltextsuche
- Galerie- und Detailansicht
- einfache Bildbearbeitung: drehen, quadratisch zuschneiden, warmer Filter, Schwarz-Weiss
- Dashboard mit Kategorie- und Tag-Statistiken
- ZIP-Export inklusive Metadaten
- Teilen per Web Share API oder Link in Zwischenablage
- Deutsch/Englisch-Umschaltung
- Cloud/API-Konfigurationsbereich als Vorbereitung fuer Render, S3, Firebase oder Google Cloud

## Naechste Backend-Ausbaustufe

Fuer produktive Cloud-Speicherung sollte ein Backend mit Authentifizierung ergaenzt werden:

- Node.js/Express oder Python/Flask
- PostgreSQL oder MongoDB fuer Metadaten
- Render als API-Host
- S3, Firebase Storage oder Google Cloud Storage fuer Originalbilder
- OAuth/Auth0 fuer Login
- serverseitige Verschluesselung, Backup-Jobs und signierte Download-Links
