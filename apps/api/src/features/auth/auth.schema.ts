import { z } from "@hono/zod-openapi";

export const LoginRequestSchema = z
  .object({
    password: z.string().min(1),
  })
  .openapi("LoginRequest");

export const LoginResponseSchema = z
  .object({
    ok: z.boolean(),
  })
  .openapi("LoginResponse");
