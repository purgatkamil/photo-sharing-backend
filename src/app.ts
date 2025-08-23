import "dotenv/config";
import express from "express";
import morgan from "morgan";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import mime from "mime-types";
import path from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import fs from "fs";
import { fileTypeFromFile } from "file-type";

import { initStorage, tokenDir, DATA_DIR, THUMBS_DIR } from "./services/storage.js";
import { prisma, findTableByToken } from "./services/db.js";
import { handleUpload } from "./controllers/uploadController.js";
import { getGallery } from "./controllers/galleryController.js";
import { registerClient, notifyTable } from "./services/sse.js"

const ALLOWED_MIME = new Set<string>([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initStorage();

const app = express();
app.use(morgan("dev"));
app.use(express.json());

if (process.env.NODE_ENV !== "production") {
  app.use(cors({ origin: "http://localhost:5173", credentials: false }));
}

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
    const token = (req.params as { token?: string }).token as string;
    const dir = tokenDir(token);
    import("./services/storage.js")
      .then(({ ensureDir }) => {
        ensureDir(dir);
        cb(null, dir);
      })
      .catch((e) => cb(e as Error, dir));
  },
  filename: (_req, file, cb) => {
    const ext = (mime.extension(file.mimetype) || "bin").toString();
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
  const { token } = req.params as { token: string };
  const table = await findTableByToken(token);
  if (!table) return res.status(404).json({ error: "Unknown token" });

  uploadMw(req, res, async (err) => {
    if (err) return res.status(400).json({ error: (err as Error).message });

    const files = (req.files as Express.Multer.File[]) || [];

    const safeFiles: Express.Multer.File[] = [];
    const rejected: Array<{ name: string; reason: string }> = [];

    for (const f of files) {
      try {
        const detected = await fileTypeFromFile(f.path);
        const mime = detected?.mime;

        if (!mime || !ALLOWED_MIME.has(mime)) {
          try { fs.unlinkSync(f.path); } catch {}
          rejected.push({
            name: f.originalname,
            reason: mime ? `Not allowed mime: ${mime}` : "Unknown/undetected type",
          });
          continue;
        }

        safeFiles.push(f);
      } catch {
        try { fs.unlinkSync(f.path); } catch {}
        rejected.push({ name: f.originalname, reason: "Type detection error" });
      }
    }

    if (safeFiles.length === 0) {
      return res.status(400).json({
        error: "All files rejected by content-type validation",
        rejected,
      });
    }

    const result = await handleUpload(
      { id: table.id, token: table.token },
      safeFiles
    );

    notifyTable(table.token, { type: "new-photos" });

    if (rejected.length > 0) {
      return res.json({ ...result, rejected });
    }

    res.json(result);
  });
});

app.get("/gallery/:token", async (req, res) => {
  const { token } = req.params as { token: string };
  const table = await findTableByToken(token);
  if (!table) return res.status(404).json({ error: "Unknown token" });
  const payload = await getGallery({ id: table.id, token: table.token });
  res.json(payload);
});

app.get("/events/:token", async (req, res) => {
  const { token } = req.params as { token: string }
  const ok = await registerClient(token, res)
  if (!ok) return res.status(404).json({ error: "Unknown token" })
})

const FRONTEND_DIR = path.resolve(__dirname, "../../frontend/dist");

if (fs.existsSync(FRONTEND_DIR)) {
  app.use(express.static(FRONTEND_DIR));

  const apiPrefixes = /^(\/(images|thumbs|upload|gallery|health|qr)\b)/;
  app.use((req, res, next) => {

    if (apiPrefixes.test(req.path)) return next();
    if (req.method !== "GET") return next();
    res.sendFile(path.join(FRONTEND_DIR, "index.html"));
  });
}

export default app;
