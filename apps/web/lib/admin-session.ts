import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

function sign(expiresAtEpochMs: string): string {
  return createHmac("sha256", env.adminSessionSecret).update(expiresAtEpochMs).digest("hex");
}

export function signAdminSession(): string {
  const expiresAtEpochMs = String(Date.now() + SESSION_DURATION_MS);
  const signature = sign(expiresAtEpochMs);
  return `${expiresAtEpochMs}.${signature}`;
}

export function verifyAdminSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) {
    return false;
  }

  const [expiresAtEpochMs, signature] = cookieValue.split(".");
  if (!expiresAtEpochMs || !signature) {
    return false;
  }

  const expectedSignature = sign(expiresAtEpochMs);
  const signatureBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);

  if (signatureBuf.length !== expectedBuf.length || !timingSafeEqual(signatureBuf, expectedBuf)) {
    return false;
  }

  return Date.now() < Number(expiresAtEpochMs);
}
