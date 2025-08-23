import "dotenv/config";
import express from "express";
import morgan from "morgan";
import { PrismaClient } from "@prisma/client";
import multer from "multer";
import sharp from "sharp";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { fileURLToPath } from "url";
import mime from "mime-types";
import fs from "fs";
import { DATA_DIR, THUMBS_DIR, tokenDir, tokenThumbDir, ensureDir, initStorage } from "./files.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

initStorage();

app.use(morgan("dev"));
app.use(express.json());

app.use("/images", express.static(DATA_DIR));
app.use("/thumbs", express.static(THUMBS_DIR));

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "up" });
  } catch {
    res.status(500).json({ status: "error", db: "down" });
  }
});

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const token = req.params.token as string;
    const dir = tokenDir(token);
    try {
      ensureDir(dir);
      cb(null, dir);
    } catch (e) {
      cb(e as Error, dir);
    }
  },
  filename: (_req, file, cb) => {
    const ext = mime.extension(file.mimetype) || "bin";
    cb(null, `${uuidv4()}.${ext}`);
  },
});

const uploadMw = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) return cb(null, true);
    cb(new Error("Only image uploads are allowed"));
  },
}).array("files", 10);

app.post("/upload/:token", async (req, res) => {
  const { token } = req.params;

  const table = await prisma.table.findFirst({ where: { token } });
  if (!table) return res.status(404).json({ error: "Unknown token" });

  uploadMw(req, res, async (err) => {
    if (err) return res.status(400).json({ error: err.message });

    const files = req.files as Express.Multer.File[] || [];
    const thumbDir = tokenThumbDir(token);
    ensureDir(thumbDir);

    const results = [];
    for (const f of files) {
      const srcPath = f.path;
      const destThumb = path.join(thumbDir, path.basename(f.filename));

      try {
        const img = sharp(srcPath);
        const meta = await img.metadata();
        await img
          .rotate()
          .resize({ width: 800, withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toFile(destThumb);

        const rec = await prisma.upload.create({
          data: {
            tableId: table.id,
            originalName: f.originalname,
            storedName: f.filename,
            mimeType: f.mimetype,
            size: f.size,
            width: meta.width || 0,
            height: meta.height || 0,
          },
        });

        results.push({
          id: rec.id,
          original: `/images/${token}/${f.filename}`,
          thumb: `/thumbs/${token}/${f.filename}`,
        });
      } catch (e) {
        console.error("Thumb/gen error", e);
      }
    }

    res.json({ ok: true, count: results.length, files: results });
  });
});

app.get("/gallery/:token", async (req, res) => {
  const { token } = req.params;
  const table = await prisma.table.findFirst({ where: { token } });
  if (!table) return res.status(404).json({ error: "Unknown token" });

  const uploads = await prisma.upload.findMany({
    where: { tableId: table.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const items = uploads.map(u => ({
    id: u.id,
    createdAt: u.createdAt,
    original: `/images/${token}/${u.storedName}`,
    thumb: `/thumbs/${token}/${u.storedName}`,
  }));

  res.json({ token, items });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
