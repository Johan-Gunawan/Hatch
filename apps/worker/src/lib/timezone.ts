import { env } from "../config/env.js";

// "YYYY-MM-DD" for the given instant, as a calendar day in `timeZone`.
export function getLocalDayString(date: Date, timeZone: string = env.timezone): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// UTC instant for local midnight on `date`'s calendar day in `timeZone`.
// Reads the real offset for that date (via Intl) rather than assuming a fixed
// one, so it stays correct for zones that observe DST.
export function getStartOfLocalDayUtc(date: Date, timeZone: string = env.timezone): Date {
  const dayString = getLocalDayString(date, timeZone);
  const offset = getUtcOffset(date, timeZone);
  return new Date(`${dayString}T00:00:00${offset}`);
}

function getUtcOffset(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(date);
  const offsetName = parts.find((part) => part.type === "timeZoneName")?.value ?? "GMT+00:00";
  return offsetName.replace("GMT", "") || "+00:00";
}
