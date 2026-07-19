import { OpenAPIHono } from "@hono/zod-openapi";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Contract-level tests for authRouter over HTTP. authService is the handler's
// collaborator and the only mocked seam.

const verifyAdminPasswordMock = vi.fn();

vi.mock("./auth.service.js", () => ({
  authService: {
    verifyAdminPassword: verifyAdminPasswordMock,
  },
}));

const { authRouter } = await import("./auth.routes.js");
const app = new OpenAPIHono().route("/api/auth", authRouter);

function postLogin(body: unknown) {
  return app.request("/api/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/auth/login", () => {
  it("returns 200 for the correct password", async () => {
    verifyAdminPasswordMock.mockReturnValueOnce(true);

    const res = await postLogin({ password: "hunter2" });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(verifyAdminPasswordMock).toHaveBeenCalledWith("hunter2");
  });

  it("returns 401 for the wrong password", async () => {
    verifyAdminPasswordMock.mockReturnValueOnce(false);

    const res = await postLogin({ password: "wrong" });

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Invalid password" });
  });

  it("rejects a missing password with 400", async () => {
    const res = await postLogin({});

    expect(res.status).toBe(400);
    expect(verifyAdminPasswordMock).not.toHaveBeenCalled();
  });
});
