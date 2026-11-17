import { dehydrate, HydrationBoundary, QueryClient } from "@tanstack/react-query";
import { Suspense } from "react";
import { getAuthenticatedServerApi } from "@/api/server";
import { requireData } from "@/lib/api-result";
import { CreditCardsTable, CreateCreditCardDialog, creditCardKeys } from "@/features/credit-cards";
import { PageTitle } from "@/components/ui";

async function CardsContent() {
  const api = await getAuthenticatedServerApi();
  const queryClient = new QueryClient();
  const [cards, accounts] = await Promise.all([
    api.GET("/credit-cards"),
    api.GET("/accounts"),
  ]);
  queryClient.setQueryData(creditCardKeys.all, requireData(cards.data, cards.error, "Não foi possível carregar os cartões."));
  queryClient.setQueryData(["accounts"], requireData(accounts.data, accounts.error, "Não foi possível carregar as contas."));
  return <HydrationBoundary state={dehydrate(queryClient)}><CreditCardsTable /></HydrationBoundary>;
}

export default function CreditCardsPage() {
  return <section><PageTitle title="Cartões de crédito" description="Gerencie cartões e contas para pagamento." action={<CreateCreditCardDialog />} /><Suspense fallback={<div className="h-48 animate-pulse rounded-lg bg-slate-200" />}><CardsContent /></Suspense></section>;
}
