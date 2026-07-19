import { OpenAPIHono, createRoute } from "@hono/zod-openapi";
import { ErrorSchema } from "../../shared/schemas/common.schema.js";
import { jsonContent } from "../../utils/route-helpers.js";
import { login } from "./auth.handler.js";
import { LoginRequestSchema, LoginResponseSchema } from "./auth.schema.js";

export const loginRoute = createRoute({
  method: "post",
  path: "/login",
  tags: ["Auth"],
  summary: "Verify the admin dashboard password",
  request: {
    body: {
      content: { "application/json": { schema: LoginRequestSchema } },
      required: true,
    },
  },
  responses: {
    200: jsonContent("Password matched", LoginResponseSchema),
    401: jsonContent("Invalid password", ErrorSchema),
  },
});

export const authRouter = new OpenAPIHono().openapi(loginRoute, login);
