import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Suspense } from "react";
import { connection } from "next/server";
import { getAuthenticatedServerApi } from "@/api/server";
import { requireData } from "@/lib/api-result";
import { today } from "@/lib/today";
import { PageTitle } from "@/components/ui";
import { InvoicesTable, invoiceKeys } from "@/features/invoices";
import { creditCardKeys } from "@/features/credit-cards";
import { accountKeys } from "@/features/accounts";

async function InvoicesContent() {
  await connection();
  const date = today();
  const api = await getAuthenticatedServerApi();
  const queryClient = new QueryClient();
  const [invoicesResult, cardsResult, accountsResult] = await Promise.all([
    api.GET("/invoices", { params: { query: { today: date } } }),
    api.GET("/credit-cards"),
    api.GET("/accounts"),
  ]);
  queryClient.setQueryData(invoiceKeys.list(date), requireData(invoicesResult.data, invoicesResult.error, "Não foi possível carregar as faturas."));
  queryClient.setQueryData(creditCardKeys.all, requireData(cardsResult.data, cardsResult.error, "Não foi possível carregar os cartões."));
  queryClient.setQueryData(accountKeys.all, requireData(accountsResult.data, accountsResult.error, "Não foi possível carregar as contas."));
  return <HydrationBoundary state={dehydrate(queryClient)}><InvoicesTable date={date} /></HydrationBoundary>;
}

export default function InvoicesPage() {
  return <section><PageTitle title="Faturas" description="Acompanhe vencimentos e pagamentos de cartões." /><Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-slate-200" />}><InvoicesContent /></Suspense></section>;
}
