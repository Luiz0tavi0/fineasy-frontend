import { Suspense } from "react";
import { DashboardView } from "@/features/dashboard";
export const dynamic = "force-dynamic";
export default function DashboardPage() { return <section><h1 className="mb-6 text-2xl font-semibold">Dashboard</h1><Suspense fallback={<div className="grid gap-4 md:grid-cols-4">{Array.from({ length: 4 }, (_, i) => <div className="h-28 animate-pulse rounded-lg bg-slate-200" key={i} />)}</div>}><DashboardView /></Suspense></section>; }
