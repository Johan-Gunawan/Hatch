import type { ZodType } from "zod";

export function jsonContent<T extends ZodType>(description: string, schema: T) {
  return {
    description,
    content: { "application/json": { schema } },
  };
}

export function noContent(description: string) {
  return { description };
}
