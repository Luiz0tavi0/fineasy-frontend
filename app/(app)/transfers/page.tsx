import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Suspense } from "react";
import { connection } from "next/server";
import { getAuthenticatedServerApi } from "@/api/server";
import { requireData } from "@/lib/api-result";
import { PageTitle } from "@/components/ui";
import { CreateTransferDialog, TransfersTable, transferKeys } from "@/features/transfers";
import { accountKeys } from "@/features/accounts";
import { today } from "@/lib/today";

async function TransfersContent() {
  await connection();
  const currentDate = today();
  const api = await getAuthenticatedServerApi();
  const queryClient = new QueryClient();
  const [transfersResult, accountsResult] = await Promise.all([api.GET("/transfers"), api.GET("/accounts")]);
  queryClient.setQueryData(transferKeys.all, requireData(transfersResult.data, transfersResult.error, "Não foi possível carregar as transferências."));
  queryClient.setQueryData(accountKeys.all, requireData(accountsResult.data, accountsResult.error, "Não foi possível carregar as contas."));
  return <HydrationBoundary state={dehydrate(queryClient)}><CreateTransferDialog currentDate={currentDate} /><div className="mt-4"><TransfersTable currentDate={currentDate} /></div></HydrationBoundary>;
}

export default function TransfersPage() {
  return <section><PageTitle title="Transferências" description="Movimente valores entre suas contas." /><Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-slate-200" />}><TransfersContent /></Suspense></section>;
}
