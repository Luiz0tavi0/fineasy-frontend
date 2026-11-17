import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Suspense } from "react";
import { connection } from "next/server";
import { getAuthenticatedServerApi } from "@/api/server";
import { requireData } from "@/lib/api-result";
import { PageTitle } from "@/components/ui";
import { RecurrenceForm, RecurrencesTable, recurrenceKeys } from "@/features/recurrences";
import { accountKeys } from "@/features/accounts";
import { categoryKeys } from "@/features/categories";
import { today } from "@/lib/today";

async function RecurrencesContent() {
  await connection();
  const currentDate = today();
  const api = await getAuthenticatedServerApi();
  const queryClient = new QueryClient();
  const [recurrencesResult, accountsResult, categoriesResult] = await Promise.all([
    api.GET("/recurrence-rules"),
    api.GET("/accounts"),
    api.GET("/categories"),
  ]);
  queryClient.setQueryData(recurrenceKeys.all, requireData(recurrencesResult.data, recurrencesResult.error, "Não foi possível carregar as recorrências."));
  queryClient.setQueryData(accountKeys.all, requireData(accountsResult.data, accountsResult.error, "Não foi possível carregar as contas."));
  queryClient.setQueryData(categoryKeys.all, requireData(categoriesResult.data, categoriesResult.error, "Não foi possível carregar as categorias."));
  return <HydrationBoundary state={dehydrate(queryClient)}>
    <div className="space-y-8">
      <section id="new-recurrence"><h2 className="mb-3 text-lg font-semibold">Criar recorrência</h2><RecurrenceForm accounts={accountsResult.data ?? []} categories={categoriesResult.data ?? []} currentDate={currentDate} /></section>
      <section><h2 className="mb-3 text-lg font-semibold">Recorrências cadastradas</h2><RecurrencesTable /></section>
    </div>
  </HydrationBoundary>;
}

export default function RecurrencesPage() {
  return <section><PageTitle title="Recorrências" description="Planeje receitas e despesas que se repetem." /><Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-slate-200" />}><RecurrencesContent /></Suspense></section>;
}
