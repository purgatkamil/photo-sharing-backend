import path from "path";
import { ensureDir, tokenThumbDir, buildOriginalUrl, buildThumbUrl } from "../services/storage.js";
import { generateThumb, sanitizeOriginal } from "../services/image.js"; // ⬅️ dodano sanitizeOriginal
import { createUpload } from "../services/db.js";
import type { Express } from "express";
import { logEvent } from "../services/logger.js";

export type TableRef = { id: number; token: string };

export async function handleUpload(table: TableRef, files: Express.Multer.File[]) {
  const results: Array<{ id: number; original: string; thumb: string }> = [];
  const thumbDir = tokenThumbDir(table.token);
  ensureDir(thumbDir);

  for (const f of files) {
    const srcPath = f.path;
    const destThumb = path.join(thumbDir, path.basename(f.filename));

    try {
      const sani = await sanitizeOriginal(srcPath, f.mimetype);

      const meta = await generateThumb(srcPath, destThumb);

      const rec = await createUpload({
        tableId: table.id,
        originalName: f.originalname,
        storedName: f.filename,
        mimeType: f.mimetype,
        size: sani.bytesAfter,
        width: meta.width,
        height: meta.height,
      });

      await logEvent("upload_saved", {
        file: f.originalname,
        stored: f.filename,
        mime: f.mimetype,
        format: sani.format,
        bytesBefore: sani.bytesBefore,
        bytesAfter: sani.bytesAfter,
        width: sani.width,
        height: sani.height,
        uploadId: rec.id,
      }, table.id);
    
      results.push({
        id: rec.id,
        original: buildOriginalUrl(table.token, f.filename),
        thumb: buildThumbUrl(table.token, f.filename),
      });
    } catch (e) {
      await logEvent("upload_error", {
        file: f.originalname,
        stored: f.filename,
        error: (e as Error).message,
      }, table.id);
    }
  }

  return { ok: true, count: results.length, files: results };
}
