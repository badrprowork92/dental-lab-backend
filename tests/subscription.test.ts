import { describe, expect, it } from "vitest";

import { isSubscriptionExpired } from "../server/db";

describe("مدة اشتراك المختبر", () => {
  it("يمنع الاشتراك المنتهي ويقبل الاشتراك الساري أو غير المحدد", () => {
    expect(isSubscriptionExpired("2026-08-26", "2026-08-27")).toBe(true);
    expect(isSubscriptionExpired("2026-08-27", "2026-08-27")).toBe(false);
    expect(isSubscriptionExpired("2026-09-01", "2026-08-27")).toBe(false);
    expect(isSubscriptionExpired(null, "2026-08-27")).toBe(false);
  });
});
