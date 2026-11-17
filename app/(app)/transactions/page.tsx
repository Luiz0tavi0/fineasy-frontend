import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getAuthenticatedServerApi } from "@/api/server";
import { requireData } from "@/lib/api-result";
import { PageTitle } from "@/components/ui";
import { today } from "@/lib/today";
import { TransactionsTable, transactionKeys, type TransactionFilters } from "@/features/transactions";

async function TransactionsContent() {
  await connection();
  const month = today().slice(0, 7);
  const filters: TransactionFilters = { month, page: 1, per_page: 20 };
  const api = await getAuthenticatedServerApi();
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: transactionKeys.list(filters),
    queryFn: async () => {
      const result = await api.GET("/transactions", { params: { query: filters } });
      return requireData(result.data, result.error, "Não foi possível carregar as transações.");
    },
  });
  return <HydrationBoundary state={dehydrate(queryClient)}><TransactionsTable initialMonth={month} /></HydrationBoundary>;
}

export default function TransactionsPage() {
  return <section><PageTitle title="Transações" description="Receitas e despesas da sua rotina." action={<Link className="inline-flex min-h-10 items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white" href="/transactions/new">Nova transação</Link>} /><Suspense fallback={<div className="h-64 animate-pulse rounded-lg bg-slate-200" />}><TransactionsContent /></Suspense></section>;
}
