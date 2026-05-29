import express from "express";
import multer from "multer";
import { Storage } from "@google-cloud/storage";
import crypto from "node:crypto";

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: Number(process.env.MAX_UPLOAD_MB || 25) * 1024 * 1024 }
});

const bucketName = process.env.GCS_BUCKET_NAME;
const publicBaseUrl = process.env.GCS_PUBLIC_BASE_URL;
const allowedOrigins = (process.env.CORS_ORIGIN || "*")
  .split(",")
  .map(normalizeAllowedOrigin)
  .filter(Boolean);

const storage = bucketName ? new Storage(getStorageOptions()) : null;
const bucket = bucketName ? storage.bucket(bucketName) : null;

app.use((req, res, next) => {
  const origin = normalizeAllowedOrigin(req.headers.origin);
  const allowOrigin = !origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)
    ? (origin || "*")
    : allowedOrigins[0] || "*";
  res.setHeader("Access-Control-Allow-Origin", allowOrigin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.json({
    ok: true,
    app: "Foodporn API",
    routes: ["/health", "/api/photos", "/api/photos/upload", "/api/debug/storage"],
    bucket: bucketName
  });
});

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    storage: "google-cloud-storage",
    bucket: bucketName || null,
    configured: Boolean(bucketName),
    projectId: process.env.GCP_PROJECT_ID || null,
    hasCredentials: Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON)
  });
});

app.get("/api/debug/storage", async (req, res, next) => {
  if (!bucket) return res.status(503).json({ error: "GCS_BUCKET_NAME not configured" });
  try {
    const [exists] = await bucket.exists();
    const [files] = exists ? await bucket.getFiles({ prefix: "food-photos/", maxResults: 5 }) : [[]];
    res.json({
      ok: true,
      bucket: bucketName,
      exists,
      sampleCount: files.length,
      sampleObjects: files.map((file) => file.name)
    });
  } catch (error) {
    next(error);
  }
});

app.post("/api/photos/upload", upload.single("image"), async (req, res, next) => {
  if (!bucket) return res.status(503).json({ error: "GCS_BUCKET_NAME not configured" });
  try {
    if (!req.file) return res.status(400).json({ error: "image file is required" });
    if (!req.file.mimetype.startsWith("image/")) return res.status(415).json({ error: "only image uploads are allowed" });

    const metadata = parseMetadata(req.body.metadata);
    const objectName = req.body.replaceObjectName || buildObjectName(req.file.originalname);
    const file = bucket.file(objectName);

    await file.save(req.file.buffer, {
      resumable: false,
      contentType: req.file.mimetype,
      metadata: {
        cacheControl: "private, max-age=3600",
        metadata: flattenMetadata(metadata)
      }
    });

    const url = await getReadableUrl(file, objectName);
    res.status(201).json({
      bucket: bucketName,
      objectName,
      url,
      size: req.file.size,
      contentType: req.file.mimetype
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/photos", async (req, res, next) => {
  if (!bucket) return res.json({ photos: [] });
  try {
    const [files] = await bucket.getFiles({ prefix: "food-photos/" });
    const photos = await Promise.all(files.map(async (file) => {
      const [metadata] = await file.getMetadata();
      const custom = metadata.metadata || {};
      return {
        ...custom,
        id: custom.id || file.name,
        name: custom.name || file.name.split("/").pop(),
        type: metadata.contentType || custom.type || "image/jpeg",
        createdAt: custom.createdAt || metadata.timeCreated,
        updatedAt: custom.editedAt || metadata.updated,
        takenAt: custom.takenAt || metadata.timeCreated,
        cloudObject: file.name,
        cloudUrl: await getReadableUrl(file, file.name)
      };
    }));
    res.json({ photos });
  } catch (error) {
    next(error);
  }
});

app.get("/api/photos/signed-url", async (req, res, next) => {
  try {
    const objectName = String(req.query.objectName || "");
    if (!objectName) return res.status(400).json({ error: "objectName is required" });
    const [url] = await bucket.file(objectName).getSignedUrl({
      version: "v4",
      action: "read",
      expires: Date.now() + 1000 * 60 * 60
    });
    res.json({ url });
  } catch (error) {
    next(error);
  }
});

const USER_EDITS_FILE = "user-edits.json";

async function readUserEdits() {
  if (!bucket) return {};
  try {
    const file = bucket.file(USER_EDITS_FILE);
    const [exists] = await file.exists();
    if (!exists) return {};
    const [contents] = await file.download();
    return JSON.parse(contents.toString("utf8"));
  } catch { return {}; }
}

async function writeUserEdits(edits) {
  const file = bucket.file(USER_EDITS_FILE);
  await file.save(JSON.stringify(edits, null, 2), {
    resumable: false,
    contentType: "application/json",
    metadata: { cacheControl: "no-store" }
  });
}

app.get("/api/user-edits", async (req, res, next) => {
  if (!bucket) return res.json({});
  try {
    res.json(await readUserEdits());
  } catch (error) { next(error); }
});

app.put("/api/user-edits", async (req, res, next) => {
  if (!bucket) return res.status(503).json({ error: "GCS_BUCKET_NAME not configured" });
  try {
    const { id, edits } = req.body;
    if (!id) return res.status(400).json({ error: "id is required" });
    const all = await readUserEdits();
    all[id] = { ...(all[id] || {}), ...edits, updatedAt: new Date().toISOString() };
    await writeUserEdits(all);
    res.json({ ok: true, id });
  } catch (error) { next(error); }
});

app.delete("/api/photos", async (req, res, next) => {
  if (!bucket) return res.status(503).json({ error: "GCS_BUCKET_NAME not configured" });
  try {
    const objectName = String(req.query.objectName || "");
    if (!objectName) return res.status(400).json({ error: "objectName query param is required" });
    console.log("[DELETE]", objectName);
    await bucket.file(objectName).delete({ ignoreNotFound: true });
    res.json({ ok: true, deleted: objectName });
  } catch (error) {
    next(error);
  }
});

app.use((req, res) => {
  res.status(404).json({
    error: "not_found",
    path: req.path,
    app: "Foodporn API",
    availableRoutes: ["/", "/health", "/api/photos", "/api/photos/upload", "/api/debug/storage"]
  });
});

app.use((error, req, res, next) => {
  console.error(error);
  const status = error.code === 403 ? 403 : error.code === 404 ? 404 : 500;
  res.status(status).json({
    error: "server_error",
    message: error.message,
    code: error.code || null,
    bucket: bucketName
  });
});

const port = process.env.PORT || 10000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Food Foto API listening on ${port}`);
});

function getStorageOptions() {
  const rawCredentials = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (!rawCredentials) return {};
  const json = rawCredentials.trim().startsWith("{")
    ? rawCredentials
    : Buffer.from(rawCredentials, "base64").toString("utf8");
  const credentials = JSON.parse(json);
  return {
    projectId: process.env.GCP_PROJECT_ID || credentials.project_id,
    credentials
  };
}

function normalizeAllowedOrigin(origin) {
  if (!origin || origin === "*") return origin || "";
  try {
    return new URL(origin).origin;
  } catch {
    return String(origin).replace(/\/$/, "");
  }
}

function parseMetadata(value) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function flattenMetadata(metadata) {
  return Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, Array.isArray(value) ? value.join(",") : String(value)])
  );
}

function buildObjectName(originalName) {
  const extension = originalName.includes(".") ? originalName.split(".").pop().toLowerCase() : "jpg";
  const id = crypto.randomUUID();
  const date = new Date().toISOString().slice(0, 10);
  return `food-photos/${date}/${id}.${extension}`;
}

async function getReadableUrl(file, objectName) {
  if (publicBaseUrl) return `${publicBaseUrl.replace(/\/$/, "")}/${objectName}`;
  const [url] = await file.getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7
  });
  return url;
}
