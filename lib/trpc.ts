import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/routers";
import { getApiBaseUrl } from "@/constants/oauth";
import { getLabSessionToken } from "@/lib/lab-session-storage";

/**
 * tRPC React client for type-safe API calls.
 *
 * IMPORTANT (tRPC v11): The `transformer` must be inside `httpBatchLink`,
 * NOT at the root createClient level. This ensures client and server
 * use the same serialization format (superjson).
 */
export const trpc = createTRPCReact<AppRouter>();

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Retry transient preview-proxy HTML/502 responses so tRPC always receives JSON. */
async function resilientFetch(url: RequestInfo | URL, options?: RequestInit): Promise<Response> {
  let lastStatus = 502;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(url, options);
      lastStatus = response.status;
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.toLowerCase().includes("json")) return response;
      if (attempt < 2) await sleep(400 * (attempt + 1));
    } catch {
      if (attempt < 2) await sleep(400 * (attempt + 1));
    }
  }
  return new Response(JSON.stringify([{
    error: {
      json: {
        message: "تعذر الاتصال بالخادم حالياً. أعد المحاولة بعد لحظات.",
        code: -32603,
        data: { code: "BAD_GATEWAY", httpStatus: lastStatus },
      },
    },
  }]), { status: 502, headers: { "content-type": "application/json; charset=utf-8" } });
}

/**
 * Creates the tRPC client with proper configuration.
 * Call this once in your app's root layout.
 */
export function createTRPCClient() {
  return trpc.createClient({
    links: [
      httpBatchLink({
        url: `${getApiBaseUrl()}/api/trpc`,
        // tRPC v11: transformer MUST be inside httpBatchLink, not at root
        transformer: superjson,
        async headers() {
          const token = await getLabSessionToken();
          return token ? { Authorization: `Bearer ${token}` } : {};
        },
        // Custom fetch to include credentials for cookie-based auth
        fetch(url, options) {
          return resilientFetch(url, {
            ...options,
            credentials: "include",
          });
        },
      }),
    ],
  });
}
