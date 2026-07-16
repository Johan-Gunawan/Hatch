import "server-only";
import { serverFetch } from "./server-client";

export interface Stats {
  companies: number;
  locations: number;
  activeJobs: number;
}

export function getStats(): Promise<Stats> {
  return serverFetch<Stats>("/api/stats");
}
