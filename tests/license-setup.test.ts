import { describe, expect, it } from "vitest";

import { appRouter } from "../server/routers";
import type { TrpcContext } from "../server/_core/context";

describe("إعداد مسؤول التراخيص", () => {
  it("يتحقق من رمز إعداد المسؤول المخزن كسر في الخادم", async () => {
    const setupCode = process.env.LAB_ADMIN_SETUP_CODE;
    expect(setupCode).toBeTruthy();
    const caller = appRouter.createCaller({
      user: null,
      labSession: null,
      req: {} as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    });
    await expect(caller.license.verifySetupCode({ setupCode: setupCode! })).resolves.toEqual({ valid: true });
  });
});
