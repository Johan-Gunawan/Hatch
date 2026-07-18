import type { Context } from "hono";
import { HTTP } from "./constants.js";

// Hono's c.json() has strict typed-response overloads that a generic response
// helper can't satisfy; `as never` is assignable to any of them and preserves
// the runtime behavior while avoiding an explicit `any`.
export const respond = {
  ok: (c: Context, data: unknown) => c.json(data as never, HTTP.OK),
  created: (c: Context, data: unknown) => c.json(data as never, HTTP.CREATED),
  accepted: (c: Context, data: unknown) => c.json(data as never, HTTP.ACCEPTED),
  noContent: (c: Context) => c.body(null, HTTP.NO_CONTENT),
  badRequest: (c: Context, error: string) => c.json({ error } as never, HTTP.BAD_REQUEST),
  notFound: (c: Context, error = "Not found") => c.json({ error } as never, HTTP.NOT_FOUND),
  conflict: (c: Context, error: string) => c.json({ error } as never, HTTP.CONFLICT),
  serverError: (c: Context, error = "Internal server error") =>
    c.json({ error } as never, HTTP.INTERNAL_SERVER_ERROR),
};
