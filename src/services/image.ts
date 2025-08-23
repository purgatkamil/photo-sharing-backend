import sharp from "sharp";

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
