"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import createClient from "openapi-fetch";
import type { components, paths } from "@/api/schema";
import { createApiClient } from "@/api/client";

const api = createClient<paths>({ baseUrl: process.env.FASTAPI_URL });
const accessMaxAge = 60 * 15;
const refreshMaxAge = 60 * 60 * 24 * 30;

// httpOnly cookies keep tokens out of JavaScript (reducing XSS token theft), unlike localStorage; the tradeoff is that browser code needs a server bridge for authenticated API calls.
async function saveTokens(tokens: components["schemas"]["TokenPair"]) {
  const cookieStore = await cookies();
  const common = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  cookieStore.set("fe_access", tokens.access_token, { ...common, maxAge: accessMaxAge });
  cookieStore.set("fe_refresh", tokens.refresh_token, { ...common, maxAge: refreshMaxAge });
}

export async function loginAction(values: components["schemas"]["Credentials"]) {
  const { data, error } = await api.POST("/auth/token", { body: values });
  if (error || !data) return { error: "Não foi possível entrar. Verifique os dados." };
  await saveTokens(data);
  redirect("/");
}

export async function registerAction(values: components["schemas"]["Credentials"]) {
  const { data, error } = await api.POST("/auth/register", { body: values });
  if (error || !data) return { error: "Não foi possível criar a conta." };
  redirect("/login");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("fe_access");
  cookieStore.delete("fe_refresh");
  redirect("/login");
}

export async function refreshSession() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("fe_refresh")?.value;
  if (!refreshToken) return null;
  const { data, error } = await api.POST("/auth/refresh", { body: { refresh_token: refreshToken } });
  if (error || !data) return null;
  await saveTokens(data);
  return data;
}

export async function getAccessToken() {
  return (await cookies()).get("fe_access")?.value ?? null;
}

const authenticatedApi = createApiClient(process.env.FASTAPI_URL ?? "", {
  getAccessToken,
  refresh: refreshSession,
  async clear() {
    const cookieStore = await cookies();
    cookieStore.delete("fe_access");
    cookieStore.delete("fe_refresh");
  },
});

export async function getCurrentUser() {
  const { data, error } = await authenticatedApi.GET("/auth/me");
  if (error || !data) return null;
  return data;
}
