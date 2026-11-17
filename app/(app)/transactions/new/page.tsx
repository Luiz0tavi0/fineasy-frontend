import { Suspense } from "react";
import { connection } from "next/server";
import { getAuthenticatedServerApi } from "@/api/server";
import { requireData } from "@/lib/api-result";
import { PageTitle } from "@/components/ui";
import { TransactionForm } from "@/features/transactions";
import { today } from "@/lib/today";

async function NewTransactionContent() {
  await connection();
  const currentDate = today();
  const api = await getAuthenticatedServerApi();
  const [accountsResult, categoriesResult] = await Promise.all([api.GET("/accounts"), api.GET("/categories")]);
  const accounts = requireData(accountsResult.data, accountsResult.error, "Não foi possível carregar as contas.");
  const categories = requireData(categoriesResult.data, categoriesResult.error, "Não foi possível carregar as categorias.");
  return <TransactionForm accounts={accounts} categories={categories} currentDate={currentDate} />;
}

export default function NewTransactionPage() {
  return <section><PageTitle title="Nova transação" description="Registre uma receita ou despesa." /><Suspense fallback={<div className="h-96 max-w-2xl animate-pulse rounded-lg bg-slate-200" />}><NewTransactionContent /></Suspense></section>;
}
