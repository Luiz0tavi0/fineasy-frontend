import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getAuthenticatedServerApi } from "@/api/server";
import { requireData } from "@/lib/api-result";
import { formatBRL } from "@/lib/money";
import { formatDateBR } from "@/lib/dates";
import { PageTitle } from "@/components/ui";
import { TransactionRowActions } from "@/features/transactions";

async function TransactionDetail({ id }: Readonly<{ id: number }>) {
  const api = await getAuthenticatedServerApi();
  const [transactionResult, accountsResult, categoriesResult] = await Promise.all([
    api.GET("/transactions/{transaction_id}", { params: { path: { transaction_id: id } } }),
    api.GET("/accounts"),
    api.GET("/categories"),
  ]);
  if (transactionResult.error || !transactionResult.data) notFound();
  const transaction = requireData(transactionResult.data, transactionResult.error, "Transação não encontrada.");
  const accounts = requireData(accountsResult.data, accountsResult.error, "Não foi possível carregar as contas.");
  const categories = requireData(categoriesResult.data, categoriesResult.error, "Não foi possível carregar as categorias.");
  const account = accounts.find((item) => item.id === transaction.account_id);
  const category = categories.find((item) => item.id === transaction.category_id);
  const statuses = { PENDING: "Pendente", COMPLETED: "Concluída", CANCELLED: "Cancelada" } as const;
  return <div className="max-w-3xl space-y-5"><dl className="grid gap-4 rounded-xl border bg-white p-5 sm:grid-cols-2">
    <div><dt className="text-sm text-slate-500">Descrição</dt><dd className="font-medium">{transaction.description}</dd></div>
    <div><dt className="text-sm text-slate-500">Direção</dt><dd>{transaction.direction === "EXPENSE" ? "Despesa" : "Receita"}</dd></div>
    <div><dt className="text-sm text-slate-500">Vencimento</dt><dd>{formatDateBR(transaction.due_date)}</dd></div>
    <div><dt className="text-sm text-slate-500">Status</dt><dd>{statuses[transaction.status]}</dd></div>
    <div><dt className="text-sm text-slate-500">Conta</dt><dd>{account?.name ?? "—"}</dd></div>
    <div><dt className="text-sm text-slate-500">Categoria</dt><dd>{category?.name ?? "—"}</dd></div>
    <div><dt className="text-sm text-slate-500">Valor estimado</dt><dd>{formatBRL(transaction.estimated_amount)}</dd></div>
    <div><dt className="text-sm text-slate-500">Valor final</dt><dd>{transaction.amount ? formatBRL(transaction.amount) : "—"}</dd></div>
    <div><dt className="text-sm text-slate-500">Data efetiva</dt><dd>{transaction.effective_date ? formatDateBR(transaction.effective_date) : "—"}</dd></div>
    <div><dt className="text-sm text-slate-500">Competência</dt><dd>{transaction.competence ? formatDateBR(transaction.competence) : "—"}</dd></div>
  </dl><TransactionRowActions transaction={transaction} /></div>;
}

export default async function TransactionPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId < 1) notFound();
  return <section><PageTitle title="Detalhe da transação" /><Suspense fallback={<div className="h-64 max-w-3xl animate-pulse rounded-lg bg-slate-200" />}><TransactionDetail id={numericId} /></Suspense></section>;
}
