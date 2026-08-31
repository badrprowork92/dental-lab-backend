import { describe, expect, it } from "vitest";

import { createLabSession, fingerprintDevice, hashPassword, readLabSession, verifyPassword } from "../server/lab-auth";

describe("حماية حسابات المختبر", () => {
  it("يخزن كلمة المرور كهاش ويتحقق من المطابقة فقط", () => {
    const passwordHash = hashPassword("Secure-Lab-Password-2026");
    expect(passwordHash).toMatch(/^scrypt\$/);
    expect(passwordHash).not.toContain("Secure-Lab-Password-2026");
    expect(verifyPassword("Secure-Lab-Password-2026", passwordHash)).toBe(true);
    expect(verifyPassword("wrong-password", passwordHash)).toBe(false);
  });

  it("يصدر جلسة موقعة لحساب المختبر ويقرأها دون كشف كلمة المرور", async () => {
    const token = await createLabSession({ userId: 7, labId: 3, role: "lab_user", username: "lab-three", sessionVersion: 1 });
    const session = await readLabSession(token);
    expect(session).toEqual({ userId: 7, labId: 3, role: "lab_user", username: "lab-three", sessionVersion: 1 });
    expect(await readLabSession(`${token}tampered`)).toBeNull();
  });

  it("ينتج بصمة ثابتة لنفس الجهاز بدل الاحتفاظ بمعرفه الخام", () => {
    const first = fingerprintDevice("android:sample-device-id");
    const second = fingerprintDevice("android:sample-device-id");
    expect(first).toBe(second);
    expect(first).not.toContain("sample-device-id");
    expect(first).toHaveLength(64);
  });
});
