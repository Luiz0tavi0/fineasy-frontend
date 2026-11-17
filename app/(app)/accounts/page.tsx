import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Suspense } from "react";
import { getAuthenticatedServerApi } from "@/api/server";
import { requireData } from "@/lib/api-result";
import { AccountsTable, CreateAccountDialog, accountKeys } from "@/features/accounts";
import { PageTitle } from "@/components/ui";

async function AccountsContent() {
  const api = await getAuthenticatedServerApi();
  const queryClient = new QueryClient();
  await queryClient.prefetchQuery({
    queryKey: accountKeys.all,
    queryFn: async () => {
      const result = await api.GET("/accounts");
      return requireData(result.data, result.error, "Não foi possível carregar as contas.");
    },
  });
  return <HydrationBoundary state={dehydrate(queryClient)}><AccountsTable /></HydrationBoundary>;
}

export default function AccountsPage() {
  return <section><PageTitle title="Contas" description="Acompanhe seus saldos e contas." action={<CreateAccountDialog />} /><Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-slate-200" />}><AccountsContent /></Suspense></section>;
}
