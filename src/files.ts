import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const DATA_DIR = process.env.DATA_DIR ||
  path.resolve(__dirname, "../..", "data", "photos");
export const THUMBS_DIR = path.join(DATA_DIR, "_thumbs");

export function ensureDir(p: string) {
  fs.mkdirSync(p, { recursive: true });
}

export function tokenDir(token: string) {
  return path.join(DATA_DIR, token);
}

export function tokenThumbDir(token: string) {
  return path.join(THUMBS_DIR, token);
}

export function initStorage() {
  ensureDir(DATA_DIR);
  ensureDir(THUMBS_DIR);
}
