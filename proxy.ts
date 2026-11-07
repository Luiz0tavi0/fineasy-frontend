import type { NextRequest } from "next/server";

// Authentication is guarded in the server layout so this proxy remains intentionally passive.
export function proxy(request: NextRequest) { void request; }
