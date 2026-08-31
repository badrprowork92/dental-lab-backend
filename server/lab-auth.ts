import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

import { ENV } from "./_core/env";

export type LabRole = "admin" | "lab_user";
export type LabSession = {
  userId: number;
  labId: number | null;
  role: LabRole;
  username: string;
  sessionVersion: number;
  mustChangePassword?: boolean;
};

function secretKey() {
  if (!ENV.cookieSecret) throw new Error("مفتاح الجلسة غير مهيأ على الخادم.");
  return new TextEncoder().encode(ENV.cookieSecret);
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const digest = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${digest}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [method, salt, digest] = storedHash.split("$");
  if (method !== "scrypt" || !salt || !digest) return false;
  const expected = Buffer.from(digest, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function verifyAdminEmergencyCode(value: string) {
  const expected = process.env.LAB_ADMIN_EMERGENCY_CODE;
  if (!expected || !value) return false;
  const expectedBuffer = Buffer.from(expected);
  const suppliedBuffer = Buffer.from(value);
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}

export function fingerprintDevice(deviceId: string) {
  return createHash("sha256")
    .update(`${ENV.cookieSecret}:${deviceId.trim()}`)
    .digest("hex");
}

export async function createLabSession(session: LabSession) {
  return new SignJWT({
    labId: session.labId,
    role: session.role,
    username: session.username,
    sessionVersion: session.sessionVersion,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(session.userId))
    .setIssuer("dental-lab-accounting")
    .setAudience("mobile-app")
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secretKey());
}

export async function readLabSession(token: string | undefined | null): Promise<LabSession | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: "dental-lab-accounting",
      audience: "mobile-app",
    });
    const userId = Number(payload.sub);
    const role = payload.role;
    const username = payload.username;
    const sessionVersion = Number(payload.sessionVersion);
    const labId = payload.labId === null || payload.labId === undefined ? null : Number(payload.labId);
    if (!Number.isInteger(userId) || (role !== "admin" && role !== "lab_user") || typeof username !== "string" || !Number.isInteger(sessionVersion) || sessionVersion < 1 || (labId !== null && !Number.isInteger(labId))) return null;
    return { userId, labId, role, username, sessionVersion };
  } catch {
    return null;
  }
}
