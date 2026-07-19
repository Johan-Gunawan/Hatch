import type { RouteHandler } from "@hono/zod-openapi";
import { respond } from "../../utils/responses.js";
import type { loginRoute } from "./auth.routes.js";
import { authService } from "./auth.service.js";

export const login: RouteHandler<typeof loginRoute> = async (c) => {
  const { password } = c.req.valid("json");

  if (!authService.verifyAdminPassword(password)) {
    return respond.unauthorized(c, "Invalid password");
  }

  return respond.ok(c, { ok: true });
};
