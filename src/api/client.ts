import createClient from "openapi-fetch";
import type { components, paths } from "@/api/schema";

type TokenPair = components["schemas"]["TokenPair"];

export type SessionBridge = {
  getAccessToken(): Promise<string | null>;
  refresh(): Promise<TokenPair | null>;
  clear(): Promise<void>;
};

let refreshInFlight: Promise<TokenPair | null> | null = null;

export function createApiClient(baseUrl: string, session: SessionBridge) {
  async function authorizedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const request = input instanceof Request ? input : new Request(input, init);
    const retryRequest = request.clone();
    const send = async (value: Request) => {
      const headers = new Headers(value.headers);
      const accessToken = await session.getAccessToken();
      if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
      return fetch(new Request(value, { headers }));
    };

    const response = await send(request);
    if (response.status !== 401) return response;

    refreshInFlight ??= session.refresh().finally(() => { refreshInFlight = null; });
    if (await refreshInFlight) return send(retryRequest);

    await session.clear();
    if (typeof window !== "undefined") window.location.assign("/login");
    return response;
  }

  return createClient<paths>({ baseUrl, fetch: authorizedFetch });
}

/** Client Components use this bridge so the refresh token remains httpOnly. */
export const clientApi = createApiClient(process.env.NEXT_PUBLIC_API_URL ?? "", {
  async getAccessToken() {
    const response = await fetch("/api/token", { cache: "no-store" });
    return ((await response.json()) as { access_token: string | null }).access_token;
  },
  async refresh() {
    const response = await fetch("/api/token", { method: "POST" });
    if (!response.ok) return null;
    const { access_token } = (await response.json()) as { access_token: string | null };
    return access_token ? { access_token, refresh_token: "", token_type: "bearer" } : null;
  },
  async clear() { window.location.assign("/login"); },
});
