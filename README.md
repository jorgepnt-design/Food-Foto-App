# MealVault - Food Foto Organizer

Statische Web-App zum Organisieren, Filtern, Bearbeiten und Exportieren von Bildern gekochter Gerichte.

## Start

Öffne `index.html` direkt im Browser oder starte einen lokalen Server:

```powershell
python -m http.server 8080
```

Danach: `http://localhost:8080/food-photo-app/`

## Enthaltene Funktionen

- Drag-and-Drop-Upload für mehrere Bilder
- lokale Speicherung in IndexedDB
- automatisches Auslesen wichtiger JPEG-EXIF-Daten wie Datum, Hersteller und Modell
- Kategorien, Tags, Beschreibung, Favoriten
- Filter nach Datum, Kategorie, Tags und Volltextsuche
- Galerie- und Detailansicht
- einfache Bildbearbeitung: drehen, quadratisch zuschneiden, warmer Filter, Schwarz-Weiß
- Dashboard mit Kategorie- und Tag-Statistiken
- ZIP-Export inklusive Metadaten
- Teilen per Web Share API oder Link in Zwischenablage
- Deutsch/Englisch-Umschaltung
- Cloud/API-Konfigurationsbereich als Vorbereitung für Render, S3, Firebase oder Google Cloud

## Nächste Backend-Ausbaustufe

Für produktive Cloud-Speicherung sollte ein Backend mit Authentifizierung ergänzt werden:

- Node.js/Express oder Python/Flask
- PostgreSQL oder MongoDB für Metadaten
- Render als API-Host
- S3, Firebase Storage oder Google Cloud Storage für Originalbilder
- OAuth/Auth0 für Login
- serverseitige Verschlüsselung, Backup-Jobs und signierte Download-Links
