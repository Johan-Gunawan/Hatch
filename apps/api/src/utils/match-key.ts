import { timingSafeEqual } from "node:crypto";

// Constant-time comparison guarded against length mismatch (timingSafeEqual
// throws when buffers differ in length).
export function matchesAnyKey(provided: string, keys: string[]): boolean {
  const providedBuf = Buffer.from(provided);
  let matched = false;
  for (const key of keys) {
    const keyBuf = Buffer.from(key);
    if (keyBuf.length === providedBuf.length && timingSafeEqual(keyBuf, providedBuf)) {
      matched = true;
    }
  }
  return matched;
}
