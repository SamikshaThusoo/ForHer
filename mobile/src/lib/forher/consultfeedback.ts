import { storage } from "@/lib/storage";
// How a user rated a past consult. Keyed by `${day}:${service}` so each
// scheduled consult keeps its own rating.
const KEY = "forher.consultfeedback.v1";
type Feedback = Record<string, number>;

function read(): Feedback {
  try { const o = JSON.parse(storage.getItem(KEY) || "{}"); return o && typeof o === "object" ? o : {}; } catch { return {}; }
}

export function getRating(day: number, service: string): number {
  return read()[`${day}:${service}`] ?? 0;
}

export function setRating(day: number, service: string, rating: number) {
  const f = read();
  f[`${day}:${service}`] = rating;
  try { storage.setItem(KEY, JSON.stringify(f)); } catch { /* ignore */ }
}
