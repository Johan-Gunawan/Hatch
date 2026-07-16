import type { Context } from "hono";
import { HTTP } from "./constants.js";

export const respond = {
  ok: (c: Context, data: unknown) => c.json(data as any, HTTP.OK),
  created: (c: Context, data: unknown) => c.json(data as any, HTTP.CREATED),
  accepted: (c: Context, data: unknown) => c.json(data as any, HTTP.ACCEPTED),
  noContent: (c: Context) => c.body(null, HTTP.NO_CONTENT),
  badRequest: (c: Context, error: string) => c.json({ error } as any, HTTP.BAD_REQUEST),
  notFound: (c: Context, error = "Not found") => c.json({ error } as any, HTTP.NOT_FOUND),
  conflict: (c: Context, error: string) => c.json({ error } as any, HTTP.CONFLICT),
  serverError: (c: Context, error = "Internal server error") =>
    c.json({ error } as any, HTTP.INTERNAL_SERVER_ERROR),
};
