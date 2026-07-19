import { describe, expect, it } from "vitest";
import { LoginRequestSchema } from "./auth.schema.js";

describe("LoginRequestSchema", () => {
  it("accepts a non-empty password", () => {
    expect(LoginRequestSchema.safeParse({ password: "hunter2" }).success).toBe(true);
  });

  it("rejects an empty password", () => {
    expect(LoginRequestSchema.safeParse({ password: "" }).success).toBe(false);
  });

  it("rejects a missing password", () => {
    expect(LoginRequestSchema.safeParse({}).success).toBe(false);
  });
});
