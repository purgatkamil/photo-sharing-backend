import path from "path";
import { ensureDir, tokenThumbDir, buildOriginalUrl, buildThumbUrl } from "../services/storage.js";
import { generateThumb } from "../services/image.js";
import { createUpload } from "../services/db.js";
import type { Express } from "express";

export type TableRef = { id: number; token: string };

export async function handleUpload(table: TableRef, files: Express.Multer.File[]) {
  const results: Array<{ id: number; original: string; thumb: string }> = [];
  const thumbDir = tokenThumbDir(table.token);
  ensureDir(thumbDir);

  for (const f of files) {
    const srcPath = f.path;
    const destThumb = path.join(thumbDir, path.basename(f.filename));

    try {
      const meta = await generateThumb(srcPath, destThumb);

      const rec = await createUpload({
        tableId: table.id,
        originalName: f.originalname,
        storedName: f.filename,
        mimeType: f.mimetype,
        size: f.size,
        width: meta.width,
        height: meta.height,
      });

      results.push({
        id: rec.id,
        original: buildOriginalUrl(table.token, f.filename),
        thumb: buildThumbUrl(table.token, f.filename),
      });
    } catch (e) {
      console.error("Thumb/gen error", e);
    }
  }

  return { ok: true, count: results.length, files: results };
}
