import { describe, expect, it, vi } from "vitest";

vi.mock("../../config/env.js", () => ({
  env: { adminPassword: "hunter2" },
}));

const { authService } = await import("./auth.service.js");

describe("authService.verifyAdminPassword", () => {
  it("returns true for the correct password", () => {
    expect(authService.verifyAdminPassword("hunter2")).toBe(true);
  });

  it("returns false for an incorrect password of the same length", () => {
    expect(authService.verifyAdminPassword("hunter3")).toBe(false);
  });

  it("returns false for a password of a different length", () => {
    expect(authService.verifyAdminPassword("short")).toBe(false);
  });

  it("returns false for an empty password", () => {
    expect(authService.verifyAdminPassword("")).toBe(false);
  });
});
