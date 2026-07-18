export const JOB_POSTING_EXTRACTION_SYSTEM =
  "You are a precise data extraction assistant specialising in Indonesian job postings. Always respond with valid JSON only. No markdown, no explanation, no extra text.";

export interface JobPageSignals {
  cleanText: string;
  links: Array<{ text: string; url: string }>;
  sourceUrl: string;
}

export const jobPostingExtraction = (signals: JobPageSignals) => {
  const linksText = signals.links
    .slice(0, 60)
    .map((l) => `- ${l.text}: ${l.url}`)
    .join("\n");

  return `You are a job posting data extractor. Analyze the following page signals from a SINGLE job posting detail page and return ONLY a valid JSON object matching this exact schema:

{
  "title": "string — exact job title as shown in the posting",
  "locationRaw": "string | null — location text exactly as written (e.g. 'Jakarta Selatan', 'Bandung, Jawa Barat')",
  "description": "string | null — full job description / role overview, max 3000 characters",
  "requirements": "string | null — qualifications, skills, and experience required, max 2000 characters",
  "benefits": "string | null — perks, benefits, and compensation details mentioned, max 1000 characters",
  "embeddingSummary": "string | null — 2-4 sentence ENGLISH summary of the role: title, seniority, and the 3-6 most important required skills/tools. Translate if the posting is in Indonesian. Written for semantic search, not for display.",
  "experienceLevel": "one of: 'entry' | 'mid' | 'senior' | 'lead' | 'executive' | null",
  "salaryMin": "integer | null — minimum salary figure (numeric only, no currency symbol)",
  "salaryMax": "integer | null — maximum salary figure (numeric only, no currency symbol)",
  "salaryCurrency": "string — ISO 4217 currency code, default 'IDR' if not stated",
  "salaryPeriod": "one of: 'monthly' | 'yearly' | 'daily' | 'hourly' | null",
  "postedAt": "ISO 8601 datetime with offset (e.g. '2024-06-01T00:00:00+07:00') | null",
  "expiresAt": "ISO 8601 datetime with offset | null",
  "employmentTypeSlug": "one of: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship' | null",
  "workArrangementSlug": "one of: 'onsite' | 'hybrid' | 'remote' | null"
}

PAGE SIGNALS:
- Source URL: ${signals.sourceUrl}

PAGE TEXT:
${signals.cleanText}

PAGE LINKS:
${linksText}

Rules:
- Extract salary as plain integers; strip commas, dots, and currency symbols
- If salary is a single figure (not a range), put it in both salaryMin and salaryMax
- Assume IDR if no currency is mentioned
- For dates, convert relative expressions ("2 days ago", "posted today") to absolute ISO 8601 using today's date as reference
- Map experience keywords: fresh graduate / entry level → 'entry', 2-4 years → 'mid', 5+ years → 'senior', manager/lead → 'lead', VP/director/C-level → 'executive'
- Map work arrangement keywords: WFO / onsite / office → 'onsite', WFH / remote → 'remote', hybrid → 'hybrid'
- Map employment type keywords: full time / permanent → 'full-time', part time → 'part-time', contract / project based → 'contract', freelance → 'freelance', intern / magang → 'internship'
- If a field cannot be determined, use null
- Return ONLY the JSON object. No explanation, no markdown, no backticks.`;
};

export interface JobListingPageSignals {
  cleanText: string;
  links: Array<{ text: string; url: string }>;
  sourceUrl: string;
}

export const JOB_LISTING_EXTRACTION_SYSTEM =
  "You are a precise data extraction assistant specialising in Indonesian job listing pages. Always respond with valid JSON only. No markdown, no explanation, no extra text.";

export const jobListingExtraction = (signals: JobListingPageSignals) => {
  const linksText = signals.links
    .slice(0, 60)
    .map((l) => `- ${l.text}: ${l.url}`)
    .join("\n");

  return `You are a job listing extractor. Analyze the following page signals from a job listing/career page (which lists multiple vacancies) and return ONLY a valid JSON array matching this exact schema, one entry per distinct vacancy. If you don't find any, return '[]':

[
  {
    "title": "string — exact job title as shown in the listing card",
    "sourceUrl": "string | null — absolute URL of this job's detail page, taken from PAGE LINKS",
    "companyName": "string | null — name of the hiring company, if shown",
    "locationRaw": "string | null — location text exactly as written",
    "description": "string | null — full job description / role overview, max 3000 characters — only if shown directly on this page per vacancy",
    "requirements": "string | null — qualifications, skills, and experience required, max 2000 characters — only if shown directly on this page per vacancy",
    "benefits": "string | null — perks, benefits, and compensation details — only if shown directly on this page per vacancy",
    "embeddingSummary": "string | null — 2-4 sentence ENGLISH summary of the role: title, seniority, and the 3-6 most important required skills/tools, ONLY if description/requirements were populated above for this vacancy. Translate if the posting is in Indonesian. Written for semantic search, not for display.",
    "experienceLevel": "one of: 'entry' | 'mid' | 'senior' | 'lead' | 'executive' | null",
    "salaryMin": "integer | null — minimum salary figure (numeric only, no currency symbol)",
    "salaryMax": "integer | null — maximum salary figure (numeric only, no currency symbol)",
    "salaryCurrency": "string | null — ISO 4217 currency code (e.g. 'IDR')",
    "salaryPeriod": "one of: 'monthly' | 'yearly' | 'daily' | 'hourly' | null",
    "postedAt": "ISO 8601 datetime with offset (e.g. '2024-06-01T00:00:00+07:00') | null",
    "expiresAt": "ISO 8601 datetime with offset | null",
    "employmentTypeSlug": "one of: 'full-time' | 'part-time' | 'contract' | 'freelance' | 'internship' | null",
    "workArrangementSlug": "one of: 'onsite' | 'hybrid' | 'remote' | null"
  }
]

PAGE SIGNALS:
- Source URL: ${signals.sourceUrl}

PAGE TEXT:
${signals.cleanText}

PAGE LINKS:
${linksText}

Rules:
- Only extract distinct vacancies actually present on this listing page — do not invent any
- Match each vacancy to its detail-page URL using PAGE LINKS; if no matching link is found, use null for sourceUrl
- IMPORTANT: Some career pages show full job details (description, requirements, salary, etc.) directly in the listing for each vacancy. If the page shows these details per vacancy, populate those fields. If the page only shows a brief summary card and the full details are on a separate detail page, set description/requirements/benefits/salary/dates/type fields to null
- Only populate rich fields (description, requirements, etc.) when the information is explicitly shown on this listing page for that specific vacancy — do not guess or fabricate
- Extract salary as plain integers; strip commas, dots, and currency symbols
- If salary is a single figure, put it in both salaryMin and salaryMax
- For dates, convert relative expressions ("2 days ago", "posted today") to absolute ISO 8601 using today's date as reference
- Map experience keywords: fresh graduate / entry level → 'entry', 2-4 years → 'mid', 5+ years → 'senior', manager/lead → 'lead', VP/director/C-level → 'executive'
- Map work arrangement keywords: WFO / onsite / office → 'onsite', WFH / remote → 'remote', hybrid → 'hybrid'
- Map employment type keywords: full time / permanent → 'full-time', part time → 'part-time', contract / project based → 'contract', freelance → 'freelance', intern / magang → 'internship'
- Return ONLY the JSON array. No explanation, no markdown, no backticks.`;
};
