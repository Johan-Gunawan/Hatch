import "server-only";
import { serverFetch } from "./server-client";

export interface CompanySummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  website: string | null;
}

export function listCompanies(limit = 50): Promise<CompanySummary[]> {
  return serverFetch<CompanySummary[]>(`/api/companies?limit=${limit}`);
}
