import { timingSafeEqual } from "node:crypto";
import { env } from "../../config/env.js";

export const authService = {
  verifyAdminPassword: (password: string): boolean => {
    const providedBuf = Buffer.from(password);
    const expectedBuf = Buffer.from(env.adminPassword);
    const matches =
      providedBuf.length === expectedBuf.length && timingSafeEqual(providedBuf, expectedBuf);
    console.log("auth-service.verify-admin-password", JSON.stringify({ matches }));
    return matches;
  },
};
