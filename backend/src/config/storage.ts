// src/config/storage.ts
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UPLOAD_ROOT = path.resolve(__dirname, "..", "storage", "uploads");