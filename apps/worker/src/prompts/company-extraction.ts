export const COMPANY_EXTRACTION_SYSTEM = `You are a precise data extraction assistant. Always respond with valid JSON only. No markdown, no explanation, no extra text.`;

export interface CompanyPageSignals {
  cleanText: string;
  links: Array<{ text: string; url: string }>;
  sourceUrl: string;
  hostname: string;
}

export const companyExtractionPrompt = (signals: CompanyPageSignals) => {
  const linksText = signals.links
    .slice(0, 30)
    .map((l) => `- ${l.text}: ${l.url}`)
    .join("\n");

  return `You are a company data extractor. Analyze the following page signals from a company careers website and return ONLY a valid JSON object matching this exact schema:

{
  "name": "string — official company name, NOT a product name or tagline",
  "description": "string | null — company overview or about-us text, max 1000 characters",
  "website": "string | null — canonical homepage URL (not the careers subdomain)",
  "logoUrl": "string | null — absolute URL to company logo image",
  "industryRaw": "string | null — industry or business sector",
  "provinceRaw": "string | null — province where company is based (Indonesian province name if applicable)",
  "districtRaw": "string | null — district or city where company is based",
  "employeeCountRange": "one of: '1-10' | '11-50' | '51-200' | '201-500' | '501-1000' | '1001+' | null",
  "careerPageUrl": "string | null — absolute URL to the main careers/jobs listing page, must be matched from a PAGE LINKS entry whose text or URL contains a careers/jobs keyword (careers, jobs, vacancy, openings, positions, lowongan, karir, etc.), or null if no such link exists"
}

PAGE SIGNALS:
- Source URL: ${signals.sourceUrl}
- Hostname: ${signals.hostname}

PAGE TEXT:
${signals.cleanText}

PAGE LINKS:
${linksText}

Rules:
- "website" should be the main company homepage, not a careers subdomain
- "careerPageUrl" must be selected from PAGE LINKS — find the entry whose link text or URL path contains a careers/jobs keyword (careers, career, jobs, job, vacancy, openings, positions, postings, roles, opportunities, lowongan, karir) and use that link's URL; if no PAGE LINKS entry matches, use null instead of guessing
- If a field cannot be determined, use null
- Return ONLY the JSON object. No explanation, no markdown, no backticks.`;
};
