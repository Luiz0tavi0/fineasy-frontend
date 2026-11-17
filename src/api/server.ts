import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createApiClient } from "@/api/client";

export async function getServerApi() {
  const store = await cookies();
  return createApiClient(process.env.FASTAPI_URL ?? "", {
    async getAccessToken() { return store.get("fe_access")?.value ?? null; },
    async refresh() {
      if (!store.get("fe_refresh")?.value) redirect("/login");
      redirect("/api/token?refresh=1");
    },
    async clear() { redirect("/login"); },
  });
}

export async function getAuthenticatedServerApi() {
  const store = await cookies();
  if (!store.get("fe_access")?.value) redirect("/login");
  return getServerApi();
}
