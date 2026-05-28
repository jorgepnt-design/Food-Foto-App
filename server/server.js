import express from "express";
import cors from "cors";
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
const allowedOrigins = (process.env.CORS_ORIGIN || "*").split(",").map((origin) => origin.trim());

if (!bucketName) {
  throw new Error("GCS_BUCKET_NAME is required");
}

const storage = new Storage(getStorageOptions());
const bucket = storage.bucket(bucketName);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Origin not allowed by CORS"));
  }
}));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({ ok: true, storage: "google-cloud-storage", bucket: bucketName });
});

app.post("/api/photos/upload", upload.single("image"), async (req, res, next) => {
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

app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).json({ error: "server_error", message: error.message });
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
