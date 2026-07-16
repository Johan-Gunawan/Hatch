process.env.TZ = "Asia/Jakarta";
import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { apiReference } from "@scalar/hono-api-reference";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { analyticsRouter } from "./features/analytics/analytics.routes.js";
import { companiesRouter } from "./features/companies/company.routes.js";
import { jobsRouter } from "./features/jobs/job.routes.js";
import { resumesRouter } from "./features/resumes/resume.routes.js";
import { statsRouter } from "./features/stats/stats.routes.js";
import { trackingRouter } from "./features/tracking/tracking.routes.js";
import { apiKeyGuard } from "./middleware/api-key.js";
import { corsMiddleware } from "./middleware/cors.js";
import { rateLimitMiddleware, trackingRateLimitMiddleware } from "./middleware/rate-limit.js";

const app = new OpenAPIHono();

// Global edge middleware: security headers, CORS, request logging.
app.use(secureHeaders());
app.use(corsMiddleware);
app.use(logger());

// Scoped guards: throttle then authenticate every /api/* route.
app.use("/api/*", rateLimitMiddleware);
app.use("/api/*", apiKeyGuard);

// /track/* is intentionally outside the /api/* guard chain: the web app's
// browser-originating proxy calls it with no x-api-key, so it leans on a
// tighter per-IP rate limit instead of the key guard.
app.use("/track/*", trackingRateLimitMiddleware);

app.route("/api/jobs", jobsRouter);
app.route("/api/resumes", resumesRouter);
app.route("/api/companies", companiesRouter);
app.route("/api/stats", statsRouter);
app.route("/api/analytics", analyticsRouter);
app.route("/track", trackingRouter);

app.get("/health", (c) => c.json({ status: "ok" }));

if (process.env.NODE_ENV !== "production") {
  app.doc("/openapi.json", {
    openapi: "3.1.0",
    info: { title: "Scrapper ATS API", version: "1.0.0" },
  });

  app.get(
    "/docs",
    apiReference({
      spec: { url: "/openapi.json" },
      theme: "default",
    })
  );
}

serve({ fetch: app.fetch, port: 3001 }, (info) => {
  console.log(`API running on http://localhost:${info.port}`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`API docs at   http://localhost:${info.port}/docs`);
  }
});
