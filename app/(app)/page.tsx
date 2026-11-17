import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Suspense } from "react";
import { connection } from "next/server";
import { getAuthenticatedServerApi } from "@/api/server";
import { requireData } from "@/lib/api-result";
import { today } from "@/lib/today";
import { DashboardView } from "@/features/dashboard";
import { dashboardKey } from "@/features/dashboard/queries";

async function DashboardContent() {
  await connection();
  const date = today();
  const month = date.slice(0, 7);
  const api = await getAuthenticatedServerApi();
  const queryClient = new QueryClient();
  const [accountsResult, transactionsResult, invoicesResult, cardsResult] = await Promise.all([
    api.GET("/accounts"),
    api.GET("/transactions", { params: { query: { month, status: "PENDING", per_page: 100 } } }),
    api.GET("/invoices", { params: { query: { today: `${month}-01` } } }),
    api.GET("/credit-cards"),
  ]);
  queryClient.setQueryData(dashboardKey(month), {
    accounts: requireData(accountsResult.data, accountsResult.error, "Não foi possível carregar as contas."),
    transactions: requireData(transactionsResult.data, transactionsResult.error, "Não foi possível carregar as transações."),
    invoices: requireData(invoicesResult.data, invoicesResult.error, "Não foi possível carregar as faturas."),
    creditCards: requireData(cardsResult.data, cardsResult.error, "Não foi possível carregar os cartões."),
  });
  return <HydrationBoundary state={dehydrate(queryClient)}><DashboardView month={month} /></HydrationBoundary>;
}

export default function DashboardPage() {
  return <section><h1 className="mb-6 text-2xl font-semibold">Dashboard</h1><Suspense fallback={<div className="space-y-8"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div className="h-28 animate-pulse rounded-lg bg-slate-200" key={index} />)}</div><div className="h-48 animate-pulse rounded-lg bg-slate-200" /></div>}><DashboardContent /></Suspense></section>;
}
