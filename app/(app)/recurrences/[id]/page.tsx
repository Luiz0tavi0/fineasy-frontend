import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAuthenticatedServerApi } from "@/api/server";
import { requireData } from "@/lib/api-result";
import { formatBRL } from "@/lib/money";
import { PageTitle } from "@/components/ui";

async function RecurrenceDetail({ id }: Readonly<{ id: number }>) {
  const api = await getAuthenticatedServerApi();
  const [ruleResult, accountsResult, categoriesResult] = await Promise.all([
    api.GET("/recurrence-rules/{rule_id}", { params: { path: { rule_id: id } } }),
    api.GET("/accounts"),
    api.GET("/categories"),
  ]);
  if (ruleResult.error || !ruleResult.data) notFound();
  const rule = requireData(ruleResult.data, ruleResult.error, "Recorrência não encontrada.");
  const accounts = requireData(accountsResult.data, accountsResult.error, "Não foi possível carregar as contas.");
  const categories = requireData(categoriesResult.data, categoriesResult.error, "Não foi possível carregar as categorias.");
  return <dl className="grid max-w-2xl gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2">
    <div><dt className="text-sm text-slate-500">Descrição</dt><dd className="font-medium">{rule.description}</dd></div>
    <div><dt className="text-sm text-slate-500">Dia de referência</dt><dd>{rule.anchor_day}</dd></div>
    <div><dt className="text-sm text-slate-500">Valor estimado</dt><dd>{formatBRL(rule.estimated_amount)}</dd></div>
    <div><dt className="text-sm text-slate-500">Valor variável</dt><dd>{rule.variable_amount ? "Sim" : "Não"}</dd></div>
    <div><dt className="text-sm text-slate-500">Conta</dt><dd>{accounts.find((item) => item.id === rule.account_id)?.name ?? "—"}</dd></div>
    <div><dt className="text-sm text-slate-500">Categoria</dt><dd>{categories.find((item) => item.id === rule.category_id)?.name ?? "—"}</dd></div>
  </dl>;
}

export default async function RecurrencePage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) notFound();
  return <section><PageTitle title="Detalhe da recorrência" /><Suspense fallback={<div className="h-48 max-w-2xl animate-pulse rounded-lg bg-slate-200" />}><RecurrenceDetail id={numericId} /></Suspense></section>;
}
