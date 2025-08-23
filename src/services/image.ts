import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

export async function sanitizeOriginal(
  filePath: string,
  mime: string
): Promise<{ bytesBefore: number; bytesAfter: number; width: number; height: number; format: string }> {
  const statBefore = await fs.stat(filePath);
  const img = sharp(filePath, { failOn: "none" });
  const meta = await img.metadata();

  let pipeline = img.rotate();
  switch (mime) {
    case "image/jpeg":
      pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true });
      break;
    case "image/png":
      pipeline = pipeline.png({ compressionLevel: 9, palette: true });
      break;
    case "image/webp":
      pipeline = pipeline.webp({ quality: 85, nearLossless: true });
      break;
    default:
      pipeline = pipeline.toFormat(meta.format as any);
  }

  const tmp = filePath + ".clean";
  await pipeline.toFile(tmp);
  await fs.rename(tmp, filePath);

  const statAfter = await fs.stat(filePath);
  return {
    bytesBefore: statBefore.size,
    bytesAfter: statAfter.size,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    format: (meta.format ?? "unknown").toString(),
  };
}

export async function generateThumb(srcPath: string, destPath: string) {
  const img = sharp(srcPath);
  const meta = await img.metadata();
  await img
    .rotate()
    .resize({ width: 800, withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toFile(destPath);
  return { width: meta.width ?? 0, height: meta.height ?? 0 };
}
