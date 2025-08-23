import "dotenv/config";
import express from "express";
import morgan from "morgan";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
import mime from "mime-types";
import path from "path";
import { fileURLToPath } from "url";

import { initStorage, tokenDir, DATA_DIR, THUMBS_DIR } from "./services/storage.js";
import { prisma, findTableByToken } from "./services/db.js";
import { handleUpload } from "./controllers/uploadController.js";
import { getGallery } from "./controllers/galleryController.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

initStorage();

const app = express();
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
    const token = (req.params as { token?: string }).token as string;
    const dir = tokenDir(token);
    try {
      import("./services/storage.js").then(({ ensureDir }) => {
        ensureDir(dir);
        cb(null, dir);
      }).catch((e) => cb(e as Error, dir));
    } catch (e) {
      cb(e as Error, dir);
    }
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
    const result = await handleUpload({ id: table.id, token: table.token }, files);
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

export default app;
