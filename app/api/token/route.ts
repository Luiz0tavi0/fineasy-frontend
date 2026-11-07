import { NextResponse } from "next/server";
import { getAccessToken, refreshSession } from "@/actions/auth";

export async function GET() {
  const accessToken = await getAccessToken();
  return NextResponse.json({ access_token: accessToken });
}

export async function POST() {
  const tokens = await refreshSession();
  return NextResponse.json({ access_token: tokens?.access_token ?? null }, { status: tokens ? 200 : 401 });
}
