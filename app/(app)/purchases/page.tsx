import { Suspense } from "react";
import { connection } from "next/server";
import { getAuthenticatedServerApi } from "@/api/server";
import { requireData } from "@/lib/api-result";
import { PageTitle } from "@/components/ui";
import { PurchaseForm } from "@/features/purchases";
import { today } from "@/lib/today";

async function PurchaseContent() {
  await connection();
  const currentDate = today();
  const api = await getAuthenticatedServerApi();
  const [accountsResult, cardsResult, categoriesResult] = await Promise.all([
    api.GET("/accounts"),
    api.GET("/credit-cards"),
    api.GET("/categories"),
  ]);
  return <PurchaseForm
    accounts={requireData(accountsResult.data, accountsResult.error, "Não foi possível carregar as contas.")}
    cards={requireData(cardsResult.data, cardsResult.error, "Não foi possível carregar os cartões.")}
    categories={requireData(categoriesResult.data, categoriesResult.error, "Não foi possível carregar as categorias.")}
    currentDate={currentDate}
  />;
}

export default function PurchasesPage() {
  return <section><PageTitle title="Compras parceladas" description="Simule as parcelas e confirme para criar as transações." /><Suspense fallback={<div className="h-96 max-w-2xl animate-pulse rounded-lg bg-slate-200" />}><PurchaseContent /></Suspense></section>;
}
