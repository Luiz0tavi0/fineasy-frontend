import { cookies } from "next/headers";
import createClient from "openapi-fetch";
import type { paths } from "@/api/schema";
import { createApiClient } from "@/api/client";

const rawApi = createClient<paths>({ baseUrl: process.env.FASTAPI_URL });

export async function getServerApi() {
  const store = await cookies();
  return createApiClient(process.env.FASTAPI_URL ?? "", {
    async getAccessToken() { return store.get("fe_access")?.value ?? null; },
    async refresh() {
      const refreshToken = store.get("fe_refresh")?.value;
      if (!refreshToken) return null;
      const { data, error } = await rawApi.POST("/auth/refresh", { body: { refresh_token: refreshToken } });
      if (error || !data) return null;
      const common = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
      store.set("fe_access", data.access_token, { ...common, maxAge: 60 * 15 });
      store.set("fe_refresh", data.refresh_token, { ...common, maxAge: 60 * 60 * 24 * 30 });
      return data;
    },
    async clear() { store.delete("fe_access"); store.delete("fe_refresh"); },
  });
}
