import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("Expo EAS configuration", () => {
  it("targets the new owner and linked EAS project", () => {
    const configSource = readFileSync(resolve(process.cwd(), "app.config.ts"), "utf8");
    const eas = JSON.parse(readFileSync(resolve(process.cwd(), "eas.json"), "utf8")) as {
      build?: { preview?: { android?: { buildType?: string } } };
    };
    expect(configSource).toContain('owner: "badralmolaiky"');
    expect(configSource).toContain('projectId: "d9c0b225-5255-4a38-a0df-375b71449189"');
    expect(eas.build?.preview?.android?.buildType).toBe("apk");
  });
});
