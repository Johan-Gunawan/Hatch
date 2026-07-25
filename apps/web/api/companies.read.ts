import "server-only";
import { maskCompanyName, maskUrl } from "@/lib/demo-mode";
import { serverFetch } from "./server-client";

export interface CompanySummary {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  website: string | null;
}

export async function listCompanies(limit = 50): Promise<CompanySummary[]> {
  const companies = await serverFetch<CompanySummary[]>(`/api/companies?limit=${limit}`);
  return companies.map((company) => ({
    ...company,
    name: maskCompanyName(company.name),
    website: maskUrl(company.website),
  }));
}
