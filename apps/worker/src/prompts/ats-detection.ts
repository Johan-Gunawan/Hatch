export const ATS_DETECTION_SYSTEM =
  "You are a precise web page classifier specialising in recruiting/career page infrastructure. Always respond with valid JSON only. No markdown, no explanation, no extra text.";

export interface AtsDetectionSignals {
  rawHtmlExcerpt: string;
  cleanText: string;
  links: Array<{ text: string; url: string }>;
  sourceUrl: string;
  hostname: string;
}

// Branded ATS SaaS platforms to actively look for — global vendors plus ones
// commonly seen on Indonesian career pages.
const KNOWN_ATS_HINTS = `
Global branded ATS SaaS platforms to watch for (non-exhaustive):
- Greenhouse (boards.greenhouse.io, job-boards.greenhouse.io, "powered by Greenhouse")
- Lever (jobs.lever.co, "powered by Lever")
- Workday (myworkdayjobs.com, wd1.myworkdayjobs.com)
- SuccessFactors / SAP (*.successfactors.com, career sites with "SuccessFactors" markers)
- SmartRecruiters (jobs.smartrecruiters.com, careers.smartrecruiters.com)
- iCIMS (*.icims.com)
- Ashby (jobs.ashbyhq.com)
- BambooHR (*.bamboohr.com/jobs)
- Jobvite (jobs.jobvite.com)
- Taleo (*.taleo.net)

Indonesia-relevant branded platforms / job-board widgets to watch for:
- Kalibrr (kalibrr.com career widgets/embeds)
- Glints (glints.com / Glints TalentHub embeds)
- Mekari Talenta career-page widgets
- JobStreet/Jobstreet embedded apply widgets (jobstreet.co.id)
- LinkedIn "Easy Apply" embedded job widgets
`;

export const atsDetectionPrompt = (signals: AtsDetectionSignals) => {
  const linksText = signals.links
    .slice(0, 60)
    .map((l) => `- ${l.text}: ${l.url}`)
    .join("\n");

  return `Analyze the following signals from a company's careers/job-listing page and decide whether it is:
(a) a CUSTOM-BUILT career page — the company's own site/design hosting its own job listings, OR
(b) a BRANDED ATS SaaS page — the listings are actually served by a third-party applicant-tracking-system vendor, whether on the vendor's own domain or white-labeled/embedded under the company's own domain.

${KNOWN_ATS_HINTS}

Look for signature markers in the RAW HTML EXCERPT especially:
- <script src="..."> or <iframe src="..."> domains matching any vendor above
- "Powered by <vendor>" footer/header text
- <meta name="generator" ...> tags naming a vendor
- distinctive URL path/subdomain structure even if it appears to be the company's own domain (e.g. a custom domain that's actually CNAME'd/embedded to a vendor)

PAGE SIGNALS:
- Source URL: ${signals.sourceUrl}
- Hostname: ${signals.hostname}

RAW HTML EXCERPT (may be truncated):
${signals.rawHtmlExcerpt}

PAGE TEXT (cleaned, for context only):
${signals.cleanText.slice(0, 2000)}

PAGE LINKS:
${linksText}

Return ONLY a valid JSON object matching this exact schema:

{
  "isBrandedAts": "boolean — true if this is a branded ATS SaaS page, false if it is a custom-built career page",
  "atsPlatform": "string | null — the detected vendor name (e.g. 'greenhouse', 'lever', 'workday', 'successfactors', 'kalibrr') if isBrandedAts is true, otherwise null",
  "reason": "string — one short sentence citing the specific signal that drove the verdict"
}

Rules:
- When uncertain, prefer isBrandedAts: false (the page looks custom-built) unless there is a clear, specific signal pointing to a named vendor
- Return ONLY the JSON object. No explanation, no markdown, no backticks.`;
};
