import { apiFetch } from "./client";

type ScrapeAccepted = { message: string };

export function triggerCompanyScrape(urls: string[]) {
  return apiFetch<ScrapeAccepted>("/api/companies/scrape", {
    method: "POST",
    body: JSON.stringify({ urls }),
  });
}
