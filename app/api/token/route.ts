import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import createClient from "openapi-fetch";
import { getAccessToken } from "@/actions/auth";
import type { paths } from "@/api/schema";

const api = createClient<paths>({ baseUrl: process.env.FASTAPI_URL });

async function refreshTokens() {
  const refreshToken = (await cookies()).get("fe_refresh")?.value;
  if (!refreshToken) return null;
  const result = await api.POST("/auth/refresh", { body: { refresh_token: refreshToken } });
  return result.error ? null : result.data ?? null;
}

function setSessionCookies(response: NextResponse, tokens: NonNullable<Awaited<ReturnType<typeof refreshTokens>>>): void {
  const common = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  response.cookies.set("fe_access", tokens.access_token, { ...common, maxAge: 60 * 15 });
  response.cookies.set("fe_refresh", tokens.refresh_token, { ...common, maxAge: 60 * 60 * 24 * 30 });
}

function clearSessionCookies(response: NextResponse): void {
  response.cookies.delete("fe_access");
  response.cookies.delete("fe_refresh");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("refresh") === "1") {
    const tokens = await refreshTokens();
    if (!tokens) {
      const response = NextResponse.redirect(new URL("/login", request.url));
      clearSessionCookies(response);
      return response;
    }

    const referer = request.headers.get("referer");
    let destination = new URL("/", request.url);
    if (referer) {
      const target = new URL(referer);
      if (target.origin === url.origin && target.pathname !== "/api/token") destination = target;
    }

    const response = NextResponse.redirect(destination);
    setSessionCookies(response, tokens);
    return response;
  }

  const accessToken = await getAccessToken();
  return NextResponse.json({ access_token: accessToken });
}

export async function POST() {
  const tokens = await refreshTokens();
  const response = NextResponse.json(
    { access_token: tokens?.access_token ?? null },
    { status: tokens ? 200 : 401 },
  );
  if (tokens) setSessionCookies(response, tokens);
  else clearSessionCookies(response);
  return response;
}
