import { describe, expect, it } from "vitest";

describe("Expo build credential", () => {
  it("accepts the configured EXPO_TOKEN", async () => {
    const token = process.env.EXPO_TOKEN;
    expect(token, "EXPO_TOKEN must be configured").toBeTruthy();
    const response = await fetch("https://api.expo.dev/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ query: "query CurrentUser { meActor { __typename ... on UserActor { username } } }" }),
    });
    expect(response.ok).toBe(true);
    const body = await response.json() as { data?: { meActor?: { username?: string } }; errors?: unknown[] };
    expect(body.errors).toBeUndefined();
    expect(body.data?.meActor?.username).toBe("badralmolaiky");
  }, 15000);
});

export {};
