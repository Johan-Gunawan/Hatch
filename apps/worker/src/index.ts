process.env.TZ = "Asia/Jakarta";
import { serve } from "inngest/node";
import { inngest } from "./inngest/client.js";
import { rollupAnalytics } from "./inngest/functions/rollup-analytics.js";
import { scrapeCompany } from "./inngest/functions/scrape-company.js";
import { scrapeJob } from "./inngest/functions/scrape-job-posting.js";

const handler = serve({ client: inngest, functions: [scrapeJob, scrapeCompany, rollupAnalytics] });

const port = Number(process.env.PORT ?? 8288);
const { createServer } = await import("node:http");

createServer((req, res) => {
  if (req.url?.startsWith("/api/inngest")) {
    handler(req, res);
  } else {
    res.writeHead(404).end();
  }
}).listen(port, () => {
  console.log(`Worker running on http://localhost:${port}`);
});
