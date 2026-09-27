import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, "civicDocCache.json");

// Cache file initialize karein agar exist nahi karti
function initDb() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({}, null, 2));
  }
}

export function getCachedDoc(cacheKey) {
  initDb();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const data = JSON.parse(raw);
    const normalizedKey = cacheKey.toLowerCase().trim();
    if (data[normalizedKey]) {
      return { hit: true, data: data[normalizedKey] };
    }
  } catch (err) {
    console.error("DB Read Error:", err.message);
  }
  return { hit: false, data: null };
}

export function storeDocInDb(cacheKey, payload) {
  initDb();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const data = JSON.parse(raw);
    const normalizedKey = cacheKey.toLowerCase().trim();
    data[normalizedKey] = {
      ...payload,
      cachedAt: new Date().toISOString()
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("DB Write Error:", err.message);
    return false;
  }
}