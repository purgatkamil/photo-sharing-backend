import { listUploadsByTableId } from "../services/db.js";
import { buildOriginalUrl, buildThumbUrl } from "../services/storage.js";

export type TableRef = { id: number; token: string };

export async function getGallery(table: TableRef) {
  const uploads = await listUploadsByTableId(table.id, 200);
  const items = uploads.map((u) => ({
    id: u.id,
    createdAt: u.createdAt,
    original: buildOriginalUrl(table.token, u.storedName),
    thumb: buildThumbUrl(table.token, u.storedName),
  }));
  return { token: table.token, items };
}
