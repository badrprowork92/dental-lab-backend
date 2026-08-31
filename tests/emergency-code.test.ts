import { describe, expect, it } from "vitest";

import { verifyAdminEmergencyCode } from "../server/lab-auth";

describe("رمز طوارئ المسؤول", () => {
  it("يقبل الرمز السرّي المحفوظ بالخادم ويرفض قيمة مختلفة دون كشفه", () => {
    const emergencyCode = process.env.LAB_ADMIN_EMERGENCY_CODE;
    expect(emergencyCode).toBeTruthy();
    expect(emergencyCode!.length).toBeGreaterThanOrEqual(10);
    expect(verifyAdminEmergencyCode(emergencyCode!)).toBe(true);
    expect(verifyAdminEmergencyCode(`${emergencyCode!}-wrong`)).toBe(false);
  });
});
